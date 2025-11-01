import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-response';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

interface CreateTransactionRequest {
  type: string;
  amount: number;
  balanceType: 'balance' | 'lucky_coins' | 'platform_balance';
  description?: string;
  relatedOrderId?: string;
}

interface QueryParams {
  page?: string;
  limit?: string;
  balanceType?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 双货币交易记录API
 * GET  /api/wallet/transactions - 查询交易记录
 * POST /api/wallet/transactions - 创建交易记录
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('查询交易记录失败：用户ID缺失', undefined, {
        endpoint: '/api/wallet/transactions',
        method: 'GET'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
}

    requestLogger.info('开始查询用户交易记录', { userId: user.userId }, {
      endpoint: '/api/wallet/transactions',
      method: 'GET'
    });

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const params: QueryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      balanceType: searchParams.get('balanceType') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };

    // 验证分页参数
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // 构建查询条件
    const whereConditions: any = {
      userId: user.userId
    };

    if (params.balanceType && ['balance', 'lucky_coins', 'platform_balance'].includes(params.balanceType)) {
      whereConditions.balanceType = params.balanceType;
    }

    if (params.type) {
      whereConditions.type = {
        contains: params.type,
        mode: 'insensitive'
      };
    }

    if (params.startDate) {
      const startDate = new Date(params.startDate);
      if (!isNaN(startDate.getTime())) {
        whereConditions.createdAt = {
          ...whereConditions.createdAt,
          gte: startDate
        };
      }
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate);
      if (!isNaN(endDate.getTime())) {
        whereConditions.createdAt = {
          ...whereConditions.createdAt,
          lte: endDate
        };
      }
    }

    // 使用优化后的分页查询函数
    const transactionQueryResult = await prisma.$queryRaw`;
      SELECT * FROM get_user_transactions_paginated(
        ${user.userId}::uuid,
        ${page}::integer,
        ${limit}::integer,
        ${params.balanceType || null},
        ${params.type || null},
        ${params.startDate || null},
        ${params.endDate || null}
      )
    `;

    // 检查查询结果
    if (!transactionQueryResult || transactionQueryResult.length === 0) {
      requestLogger.warn('查询交易记录失败：无返回数据', { userId: user.userId }, {
        endpoint: '/api/wallet/transactions',
        method: 'GET'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.internal('查询交易记录失败，请稍后重试'),
        { status: 500 }
      );
    }

    const queryData = transactionQueryResult[0];
    const transactions = queryData.transactions || [];
    const totalCount = queryData.total_count || 0;
    const pagination = queryData.pagination || {};
    const statistics = queryData.statistics || [];

    const duration = Date.now() - startTime;

    requestLogger.info('成功查询用户交易记录', {
      userId: user.userId,
      totalCount,
      page,
      limit
    }, {
      endpoint: '/api/wallet/transactions',
      method: 'GET',
      duration
    });

    // 格式化交易记录数据
    const formattedTransactions = transactions.map(((tx: any) : any) => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount.toString()),
      balanceType: tx.balanceType,
      balanceTypeName: {
        balance: '普通余额',
        lucky_coins: '幸运币',
        platform_balance: '平台余额'
      }[tx.balanceType] || tx.balanceType,
      relatedOrderId: tx.relatedOrderId,
      description: tx.description,
      createdAt: new Date(tx.createdAt),
      formattedDate: new Date(tx.createdAt).toISOString().split('T')[0],
      formattedTime: new Date(tx.createdAt).toTimeString().split(' ')[0]
    }));

    // 构建响应数据
    const transactionData = {
      transactions: formattedTransactions,
      pagination: {
        page: pagination.page || page,
        limit: pagination.limit || limit,
        total: totalCount,
        totalPages: pagination.totalPages || Math.ceil(totalCount / limit),
        hasNext: pagination.hasNext || (page * limit < totalCount),
        hasPrev: pagination.hasPrev || (page > 1)
      },
      filters: {
        balanceType: params.balanceType,
        type: params.type,
        startDate: params.startDate,
        endDate: params.endDate
      },
      statistics: {
        totalTransactions: totalCount,
        balanceTypeStats: statistics.map(((stat: any) : any) => ({
          balanceType: stat.balanceType,
          balanceTypeName: {
            balance: '普通余额',
            lucky_coins: '幸运币',
            platform_balance: '平台余额'
          }[stat.balanceType] || stat.balanceType,
          totalAmount: parseFloat(stat.totalAmount?.toString() || '0'),
          transactionCount: stat.transactionCount || 0
        }))
      }
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transactionData,
      message: '交易记录查询成功'
    });

  } catch (error) {
    logger.error('查询交易记录时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/wallet/transactions',
      method: 'GET'
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('查询交易记录失败，请稍后重试'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const requestLogger = logger;
    const startTime = Date.now();

    // 验证请求方法
    if (request.method !== 'POST') {
      requestLogger.warn('创建交易记录失败：不支持的请求方法', {
        method: request.method
      }, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('不支持的请求方法'),
        { status: 405 }
      );
}

    // 验证必需参数
    if (!user?.userId) {
      requestLogger.warn('创建交易记录失败：用户ID缺失', undefined, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.unauthorized('用户身份验证失败'),
        { status: 401 }
      );
    }

    requestLogger.info('开始创建交易记录', { userId: user.userId }, {
      endpoint: '/api/wallet/transactions',
      method: 'POST'
    });

    // 解析请求体
    let body: CreateTransactionRequest;
    try {
      body = await request.json();
    } catch (error) {
      requestLogger.warn('创建交易记录失败：请求体格式错误', error as Error, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('请求体格式错误'),
        { status: 400 }
      );
    }

    // 验证必需字段
    const { type, amount, balanceType, description, relatedOrderId } = body;

    if (!type || typeof type !== 'string') {
      requestLogger.warn('创建交易记录失败：交易类型无效', { type }, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('交易类型不能为空'),
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount === 0) {
      requestLogger.warn('创建交易记录失败：金额无效', { amount }, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('金额必须为非零数字'),
        { status: 400 }
      );
    }

    if (!balanceType || !['balance', 'lucky_coins', 'platform_balance'].includes(balanceType)) {
      requestLogger.warn('创建交易记录失败：余额类型无效', { balanceType }, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('余额类型无效，必须是 balance、lucky_coins 或 platform_balance'),
        { status: 400 }
      );
    }

    if (relatedOrderId && typeof relatedOrderId !== 'string') {
      requestLogger.warn('创建交易记录失败：订单ID格式无效', { relatedOrderId }, {
        endpoint: '/api/wallet/transactions',
        method: 'POST'
      });

      return NextResponse.json<ApiResponse>(;
        ApiResponse.badRequest('订单ID格式无效'),
        { status: 400 }
      );
    }

    // 创建交易记录
    const transaction = await prisma.transactions.create({
      data: {
        userId: user.userId,
        type: type.trim(),
        amount: amount,
        balanceType: balanceType,
        description: description?.trim(),
        relatedOrderId: relatedOrderId
      },
      select: {
        id: true,
        type: true,
        amount: true,
        balanceType: true,
        relatedOrderId: true,
        description: true,
        createdAt: true
      }
    });

    const duration = Date.now() - startTime;

    requestLogger.info('成功创建交易记录', {
      userId: user.userId,
      transactionId: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balanceType: transaction.balanceType
    }, {
      endpoint: '/api/wallet/transactions',
      method: 'POST',
      duration
    });

    // 格式化响应数据
    const transactionData = {
      id: transaction.id,
      type: transaction.type,
      amount: parseFloat(transaction.amount.toString()),
      balanceType: transaction.balanceType,
      balanceTypeName: {
        balance: '普通余额',
        lucky_coins: '幸运币',
        platform_balance: '平台余额'
      }[transaction.balanceType] || transaction.balanceType,
      relatedOrderId: transaction.relatedOrderId,
      description: transaction.description,
      createdAt: transaction.createdAt,
      formattedDate: transaction.createdAt.toISOString().split('T')[0],
      formattedTime: transaction.createdAt.toTimeString().split(' ')[0]
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transactionData,
      message: '交易记录创建成功'
    }, { status: 201 });

  } catch (error) {
    logger.error('创建交易记录时发生异常', error as Error, {
      userId: user?.userId,
      endpoint: '/api/wallet/transactions',
      method: 'POST'
    });

    return NextResponse.json<ApiResponse>(;
      ApiResponse.internal('创建交易记录失败，请稍后重试'),
      { status: 500 }
    );
  }
});