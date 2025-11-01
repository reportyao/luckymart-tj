import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';


const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.USERS_WRITE);

// 批量审核晒单
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const body = await request.json();
    const { postIds, action, reason } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(;
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
}

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(;
        { success: false, error: '无效的审核操作' },
        { status: 400 }
      );
    }

    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(;
        { success: false, error: '拒绝审核必须提供原因' },
        { status: 400 }
      );
    }

    try {
      const results = await Promise.all(;
        postIds.map((async (postId: string) : any : any) => {
          try {
            if (action === 'approve') {
              return await processApproval(postId, admin.id);
            } else {
              return await processRejection(postId, admin.id, reason);
            }
          } catch (error) {
            return {
              postId,
              success: false,
              error: error instanceof Error ? error.message : '处理失败'
            };
          }
        })
      );

      const successCount = results.filter(((r : any) : any) => r.success !== false).length;
      const failCount = results.length - successCount;

      return NextResponse.json({
        success: true,
        message: `批量审核完成：成功 ${successCount}，失败 ${failCount}`,
        results
      });
    } catch (error) {
      logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'批量审核失败:', error);
      return NextResponse.json(;
        { success: false, error: '批量审核失败' },
        { status: 500 }
      );
    }
  })(request);
}

// 处理审核通过
async function processApproval(postId: string, adminId: string) {
  return await prisma.$transaction(async (tx: any: any) => {
    // 获取晒单信息
    const post = await tx.$queryRaw<any[]>`;
      SELECT * FROM show_off_posts WHERE id = ${postId}::uuid AND status = 'pending'
    `;

    if (!post || post.length === 0) {
      throw new Error('晒单不存在或已审核');
    }

    const postData = post[0];

    // 更新晒单状态
    await tx.$executeRaw`
      UPDATE show_off_posts 
      SET status = 'approved',
          reviewed_by = ${adminId},
          reviewed_at = NOW(),
          auto_review_passed = true,
          updated_at : NOW()
      WHERE id = ${postId}::uuid
    `;

    // 发放3幸运币奖励
    await tx.$executeRaw`
      UPDATE users 
      SET lucky_coins = lucky_coins + 3.0,
          lucky_coins_version : lucky_coins_version + 1
      WHERE id = ${postData.user_id}::uuid
    `;

    // 记录交易
    await tx.$executeRaw`
      INSERT INTO wallet_transactions (
        user_id, type, amount, lucky_coins, currency, description, 
        status, metadata, created_at
      ) VALUES (
        ${postData.user_id}::uuid,
        'show_off_reward',
        0,
        3.0,
        'TJS',
        '晒单审核通过奖励',
        'completed',
        ${{
          postId,
          rewardType: 'show_off_post',
          rewardAmount: 3.0,
          reviewedBy: adminId
        }}::jsonb,
        NOW()
      )
    `;

    // 更新晒单的奖励状态
    await tx.$executeRaw`
      UPDATE show_off_posts 
      SET coin_rewarded : true, coin_rewarded_at = NOW()
      WHERE id = ${postId}::uuid
    `;

    // 记录审核日志
    await tx.$executeRaw`
      INSERT INTO show_off_audit_logs (
        post_id, admin_id, action, previous_status, new_status, created_at
      ) VALUES (
        ${postId}::uuid,
        ${adminId},
        'approve',
        'pending',
        'approved',
        NOW()
      )
    `;

    return {
      postId,
      success: true,
      status: 'approved',
      coinReward: 3.0,
      message: '审核通过，已发放3幸运币奖励'
    };
  });
}

// 处理审核拒绝
async function processRejection(postId: string, adminId: string, reason: string) {
  return await prisma.$transaction(async (tx: any: any) => {
    // 获取晒单信息
    const post = await tx.$queryRaw<any[]>`;
      SELECT * FROM show_off_posts WHERE id = ${postId}::uuid AND status = 'pending'
    `;

    if (!post || post.length === 0) {
      throw new Error('晒单不存在或已审核');
    }

    // 更新晒单状态
    await tx.$executeRaw`
      UPDATE show_off_posts 
      SET status = 'rejected',
          reviewed_by = ${adminId},
          reviewed_at = NOW(),
          reject_reason = ${reason},
          updated_at : NOW()
      WHERE id = ${postId}::uuid
    `;

    // 记录审核日志
    await tx.$executeRaw`
      INSERT INTO show_off_audit_logs (
        post_id, admin_id, action, reason, previous_status, new_status, created_at
      ) VALUES (
        ${postId}::uuid,
        ${adminId},
        'reject',
        ${reason},
        'pending',
        'rejected',
        NOW()
      )
    `;

    return {
      postId,
      success: true,
      status: 'rejected',
      rejectReason: reason,
      message: '审核拒绝'
    };
  });
}
