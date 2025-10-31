# 开发者指南

本文档为LuckyMart-TJ系统的开发者提供详细的技术架构、代码规范、开发环境和最佳实践指导。

## 🏗️ 技术架构

### 系统概览
LuckyMart-TJ采用现代化全栈架构，基于Next.js、Supabase和Prisma构建：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Telegram Bot   │    │  Admin Panel    │
│   (Frontend)    │    │   (Service)     │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────┼─────────────────────────────────┐
│                    API Gateway (Next.js API Routes)               │
└─────────────────────────────────┼─────────────────────────────────┘
                                 │
┌─────────────────────────────────┼─────────────────────────────────┐
│                      Business Logic Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Referral    │ │ Anti-Fraud  │ │ Instagram   │ │ QR Code     │ │
│  │ System      │ │ System      │ │ Poster API  │ │ Generator   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┼─────────────────────────────────┘
                                 │
┌─────────────────────────────────┼─────────────────────────────────┐
│                       Data Access Layer                           │
│         ┌─────────────────┐ ┌─────────────────┐                   │
│         │   Prisma ORM    │ │   Cache Layer   │                   │
│         └─────────────────┘ └─────────────────┘                   │
└─────────────────────────────────┼─────────────────────────────────┘
                                 │
┌─────────────────────────────────┼─────────────────────────────────┐
│                       Database & Storage                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ PostgreSQL  │ │   Redis     │ │ Supabase    │ │ File        │ │
│  │ (Primary)   │ │ (Cache)     │ │ (Auth/API)  │ │ Storage     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 前端 (Next.js)
- **框架**: Next.js 14.2.33
- **语言**: TypeScript 5.6.2
- **UI库**: React 18.3.1 + Tailwind CSS 3.4.10
- **状态管理**: React Context + Hooks
- **路由**: Next.js App Router

#### 后端服务
- **API层**: Next.js API Routes
- **ORM**: Prisma 6.18.0
- **认证**: Supabase Auth + JWT
- **缓存**: Redis (ioredis 5.4.1)
- **队列**: Supabase Edge Functions

#### 数据库
- **主数据库**: PostgreSQL 13+
- **缓存**: Redis 6.0+
- **存储**: Supabase Storage
- **搜索**: PostgreSQL Full-text Search

#### 外部服务
- **认证服务**: Supabase Auth
- **机器人**: Telegram Bot API
- **支付**: 集成多种支付网关
- **监控**: 自建监控系统

## 📁 项目结构

```
luckymart-tj/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   ├── api/                      # API Routes
│   │   ├── auth/                 # 认证接口
│   │   ├── user/                 # 用户管理接口
│   │   ├── products/             # 产品管理接口
│   │   ├── orders/               # 订单处理接口
│   │   ├── referral/             # 推荐系统接口
│   │   ├── rewards/              # 奖励管理接口
│   │   ├── bot/                  # 机器人相关接口
│   │   ├── anti-fraud/           # 防欺诈系统接口
│   │   ├── instagram/            # Instagram API接口
│   │   └── qr/                   # QR码生成接口
│   ├── admin/                    # 管理后台
│   ├── referral/                 # 推荐系统页面
│   ├── profile/                  # 用户个人中心
│   ├── products/                 # 产品页面
│   └── ...
├── bot/                          # Telegram机器人
│   ├── index.ts                  # 机器人入口
│   ├── handlers/                 # 消息处理器
│   ├── services/                 # 业务服务
│   └── utils/                    # 工具函数
├── lib/                          # 核心库
│   ├── auth.ts                   # 认证相关
│   ├── prisma.ts                 # 数据库客户端
│   ├── cache-manager.ts          # 缓存管理
│   ├── database-lock.ts          # 数据库锁
│   ├── anti-fraud/               # 防欺诈系统
│   ├── instagram-poster/         # Instagram海报生成
│   ├── qr-code/                  # QR码生成
│   └── types/                    # TypeScript类型定义
├── prisma/                       # 数据库架构
│   ├── schema.prisma             # Prisma模式
│   └── migrations/               # 数据库迁移文件
├── docs/                         # 项目文档
├── __tests__/                    # 测试文件
├── components/                   # React组件
├── hooks/                        # 自定义Hook
├── public/                       # 静态资源
└── scripts/                      # 构建和部署脚本
```

## 🛠️ 开发环境设置

### 环境要求
```bash
Node.js >= 20.14.15
npm >= 9.0.0
PostgreSQL >= 13
Redis >= 6.0
Docker (可选)
```

### 本地开发环境搭建

1. **克隆项目**
```bash
git clone <repository-url>
cd luckymart-tj
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env.local
```

编辑 `.env.local`:
```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/luckymart"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/bot/webhook"

# Instagram API
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"

# 其他配置
NODE_ENV="development"
LOG_LEVEL="debug"
```

4. **数据库设置**
```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充初始数据
npm run db:seed
```

5. **启动开发服务**
```bash
# 启动Next.js开发服务器
npm run dev

# 启动Redis (如果使用Docker)
docker run -d -p 6379:6379 redis:6-alpine

# 启动机器人服务 (新终端)
npm run bot:dev
```

### 开发工具配置

#### VS Code配置
创建 `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

#### 推荐的VS Code插件
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (API测试)

## 📝 代码规范

### TypeScript规范

#### 类型定义
```typescript
// lib/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  coinBalance: number;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralRelationship {
  id: string;
  referrerId: string;
  refereeId: string;
  level: number;
  createdAt: Date;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'referral' | 'bonus' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

#### 接口命名规范
```typescript
// 使用PascalCase命名接口
interface UserProfile { ... }
interface ApiResponse<T> { ... }

// 使用I前缀（可选）
interface IUser { ... }
```

### React组件规范

#### 组件结构
```tsx
// components/UserProfile.tsx
'use client';

import React from 'react';
import { User } from '@/lib/types';

interface UserProfileProps {
  user: User;
  onUpdate?: (user: Partial<User>) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate
}) => {
  return (
    <div className="user-profile">
      <h2 className="text-2xl font-bold">{user.name}</h2>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
};

// 导出默认组件
export default UserProfile;
```

#### Hook使用
```tsx
// hooks/useUserData.ts
'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return { user, loading, error };
};
```

### API路由规范

#### 路由结构
```typescript
// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserProfileSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        coinBalance: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UserProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        coinBalance: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 数据库规范

#### Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String?
  phone           String?
  password        String
  coinBalance     Decimal  @default(0) @db.Decimal(10, 2)
  referralCode    String   @unique
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关系定义
  referralRelationships ReferralRelationship[] @relation("UserReferrals")
  referredUsers         ReferralRelationship[] @relation("UserReferrals")
  rewardTransactions    RewardTransaction[]
  
  @@map("users")
}

model ReferralRelationship {
  id         String @id @default(uuid())
  referrerId String
  refereeId  String
  level      Int

  referrer User @relation("UserReferrals", fields: [referrerId], references: [id], onDelete: Cascade)
  referee  User @relation("UserReferrals", fields: [refereeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([referrerId, refereeId])
  @@map("referral_relationships")
}
```

#### 数据库查询优化
```typescript
// lib/queries/user-queries.ts
export class UserQueryService {
  // 使用select优化查询字段
  static async getUserWithReferrals(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        coinBalance: true,
        referralCode: true,
        referralRelationships: {
          select: {
            id: true,
            level: true,
            createdAt: true,
            referee: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });
  }

  // 批量查询优化
  static async getUsersByIds(userIds: string[]) {
    return prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  // 分页查询
  static async getPaginatedUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }
}
```

## 🧪 测试规范

### 测试结构
```
__tests__/
├── unit/                    # 单元测试
│   ├── lib/
│   ├── components/
│   └── utils/
├── integration/             # 集成测试
│   ├── api/
│   ├── database/
│   └── services/
└── e2e/                    # 端到端测试
    ├── user-flows/
    └── admin-flows/
```

### 单元测试示例
```typescript
// __tests__/lib/cache-manager.test.ts
import { CacheManager } from '@/lib/cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  describe('set', () => {
    it('should set a value in cache', async () => {
      await cacheManager.set('test-key', 'test-value', 3600);
      
      const value = await cacheManager.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should handle TTL correctly', async () => {
      await cacheManager.set('test-key', 'test-value', 1);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const value = await cacheManager.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('get', () => {
    it('should return null for non-existent keys', async () => {
      const value = await cacheManager.get('non-existent-key');
      expect(value).toBeNull();
    });
  });
});
```

### API测试示例
```typescript
// __tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/auth/login/route';

describe('/api/auth/login', () => {
  it('should return 200 for valid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('token');
  });

  it('should return 400 for invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe('INVALID_CREDENTIALS');
  });
});
```

## 🔧 性能优化

### 数据库优化
```typescript
// lib/query-optimizer.ts
export class QueryOptimizer {
  // 使用索引优化查询
  static async findUserByReferralCode(referralCode: string) {
    return prisma.user.findUnique({
      where: { referralCode }, // 已经在referralCode字段创建了索引
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  // 使用explain分析查询性能
  static async analyzeQuery() {
    return prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT u.*, COUNT(r.id) as referral_count
      FROM users u
      LEFT JOIN referral_relationships r ON u.id = r.referrer_id
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id
      ORDER BY referral_count DESC
    `;
  }
}
```

### 缓存策略
```typescript
// lib/cache-strategy.ts
export class CacheStrategy {
  // 用户数据缓存
  static async getUserCached(userId: string) {
    const cacheKey = `user:${userId}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // 缓存30分钟
    await cacheManager.set(cacheKey, user, 1800);
    
    return user;
  }

  // 推荐统计缓存
  static async getReferralStatsCached(userId: string) {
    const cacheKey = `referral:stats:${userId}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const stats = await this.calculateReferralStats(userId);
    
    // 缓存10分钟
    await cacheManager.set(cacheKey, stats, 600);
    
    return stats;
  }

  private static async calculateReferralStats(userId: string) {
    const relationships = await prisma.referralRelationship.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            id: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    // 计算统计数据
    return {
      totalReferrals: relationships.length,
      activeReferrals: relationships.filter(r => r.referee.isActive).length,
      levelDistribution: this.calculateLevelDistribution(relationships)
    };
  }
}
```

### 前端性能优化
```tsx
// components/LazyProductList.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export const LazyProductList: React.FC = () => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/products?page=${pageParam}&limit=20`);
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="product-list">
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.products.map((product: Product) => (
            <div key={product.id} className="product-item">
              <img 
                src={product.image} 
                alt={product.name}
                loading="lazy"
                className="product-image"
              />
              <h3>{product.name}</h3>
              <p>${product.price}</p>
            </div>
          ))}
        </React.Fragment>
      ))}
      
      {hasNextPage && (
        <button 
          onClick={handleLoadMore}
          disabled={isFetchingNextPage}
          className="load-more-btn"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

## 🔒 安全最佳实践

### API安全
```typescript
// lib/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityHeaders(request: NextRequest) {
  const response = NextResponse.next();
  
  // 安全头设置
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}

export function rateLimit(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const key = `rate_limit:${ip}`;
  
  // Redis实现限流逻辑
  // ...
}
```

### 输入验证
```typescript
// lib/validators.ts
import { z } from 'zod';

export const UserProfileSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export const ReferralCodeSchema = z.object({
  code: z.string().length(6).regex(/^[A-Z0-9]+$/),
});

export const RewardRequestSchema = z.object({
  amount: z.number().positive().max(10000),
  bankInfo: z.object({
    bankName: z.string().min(2).max(100),
    accountNumber: z.string().regex(/^\d{12,19}$/),
    accountHolder: z.string().min(2).max(50),
  }),
});
```

### 防SQL注入和N+1查询
```typescript
// lib/anti-n-plus-one.ts
export class NPlusOneDetector {
  private static queryCount = 0;
  private static queries: Array<{ sql: string; timestamp: number }> = [];

  static enableMonitoring() {
    const originalQuery = prisma.$queryRaw;
    
    prisma.$queryRaw = (...args: any[]) => {
      this.queryCount++;
      this.queries.push({
        sql: args[0].toString(),
        timestamp: Date.now()
      });
      
      // 检测N+1查询模式
      this.detectNPlusOne();
      
      return originalQuery(...args);
    };
  }

  private static detectNPlusOne() {
    if (this.queries.length > 100) {
      const recentQueries = this.queries.slice(-50);
      const sqlPatterns = recentQueries.map(q => q.sql);
      
      // 简单的N+1检测：统计相同模式的查询
      const patternCount = sqlPatterns.reduce((acc, sql) => {
        const key = sql.replace(/\d+/g, '?');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const maxCount = Math.max(...Object.values(patternCount));
      
      if (maxCount > 10) {
        console.warn(`Potential N+1 query detected: ${maxCount} similar queries`);
      }
    }
  }
}
```

## 📊 监控与日志

### 日志配置
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

### 性能监控
```typescript
// lib/monitoring.ts
export class PerformanceMonitor {
  static async measureApiCall<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.info('API call completed', {
        operation,
        duration,
        status: 'success'
      });
      
      // 记录慢查询
      if (duration > 5000) {
        logger.warn('Slow API call detected', {
          operation,
          duration
        });
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('API call failed', {
        operation,
        duration,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
}
```

## 🚀 部署指南

### Docker配置
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# 构建应用
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build
      
      - name: Build Docker image
        run: |
          docker build -t luckymart:latest .
          
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push luckymart:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} '
            docker pull luckymart:latest
            docker-compose up -d
          '
```

## 📝 开发工作流

### Git工作流
1. **Feature Branch**: 从main分支创建功能分支
2. **开发**: 在功能分支上开发
3. **测试**: 运行所有测试确保质量
4. **代码审查**: 创建Pull Request
5. **合并**: 合并到main分支

### 提交规范
```
feat: 添加用户推荐统计功能
fix: 修复推荐码重复生成bug
docs: 更新API文档
style: 格式化代码
refactor: 重构缓存管理器
test: 添加推荐系统测试
chore: 更新依赖版本
```

### 代码审查检查清单
- [ ] 代码符合项目规范
- [ ] 添加必要的测试
- [ ] 性能影响评估
- [ ] 安全风险检查
- [ ] 文档更新
- [ ] 向后兼容性

## 📞 开发支持

### 团队沟通
- **Slack频道**: #luckymart-dev
- **Telegram群**: @LuckymartDevTeam
- **文档协作**: Confluence

### 问题报告
- **Bug报告**: GitHub Issues
- **功能请求**: GitHub Discussions
- **安全漏洞**: security@luckymart.com

### 技术资源
- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [Supabase文档](https://supabase.com/docs)
- [React TypeScript指南](https://react-typescript-cheatsheet.netlify.app/)

---

感谢您为LuckyMart-TJ项目贡献代码！遵循这些规范将确保代码质量和项目的长期发展。