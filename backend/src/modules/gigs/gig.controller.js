const prisma = require("../../config/prisma");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const ApiResponse = require("../../utils/ApiResponse");
const { filterMessage: filterContent } = require("../../middleware/chatFilter");

/**
 * NovaSathi Gig Controller — Scalable B2B Networking
 * Handles creation, application, and lifecycle of expert-to-expert gigs.
 */

// Create a new Gig (Expert Only)
exports.createGig = catchAsync(async (req, res, next) => {
  const { title, description, budgetRange, skillsNeeded, category, urgency } = req.body;
  const expertId = req.user.id;

  // Validate expert status (SRS §7.1)
  if (req.user.role !== 'ADMIN') {
    const expert = await prisma.expert.findUnique({ where: { userId: expertId } });
    if (!expert || expert.status !== 'APPROVED') {
      return next(new AppError("Only approved experts can post gigs.", 403));
    }
  }

  // Anti-Leakage (SRS §7.5)
  const filtered = filterContent(description);
  if (filtered.isFiltered) {
    return next(new AppError("Content contains restricted information (phone/WhatsApp).", 400));
  }

  const gig = await prisma.gig.create({
    data: {
      postedBy: expertId,
      title,
      description,
      budgetRange,
      category: category || "General",
      urgency: urgency || "Normal",
      skillsNeeded: skillsNeeded || [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.status(201).json(new ApiResponse(201, gig, "Gig created successfully"));
});

// List Gigs with server-side filtering
exports.getGigFeed = catchAsync(async (req, res, next) => {
  const { view } = req.query;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  let filter = {};

  if (view === 'my_gigs') {
    filter = { postedBy: userId };
  } else if (view === 'my_applications') {
    filter = { applications: { some: { applicantId: userId } } };
  } else {
    if (!isAdmin) {
      filter = { 
        status: 'OPEN',
        expiresAt: { gt: new Date() }
      };
    }
  }

  const gigs = await prisma.gig.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    include: {
      applications: {
        include: {
          applicant: {
            select: {
              displayName: true,
              profileImage: true,
              location: true,
              experience: true,
              specializations: true,
            }
          }
        }
      }
    }
  });

  // Optimize: Batch fetch posters instead of map+findUnique
  const posterIds = [...new Set(gigs.map(g => g.postedBy))];
  const posters = await prisma.expert.findMany({
    where: { userId: { in: posterIds } },
    select: { userId: true, displayName: true, profileImage: true, location: true }
  });

  const posterMap = Object.fromEntries(posters.map(p => [p.userId, p]));

  const data = gigs.map(gig => ({
    ...gig,
    poster: posterMap[gig.postedBy]
  }));

  res.status(200).json(new ApiResponse(200, data, "Gig feed retrieved"));
});

// Apply to a Gig
exports.applyToGig = catchAsync(async (req, res, next) => {
  const { gigId, message } = req.body;
  const applicantId = req.user.id;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig || gig.status !== 'OPEN') {
    return next(new AppError("Gig not found or closed.", 404));
  }

  if (gig.postedBy === applicantId) {
    return next(new AppError("You cannot apply to your own gig.", 400));
  }

  if (message && filterContent(message).isFiltered) {
    return next(new AppError("Application contains restricted info.", 400));
  }

  const application = await prisma.gigApplication.create({
    data: { gigId, applicantId, message }
  });

  res.status(201).json(new ApiResponse(201, application, "Application submitted"));
});

// Update Gig
exports.updateGig = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const gig = await prisma.gig.findUnique({ where: { id } });
  
  if (!gig) return next(new AppError("Gig not found", 404));
  if (gig.postedBy !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError("Unauthorized", 403));
  }

  const updatedGig = await prisma.gig.update({
    where: { id },
    data: req.body
  });

  res.status(200).json(new ApiResponse(200, updatedGig, "Gig updated successfully"));
});

// Delete Gig
exports.deleteGig = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const gig = await prisma.gig.findUnique({ where: { id } });
  
  if (!gig) return next(new AppError("Gig not found", 404));
  if (gig.postedBy !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError("Unauthorized", 403));
  }

  await prisma.gig.delete({ where: { id } });
  res.status(200).json(new ApiResponse(200, null, "Gig deleted successfully"));
});
