// Prisma Decimal 类型处理
import type { Prisma } from '@prisma/client';

export interface PrismaDecimal {
  toNumber(): number;
  toString(): string;
}

export function isPrismaDecimal(value: any): value is PrismaDecimal {
  return value && typeof value.toNumber === 'function';
}

export function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (isPrismaDecimal(value)) return value.toNumber();
  return Number(value);
}

// 抽奖轮次状态常量
export const LOTTERY_ROUND_STATUS = {
  ACTIVE: 'active',
  FULL: 'full',
  DRAWING: 'drawing',
  COMPLETED: 'completed'
} as const;

export type LotteryRoundStatus = typeof LOTTERY_ROUND_STATUS[keyof typeof LOTTERY_ROUND_STATUS];

// 开奖算法数据类型
export interface DrawAlgorithmData {
  algorithm: string;
  seed: string;
  timestamp: Date;
  [key: string]: any;
}

// 收货地址类型
export interface ShippingAddress {
  recipientName: string;
  phone: string;
  city: string;
  district?: string;
  addressLine: string;
  postalCode?: string;
}

// 日期处理工具
export function serializeDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

// 用户类型
export interface User {
  id: string;
  telegramId: string; // @db.VarChar(255)
  username?: string; // @db.VarChar(255)
  firstName: string; // @db.VarChar(255)
  lastName?: string; // @db.VarChar(255)
  avatarUrl?: string;
  language: string; // @db.VarChar(5)
  coinBalance: number; // Decimal @db.Decimal(10, 1) - 从balance重命名
  platformBalance: number; // Decimal @db.Decimal(10, 2)
  vipLevel: number;
  totalSpent: number; // Decimal @db.Decimal(10, 2)
  freeDailyCount: number;
  lastFreeResetDate: Date; // @db.Date
  referralCode?: string; // 邀请码
  createdAt: Date;
  updatedAt: Date;
}

// 用户地址类型
export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string; // @db.VarChar(50)
  city: string; // @db.VarChar(100)
  district?: string; // @db.VarChar(100)
  addressLine: string;
  postalCode?: string; // @db.VarChar(20)
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 营销角标类型
export interface MarketingBadge {
  textZh: string;  // 中文文案
  textEn: string;  // 英文文案
  textRu: string;  // 俄文文案
  color: string;   // 文字颜色，如 '#FFFFFF'
  bgColor: string; // 背景颜色，如 '#FF0000'
  position: 'top-left' | 'top-right' | 'center'; // 位置
  animation?: 'pulse' | 'bounce' | 'none'; // 动画效果
  enabled: boolean; // 是否启用
}

// 商品类型
export interface Product {
  id: string;
  nameZh: string; // @db.VarChar(255)
  nameEn: string; // @db.VarChar(255)
  nameRu: string; // @db.VarChar(255)
  descriptionZh?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  images: string[];
  marketPrice: number; // Decimal @db.Decimal(10, 2)
  totalShares: number;
  pricePerShare: number; // Decimal @db.Decimal(10, 2)
  category?: string; // @db.VarChar(100)
  stock: number;
  status: 'active' | 'pending' | 'soldout' | 'inactive';
  marketingBadge?: MarketingBadge | null; // 营销角标
  createdAt: Date;
  updatedAt: Date;
}

// 夺宝期次类型
export interface LotteryRound {
  id: string;
  productId: string;
  roundNumber: number;
  totalShares: number;
  soldShares: number;
  status: LotteryRoundStatus; // 使用常量类型
  winnerUserId?: string;
  winningNumber?: number;
  drawTime?: Date;
  drawAlgorithmData?: DrawAlgorithmData;
  pricePerShare: number; // Decimal @db.Decimal(10, 2)
  participants: number;
  createdAt: Date;
  updatedAt: Date;
}

// 参与记录类型
export interface Participation {
  id: string;
  userId: string;
  roundId: string;
  productId: string;
  numbers: number[];
  sharesCount: number;
  type: 'free' | 'paid'; // @db.VarChar(10)
  cost: number; // Decimal @db.Decimal(10, 2)
  isWinner: boolean;
  createdAt: Date;
}

// 订单类型
export interface Order {
  id: string;
  orderNumber: string; // @db.VarChar(50)
  userId: string;
  roundId?: string;
  productId?: string;
  type: 'lottery_win' | 'direct_buy' | 'recharge' | 'resale' | 'resale_purchase'; // @db.VarChar(20)
  quantity: number;
  totalAmount: number; // Decimal @db.Decimal(10, 2)
  status: 'pending' | 'confirmed' | 'cancelled'; // @db.VarChar(20)
  paymentMethod?: string; // @db.VarChar(50)
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled'; // @db.VarChar(20)
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'resold'; // @db.VarChar(20)
  shippingAddress?: ShippingAddress; // Json
  trackingNumber?: string; // @db.VarChar(255)
  notes?: string;
  // 转售相关字段
  isResale: boolean;
  resalePrice?: number; // Decimal @db.Decimal(10, 2)
  createdAt: Date;
  updatedAt: Date;
}

// 转售列表类型
export interface ResaleListing {
  id: string;
  sellerUserId: string;
  buyerUserId?: string;
  orderId: string;
  productId?: string;
  listingPrice: number; // Decimal @db.Decimal(10, 2)
  platformFee: number; // Decimal @db.Decimal(10, 2)
  status: 'pending' | 'active' | 'sold'; // @db.VarChar(20)
  listedAt: Date;
  soldAt?: Date;
  // 关联数据
  products?: {
    id: string;
    nameZh: string;
    nameEn: string;
    images: string[];
    marketPrice: number; // Decimal @db.Decimal(10, 2)
  };
  sellers?: {
    username?: string;
    firstName?: string;
  };
}

// 提现申请类型
export interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number; // Decimal @db.Decimal(10, 2)
  fee: number; // Decimal @db.Decimal(10, 2)
  actualAmount: number; // Decimal @db.Decimal(10, 2)
  withdrawMethod: 'alif_mobi' | 'dc_bank'; // @db.VarChar(20)
  accountInfo: {
    accountNumber: string;
    accountName: string;
    [key: string]: any; // Json data
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed'; // @db.VarChar(20)
  rejectReason?: string;
  adminNote?: string;
  processedAt?: Date;
  createdAt: Date;
}

// 交易记录类型
export interface Transaction {
  id: string;
  userId: string;
  type: 'recharge' | 'lottery' | 'win' | 'resale_income' | 'resale_purchase' | 'withdraw' | 'refund'; // @db.VarChar(50)
  amount: number; // Decimal @db.Decimal(10, 2)
  balanceType: 'balance' | 'platformBalance'; // @db.VarChar(20)
  relatedOrderId?: string;
  description?: string;
  createdAt: Date;
}

// 充值礼包类型
export interface RechargePackage {
  id: string;
  nameZh: string; // @db.VarChar(255)
  nameEn: string; // @db.VarChar(255)
  nameRu: string; // @db.VarChar(255)
  price: number; // Decimal @db.Decimal(10, 2)
  coins: number;
  bonusCoins: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 类型守卫函数
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.telegramId === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.language === 'string';
}

export function isProduct(obj: any): obj is Product {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.nameZh === 'string' &&
    Array.isArray(obj.images);
}

export function isOrder(obj: any): obj is Order {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.orderNumber === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.quantity === 'number';
}

export function isWithdrawRequest(obj: any): obj is WithdrawRequest {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.withdrawMethod === 'string';
}

export function isTransaction(obj: any): obj is Transaction {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.amount === 'number';
}

export function isUserAddress(obj: any): obj is UserAddress {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.recipientName === 'string' &&
    typeof obj.phone === 'string';
}

export function isLotteryRound(obj: any): obj is LotteryRound {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.productId === 'string' &&
    typeof obj.roundNumber === 'number';
}

export function isParticipation(obj: any): obj is Participation {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.roundId === 'string' &&
    Array.isArray(obj.numbers);
}

export function isResaleListing(obj: any): obj is ResaleListing {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.sellerUserId === 'string' &&
    typeof obj.orderId === 'string';
}

export function isRechargePackage(obj: any): obj is RechargePackage {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.nameZh === 'string' &&
    typeof obj.coins === 'number';
}

// 数据转换工具函数
export function convertUserFromPrisma(user: any): User {
  return {
    ...user,
    balance: toNumber(user.balance),
    platformBalance: toNumber(user.platformBalance),
    totalSpent: toNumber(user.totalSpent)
  };
}

export function convertProductFromPrisma(product: any): Product {
  return {
    ...product,
    marketPrice: toNumber(product.marketPrice),
    pricePerShare: toNumber(product.pricePerShare)
  };
}

export function convertOrderFromPrisma(order: any): Order {
  return {
    ...order,
    totalAmount: toNumber(order.totalAmount),
    resalePrice: toNumber(order.resalePrice)
  };
}

export function convertTransactionFromPrisma(transaction: any): Transaction {
  return {
    ...transaction,
    amount: toNumber(transaction.amount)
  };
}

export function convertWithdrawRequestFromPrisma(withdrawRequest: any): WithdrawRequest {
  return {
    ...withdrawRequest,
    amount: toNumber(withdrawRequest.amount),
    fee: toNumber(withdrawRequest.fee),
    actualAmount: toNumber(withdrawRequest.actualAmount)
  };
}

export function convertParticipationFromPrisma(participation: any): Participation {
  return {
    ...participation,
    cost: toNumber(participation.cost)
  };
}

export function convertResaleListingFromPrisma(resaleListing: any): ResaleListing {
  return {
    ...resaleListing,
    listingPrice: toNumber(resaleListing.listingPrice),
    platformFee: toNumber(resaleListing.platformFee),
    products: resaleListing.products ? {
      ...resaleListing.products,
      marketPrice: toNumber(resaleListing.products.marketPrice)
    } : undefined
  };
}

export function convertRechargePackageFromPrisma(rechargePackage: any): RechargePackage {
  return {
    ...rechargePackage,
    price: toNumber(rechargePackage.price)
  };
}

// 批量数据转换
export function convertUsersFromPrisma(users: any[]): User[] {
  return users.map(convertUserFromPrisma);
}

export function convertProductsFromPrisma(products: any[]): Product[] {
  return products.map(convertProductFromPrisma);
}

export function convertOrdersFromPrisma(orders: any[]): Order[] {
  return orders.map(convertOrderFromPrisma);
}

export function convertTransactionsFromPrisma(transactions: any[]): Transaction[] {
  return transactions.map(convertTransactionFromPrisma);
}

export function convertWithdrawRequestsFromPrisma(withdrawRequests: any[]): WithdrawRequest[] {
  return withdrawRequests.map(convertWithdrawRequestFromPrisma);
}

// 邀请码相关类型
export interface ShareLinks {
  telegram: string;
  general: string;
}

export interface ShareTexts {
  zh: string;
  ru: string;
  tg: string;
}

export interface ReferralData {
  referralCode: string;
  shareLinks: ShareLinks;
  shareTexts: ShareTexts;
}

// 邀请关系类型
export interface ReferralRelationship {
  id: string;
  referrerUserId: string; // 邀请人ID
  referredUserId: string; // 被邀请人ID
  referralCode: string; // 邀请码
  rewardAmount: number; // 奖励金额
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

// 转换邀请关系数据
export function convertReferralRelationshipFromPrisma(relationship: any): ReferralRelationship {
  return {
    ...relationship,
    rewardAmount: toNumber(relationship.rewardAmount)
  };
}

export function convertReferralRelationshipsFromPrisma(relationships: any[]): ReferralRelationship[] {
  return relationships.map(convertReferralRelationshipFromPrisma);
}