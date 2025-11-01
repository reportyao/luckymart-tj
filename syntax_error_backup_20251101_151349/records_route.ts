import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { authenticateUser } from '../../../../lib/auth';

// GET /api/lottery/records - 获取用户抽奖记录
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(;
        { success: false, error: '认证失败' },
        { status: 401 }
      );
}

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions: any = {
      userId: user.id
    };

    // 状态筛选
    if (status !== 'all') {
      switch (status) {
        case 'active':
          whereConditions.round = {
            status: 'active'
          };
          break;
        case 'completed':
          whereConditions.round = {
            status: 'completed'
          };
          break;
        case 'won':
          whereConditions.isWinner = true;
          break;
      }
    }

    // 类型筛选
    if (type !== 'all') {
      whereConditions.type = type;
    }

    // 获取记录总数
    const totalCount = await prisma.participations.count({
      where: whereConditions
    });

    // 获取抽奖记录
    const participations = await prisma.participations.findMany({
      where: whereConditions,
      include: {
        round: {
          include: {
            product: {
              select: {
                id: true,
                nameMultilingual: true,
                nameZh: true,
                nameEn: true,
                nameRu: true,
                images: true,
                totalShares: true,
                pricePerShare: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // 转换数据格式
    const records = participations.map((participation : any) => {
      const product = participation.round.product;
      const productName = getMultilingualProductName(product);
      
      return {
        id: participation.id,
        roundId: participation.roundId,
        productId: participation.productId,
        productName,
        productImage: product.images && product.images.length > 0 ? product.images[0] : undefined,
        roundNumber: participation.round.roundNumber,
        numbers: participation.numbers,
        sharesCount: participation.sharesCount,
        cost: parseFloat(participation.cost.toString()),
        type: participation.type as 'paid' | 'free',
        status: participation.round.status as 'active' | 'completed' | 'drawn',
        isWinner: participation.isWinner,
        winningNumber: participation.round.winningNumber,
        winnerPrize: participation.round.winningNumber ? parseFloat(product.pricePerShare.toString()) * participation.sharesCount : undefined,
        drawTime: participation.round.drawTime?.toISOString(),
        participationTime: participation.createdAt.toISOString()
      };
    });

    // 计算是否还有更多数据
    const hasMore = offset + records.length < totalCount;

    // 缓存数据到本地存储（用于离线查看）
    if (typeof window !== 'undefined') {
      try {
        const cachedRecords = JSON.parse(localStorage.getItem('lottery_records_cache') || '[]');
        const updatedCache = [;
          ...records.filter((record: any) : any => !cachedRecords.some((cached: any) : any => cached.id === record.id)),
          ...cachedRecords
        ].slice(0, 1000); // 最多缓存1000条记录
        
        localStorage.setItem('lottery_records_cache', JSON.stringify(updatedCache));
        localStorage.setItem('lottery_records_cache_time', Date.now().toString());
      } catch (error) {
        console.warn('缓存数据失败:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取抽奖记录失败:', error);
    return NextResponse.json(;
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/lottery/records - 缓存抽奖记录（客户端调用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { record } = body;

    if (!record) {
      return NextResponse.json(;
        { success: false, error: '记录数据无效' },
        { status: 400 }
      );
}

    // 在实际应用中，这里可以将数据保存到本地数据库
    // 目前主要作为缓存更新接口

    return NextResponse.json({
      success: true,
      message: '记录已缓存'
    });

  } catch (error) {
    console.error('缓存记录失败:', error);
    return NextResponse.json(;
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 获取多语言商品名称的辅助函数
function getMultilingualProductName(product: any): string {
  if (product.nameMultilingual) {
    // 尝试从多语言JSON中获取名称
    try {
      const nameData = typeof product.nameMultilingual === 'string';
        ? JSON.parse(product.nameMultilingual) 
        : product.nameMultilingual;
      
      // 优先使用用户语言，其次是中文，然后是英文
      const languages = ['zh-CN', 'zh', 'en', 'ru', 'tg'];
      
      for (const lang of languages) {
        if ((nameData?.lang ?? null) && (nameData?.lang ?? null).name) {
          return (nameData?.lang ?? null).name;
        }
      }
      
      // 如果没有找到，返回第一个可用的名称
      const firstName = Object.values(nameData).find((value: any) =>;
        value && typeof value :== 'object' && value.name
      ) as any;
      
      if (firstName) {
        return firstName.name;
      }
    } catch (error) {
      console.warn('解析多语言名称失败:', error);
    }
  }

  // 回退到旧字段
  return product.nameZh || product.nameEn || product.nameRu || '未知商品';
}