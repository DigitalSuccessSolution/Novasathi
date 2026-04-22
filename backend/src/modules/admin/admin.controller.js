const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const AppError = require('../../utils/AppError');

/**
 * Get dashboard overview stats
 */
exports.getOverview = catchAsync(async (req, res) => {
  const [users, experts, totalRevenue, activeSessions] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.expert.count({ where: { status: 'APPROVED' } }),
    prisma.walletTransaction.aggregate({
      where: { type: 'DEDUCTION', status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.chatSession.count({ where: { status: 'ACTIVE' } }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    totalUsers: users,
    activeExperts: experts,
    revenue: totalRevenue._sum.amount || 0,
    liveChats: activeSessions,
  }));
});

/**
 * Expert Lifecycle Management
 */
exports.getExperts = catchAsync(async (req, res) => {
  const { status } = req.query; // PENDING, APPROVED, REJECTED
  const where = status ? { status: status.toUpperCase() } : {};

  const experts = await prisma.expert.findMany({
    where,
    include: {
      user: { select: { name: true, phone: true, email: true, avatar: true, gender: true, dateOfBirth: true } },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(new ApiResponse(200, experts));
});

exports.getPendingExperts = catchAsync(async (req, res) => {
  const experts = await prisma.expert.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { name: true, phone: true, email: true, avatar: true } },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(new ApiResponse(200, experts));
});

/**
 * Get distribution counts for expert statuses
 */
exports.getExpertCounts = catchAsync(async (req, res) => {
  const [pending, approved, rejected] = await Promise.all([
    prisma.expert.count({ where: { status: 'PENDING' } }),
    prisma.expert.count({ where: { status: 'APPROVED' } }),
    prisma.expert.count({ where: { status: 'REJECTED' } }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected
  }));
});

exports.approveExpert = catchAsync(async (req, res, next) => {
  const { expertId } = req.params;
  const { commissionPercent } = req.body;

  const expert = await prisma.expert.update({
    where: { id: expertId },
    data: {
      status: 'APPROVED',
      commissionPercent: commissionPercent ? parseFloat(commissionPercent) : null,
    },
    include: { user: { select: { phone: true } } },
  });

  // Notify expert
  await prisma.notification.create({
    data: {
      userId: expert.userId,
      title: '✅ Application Approved',
      message: 'Your expert profile has been approved! You can now start taking sessions.',
      type: 'GENERAL',
    },
  });

  res.status(200).json(new ApiResponse(200, expert, 'Expert approved successfully'));
});

exports.rejectExpert = catchAsync(async (req, res, next) => {
  const { expertId } = req.params;
  const { reason } = req.body;

  const expert = await prisma.expert.update({
    where: { id: expertId },
    data: { 
      status: 'REJECTED'
    },
  });

  // Notify expert
  await prisma.notification.create({
    data: {
      userId: expert.userId,
      title: '❌ Application Rejected',
      message: `Your expert application has been rejected. Reason: ${reason || 'Does not meet criteria'}`,
      type: 'GENERAL',
    },
  });

  res.status(200).json(new ApiResponse(200, expert, 'Expert application rejected'));
});

/**
 * Update Expert profile details (Admin rectification)
 */
exports.updateExpertDetails = catchAsync(async (req, res, next) => {
  const { expertId } = req.params;
  const { 
    displayName, bio, education, experience, location, 
    pricePerMinute, specializations, languages,
    bankName, accountNumber, ifscCode, upiId,
    gender, dateOfBirth, status
  } = req.body;

  const updateData = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (education !== undefined) updateData.education = education;
  if (experience !== undefined) updateData.experience = parseInt(experience);
  if (location !== undefined) updateData.location = location;
  if (pricePerMinute !== undefined) updateData.pricePerMinute = parseFloat(pricePerMinute);
  if (specializations !== undefined) updateData.specializations = specializations;
  if (languages !== undefined) updateData.languages = languages;
  if (bankName !== undefined) updateData.bankName = bankName;
  if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
  if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
  if (upiId !== undefined) updateData.upiId = upiId;
  if (status !== undefined) updateData.status = status.toUpperCase();

  // Sync overlapping User fields
  const userData = {};
  if (displayName !== undefined) userData.name = displayName;
  if (gender !== undefined) userData.gender = gender;
  if (dateOfBirth !== undefined) userData.dateOfBirth = new Date(dateOfBirth);

  const expert = await prisma.expert.update({
    where: { id: expertId },
    data: updateData,
    include: { user: true }
  });

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id: expert.userId },
      data: userData
    });
  }

  res.status(200).json(new ApiResponse(200, expert, 'Expert and User records synchronized by admin'));
});

/**
 * Manage Daily Content
 */
exports.createDailyContent = catchAsync(async (req, res) => {
  const { type, title, content, zodiacSign, imageUrl } = req.body;

  const newContent = await prisma.dailyContent.create({
    data: { type: type.toUpperCase(), title, content, zodiacSign, imageUrl },
  });

  res.status(201).json(new ApiResponse(201, newContent, 'Daily content published'));
});

/**
 * Update Admin Settings
 */
exports.updateSettings = catchAsync(async (req, res) => {
  const { 
    platformCommissionPercent, freeMinutesSignup, freeMinutesDailySOS, 
    minRechargeAmount, lowBalanceThreshold,
    freeMinutesResetType, sosEnabled, studentZoneTitle 
  } = req.body;

  const updateData = {};
  if (platformCommissionPercent !== undefined) updateData.platformCommissionPercent = parseFloat(platformCommissionPercent);
  if (freeMinutesSignup !== undefined) updateData.freeMinutesSignup = parseInt(freeMinutesSignup);
  if (freeMinutesDailySOS !== undefined) updateData.freeMinutesDailySOS = parseInt(freeMinutesDailySOS);
  if (minRechargeAmount !== undefined) updateData.minRechargeAmount = parseFloat(minRechargeAmount);
  if (lowBalanceThreshold !== undefined) updateData.lowBalanceThreshold = parseFloat(lowBalanceThreshold);
  if (freeMinutesResetType !== undefined) updateData.freeMinutesResetType = freeMinutesResetType;
  if (sosEnabled !== undefined) updateData.sosEnabled = sosEnabled;
  if (studentZoneTitle !== undefined) updateData.studentZoneTitle = studentZoneTitle;

  const settings = await prisma.adminSettings.upsert({
    where: { id: 'global' },
    update: updateData,
    create: { id: 'global', ...updateData },
  });

  res.status(200).json(new ApiResponse(200, settings, 'Global settings updated'));
});

/**
 * Assign/Create a Counselor for SOS Feature
 */
exports.createCounselor = catchAsync(async (req, res, next) => {
  const { userId, displayName, bio, languages } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return next(new AppError('User not found', 404));

  const existing = await prisma.counselor.findUnique({ where: { userId } });
  if (existing) return next(new AppError('User is already a counselor', 400));

  const counselor = await prisma.counselor.create({
    data: {
      userId,
      displayName: displayName || user.name || 'Anonymous Listener',
      bio,
      languages: languages || ['Hindi', 'English'],
      isApproved: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'COUNSELOR' },
  });

  res.status(201).json(new ApiResponse(201, counselor, 'Counselor assigned successfully'));
});

/**
 * Credit user wallet (Admin override)
 */
exports.creditWallet = catchAsync(async (req, res, next) => {
  const { userId, amount, reason } = req.body;

  if (!amount || amount <= 0) return next(new AppError('Invalid amount', 400));

  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) wallet = await prisma.wallet.create({ data: { userId } });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: parseFloat(amount) },
      totalRecharged: { increment: parseFloat(amount) },
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: parseFloat(amount),
      type: 'BONUS',
      status: 'COMPLETED',
      description: `Admin Credit: ${reason || 'Support Adjustment'}`,
    },
  });

  res.status(200).json(new ApiResponse(200, { balance: wallet.balance + parseFloat(amount) }, 'Wallet credited'));
});

/**
 * Get all users for admin directory
 */
exports.getUsers = catchAsync(async (req, res) => {
  const { role, search } = req.query;
  
  const where = {};
  
  if (role && role !== 'ALL') {
    where.role = role.toUpperCase();
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      wallet: {
        select: { balance: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json(new ApiResponse(200, users));
});

/**
 * Get all transactions for admin finance
 */
exports.getTransactions = catchAsync(async (req, res) => {
  const transactions = await prisma.walletTransaction.findMany({
    include: {
      wallet: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to last 50 for performance
  });

  // Calculate some quick stats for the grid
  const stats = await prisma.walletTransaction.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { amount: true },
    _count: { id: true }
  });

res.status(200).json(new ApiResponse(200, { transactions, stats }));
});

/**
 * Get all live and waiting sessions (Admin Monitor)
 */
exports.getLiveSessions = catchAsync(async (req, res) => {
  const sessions = await prisma.chatSession.findMany({
    where: { 
      status: { in: ['ACTIVE', 'WAITING'] } 
    },
    include: {
      user: { select: { id: true, name: true, phone: true, avatar: true, wallet: { select: { balance: true } } } },
      expert: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      counselor: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json(new ApiResponse(200, sessions));
});

/**
 * Get all sessions (Master Audit Log)
 */
exports.getAllSessions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? { status: status.toUpperCase() } : {};

  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true, wallet: { select: { balance: true } } } },
        expert: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        counselor: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.chatSession.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, { sessions, pagination: { page: parseInt(page), limit: parseInt(limit), total } }));
});


/**
 * Manually assign a waiting session to an expert
 */
exports.assignSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { expertId, counselorId } = req.body;

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return next(new AppError('Session not found', 404));

  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { 
        expertId: expertId || session.expertId, 
        counselorId: counselorId || session.counselorId 
    },
  });

  // Notify the assigned party via Socket
  try {
    const { getIO } = require('../../socket');
    const io = getIO();
    const portal = expertId ? `expert_portal:${expertId}` : `counselor_portal:${counselorId}`;
    io.to(portal).emit('new_ritual_request', { session: updated });
  } catch (err) {
    console.error('⚠️ [ADMIN_ASSIGN] Socket notify failed:', err.message);
  }

  res.status(200).json(new ApiResponse(200, updated, 'Session manually rerouted.'));
});

/**
 * Force terminate a session (Moderation)
 */
exports.terminateSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return next(new AppError('Session not found', 404));

  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'TERMINATED', endedAt: new Date() },
  });

  // Notify participants to disconnect
  try {
    const { getIO } = require('../../socket');
    const io = getIO();
    io.to(sessionId).emit('session_ended', { sessionId, reason: 'ADMIN_TERMINATED' });
    io.to(sessionId).emit('force_disconnect', { message: 'Session terminated by admin.' });
  } catch (err) {
     console.error('⚠️ [ADMIN_TERMINATE] Socket notify failed:', err.message);
  }

  res.status(200).json(new ApiResponse(200, updated, 'Session terminated by high command.'));
});

/**
 * Create a new Expert manually (Admin feature)
 */
exports.createExpert = catchAsync(async (req, res, next) => {
  const { phone, name, email, displayName, bio, specializations, pricePerMinute, experience } = req.body;

  if (!phone || !displayName) return next(new AppError('Phone and Display Name are required', 400));

  // 1. Check/Create User
  let user = await prisma.user.findUnique({ where: { phone } });
  
  if (user) {
    if (user.role === 'EXPERT' || user.role === 'ADMIN') {
      return next(new AppError('User is already an expert or admin', 400));
    }
    // Upgrade existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'EXPERT', name: name || user.name }
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        phone,
        name,
        email,
        role: 'EXPERT',
        isActive: true
      }
    });
  }

  // 2. Create Expert Profile
  const expert = await prisma.expert.create({
    data: {
      userId: user.id,
      displayName,
      bio: bio || 'Professional Guide',
      specializations: specializations || ['Tarot', 'Vastu'],
      pricePerMinute: pricePerMinute ? parseFloat(pricePerMinute) : 10,
      experience: experience ? parseInt(experience) : 0,
      status: 'APPROVED',
      isOnline: false
    }
  });

  res.status(201).json(new ApiResponse(201, { user, expert }, 'Expert account manifested successfully'));
});

// ─────────────────────────────────────────────────────────────
// SRS §9.4 — Dummy Profile Engine
// ─────────────────────────────────────────────────────────────
exports.createDummyExpert = catchAsync(async (req, res, next) => {
  const { phone, name, displayName, bio, specializations, pricePerMinute, profileImage } = req.body;

  if (!phone || !displayName) return next(new AppError('Phone and Display Name required', 400));

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: name || displayName, role: 'EXPERT', isActive: true }
    });
  }

  const expert = await prisma.expert.create({
    data: {
      userId: user.id,
      displayName,
      bio: bio || 'Experienced Guide',
      profileImage,
      specializations: specializations || [],
      pricePerMinute: pricePerMinute ? parseFloat(pricePerMinute) : 10,
      status: 'APPROVED',
      isDummyProfile: true,
      isOnline: true,
    }
  });

  res.status(201).json(new ApiResponse(201, { user, expert }, 'Dummy expert profile created'));
});

// ─────────────────────────────────────────────────────────────
// SRS §9.6 — Red Alert System
// ─────────────────────────────────────────────────────────────
exports.getRedAlerts = catchAsync(async (req, res) => {
  const { resolved = 'false', page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = resolved === 'true' ? {} : { isResolved: false };

  const [alerts, total] = await Promise.all([
    prisma.adminAlert.findMany({
      where,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.adminAlert.count({ where }),
  ]);

  res.status(200).json(new ApiResponse(200, { alerts, total }));
});

exports.resolveRedAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;

  const alert = await prisma.adminAlert.update({
    where: { id: alertId },
    data: { isResolved: true, resolvedBy: req.user.id, resolvedAt: new Date() },
  });

  res.status(200).json(new ApiResponse(200, alert, 'Alert resolved'));
});

// ─────────────────────────────────────────────────────────────
// SRS §1.3 — Early Bird CSV Upload
// ─────────────────────────────────────────────────────────────
exports.uploadEarlyBirdCSV = catchAsync(async (req, res, next) => {
  const { phones } = req.body; // Array of phone numbers

  if (!phones || !Array.isArray(phones) || phones.length === 0) {
    return next(new AppError('Provide an array of phone numbers', 400));
  }

  let added = 0;
  let skipped = 0;

  for (const phone of phones) {
    const cleaned = phone.toString().trim();
    if (!cleaned || cleaned.length < 10) { skipped++; continue; }

    try {
      await prisma.earlyBirdWhitelist.upsert({
        where: { phone: cleaned },
        update: {},
        create: { phone: cleaned, addedBy: req.user.id },
      });

      // Also tag existing user if they already registered
      await prisma.user.updateMany({
        where: { phone: cleaned },
        data: { isEarlyBird: true, userTag: 'Early_Bird_User' },
      });

      added++;
    } catch (err) {
      skipped++;
    }
  }

  res.status(200).json(new ApiResponse(200, { added, skipped, total: phones.length }, 'Early Bird list updated'));
});

// ─────────────────────────────────────────────────────────────
// SRS §9.4 — Expanded Admin Settings
// ─────────────────────────────────────────────────────────────
exports.getSettings = catchAsync(async (req, res) => {
  const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  res.status(200).json(new ApiResponse(200, settings));
});

// ─────────────────────────────────────────────────────────────
// SRS §9.3 — User LTV (Lifetime Value) Profile
// ─────────────────────────────────────────────────────────────
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      expert: true,
      counselor: true,
    }
  });

  if (!user) return next(new AppError('User not found', 404));

  // LTV stats
  const [sessionStats, transactionStats] = await Promise.all([
    prisma.chatSession.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { totalMinutes: true, totalAmount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { wallet: { userId }, type: 'RECHARGE', status: 'COMPLETED' },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  const firstSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  const lastSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  res.status(200).json(new ApiResponse(200, {
    user,
    ltv: {
      totalSessions: sessionStats._count.id || 0,
      totalMinutes: sessionStats._sum.totalMinutes || 0,
      totalSpent: sessionStats._sum.totalAmount || 0,
      rechargeCount: transactionStats._count.id || 0,
      totalRecharged: transactionStats._sum.amount || 0,
      firstSessionDate: firstSession?.createdAt || null,
      lastSessionDate: lastSession?.createdAt || null,
    }
  }));
});

// ─────────────────────────────────────────────────────────────
// User Restriction Status Toggle
// ─────────────────────────────────────────────────────────────
exports.toggleUserRestriction = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true }
  });

  if (!user) return next(new AppError('User not found', 404));

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  });

  res.status(200).json(new ApiResponse(200, updatedUser, `User has been ${updatedUser.isActive ? 'unrestricted' : 'restricted'} successfully`));
});

// ─────────────────────────────────────────────────────────────
// Payout Management
// ─────────────────────────────────────────────────────────────

exports.getPayouts = catchAsync(async (req, res, next) => {
  const payouts = await prisma.payout.findMany({
    include: {
      expert: {
        select: {
          id: true,
          displayName: true,
          bankName: true,
          accountNumber: true,
          ifscCode: true,
          upiId: true,
          user: { select: { name: true, phone: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json(new ApiResponse(200, payouts, 'Payouts retrieved successfully'));
});

exports.approvePayout = catchAsync(async (req, res, next) => {
  const { payoutId } = req.params;

  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return next(new AppError('Payout not found', 404));

  if (payout.status === 'COMPLETED') {
    return next(new AppError('Payout is already completed', 400));
  }

  const updatedPayout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: 'COMPLETED', processedAt: new Date() }
  });

  res.status(200).json(new ApiResponse(200, updatedPayout, 'Payout approved successfully'));
});

// ─────────────────────────────────────────────────────────────
// Platform Settings
// ─────────────────────────────────────────────────────────────

exports.getSettings = catchAsync(async (req, res) => {
  let settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });

  if (!settings) {
    settings = await prisma.adminSettings.create({ data: { id: 'global' } });
  }

  res.status(200).json(new ApiResponse(200, settings));
});

exports.updateSettings = catchAsync(async (req, res) => {
  const {
    platformCommissionPercent,
    freeMinutesSignup,
    freeMinutesDailySOS,
    minRechargeAmount,
    lowBalanceThreshold,
    freeMinutesResetType,
    sosEnabled,
    studentZoneTitle
  } = req.body;

  const settings = await prisma.adminSettings.upsert({
    where: { id: 'global' },
    update: {
      ...(platformCommissionPercent !== undefined && { platformCommissionPercent: parseFloat(platformCommissionPercent) }),
      ...(freeMinutesSignup !== undefined && { freeMinutesSignup: parseInt(freeMinutesSignup) }),
      ...(freeMinutesDailySOS !== undefined && { freeMinutesDailySOS: parseInt(freeMinutesDailySOS) }),
      ...(minRechargeAmount !== undefined && { minRechargeAmount: parseFloat(minRechargeAmount) }),
      ...(lowBalanceThreshold !== undefined && { lowBalanceThreshold: parseFloat(lowBalanceThreshold) }),
      ...(freeMinutesResetType !== undefined && { freeMinutesResetType }),
      ...(sosEnabled !== undefined && { sosEnabled }),
      ...(studentZoneTitle !== undefined && { studentZoneTitle }),
    },
    create: { id: 'global' }
  });

  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

// ─────────────────────────── MASTER DATA (DYNAMIC TRACKS) ───────────────────────────

exports.getAllMasterCategories = catchAsync(async (req, res) => {
    const categories = await prisma.expertCategoryMaster.findMany({
        include: { skills: { where: { isActive: true } } },
        orderBy: { name: 'asc' }
    });
    res.status(200).json(new ApiResponse(200, categories));
});

exports.createMasterCategory = catchAsync(async (req, res) => {
    const { name, code, description } = req.body;
    const category = await prisma.expertCategoryMaster.create({
        data: { name, code, description }
    });
    res.status(201).json(new ApiResponse(201, category, 'New cosmic track manifested'));
});

exports.updateMasterCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;
    const category = await prisma.expertCategoryMaster.update({
        where: { id },
        data: { name, code, description, isActive }
    });
    res.status(200).json(new ApiResponse(200, category, 'Track recalibrated'));
});

exports.deleteMasterCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.expertCategoryMaster.delete({ where: { id } });
    res.status(200).json(new ApiResponse(200, null, 'Track dissolved into the void'));
});

exports.createMasterSkill = catchAsync(async (req, res) => {
    const { name, categoryId } = req.body;
    const skill = await prisma.expertSkillMaster.create({
        data: { name, categoryId }
    });
    res.status(201).json(new ApiResponse(201, skill, 'New specialization added'));
});

exports.toggleMasterSkill = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const skill = await prisma.expertSkillMaster.update({
        where: { id },
        data: { isActive }
    });
    res.status(200).json(new ApiResponse(200, skill, 'Specialization status toggled'));
});

exports.deleteMasterSkill = catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.expertSkillMaster.delete({ where: { id } });
    res.status(200).json(new ApiResponse(200, null, 'Specialization purged'));
});
