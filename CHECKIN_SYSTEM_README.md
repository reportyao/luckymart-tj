# 7天签到系统使用指南

## 快速开始

### 1. 安装依赖
```bash
cd luckymart-tj
npm install lucide-react date-fns
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问签到页面
打开浏览器访问: `http://localhost:3000/checkin`

## 系统功能

### 📱 签到页面功能
- 查看幸运币余额
- 今日签到状态
- 连续签到天数统计  
- 7天签到日历
- 签到奖励进度
- 多语言界面支持

### 🏆 奖励规则
- **第1天**: 0.1 Som
- **第2天**: 0.2 Som
- **第3天**: 0.3 Som
- **第4天**: 0.4 Som
- **第5天**: 0.5 Som
- **第6天**: 0.25 Som
- **第7天**: 0.25 Som
- **总奖励**: 2.0 Som/周期

### ✨ 特色功能
- 🕒 每日只能签到一次
- 🔄 断签自动重置周期
- 💰 奖励自动发放到luckyCoins
- 📊 实时统计连续签到天数
- 🔐 JWT Token安全认证
- 📱 响应式设计，支持手机

## API接口

### 1. 获取签到状态
```
GET /api/checkin/status
Authorization: Bearer <jwt_token>
```

### 2. 执行签到
```
POST /api/checkin/claim
Authorization: Bearer <jwt_token>
```

### 3. 获取日历数据
```
GET /api/checkin/calendar?period=7
Authorization: Bearer <jwt_token>
```

## 开发说明

### 文件结构
```
├── app/api/checkin/          # 后端API
├── app/checkin/             # 前端页面
├── components/checkin/      # 签到组件
└── contexts/AuthContext.tsx # 认证管理
```

### 核心组件
- `CheckinPage` - 签到主页面
- `CheckinButton` - 签到按钮组件
- `CheckinCalendar` - 签到日历组件
- `AuthContext` - 认证上下文

### 数据库表
- `daily_checkins` - 签到记录
- `users` - 用户信息  
- `wallet_transactions` - 钱包交易记录

## 部署检查

### 必需环境变量
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
```

### 检查脚本
```bash
bash checkin-system-check.sh
```

## 故障排除

### 常见问题

**Q: 页面显示"未登录"**
A: 确保JWT Token正确存储在localStorage中

**Q: 签到失败**
A: 检查网络连接和API响应，可能需要重试

**Q: 样式显示异常**
A: 确保Tailwind CSS正确加载

**Q: 多语言切换无效**
A: 检查LanguageContext是否正确配置

### 联系支持
如有问题，请查看 `/workspace/docs/checkin-system.md` 详细文档