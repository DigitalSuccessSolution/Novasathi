const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get current user profile
 */
exports.getMe = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      wallet: { select: { id: true, balance: true, totalRecharged: true, totalSpent: true } },
      favorites: { include: { expert: { include: { user: { select: { name: true, avatar: true } } } } } },
      expert: { select: { status: true } }
    },
  });

  // Map expert status to serverStatus for easy frontend access
  if (user && user.expert) {
    user.serverStatus = user.expert.status;
  }

  res.status(200).json(new ApiResponse(200, user));
});

/**
 * Update profile (name, email, dob, zodiac, mood, avatar, anonymous mode)
 */
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, email, dateOfBirth, gender, address, zodiacSign, currentMood, avatar, isAnonymous } = req.body;
  
  const updateData = {};
  if (req.file) {
    updateData.avatar = req.file.path;
  } else if (avatar !== undefined) {
    updateData.avatar = avatar;
  }

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
  if (gender !== undefined) updateData.gender = gender;
  if (address !== undefined) updateData.address = address;
  if (zodiacSign !== undefined) updateData.zodiacSign = zodiacSign;
  if (currentMood !== undefined) updateData.currentMood = currentMood;
  if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous === 'true' || isAnonymous === true;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
  });

  res.status(200).json(new ApiResponse(200, user, 'Profile updated'));
});

/**
 * Set current mood
 */
exports.setMood = catchAsync(async (req, res) => {
  const { mood } = req.body;

  if (!mood) return res.status(400).json(new ApiResponse(400, null, 'Mood is required'));

  await prisma.user.update({
    where: { id: req.user.id },
    data: { currentMood: mood },
  });

  res.status(200).json(new ApiResponse(200, { mood }, 'Mood updated'));
});

/**
 * Get chat history (with lock status for SOS sessions)
 */
exports.getChatHistory = catchAsync(async (req, res) => {
  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user.id, status: { in: ['COMPLETED', 'TERMINATED'] } },
    include: {
      expert: { include: { user: { select: { name: true, avatar: true } } } },
      counselor: { include: { user: { select: { name: true, avatar: true } } } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // For locked sessions, blur the message previews
  const formatted = sessions.map(s => ({
    ...s,
    messages: s.isLocked ? [{ content: '🔒 Unlock to view this conversation', createdAt: s.endedAt }] : s.messages,
    partnerName: s.expert?.user?.name || s.counselor?.user?.name || 'Unknown',
    partnerAvatar: s.expert?.user?.avatar || s.counselor?.user?.avatar || null,
  }));

  res.status(200).json(new ApiResponse(200, formatted));
});

/**
 * Add expert to favorites
 */
exports.addFavorite = catchAsync(async (req, res, next) => {
  const { expertId } = req.params;

  const expert = await prisma.expert.findUnique({ where: { id: expertId } });
  if (!expert) return next(new AppError('Expert not found', 404));

  await prisma.favoriteExpert.upsert({
    where: { userId_expertId: { userId: req.user.id, expertId } },
    update: {},
    create: { userId: req.user.id, expertId },
  });

  res.status(200).json(new ApiResponse(200, null, 'Added to favorites'));
});

/**
 * Remove from favorites
 */
exports.removeFavorite = catchAsync(async (req, res) => {
  const { expertId } = req.params;

  await prisma.favoriteExpert.deleteMany({
    where: { userId: req.user.id, expertId },
  });

  res.status(200).json(new ApiResponse(200, null, 'Removed from favorites'));
});

/**
 * Get favorites list
 */
exports.getFavorites = catchAsync(async (req, res) => {
  const favorites = await prisma.favoriteExpert.findMany({
    where: { userId: req.user.id },
    include: {
      expert: {
        include: { user: { select: { name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json(new ApiResponse(200, favorites));
});

/**
 * Get user notifications
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.status(200).json(new ApiResponse(200, notifications));
});

/**
 * Mark notification as read
 */
exports.markNotificationRead = catchAsync(async (req, res) => {
  const { notificationId } = req.params;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  res.status(200).json(new ApiResponse(200, null, 'Marked as read'));
});

/**
 * Mark all notifications read
 */
exports.markAllRead = catchAsync(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});
