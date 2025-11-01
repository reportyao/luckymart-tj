import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `packages_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('packages_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('packages_route.ts request failed', error as Error, {
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
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || 'zh';

    const packages = await prisma.rechargePackages.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    const langSuffix = language === 'zh' ? 'Zh' : language === 'en' ? 'En' : 'Ru';

    const localizedPackages = packages.map((pkg : any) => ({
      id: pkg.id,
      name: pkg[`name${langSuffix}` as keyof typeof pkg],
      price: parseFloat(pkg.price.toString()),
      coins: pkg.coins,
      bonusCoins: pkg.bonusCoins,
      totalCoins: pkg.coins + pkg.bonusCoins,
      discount: pkg.bonusCoins > 0 
        ? `+${Math.round((pkg.bonusCoins / pkg.coins) * 100)}%` 
        : null,
      isPopular: pkg.sortOrder === 3 // 推荐礼包
    }));

    return NextResponse.json({
      success: true,
      data: { packages: localizedPackages }
    });

  } catch (error: any) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'Get packages error:', error);
    return NextResponse.json(
      { error: '获取充值礼包失败', message: error.message },
      { status: 500 }
    );
  }
}
