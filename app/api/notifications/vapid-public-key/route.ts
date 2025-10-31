import { NextRequest, NextResponse } from 'next/server';
import { webpush } from 'web-push';

// VAPID配置（生产环境需要替换为真实密钥）
const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NQD6F0jFSJj7Up5khOs8HCAHOqBZGNqn1jWiGCZbfZMUjO_gCZME4Pg';
const vapidPrivateKey = '4F-AaOzBwUnU2tz9dSbW9kUOGwAf3S6iGK9T9a8X7Q8'; // 示例密钥，生产环境需要使用真实密钥

// 配置web-push
webpush.setVapidDetails(
  'mailto:admin@luckymart.com',
  vapidPublicKey,
  vapidPrivateKey
);

// 获取VAPID公钥
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      publicKey: vapidPublicKey
    });
  } catch (error) {
    console.error('获取VAPID公钥失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取VAPID公钥失败'
    }, { status: 500 });
  }
}

// 保存订阅信息
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    const { userAgent, timestamp } = await request.json();
    
    // 验证订阅信息
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: '无效的订阅信息'
      }, { status: 400 });
    }
    
    // 保存订阅到数据库（这里使用内存存储，生产环境需要保存到数据库）
    const subscriptions = global.subscriptions || new Map();
    subscriptions.set(subscription.endpoint, {
      subscription,
      userAgent: userAgent || 'unknown',
      timestamp: timestamp || Date.now(),
      active: true
    });
    global.subscriptions = subscriptions;
    
    console.log('订阅保存成功:', subscription.endpoint);
    
    return NextResponse.json({
      success: true,
      message: '订阅保存成功'
    });
    
  } catch (error) {
    console.error('保存订阅失败:', error);
    return NextResponse.json({
      success: false,
      error: '保存订阅失败'
    }, { status: 500 });
  }
}