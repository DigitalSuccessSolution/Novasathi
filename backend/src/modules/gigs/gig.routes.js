const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { 
  createGig, 
  getGigFeed, 
  applyToGig, 
  updateGig,
  deleteGig 
} = require("./gig.controller");

/**
 * SRS §7.1 - RBAC Middleware
 * Only allows users with the 'EXPERT' role to access gig routes.
 */
const requireExpertRole = (req, res, next) => {
  if (req.user.role !== 'EXPERT' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied. You must be an approved expert.", 
      redirect: "/expert-panel/profile" 
    });
  }
  next();
};

// All gig routes require authentication and EXPERT role
router.use(protect);
router.use(requireExpertRole);

router.post("/create", createGig);
router.get("/feed", getGigFeed);
router.post("/apply", applyToGig);
router.patch("/:id/status", updateGig);
router.delete("/:id", deleteGig);

module.exports = router;
