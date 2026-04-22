const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

router.use(protect, restrictTo('ADMIN'));

// Dashboard & Overview
router.get('/overview', adminController.getOverview);
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

// Expert Management
router.get('/experts/counts', adminController.getExpertCounts);
router.get('/experts', adminController.getExperts);
router.get('/experts/pending', adminController.getPendingExperts);
router.post('/experts', adminController.createExpert);
router.post('/experts/dummy', adminController.createDummyExpert);
router.patch('/experts/:expertId', adminController.updateExpertDetails);
router.patch('/experts/:expertId/approve', adminController.approveExpert);
router.patch('/experts/:expertId/reject', adminController.rejectExpert);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:userId/profile', adminController.getUserProfile);
router.patch('/users/:userId/restrict', adminController.toggleUserRestriction);

// Counselor / Listener Management
router.post('/counselors', adminController.createCounselor);

// Wallet, Finance & Payouts
router.post('/wallet/credit', adminController.creditWallet);
router.get('/transactions', adminController.getTransactions);
router.get('/payouts', adminController.getPayouts);
router.patch('/payouts/:payoutId/approve', adminController.approvePayout);

// Content Management
router.post('/daily/content', adminController.createDailyContent);

// Session Control Matrix
router.get('/sessions/live', adminController.getLiveSessions);
router.get('/sessions', adminController.getAllSessions);
router.post('/sessions/:sessionId/assign', adminController.assignSession);
router.post('/sessions/:sessionId/terminate', adminController.terminateSession);

// SRS §9.6 — Red Alert System
router.get('/alerts', adminController.getRedAlerts);
router.patch('/alerts/:alertId/resolve', adminController.resolveRedAlert);

// SRS §1.3 — Early Bird Management
router.post('/early-bird/upload', adminController.uploadEarlyBirdCSV);

// MASTER DATA (DYNAMIC TRACKS)
router.get('/master/categories', adminController.getAllMasterCategories);
router.post('/master/categories', adminController.createMasterCategory);
router.patch('/master/categories/:id', adminController.updateMasterCategory);
router.delete('/master/categories/:id', adminController.deleteMasterCategory);
router.post('/master/skills', adminController.createMasterSkill);
router.patch('/master/skills/:id/toggle', adminController.toggleMasterSkill);
router.delete('/master/skills/:id', adminController.deleteMasterSkill);

module.exports = router;
