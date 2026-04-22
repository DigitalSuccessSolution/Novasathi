require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');

const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { initializeSocket } = require('./socket');
const prisma = require('./config/prisma');
const globalErrorHandler = require('./middleware/errorHandler');

// Handlers
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const expertRoutes = require('./modules/expert/expert.routes');
const counselorRoutes = require('./modules/counselor/counselor.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');
const dailyRoutes = require('./modules/daily/daily.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const gigRoutes = require('./modules/gigs/gig.routes');

// Init 
const app = express();
const server = http.createServer(app);

// Global Middleware — CORS must come before Helmet
app.use(cors({ 
  origin: process.env.CLIENT_URL || '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false
}));
app.use(express.json({ limit: '10kb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression()); // Gzip compression
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Init WebSockets for real-time chat & billing
initializeSocket(server);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/experts', expertRoutes);
app.use('/api/v1/sos', counselorRoutes); // "Dil Ki Baat" routes
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/daily', dailyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/gigs', gigRoutes);

// Health check
app.get('/', (req, res) => {
  res.send(`
    <body style="background:#0a0a0a; color:#fff; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center;">
      <h1 style="color:#a855f7;">🌌 NovaSathi API Server</h1>
      <p style="color:#666;">The API server is online and operational.</p>
      <p style="margin-top:20px;"><a href="/health" style="color:#a855f7;">Check Operational Status</a></p>
    </body>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'NovaSathi API is completely operational.' });
});

// 404 handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`🚀 [BACKEND] NovaSathi running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  
  // Test DB connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Seed admin global settings if not exists
    await prisma.adminSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        freeMinutesDailySOS: 10,
        platformCommissionPercent: 30,
        freeMinutesSignup: 5,
      }
    });
    console.log('✅ Global admin settings validated');

  } catch (err) {
    console.error('❌ Failed to connect to DB', err.message);
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => process.exit(1));
});

module.exports = server;
