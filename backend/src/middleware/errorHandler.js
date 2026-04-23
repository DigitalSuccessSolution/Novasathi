const AppError = require('../utils/AppError');

const handlePrismaError = (err) => {
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return new AppError(`Duplicate value for ${field}. This already exists.`, 400);
  }
  if (err.code === 'P2025') {
    return new AppError('Record not found.', 404);
  }
  return new AppError('Database error occurred.', 500);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleTokenExpired = () => new AppError('Your session has expired. Please log in again.', 401);

/**
 * Global Error Handler
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for server monitoring
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ ERROR:', err);
  } else if (err.statusCode >= 500) {
    // In production, only log critical errors to avoid log spamming
    console.error(`🔥 [CRITICAL] ${req.method} ${req.originalUrl}:`, err.message);
    if (err.stack) console.error(err.stack);
  }

  let error = { ...err, message: err.message, stack: err.stack };

  // Prisma errors
  if (err.code?.startsWith('P')) error = handlePrismaError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleTokenExpired();

  // Production response
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.'
    });
  }

  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
