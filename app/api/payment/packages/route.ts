import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    console.error('Get packages error:', error);
    return NextResponse.json(
      { error: '获取充值礼包失败', message: error.message },
      { status: 500 }
    );
  }
}
