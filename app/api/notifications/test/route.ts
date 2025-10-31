import { NextRequest, NextResponse } from 'next/server';
import { webpush } from 'web-push';

// VAPID配置
const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NQD6F0jFSJj7Up5khOs8HCAHOqBZGNqn1jWiGCZbfZMUjO_gCZME4Pg';
const vapidPrivateKey = '4F-AaOzBwUnU2tz9dSbW9kUOGwAf3S6iGK9T9a8X7Q8'; // 示例密钥

// 配置web-push
webpush.setVapidDetails(
  'mailto:admin@luckymart.com',
  vapidPublicKey,
  vapidPrivateKey
);

declare global {
  var subscriptions: Map<string, any> | undefined;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { subscription, title, body, icon, badge, data, actions }: NotificationPayload = await request.json();
    
    // 验证订阅信息
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: '无效的订阅信息'
      }, { status: 400 });
    }
    
    // 准备通知载荷
    const notificationPayload = {
      title: title || 'LuckyMart-TJ',
      body: body || '您有新的消息',
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-72x72.png',
      data: {
        url: data?.url || '/',
        type: data?.type || 'info',
        timestamp: Date.now(),
        ...data
      },
      actions: actions || [
        {
          action: 'view',
          title: '查看',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: '关闭'
        }
      ],
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      tag: 'luckymart-test-notification'
    };
    
    // 发送通知
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
      
      console.log('测试通知发送成功:', subscription.endpoint);
      
      return NextResponse.json({
        success: true,
        message: '测试通知发送成功',
        statusCode: result.statusCode,
        body: result.body
      });
      
    } catch (webpushError) {
      console.error('发送推送通知失败:', webpushError);
      
      // 处理订阅无效的情况
      if (webpushError.statusCode === 410 || webpushError.statusCode === 404) {
        // 订阅已失效，删除订阅
        if (global.subscriptions) {
          global.subscriptions.delete(subscription.endpoint);
        }
        
        return NextResponse.json({
          success: false,
          error: '订阅已失效，已自动删除',
          code: 'SUBSCRIPTION_EXPIRED'
        }, { status: 410 });
      }
      
      throw webpushError;
    }
    
  } catch (error) {
    console.error('发送测试通知失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '发送通知失败'
    }, { status: 500 });
  }
}