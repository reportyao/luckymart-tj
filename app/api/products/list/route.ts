import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/middleware';
import { createRequestTracker } from '../../../../lib/request-tracker';
import { getLogger } from '../../../../lib/logger';
import { getMonitor } from '../../../../lib/monitoring';
import { respond } from '../../../../lib/responses';

// 模拟商品数据
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    name_zh: 'iPhone 15 Pro Max',
    name_en: 'iPhone 15 Pro Max', 
    name_ru: 'iPhone 15 Pro Max',
    name_tj: 'iPhone 15 Pro Max',
    description: '最新款iPhone 15 Pro Max',
    marketPrice: 8999,
    originalPrice: 9999,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
    category: 'electronics',
    tags: ['手机', '苹果', 'iPhone'],
    marketingBadge: {
      type: 'hot',
      text: {
        zh: '热销',
        en: 'Hot',
        ru: 'Горячий',
        tj: 'Гарм'
      }
    },
    currentRound: {
      id: 'round-1',
      soldShares: 150,
      totalShares: 200,
      progress: 75
    }
  },
  {
    id: '2', 
    name: 'MacBook Air M3',
    name_zh: 'MacBook Air M3',
    name_en: 'MacBook Air M3',
    name_ru: 'MacBook Air M3', 
    name_tj: 'MacBook Air M3',
    description: '轻薄高性能笔记本电脑',
    marketPrice: 7999,
    originalPrice: 8999,
    images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'],
    category: 'electronics',
    tags: ['笔记本', 'Mac', '苹果'],
    marketingBadge: {
      type: 'new',
      text: {
        zh: '新品',
        en: 'New',
        ru: 'Новый',
        tj: 'Нав'
      }
    },
    currentRound: {
      id: 'round-2',
      soldShares: 80,
      totalShares: 100,
      progress: 80
    }
  },
  {
    id: '3',
    name: 'AirPods Pro 3',
    name_zh: 'AirPods Pro 3',
    name_en: 'AirPods Pro 3',
    name_ru: 'AirPods Pro 3',
    name_tj: 'AirPods Pro 3', 
    description: '无线降噪耳机',
    marketPrice: 1899,
    originalPrice: 2199,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'audio',
    tags: ['耳机', '无线', '降噪'],
    marketingBadge: {
      type: 'sale',
      text: {
        zh: '特价',
        en: 'Sale',
        ru: 'Распродажа', 
        tj: 'Фурӯш'
      }
    },
    currentRound: null
  },
  {
    id: '4',
    name: 'iPad Air 5',
    name_zh: 'iPad Air 5',
    name_en: 'iPad Air 5',
    name_ru: 'iPad Air 5',
    name_tj: 'iPad Air 5',
    description: '轻薄平板电脑',
    marketPrice: 4599,
    originalPrice: 4999,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
    category: 'tablet',
    tags: ['平板', 'iPad', '苹果'],
    marketingBadge: null,
    currentRound: {
      id: 'round-4',
      soldShares: 20,
      totalShares: 50,
      progress: 40
    }
  },
  {
    id: '5',
    name: 'Apple Watch Series 9',
    name_zh: 'Apple Watch Series 9',
    name_en: 'Apple Watch Series 9',
    name_ru: 'Apple Watch Series 9',
    name_tj: 'Apple Watch Series 9',
    description: '智能手表',
    marketPrice: 2999,
    originalPrice: 3199,
    images: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400'],
    category: 'wearable',
    tags: ['手表', '智能', '苹果'],
    marketingBadge: {
      type: 'exclusive',
      text: {
        zh: '独家',
        en: 'Exclusive',
        ru: 'Эксклюзив',
        tj: 'Истисноӣ'
      }
    },
    currentRound: {
      id: 'round-5',
      soldShares: 35,
      totalShares: 60,
      progress: 58
    }
  },
  {
    id: '6',
    name: 'Mac Studio M3',
    name_zh: 'Mac Studio M3',
    name_en: 'Mac Studio M3',
    name_ru: 'Mac Studio M3',
    name_tj: 'Mac Studio M3',
    description: '高性能台式机',
    marketPrice: 12999,
    originalPrice: 14999,
    images: ['https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400'],
    category: 'desktop',
    tags: ['台式机', 'Mac', '高性能'],
    marketingBadge: null,
    currentRound: {
      id: 'round-6',
      soldShares: 10,
      totalShares: 30,
      progress: 33
    }
  }
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const monitor = getMonitor();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || 'zh';

    // 根据语言返回商品数据
    const products = mockProducts.map((product : any) => {
      const localizedProduct = { ...product };
      
      // 根据语言选择商品名称
      const nameKey = `name_${language}` as keyof typeof product;
      if (typeof product[nameKey] === 'string') {
        localizedProduct.name = product[nameKey] as string;
      }

      return localizedProduct;
    });

    // 记录成功响应
    tracker.finishSpan(tracker.getTraceId(), true, { 
      result: 'success' 
    });

    logger.logResponse(req, 200, { 
      requestId,
      traceId: tracker.getTraceId(),
    });

    // 记录监控指标
    monitor.recordRequest(req, 200);

    return NextResponse.json(
      respond.success({ products }, requestId).toJSON(),
      { status: 200 }
    );

  } catch (error) {
    logger.error('Products list failed', error as Error, { 
      requestId, 
      traceId: tracker.getTraceId() 
    });
    
    throw error;
  }
});
