import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { triggerImmediateDraw } from '@/lib/lottery';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.lottery.write()
});

// 数据一致性修复工具 - 边界情况处理和数据一致性检查
export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
    try {

    const body = await request.json();
    const { action, roundId, dryRun = true } = body;

    console.log(`[DataFix] 开始执行: ${action}, roundId: ${roundId}, dryRun: ${dryRun}`);

    let result;
    switch (action) {
      case 'fix_sold_shares_mismatch':
        result = await fixSoldSharesMismatch(roundId, dryRun);
        break;
      case 'complete_missing_draws':
        result = await completeMissingDraws(roundId, dryRun);
        break;
      case 'recalculate_participants':
        result = await recalculateParticipants(roundId, dryRun);
        break;
      case 'validate_number_ranges':
        result = await validateNumberRanges(roundId, dryRun);
        break;
      case 'clean_orphaned_records':
        result = await cleanOrphanedRecords(dryRun);
        break;
      case 'fix_duplicate_winners':
        result = await fixDuplicateWinners(roundId, dryRun);
        break;
      case 'full_system_check':
        result = await performFullSystemCheck(dryRun);
        break;
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      dryRun,
      result,
      timestamp: new Date().toISOString()
    });

    } catch (error: any) {
      console.error('DataFix error:', error);
      return NextResponse.json(
        { error: '数据修复失败', message: error.message },
        { status: 500 }
      );
    }
  })(request);
}

// 修复售出份额不匹配问题
async function fixSoldSharesMismatch(roundId?: string, dryRun: boolean = true) {
  const whereClause = roundId ? 'AND lr.id = $1' : '';
  const params = roundId ? [roundId] : [];

  const mismatchedRounds = await prisma.$queryRaw`
    SELECT 
      lr.id,
      lr.round_number,
      lr.sold_shares,
      COALESCE(SUM(p.shares_count), 0) as actual_shares,
      lr.status
    FROM lottery_rounds lr
    LEFT JOIN participations p ON lr.id = p.round_id
    WHERE 1=1 ${whereClause}
    GROUP BY lr.id, lr.round_number, lr.sold_shares, lr.status
    HAVING lr.sold_shares != COALESCE(SUM(p.shares_count), 0)
  `;

  const fixes = [];

  for (const round of mismatchedRounds) {
    if (dryRun) {
      fixes.push({
        roundId: round.id,
        roundNumber: round.round_number,
        currentSoldShares: round.sold_shares,
        actualShares: round.actual_shares,
        difference: round.actual_shares - round.sold_shares,
        action: 'update_sold_shares',
        status: '模拟修复'
      });
    } else {
      try {
        // 修正售出份额
        await prisma.lotteryRounds.update({
          where: { id: round.id },
          data: { soldShares: round.actual_shares }
        });

        // 如果修正后应该满期，触发开奖
        const updatedRound = await prisma.lotteryRounds.findUnique({
          where: { id: round.id }
        });

        if (updatedRound && updatedRound.soldShares >= updatedRound.totalShares && updatedRound.status === 'ongoing') {
          await prisma.lotteryRounds.update({
            where: { id: round.id },
            data: { status: 'full' }
          });
          
          // 异步触发开奖
          triggerImmediateDraw(round.id).catch(console.error);
        }

        fixes.push({
          roundId: round.id,
          roundNumber: round.round_number,
          action: '已修复售出份额',
          status: 'success'
        });
      } catch (error) {
        fixes.push({
          roundId: round.id,
          roundNumber: round.round_number,
          action: '修复失败',
          error: error.message,
          status: 'error'
        });
      }
    }
  }

  return {
    totalMismatched: mismatchedRounds.length,
    fixes,
    summary: {
      success: fixes.filter(f => f.status === 'success').length,
      errors: fixes.filter(f => f.status === 'error').length,
      dryRun
    }
  };
}

// 完成缺失的开奖
async function completeMissingDraws(roundId?: string, dryRun: boolean = true) {
  const missingDraws = await prisma.lotteryRounds.findMany({
    where: {
      status: 'full',
      winnerUserId: null,
      ...(roundId ? { id: roundId } : {})
    },
    include: {
      participations: true,
      product: true
    }
  });

  const fixes = [];

  for (const round of missingDraws) {
    if (!round.participations || round.participations.length === 0) {
      fixes.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        issue: '无参与记录，无法开奖',
        action: '标记为异常期次',
        status: 'skipped'
      });
      continue;
    }

    if (dryRun) {
      fixes.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        issue: '需要执行开奖',
        participantCount: round.participations.length,
        action: '执行开奖',
        status: '模拟修复'
      });
    } else {
      try {
        await triggerImmediateDraw(round.id);
        fixes.push({
          roundId: round.id,
          roundNumber: round.roundNumber,
          action: '开奖完成',
          status: 'success'
        });
      } catch (error) {
        fixes.push({
          roundId: round.id,
          roundNumber: round.roundNumber,
          action: '开奖失败',
          error: error.message,
          status: 'error'
        });
      }
    }
  }

  return {
    totalMissingDraws: missingDraws.length,
    fixes,
    summary: {
      success: fixes.filter(f => f.status === 'success').length,
      errors: fixes.filter(f => f.status === 'error').length,
      skipped: fixes.filter(f => f.status === 'skipped').length,
      dryRun
    }
  };
}

// 重新计算参与者数量
async function recalculateParticipants(roundId?: string, dryRun: boolean = true) {
  const rounds = await prisma.lotteryRounds.findMany({
    where: roundId ? { id: roundId } : {},
    include: {
      participations: {
        select: {
          id: true,
          userId: true
        }
      }
    }
  });

  const fixes = [];

  for (const round of rounds) {
    const uniqueParticipants = new Set(round.participations.map(p => p.userId)).size;
    const currentParticipants = round.participants;

    if (uniqueParticipants !== currentParticipants) {
      if (dryRun) {
        fixes.push({
          roundId: round.id,
          roundNumber: round.roundNumber,
          currentParticipants,
          calculatedParticipants: uniqueParticipants,
          difference: uniqueParticipants - currentParticipants,
          action: '更新参与者数量',
          status: '模拟修复'
        });
      } else {
        try {
          await prisma.lotteryRounds.update({
            where: { id: round.id },
            data: { participants: uniqueParticipants }
          });

          fixes.push({
            roundId: round.id,
            roundNumber: round.roundNumber,
            action: '参与者数量已更新',
            status: 'success'
          });
        } catch (error) {
          fixes.push({
            roundId: round.id,
            roundNumber: round.roundNumber,
            action: '更新失败',
            error: error.message,
            status: 'error'
          });
        }
      }
    }
  }

  return {
    totalRounds: rounds.length,
    mismatchedRounds: fixes.length,
    fixes,
    summary: {
      success: fixes.filter(f => f.status === 'success').length,
      errors: fixes.filter(f => f.status === 'error').length,
      dryRun
    }
  };
}

// 验证号码范围
async function validateNumberRanges(roundId?: string, dryRun: boolean = true) {
  const participations = await prisma.participations.findMany({
    where: roundId ? { roundId } : {},
    include: {
      round: {
        select: {
          id: true,
          roundNumber: true,
          totalShares: true
        }
      }
    },
    take: 100 // 限制处理数量
  });

  const issues = [];

  for (const participation of participations) {
    const { round, numbers } = participation;
    const minNumber = 10000001;
    const maxNumber = 10000000 + round.totalShares;

    const invalidNumbers = numbers.filter(num => num < minNumber || num > maxNumber);

    if (invalidNumbers.length > 0) {
      issues.push({
        participationId: participation.id,
        roundId: round.id,
        roundNumber: round.roundNumber,
        invalidNumbers,
        validRange: `${minNumber}-${maxNumber}`,
        action: dryRun ? '模拟修复' : '需要手动处理',
        status: dryRun ? '模拟发现问题' : '需要干预'
      });
    }
  }

  return {
    totalChecked: participations.length,
    issuesFound: issues.length,
    issues,
    summary: {
      needsManualReview: issues.length,
      dryRun
    }
  };
}

// 清理孤儿记录
async function cleanOrphanedRecords(dryRun: boolean = true) {
  const fixes = [];

  // 1. 清理孤儿参与记录
  const orphanedParticipations = await prisma.participations.findMany({
    where: {
      roundId: {
        notIn: await prisma.lotteryRounds.findMany({
          select: { id: true }
        }).then(rounds => rounds.map(r => r.id))
      }
    },
    take: 50
  });

  if (orphanedParticipations.length > 0) {
    if (dryRun) {
      fixes.push({
        type: 'orphan_participations',
        count: orphanedParticipations.length,
        action: '删除孤儿参与记录',
        status: '模拟修复'
      });
    } else {
      await prisma.participations.deleteMany({
        where: {
          id: { in: orphanedParticipations.map(p => p.id) }
        }
      });
      fixes.push({
        type: 'orphan_participations',
        count: orphanedParticipations.length,
        action: '已清理',
        status: 'success'
      });
    }
  }

  // 2. 清理无效的通知记录
  const invalidNotifications = await prisma.notifications.findMany({
    where: {
      userId: '00000000-0000-0000-0000-000000000000',
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7天前的系统通知
    },
    take: 100
  });

  if (invalidNotifications.length > 0) {
    if (dryRun) {
      fixes.push({
        type: 'old_system_notifications',
        count: invalidNotifications.length,
        action: '清理过期系统通知',
        status: '模拟修复'
      });
    } else {
      await prisma.notifications.deleteMany({
        where: {
          id: { in: invalidNotifications.map(n => n.id) }
        }
      });
      fixes.push({
        type: 'old_system_notifications',
        count: invalidNotifications.length,
        action: '已清理',
        status: 'success'
      });
    }
  }

  return {
    totalIssues: fixes.length,
    fixes,
    summary: {
      success: fixes.filter(f => f.status === 'success').length,
      errors: fixes.filter(f => f.status === 'error').length,
      dryRun
    }
  };
}

// 修复重复中奖
async function fixDuplicateWinners(roundId?: string, dryRun: boolean = true) {
  const duplicateWinners = await prisma.$queryRaw`
    SELECT round_id, COUNT(*) as winner_count
    FROM participations
    WHERE is_winner = true
    ${roundId ? 'AND round_id = $1' : ''}
    GROUP BY round_id
    HAVING COUNT(*) > 1
  `;

  const fixes = [];

  for (const duplicate of duplicateWinners) {
    const winners = await prisma.participations.findMany({
      where: {
        roundId: duplicate.round_id,
        isWinner: true
      }
    });

    if (winners.length > 1) {
      // 保留最早的中奖记录
      const sortedWinners = winners.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const winnerToKeep = sortedWinners[0];
      const winnersToRemove = sortedWinners.slice(1);

      if (dryRun) {
        fixes.push({
          roundId: duplicate.round_id,
          duplicateCount: winners.length,
          action: `移除${winnersToRemove.length}个重复中奖记录`,
          winnerToKeep: winnerToKeep.id,
          status: '模拟修复'
        });
      } else {
        try {
          // 移除重复的中奖标记
          await prisma.participations.updateMany({
            where: {
              id: { in: winnersToRemove.map(w => w.id) }
            },
            data: { isWinner: false }
          });

          // 更新期次的中奖者
          await prisma.lotteryRounds.update({
            where: { id: duplicate.round_id },
            data: {
              winnerUserId: winnerToKeep.userId
            }
          });

          fixes.push({
            roundId: duplicate.round_id,
            action: '重复中奖已处理',
            status: 'success'
          });
        } catch (error) {
          fixes.push({
            roundId: duplicate.round_id,
            action: '处理失败',
            error: error.message,
            status: 'error'
          });
        }
      }
    }
  }

  return {
    totalDuplicates: duplicateWinners.length,
    fixes,
    summary: {
      success: fixes.filter(f => f.status === 'success').length,
      errors: fixes.filter(f => f.status === 'error').length,
      dryRun
    }
  };
}

// 全面系统检查
async function performFullSystemCheck(dryRun: boolean = true) {
  const checks = await Promise.allSettled([
    fixSoldSharesMismatch(undefined, true),
    completeMissingDraws(undefined, true),
    recalculateParticipants(undefined, true),
    validateNumberRanges(undefined, true),
    cleanOrphanedRecords(true),
    fixDuplicateWinners(undefined, true)
  ]);

  const results = checks.map((check, index) => {
    const actions = ['sold_shares_mismatch', 'missing_draws', 'participants', 'number_ranges', 'orphaned_records', 'duplicate_winners'];
    return {
      action: actions[index],
      status: check.status,
      result: check.status === 'fulfilled' ? check.value : { error: check.reason }
    };
  });

  return {
    totalChecks: results.length,
    checks: results,
    summary: {
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      totalIssues: results.reduce((sum, r) => {
        if (r.status === 'fulfilled') {
          return sum + (r.result.totalMismatched || r.result.totalMissingDraws || r.result.mismatchedRounds || r.result.issuesFound || r.result.totalIssues || r.result.totalDuplicates || 0);
        }
        return sum;
      }, 0),
      dryRun
    }
  };
}
