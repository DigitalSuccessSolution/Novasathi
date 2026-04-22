const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.get('/', walletController.getWallet);
router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/recharge', walletController.createRechargeOrder);
router.post('/recharge-test', walletController.rechargeTestBalance);
router.post('/verify-payment', walletController.verifyPayment);

module.exports = router;
