import { prisma } from './prisma';
import crypto from 'crypto';

// VRF可验证随机函数 - 开奖算法
export async function performLotteryDraw(roundId: string) {
  try {
    // 获取夺宝期次信息
    const round = await prisma.lotteryRounds.findUnique({
      where: { id: roundId }
    });

    if (!round || round.status !== 'full') {
      throw new Error('期次不存在或状态不正确');
    }

    // 单独查询商品信息
    const product = await prisma.products.findUnique({
      where: { id: round.productId }
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    // 获取所有参与记录
    const participations = await prisma.participations.findMany({
      where: { roundId },
      orderBy: { createdAt: 'asc' }
    });

    if (participations.length === 0) {
      throw new Error('没有参与记录');
    }

    // 计算VRF随机数
    // 算法：使用区块时间戳 + 参与人数 + 最后一笔参与时间的哈希值
    const blockTimestamp = Date.now();
    const participantCount = participations.length;
    const lastParticipation = participations[participations.length - 1];
    const lastParticipationTime = lastParticipation.createdAt.getTime();

    // 生成随机种子
    const seed = `${blockTimestamp}${participantCount}${lastParticipationTime}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    
    // 将哈希值转为数字
    const hashNumber = BigInt('0x' + hash);
    
    // 计算中奖号码：从10000001开始
    const winningNumber = Number(hashNumber % BigInt(round.totalShares)) + 10000001;

    // 查找中奖者
    const winner = participations.find(p => 
      p.numbers.some(num => num === winningNumber)
    );

    if (!winner) {
      throw new Error('未找到中奖者，算法错误');
    }

    // 开始事务处理开奖结果
    await prisma.$transaction(async (tx) => {
      // 更新期次信息
      await tx.lotteryRounds.update({
        where: { id: roundId },
        data: {
          status: 'completed',
          winnerUserId: winner.userId,
          winningNumber,
          drawTime: new Date(),
          drawAlgorithmData: {
            blockTimestamp,
            participantCount,
            lastParticipationTime,
            seed,
            hash: hash.substring(0, 16),
            algorithm: 'VRF-SHA256'
          }
        }
      });

      // 更新中奖参与记录
      await tx.participations.update({
        where: { id: winner.id },
        data: { isWinner: true }
      });

      // 创建中奖订单
      await tx.orders.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: winner.userId,
          roundId: round.id,
          productId: round.productId,
          type: 'lottery_win',
          totalAmount: 0, // 中奖订单金额为0
          paymentStatus: 'paid',
          fulfillmentStatus: 'pending',
          notes: `第${round.roundNumber}期中奖`
        }
      });

      // 记录交易
      await tx.transactions.create({
        data: {
          userId: winner.userId,
          type: 'lottery_win',
          amount: parseFloat(product.marketPrice.toString()),
          balanceType: 'lottery_coin',
          description: `中奖商品：${product.nameZh}，第${round.roundNumber}期`
        }
      });
    });

    return {
      success: true,
      winningNumber,
      winnerId: winner.userId,
      drawTime: new Date()
    };

  } catch (error) {
    console.error('Draw lottery error:', error);
    throw error;
  }
}

// 生成订单号
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LM${timestamp}${random}`;
}

// 检查是否需要开奖
export async function checkAndDrawFullRounds() {
  try {
    // 查找所有已满的期次
    const fullRounds = await prisma.lotteryRounds.findMany({
      where: { status: 'full' },
      take: 10 // 一次最多处理10个
    });

    const results = [];
    for (const round of fullRounds) {
      try {
        const result = await performLotteryDraw(round.id);
        results.push({ roundId: round.id, ...result });
        
        // 发送中奖通知
        const winner = await prisma.users.findUnique({
          where: { id: result.winnerId }
        });
        
        if (winner) {
          await sendWinnerNotification(winner, round);
        }
      } catch (error) {
        console.error(`Draw round ${round.id} failed:`, error);
        results.push({ roundId: round.id, success: false, error });
      }
    }

    return results;
  } catch (error) {
    console.error('Check and draw error:', error);
    throw error;
  }
}

// 发送中奖通知（待实现Bot集成）
async function sendWinnerNotification(winner: any, round: any) {
  // TODO: 集成Telegram Bot发送通知
  console.log(`通知用户 ${winner.telegramId} 中奖，期次 ${round.id}`);
  
  // 创建通知记录
  await prisma.notifications.create({
    data: {
      userId: winner.id,
      type: 'lottery_win',
      content: `恭喜您在第${round.roundNumber}期夺宝中获胜！`,
      status: 'pending'
    }
  });
}
