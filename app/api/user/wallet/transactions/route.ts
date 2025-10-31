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
  } catch (error) {
    return null;
  }
}

// 获取用户钱包交易记录
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { userId } = decoded;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // 构建查询条件
    const where: any = {
      userId: userId
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    // 获取交易记录
    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // 限制返回50条记录
    });

    // 格式化交易记录
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      luckyCoins: transaction.luckyCoins,
      currency: transaction.currency,
      description: transaction.description || getTransactionDescription(transaction.type),
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedTransactions
    });

  } catch (error) {
    console.error('获取交易记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取交易记录失败' },
      { status: 500 }
    );
  }
}

// 获取交易类型描述
function getTransactionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    recharge: '账户充值',
    transfer_in: '余额转入',
    transfer_out: '余额转出',
    purchase: '商品购买',
    reward: '奖励收入'
  };
  
  return descriptions[type] || '未知交易';
}