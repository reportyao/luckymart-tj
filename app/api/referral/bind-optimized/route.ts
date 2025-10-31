/**
 * 优化后的推荐系统API示例
 * 展示如何使用WITH RECURSIVE和迭代算法解决N+1问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ReferralQueryOptimizer } from '../../../../../lib/referral-optimizer';
import { OptimizedReferralService } from '../../../../../lib/referral-service-optimized';

const prisma = new PrismaClient();

// POST /api/referral/bind-optimized
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerCode, refereeTelegramId, refereeData } = body;

    // 验证输入
    if (!referrerCode || !refereeTelegramId || !refereeData?.firstName) {
      return NextResponse.json(
        { 
          success: false, 
          message: '缺少必要参数',
          code: 'MISSING_PARAMETERS' 
        },
        { status: 400 }
      );
    }

    // 使用优化后的推荐服务
    const referralService = new OptimizedReferralService(prisma);
    
    const result = await referralService.bindReferralRelationship(
      referrerCode,
      refereeTelegramId,
      refereeData
    );

    // 返回结果
    return NextResponse.json(result);

  } catch (error) {
    console.error('推荐绑定API错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '推荐绑定失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// GET /api/referral/stats-optimized?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const maxDepth = parseInt(searchParams.get('maxDepth') || '10');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: '缺少用户ID参数' 
        },
        { status: 400 }
      );
    }

    const referralService = new OptimizedReferralService(prisma);

    // 获取推荐统计
    const stats = await referralService.getUserReferralStats(userId);

    // 获取推荐树（分页）
    const treeResult = await referralService.getReferralTreePaginated(userId, {
      maxDepth,
      pageSize,
      page
    });

    // 获取性能报告
    const performanceReport = await referralService.getPerformanceReport();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        tree: treeResult.tree,
        pagination: {
          page,
          pageSize,
          total: treeResult.total,
          hasMore: treeResult.hasMore,
          totalPages: Math.ceil(treeResult.total / pageSize)
        },
        performance: treeResult.performanceMetrics,
        systemStats: performanceReport
      }
    });

  } catch (error) {
    console.error('推荐统计API错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '获取推荐统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}