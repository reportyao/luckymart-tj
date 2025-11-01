import { NextRequest, NextResponse } from 'next/server';
import { checkAndDrawFullRounds } from '@/lib/lottery';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

// 手动触发开奖API（供定时任务或管理员调用）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限或定时任务token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
}

    // 执行开奖
    const results = await checkAndDrawFullRounds();

    return NextResponse.json({
      success: true,
      data: {
        processedRounds: results.length,
        results
      },
      message: `已处理${results.length}个期次的开奖`
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Auto draw error:', error);
    return NextResponse.json(;
      { error: '自动开奖失败', message: error.message },
      { status: 500 }
    );
  }
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `draw_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('draw_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('draw_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
}
  }
});

async function handleGET(request: NextRequest) {

    // 获取待开奖期次列表
    export async function GET(request: NextRequest) {
      try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
        if (authHeader !== `Bearer ${cronSecret}`) {
          return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

        const { prisma } = await import('@/lib/prisma');
    
        const fullRounds = await prisma.lotteryRounds.findMany({
          where: { status: 'full' },
          orderBy: { updatedAt: 'asc' }
        });

        // 手动获取产品信息
        const roundsWithProducts = await Promise.all(;
          fullRounds.map((async (r) : any : any) => {
            const product = await prisma.products.findUnique({
              where: { id: r.productId },
              select: { nameZh: true, marketPrice: true }
            });

            return {
              id: r.id,
              productName: product?.nameZh || '',
              roundNumber: r.roundNumber,
              totalShares: r.totalShares,
              participants: r.participants,
              updatedAt: r.updatedAt
            };
          })
        );

        return NextResponse.json({
          success: true,
          data: {
            count: fullRounds.length,
            rounds: roundsWithProducts
          }
        });

}
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get pending draws error:', error);
    return NextResponse.json(;
  }
      { error: '获取待开奖列表失败', message: error.message },
      
    );
  }
}
