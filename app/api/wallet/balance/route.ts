import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';
import { DatabaseLockManager } from '@/lib/database-lock-manager';

const logger = getLogger();

/**
 * 获取用户双货币余额API
 * GET /api/wallet/balance
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('获取钱包余额失败：用户ID缺失', undefined, {
        endpoint: '/api/wallet/balance',
        method: 'GET'
      });
      
      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始获取用户双货币余额', { userId: user.userId }, {
      endpoint: '/api/wallet/balance',
      method: 'GET'
    });

    // 使用专用函数获取用户双货币余额信息，确保数据一致性
    const walletBalanceInfo = await prisma.$queryRaw`
      SELECT * FROM get_user_wallet_balance(${user.userId}::uuid)
    `;

    // 如果用户不存在，返回错误
    if (!walletBalanceInfo || walletBalanceInfo.length === 0) {
      requestLogger.warn('获取钱包余额失败：用户不存在', { userId: user.userId }, {
        endpoint: '/api/wallet/balance',
        method: 'GET'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.notFound('用户不存在'),
        { status: 404 }
      );
    }

    const balanceData = walletBalanceInfo[0];

    // 构建响应数据
    const responseData = {
      userId: balanceData.user_id,
      balances: {
        balance: {
          amount: parseFloat(balanceData.balance.toString()),
          version: balanceData.balance_version,
          currency: 'TJS' // 塔吉克斯坦索莫尼
        },
        luckyCoins: {
          amount: parseFloat(balanceData.lucky_coins.toString()),
          version: balanceData.lucky_coins_version,
          currency: 'LC' // LuckyCoins
        },
        platformBalance: {
          amount: parseFloat(balanceData.platform_balance.toString()),
          version: balanceData.platform_balance_version,
          currency: 'TJS' // 平台余额
        }
      },
      totalAssets: {
        tjs: parseFloat(balanceData.total_tjs.toString()),
        lc: parseFloat(balanceData.total_lc.toString())
      },
      lastUpdated: new Date() // 当前时间作为最后更新时间
    };

    const duration = Date.now() - startTime;
    
    requestLogger.info('成功获取用户双货币余额', { 
      userId: user.userId,
      balance: responseData.balances.balance.amount,
      luckyCoins: responseData.balances.luckyCoins.amount
    }, {
      endpoint: '/api/wallet/balance',
      method: 'GET',
      duration
    });

    // 返回成功响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
      message: '余额查询成功'
    });

  } catch (error) {
    logger.error('获取钱包余额时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/wallet/balance',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('获取余额失败，请稍后重试'),
      { status: 500 }
    );
  }
});