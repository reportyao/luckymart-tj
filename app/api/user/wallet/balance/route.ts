import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

const prisma = new PrismaClient();

// JWT验证中间件
function verifyToken(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  }
  } catch (error) {
    return null;
  }
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `balance_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('balance_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('balance_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // 获取用户钱包余额
    export async function GET(req: NextRequest) {
      try {
        const decoded = verifyToken(req);
    
        if (!decoded) {
          return NextResponse.json(;
            { success: false, error: '未授权访问' },
            { status: 401 }
          );
    }

        const { userId } = decoded;

        // 获取用户信息
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            balance: true,
            luckyCoins: true,
            currency: true
          }
        });

        if (!user) {
          return NextResponse.json(;
            { success: false, error: '用户不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            balance: user.balance,
            luckyCoins: user.luckyCoins,
            currency: user.currency || 'TJS'
          }
        });

}
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取钱包余额失败:', error);
    return NextResponse.json(;
      { success: false, error: '获取余额失败' },
      
    );
  }
}