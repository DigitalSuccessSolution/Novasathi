const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const redis = require("../config/redis");
const { filterMessage, logRedAlert } = require("../middleware/chatFilter");
const ChatService = require("../modules/chat/chat.service");

let io;

/**
 * NovaSathi Socket Gateway — Production-Grade Real-Time Engine
 * Handles: Messaging, WebRTC Signaling, Per-Minute Billing, Session Management
 */
const broadcastExpertStatus = async (expertId, status) => {
  if (!io) return;
  io.emit('expert_status_update', { expertId, status });
  console.log(`📡 [STATUS_BROADCAST] Expert ${expertId} is now ${status}`);
};
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.CLIENT_URL,
          "http://localhost:5173",
          "http://localhost:3000"
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── AUTHENTICATION MIDDLEWARE ────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        // Allow anonymous connection for marketplace updates
        socket.user = { role: 'GUEST' };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.id },
        include: { expert: { select: { id: true, displayName: true, profileImage: true } } }
      });
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      // Fallback to GUEST on invalid token instead of closing connection
      socket.user = { role: 'GUEST' };
      next();
    }
  });

  // ─── CONNECTION HANDLER ───────────────────────────────────────
  io.on("connection", async (socket) => {
    console.log(`🔌 [SOCKET] Connected: ${socket.user.id || 'Guest'} (${socket.user.role})`);
    
    // Track socket for presence (Only for logged in users)
    if (socket.user.id) {
      await redis.setex(`socket:${socket.user.id}`, 3600, socket.id);
    }
    
    // Expert Presence logic
    if (socket.user.role === 'EXPERT' && socket.user.expert?.id) {
      const expertId = socket.user.expert.id;
      
      // Check if expert has any active or waiting sessions
      const activeSession = await prisma.chatSession.findFirst({
        where: {
          expertId,
          status: { in: ['ACTIVE', 'WAITING'] }
        }
      });

      if (activeSession) {
        // If they have an active session, ensure they are marked as busy
        await prisma.expert.update({
          where: { id: expertId },
          data: { onlineStatus: 'busy', isOnline: true }
        });
        broadcastExpertStatus(expertId, 'busy');
      } else {
        // Otherwise, mark as available
        await prisma.expert.update({
          where: { id: expertId },
          data: { onlineStatus: 'available', isOnline: true }
        });
        broadcastExpertStatus(expertId, 'available');
      }
    }
    
    // Join dedicated notification room for targeted alerts
    if (socket.user.id) {
      socket.join(`notification:${socket.user.id}`);
    }

    // ─── ROOM MANAGEMENT ──────────────────────────────────────
    socket.on('join_chat', async ({ sessionId }) => {
      if (socket.user.role === 'GUEST') return socket.emit('error', { message: 'Login required' });
      const session = await prisma.chatSession.findUnique({ 
        where: { id: sessionId },
        include: { user: true, expert: true, counselor: true }
      });
      
      if (!session) return socket.emit('error', { message: 'Session not found' });
      if (session.status === 'COMPLETED' || session.status === 'TERMINATED') {
        return socket.emit('error', { message: 'Session already ended' });
      }

      await socket.join(sessionId);

      const sockets = await io.in(sessionId).fetchSockets();
      const roomSize = sockets.length;

      // Auto-start session if both parties present
      if (roomSize >= 2 && session.status === 'WAITING') {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { status: 'ACTIVE', startedAt: new Date() },
        });

        // Mark expert as busy
        await prisma.expert.update({
          where: { id: session.expertId },
          data: { onlineStatus: 'busy', isOnline: true }
        });
        broadcastExpertStatus(session.expertId, 'busy');
      }
      
      if (roomSize >= 2) {
        let timerSeconds = 0;
        const now = new Date();
        const started = session.startedAt || now;
        const elapsed = Math.floor((now - new Date(started)) / 1000);

        if (session.isFreeSession) {
          timerSeconds = Math.max(0, 600 - elapsed);
        } else {
          const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
          const price = session.pricePerMinute || 10;
          const totalAvailableSeconds = Math.floor((wallet?.balance || 0) / price * 60);
          timerSeconds = Math.max(0, totalAvailableSeconds - elapsed);
        }

        io.to(sessionId).emit('session_started', { 
          sessionId,
          status: 'ACTIVE',
          isFreeSession: session.isFreeSession,
          isAnonymous: session.isAnonymous,
          timerSeconds
        });
      } else {
        socket.emit('session_waiting', { message: 'Waiting for partner to join...' });
      }
    });

    socket.on('leave_chat', async ({ sessionId }) => {
      await socket.leave(sessionId);
    });

    socket.on('join_portal', (portalId) => {
      socket.join(`portal:${portalId}`);
    });

    socket.on('typing_status', ({ sessionId, isTyping }) => {
      socket.to(sessionId).emit('typing_status', { 
        sessionId, userId: socket.user.id, name: socket.user.name, isTyping 
      });
    });

    // ─── MESSAGING (SRS §6.1 — Anti-Leakage Filter Applied) ──
    socket.on('send_message', async (data) => {
      try {
        const { sessionId, content, messageType = 'TEXT', tempId, overrideSenderId } = data;
        
        const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
        if (!session || (session.status !== 'ACTIVE' && session.status !== 'WAITING')) {
          return socket.emit('error', { message: 'Session not available for messaging' });
        }

        // Admin "behalf-of" spoofing — fully audited
        let finalSenderId = socket.user.id;
        let adminInterventionId = null;

        if (overrideSenderId && socket.user.role === 'ADMIN') {
          finalSenderId = overrideSenderId;
          adminInterventionId = socket.user.id;
        }

        // ─── SRS §6.1 — Anti-Leakage Filter ─────────────────────
        let finalContent = content;
        let isFiltered = false;

        if (messageType === 'TEXT' && socket.user.role !== 'ADMIN') {
          const filterResult = filterMessage(content);
          finalContent = filterResult.sanitized;
          isFiltered = filterResult.isFiltered;

          if (isFiltered) {
            // Log Red Alert to admin (SRS §9.6)
            logRedAlert({
              userId: socket.user.id,
              sessionId,
              originalContent: content,
              matchedPatterns: filterResult.matchedPatterns,
            });
          }
        }

        const message = await prisma.chatMessage.create({
          data: {
            sessionId,
            senderId: finalSenderId,
            content: finalContent,
            messageType,
            adminInterventionId,
            isFiltered,
          },
          include: { sender: { select: { name: true, avatar: true, role: true } } }
        });

        const broadcastData = {
          id: message.id,
          sessionId,
          senderId: finalSenderId,
          content: finalContent,
          messageType,
          tempId,
          createdAt: message.createdAt,
          adminInterventionId,
          isFiltered,
          sender: (session.isAnonymous && message.sender.role === 'USER') 
                  ? { name: 'Anonymous Soul', avatar: null, role: 'USER' }
                  : message.sender
        };

        io.to(sessionId).emit('new_message', broadcastData);
      } catch (err) {
        console.error("🔥 [SEND_MESSAGE_ERROR]:", err);
        socket.emit('error', { message: 'Failed to send message. Please try again.' });
      }
    });

    // ─── WEBRTC CALLING ───────────────────────────────────────
    socket.on('call_initiate', async ({ sessionId, type }) => {
      try {
        const session = await prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { user: { select: { name: true } } }
        });
        if (!session) return;

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { type: type === 'video' ? 'VIDEO' : 'CALL' }
        });

        const callerName = (session.isAnonymous && socket.user.role === 'USER')
            ? 'Anonymous Soul'
            : (socket.user.expert?.displayName || socket.user.name || 'Unknown');

        const callerAvatar = (session.isAnonymous && socket.user.role === 'USER')
            ? null
            : (socket.user.expert?.profileImage || socket.user.avatar);

        const incomingData = { 
          sessionId, 
          callerId: socket.user.id, 
          callerName,
          callerAvatar,
          type 
        };

        socket.to(sessionId).emit('incoming_call', incomingData);

        if (session.expertId) {
          io.to(`portal:${session.expertId}`).emit('incoming_call', incomingData);
        }
      } catch (err) {
        console.error("❌ [CALL_INITIATE_ERROR]", err.message);
      }
    });

    socket.on('call_response', async ({ sessionId, accepted, signal }) => {
      const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      
      if (accepted) {
        console.log(`✅ [CALL_ACCEPT] Session ${sessionId} accepted. Marking ACTIVE and BUSY.`);
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { status: 'ACTIVE', startedAt: new Date() }
        });

        if (session && session.expertId) {
          await prisma.expert.update({
            where: { id: session.expertId },
            data: { onlineStatus: 'busy', isOnline: true }
          });
          broadcastExpertStatus(session.expertId, 'busy');
        }
      } else {
        // If rejected, mark session as terminated and RELEASE EXPERT
        console.log(`🚫 [CALL_REJECT] Session ${sessionId} rejected. Releasing expert.`);
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { status: 'TERMINATED', endedAt: new Date() }
        });

        if (session && session.expertId) {
          await prisma.expert.update({
            where: { id: session.expertId },
            data: { onlineStatus: 'available', isOnline: true }
          });
          broadcastExpertStatus(session.expertId, 'available');
        }
      }

      socket.to(sessionId).emit('call_answered', { 
        sessionId, accepted, signal, responderId: socket.user.id 
      });
    });

    socket.on('webrtc_signal', ({ sessionId, signal }) => {
      socket.to(sessionId).emit('webrtc_signal', { signal, from: socket.user.id });
    });

    socket.on('call_end', async ({ sessionId }) => {
      try {
        console.log(`📞 [CALL_END] Session ${sessionId} ended by ${socket.user.id}`);
        
        // Notify participants first for immediate UI feedback
        io.to(sessionId).emit('call_terminated', { sessionId, by: socket.user.id });

        // End the session in database and release expert
        const updatedSession = await ChatService.endSession(sessionId);
        if (updatedSession?.expertId) {
          await prisma.expert.update({
            where: { id: updatedSession.expertId },
            data: { onlineStatus: 'available', isOnline: true }
          });
          broadcastExpertStatus(updatedSession.expertId, 'available');
        }

        // Notify session closure
        io.to(sessionId).emit('session_ended', { 
          sessionId, 
          status: 'COMPLETED',
          endedAt: new Date()
        });
      } catch (err) {
        console.error("❌ [CALL_END_ERROR]", err.message);
      }
    });

    // ─── MESSAGE UTILITIES ────────────────────────────────────
    socket.on('edit_message', async (data) => {
      const { messageId, newContent } = data;
      const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
      if (!msg || msg.senderId !== socket.user.id) return;
      
      const elapsed = new Date() - new Date(msg.createdAt);
      if (elapsed > 5 * 60 * 1000) return socket.emit('error', { message: 'Edit window expired (5 mins)' });

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { content: newContent, isEdited: true },
      });
      io.to(msg.sessionId).emit('message_edited', {
        id: messageId,
        content: newContent,
        isEdited: true
      });
    });

    socket.on('typing', ({ sessionId }) => socket.to(sessionId).emit('partner_typing'));
    socket.on('stop_typing', ({ sessionId }) => socket.to(sessionId).emit('partner_stop_typing'));

    socket.on('mark_read', async ({ sessionId }) => {
      await prisma.chatMessage.updateMany({
        where: { sessionId, senderId: { not: socket.user.id }, isRead: false },
        data: { isRead: true }
      });
      socket.to(sessionId).emit('messages_read', { sessionId });
    });

    // ─── MANUAL SESSION END ───────────────────────────────────
    socket.on('end_session', async ({ sessionId }) => {
      try {
        // Delegate to centralized ChatService (single source of truth for billing & settlement)
        const updatedSession = await ChatService.endSession(sessionId);
        
        if (!updatedSession || updatedSession.status === 'COMPLETED' || updatedSession.status === 'TERMINATED') {
          io.to(sessionId).emit('session_ended', { 
            sessionId, 
            status: updatedSession?.status || 'COMPLETED', 
            endedAt: updatedSession?.endedAt || new Date(),
            totalAmount: updatedSession?.totalAmount || 0,
          });
        }

        // Release expert status via broadcast (actual DB update handled in ChatService)
        if (updatedSession?.expertId) {
          broadcastExpertStatus(updatedSession.expertId, 'available');
        }
      } catch (err) {
        console.error("❌ [END_SESSION_ERROR]", err.message);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      if (socket.user.id) {
        await redis.del(`socket:${socket.user.id}`);
        
        // If they were in an active session, notify the partner immediately
        const activeSess = await prisma.chatSession.findFirst({
          where: {
            OR: [
              { userId: socket.user.id },
              { expertId: socket.user.expert?.id || '' }
            ],
            status: { in: ['ACTIVE', 'WAITING'] }
          }
        });

        if (activeSess) {
          console.log(`⚠️ [DISCONNECT] Partner left active session: ${activeSess.id}`);
          io.to(activeSess.id).emit('partner_disconnected', { 
            userId: socket.user.id,
            role: socket.user.role 
          });

          // If seeker leaves during an active call, we might want to end it after a timeout
          // For now, the heartbeat will handle roomSize === 0, but we could add a roomSize === 1 timeout here
        }
      }
      
      // Expert Offline logic
      if (socket.user.role === 'EXPERT' && socket.user.expert?.id) {
        const expertId = socket.user.expert.id;
        
        // Wait a bit before marking offline to handle refreshes/flaky connections
        setTimeout(async () => {
          const isStillConnected = await redis.get(`socket:${socket.user.id}`);
          if (!isStillConnected) {
            const currentExpert = await prisma.expert.findUnique({ where: { id: expertId } });
            
            if (currentExpert) {
                // If they were busy, we check if they STILL have active sessions
                // If not, we definitely mark them offline
                const activeSession = await prisma.chatSession.findFirst({
                  where: {
                    expertId,
                    status: { in: ['ACTIVE', 'WAITING'] }
                  }
                });

                if (!activeSession) {
                  await prisma.expert.update({
                    where: { id: expertId },
                    data: { onlineStatus: 'offline', isOnline: false }
                  });
                  broadcastExpertStatus(expertId, 'offline');
                } else {
                  // Keep them busy but mark offline (they might reconnect)
                  await prisma.expert.update({
                    where: { id: expertId },
                    data: { isOnline: false }
                  });
                  broadcastExpertStatus(expertId, 'offline');
                }
            }
          }
        }, 5000);
      }
    });
  });

  // ─── BILLING HEARTBEAT (runs once globally across instances) ───────
  if (!global.billingInterval) {
    global.billingInterval = setInterval(async () => {
      // 🚨 SCALABILITY PROTECTOR: Acquire distributed lock for 10s
      // This prevents multiple server instances from billing the same sessions simultaneously.
      const lockKey = "novasathi:billing:lock";
      const lockAcquired = await redis.set(lockKey, "locked", "NX", "EX", 10);
      
      if (!lockAcquired) return; // Another instance is already billing
      
      try {
        const activeSessions = await prisma.chatSession.findMany({
          where: { status: 'ACTIVE' },
          include: { user: { include: { wallet: true } } }
        });

        if (!global.roomEmptyCheck) global.roomEmptyCheck = new Map();

        for (const sess of activeSessions) {
          const roomSockets = await io.in(sess.id).fetchSockets();
          const roomSize = roomSockets.length;

          // Auto-cleanup empty rooms after ~45s
          if (roomSize === 0) {
            const count = (global.roomEmptyCheck.get(sess.id) || 0) + 1;
            global.roomEmptyCheck.set(sess.id, count);
            
            if (count >= 3) {
              await prisma.chatSession.update({
                where: { id: sess.id },
                data: { status: 'TERMINATED', endedAt: new Date() }
              });

              // Release Expert in DB and Broadcast
              if (sess.expertId) {
                await prisma.expert.update({
                  where: { id: sess.expertId },
                  data: { onlineStatus: 'available', isOnline: true }
                });
                broadcastExpertStatus(sess.expertId, 'available');
              }

              io.to(sess.id).emit('force_disconnect', { message: 'Session closed due to inactivity.' });
              global.roomEmptyCheck.delete(sess.id);
            }
            continue;
          }
          
          global.roomEmptyCheck.delete(sess.id);

          const now = new Date();
          const started = sess.startedAt || sess.createdAt;
          const elapsedMs = now - new Date(started);

          // ── FREE SESSION TIMEOUT ──
          if (sess.isFreeSession) {
            const limitS = 600;
            const remainingS = Math.floor(limitS - (elapsedMs / 1000));

            if (remainingS <= 0) {
              await prisma.chatSession.update({
                where: { id: sess.id },
                data: { status: 'TERMINATED', endedAt: now }
              });
              io.to(sess.id).emit('force_disconnect', { reason: 'timeout', message: 'Free session limit reached.' });
              
              // Broadcast expert release
              if (sess.expertId) broadcastExpertStatus(sess.expertId, 'available');
            } else if (remainingS % 60 === 0) {
              io.to(sess.id).emit('balance_update', { timeLeftSeconds: remainingS });
            }
            continue;
          }

          // ── PAID SESSION PER-MINUTE BILLING ──
          const lastBilled = sess.lastBilledAt || started;
          const secondsSinceLastBill = (now - new Date(lastBilled)) / 1000;

          if (secondsSinceLastBill >= 60) {
            const result = await ChatService.billSessionMinute(sess.id);
            
            if (result === null) {
              // Session not found or not ACTIVE — skip
              continue;
            } else if (result.status === 'TERMINATED') {
              // billSessionMinute returns updated session with status TERMINATED when balance insufficient
              io.to(sess.id).emit('force_disconnect', { 
                reason: 'balance_exhausted', 
                message: 'Wallet balance exhausted.' 
              });
              
              // Broadcast expert release
              if (sess.expertId) broadcastExpertStatus(sess.expertId, 'available');
            } else if (Array.isArray(result)) {
              // Successfully billed a minute — result is a Prisma $transaction array
              // Get updated balances to broadcast
              const [updatedUserWallet, partnerWallet] = await Promise.all([
                prisma.wallet.findUnique({ where: { userId: sess.userId } }),
                sess.expertId 
                  ? prisma.wallet.findFirst({ where: { user: { expert: { id: sess.expertId } } } })
                  : sess.counselorId
                    ? prisma.wallet.findFirst({ where: { user: { counselor: { id: sess.counselorId } } } })
                    : null
              ]);

              const price = sess.pricePerMinute || 10;
              
              // 1. Notify Room (Both see updated time left + their respective balances)
              io.to(sess.id).emit('balance_update', { 
                newBalance: updatedUserWallet?.balance, // Seeker balance
                expertBalance: partnerWallet?.balance, // Expert/Counselor balance
                timeLeftSeconds: updatedUserWallet ? Math.floor(updatedUserWallet.balance / price * 60) : 0
              });

              // 2. Notify Expert/Counselor specifically (earnings update for portal)
              const partnerId = sess.expertId || sess.counselorId;
              if (partnerId) {
                const earningsData = { 
                  amount: price,
                  newTotalBalance: partnerWallet?.balance,
                  sessionId: sess.id 
                };
                io.to(`portal:${partnerId}`).emit('earnings_update', earningsData);
                // Also emit to session room so expert in chat screen gets it
                io.to(sess.id).emit('earnings_update', earningsData);
              }
            }
          }
        }
      } catch (err) {
        console.error("🔥 [HEARTBEAT_ERROR]:", err.message);
      }
    }, 15000);
  }

  return io;
}

const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

module.exports = { initializeSocket, getIO, broadcastExpertStatus };
