// 用户类型
export interface User {
  id: string;
  telegramId: string; // 改为String类型，与数据库保持一致
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  language: string;
  balance: number;
  platformBalance: number;
  vipLevel: number;
  totalSpent: number;
  freeDailyCount: number;
  lastFreeResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 用户地址类型
export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  city: string;
  district?: string;
  addressLine: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 商品类型
export interface Product {
  id: string;
  nameZh: string;
  nameEn: string;
  nameRu: string;
  descriptionZh?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  images: string[];
  marketPrice: number;
  totalShares: number;
  pricePerShare: number;
  category?: string;
  stock: number;
  status: 'active' | 'pending' | 'soldout' | 'inactive';
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
  status: 'active' | 'full' | 'drawing' | 'completed'; // 改为与schema一致的'active'
  winnerUserId?: string;
  winningNumber?: number;
  drawTime?: Date;
  drawAlgorithmData?: any;
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
  type: 'free' | 'paid';
  cost: number;
  isWinner: boolean;
  createdAt: Date;
}

// 订单类型
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  roundId?: string;
  productId?: string;
  type: 'lottery_win' | 'direct_buy' | 'recharge' | 'resale' | 'resale_purchase';
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'resold';
  shippingAddress?: any;
  trackingNumber?: string;
  notes?: string;
  // 转售相关字段
  isResale: boolean;
  resalePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 充值礼包类型
export interface RechargePackage {
  id: string;
  nameZh: string;
  nameEn: string;
  nameRu: string;
  price: number;
  coins: number;
  bonusCoins: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// 转售列表类型
export interface ResaleListing {
  id: string;
  sellerUserId: string;
  buyerUserId?: string;
  orderId: string;
  productId?: string;
  listingPrice: number;
  platformFee: number;
  status: 'pending' | 'active' | 'sold';
  listedAt: Date;
  soldAt?: Date;
  // 关联数据
  products?: {
    id: string;
    nameZh: string;
    nameEn: string;
    images: string[];
    marketPrice: number;
  };
  sellers?: {
    username?: string;
    firstName?: string;
  };
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
