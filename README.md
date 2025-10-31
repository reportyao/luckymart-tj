# LuckyMart-TJ 乐享商城

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 项目简介

LuckyMart-TJ 乐享商城是一个基于Next.js和Supabase构建的现代化电商平台，集成了多层级裂变推荐系统、防欺诈系统、Telegram机器人服务和智能缓存优化等功能。该系统专为移动端优化，提供完整的购物、推荐、奖励和营销解决方案。

### 🎯 核心特性

- **🛒 完整电商功能**: 产品展示、订单管理、支付处理、库存管理
- **👥 多层级裂变系统**: 无限层级推荐奖励，智能防欺诈检测
- **🤖 Telegram机器人**: 自动客服、奖励通知、用户信息管理
- **🛡️ 防欺诈系统**: 实时行为监控，黑名单管理，风险评估
- **⚡ 高性能优化**: Redis缓存、数据库优化、N+1查询检测
- **📱 移动端优化**: 响应式设计，PWA支持，流畅用户体验
- **🔐 安全认证**: JWT认证、权限管理、API安全防护

## 🚀 快速开始

### 环境要求

- Node.js >= 20.14.15
- npm >= 9.0.0
- Redis >= 6.0
- PostgreSQL >= 13

### 安装步骤

1. **克隆仓库**
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

编辑 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/luckymart"

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis配置
REDIS_URL="redis://localhost:6379"

# JWT密钥
JWT_SECRET="your-jwt-secret"

# Telegram Bot配置
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="your-webhook-url"

# Instagram API配置
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"
```

4. **数据库迁移**
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 功能特性详解

### 🛒 电商系统
- **产品管理**: 商品展示、分类管理、库存控制
- **订单处理**: 购物车、订单流程、支付集成
- **用户管理**: 注册登录、个人资料、地址管理
- **交易记录**: 充值提现、交易历史、财务报表

### 👥 推荐奖励系统
- **多层级裂变**: 支持无限层级推荐关系
- **奖励机制**: 推荐奖励、团队奖励、升级奖励
- **防作弊检测**: 行为分析、异常检测、风险控制
- **实时结算**: 即时奖励计算、自动发放

### 🤖 Telegram机器人
- **自动客服**: 24/7在线客服支持
- **奖励通知**: 实时推送奖励到账消息
- **用户服务**: 查询余额、推荐码、团队信息
- **容错机制**: 多重保障，确保服务稳定

### 🛡️ 安全防护
- **防欺诈系统**: 实时监控、智能识别、风险预警
- **权限管理**: 细粒度权限控制、角色分配
- **数据安全**: 加密传输、敏感数据脱敏
- **审计日志**: 完整操作记录、异常追踪

### ⚡ 性能优化
- **智能缓存**: Redis多层缓存策略
- **数据库优化**: 查询优化、索引优化、连接池
- **前端优化**: 代码分割、资源压缩、懒加载
- **监控告警**: 性能监控、错误追踪、自动报警

## 🏗️ 项目架构

```
luckymart-tj/
├── app/                    # Next.js 应用页面
│   ├── api/               # API路由
│   ├── admin/             # 管理后台
│   ├── referral/          # 推荐系统
│   ├── product/           # 产品页面
│   └── ...
├── bot/                   # Telegram机器人
│   ├── handlers/          # 消息处理器
│   ├── services/          # 业务服务
│   └── utils/             # 工具函数
├── lib/                   # 核心库
│   ├── anti-fraud/        # 防欺诈系统
│   ├── cache-manager.ts   # 缓存管理
│   ├── database-lock.ts   # 数据库锁
│   └── ...
├── prisma/               # 数据库模型
│   └── schema.prisma     # 数据库架构
├── docs/                 # 文档目录
└── __tests__/            # 测试文件
```

## 📚 文档导航

- [📖 用户指南](docs/user-guide.md) - 如何使用系统
- [👨‍💼 管理员指南](docs/admin-guide.md) - 管理后台使用
- [👨‍💻 开发者指南](docs/developer-guide.md) - 代码架构和开发规范
- [🚀 部署指南](docs/deployment-guide.md) - 环境配置和部署
- [🔗 API文档](docs/api/README.md) - 完整的API说明

## 🧪 测试

运行完整测试套件：
```bash
npm run test:all
```

运行特定测试：
```bash
npm run test:unit        # 单元测试
npm run test:integration # 集成测试
npm run test:auth        # 认证测试
npm run test:lottery     # 抽奖测试
npm run test:business    # 业务流程测试
npm run test:security    # 安全测试
npm run test:performance # 性能测试
npm run test:bot         # 机器人测试
```

生成测试覆盖率报告：
```bash
npm run test:coverage
```

## 🛠️ 开发工具

- **TypeScript** - 类型安全的JavaScript
- **Prisma** - 现代化数据库ORM
- **Jest** - 单元测试框架
- **ESLint + Prettier** - 代码质量和格式化
- **Redis** - 高性能缓存
- **PM2** - 进程管理

## 🚀 部署

详细的部署说明请参考 [部署指南](docs/deployment-guide.md)

## 🤝 贡献

欢迎贡献代码！请阅读 [贡献指南](CONTRIBUTING.md) 了解详细的贡献流程。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目负责人：[您的邮箱]
- 技术支持：[技术支持邮箱]
- 问题反馈：[GitHub Issues](repository-url/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！