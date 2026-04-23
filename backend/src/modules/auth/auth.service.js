const prisma = require('../../config/prisma');
const NotificationEngine = require('../notification/notification.service');

/**
 * NovaSathi Authentication Service — Centralized User Provisioning
 */
class AuthService {
  /**
   * Provision a user after successful authentication (OTP or Firebase)
   * Handles: Early Bird status, Wallet creation, Welcome notifications
   */
  static async provisionUser(phone) {
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    
    let isNewUser = false;
    let user = await prisma.user.findUnique({ 
      where: { phone: cleanPhone },
      include: { expert: { select: { id: true, status: true } } }
    });

    const earlyBirdEntry = await prisma.earlyBirdWhitelist.findUnique({ where: { phone: cleanPhone } });
    const isEarlyBird = !!earlyBirdEntry;

    if (!user) {
      // First time user — Create record
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: `soul ${cleanPhone.slice(-4)}`,
          role: 'USER',
          isActive: true,
          isEarlyBird,
          signupBonusUsed: false,
          userTag: isEarlyBird ? 'Early_Bird_User' : 'General_User'
        },
        include: { expert: { select: { id: true, status: true } } }
      });

      // Initialize Wallet
      await prisma.wallet.create({ data: { userId: user.id } });

      isNewUser = true;
    } else {
      // Existing user — Sync Early Bird status if it changed
      if (user.isEarlyBird !== isEarlyBird) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            isEarlyBird,
            userTag: isEarlyBird ? 'Early_Bird_User' : 'General_User'
          },
          include: { expert: { select: { id: true, status: true } } }
        });
      }
      isNewUser = !user.signupBonusUsed;
    }

    // ─── SRS §3.2 — Daily Free Allocation Management ───
    const settings = await prisma.adminSettings.findUnique({ where: { id: 'global' } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAlloc = await prisma.freeAllocation.findUnique({
      where: { userId_allocDate: { userId: user.id, allocDate: today } }
    });

    if (!existingAlloc) {
      const shouldAllocate = isNewUser || settings?.freeMinutesResetType === 'daily' || isEarlyBird;
      
      if (shouldAllocate) {
        const chatMins = isEarlyBird ? 5 : (settings?.freeMinutesSignup || 5);
        const callMins = isEarlyBird ? 5 : 0;

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

    // ─── Notifications ───
    if (isNewUser) {
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

    return { user, isNewUser };
  }
}

module.exports = AuthService;
