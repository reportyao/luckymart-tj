import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Simple in-memory storage (in production, use database)
let systemSettings = {
  siteName: 'LuckyMart TJ',
  minRechargeAmount: 10,
  minWithdrawAmount: 50,
  withdrawFeeRate: 0.05,
  freeDrawsPerDay: 3,
  enableNotifications: true,
  enableTelegramBot: true,
  maintenanceMode: false,
  // 银行充值信息
  rechargeBankName: '',
  rechargeBankAccountNumber: '',
  rechargeBankAccountHolder: '',
  rechargeBankBranch: '',
  rechargeInstructions: ''
};

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ settings: systemSettings });

  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();

    // Validate and update settings
    if (data.siteName) systemSettings.siteName = data.siteName;
    if (typeof data.minRechargeAmount === 'number') systemSettings.minRechargeAmount = data.minRechargeAmount;
    if (typeof data.minWithdrawAmount === 'number') systemSettings.minWithdrawAmount = data.minWithdrawAmount;
    if (typeof data.withdrawFeeRate === 'number') systemSettings.withdrawFeeRate = data.withdrawFeeRate;
    if (typeof data.freeDrawsPerDay === 'number') systemSettings.freeDrawsPerDay = data.freeDrawsPerDay;
    if (typeof data.enableNotifications === 'boolean') systemSettings.enableNotifications = data.enableNotifications;
    if (typeof data.enableTelegramBot === 'boolean') systemSettings.enableTelegramBot = data.enableTelegramBot;
    if (typeof data.maintenanceMode === 'boolean') systemSettings.maintenanceMode = data.maintenanceMode;
    
    // 银行充值信息
    if (data.rechargeBankName !== undefined) systemSettings.rechargeBankName = data.rechargeBankName;
    if (data.rechargeBankAccountNumber !== undefined) systemSettings.rechargeBankAccountNumber = data.rechargeBankAccountNumber;
    if (data.rechargeBankAccountHolder !== undefined) systemSettings.rechargeBankAccountHolder = data.rechargeBankAccountHolder;
    if (data.rechargeBankBranch !== undefined) systemSettings.rechargeBankBranch = data.rechargeBankBranch;
    if (data.rechargeInstructions !== undefined) systemSettings.rechargeInstructions = data.rechargeInstructions;

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: systemSettings
    });

  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
