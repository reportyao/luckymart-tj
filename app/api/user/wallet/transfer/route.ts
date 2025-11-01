import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// JWT验证中间件
function verifyToken(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  }
  } catch (error) {
    return null;
  }
}

// 余额转幸运币
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    
    if (!decoded) {
      return NextResponse.json(;
}
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { userId } = decoded;
    const { amount, luckyCoins } = await req.json();

    // 验证输入
    if (!amount || amount <= 0) {
      return NextResponse.json(;
        { success: false, error: '转换金额必须大于0' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(;
        { success: false, error: '最小转换金额为1 TJS' },
        { status: 400 }
      );
    }

    // 开启事务
    const result = await prisma.$transaction(async (tx) => {
      // 获取用户当前余额
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          balance: true,
          luckyCoins: true,
          currency: true
        }
      });

      if (!user) {
        throw new Error('用户不存在');
  }
      }

      // 检查余额是否足够
      if (user.balance < amount) {
        throw new Error('余额不足');
      }

      // 计算应该获得的幸运币数量
      const calculatedLuckyCoins = Math.floor(amount);

      // 更新用户余额和幸运币
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount
          },
          luckyCoins: {
            increment: calculatedLuckyCoins
          }
        },
        select: {
          balance: true,
          luckyCoins: true,
          currency: true
        }
      });

      // 创建转出交易记录
      const transferOutTransaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'transfer_out',
          amount: amount,
          currency: user.currency || 'TJS',
          description: `余额转幸运币：-${amount} TJS`,
          status: 'completed'
        }
      });

      // 创建转入交易记录
      const transferInTransaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'transfer_in',
          luckyCoins: calculatedLuckyCoins,
          description: `转换为幸运币：+${calculatedLuckyCoins} LC`,
          status: 'completed'
        }
      });

      return {
        updatedUser,
        transferOutTransaction,
        transferInTransaction
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.updatedUser.balance,
        newLuckyCoins: result.updatedUser.luckyCoins,
        convertedAmount: amount,
        convertedLuckyCoins: Math.floor(amount),
        transactions: {
          outId: result.transferOutTransaction.id,
          inId: result.transferInTransaction.id
        }
      },
      message: '转换成功'
    });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'余额转幸运币失败:', error);
    
    // 处理业务错误
    if (error instanceof Error) {
      if (error.message === '余额不足') {
        return NextResponse.json(;
          { success: false, error: '余额不足' },
          { status: 400 }
        );
      }
      if (error.message === '用户不存在') {
        return NextResponse.json(;
          { success: false, error: '用户不存在' },
          
        );
      }
    }

    return NextResponse.json(;
      ,
      
    );
  }
}