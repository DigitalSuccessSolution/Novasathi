const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const redis = require("../config/redis");
const { filterMessage, logRedAlert } = require("../middleware/chatFilter");

let io;

/**
 * NovaSathi Socket Gateway — Production-Grade Real-Time Engine
 * Handles: Messaging, WebRTC Signaling, Per-Minute Billing, Session Management
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
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
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.id },
        include: { expert: { select: { id: true } } }
      });
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Forbidden: Token expired or invalid"));
    }
  });

  // ─── CONNECTION HANDLER ───────────────────────────────────────
  io.on("connection", async (socket) => {
    console.log(`🔌 [SOCKET] Connected: ${socket.user.id} (${socket.user.role})`);
    
    // Track socket for presence
    await redis.setex(`socket:${socket.user.id}`, 3600, socket.id);
    
    // Join dedicated notification room for targeted alerts
    socket.join(`notification:${socket.user.id}`);

    // ─── ROOM MANAGEMENT ──────────────────────────────────────
    socket.on('join_chat', async ({ sessionId }) => {
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
            : (socket.user.name || 'Unknown');

        const callerAvatar = (session.isAnonymous && socket.user.role === 'USER')
            ? null
            : socket.user.avatar;

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

    socket.on('call_response', ({ sessionId, accepted, signal }) => {
      socket.to(sessionId).emit('call_answered', { 
        sessionId, accepted, signal, responderId: socket.user.id 
      });
    });

    socket.on('webrtc_signal', ({ sessionId, signal }) => {
      socket.to(sessionId).emit('webrtc_signal', { signal, from: socket.user.id });
    });

    socket.on('call_end', ({ sessionId }) => {
      io.to(sessionId).emit('call_terminated', { sessionId, by: socket.user.id });
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
      const now = new Date();
      
      try {
        const session = await prisma.chatSession.findUnique({ 
          where: { id: sessionId },
          include: { expert: true }
        });
        
        if (!session || session.status === 'COMPLETED' || session.status === 'TERMINATED') return;

        const startedAt = session.startedAt || session.createdAt;
        const durationMs = now - new Date(startedAt);
        const totalMinutes = Math.ceil(durationMs / 60000);
        const totalAmount = session.isFreeSession ? 0 : totalMinutes * (session.pricePerMinute || 10);
        
        // Only bill what heartbeat hasn't already billed
        const alreadyBilled = session.totalAmount || 0;
        const remainingToBill = Math.max(0, totalAmount - alreadyBilled);

        // Final wallet settlement for partial minute
        if (!session.isFreeSession && remainingToBill > 0) {
          const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
          if (wallet && wallet.balance >= remainingToBill) {
            await prisma.$transaction([
              prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                  balance: { decrement: remainingToBill },
                  totalSpent: { increment: remainingToBill },
                },
              }),
              prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: remainingToBill,
                  type: 'DEDUCTION',
                  status: 'COMPLETED',
                  description: `Final settlement: ${session.type} (${totalMinutes}m)`,
                  chatSessionId: sessionId,
                }
              })
            ]);
          }
        }

        // Close session
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED', endedAt: now, totalAmount, totalMinutes }
        });

        // Only increment totalSessions here (minutes & earnings handled by heartbeat + remaining above)
        if (session.expertId) {
          const alreadyBilledMinutes = session.totalMinutes || 0;
          const remainingMinutes = Math.max(0, totalMinutes - alreadyBilledMinutes);

          await prisma.expert.update({
            where: { id: session.expertId },
            data: {
              totalSessions: { increment: 1 },
              totalMinutes: { increment: remainingMinutes },
              totalEarnings: { increment: session.isFreeSession ? 0 : remainingToBill },
            }
          });
        }

        io.to(sessionId).emit('session_ended', { 
          sessionId, 
          status: 'COMPLETED', 
          endedAt: now,
          totalAmount,
        });

      } catch (err) {
        console.error("❌ [END_SESSION_ERROR]", err.message);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      await redis.del(`socket:${socket.user.id}`);
    });
  });

  // ─── BILLING HEARTBEAT (runs once globally) ─────────────────
  if (!global.billingInterval) {
    global.billingInterval = setInterval(async () => {
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
            } else if (remainingS % 60 === 0) {
              io.to(sess.id).emit('balance_update', { timeLeftSeconds: remainingS });
            }
            continue;
          }

          // ── PAID SESSION PER-MINUTE BILLING ──
          const lastBilled = sess.lastBilledAt || started;
          const secondsSinceLastBill = (now - new Date(lastBilled)) / 1000;

          if (secondsSinceLastBill >= 60) {
            // Re-verify status to prevent billing a just-ended session
            const currentSess = await prisma.chatSession.findUnique({ 
              where: { id: sess.id },
              select: { status: true, pricePerMinute: true }
            });
            
            if (!currentSess || currentSess.status !== 'ACTIVE') {
              global.roomEmptyCheck.delete(sess.id);
              continue;
            }

            const price = currentSess.pricePerMinute || 10;
            const wallet = sess.user.wallet;

            if (!wallet || wallet.balance < price) {
              await prisma.chatSession.update({
                where: { id: sess.id },
                data: { status: 'TERMINATED', endedAt: now }
              });
              io.to(sess.id).emit('force_disconnect', { reason: 'balance_exhausted', message: 'Wallet balance exhausted.' });
            } else {
              // Atomic per-minute billing
              await prisma.$transaction([
                prisma.wallet.update({
                  where: { id: wallet.id },
                  data: { balance: { decrement: price }, totalSpent: { increment: price } }
                }),
                prisma.chatSession.update({
                  where: { id: sess.id },
                  data: { lastBilledAt: now, totalAmount: { increment: price }, totalMinutes: { increment: 1 } }
                }),
                prisma.expert.update({
                  where: { id: sess.expertId },
                  data: { 
                    totalEarnings: { increment: price },
                    totalMinutes: { increment: 1 }
                  }
                }),
                prisma.walletTransaction.create({
                  data: {
                    walletId: wallet.id,
                    amount: price,
                    type: 'DEDUCTION',
                    status: 'COMPLETED',
                    description: `1 min consultation (${sess.type})`,
                    chatSessionId: sess.id,
                  }
                })
              ]);
              
              const newBalance = wallet.balance - price;
              io.to(sess.id).emit('balance_update', { 
                newBalance,
                timeLeftSeconds: Math.floor(newBalance / price * 60)
              });

              io.to(`portal:${sess.expertId}`).emit('earnings_update', { 
                amount: price,
                sessionId: sess.id 
              });
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

module.exports = { initializeSocket, getIO };
