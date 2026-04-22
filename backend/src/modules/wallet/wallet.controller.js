const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const NotificationEngine = require('../notification/notification.service');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

/**
 * Get wallet balance + recent transactions
 */
exports.getWallet = catchAsync(async (req, res) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId: req.user.id },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: req.user.id },
      include: { transactions: true },
    });
  }

  res.status(200).json(new ApiResponse(200, wallet));
});

/**
 * Create Razorpay recharge order
 */
exports.createRechargeOrder = catchAsync(async (req, res, next) => {
  const { amount } = req.body;

  const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  const minRecharge = settings?.minRechargeAmount || 50;

  if (!amount || parseFloat(amount) < minRecharge) {
    return next(new AppError(`Minimum recharge is ₹${minRecharge}`, 400));
  }

  let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: req.user.id } });
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(parseFloat(amount) * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);
  const orderId = razorpayOrder.id;

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: parseFloat(amount),
      type: 'RECHARGE',
      status: 'PENDING',
      description: `Wallet recharge of ₹${amount}`,
      razorpayOrderId: orderId,
    },
  });

  res.status(201).json(new ApiResponse(201, {
    orderId,
    amount: parseFloat(amount),
    currency: 'INR',
    transactionId: transaction.id,
    key: process.env.RAZORPAY_KEY_ID,
  }, 'Recharge order created'));
});

/**
 * Verify Razorpay payment webhook
 */
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return next(new AppError('Payment verification data missing', 400));
  }

  // Verify signature (in production, use actual Razorpay webhook secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  // In development, skip signature check
  const isValid = process.env.NODE_ENV === 'development' || expectedSignature === razorpaySignature;

  if (!isValid) {
    return next(new AppError('Payment verification failed. Invalid signature.', 400));
  }

  // Find the transaction
  const transaction = await prisma.walletTransaction.findUnique({
    where: { razorpayOrderId },
    include: { wallet: true },
  });

  if (!transaction) return next(new AppError('Transaction not found', 404));
  if (transaction.status === 'COMPLETED') {
    return res.status(200).json(new ApiResponse(200, transaction, 'Already processed'));
  }

  // Update transaction
  await prisma.walletTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  // Credit wallet
  await prisma.wallet.update({
    where: { id: transaction.walletId },
    data: {
      balance: { increment: transaction.amount },
      totalRecharged: { increment: transaction.amount },
    },
  });

  // ─── SRS §5 — History Unlocking ─────────────────────────
  if (transaction.chatSessionId) {
    await prisma.chatSession.update({
      where: { id: transaction.chatSessionId },
      data: { isUnlocked: true, unlockedAt: new Date() }
    });
    
    // Notify user about unlocked history
    await NotificationEngine.send({
      userId: transaction.wallet.userId,
      title: '📖 history unlocked',
      message: 'your session transcript is now available for review.',
      type: 'CHAT',
    });
  }

  // Notify user about recharge
  await NotificationEngine.send({
    userId: transaction.wallet.userId,
    title: '💰 wallet recharged',
    message: `₹${transaction.amount} has been added to your wallet.`,
    type: 'RECHARGE',
  });

  res.status(200).json(new ApiResponse(200, { 
    amount: transaction.amount, 
    isUnlocked: !!transaction.chatSessionId 
  }, 'Payment verified successfully'));
});

/**
 * Deduct from wallet (internal use — called by chat billing)
 */
exports.deductBalance = async (userId, amount, description, chatSessionId) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance < amount) {
    throw new AppError('Insufficient wallet balance', 402);
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: amount },
      totalSpent: { increment: amount },
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: 'DEDUCTION',
      status: 'COMPLETED',
      description,
      chatSessionId,
    },
  });

  return wallet.balance - amount;
};

/**
 * Get wallet balance only (lightweight)
 */
exports.getBalance = catchAsync(async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.user.id },
    select: { balance: true },
  });

  res.status(200).json(new ApiResponse(200, { balance: wallet?.balance || 0 }));
});

/**
 * Transaction history with pagination
 */
exports.getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) return res.status(200).json(new ApiResponse(200, { transactions: [], total: 0 }));

  const where = { walletId: wallet.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  res.status(200).json(new ApiResponse(200, { transactions, total, page: parseInt(page) }));
});

/**
 * Test Recharge (Dev Use Only) - Add ₹500 Test Jewels
 */
exports.rechargeTestBalance = catchAsync(async (req, res, next) => {
  // Only allow in development or for specific users if needed
  // if (process.env.NODE_ENV !== 'development') return next(new AppError('Forbidden in production', 403));

  let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: req.user.id, balance: 500 } });
  } else {
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: 500 }, totalRecharged: { increment: 500 } }
    });
  }

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: 500,
      type: 'RECHARGE',
      status: 'COMPLETED',
      description: '✨ Divine Test Infusion (Fake Money)',
    },
  });

  res.status(200).json(new ApiResponse(200, { balance: (wallet.balance || 0) + 500 }, '✨ 500 Test Jewels infused into your wallet!'));
});
