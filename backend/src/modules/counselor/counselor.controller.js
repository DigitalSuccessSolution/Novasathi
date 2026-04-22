const prisma = require('../../config/prisma');
const redis = require('../../config/redis');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Connect to a random online counselor (Dil Ki Baat / SOS Feature)
 * - Checks daily free minutes
 * - Random routing — user cannot pick
 * - Creates a session with isFreeSession=true, isLocked=true
 */
exports.connectRandom = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // 1. Check daily free minutes
  const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  const dailyFreeLimit = settings?.freeMinutesDailySOS || 10;

  // Check if user's free minutes need to be reset (new day)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const lastReset = new Date(user.lastFreeReset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let freeMinutesUsed = user.freeMinutesUsed;
  if (lastReset < today) {
    // New day — reset counter
    await prisma.user.update({
      where: { id: userId },
      data: { freeMinutesUsed: 0, lastFreeReset: new Date() },
    });
    freeMinutesUsed = 0;
  }

  if (freeMinutesUsed >= dailyFreeLimit) {
    return next(new AppError(`You've used all ${dailyFreeLimit} free minutes today. Upgrade to Premium to continue.`, 403));
  }

  const remainingMinutes = dailyFreeLimit - freeMinutesUsed;

  // 2. Find a random online counselor
  let counselorId = await redis.srandmember('online:counselors');

  if (!counselorId) {
    // Fallback: query DB for any online counselor
    const onlineCounselor = await prisma.counselor.findFirst({
      where: { isOnline: true, isApproved: true },
      orderBy: { totalSessions: 'asc' }, // least busy gets priority
    });

    if (!onlineCounselor) {
      return next(new AppError('No counselors are available right now. Please try again shortly.', 503));
    }
    counselorId = onlineCounselor.id;
  }

  // 3. Create the chat session
  const session = await prisma.chatSession.create({
    data: {
      userId,
      counselorId,
      type: 'CHAT',
      status: 'WAITING',
      pricePerMinute: 0,  // free session
      isFreeSession: true,
      isLocked: true,      // Will be locked after session ends
      freeMinutesUsed: 0,
      intakeData: req.body.intakeData || null,
    },
    include: {
      counselor: { include: { user: { select: { name: true, avatar: true } } } },
      user: { select: { name: true, avatar: true } }
    },
  });

  // Notify Counselor in real-time
  try {
    const { getIO } = require('../../socket');
    const io = getIO();
    io.to(`portal:${counselorId}`).emit('new_ritual_request', { session });
  } catch (err) {
    console.error('⚠️ [SOCKET] Failed to notify counselor:', err.message);
  }

  res.status(201).json(new ApiResponse(201, {
    session,
    remainingMinutes,
    counselorName: session.counselor?.user?.name || session.counselor?.displayName,
  }, 'Connected to a listener! Your safe space is ready.'));
});

/**
 * Get SOS status — remaining free minutes for today
 */
exports.getSOSStatus = catchAsync(async (req, res) => {
  const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  const dailyFreeLimit = settings?.freeMinutesDailySOS || 10;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { freeMinutesUsed: true, lastFreeReset: true },
  });

  const lastReset = new Date(user.lastFreeReset);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const used = lastReset < today ? 0 : user.freeMinutesUsed;

  res.status(200).json(new ApiResponse(200, {
    dailyLimit: dailyFreeLimit,
    used,
    remaining: Math.max(0, dailyFreeLimit - used),
  }));
});

/**
 * Unlock a locked SOS session (requires wallet payment)
 */
exports.unlockSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { counselor: { include: { user: { select: { name: true } } } } },
  });

  if (!session) return next(new AppError('Session not found', 404));
  if (session.userId !== req.user.id) return next(new AppError('Unauthorized', 403));
  if (!session.isLocked) return res.status(200).json(new ApiResponse(200, session, 'Already unlocked'));

  // Check wallet balance — unlock costs ₹49
  const UNLOCK_PRICE = 49;
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });

  if (!wallet || wallet.balance < UNLOCK_PRICE) {
    return next(new AppError(`Insufficient balance. You need ₹${UNLOCK_PRICE} to unlock. Please recharge.`, 402));
  }

  // Deduct from wallet
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: UNLOCK_PRICE },
      totalSpent: { increment: UNLOCK_PRICE },
    },
  });

  // Record transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: UNLOCK_PRICE,
      type: 'DEDUCTION',
      status: 'COMPLETED',
      description: `Unlocked chat history with ${session.counselor?.user?.name || 'Counselor'}`,
      chatSessionId: sessionId,
    },
  });

  // Unlock the session
  const unlocked = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { isLocked: false, unlockedAt: new Date() },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      counselor: { include: { user: { select: { name: true, avatar: true } } } },
    },
  });

  res.status(200).json(new ApiResponse(200, unlocked, 'History unlocked! You can now view and reconnect.'));
});

/**
 * Counselor: Toggle online/offline
 */
exports.toggleCounselorOnline = catchAsync(async (req, res, next) => {
  const counselor = await prisma.counselor.findUnique({ where: { userId: req.user.id } });
  if (!counselor) return next(new AppError('Counselor profile not found', 404));

  const updated = await prisma.counselor.update({
    where: { id: counselor.id },
    data: { isOnline: !counselor.isOnline },
  });

  if (updated.isOnline) {
    await redis.sadd('online:counselors', counselor.id);
  } else {
    await redis.srem('online:counselors', counselor.id);
  }

  res.status(200).json(new ApiResponse(200, { isOnline: updated.isOnline }));
});

/**
 * Counselor: Get own dashboard
 */
exports.getCounselorDashboard = catchAsync(async (req, res, next) => {
  const counselor = await prisma.counselor.findUnique({
    where: { userId: req.user.id },
    include: {
      chatSessions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, status: true, totalMinutes: true, isFreeSession: true,
          type: true, startedAt: true, endedAt: true, createdAt: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  if (!counselor) return next(new AppError('Counselor profile not found', 404));

  res.status(200).json(new ApiResponse(200, counselor));
});

/**
 * Counselor: Update own profile
 */
exports.updateCounselorProfile = catchAsync(async (req, res, next) => {
  const { displayName, bio, languages, experience } = req.body;

  const counselor = await prisma.counselor.findUnique({ where: { userId: req.user.id } });
  if (!counselor) return next(new AppError('Counselor profile not found', 404));

  const updated = await prisma.counselor.update({
    where: { id: counselor.id },
    data: {
      displayName: displayName || counselor.displayName,
      bio: bio || counselor.bio,
      languages: languages || counselor.languages,
      experience: experience !== undefined ? parseInt(experience) : counselor.experience,
      ...(req.file && { profileImage: req.file.path })
    },
  });

  res.status(200).json(new ApiResponse(200, updated, 'Sanctuary Identity Resonance Aligned.'));
});
