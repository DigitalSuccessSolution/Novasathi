const { PrismaClient } = require("../../generated/client");
const prisma = new PrismaClient();
const { filterMessage: filterContent } = require("../../middleware/chatFilter");

/**
 * SRS §7.2 - Expert Gigs CRUD Logic
 */

// Create a new Gig (Expert Only)
const createGig = async (req, res) => {
  try {
    const { title, description, budgetRange, skillsNeeded, category, urgency } = req.body;
    const expertId = req.user.id; // From auth middleware

    // Validate expert status (SRS §7.1) - Allow Admins to skip this
    if (req.user.role !== 'ADMIN') {
        const expert = await prisma.expert.findUnique({ where: { userId: expertId } });
        if (!expert || expert.status !== 'APPROVED') {
            return res.status(403).json({ success: false, message: "Only approved experts can post gigs." });
        }
    }

    // SRS §7.5 Anti-Leakage in Gigs
    const filteredDescription = filterContent(description);
    if (filteredDescription.isFiltered) {
      // Logic for Red Alert can be added here
      return res.status(400).json({ success: false, message: "Content contains restricted information (phone/WhatsApp)." });
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
      }
    });

    res.status(201).json({ success: true, data: gig });
  } catch (err) {
    console.error("🔥 [CREATE_GIG_ERROR]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// List Gigs with server-side filtering
const getGigFeed = async (req, res) => {
  try {
    const { view } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    let filter = {};

    // Server-side filtering logic
    if (view === 'my_gigs') {
      // Show ALL projects posted by this user (including closed ones)
      filter = { postedBy: userId };
    } else if (view === 'my_applications') {
      // Show projects where this user has applied
      filter = { applications: { some: { applicantId: userId } } };
    } else {
      // Default Feed: Admins see everything, Experts only see OPEN & ACTIVE projects
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
                user: {
                  select: { phone: true }
                }
              }
            }
          }
        }
      }
    });

    // Map to include expert info (postedBy is userId)
    const gigsWithExpert = await Promise.all(gigs.map(async (gig) => {
        const poster = await prisma.expert.findUnique({
            where: { userId: gig.postedBy },
            select: { displayName: true, profileImage: true, location: true }
        });
        return { ...gig, poster };
    }));

    res.json({ success: true, data: gigsWithExpert });
  } catch (err) {
    console.error("🔥 [GET_GIGS_ERROR]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Apply to a Gig (Expert Only)
const applyToGig = async (req, res) => {
  try {
    const { gigId, message } = req.body;
    const applicantId = req.user.id;

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig || gig.status !== 'OPEN') {
      return res.status(404).json({ success: false, message: "Gig not found or closed." });
    }

    if (gig.postedBy === applicantId) {
      return res.status(400).json({ success: false, message: "You cannot apply to your own gig." });
    }

    // SRS §7.5 Anti-Leakage in Application
    if (message) {
      const filteredMessage = filterContent(message);
      if (filteredMessage.isFiltered) {
        return res.status(400).json({ success: false, message: "Application contains restricted info." });
      }
    }

    const application = await prisma.gigApplication.create({
      data: {
        gigId,
        applicantId,
        message
      }
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    if (err.code === 'P2002') {
        return res.status(400).json({ success: false, message: "You have already applied to this gig." });
    }
    console.error("🔥 [APPLY_GIG_ERROR]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Gig Status (Poster only)
const updateGig = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, budgetRange, skillsNeeded, category, urgency } = req.body;
    const expertId = req.user.id;

    const gig = await prisma.gig.findUnique({ where: { id } });
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    // Allow owner or Admin to update
    if (gig.postedBy !== expertId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (budgetRange) updateData.budgetRange = budgetRange;
    if (skillsNeeded) updateData.skillsNeeded = Array.isArray(skillsNeeded) ? skillsNeeded : skillsNeeded.split(',').map(s => s.trim());
    if (category) updateData.category = category;
    if (urgency) updateData.urgency = urgency;

    const updatedGig = await prisma.gig.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: updatedGig });
  } catch (err) {
    console.error("🔥 [UPDATE_GIG_ERROR]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteGig = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const gig = await prisma.gig.findUnique({ where: { id } });
        if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

        // Allow owner or Admin to delete
        if (gig.postedBy !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await prisma.gig.delete({ where: { id } });
        res.json({ success: true, message: "Gig deleted successfully" });
    } catch (err) {
        console.error("🔥 [DELETE_GIG_ERROR]", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
  createGig,
  getGigFeed,
  applyToGig,
  updateGig,
  deleteGig
};
