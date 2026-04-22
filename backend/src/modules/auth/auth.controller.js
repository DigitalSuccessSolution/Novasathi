const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const redis = require('../../config/redis');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');
const { admin } = require('../../config/firebase');
const { generateOTP } = require('../../utils/encryption');
const NotificationEngine = require('../notification/notification.service');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

/**
 * Helper to send token via Cookie (SRS §1.x)
 */
const sendCookieResponse = (user, statusCode, res, message, additionalData = {}) => {
  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.cookie('jwt', token, cookieOptions);
  
  // Refresh token valid for 30 days
  const refreshCookieOptions = { ...cookieOptions, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  res.status(statusCode).json(new ApiResponse(statusCode, {
    user,
    token, // Still sending token for client-side state, but cookie is master
    refreshToken,
    ...additionalData
  }, message));
};

/**
 * Send OTP to phone number
 * SRS §1.2 — Rate limit: 5 OTP/hour (enforced in routes via express-rate-limit)
 */
exports.sendOTP = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone || phone.length < 10) {
    return next(new AppError('Please provide a valid phone number.', 400));
  }

  // SRS §1.2 — Check if phone is locked out from too many failed OTP attempts
  const lockKey = `otp_lock:${phone}`;
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    const ttl = await redis.ttl(lockKey);
    return next(new AppError(`Too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`, 429));
  }

  // Generate OTP
  const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
  const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);

  // Upsert user with OTP
  await prisma.user.upsert({
    where: { phone },
    update: { otp, otpExpiry },
    create: { phone, otp, otpExpiry },
  });

  // Store in Redis for faster lookup (5 min TTL)
  await redis.setex(`otp:${phone}`, 300, otp);

  // In production, send via SMS gateway (MSG91/Twilio/Firebase)
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 [DEV ONLY] OTP for ${phone}: ${otp}`);
  }

  res.status(200).json(new ApiResponse(200, { phone }, 'OTP sent successfully'));
});

/**
 * Verify OTP & Login
 * SRS §1.2 — Lock after 3 failed attempts for 15 minutes
 * SRS §1.3 — Early Bird whitelist check
 * SRS §3.2 — Free allocation creation
 */
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required.', 400));
  }

  // SRS §1.2 — Check lockout
  const lockKey = `otp_lock:${phone}`;
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    const ttl = await redis.ttl(lockKey);
    return next(new AppError(`Account temporarily locked. Try again in ${Math.ceil(ttl / 60)} minutes.`, 429));
  }

  const user = await prisma.user.findUnique({ 
    where: { phone },
    include: { expert: { select: { status: true } } }
  });

  if (!user) {
    return next(new AppError('No account found with this phone number.', 404));
  }

  // Validate OTP
  if (user.otp !== otp || new Date() > new Date(user.otpExpiry)) {
    // SRS §1.2 — Track failed attempts in Redis
    const attemptsKey = `otp_attempts:${phone}`;
    const attempts = await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, 3600); // 1 hour window

    if (attempts >= 3) {
      // Lock for 15 minutes
      await redis.setex(lockKey, 900, 'locked');
      await redis.del(attemptsKey);
      return next(new AppError('Too many failed attempts. Account locked for 15 minutes.', 429));
    }

    return next(new AppError(`Invalid or expired OTP. ${3 - attempts} attempts remaining.`, 401));
  }

  // OTP is valid — clear attempt counter
  await redis.del(`otp_attempts:${phone}`);

  // Check if this is first login (signup bonus)
  const isNewUser = !user.signupBonusUsed;

  // SRS §1.3 — Early Bird whitelist check
  const earlyBirdEntry = await prisma.earlyBirdWhitelist.findUnique({ where: { phone } });
  const isEarlyBird = !!earlyBirdEntry;

  // Clear OTP & set early bird status
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { 
      otp: null, 
      otpExpiry: null,
      isEarlyBird,
      userTag: isEarlyBird ? 'Early_Bird_User' : 'General_User',
    },
  });

  // Create wallet if doesn't exist
  let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: user.id } });
  }

  // SRS §3.2 — Create or refresh daily free allocation
  const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAlloc = await prisma.freeAllocation.findUnique({
    where: { userId_allocDate: { userId: user.id, allocDate: today } }
  });

  if (!existingAlloc) {
    const shouldAllocate = isNewUser || 
      settings?.freeMinutesResetType === 'daily' || 
      isEarlyBird;

    if (shouldAllocate) {
      const chatMins = isEarlyBird ? 5 : (settings?.freeMinutesSignup || 5);
      const callMins = isEarlyBird ? 5 : 0; // Early birds get separate call minutes

      await prisma.freeAllocation.create({
        data: {
          userId: user.id,
          allocDate: today,
          chatMinutesTotal: chatMins,
          callMinutesTotal: callMins,
        }
      });
    }
  }

  // Signup bonus notification
  if (isNewUser) {
    await prisma.user.update({
      where: { id: user.id },
      data: { signupBonusUsed: true }
    });

    const bonusMsg = isEarlyBird 
      ? '🎉 Welcome Early Bird! You get 5 FREE chat + 5 FREE call minutes daily!'
      : '🎉 Welcome to NovaSathi! You\'ve received 5 free minutes to start.';

    await NotificationEngine.send({
      userId: user.id,
      title: 'welcome to novasathi!',
      message: bonusMsg.toLowerCase(),
      type: 'PROMO',
    });
  }

  // Issue tokens
  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in Redis
  await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  // Clear OTP from Redis
  await redis.del(`otp:${phone}`);

  // Issue tokens via cookies
  sendCookieResponse({
    id: updatedUser.id,
    phone: updatedUser.phone,
    name: updatedUser.name,
    role: updatedUser.role,
    avatar: updatedUser.avatar,
    isEarlyBird: updatedUser.isEarlyBird,
    userTag: updatedUser.userTag,
    isNewUser,
    serverStatus: user.expert?.status || (user.role === 'EXPERT' ? 'PENDING' : null),
  }, 200, res, 'Logged in successfully', {
    wallet: { balance: wallet.balance }
  });
});

/**
 * Refresh Access Token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  let { refreshToken } = req.body;
  if (!refreshToken && req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken) {
    return next(new AppError('Refresh token is required.', 400));
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Validate against Redis
  const storedToken = await redis.get(`refresh:${decoded.id}`);
  if (storedToken !== refreshToken) {
    return next(new AppError('Invalid refresh token. Please login again.', 401));
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.isActive) {
    return next(new AppError('User not found or deactivated.', 401));
  }

  // Fetch wallet for inclusion in response (required for Navbar state)
  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id }
  });

  // Rotate tokens via standard cookie helper
  sendCookieResponse({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    isEarlyBird: user.isEarlyBird,
    userTag: user.userTag,
    serverStatus: user.expert?.status || (user.role === 'EXPERT' ? 'PENDING' : null),
  }, 200, res, 'Token refreshed', {
    wallet: { balance: wallet?.balance || 0 }
  });
});

/**
 * Expert Password Login
 */
exports.loginExpert = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { expert: { select: { status: true } } }
  });
  if (!user || user.role !== 'EXPERT' || !user.password) {
    return next(new AppError('Invalid credentials or access level.', 401));
  }

  // Check password
  const bcrypt = require('bcryptjs');
  const isCorrect = await bcrypt.compare(password, user.password);
  if (!isCorrect) {
    return next(new AppError('Incorrect password.', 401));
  }

  // Issue tokens via cookies
  sendCookieResponse({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    serverStatus: user.expert?.status || 'PENDING',
  }, 200, res, 'Logged in successfully');
});

/**
 * Super Admin Password Login
 */
exports.loginAdmin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'ADMIN' || !user.password) {
    return next(new AppError('Unauthorized access levels or incorrect credentials.', 401));
  }

  const bcrypt = require('bcryptjs');
  const isCorrect = await bcrypt.compare(password, user.password);
  if (!isCorrect) {
    return next(new AppError('Incorrect password.', 401));
  }

  // Issue tokens via cookies
  sendCookieResponse({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
  }, 200, res, 'Command Center Access Granted. Welcome, Admin.');
});

/**
 * Super Admin Self-Registration (Environment Locked)
 */
exports.registerAdmin = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, secret } = req.body;

  // Basic security check to prevent public admin registration
  if (secret !== process.env.ADMIN_REGISTRATION_SECRET) {
    return next(new AppError('Insufficient administrative authorization secret.', 403));
  }

  if (!email || !password || !phone) {
    return next(new AppError('Email, phone and password are required.', 400));
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] }
  });

  if (existingUser) {
    return next(new AppError('User with this email or phone already exists.', 400));
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  res.status(201).json(new ApiResponse(201, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
    refreshToken
  }, 'Super Admin account initialized successfully.'));
});

/**
 * Expert Signup (Simple password-based)
 */
exports.signupExpert = catchAsync(async (req, res, next) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return next(new AppError('All fields (name, phone, email, password) are required.', 400));
  }

  // Check if phone or email already exists
  const existingPhone = await prisma.user.findFirst({ where: { phone } });
  if (existingPhone) {
    return next(new AppError('Phone number already exists. Please use a different number or login.', 400));
  }

  const existingEmail = await prisma.user.findFirst({ where: { email } });
  if (existingEmail) {
    return next(new AppError('Email address already exists. Please use a different email or login.', 400));
  }

  // Hash password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create User as EXPERT
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashedPassword,
      role: 'EXPERT',
      isActive: true,
      signupBonusUsed: true // Experts don't get user signup bonus
    }
  });

  // Create Wallet
  await prisma.wallet.create({ data: { userId: user.id } });

  // Create initial Expert profile (Required for dashboard/onboarding)
  await prisma.expert.create({
    data: {
      userId: user.id,
      displayName: name,
      status: 'PENDING',
    }
  });

  // Issue tokens
  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  res.status(201).json(new ApiResponse(201, {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      serverStatus: 'PENDING',
    },
    token,
    refreshToken
  }, 'Expert account created successfully. Welcome to the Sanctuary.'));
});

/**
 * Logout
 */
exports.logout = catchAsync(async (req, res) => {
  // Clear Refresh token from Redis if user is identified
  if (req.user) {
    await redis.del(`refresh:${req.user.id}`);
  }

  // Clear Cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.clearCookie('jwt', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * Firebase-based Login/Signup Flow
 * Verifies ID token from Firebase Frontend and issues an internal JWT
 */
exports.firebaseLogin = catchAsync(async (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken) {
        return next(new AppError('Firebase ID Token is required.', 400));
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { phone_number: phone } = decodedToken;

        if (!phone) {
            return next(new AppError('Phone number missing in Firebase token.', 400));
        }

        // Clean phone number (remove + and spaces)
        const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');

        let user = await prisma.user.findUnique({ 
            where: { phone: cleanPhone },
            include: { expert: { select: { status: true } } }
        });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            // Create New User
            user = await prisma.user.create({
                data: {
                    phone: cleanPhone,
                    name: `soul ${cleanPhone.slice(-4)}`,
                    role: 'USER',
                    isActive: true,
                    signupBonusUsed: false
                }
            });

            // Create Wallet
            await prisma.wallet.create({ data: { userId: user.id } });

            // Dispatch Welcome Notification
            await NotificationEngine.send({
                userId: user.id,
                title: 'welcome to novasathi!',
                message: 'your journey into the sanctuary begins now. explore the cosmic flow.',
                type: 'SYSTEM',
            });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

        // Issue tokens via cookies
        sendCookieResponse({
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            isNewUser,
            serverStatus: user.expert?.status || (user.role === 'EXPERT' ? 'PENDING' : null),
        }, 200, res, 'Authenticated via Firebase successfully', {
            wallet: { balance: wallet?.balance || 0 }
        });

    } catch (err) {
        console.error('Firebase Verification Error:', err);
        return next(new AppError('Invalid or expired Firebase token.', 401));
    }
});
