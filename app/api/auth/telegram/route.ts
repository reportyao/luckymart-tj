import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTelegramWebAppData, generateJWT } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: '缺少initData参数' }, { status: 400 });
    }

    // 验证Telegram WebApp数据
    const telegramUser = validateTelegramWebAppData(initData);

    // 查找或创建用户
    let user = await prisma.users.findUnique({
      where: { telegramId: telegramUser.id }
    });

    if (!user) {
      // 创建新用户并赠送50夺宝币
      user = await prisma.users.create({
        data: {
          telegramId: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          avatarUrl: telegramUser.photo_url,
          language: telegramUser.language_code === 'ru' ? 'ru' : 
                    telegramUser.language_code === 'zh' ? 'zh' : 'en',
          balance: 50, // 新用户赠送50夺宝币
        }
      });

      // 记录交易
      await prisma.transactions.create({
        data: {
          userId: user.id,
          type: 'bonus',
          amount: 50,
          balanceType: 'lottery_coin',
          description: '新用户注册赠送'
        }
      });

      // TODO: 发送欢迎通知（需要Bot Token配置后实现）
    }

    // 生成JWT Token
    const token = generateJWT(user.id, user.telegramId.toString());

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          language: user.language,
          balance: parseFloat(user.balance.toString()),
          platformBalance: parseFloat(user.platformBalance.toString()),
          vipLevel: user.vipLevel,
          freeDailyCount: user.freeDailyCount,
        }
      }
    });

  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      error: '认证失败',
      message: error.message 
    }, { status: 500 });
  }
}
