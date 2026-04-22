const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const AppError = require('../../utils/AppError');

/**
 * Get today's daily content (horoscope, tarot, muhurat)
 */
exports.getDailyContent = catchAsync(async (req, res) => {
  const { type, zodiacSign } = req.query;
  const isAdmin = req.user?.role === 'ADMIN';

  const where = {};
  
  // Public users only see active/current content (Exempting HANDBOOK which is constant reference)
  if (!isAdmin) {
    where.isActive = true;
    
    if (type !== 'HANDBOOK') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      where.publishDate = { gte: today, lt: tomorrow };
    }
  }

  if (type) where.type = type.toUpperCase();
  if (zodiacSign && !isAdmin) where.OR = [{ zodiacSign }, { zodiacSign: null }];

  const content = await prisma.dailyContent.findMany({
    where,
    orderBy: [
      { priority: 'asc' },
      { publishDate: 'desc' }
    ],
  });

  res.status(200).json(new ApiResponse(200, content));
});

/**
 * Get active polls
 */
exports.getPolls = catchAsync(async (req, res) => {
  const polls = await prisma.poll.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.status(200).json(new ApiResponse(200, polls));
});

/**
 * Vote on a poll
 */
exports.votePoll = catchAsync(async (req, res, next) => {
  const { pollId, optionId } = req.body;

  if (!pollId || !optionId) return next(new AppError('Poll ID and option ID required', 400));

  // Check if already voted
  const existing = await prisma.pollResponse.findUnique({
    where: { pollId_userId: { pollId, userId: req.user.id } },
  });

  if (existing) return next(new AppError('You have already voted on this poll', 400));

  await prisma.pollResponse.create({
    data: { pollId, userId: req.user.id, optionId },
  });

  // Update vote count in poll options JSON
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (poll) {
    const options = poll.options.map(opt => {
      if (opt.id === optionId) return { ...opt, votes: (opt.votes || 0) + 1 };
      return opt;
    });
    await prisma.poll.update({ where: { id: pollId }, data: { options } });
  }

  res.status(200).json(new ApiResponse(200, null, 'Vote recorded'));
});

/**
 * Get specific content by ID
 */
exports.getContentById = catchAsync(async (req, res, next) => {
  const content = await prisma.dailyContent.findUnique({ where: { id: req.params.id } });
  if (!content) return next(new AppError('Content not found', 404));
  res.status(200).json(new ApiResponse(200, content));
});
/**
 * Create daily content (Admin only)
 */
exports.createContent = catchAsync(async (req, res, next) => {
  const { type, content, author, title, mediaUrl, publishDate } = req.body;

  if (!type || !content) return next(new AppError('Type and content required', 400));

  const daily = await prisma.dailyContent.create({
    data: {
      type: type.toUpperCase(),
      content,
      author: author || 'Cosmic Bot',
      title: title || 'Daily Message',
      mediaUrl,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      isActive: true,
    },
  });

  res.status(201).json(new ApiResponse(201, daily, 'Content created successfully'));
});

/**
 * Update daily content (Admin only)
 */
exports.updateContent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type, content, author, title, mediaUrl, isActive, publishDate } = req.body;

  const existing = await prisma.dailyContent.findUnique({ where: { id } });
  if (!existing) return next(new AppError('Content not found', 404));

  const updated = await prisma.dailyContent.update({
    where: { id },
    data: {
      type: type ? type.toUpperCase() : undefined,
      content,
      author,
      title,
      mediaUrl,
      isActive: isActive !== undefined ? isActive : undefined,
      publishDate: publishDate ? new Date(publishDate) : undefined,
    },
  });

  res.status(200).json(new ApiResponse(200, updated, 'Content updated successfully'));
});


/**
 * Delete daily content (Admin only)
 */
exports.deleteContent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const content = await prisma.dailyContent.findUnique({ where: { id } });
  if (!content) return next(new AppError('Content not found', 404));

  await prisma.dailyContent.delete({ where: { id } });
  res.status(200).json(new ApiResponse(200, null, 'Content deleted'));
});

/**
 * Update content priorities (Admin only)
 * Expects { orders: [ { id, priority }, ... ] }
 */
exports.updatePriority = catchAsync(async (req, res, next) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders)) {
    return next(new AppError('Invalid order data', 400));
  }

  // Use transaction for batch update
  await prisma.$transaction(
    orders.map((item) =>
      prisma.dailyContent.update({
        where: { id: item.id },
        data: { priority: item.priority },
      })
    )
  );

  res.status(200).json(new ApiResponse(200, null, 'Priorities updated successfully'));
});
