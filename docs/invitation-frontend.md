# LuckyMart TJ 邀请系统前端开发文档

## 概述

本文档描述了LuckyMart TJ邀请裂变系统的前端实现，包括用户邀请中心和管理后台功能。系统提供了完整的邀请码管理、邀请统计、历史记录和返利追踪功能。

## 项目结构

```
app/invitation/page.tsx                    # 邀请中心主页
components/InvitationCode.tsx              # 邀请码展示组件
components/InvitationStats.tsx             # 邀请统计组件
components/InvitationHistory.tsx           # 邀请历史组件
components/CommissionHistory.tsx           # 返利历史组件
app/admin/invitations/page.tsx             # 管理后台邀请统计页面
components/admin/InvitationAnalytics.tsx   # 管理后台邀请分析组件
src/locales/zh-CN/referral.json            # 中语言翻译文件
```

## 主要功能模块

### 1. 邀请中心 (Invitation Center)

**路径**: `/app/invitation/page.tsx`

**功能特性**:
- ✅ 邀请码展示和复制
- ✅ 邀请链接分享（支持Telegram、社交媒体）
- ✅ 邀请统计数据展示
- ✅ 多标签页切换（邀请码、历史、收益、规则）
- ✅ 响应式设计
- ✅ 多语言支持

**核心组件**:
- `InvitationCode` - 邀请码管理和分享
- `InvitationStats` - 邀请统计展示
- `InvitationHistory` - 邀请历史记录
- `CommissionHistory` - 返利历史记录

### 2. 邀请码管理 (Invitation Code)

**组件**: `components/InvitationCode.tsx`

**功能特性**:
- 邀请码生成和显示
- 一键复制邀请码
- 邀请链接生成和复制
- Telegram分享集成
- 二维码生成
- 社交媒体分享
- 邀请统计概览
- 邀请级别分布展示

**关键方法**:
```typescript
const handleCopyCode = async () => {
  await navigator.clipboard.writeText(inviteCode);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

const handleShareTelegram = () => {
  const text = t('share_message') + `\n邀请码：${inviteCode}\n邀请链接：${inviteLink}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, '_blank');
};
```

### 3. 邀请统计 (Invitation Stats)

**组件**: `components/InvitationStats.tsx`

**功能特性**:
- 邀请人数统计卡片
- 奖励金额统计
- 活跃率分析
- 数据可视化图表
- 多视图切换（推荐数统计、奖励趋势、级别分布）
- 成就徽章系统
- 响应式图表设计

**图表类型**:
- 面积图：推荐数趋势
- 折线图：奖励趋势
- 饼图：级别分布

**技术实现**:
```typescript
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  PieChart, 
  Pie,
  ResponsiveContainer 
} from 'recharts';
```

### 4. 邀请历史 (Invitation History)

**组件**: `components/InvitationHistory.tsx`

**功能特性**:
- 分页邀请记录列表
- 搜索和筛选功能
- 按状态筛选（待确认、已确认、已拒绝）
- 按级别筛选（一级、二级、三级）
- 数据导出功能（CSV/Excel）
- 邀请者信息展示
- 邀请统计摘要

**数据结构**:
```typescript
interface InvitationRecord {
  id: string;
  username: string;
  email: string;
  phone?: string;
  referralLevel: 1 | 2 | 3;
  joinDate: string;
  status: 'pending' | 'confirmed' | 'rejected';
  firstPurchaseDate?: string;
  totalSpent: number;
  rewards: number;
  location?: string;
  device?: string;
}
```

### 5. 返利历史 (Commission History)

**组件**: `components/CommissionHistory.tsx`

**功能特性**:
- 佣金记录详情
- 订单信息展示
- 佣金率计算
- 状态管理（待确认、已确认、已取消）
- 月度收益趋势图
- 收益统计概览
- 筛选和排序功能

**图表展示**:
- 面积图：月度收益趋势
- 统计卡片：总收益、已确认、待确认

### 6. 管理后台 - 邀请统计

**页面**: `/app/admin/invitations/page.tsx`

**功能特性**:
- 管理后台邀请数据概览
- 核心指标监控
- 顶级邀请者展示
- 多标签页管理（数据分析、用户管理、交易记录、异常监控、奖励配置）
- 高级筛选功能
- 数据导出功能

**核心指标**:
- 总用户数
- 总邀请数
- 活跃邀请人数
- 已付佣金总额
- 待付佣金
- 转化率
- 可疑活动数

### 7. 管理后台 - 邀请分析

**组件**: `components/admin/InvitationAnalytics.tsx`

**功能特性**:
- 多维度数据分析
- 邀请趋势分析
- 级别分布统计
- 佣金趋势图表
- 获客渠道分析
- 地理分布统计
- 设备使用统计
- 顶级表现者排行

**分析维度**:
- 时间维度：日、周、月趋势
- 地理维度：地区分布统计
- 渠道维度：获客渠道效果
- 用户维度：表现者排行榜

## 多语言支持

### 翻译文件结构

**中文**: `/src/locales/zh-CN/referral.json`
**英文**: `/src/locales/en-US/referral.json`
**俄文**: `/src/locales/ru-RU/referral.json`
**塔吉克文**: `/src/locales/tg-TJ/referral.json`

### 使用翻译

```typescript
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';

const { t } = useTranslation('referral');
const { currentLanguage } = useLanguage();

// 使用翻译
t('my_referrals', '我的邀请')
t('invite_code', '邀请码')
t('total_rewards', '总奖励金额')
```

### 支持的语言

- 🇨🇳 中文 (zh-CN)
- 🇺🇸 英文 (en-US)
- 🇷🇺 俄文 (ru-RU)
- 🇹🇯 塔吉克文 (tg-TJ)

## 技术栈

### 前端框架
- **Next.js 13+** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架

### 组件库
- **Lucide React** - 图标库
- **Recharts** - 图表库
- **@radix-ui** - UI组件基础

### 状态管理
- **React Hooks** - useState, useEffect
- **i18next** - 国际化管理

### 数据可视化
- **Recharts** - 图表组件
  - 面积图 (AreaChart)
  - 折线图 (LineChart)
  - 柱状图 (BarChart)
  - 饼图 (PieChart)
  - 雷达图 (RadarChart)

## API 接口设计

### 用户邀请相关接口

#### 获取用户邀请信息
```typescript
GET /api/invitation/my-info
Response: {
  inviteCode: string;
  inviteLink: string;
  totalReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
}
```

#### 获取邀请历史
```typescript
GET /api/invitation/history?page=1&limit=10&status=all&level=all
Response: {
  records: InvitationRecord[];
  pagination: PaginationInfo;
}
```

#### 获取返利历史
```typescript
GET /api/invitation/commission-history?page=1&limit=10&status=all
Response: {
  records: CommissionRecord[];
  monthlyStats: MonthlyStats[];
  pagination: PaginationInfo;
}
```

### 管理后台接口

#### 获取管理统计数据
```typescript
GET /api/admin/invitations/stats?dateRange=30d
Response: AdminStats
```

#### 获取分析数据
```typescript
GET /api/admin/invitations/analytics?timeRange=30d&view=overview
Response: AnalyticsData
```

#### 导出数据
```typescript
POST /api/admin/invitations/export
Body: {
  type: 'referrals' | 'commissions' | 'analytics';
  dateRange: string;
  format: 'csv' | 'excel';
}
```

## 响应式设计

### 断点设置
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 适配特性
- 弹性网格布局
- 移动端友好的交互设计
- 触摸手势支持
- 响应式图表
- 自适应字体大小

### 移动端优化
```typescript
// 移动端文本优化
import { MobileText } from '@/components/MobileText';

// 触摸反馈
import { TouchFeedback } from '@/components/TouchFeedback';

// 移动端导航
import { MobileNavigation } from '@/components/MobileNavigation';
```

## 性能优化

### 代码分割
```typescript
import dynamic from 'next/dynamic';

// 动态导入图表组件
const InvitationAnalytics = dynamic(
  () => import('@/components/admin/InvitationAnalytics'),
  { ssr: false, loading: () => <SkeletonLoader /> }
);
```

### 懒加载
- 图表数据按需加载
- 组件级别的代码分割
- 图片懒加载

### 缓存策略
- API响应缓存
- 图表数据缓存
- 翻译文件缓存

## 错误处理

### 错误边界
```typescript
<ErrorBoundary>
  <InvitationStats />
</ErrorBoundary>
```

### 错误状态展示
```typescript
<ErrorState
  title="数据加载失败"
  message="无法获取邀请统计数据"
  action={
    <Button onClick={handleRetry}>
      重试
    </Button>
  }
/>
```

### 网络错误处理
- 自动重试机制
- 离线状态检测
- 用户友好的错误提示

## 测试建议

### 单元测试
```typescript
// 邀请码组件测试
describe('InvitationCode', () => {
  test('should copy invite code when clicked', async () => {
    // 测试逻辑
  });
  
  test('should share to Telegram', () => {
    // 测试逻辑
  });
});
```

### 集成测试
- API接口测试
- 多语言切换测试
- 响应式布局测试

### E2E测试
- 邀请流程完整测试
- 管理后台功能测试
- 移动端体验测试

## 部署说明

### 环境配置
```bash
# 开发环境
npm run dev

# 生产构建
npm run build
npm run start
```

### 环境变量
```env
NEXT_PUBLIC_API_BASE_URL=https://api.luckymart-tj.com
NEXT_PUBLIC_APP_URL=https://luckymart-tj.com
NEXT_PUBLIC_TELEGRAM_BOT_NAME=@luckymart_tj_bot
```

### 依赖安装
```bash
npm install react-i18next i18next
npm install recharts
npm install lucide-react
npm install @radix-ui/react-tabs
npm install @radix-ui/react-dialog
npm install tailwindcss
```

## 安全性考虑

### 数据验证
- 输入数据验证
- XSS攻击防护
- CSRF保护

### API安全
- 请求频率限制
- 数据加密传输
- 权限验证

### 前端安全
- 敏感信息不暴露
- 安全的内容安全策略
- 安全的第三方集成

## 浏览器兼容性

### 支持的浏览器
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Polyfill需求
- Promise
- Fetch API
- Array.from
- Object.entries

## 维护和更新

### 定期维护
- 依赖更新
- 安全补丁
- 性能监控

### 功能更新
- 新功能开发
- 现有功能优化
- 用户体验改进

### 监控指标
- 页面加载速度
- API响应时间
- 用户交互统计
- 错误率监控

## 联系信息

如有技术问题或功能建议，请联系：
- 前端开发团队
- 产品经理
- 技术支持

---

*本文档最后更新时间：2025年10月31日*