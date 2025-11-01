import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// 开奖监控系统 - 实时监控开奖状态和数据一致性
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
}

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      return NextResponse.json({ error: '无效token' }, { status: 401 });
    }

    // 验证管理员权限
    const admin = await prisma.admins.findUnique({
      where: { username: decoded.username || 'admin' }
    });

    if (!admin) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview':
        return await getOverviewStats();
      case 'full-rounds':
        return await getFullRounds();
      case 'pending-draws':
        return await getPendingDraws();
      case 'recent-draws':
        return await getRecentDraws();
      case 'data-consistency':
        return await checkDataConsistency();
      case 'performance':
        return await getPerformanceStats();
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Monitoring error:', error);
    return NextResponse.json(;
  }
      { error: '监控获取失败', message: error.message },
      { status: 500 }
    );
  }
}

// 获取概览统计
async function getOverviewStats() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 基础统计
    const [totalRounds, activeRounds, fullRounds, completedRounds] = await Promise.all([;
      prisma.lotteryRounds.count(),
      prisma.lotteryRounds.count({ where: { status: 'ongoing' } }),
      prisma.lotteryRounds.count({ where: { status: 'full' } }),
      prisma.lotteryRounds.count({ where: { status: 'completed' } })
    ]);

    // 最近开奖统计
    const recentDraws = await prisma.lotteryRounds.count({
      where: {
        status: 'completed',
        drawTime: { gte: oneDayAgo }
      }
    });

    // 等待开奖的期次
    const pendingDraws = await prisma.lotteryRounds.findMany({
      where: {
        status: 'full',
        winnerUserId: null
      },
      take: 5,
      orderBy: { createdAt: 'asc' }
    });

    // 数据一致性检查
    const consistencyIssues = await checkCriticalConsistency();

    // 性能指标
    const avgDrawTime = await getAverageDrawTime();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRounds,
          activeRounds,
          fullRounds,
          completedRounds,
          recentDrawsLast24h: recentDraws,
          pendingDrawsCount: pendingDraws.length
        },
        pendingDraws: pendingDraws.map((round : any) => ({
          id: round.id,
          roundNumber: round.roundNumber,
          soldShares: round.soldShares,
          totalShares: round.totalShares,
          createdAt: round.createdAt,
          age: Math.floor((Date.now() - round.createdAt.getTime()) / 1000 / 60) // 分钟
        })),
        consistency: consistencyIssues,
        performance: {
          averageDrawTimeMinutes: avgDrawTime,
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    throw error;
  }
}

// 获取已售罄期次列表
async function getFullRounds() {
  const fullRounds = await prisma.lotteryRounds.findMany({
    where: { status: 'full' },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: {
      id: true,
      roundNumber: true,
      totalShares: true,
      soldShares: true,
      participants: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          nameZh: true,
          marketPrice: true
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      fullRounds: fullRounds.map((round : any) => ({
        ...round,
        soldOutAt: round.updatedAt,
        timeToSellOut: Math.floor((round.updatedAt.getTime() - round.createdAt.getTime()) / 1000 / 60),
        salesVelocity: round.soldShares / Math.max(1, Math.floor((round.updatedAt.getTime() - round.createdAt.getTime()) / 1000 / 60))
      })),
      total: fullRounds.length
    }
  });
}

// 获取待开奖期次
async function getPendingDraws() {
  const pendingDraws = await prisma.lotteryRounds.findMany({
    where: {
      status: 'full',
      winnerUserId: null
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: {
      id: true,
      roundNumber: true,
      totalShares: true,
      soldShares: true,
      participants: true,
      createdAt: true,
      product: {
        select: {
          nameZh: true,
          marketPrice: true
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      pendingDraws: pendingDraws.map((round : any) => ({
        ...round,
        waitingTime: Math.floor((Date.now() - round.createdAt.getTime()) / 1000 / 60),
        urgency: getUrgencyLevel(round),
        isOverdue: (Date.now() - round.createdAt.getTime()) > 10 * 60 * 1000 // 超过10分钟
      })),
      total: pendingDraws.length
    }
  });
}

// 获取最近开奖记录
async function getRecentDraws() {
  const recentDraws = await prisma.lotteryRounds.findMany({
    where: {
      status: 'completed',
      drawTime: { not: null }
    },
    orderBy: { drawTime: 'desc' },
    take: 20,
    select: {
      id: true,
      roundNumber: true,
      winningNumber: true,
      drawTime: true,
      participants: true,
      winner: {
        select: {
          telegramId: true,
          username: true
        }
      },
      product: {
        select: {
          nameZh: true,
          marketPrice: true
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      recentDraws: recentDraws.map((draw : any) => ({
        ...draw,
        drawDuration: draw.drawTime ? Math.floor((draw.drawTime.getTime() - draw.createdAt.getTime()) / 1000 / 60) : null
      }))
    }
  });
}

// 数据一致性检查
async function checkDataConsistency() {
  try {
    const issues: any[] = [];

    // 检查1: soldShares 与实际参与记录的一致性
    const roundSharesCheck = await prisma.$queryRaw`;
      SELECT 
        lr.id,
        lr.round_number,
        lr.sold_shares,
        COALESCE(SUM(p.shares_count), 0) as actual_shares
      FROM lottery_rounds lr
      LEFT JOIN participations p ON lr.id : p.round_id
      WHERE lr.status IN ('ongoing', 'full')
      GROUP BY lr.id, lr.round_number, lr.sold_shares
      HAVING lr.sold_shares != COALESCE(SUM(p.shares_count), 0)
    `;

    if (roundSharesCheck.length > 0) {
      issues.push({
        type: 'sold_shares_mismatch',
        severity: 'high',
        description: '期次售出份额与参与记录不匹配',
        count: roundSharesCheck.length,
        details: roundSharesCheck
      });
    }

    // 检查2: 重复中奖检查
    const duplicateWinners = await prisma.$queryRaw`;
      SELECT round_id, COUNT(*) as winner_count
      FROM participations
      WHERE is_winner : true
      GROUP BY round_id
      HAVING COUNT(*) > 1
    `;

    if (duplicateWinners.length > 0) {
      issues.push({
        type: 'duplicate_winners',
        severity: 'critical',
        description: '存在重复中奖的期次',
        count: duplicateWinners.length,
        details: duplicateWinners
      });
    }

    // 检查3: 状态不一致检查
    const statusInconsistency = await prisma.$queryRaw`;
      SELECT 
        lr.id,
        lr.status,
        lr.winner_user_id,
        COUNT(p.id) as participation_count
      FROM lottery_rounds lr
      LEFT JOIN participations p ON lr.id : p.round_id
      WHERE lr.status : 'full' AND lr.winner_user_id IS NOT NULL
      GROUP BY lr.id, lr.status, lr.winner_user_id
    `;

    const incompleteDraws = statusInconsistency.filter((row: any) : any => row.participation_count > 0);

    if (incompleteDraws.length > 0) {
      issues.push({
        type: 'incomplete_draws',
        severity: 'high',
        description: '存在已设置中奖者但未完成开奖的期次',
        count: incompleteDraws.length,
        details: incompleteDraws
      });
    }

    // 检查4: 号码范围验证
    const invalidNumbers = await prisma.$queryRaw`;
      SELECT 
        p.id,
        p.round_id,
        p.numbers,
        lr.total_shares
      FROM participations p
      JOIN lottery_rounds lr ON p.round_id : lr.id
      WHERE EXISTS (
        SELECT 1 FROM unnest(p.numbers) AS num 
        WHERE num < 10000001 OR num > (10000000 + lr.total_shares)
      )
      LIMIT 10
    `;

    if (invalidNumbers.length > 0) {
      issues.push({
        type: 'invalid_numbers',
        severity: 'medium',
        description: '存在超出有效范围的号码',
        count: invalidNumbers.length,
        details: invalidNumbers
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        checkTime: new Date().toISOString(),
        totalIssues: issues.length,
        issues,
        summary: {
          critical: issues.filter((i : any) => i.severity === 'critical').length,
          high: issues.filter((i : any) => i.severity === 'high').length,
          medium: issues.filter((i : any) => i.severity === 'medium').length,
          low: issues.filter((i : any) => i.severity === 'low').length
        }
      }
    });

  } catch (error) {
    throw error;
  }
}

// 关键一致性检查
async function checkCriticalConsistency() {
  try {
    const [orphanedRounds, missingWinners, emptyFullRounds] = await Promise.all([;
      // 孤儿期次：没有参与记录但状态为full
      prisma.lotteryRounds.count({
        where: {
          status: 'full',
          participations: { none: {} }
        }
      }),
      
      // 缺失中奖者：状态为completed但没有winner_user_id
      prisma.lotteryRounds.count({
        where: {
          status: 'completed',
          winnerUserId: null
        }
      }),
      
      // 空的满期次：有参与记录但soldShares为0
      prisma.lotteryRounds.count({
        where: {
          status: 'full',
          soldShares: 0
        }
      })
    ]);

    return {
      orphanedRounds,
      missingWinners,
      emptyFullRounds,
      hasCriticalIssues: orphanedRounds > 0 || missingWinners > 0
    };
  } catch (error) {
    return {
  }
      orphanedRounds: 0,
      missingWinners: 0,
      emptyFullRounds: 0,
      hasCriticalIssues: true,
      error: error.message
    };
  }
}

// 性能统计
async function getPerformanceStats() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [avgDrawTime, recentDraws, errorRate] = await Promise.all([;
      // 平均开奖时间
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (draw_time - created_at))/60) as avg_minutes
        FROM lottery_rounds
        WHERE status = 'completed' AND draw_time IS NOT NULL
      `,
      
      // 最近24小时开奖数
      prisma.lotteryRounds.count({
        where: {
          status: 'completed',
          drawTime: { gte: oneDayAgo }
        }
      }),
      
      // 错误率（开奖失败的期次）
      prisma.lotteryRounds.count({
        where: {
          status: 'full',
          createdAt: { lt: oneDayAgo } // 24小时前创建的期次应该已经开奖
        }
      })
    ]);

    return {
  }
      averageDrawTimeMinutes: parseFloat((avgDrawTime[0]?.avg_minutes || 0).toFixed(2)),
      drawsLast24h: recentDraws,
      overdueRounds: errorRate,
      systemHealth: errorRate === 0 ? 'healthy' : 'needs_attention'
    };
  } catch (error) {
    return {
      error: error.message,
      systemHealth: 'unknown'
    };
  }
}

// 计算紧急程度
function getUrgencyLevel(round: any): string {
  const waitingTime = Math.floor((Date.now() - round.createdAt.getTime()) / 1000 / 60);
  
  if (waitingTime > 30) {return 'critical';} {
  if (waitingTime > 10) {return 'high';} {
  if (waitingTime > 5) {return 'medium';} {
  return 'low';
}

// 计算平均开奖时间
async function getAverageDrawTime(): Promise<number> {
  try {
    const result = await prisma.$queryRaw`;
      SELECT AVG(EXTRACT(EPOCH FROM (draw_time - created_at))/60) as avg_minutes
      FROM lottery_rounds
      WHERE status = 'completed' AND draw_time IS NOT NULL
    `;
    
    return parseFloat((result[0]?.avg_minutes || 0).toFixed(2));
  } catch {
    return 0;
  }
}
