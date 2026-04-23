const prisma = require('../../config/prisma');

/**
 * NovaSathi Expert Service — Scalable Business Logic
 */
class ExpertService {
  /**
   * Calculate statistics for an expert for a specific date range
   */
  static async getStats(expertId, startDate, endDate = new Date()) {
    const stats = await prisma.chatSession.aggregate({
      where: { 
        expertId, 
        status: { in: ['COMPLETED', 'TERMINATED'] }, 
        endedAt: { gte: startDate, lte: endDate } 
      },
      _sum: { totalAmount: true, totalMinutes: true },
      _count: true,
    });

    return {
      earnings: stats._sum.totalAmount || 0,
      minutes: stats._sum.totalMinutes || 0,
      count: stats._count || 0
    };
  }

  /**
   * Get start of day for a given date (defaults to today)
   */
  static getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

module.exports = ExpertService;
