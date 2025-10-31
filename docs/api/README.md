# API 文档

本文档包含LuckyMart-TJ系统的所有API接口说明。

## 📖 目录

- [认证与授权](#认证与授权)
- [用户管理](#用户管理)
- [产品管理](#产品管理)
- [订单系统](#订单系统)
- [推荐系统](#推荐系统)
- [奖励系统](#奖励系统)
- [机器人API](#机器人api)
- [防欺诈系统](#防欺诈系统)
- [Instagram分享](#instagram分享)
- [QR码生成](#qr码生成)
- [缓存管理](#缓存管理)
- [错误处理](#错误处理)

## 🔐 认证与授权

### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名"
    },
    "token": "jwt-token",
    "expiresAt": "2025-11-30T12:00:00Z"
  }
}
```

### POST /api/auth/register
用户注册

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名",
  "phone": "+1234567890"
}
```

### POST /api/auth/refresh
刷新访问令牌

**请求头:**
```
Authorization: Bearer refresh-token
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expiresAt": "2025-11-30T12:00:00Z"
  }
}
```

## 👤 用户管理

### GET /api/user/profile
获取用户资料

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户名",
    "phone": "+1234567890",
    "coinBalance": 1000.50,
    "referralCode": "ABC123",
    "totalReferrals": 15,
    "createdAt": "2025-10-01T00:00:00Z"
  }
}
```

### PUT /api/user/profile
更新用户资料

**请求体:**
```json
{
  "name": "新用户名",
  "phone": "+1234567890"
}
```

### GET /api/user/addresses
获取用户地址列表

### POST /api/user/addresses
添加用户地址

**请求体:**
```json
{
  "type": "shipping",
  "recipient": "收件人姓名",
  "phone": "+1234567890",
  "address": "详细地址",
  "isDefault": true
}
```

## 🛍️ 产品管理

### GET /api/products
获取产品列表

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20
- `category` (string): 产品分类
- `search` (string): 搜索关键词
- `sort` (string): 排序字段 (price, name, createdAt)

**响应:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "产品名称",
        "description": "产品描述",
        "price": 99.99,
        "originalPrice": 129.99,
        "images": ["image1.jpg", "image2.jpg"],
        "category": "电子产品",
        "stock": 100,
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### GET /api/products/:id
获取产品详情

### POST /api/products
创建产品 (管理员权限)

**请求体:**
```json
{
  "name": "产品名称",
  "description": "产品描述",
  "price": 99.99,
  "originalPrice": 129.99,
  "images": ["image1.jpg", "image2.jpg"],
  "category": "电子产品",
  "stock": 100
}
```

## 📦 订单系统

### POST /api/orders
创建订单

**请求体:**
```json
{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": "收货地址",
  "paymentMethod": "coin"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "totalAmount": 199.98,
    "status": "pending",
    "estimatedDelivery": "2025-11-05T00:00:00Z"
  }
}
```

### GET /api/orders
获取用户订单列表

**响应:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "status": "delivered",
        "totalAmount": 199.98,
        "createdAt": "2025-10-01T00:00:00Z",
        "items": [
          {
            "productName": "产品名称",
            "quantity": 2,
            "price": 99.99
          }
        ]
      }
    ]
  }
}
```

### GET /api/orders/:id
获取订单详情

## 👥 推荐系统

### GET /api/referral/my-code
获取推荐码

**响应:**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC123",
    "referralUrl": "https://app.luckymart.com/register?ref=ABC123",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
  }
}
```

### POST /api/referral/bind
绑定推荐关系

**请求体:**
```json
{
  "referralCode": "ABC123"
}
```

### GET /api/referral/list
获取推荐用户列表

**查询参数:**
- `page` (number): 页码
- `level` (number): 推荐层级 (1, 2, 3...)
- `status` (string): 用户状态 (active, inactive)

**响应:**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "userId": "uuid",
        "name": "用户名",
        "level": 1,
        "status": "active",
        "totalEarnings": 50.00,
        "joinedAt": "2025-10-01T00:00:00Z"
      }
    ],
    "statistics": {
      "totalReferrals": 15,
      "activeReferrals": 12,
      "totalEarnings": 500.00,
      "pendingEarnings": 50.00
    }
  }
}
```

### GET /api/referral/statistics
获取推荐统计数据

**响应:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReferrals": 15,
      "totalEarnings": 500.00,
      "level1Count": 8,
      "level2Count": 5,
      "level3Count": 2
    },
    "monthlyEarnings": [
      {
        "month": "2025-10",
        "earnings": 150.00
      }
    ]
  }
}
```

## 🎁 奖励系统

### GET /api/rewards/config
获取奖励配置

**响应:**
```json
{
  "success": true,
  "data": {
    "config": {
      "level1Reward": 10.00,
      "level2Reward": 5.00,
      "level3Reward": 2.50,
      "signupBonus": 20.00,
      "minWithdrawal": 50.00
    }
  }
}
```

### PUT /api/rewards/config
更新奖励配置 (管理员权限)

### GET /api/rewards/transactions
获取奖励交易记录

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量
- `type` (string): 交易类型 (referral, bonus, withdrawal)

### POST /api/rewards/withdraw
申请提现

**请求体:**
```json
{
  "amount": 100.00,
  "bankInfo": {
    "bankName": "中国银行",
    "accountNumber": "1234567890123456",
    "accountHolder": "用户名"
  }
}
```

## 🤖 机器人API

### POST /api/bot/webhook
Telegram机器人Webhook接收端点

### GET /api/bot/health
机器人健康检查

**响应:**
```json
{
  "success": true,
  "data": {
    "status": "running",
    "uptime": 86400,
    "version": "1.0.0",
    "lastCheck": "2025-10-31T12:00:00Z"
  }
}
```

### POST /api/bot/notify-reward
发送奖励通知 (管理员权限)

**请求体:**
```json
{
  "userId": "uuid",
  "amount": 10.00,
  "reason": "推荐奖励",
  "referralCode": "ABC123"
}
```

### POST /api/bot/send-message
发送消息给指定用户

**请求体:**
```json
{
  "userId": "uuid",
  "message": "消息内容"
}
```

## 🛡️ 防欺诈系统

### POST /api/anti-fraud/check
进行欺诈检测

**请求体:**
```json
{
  "userId": "uuid",
  "action": "register",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "phone": "+1234567890",
    "email": "user@example.com"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "riskScore": 0.3,
    "level": "low",
    "recommendations": ["allow"],
    "factors": [
      {
        "type": "ip_reputation",
        "score": 0.8,
        "message": "IP信誉良好"
      }
    ]
  }
}
```

### GET /api/anti-fraud/blacklist
获取黑名单列表

### POST /api/anti-fraud/blacklist
添加到黑名单 (管理员权限)

**请求体:**
```json
{
  "type": "ip",
  "value": "192.168.1.1",
  "reason": "异常行为",
  "duration": "24h"
}
```

### GET /api/anti-fraud/alerts
获取欺诈警报

**查询参数:**
- `level` (string): 风险等级 (high, medium, low)
- `status` (string): 状态 (pending, reviewed, resolved)

## 📸 Instagram分享

### POST /api/instagram/poster
生成Instagram分享海报

**请求体:**
```json
{
  "productId": "uuid",
  "userId": "uuid",
  "template": "default",
  "customText": "推荐产品！",
  "backgroundColor": "#ffffff"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "posterUrl": "https://storage.supabase.co/...",
    "shareId": "uuid",
    "expiresAt": "2025-11-07T12:00:00Z"
  }
}
```

### GET /api/instagram/shares
获取用户的Instagram分享记录

**响应:**
```json
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": "uuid",
        "productName": "产品名称",
        "posterUrl": "https://storage.supabase.co/...",
        "views": 25,
        "createdAt": "2025-10-01T00:00:00Z"
      }
    ]
  }
}
```

### POST /api/instagram/track-view
追踪海报查看

**请求体:**
```json
{
  "shareId": "uuid",
  "viewerInfo": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## 🔲 QR码生成

### POST /api/qr/generate
生成QR码

**请求体:**
```json
{
  "text": "https://app.luckymart.com/register?ref=ABC123",
  "size": 300,
  "format": "png",
  "margin": 4,
  "color": {
    "dark": "#000000",
    "light": "#FFFFFF"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
    "url": "https://storage.supabase.co/qr-codes/...",
    "expiresAt": "2025-11-07T12:00:00Z"
  }
}
```

## ⚡ 缓存管理

### GET /api/cache/status
获取缓存状态

**响应:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "status": "connected",
      "memory": {
        "used": "45.2MB",
        "total": "512MB"
      }
    },
    "memory": {
      "status": "active",
      "entries": 156
    },
    "stats": {
      "hits": 1250,
      "misses": 78,
      "hitRatio": "94.1%"
    }
  }
}
```

### POST /api/cache/clear
清理缓存

**请求体:**
```json
{
  "type": "memory",
  "pattern": "user:*"
}
```

### POST /api/cache/preload
预加载缓存数据

**请求体:**
```json
{
  "keys": [
    "user:123",
    "product:456",
    "referral:789"
  ]
}
```

## 📊 统计数据

### GET /api/analytics/dashboard
获取仪表板统计数据

**响应:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 5000,
      "activeUsers": 3200,
      "totalOrders": 1250,
      "totalRevenue": 125000.00
    },
    "referralStats": {
      "totalReferrals": 1500,
      "conversionRate": "25.3%"
    },
    "dailyStats": [
      {
        "date": "2025-10-31",
        "users": 50,
        "orders": 15,
        "revenue": 1500.00
      }
    ]
  }
}
```

## ⚠️ 错误处理

所有API响应遵循统一的错误格式：

### 标准错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "email",
      "reason": "邮箱格式不正确"
    }
  }
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `UNAUTHORIZED` | 401 | 未认证或令牌过期 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMITED` | 429 | 请求频率限制 |
| `INTERNAL_ERROR` | 500 | 内部服务器错误 |

### 响应示例

#### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-31T12:00:00Z",
    "requestId": "req-123"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "余额不足",
    "details": {
      "required": 100.00,
      "available": 50.00
    }
  },
  "meta": {
    "timestamp": "2025-10-31T12:00:00Z",
    "requestId": "req-123"
  }
}
```

## 🔒 安全注意事项

1. **认证**: 所有API都需要有效的JWT令牌
2. **权限**: 根据用户角色控制API访问权限
3. **限流**: 实施API调用频率限制
4. **加密**: 敏感数据传输使用HTTPS加密
5. **审计**: 记录所有API调用日志

## 📞 技术支持

如有问题，请联系技术支持团队或查看开发者指南。