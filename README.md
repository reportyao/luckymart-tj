# LuckyMart-TJ 乐享商城

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Test Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)
![Production Ready](https://img.shields.io/badge/status-production--ready-success.svg)

## 项目简介

LuckyMart-TJ 乐享商城是一个面向塔吉克斯坦市场的企业级幸运夺宝+社交电商平台，采用Next.js和Supabase构建。系统集成了完整的电商功能、幸运夺宝系统、多层级裂变推荐、晒单社交互动、智能风控和专业管理后台，提供端到端的商业解决方案。

### 核心特性

- **幸运夺宝系统**: 完整的夺宝机制、自动开奖、中奖管理、发货跟踪
- **社交电商平台**: 产品展示、订单管理、多语言支持、库存监控
- **晒单互动系统**: 用户晒单、内容审核、热度管理、推荐系统
- **多层级裂变**: 邀请奖励、团队管理、返币机制、防欺诈检测
- **专业管理后台**: 20个管理页面、100+API接口、企业级权限管理
- **用户增长中心**: 新手任务、签到系统、用户分层、增长分析
- **数据分析平台**: 实时数据看板、用户行为分析、财务分析
- **Telegram Bot**: 消息推送、用户通知、状态监控、多语言支持
- **智能风控系统**: 行为监控、风险检测、异常预警、黑名单管理
- **多语言国际化**: 中文/塔吉克语/俄语完整支持
- **移动端优化**: PWA支持、响应式设计、离线功能
- **高性能架构**: 缓存策略、数据库优化、代码分割

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

## 功能特性详解

### 幸运夺宝系统
- **夺宝管理**: 商品配置、参与规则、开奖管理
- **中奖管理**: 中奖名单、发货跟踪、物流监控
- **数据统计**: 参与分析、中奖率统计、收益监控
- **规则配置**: 开奖算法、名额设置、参与条件

### 晒单社交系统
- **内容管理**: 晒单审核、批量操作、状态管理
- **热度管理**: 热度排行榜、算法配置、手动调整
- **质量检测**: 内容评分、问题标签、自动筛查
- **推荐系统**: 多推荐位、优先级管理、智能推荐
- **用户画像**: 晒单历史、行为分析、风险识别
- **数据统计**: 核心指标、热门Top10、通过率分析

### 用户增长中心
- **新手任务**: 任务配置、奖励设置、进度追踪
- **邀请裂变**: 邀请码生成、奖励分配、裂变监控
- **签到系统**: 每日签到、奖励发放、连续签到统计
- **用户分层**: 新手/活跃/沉睡用户识别和触达
- **增长看板**: DAU、转化率、K因子实时监控
- **行为漏斗**: 注册到购物到夺宝到晒单全链路分析

### 商业变现管理
- **多语言商品**: 中文/塔吉克语/俄语商品内容管理
- **库存监控**: 实时库存、低库存告警、自动补货
- **价格策略**: 批量调价、返币比例、促销活动
- **商品分析**: 销售统计、转化分析、利润监控
- **首页配置**: Banner管理、热门推荐、爆款榜单

### 数据分析平台
- **实时看板**: DAU、订单、中奖、收入实时统计
- **用户分析**: 用户路径、转化漏斗、留存分析
- **业务分析**: 夺宝数据、晒单互动、销售分析
- **财务分析**: 收入成本、利润趋势、现金流监控
- **自定义报表**: 多维筛选、批量导出、数据钻取

### 权限组织管理
- **组织架构**: 部门结构、角色定义、层级管理
- **权限管理**: 细粒度权限、功能点管控、角色模板
- **管理员账户**: 账户分配、状态管理、权限分配
- **操作审计**: 变更历史、操作追溯、审计报表
- **菜单权限**: 按部门可见性、按钮级权限控制

### Telegram Bot管理
- **消息推送**: 分类型推送、多语言模板、定时推送
- **状态监控**: 在线状态、心跳监控、错误报警
- **推送历史**: 消息记录、状态统计、失败重试
- **配置管理**: 目标配置、模板编辑、A/B测试
- **数据分析**: 推送量、点击率、转化分析

### 风控安全系统
- **实时监控**: 行为分析、异常检测、风险评估
- **规则引擎**: 风控规则配置、自动处理、黑名单管理
- **事件管理**: 风险事件记录、处理流程、统计分析
- **审计日志**: 完整操作记录、追溯能力、合规性保障

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

## 文档导航

### 核心文档
- [产品功能清单（投资人版本）](docs/INVESTOR_PRODUCT_CATALOG.md) - 完整产品功能矩阵
- [完整部署指南](docs/DEPLOYMENT_GUIDE.md) - 生产环境部署指南
- [项目完成总结](docs/PROJECT_COMPLETION_SUMMARY.md) - 开发完成情况总结

### 功能文档
- [管理后台实现](docs/ADMIN_PAGES_IMPLEMENTATION.md) - 管理页面开发指南
- [晒单功能完成报告](docs/SHOW_OFF_FEATURE_COMPLETION_REPORT.md) - 晒单系统详细说明
- [最终质量报告](docs/FINAL_QUALITY_REPORT.md) - 质量保证和测试报告
- [权限系统指南](docs/PERMISSION_SYSTEM_GUIDE.md) - 权限管理详细说明

### 技术文档
- [API权限状态报告](docs/API_PERMISSION_STATUS_REPORT.md) - API权限实施状态
- [数据库增强总结](db/DATABASE_ENHANCEMENT_SUMMARY.md) - 数据库架构说明
- [国际化完整总结](docs/I18N_COMPLETE_SUMMARY.md) - 多语言实现指南
- [PWA完成报告](docs/PWA_COMPLETION_REPORT.md) - PWA功能说明

### 系统专项
- [防欺诈系统](docs/ANTI_FRAUD_SYSTEM_COMPLETION_REPORT.md) - 风控系统详细说明
- [缓存策略指南](docs/CACHE_STRATEGY_GUIDE.md) - 缓存优化方案
- [网络优化报告](docs/NETWORK_OPTIMIZATION_COMPLETION_REPORT.md) - 性能优化说明
- [移动端优化](docs/MOBILE_OPTIMIZATION_README.md) - 移动端适配方案

## 测试

### 测试覆盖率
- **总体覆盖率**: 90%
- **单元测试**: 39个测试用例
- **集成测试**: 12个端到端测试
- **总测试用例**: 51个

### 运行测试

运行所有测试：
```bash
npm test
```

运行特定测试文件：
```bash
# 权限管理测试
npm test __tests__/admin/permission-manager.test.ts

# 晒单系统API测试
npm test __tests__/admin/show-off-api.test.ts

# 完整业务流程测试
npm test __tests__/integration/show-off-workflow.test.ts
```

生成测试覆盖率报告：
```bash
npm test -- --coverage
```

### 测试文件结构
```
__tests__/
├── admin/                    # 管理后台测试
│   ├── permission-manager.test.ts
│   └── show-off-api.test.ts
├── integration/              # 集成测试
│   └── show-off-workflow.test.ts
├── api-security.test.ts     # API安全测试
├── auth.test.ts             # 认证测试
├── lottery-algorithm.test.ts # 夺宝算法测试
├── referral-anti-fraud.test.ts # 防欺诈测试
└── ...
```

## 🛠️ 开发工具

- **TypeScript** - 类型安全的JavaScript
- **Prisma** - 现代化数据库ORM
- **Jest** - 单元测试框架
- **ESLint + Prettier** - 代码质量和格式化
- **Redis** - 高性能缓存
- **PM2** - 进程管理

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.6
- **样式**: Tailwind CSS
- **状态管理**: React Context API
- **UI组件**: 自定义组件库
- **国际化**: i18next (中文/塔吉克语/俄语)

### 后端
- **运行时**: Node.js 18+
- **API**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **认证**: Supabase Auth
- **存储**: Supabase Storage

### 基础设施
- **托管**: Vercel / 自托管
- **数据库**: Supabase (PostgreSQL)
- **缓存**: 内存缓存 / Redis (可选)
- **监控**: PM2 (生产环境)
- **Bot**: Telegram Bot API

### 开发工具
- **代码质量**: ESLint + Prettier
- **测试**: Jest + Testing Library
- **类型检查**: TypeScript Strict Mode
- **版本控制**: Git
- **包管理**: npm

## 核心数据模型

### 用户体系（5张表）
- users - 用户基础信息
- userProfiles - 用户扩展资料
- userSegments - 用户分层标签
- referralRelationships - 邀请关系链
- userBehaviorLogs - 用户行为日志

### 商品体系（4张表）
- products - 商品主表（多语言）
- categories - 商品分类
- inventory - 库存管理
- productAnalytics - 商品分析

### 夺宝体系（5张表）
- lotteryRounds - 夺宝期次
- lotteryParticipations - 参与记录
- lotteryWinners - 中奖记录
- lotteryProducts - 夺宝商品
- lotteryStats - 夺宝统计

### 晒单体系（4张表）
- showOffPosts - 晒单内容
- showOffComments - 评论互动
- showOffRecommendations - 推荐管理
- showOffDailyStats - 每日统计

### 管理体系（10张表）
- adminPermissions - 权限管理
- orgDepartments - 组织部门
- orgRoles - 角色定义
- rolePermissions - 角色权限
- operationLogs - 操作日志
- systemSettings - 系统配置
- botPushTemplates - Bot推送模板
- botPushHistory - 推送历史
- botStatus - Bot状态
- growthMetrics - 增长指标

**总计**: 30+张数据表，完整业务模型

## 生产环境部署

### 快速部署

1. 安装依赖
```bash
npm install --legacy-peer-deps
```

2. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 填入实际配置
```

3. 执行数据库迁移
```bash
# 在Supabase SQL Editor中执行
# db/migration_001_show_off_system.sql
# db/migration_002_admin_system.sql
# db/init_permissions.sql
```

4. 构建应用
```bash
npm run build
```

5. 启动服务
```bash
# 使用PM2（推荐）
pm2 start ecosystem.config.js

# 或直接启动
npm start
```

详细的部署说明请参考 [完整部署指南](docs/DEPLOYMENT_GUIDE.md)

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