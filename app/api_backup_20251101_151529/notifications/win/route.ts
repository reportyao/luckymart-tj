import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { authenticateUser } from '../../../../lib/auth';

// POST /api/notifications/win - 发送中奖通知
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const { participationId, notificationType = 'telegram' } = body;

    if (!participationId) {
      return NextResponse.json(
        { success: false, error: '参与记录ID不能为空' },
        { status: 400 }
      );
    }

    // 获取中奖记录
    const participation = await prisma.participations.findFirst({
      where: {
        id: participationId,
        userId: user.id,
        isWinner: true
      },
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
                marketPrice: true,
                totalShares: true,
                pricePerShare: true
              }
            }
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { success: false, error: '中奖记录不存在' },
        { status: 404 }
      );
    }

    // 检查是否已经发送过通知（避免重复通知）
    const existingNotification = await prisma.notifications.findFirst({
      where: {
        userId: user.id,
        type: 'lottery_win',
        content: {
          contains: participation.id
        }
      }
    });

    if (existingNotification) {
      return NextResponse.json(
        { success: false, error: '已经发送过中奖通知' },
        { status: 400 }
      );
    }

    // 计算奖金
    const prize = calculatePrize(participation.round.product, participation.sharesCount);
    
    // 获取用户语言设置
    const userLanguage = user.preferredLanguage || 'tg-TJ';
    
    // 生成多语言通知内容
    const notificationContent = generateWinNotification(participation, prize, userLanguage);

    // 发送Telegram通知（如果用户已绑定）
    let telegramSuccess = false;
    if (notificationType === 'telegram' && user.telegramId) {
      try {
        telegramSuccess = await sendTelegramWinNotification(user.telegramId, notificationContent);
      } catch (error) {
        console.error('发送Telegram通知失败:', error);
      }
    }

    // 保存通知记录
    const notification = await prisma.notifications.create({
      data: {
        userId: user.id,
        type: 'lottery_win',
        content: JSON.stringify({
          participationId: participation.id,
          productName: getMultilingualProductName(participation.round.product),
          winningNumber: participation.round.winningNumber,
          prize: prize.amount,
          prizeType: prize.type,
          telegramSent: telegramSuccess,
          timestamp: new Date().toISOString()
        }),
        status: telegramSuccess ? 'sent' : 'pending',
        sentAt: telegramSuccess ? new Date() : null,
        createdAt: new Date()
      }
    });

    // 更新用户统计（如果需要）
    await updateUserWinStats(user.id, participation.id);

    return NextResponse.json({
      success: true,
      data: {
        notificationId: notification.id,
        telegramSent: telegramSuccess,
        prize: prize.amount,
        message: '中奖通知已发送'
      }
    });

  } catch (error) {
    console.error('发送中奖通知失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/win - 获取用户中奖通知
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticateUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || 'all'; // 'all', 'sent', 'pending', 'failed'

    // 构建查询条件
    let whereConditions: any = {
      userId: user.id,
      type: 'lottery_win'
    };

    if (status !== 'all') {
      whereConditions.status = status;
    }

    // 获取通知总数
    const totalCount = await prisma.notifications.count({
      where: whereConditions
    });

    // 获取通知列表
    const notifications = await prisma.notifications.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // 转换数据格式
    const notificationList = notifications.map((notification : any) => {
      let content = {};
      try {
        content = typeof notification.content === 'string' 
          ? JSON.parse(notification.content) 
          : notification.content;
      } catch (error) {
        console.warn('解析通知内容失败:', error);
      }

      return {
        id: notification.id,
        type: notification.type,
        status: notification.status,
        sentAt: notification.sentAt?.toISOString(),
        createdAt: notification.createdAt.toISOString(),
        content
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: notificationList,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: offset + notificationList.length < totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取中奖通知失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 发送Telegram中奖通知
async function sendTelegramWinNotification(telegramId: string, notificationContent: any): Promise<boolean> {
  try {
    // 这里应该调用Telegram Bot API发送消息
    // 由于我们在后端环境，这里模拟发送过程
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn('Telegram Bot Token未配置');
      return false;
    }

    const chatId = parseInt(telegramId);
    if (!chatId) {
      console.warn('无效的Telegram ID:', telegramId);
      return false;
    }

    const message = buildTelegramMessage(notificationContent);
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        parse_mode: 'HTML',
        reply_markup: message.keyboard
      })
    });

    if (response.ok) {
      console.log('Telegram中奖通知发送成功:', chatId);
      return true;
    } else {
      const errorData = await response.text();
      console.error('Telegram发送失败:', errorData);
      return false;
    }

  } catch (error) {
    console.error('Telegram通知发送异常:', error);
    return false;
  }
}

// 生成中奖通知内容
function generateWinNotification(participation: any, prize: any, language: string) {
  const product = participation.round.product;
  const productName = getMultilingualProductName(product);
  
  // 根据语言生成不同的通知模板
  const templates = {
    'zh-CN': {
      title: '🎉 恭喜您中奖了！',
      message: `您参与的${productName}第${participation.round.roundNumber}期已经开奖！

🏆 中奖号码：${participation.round.winningNumber}
💰 奖金金额：${prize.amount} TJS
🎟️ 您的号码：${participation.numbers.join(', ')}

请及时领取您的奖金，感谢您的参与！`,
      claimButton: '立即领奖',
      viewDetails: '查看详情'
    },
    'en-US': {
      title: '🎉 Congratulations! You Won!',
      message: `Your participation in ${productName} Round ${participation.round.roundNumber} has been drawn!

🏆 Winning Number: ${participation.round.winningNumber}
💰 Prize Amount: ${prize.amount} TJS
🎟️ Your Numbers: ${participation.numbers.join(', ')}

Please claim your prize in time. Thank you for your participation!`,
      claimButton: 'Claim Prize',
      viewDetails: 'View Details'
    },
    'ru-RU': {
      title: '🎉 Поздравляем! Вы выиграли!',
      message: `Ваше участие в ${productName} Раунд ${participation.round.roundNumber} было розыграно!

🏆 Выигрышный номер: ${participation.round.winningNumber}
💰 Сумма приза: ${prize.amount} TJS
🎟️ Ваши номера: ${participation.numbers.join(', ')}

Пожалуйста, получите свой приз вовремя. Спасибо за участие!`,
      claimButton: 'Получить приз',
      viewDetails: 'Подробнее'
    },
    'tg-TJ': {
      title: '🎉 Табрикоти эҳсос мекунем! Шумо ғолиб шудед!',
      message: `Иштироки шумо дар ${productName} Давраи ${participation.round.roundNumber} тир карда шуд!

🏆 Рақами ғолиб: ${participation.round.winningNumber}
💰 Маблағи ҷойиза: ${prize.amount} TJS
🎟️ Рақамҳои шумо: ${participation.numbers.join(', ')}

Лутфан ҷойизаи худро ба вақт гиред. Барои иштироки шумо ташаккур!`,
      claimButton: 'Ҷойиза гирифтан',
      viewDetails: 'Бисёртар дидан'
    }
  };

  const template = templates[language as keyof typeof templates] || templates['zh-CN'];

  return {
    ...template,
    productName,
    roundNumber: participation.round.roundNumber,
    winningNumber: participation.round.winningNumber,
    prize: prize.amount,
    prizeType: prize.type,
    numbers: participation.numbers,
    claimUrl: `${process.env.NEXT_PUBLIC_APP_URL || '${API_BASE_URL}'}/lottery/claim?participationId=${participation.id}`,
    detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL || '${API_BASE_URL}'}/lottery/records`
  };
}

// 构建Telegram消息格式
function buildTelegramMessage(content: any) {
  const text = `${content.title}\n\n${content.message}`;
  
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: content.claimButton,
          url: content.claimUrl
        },
        {
          text: content.viewDetails,
          url: content.detailsUrl
        }
      ]
    ]
  };

  return { text, keyboard };
}

// 计算奖金的辅助函数
function calculatePrize(product: any, sharesCount: number): { amount: number; type: string; description: string } {
  const pricePerShare = parseFloat(product.pricePerShare.toString());
  const fixedPrize = 10; // 固定奖金
  const percentagePrize = pricePerShare * sharesCount * 0.1; // 10%商品价值
  
  const totalPrize = fixedPrize + percentagePrize;
  
  let prizeType = 'standard';
  if (totalPrize >= 100) prizeType = 'jackpot';
  else if (totalPrize >= 50) prizeType = 'major';
  else if (totalPrize >= 20) prizeType = 'medium';
  
  return {
    amount: parseFloat(totalPrize.toFixed(2)),
    type: prizeType,
    description: `固定奖金 ${fixedPrize}TJS + 比例奖金 ${percentagePrize.toFixed(2)}TJS`
  };
}

// 更新用户中奖统计
async function updateUserWinStats(userId: string, participationId: string) {
  try {
    // 这里可以更新用户的统计数据
    // 比如更新最后中奖时间、中奖次数等
    
    await prisma.users.update({
      where: { id: userId },
      data: {
        updatedAt: new Date()
      }
    });
    
    console.log('用户中奖统计已更新:', userId);
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}

// 获取多语言商品名称的辅助函数
function getMultilingualProductName(product: any): string {
  if (product.nameMultilingual) {
    try {
      const nameData = typeof product.nameMultilingual === 'string' 
        ? JSON.parse(product.nameMultilingual) 
        : product.nameMultilingual;
      
      const languages = ['zh-CN', 'zh', 'en', 'ru', 'tg'];
      
      for (const lang of languages) {
        if (nameData[lang] && nameData[lang].name) {
          return nameData[lang].name;
        }
      }
      
      const firstName = Object.values(nameData).find((value: any) => 
        value && typeof value === 'object' && value.name
      ) as any;
      
      if (firstName) {
        return firstName.name;
      }
    } catch (error) {
      console.warn('解析多语言名称失败:', error);
    }
  }

  return product.nameZh || product.nameEn || product.nameRu || '未知商品';
}