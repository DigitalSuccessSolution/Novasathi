const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');
const ChatService = require('./chat.service');

/**
 * Submit pre-chat intake data (SRS §3.1)
 */
exports.submitIntake = catchAsync(async (req, res, next) => {
  const { expertId, name, dob, tob, city, concern, isRandom } = req.body;

  if (!name || !dob || !city || !concern) {
    return next(new AppError('Please provide all mandatory intake fields.', 400));
  }

  // Mandatory TOB for Astro Experts (simplified check: if it's not a generic listener)
  let expert = null;
  if (expertId) {
    expert = await prisma.expert.findUnique({ where: { id: expertId } });
    if (expert && !expert.isListener && !tob) {
      return next(new AppError('Time of Birth is mandatory for Astrological consultations.', 400));
    }
  }

  // Create a pending session record to link the intake
  const session = await prisma.chatSession.create({
    data: {
      userId: req.user.id,
      expertId: expertId || null,
      status: 'WAITING',
      intakeData: { name, dob, tob, city, concern, isRandom: !!isRandom },
    }
  });

  res.status(201).json(new ApiResponse(201, {
    sessionId: session.id,
    intakeData: session.intakeData
  }, 'Intake form submitted successfully.'));
});

/**
 * Start a chat session with an expert (paid/free gift)
 */
exports.startSession = catchAsync(async (req, res, next) => {
  const { expertId, sessionId, isRandom, type = 'CHAT' } = req.body;

  let finalExpertId = expertId;
  let intakeData = null;

  // If we have a pre-created intake session, use its data
  if (sessionId) {
    const prevSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (prevSession && prevSession.userId === req.user.id) {
      intakeData = prevSession.intakeData;
      if (!finalExpertId) finalExpertId = prevSession.expertId;
      // Delete the temporary WAITING session to avoid duplicates
      await prisma.chatSession.delete({ where: { id: sessionId } });
    }
  }

  // Handle Random Expert Logic (10 min free gift)
  if (!finalExpertId && isRandom) {
    const onlineExperts = await prisma.expert.findMany({
      where: { isOnline: true, status: 'APPROVED' },
      take: 10
    });
    if (onlineExperts.length === 0) return next(new AppError('No online experts found for random match.', 503));
    const randomExpert = onlineExperts[Math.floor(Math.random() * onlineExperts.length)];
    finalExpertId = randomExpert.id;
  }

  if (!finalExpertId) return next(new AppError('Expert ID is required.', 400));

  const expert = await prisma.expert.findUnique({
    where: { id: finalExpertId },
    include: { user: { select: { name: true, avatar: true } } },
  });

  if (!expert || expert.status !== 'APPROVED') {
    return next(new AppError('Expert not available', 404));
  }

  // ─── START SRS §3.2: Freemium Allocation Engine ───
  let isFreeSession = false;
  let freeMinutesLimit = 0;
  
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id },
    include: { 
      freeAllocations: { orderBy: { allocDate: 'desc' }, take: 1 },
      wallet: true
    }
  });

  const adminSettings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  const resetType = adminSettings?.freeMinutesResetType || 'one_time';
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalized date for today

  if (isRandom) {
    // SRS: Random expert matching always grants 10 free minutes (SOS/Gift)
    isFreeSession = true;
    freeMinutesLimit = 10;
  } else if (user.isEarlyBird) {
    // CONDITION 1: EARLY BIRD (SRS §3.2 Core)
    // Partitioned 5 chat / 5 call. Daily reset at 00:00 IST.
    let alloc = user.freeAllocations[0];
    const isNewDay = !alloc || new Date(alloc.allocDate).getTime() < today.getTime();
    
    if (isNewDay) {
      alloc = await prisma.freeAllocation.create({
        data: {
          userId: user.id,
          allocDate: today,
          chatMinutesTotal: 5,
          callMinutesTotal: 5
        }
      });
    }

    const mType = type.toUpperCase();
    if (mType === 'CHAT' && (alloc.chatMinutesTotal - alloc.chatMinutesUsed) > 0) {
      isFreeSession = true;
      freeMinutesLimit = alloc.chatMinutesTotal - alloc.chatMinutesUsed;
    } else if ((mType === 'CALL' || mType === 'VIDEO') && (alloc.callMinutesTotal - alloc.callMinutesUsed) > 0) {
      isFreeSession = true;
      freeMinutesLimit = alloc.callMinutesTotal - alloc.callMinutesUsed;
    }
  } else {
    // CONDITION 2: GENERAL / NEW USER (SRS §3.2 Core)
    const canUseBonus = resetType === 'daily' 
      ? (!user.lastFreeReset || new Date(user.lastFreeReset).getTime() < today.getTime())
      : !user.signupBonusUsed;

    if (canUseBonus) {
      isFreeSession = true;
      freeMinutesLimit = 5; // Shared 5 min across chat + call
      
      const updateData = { lastFreeReset: new Date() };
      if (resetType === 'one_time') updateData.signupBonusUsed = true;
      
      await prisma.user.update({ where: { id: req.user.id }, data: updateData });
    }
  }

  // ─── END SRS §3.2 Logic ───

  // SRS §3.3: Zero-Balance Override Rule
  const requiredBalance = expert.pricePerMinute * 2;
  if (!isFreeSession && (!user.wallet || user.wallet.balance < requiredBalance)) {
    return next(new AppError(`Low balance! You need at least ₹${requiredBalance} for a paid ritual.`, 402));
  }

  // Check if expert is already busy
  const busySession = await prisma.chatSession.findFirst({
    where: {
      expertId: finalExpertId,
      status: { in: ['ACTIVE', 'WAITING'] }
    }
  });

  if (busySession) {
    return next(new AppError("Expert is currently busy with another ritual. Please try again in a few minutes.", 409));
  }

  const session = await prisma.chatSession.create({
    data: {
      userId: req.user.id,
      expertId: finalExpertId,
      type: type.toUpperCase(),
      status: 'WAITING',
      pricePerMinute: expert.pricePerMinute,
      isFreeSession,
      freeMinutesUsed: 0, // Tracker
      intakeData: intakeData,
    },
    include: {
      expert: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      user: { select: { name: true, avatar: true, phone: true } }
    },
  });

  // Mark expert as busy immediately (Ringing phase)
  await prisma.expert.update({
    where: { id: finalExpertId },
    data: { onlineStatus: 'busy', isOnline: true }
  });

  // Notify Expert (Unified Ritual Panel) and Broadcast Status
  try {
    const { getIO, broadcastExpertStatus } = require('../../socket');
    const io = getIO();
    
    // Broadcast status to marketplace
    if (broadcastExpertStatus) {
        broadcastExpertStatus(finalExpertId, 'busy');
    }

    // Trigger high-priority expert ringing panel for ALL types
    io.to(`portal:${finalExpertId}`).emit('incoming_call', {
      sessionId: session.id,
      callerId: req.user.id,
      callerName: (session.isAnonymous) ? 'Anonymous Soul' : (session.user?.name || 'Visitor'),
      callerAvatar: (session.isAnonymous) ? null : session.user?.avatar,
      type: session.type.toLowerCase(), // chat, audio, or video
      intakeData: session.intakeData
    });
  } catch (err) {
    console.error("❌ [SOCKET_NOTIFY_ERROR]", err.message);
  }

  res.status(201).json(new ApiResponse(201, {
    session,
    isFreeSession,
    freeMinutesLimit,
    walletBalance: user.wallet?.balance || 0,
  }, 'Session created.'));
});

/**
 * Get active session details
 */
exports.getSession = catchAsync(async (req, res, next) => {
  const session = await prisma.chatSession.findUnique({
    where: { id: req.params.sessionId },
    include: {
      user: { select: { name: true, avatar: true, phone: true } },
      expert: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      counselor: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      messages: { 
        where: { NOT: { hiddenForId: { has: req.user.id } } },
        orderBy: { createdAt: 'asc' } 
      },
    },
  });

  if (!session) return next(new AppError('Session not found', 404));

  // Restrict access if locked and not the owner or admin
  if (session.isLocked && session.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('This session is locked. Unlock to view.', 403));
  }

  // Fetch wallet for seeker to show timer
  let walletBalance = null;
  if (req.user.id === session.userId) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    walletBalance = wallet?.balance || 0;
  }

  res.status(200).json(new ApiResponse(200, { ...session, walletBalance }));
});

/**
 * Expert: Accept a pending ritual request (Chat/Audio/Video)
 */
exports.acceptSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  
  if (!session) return next(new AppError('Session not found', 404));
  
  // Update status to ACTIVE
  // Update status to ACTIVE
  const updatedSession = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'ACTIVE', startedAt: new Date() }
  });

  // Mark expert as busy
  await prisma.expert.update({
    where: { id: session.expertId },
    data: { onlineStatus: 'busy' }
  });

  // Notify Seeker via Socket that Expert has accepted
  try {
    const { getIO } = require('../../socket');
    const io = getIO();
    io.to(session.userId).emit('call_response', { sessionId, accepted: true });
  } catch (err) {
    console.error("❌ [SOCKET_NOTIFY_ERROR]", err.message);
  }

  // Fetch full session with relations for consistent frontend metadata
  const sessionWithDetails = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, avatar: true } },
      expert: { include: { user: { select: { name: true, avatar: true } } } }
    }
  });

  res.status(200).json(new ApiResponse(200, sessionWithDetails, 'Ritual accepted successfully.'));
});

/**
 * End a session (called by either party or by auto-timer)
 * NOTE: The billing heartbeat handles per-minute deductions during the session.
 * This endpoint only handles the FINAL partial-minute settlement.
 */
exports.endSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const updatedSession = await ChatService.endSession(sessionId);
  if (!updatedSession) return next(new AppError('Session not found', 404));

  const totalMinutes = updatedSession.totalMinutes;

  // Update free minutes used tracking (SRS §3.4)
  if (updatedSession.isFreeSession) {
    await prisma.user.update({
      where: { id: updatedSession.userId },
      data: { freeMinutesUsed: { increment: totalMinutes } },
    });

    // If Early Bird, update the specific allocation record for the day
    const user = await prisma.user.findUnique({ where: { id: updatedSession.userId } });
    if (user?.isEarlyBird) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const sessionType = updatedSession.type === 'CHAT' ? 'chatMinutesUsed' : 'callMinutesUsed';
      
      await prisma.freeAllocation.updateMany({
        where: { userId: user.id, allocDate: today },
        data: { [sessionType]: { increment: totalMinutes } }
      });
    }
  }

  // Notify both parties via socket
  try {
    const { getIO } = require('../../socket/index');
    const io = getIO();
    io.to(sessionId).emit('session_ended', { 
      sessionId, 
      status: updatedSession.status,
      endedAt: updatedSession.endedAt,
      totalAmount: updatedSession.totalAmount
    });
  } catch (err) {
    console.error("🌌 [SOCKET_BROADCAST_ERROR]", err.message);
  }

  res.status(200).json(new ApiResponse(200, updatedSession, 'Session ended'));
});

/**
 * Get messages for a session (with proper RBAC)
 */
exports.getMessages = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const session = await prisma.chatSession.findUnique({ 
    where: { id: sessionId },
    include: { expert: { select: { id: true, userId: true } } }
  });
  if (!session) return next(new AppError('Session not found', 404));

  // RBAC: Only participants and admins can access messages
  const isSeeker = session.userId === req.user.id;
  const isExpert = session.expert?.userId === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isSeeker && !isExpert && !isAdmin) {
    return next(new AppError('Unauthorized access to this session', 403));
  }

  if (session.isLocked && isSeeker) {
    return res.status(200).json(new ApiResponse(200, {
      messages: [],
      isLocked: true,
      unlockMessage: 'Unlock this session to view your conversation history.',
    }));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { 
        sessionId,
        NOT: { hiddenForId: { has: req.user.id } }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: parseInt(limit),
      include: { sender: { select: { name: true, avatar: true, role: true } } },
    }),
    prisma.chatMessage.count({ where: { sessionId } })
  ]);

  const processedMessages = messages.map(msg => {
    if (session.isAnonymous && msg.sender.role === 'USER' && req.user.id !== msg.senderId && !isAdmin) {
      return {
        ...msg,
        sender: { ...msg.sender, name: 'Anonymous Soul', avatar: null }
      };
    }
    return msg;
  });

  res.status(200).json(new ApiResponse(200, { 
    messages: processedMessages, 
    isLocked: false,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  }));
});

/**
 * Get all user sessions for history (with limited messages for sidebar preview)
 */
exports.getUserSessions = catchAsync(async (req, res) => {
  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      expert: { include: { user: { select: { name: true, avatar: true } } } },
      counselor: { include: { user: { select: { name: true, avatar: true } } } },
      messages: { 
        where: { NOT: { hiddenForId: { has: req.user.id } } },
        orderBy: { createdAt: 'desc' },
        take: 1  // Only last message for sidebar preview
      },
    },
  });
  res.status(200).json(new ApiResponse(200, sessions));
});

/**
 * Admin: Get all sessions across the platform (paginated)
 */
exports.getAllSessions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = status ? { status: status.toUpperCase() } : {};

  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { name: true, avatar: true, phone: true } },
        expert: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
        counselor: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
        messages: { 
          orderBy: { createdAt: 'desc' },
          take: 1
        },
      },
    }),
    prisma.chatSession.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, { sessions, pagination: { page: parseInt(page), limit: parseInt(limit), total } }));
});

/**
 * Upload chat image to sanctuary persistent storage
 */
exports.uploadChatImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image provided.', 400));
  }

  res.status(200).json(new ApiResponse(200, {
    url: req.file.path,
    public_id: req.file.filename
  }, 'Image uploaded successfully.'));
});

/**
 * Clear Sanctuary - Hidden Whispers Ritual
 */
exports.clearChat = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  await prisma.$executeRaw`
    UPDATE "ChatMessage" 
    SET "hiddenForId" = array_append("hiddenForId", ${userId}) 
    WHERE "sessionId" = ${sessionId} 
    AND NOT (${userId} = ANY("hiddenForId"))
  `;

  res.status(200).json(new ApiResponse(200, null, 'Chat cleared successfully.'));
});

/**
 * Toggle Anonymous Mode for Session
 */
exports.updatePrivacy = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { isAnonymous } = req.body;

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return next(new AppError('Session not found', 404));
  if (session.userId !== req.user.id) return next(new AppError('Unauthorized', 403));

  const updatedSession = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { isAnonymous },
  });

  res.status(200).json(new ApiResponse(200, updatedSession, `Anonymous mode ${isAnonymous ? 'enabled' : 'disabled'}`));
});
