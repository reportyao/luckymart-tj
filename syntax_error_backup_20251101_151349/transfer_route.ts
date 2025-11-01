import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';
import { DatabaseLockManager } from '@/lib/database-lock-manager';

const logger = getLogger();

interface TransferRequest {
  amount: number;
}

/**
 * 余额转幸运币API
 * POST /api/wallet/transfer
 * 1:1 转换比例
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证请求方法
    if (request.method !== 'POST') {
      requestLogger.warn('余额转幸运币失败：不支持的请求方法', {
        method: request.method
      }, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('不支持的请求方法'),
        { status: 405 }
      );
    }

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('余额转幸运币失败：用户ID缺失', undefined, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始余额转幸运币操作', { userId: user.userId }, {
      endpoint: '/api/wallet/transfer',
      method: 'POST'
    });

    // 解析请求体
    let body: TransferRequest;
    try {
      body = await request.json();
    } catch (error) {
      requestLogger.warn('余额转幸运币失败：请求体格式错误', error as Error, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('请求体格式错误'),
        { status: 400 }
      );
    }

    // 验证金额参数
    const { amount } = body;
    
    if (typeof amount !== 'number' || isNaN(amount)) {
      requestLogger.warn('余额转幸运币失败：金额参数无效', { amount }, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('金额参数无效'),
        { status: 400 }
      );
    }

    if (amount <= 0) {
      requestLogger.warn('余额转幸运币失败：转换金额必须大于0', { amount }, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest('转换金额必须大于0'),
        { status: 400 }
      );
    }

    // 检查余额是否充足
    const balanceCheck = await DatabaseLockManager.checkUserBalanceSufficient(
      user.userId,
      amount,
      'balance'
    );

    if (!balanceCheck.sufficient) {
      requestLogger.warn('余额转幸运币失败：余额不足', { 
        userId: user.userId,
        requiredAmount: amount,
        currentBalance: balanceCheck.currentBalance
      }, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.insufficientBalance(`余额不足，当前余额：${balanceCheck.currentBalance} TJS`),
        { status: 400 }
      );
    }

    // 使用参数化查询防止SQL注入
    const transferResult = await prisma.$queryRaw`
      SELECT * FROM transfer_balance_to_luckycoins(${user.userId}::uuid, ${amount})
    `;

    // 检查转换结果
    if (!transferResult || transferResult.length === 0 || !transferResult[0].success) {
      const errorMessage = transferResult?.[0]?.error_message || '转换操作失败';
      const currentBalance = transferResult?.[0]?.new_balance || 0;
      const currentLuckyCoins = transferResult?.[0]?.new_lucky_coins || 0;

      requestLogger.warn('余额转幸运币操作失败', {
        userId: user.userId,
        amount,
        errorMessage,
        currentBalance,
        currentLuckyCoins
      }, {
        endpoint: '/api/wallet/transfer',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(
        ApiResponse.badRequest(errorMessage),
        { status: 400 }
      );
    }

    // 获取转换后的完整余额信息
    const updatedUser = await prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        balance: true,
        balanceVersion: true,
        luckyCoins: true,
        luckyCoinsVersion: true,
        platformBalance: true,
        platformBalanceVersion: true
      }
    });

    const duration = Date.now() - startTime;

    requestLogger.info('余额转幸运币操作成功', {
      userId: user.userId,
      amount,
      oldBalance: balanceCheck.currentBalance,
      newBalance: transferResult[0].new_balance,
      newLuckyCoins: transferResult[0].new_lucky_coins
    }, {
      endpoint: '/api/wallet/transfer',
      method: 'POST',
      duration
    });

    // 构建响应数据
    const transferData = {
      userId: user.userId,
      transfer: {
        from: 'balance',
        to: 'luckyCoins',
        amount: amount,
        ratio: '1:1',
        currency: {
          from: 'TJS',
          to: 'LC'
        }
      },
      balances: {
        balance: {
          amount: parseFloat(transferResult[0].new_balance.toString()),
          version: updatedUser?.balanceVersion || 1,
          currency: 'TJS'
        },
        luckyCoins: {
          amount: parseFloat(transferResult[0].new_lucky_coins.toString()),
          version: updatedUser?.luckyCoinsVersion || 1,
          currency: 'LC'
        },
        platformBalance: {
          amount: parseFloat(updatedUser?.platformBalance.toString() || '0'),
          version: updatedUser?.platformBalanceVersion || 1,
          currency: 'TJS'
        }
      }
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transferData,
      message: `转换成功：${amount} TJS → ${amount} LC`
    });

  } catch (error) {
    logger.error('余额转幸运币操作异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/wallet/transfer',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(
      ApiResponse.internal('转换操作失败，请稍后重试'),
      { status: 500 }
    );
  }
});