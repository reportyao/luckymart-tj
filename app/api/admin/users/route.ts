import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import QueryOptimizer from '@/lib/query-optimizer';
import { validateReferralCodeFormat } from '@/lib/auth';
import { rewardTrigger } from '@/lib/reward-trigger-manager';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

// 创建权限中间件
const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.users.write()
});

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 使用优化后的查询方法
    const result = await QueryOptimizer.getOptimizedUsersList({
      page,
      limit,
      search
    });

      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '获取用户列表失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 创建用户（支持邀请奖励触发）
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();
    const monitor = getMonitor();
    const operationSpan = monitor.startSpan('user_create');

    try {
      const body = await request.json();
      const { 
      telegramId, 
      firstName, 
      lastName, 
      username, 
      avatarUrl,
      language = 'zh',
      referralCode,
      deviceFingerprint,
      ipAddress
    } = body;

    // 验证必需参数
    if (!telegramId || !firstName) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：telegramId 和 firstName'
      }, { status: 400 });
    }

    // 验证邀请码（如果提供）
    let referrerUserId = null;
    if (referralCode) {
      const validation = validateReferralCodeFormat(referralCode);
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          error: `邀请码格式无效: ${validation.error}`
        }, { status: 400 });
      }

      // 查找推荐人
      const referrer = await prisma.users.findUnique({
        where: { referralCode },
        select: { id: true, is_suspicious: true }
      });

      if (!referrer) {
        return NextResponse.json({
          success: false,
          error: '邀请码无效'
        }, { status: 404 });
      }

      if (referrer.is_suspicious) {
        return NextResponse.json({
          success: false,
          error: '推荐人账户存在可疑行为'
        }, { status: 403 });
      }

      referrerUserId = referrer.id;
    }

    // 在事务中创建用户和触发奖励
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. 检查用户是否已存在
      const existingUser = await tx.users.findUnique({
        where: { telegramId: telegramId.toString() },
        select: { id: true }
      });

      if (existingUser) {
        throw new Error('用户已存在');
      }

      // 2. 创建用户
      const user = await tx.users.create({
        data: {
          telegramId: telegramId.toString(),
          firstName,
          lastName,
          username,
          avatarUrl,
          language,
          referred_by_user_id: referrerUserId,
          trust_score: 50, // 默认信任分数
          is_suspicious: false
        }
      });

      // 3. 如果有推荐人，创建推荐关系
      if (referrerUserId) {
        // 创建推荐关系（最多3级）
        await createReferralRelationships(tx, user.id, referrerUserId);
      }

      return user;
    });

    // 4. 触发注册奖励
    if (referrerUserId) {
      try {
        const rewardResult = await rewardTrigger.triggerReward({
          type: 'USER_REGISTRATION',
          userId: result.id,
          data: {
            referrerId: referrerUserId,
            referralCode
          },
          timestamp: new Date()
        });

        logger.info('用户注册奖励触发结果', {
          userId: result.id,
          referralCode,
          rewardSuccess: rewardResult.success,
          totalRewards: rewardResult.result?.totalRewards || 0
        });
      } catch (rewardError) {
        logger.warn('注册奖励触发失败，但不影响用户创建', rewardError as Error, {
          userId: result.id,
          referralCode
        });
      }
    }

    operationSpan.finish(true, {
      userId: result.id,
      hasReferral: !!referrerUserId
    });

    monitor.increment('user_create_success_total', 1);
    if (referrerUserId) {
      monitor.increment('user_create_with_referral_total', 1);
    }

    logger.info('用户创建成功', {
      userId: result.id,
      telegramId,
      hasReferral: !!referrerUserId,
      referralCode
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.id,
          telegramId: result.telegramId,
          firstName: result.firstName,
          referred_by_user_id: result.referred_by_user_id,
          trust_score: result.trust_score,
          createdAt: result.createdAt
        }
      },
      message: referrerUserId ? '用户创建成功，邀请奖励已发放' : '用户创建成功'
    });

  } catch (error: any) {
    operationSpan.finish(false, {
      error: error.message
    });

    monitor.increment('user_create_error_total', 1);

    logger.error('用户创建失败', error as Error, {
      telegramId: body?.telegramId,
      referralCode: body?.referralCode
    });

    // 处理特定错误
    if (error.message === '用户已存在') {
      return NextResponse.json({
        success: false,
        error: '用户已存在'
      }, { status: 409 });
    }

    if (error.message.includes('邀请码无效') || error.message.includes('推荐人')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { error: 404 });
    }

      return NextResponse.json({
        success: false,
        error: error.message || '用户创建失败'
      }, { status: 500 });
    }
  })(request);
}

/**
 * 创建推荐关系（最多3级）
 */
async function createReferralRelationships(
  tx: any,
  refereeUserId: string,
  referrerUserId: string
): Promise<void> {
  const relationships: Array<{
    referee_user_id: string;
    referrer_user_id: string;
    referral_level: number;
  }> = [];

  let currentReferrerId = referrerUserId;
  let level = 1;

  // 构建推荐链并创建关系
  while (currentReferrerId && level <= 3) {
    relationships.push({
      referee_user_id: refereeUserId,
      referrer_user_id: currentReferrerId,
      referral_level: level
    });

    // 获取上一级推荐人
    const referrer = await tx.users.findUnique({
      where: { id: currentReferrerId },
      select: { referred_by_user_id: true }
    });

    if (!referrer?.referred_by_user_id) {
      break;
    }

    currentReferrerId = referrer.referred_by_user_id;
    level++;
  }

  // 批量创建推荐关系
  if (relationships.length > 0) {
    await tx.referralRelationships.createMany({
      data: relationships,
      skipDuplicates: true
    });
  }
}
