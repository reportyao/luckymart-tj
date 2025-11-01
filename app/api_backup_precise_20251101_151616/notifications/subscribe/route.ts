import { NextRequest, NextResponse } from 'next/server';

// 保存订阅信息到全局存储
interface Subscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  timestamp?: number;
}

declare global {
  var subscriptions: Map<string, Subscription> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userAgent, timestamp } = body;
    
    // 验证订阅信息
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: '无效的订阅信息'
      }, { status: 400 });
    }
    
    // 初始化全局订阅存储
    if (!global.subscriptions) {
      global.subscriptions = new Map();
    }
    
    // 保存订阅
    const subscriptionData: Subscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent || 'unknown',
      timestamp: timestamp || Date.now()
    };
    
    global.subscriptions.set(subscription.endpoint, subscriptionData);
    
    console.log('订阅保存成功:', subscription.endpoint);
    
    return NextResponse.json({
      success: true,
      message: '订阅保存成功',
      endpoint: subscription.endpoint
    });
    
  } catch (error) {
    console.error('保存订阅失败:', error);
    return NextResponse.json({
      success: false,
      error: '保存订阅失败'
    }, { status: 500 });
  }
}