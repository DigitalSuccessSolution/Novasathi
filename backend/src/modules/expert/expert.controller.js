const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * List all approved experts
 */
exports.listExperts = catchAsync(async (req, res, next) => {
  const { isOnline } = req.query;
  const category = req.params.category || req.query.category;

  const where = { status: 'APPROVED' };
  
  if (category) {
    const cleanCategory = category.toLowerCase().replace(/_/g, '');
    
    // We fetch all and filter in JS if we want perfect underscore-agnostic behavior,
    // but for performance, we'll suggest the two main ones.
    if (cleanCategory === 'dilkibaat') {
      where.category = { in: ['dilkibaat', 'DIL_KI_BAAT'] };
    } else if (cleanCategory === 'starandfuture') {
      where.category = { in: ['starandfuture', 'STAR_AND_FUTURE'] };
    } else {
      where.category = category;
    }
  }

  if (isOnline === 'true') {
    where.isOnline = true;
  }

  const experts = await prisma.expert.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        }
      },
      reviews: {
          select: { rating: true }
      }
    }
  });

  res.status(200).json(new ApiResponse(200, { experts, total: experts.length }, 'Experts retrieved successfully'));
});

/**
 * Get expert profile by ID
 */
exports.getExpertProfile = catchAsync(async (req, res, next) => {
  const { expertId } = req.params;

  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        }
      },
      reviews: {
        include: {
          user: {
            select: { name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!expert) {
    return next(new AppError('Expert not found', 404));
  }

  res.status(200).json(new ApiResponse(200, expert, 'Expert profile retrieved successfully'));
});

/**
 * Update expert profile
 */
exports.updateExpertProfile = catchAsync(async (req, res, next) => {
  const data = { ...req.body };

  // Parse arrays if sent as stringified JSON (common in multipart/form-data)
  if (data.specializations && typeof data.specializations === 'string') {
    try { data.specializations = JSON.parse(data.specializations); } catch (e) {}
  }
  if (data.languages && typeof data.languages === 'string') {
    try { data.languages = JSON.parse(data.languages); } catch (e) {}
  }

  // Cast numbers
  if (data.pricePerMinute) data.pricePerMinute = parseFloat(data.pricePerMinute);
  if (data.experience) data.experience = parseInt(data.experience);

  // Find expert to get ID for document relations
  const expertRecord = await prisma.expert.findUnique({ where: { userId: req.user.id } });
  if (!expertRecord) return next(new AppError('Expert profile not found', 404));

  // Handle file uploads (profileImage and KYC docs)
  if (req.files) {
    if (req.files.profileImage) {
      data.profileImage = req.files.profileImage[0].path;
    }

    // Process KYC Documents
    const documentTypes = { 
      aadhaar: 'AADHAAR', 
      pan: 'PAN', 
      certification: 'CERTIFICATION' 
    };

    for (const [fieldName, docType] of Object.entries(documentTypes)) {
      if (req.files[fieldName]) {
        const fileUrl = req.files[fieldName][0].path;
        
        // Find existing document of this type or create new
        const existingDoc = await prisma.expertDocument.findFirst({
          where: { expertId: expertRecord.id, type: docType }
        });

        if (existingDoc) {
          await prisma.expertDocument.update({
            where: { id: existingDoc.id },
            data: { url: fileUrl, verified: false } // Reset verification on update
          });
        } else {
          await prisma.expertDocument.create({
            data: { 
              expertId: expertRecord.id, 
              type: docType, 
              url: fileUrl 
            }
          });
        }
      }
    }
  }

  const expert = await prisma.expert.update({
    where: { userId: req.user.id },
    data: data,
    include: { 
      user: true,
      documents: true
    }
  });

  res.status(200).json(new ApiResponse(200, expert, 'Profile updated successfully'));
});

/**
 * Toggle Expert Online Status
 */
exports.toggleOnline = catchAsync(async (req, res, next) => {
  const expert = await prisma.expert.findUnique({
    where: { userId: req.user.id }
  });

  if (!expert) return next(new AppError('Expert profile not found', 404));

  const updatedExpert = await prisma.expert.update({
    where: { userId: req.user.id },
    data: { 
        isOnline: !expert.isOnline
    }
  });

  res.status(200).json(new ApiResponse(200, updatedExpert, `Status: ${updatedExpert.isOnline ? 'ONLINE' : 'OFFLINE'}`));
});

/**
 * Expert Onboarding (SRS §8.4)
 */
exports.onboardExpert = catchAsync(async (req, res, next) => {
  const { displayName, city, bio, perMinuteRate, languages, skillTags, category, demoSlot } = req.body;
  
  const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
  if (!expert) return next(new AppError('Expert record missing. Please signup first.', 404));

  const files = req.files || {};
  
  const updateData = {
    displayName,
    location: city,
    bio,
    pricePerMinute: parseFloat(perMinuteRate) || 0,
    specializations: JSON.parse(skillTags || '[]'),
    languages: JSON.parse(languages || '[]'),
    category: category,
    status: 'PENDING'
  };

  const updatedExpert = await prisma.expert.update({
    where: { id: expert.id },
    data: updateData
  });

  // Create documents records if present
  const documentTypes = {
    aadhaar: 'AADHAAR',
    pan: 'PAN',
    certification: 'CERTIFICATE',
    introVideo: 'VIDEO'
  };

  for (const [key, type] of Object.entries(documentTypes)) {
    if (files[key]) {
      await prisma.expertDocument.create({
        data: {
          expertId: expert.id,
          type: type,
          url: files[key][0].path
        }
      });
    }
  }

  // Handle Profile Image Sync
  if (files.profileImage) {
    const avatarUrl = files.profileImage[0].path;
    await prisma.expert.update({ where: { id: expert.id }, data: { profileImage: avatarUrl } });
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatarUrl } });
  }

  res.status(200).json(new ApiResponse(200, updatedExpert, 'Expert onboarding application submitted.'));
});

// DO NOT DELETE: Profile Image Sync Logic (Needed for Admin Verification Images)
const syncAvatar = async (expertId, userId, files) => {
  if (files && files.profileImage) {
    const avatarUrl = files.profileImage[0].path;
    await prisma.expert.update({ where: { id: expertId }, data: { profileImage: avatarUrl } });
    await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
  }
};

/**
 * Specialized: Expert Overview (Daily stats + Basic Info + Active Sessions)
 */
exports.getOverview = catchAsync(async (req, res, next) => {
    const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        select: {
            id: true, status: true, isOnline: true, bio: true,
            totalEarnings: true, totalMinutes: true, totalSessions: true, avgRating: true,
            commissionPercent: true,
            chatSessions: {
                where: { status: { in: ['ACTIVE', 'WAITING'] } },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, avatar: true } } }
            }
        }
    });

    if (!expert) return next(new AppError('Expert profile not found', 404));

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayStats = await prisma.chatSession.aggregate({
        where: { expertId: expert.id, status: { in: ['COMPLETED', 'TERMINATED'] }, endedAt: { gte: todayStart } },
        _sum: { totalAmount: true, totalMinutes: true },
        _count: true,
    });

    res.status(200).json(new ApiResponse(200, {
        expert,
        today: {
            earnings: todayStats._sum.totalAmount || 0,
            minutes: todayStats._sum.totalMinutes || 0,
            count: todayStats._count || 0
        },
        commissionRate: expert.commissionPercent || 30
    }, 'Overview data retrieved'));
});

/**
 * Specialized: Expert Earnings (Detailed records + Payouts)
 */
exports.getEarnings = catchAsync(async (req, res, next) => {
    const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        select: {
            id: true, totalEarnings: true, totalMinutes: true, commissionPercent: true,
            bankName: true, accountNumber: true, ifscCode: true, upiId: true,
            payouts: { orderBy: { createdAt: 'desc' }, take: 20 },
            chatSessions: {
                where: { status: { in: ['COMPLETED', 'TERMINATED'] } },
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: { user: { select: { name: true, avatar: true } } }
            }
        }
    });

    if (!expert) return next(new AppError('Expert profile not found', 404));

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEarnings = await prisma.chatSession.aggregate({
        where: { expertId: expert.id, status: { in: ['COMPLETED', 'TERMINATED'] }, endedAt: { gte: todayStart } },
        _sum: { totalAmount: true }
    });

    res.status(200).json(new ApiResponse(200, {
        expert,
        today: { earnings: todayEarnings._sum.totalAmount || 0 },
        commissionRate: expert.commissionPercent || 30
    }, 'Earnings data retrieved'));
});

/**
 * Specialized: Expert History (Complete session records)
 */
exports.getHistory = catchAsync(async (req, res, next) => {
    const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        select: {
            id: true,
            chatSessions: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, avatar: true } } }
            }
        }
    });

    if (!expert) return next(new AppError('Expert profile not found', 404));

    res.status(200).json(new ApiResponse(200, { expert }, 'History retrieved'));
});

/**
 * Specialized: Expert Profile (Self Profile Details)
 */
exports.getProfileMe = catchAsync(async (req, res, next) => {
    const expert = await prisma.expert.findUnique({
        where: { userId: req.user.id },
        include: {
            user: { select: { id: true, phone: true, name: true, email: true, role: true, avatar: true } },
            documents: true
        }
    });

    if (!expert) return next(new AppError('Expert profile not found', 404));

    res.status(200).json(new ApiResponse(200, { expert }, 'Profile retrieved'));
});

/**
 * Submit expert review
 */
exports.submitReview = catchAsync(async (req, res, next) => {
    const { expertId } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.create({
        data: {
            expertId,
            userId: req.user.id,
            rating: parseFloat(rating),
            comment
        }
    });

    res.status(201).json(new ApiResponse(201, review, 'Review submitted successfully'));
});

/**
 * Request Payout
 */
exports.requestPayout = catchAsync(async (req, res, next) => {
    const { amount } = req.body;
    const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });

    const payout = await prisma.payout.create({
        data: {
            expertId: expert.id,
            amount: parseFloat(amount),
            status: 'PENDING'
        }
    });

    res.status(201).json(new ApiResponse(201, payout, 'Payout request submitted'));
});

/**
 * Get all available expert categories and skills (Metadata)
 */
exports.getCategories = catchAsync(async (req, res) => {
  const categories = await prisma.expertCategoryMaster.findMany({
    where: { isActive: true },
    include: { skills: { where: { isActive: true }, orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' }
  });
  res.status(200).json(new ApiResponse(200, categories));
});
