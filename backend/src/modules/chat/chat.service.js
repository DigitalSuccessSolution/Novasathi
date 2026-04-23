const prisma = require('../../config/prisma');
const AppError = require('../../utils/AppError');

/**
 * NovaSathi Chat Service — Scalable Session & Billing Logic
 */
class ChatService {
  /**
   * Perform atomic per-minute billing for a session
   */
  static async billSessionMinute(sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { 
        user: { include: { wallet: true } },
        expert: true,
        counselor: true
      }
    });

    if (!session || session.status !== 'ACTIVE') return null;

    const price = session.pricePerMinute || 10;
    const userWallet = session.user?.wallet;

    if (!userWallet || userWallet.balance < price) {
      console.warn(`🚨 [BILLING] Insufficient balance for session ${sessionId}. Terminating.`);
      // Terminate session if balance insufficient
      const updatedSess = await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: 'TERMINATED', endedAt: new Date() }
      });

      // Release expert/counselor
      if (session.expertId) {
        await prisma.expert.update({
          where: { id: session.expertId },
          data: { onlineStatus: 'available', isOnline: true }
        });
      } else if (session.counselorId) {
        await prisma.counselor.update({
          where: { id: session.counselorId },
          data: { isOnline: true }
        });
      }

      // Broadcast status
      try {
        const { broadcastExpertStatus } = require('../../socket/index');
        if (broadcastExpertStatus && session.expertId) {
            broadcastExpertStatus(session.expertId, 'available');
        }
      } catch (err) {}

      return updatedSess;
    }

    // Prepare transaction updates
    const updates = [
      // 1. Seeker Wallet Deduction
      prisma.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: price }, totalSpent: { increment: price } }
      }),
      // 2. Session Billing Stats
      prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastBilledAt: new Date(), totalAmount: { increment: price }, totalMinutes: { increment: 1 } }
      }),
      // 3. Deduction Transaction Record
      prisma.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          amount: price,
          type: 'DEDUCTION',
          status: 'COMPLETED',
          description: `1 min consultation (${session.type})`,
          chatSessionId: session.id,
        }
      })
    ];

    // 4. Partner Earnings Update
    if (session.expertId) {
      // Fetch expert's user wallet to credit them
      const expertUser = await prisma.user.findUnique({
        where: { id: session.expert.userId },
        include: { wallet: true }
      });

      if (expertUser?.wallet) {
        updates.push(
          // Credit Expert Wallet
          prisma.wallet.update({
            where: { id: expertUser.wallet.id },
            data: { balance: { increment: price } }
          }),
          // Create Credit Transaction
          prisma.walletTransaction.create({
            data: {
              walletId: expertUser.wallet.id,
              amount: price,
              type: 'CREDIT',
              status: 'COMPLETED',
              description: `Earnings: 1m ${session.type} session`,
              chatSessionId: session.id,
            }
          })
        );
      }

      updates.push(
        prisma.expert.update({
          where: { id: session.expertId },
          data: { 
            totalEarnings: { increment: price },
            totalMinutes: { increment: 1 }
          }
        })
      );
    } else if (session.counselorId) {
      // Similar logic for counselor if they have a wallet (they always do)
      const counselorUser = await prisma.user.findUnique({
        where: { id: session.counselor.userId },
        include: { wallet: true }
      });

      if (counselorUser?.wallet) {
        updates.push(
          prisma.wallet.update({
            where: { id: counselorUser.wallet.id },
            data: { balance: { increment: price } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: counselorUser.wallet.id,
              amount: price,
              type: 'CREDIT',
              status: 'COMPLETED',
              description: `Counseling Earnings: 1m ${session.type}`,
              chatSessionId: session.id,
            }
          })
        );
      }

      updates.push(
        prisma.counselor.update({
          where: { id: session.counselorId },
          data: { totalMinutes: { increment: 1 } }
        })
      );
    }

    // Execute atomic per-minute billing transaction
    console.log(`💰 [BILLING] Deducting ₹${price} from user ${session.userId} and crediting partner for session ${sessionId}`);
    return await prisma.$transaction(updates);
  }

  /**
   * Finalize and end a session
   */
  static async endSession(sessionId) {
    const session = await prisma.chatSession.findUnique({ 
      where: { id: sessionId },
      include: { expert: true }
    });

    if (!session || session.status === 'COMPLETED' || session.status === 'TERMINATED') {
      return session;
    }

    const endedAt = new Date();
    const startedAt = session.startedAt || session.createdAt;
    const durationMs = endedAt - new Date(startedAt);
    const totalMinutes = Math.ceil(durationMs / 60000);
    const totalAmount = session.isFreeSession ? 0 : totalMinutes * (session.pricePerMinute || 10);

    const alreadyBilled = session.totalAmount || 0;
    const remainingToBill = Math.max(0, totalAmount - alreadyBilled);

    // Update session
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt,
        totalMinutes,
        totalAmount,
      },
    });

    // Release expert
    await prisma.expert.update({
      where: { id: session.expertId },
      data: { onlineStatus: 'available', isOnline: true }
    });

    // Broadcast status to marketplace
    try {
      const { broadcastExpertStatus } = require('../../socket/index');
      if (broadcastExpertStatus) {
        broadcastExpertStatus(session.expertId, 'available');
      }
    } catch (err) {
      console.error("🌌 [SOCKET_BROADCAST_ERROR]", err.message);
    }

    // Handle remaining billing if any
    if (!session.isFreeSession && remainingToBill > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
      if (wallet) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: remainingToBill }, totalSpent: { increment: remainingToBill } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: remainingToBill,
              type: 'DEDUCTION',
              status: 'COMPLETED',
              description: `Final settlement: ${totalMinutes}m ${session.type}`,
              chatSessionId: sessionId,
            },
          }),
        ]);
      }
    }

    // Increment expert/counselor session counts
    const alreadyBilledMinutes = session.totalMinutes || 0;
    const remainingMinutes = Math.max(0, totalMinutes - alreadyBilledMinutes);

    if (session.expertId) {
      await prisma.expert.update({
        where: { id: session.expertId },
        data: {
          totalSessions: { increment: 1 },
          totalMinutes: { increment: remainingMinutes },
          totalEarnings: { increment: session.isFreeSession ? 0 : remainingToBill },
        },
      });
    } else if (session.counselorId) {
      await prisma.counselor.update({
        where: { id: session.counselorId },
        data: {
          totalSessions: { increment: 1 },
          totalMinutes: { increment: remainingMinutes },
        }
      });
    }

    return updatedSession;
  }
}

module.exports = ChatService;
