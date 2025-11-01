import { NextRequest, NextResponse } from 'next/server';

declare global {
  var subscriptions: Map<string, any> | undefined;
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;
    
    // 验证端点
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: '缺少端点参数'
      }, { status: 400 });
}
    
    // 检查订阅是否存在
    if (global.subscriptions && global.subscriptions.has(endpoint)) {
      global.subscriptions.delete(endpoint);
      
      logger.info("API Log", { requestId, data: '订阅删除成功:', endpoint });'订阅删除成功:', endpoint);
      
      return NextResponse.json({
        success: true,
        message: '订阅删除成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '订阅不存在'
      }, { status: 404 });
    }
    
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'删除订阅失败:', error);
    return NextResponse.json({
  }
      success: false,
      error: '删除订阅失败'
    }, );
  }
}