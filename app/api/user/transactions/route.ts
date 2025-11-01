import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `transactions_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('transactions_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('transactions_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

}

export async function GET(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({
        success: false,
        error: '未登录'
      }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Token无效'
      }, { status: 401 });
    }

    // 获取交易记录
    const transactions = await prisma.transactions.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((t : any) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          balance: Number(t.balance),
          description: t.description,
          createdAt: t.createdAt.toISOString()
        }))
      }
    });
  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get transactions error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取交易记录失败'
    }, { status: 500 });
  }
}
