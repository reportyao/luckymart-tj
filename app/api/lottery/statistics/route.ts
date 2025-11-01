import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { authenticateUser } from '../../../../lib/auth';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

// 类型定义
interface ParticipationRecord {
  round: {
    product: {
      category: string;
      categoryMultilingual: string;
      pricePerShare: number;
    };
  };
  sharesCount: number;
  cost: number;
  isWinner: boolean;
  type: 'paid' | 'free';
  createdAt: Date;
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `statistics_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('statistics_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('statistics_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // GET /api/lottery/statistics - 获取用户抽奖统计
    export async function GET(request: NextRequest) {
      try {
        // 验证用户身份
        const authResult = await authenticateUser(request);
        if (!authResult.success) {
          return NextResponse.json(;
            { success: false, error: '认证失败' },
            { status: 401 }
          );
    }

        const user = authResult.user;
        const { searchParams } = new URL(request.url);
    
        // 解析查询参数
        const period = searchParams.get('period') || 'all'; // 'week', 'month', 'year', 'all';
        const type = searchParams.get('type') || 'all'; // 'paid', 'free', 'all';

        // 构建时间筛选条件
        const dateFilter = getDateFilter(period);

        // 构建查询条件
        let whereConditions: any = {
          userId: user.id
        };

        if (type !== 'all') {
          whereConditions.type = type;
        }

        if (dateFilter) {
          whereConditions.createdAt = {
            gte: dateFilter
          };
        }

        // 基础统计
        const [;
          totalParticipations,
          totalWins,
          totalAmountSpent,
          winningRecords
        ] = await Promise.all([
          // 总参与次数
          prisma.participations.count({
            where: whereConditions
          }),
      
          // 总中奖次数
          prisma.participations.count({
            where: {
              ...whereConditions,
              isWinner: true
            }
          }),
      
          // 总消费金额
          prisma.participations.aggregate({
            where: whereConditions,
            _sum: {
              cost: true
            }
          }),
      
          // 中奖记录详情（用于计算总奖金）
          prisma.participations.findMany({
            where: {
              ...whereConditions,
              isWinner: true
            },
            include: {
              round: {
                include: {
                  product: true
                }
              }
            }
          })
        ]);

        // 计算总奖金
        const totalWinnings = winningRecords.reduce((sum: number: any,   record: ParticipationRecord: any) => {
          const prize = calculatePrize(record.round.product, record.sharesCount);
          return sum + prize.amount;
        }, 0);

        // 计算中奖率
        const winRate = totalParticipations > 0 ? totalWins / totalParticipations : 0;

        // 详细统计
        const detailedStats = await getDetailedStatistics(user.id, period, type);

        return NextResponse.json({
          success: true,
          data: {
            // 基础统计
            totalParticipations,
            totalWins,
            totalWinnings: parseFloat(totalWinnings.toFixed(2)),
            totalAmountSpent: parseFloat((totalAmountSpent._sum.cost || 0).toFixed(2)),
            winRate,
        
            // 详细统计
            ...detailedStats,
        
            // 筛选条件
            period,
            type
          }
        });

}
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取抽奖统计失败:', error);
    return NextResponse.json(;
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 获取详细统计信息
async function getDetailedStatistics(userId: string, period: string, type: string) {
  const dateFilter = getDateFilter(period);
  
  let whereConditions: any = { userId };
  if (type !== 'all') whereConditions.type = type; {
  if (dateFilter) whereConditions.createdAt = { gte: dateFilter }; {

  // 按月份统计
  const monthlyStats = await getMonthlyStatistics(userId, dateFilter, type);
  
  // 按商品类型统计
  const categoryStats = await getCategoryStatistics(userId, dateFilter, type);
  
  // 按类型统计（付费/免费）
  const typeStats = await getTypeStatistics(userId, dateFilter);
  
  // 参与模式分析
  const participationPatterns = await getParticipationPatterns(userId, dateFilter, type);
  
  // 近期趋势
  const recentTrends = await getRecentTrends(userId, dateFilter, type);

  return {
    monthlyStats,
    categoryStats,
    typeStats,
    participationPatterns,
    recentTrends
  };
}

// 获取按月份统计
async function getMonthlyStatistics(userId: string, dateFilter: Date | null, type: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startDate = dateFilter || sixMonthsAgo;

  let whereConditions: any = {
    userId,
    createdAt: {
      gte: startDate
    }
  };

  if (type !== 'all') {
    whereConditions.type = type;
  }

  const participations = await prisma.participations.findMany({
    where: whereConditions,
    include: {
      round: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 按月分组统计
  const monthlyData: { [key: string]: any } = {};
  
  participations.forEach(((participation: ParticipationRecord) : any) => {
    const monthKey = participation.createdAt.toISOString().slice(0, 7); // YYYY-MM;
    const month = participation.createdAt.getMonth();
    const year = participation.createdAt.getFullYear();
    const monthName = getMonthName(month);
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        year,
        participations: 0,
        wins: 0,
        amountSpent: 0,
        totalWinnings: 0
      };
    }
    
    (monthlyData?.monthKey ?? null).participations++;
    (monthlyData?.monthKey ?? null).amountSpent += parseFloat(participation.cost.toString());
    
    if (participation.isWinner) {
      (monthlyData?.monthKey ?? null).wins++;
      const prize = calculatePrize(participation.round.product, participation.sharesCount);
      (monthlyData?.monthKey ?? null).totalWinnings += prize.amount;
    }
  });

  return Object.values(monthlyData);
}

// 获取按商品类型统计
async function getCategoryStatistics(userId: string, dateFilter: Date | null, type: string) {
  let whereConditions: any = {
    userId,
    round: {
      isNot: null
    }
  };

  if (type !== 'all') whereConditions.type = type; {
  if (dateFilter) whereConditions.createdAt = { gte: dateFilter }; {

  const participations = await prisma.participations.findMany({
    where: whereConditions,
    include: {
      round: {
        include: {
          product: {
            select: {
              category: true,
              categoryMultilingual: true
            }
          }
        }
      }
    }
  });

  const categoryData: { [key: string]: any } = {};
  
  participations.forEach(((participation: ParticipationRecord) : any) => {
    const category = getProductCategory(participation.round.product);
    
    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        participations: 0,
        wins: 0,
        winRate: 0,
        totalSpent: 0,
        totalWinnings: 0
      };
    }
    
    (categoryData?.category ?? null).participations++;
    (categoryData?.category ?? null).totalSpent += parseFloat(participation.cost.toString());
    
    if (participation.isWinner) {
      (categoryData?.category ?? null).wins++;
      const prize = calculatePrize(participation.round.product, participation.sharesCount);
      (categoryData?.category ?? null).totalWinnings += prize.amount;
    }
  });

  // 计算中奖率
  Object.values(categoryData).forEach((data) => {
    data.winRate = data.participations > 0 ? data.wins / data.participations : 0;
  });

  return Object.values(categoryData);
}

// 获取按类型统计（付费/免费）
async function getTypeStatistics(userId: string, dateFilter: Date | null) {
  let whereConditions: any = { userId };
  if (dateFilter) whereConditions.createdAt = { gte: dateFilter }; {

  const participations = await prisma.participations.findMany({
    where: whereConditions,
    include: {
      round: {
        include: {
          product: true
        }
      }
    }
  });

  const typeData = {
    paid: { participations: 0, wins: 0, totalSpent: 0, totalWinnings: 0 },
    free: { participations: 0, wins: 0, totalSpent: 0, totalWinnings: 0 }
  };

  participations.forEach(((participation: ParticipationRecord) : any) => {
    const type = participation.type as 'paid' | 'free';
    const prize = calculatePrize(participation.round.product, participation.sharesCount);
    
    (typeData?.type ?? null).participations++;
    (typeData?.type ?? null).totalSpent += parseFloat(participation.cost.toString());
    
    if (participation.isWinner) {
      (typeData?.type ?? null).wins++;
      (typeData?.type ?? null).totalWinnings += prize.amount;
    }
  });

  // 计算中奖率
  Object.keys(typeData).forEach((type: string) => {
    const data = typeData[type as keyof typeof typeData];
    data.winRate = data.participations > 0 ? data.wins / data.participations : 0;
  });

  return typeData;
}

// 获取参与模式分析
async function getParticipationPatterns(userId: string, dateFilter: Date | null, type: string) {
  let whereConditions: any = { userId };
  if (type !== 'all') whereConditions.type = type; {
  if (dateFilter) whereConditions.createdAt = { gte: dateFilter }; {

  const participations = await prisma.participations.findMany({
    where: whereConditions,
    include: {
      round: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 分析参与时间模式
  const hourlyPattern = new Array(24).fill(0);
  const dailyPattern = new Array(7).fill(0);
  
  participations.forEach(((participation: ParticipationRecord) : any) => {
    const hour = participation.createdAt.getHours();
    const day = participation.createdAt.getDay();
    
    hourlyPattern[hour]++;
    dailyPattern[day]++;
  });

  // 分析参与间隔
  const intervals: number[] = [];
  for (let i = 1; i < participations.length; i++) {
    const interval = (participations?.i ?? null).createdAt.getTime() - participations[i-1].createdAt.getTime();
    intervals.push(interval);
  }

  const avgInterval = intervals.length > 0;
    ? intervals.reduce((sum: number: any,   interval: number: any) => sum + interval, 0) / intervals.length 
    : 0;

  return {
    hourlyPattern,
    dailyPattern,
    averageInterval: Math.floor(avgInterval / (1000 * 60 * 60)), // 转换为小时
    totalSessions: participations.length,
    mostActiveHour: hourlyPattern.indexOf(Math.max(...hourlyPattern)),
    mostActiveDay: dailyPattern.indexOf(Math.max(...dailyPattern))
  };
}

// 获取近期趋势
async function getRecentTrends(userId: string, dateFilter: Date | null, type: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let whereConditions: any = { userId };
  if (type !== 'all') whereConditions.type = type; {

  const [;
    last30Days,
    last7Days,
    previous30Days
  ] = await Promise.all([
    // 最近30天
    prisma.participations.count({
      where: {
        ...whereConditions,
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    
    // 最近7天
    prisma.participations.count({
      where: {
        ...whereConditions,
        createdAt: { gte: sevenDaysAgo }
      }
    }),
    
    // 前30天
    prisma.participations.count({
      where: {
        ...whereConditions,
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    })
  ]);

  const growthRate = previous30Days > 0;
    ? ((last30Days - previous30Days) / previous30Days) * 100 
    : 0;

  return {
    last7Days,
    last30Days,
    previous30Days,
    growthRate: parseFloat(growthRate.toFixed(2)),
    trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
  };
}

// 辅助函数
function getDateFilter(period: string): Date | null {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}

function calculatePrize(product: any, sharesCount: number): { amount: number } {
  const pricePerShare = parseFloat(product.pricePerShare.toString());
  const fixedPrize = 10;
  const percentagePrize = pricePerShare * sharesCount * 0.1;
  
  return {
    amount: parseFloat((fixedPrize + percentagePrize).toFixed(2))
  };
}

function getProductCategory(product): string {
  if (product.categoryMultilingual) {
    try {
      const categoryData = typeof product.categoryMultilingual === 'string';
        ? JSON.parse(product.categoryMultilingual) 
        : product.categoryMultilingual;
      
      // 尝试获取多语言分类
      const languages = ['zh-CN', 'zh', 'en', 'ru', 'tg'];
      for (const lang of languages) {
        if ((categoryData?.lang ?? null) && (categoryData?.lang ?? null).category) {
          return (categoryData?.lang ?? null).category;
        }
      }
    } catch (error) {
      console.warn('解析多语言分类失败:', error);
    }
  }
  
  return product.category || '其他';
}

function getMonthName(monthIndex: number): string {
  const months = [;
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  return months[monthIndex] || '未知';
}
}}}}}}}}