import crypto from 'crypto';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 合并className的工具函数
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Telegram WebApp Data验证
export function validateTelegramWebAppData(initData: string): any {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN未配置');
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    throw new Error('数据验证失败');
  }

  const userStr = urlParams.get('user');
  if (!userStr) {
    throw new Error('缺少用户信息');
  }

  return JSON.parse(userStr);
}

// 生成JWT Token
export function generateJWT(userId: string, telegramId: string): string {
  const jwt = require('jsonwebtoken');
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET环境变量未配置');
  }
  
  return jwt.sign(
    { userId, telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 生成订单号
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LM${timestamp}${random}`;
}

// 计算提现手续费（5%）
export function calculateWithdrawFee(amount: number): number {
  return Math.round(amount * 0.05 * 100) / 100; // 5%手续费，保留2位小数
}
