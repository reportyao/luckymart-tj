import { NextRequest, NextResponse } from 'next/server';


// 临时的通知测试路由，移除web-push依赖
export async function POST(request: NextRequest) {
  try {
    const { subscription, title, body, icon, badge, data, actions } = await request.json();
    
    // 验证订阅信息
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: '无效的订阅信息'
      }, { status: 400 });
}
    
    // 模拟通知发送
    logger.info("API Log", { requestId, data: (arguments?.0 ?? null) }).toISOString()
    });
    
    return NextResponse.json({
  }
      success: true,
      message: '测试通知发送成功（模拟）',
      statusCode: 200,
      note: '这是模拟响应，实际环境需要安装web-push包'
    });
    
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'发送测试通知失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '发送通知失败'
    }, );
  }
}