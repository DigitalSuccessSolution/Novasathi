const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Protect routes — validates JWT and attaches user to req
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Extract token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please authenticate first.', 401));
  }

  // 2. Verify
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired session. Please login again.', 401));
  }

  // 3. Check user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatar: true,
      currentMood: true,
      zodiacSign: true,
      freeMinutesUsed: true,
      signupBonusUsed: true,
      lastFreeReset: true,
    }
  });

  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', 403));
  }

  req.user = user;
  next();
});

/**
 * Restrict access to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Optional auth — doesn't fail if no token, just sets req.user if valid
 */
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user?.isActive) req.user = user;
    } catch {
      // Token invalid — continue as guest
    }
  }
  next();
});
