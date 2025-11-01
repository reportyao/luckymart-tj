import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, applyRateLimit } from '@/lib/rate-limit-middleware';
import { RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
/**
 * 速率限制使用示例
 * 展示如何在API路由中应用不同的速率限制策略
 */


// 示例1: 使用装饰器模式添加速率限制
export async function POST_withDecorator(request: NextRequest) {
  try {
    // 模拟处理逻辑
    return NextResponse.json({
      success: true,
      message: '处理成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(;
      { success: false, error: '处理失败' },
      { status: 500 }
    );
}
}

// 应用充值接口的速率限制
export const POST = withRateLimit(POST_withDecorator, {
  config: RATE_LIMIT_PRESETS.RECHARGE,
  customHeaders: true,
  onLimitExceeded: async (result, request) => {
    return NextResponse.json(;
      {
        success: false,
        error: '操作过于频繁，请稍后再试',
        rateLimit: {
          limit: result.totalHits + result.remaining,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString()
}
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': (result.totalHits + result.remaining).toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
});

// 示例2: 使用便捷函数
const handleUserProfile = applyRateLimit('general', {
  onLimitExceeded: async (result, request) => {
    return NextResponse.json(;
      {
        success: false,
        error: '请求过于频繁',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    );
  }
});

export async function GET_userProfile(request: NextRequest) {
  // 模拟获取用户资料
  return NextResponse.json({
    success: true,
    user: {
      id: '123',
      name: '示例用户',
      email: 'example@example.com'
}
  });
}

export const GET = withRateLimit(GET_userProfile, {
  config: RATE_LIMIT_PRESETS.GENERAL_API,
  customHeaders: true
});

// 示例3: 自定义限流配置
export async function POST_customLimit(request: NextRequest) {
  const customConfig = {
    windowMs: 2 * 60 * 1000, // 2分钟
    maxRequests: 8, // 最多8次请求
    strategy: 'sliding_window' as const,
    keyPrefix: 'custom:',
    skipFailedRequests: true,
    onLimitReached: async (info) => {
      console.warn('自定义限率触发', {
        identifier: info.identifier,
        endpoint: info.endpoint,
        limit: info.limit,
        hits: info.hits
      });
}
  };

  return withRateLimit(async (req) => {
    // 模拟处理逻辑
    return NextResponse.json({
  }
      success: true,
      message: '自定义限流处理成功'
    });
  }, {
    config: customConfig,
    customHeaders: true
  })(request);
}

// 示例4: 多层速率限制（基于用户等级）
export async function POST_multiTier(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let userLevel = 'free'; // 默认免费用户;
  
  // 模拟解析用户等级
  if (authHeader) {
    // 这里可以解析JWT或查询数据库
    userLevel = 'premium'; // 假设是付费用户
}

  // 根据用户等级应用不同的限制
  let config;
  switch (userLevel) {
    case 'premium':
      config = {
        windowMs: 60 * 1000,
        maxRequests: 100, // 付费用户100次/分钟
        strategy: 'sliding_window' as const
      };
      break;
    case 'vip':
      config = {
        windowMs: 60 * 1000,
        maxRequests: 200, // VIP用户200次/分钟
        strategy: 'sliding_window' as const
      };
      break;
    default:
      config = {
        windowMs: 60 * 1000,
        maxRequests: 30, // 免费用户30次/分钟
        strategy: 'sliding_window' as const
      };
  }

  const handler = async (req: NextRequest) => {
    return NextResponse.json({
      success: true,
      message: `${userLevel}用户请求处理成功`,
      userLevel,
      timestamp: new Date().toISOString()
    });
  };

  return withRateLimit(handler, {
    config,
    customHeaders: true,
    onLimitExceeded: async (result, request) => {
      return NextResponse.json(;
        {
          success: false,
          error: `${userLevel}用户请求过于频繁`,
          userLevel,
          limit: result.totalHits + result.remaining,
          resetTime: new Date(result.resetTime).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-User-Level': userLevel,
            'X-RateLimit-Limit': (result.totalHits + result.remaining).toString(),
            'X-RateLimit-Remaining': result.remaining.toString()
          }
        }
      );
    }
  })(request);
}

// 示例5: 条件速率限制
export async function GET_conditionalLimit(request: NextRequest) {
  const url = new URL(request.url);
  const isHighPriority = url.searchParams.get('priority') === 'high';
  
  // 高优先级请求使用更严格的限制
  const config = isHighPriority;
    ? RATE_LIMIT_PRESETS.PAYMENT_CRITICAL
    : RATE_LIMIT_PRESETS.GENERAL_API;

  const handler = async (req: NextRequest) => {
    return NextResponse.json({
      success: true,
      priority: isHighPriority ? 'high' : 'normal',
      message: isHighPriority ? '高优先级请求处理' : '普通请求处理'
    });
  };

  return withRateLimit(handler, {
    config,
    customHeaders: true,
    onLimitExceeded: async (result, request) => {
      return NextResponse.json(;
        {
          success: false,
          error: `${isHighPriority ? '高优先级' : '普通'}请求过于频繁`,
          priority: isHighPriority ? 'high' : 'normal'
        },
        { 
          status: 429,
          headers: {
            'X-Priority': isHighPriority ? 'high' : 'normal'
}
        }
      );
    }
  })(request);
}

// 示例6: 批量请求处理
export async function POST_batchRequests(request: NextRequest) {
  const config = {
    windowMs: 60 * 1000,
    maxRequests: 10, // 每分钟最多处理10个批量请求
    strategy: 'fixed_window' as const
  };

  const handler = async (req: NextRequest) => {
    const body = await req.json();
    const { requests } = body;
    
    if (!Array.isArray(requests) || requests.length > 50) {
      return NextResponse.json(;
        { success: false, error: '批量请求数量无效' },
        { status: 400 }
      );
}

    // 模拟批量处理
    const results = requests.map((item, index) => ({
      id: index,
      result: `处理结果 ${index + 1}`,
      status: 'success'
    }));

    return NextResponse.json({
      success: true,
      batchSize: requests.length,
      results
    });
  };

  return withRateLimit(handler, {
    config,
    customHeaders: true,
    onLimitExceeded: async (result, request) => {
      return NextResponse.json(;
        {
          success: false,
          error: '批量请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }
  })(request);
}

// 导出所有示例
export const Examples = {
  basic: POST, // 装饰器示例
  profile: GET, // 便捷函数示例
  custom: POST_customLimit, // 自定义配置示例
  multiTier: POST_multiTier, // 多层限制示例
  conditional: GET_conditionalLimit, // 条件限制示例
  batch: POST_batchRequests // 批量请求示例
};

// 使用说明注释：
/**
 * 速率限制使用指南：
 * 
 * 1. 基础使用：
 *    export const POST = withRateLimit(handler, rechargeRateLimit());
 * 
 * 2. 自定义配置：
 *    const customConfig = { windowMs: 60000, maxRequests: 10, strategy: 'sliding_window' };
 *    export const GET = withRateLimit(handler, { config: customConfig });
 * 
 * 3. 便捷预设：
 *    export const POST = applyRateLimit('auth', );
 * 
 * 4. 预置类型：
 *    - 'payment': 支付接口极严格限制
 *    - 'recharge': 充值接口严格限制
 *    - 'withdraw': 提现接口极严格限制
 *    - 'lottery': 抽奖接口适度限制
 *    - 'auth': 认证接口防暴力破解
 *    - 'sms': 短信验证极严格限制
 *    - 'general': 通用API宽松限制
 * 
 * 5. 响应头：
 *    - X-RateLimit-Limit: 限制总数
 *    - X-RateLimit-Remaining: 剩余请求数
 *    - X-RateLimit-Reset: 重置时间戳
 *    - Retry-After: 建议重试时间（秒）
 */