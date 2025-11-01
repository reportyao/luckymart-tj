# MarketingBanner 营销横幅组件

一个功能强大的 React 营销横幅组件，支持轮播、多语言、响应式设计和多种动画效果。

## 功能特性

### 🎯 核心功能
- **单个横幅显示** - 展示单个营销横幅
- **轮播横幅组** - 支持多个横幅自动轮播
- **多语言支持** - 支持中文、英文、俄文三种语言
- **响应式设计** - 适配手机、平板、桌面设备
- **点击跳转** - 支持点击横幅跳转到指定链接

### 🎨 样式和动画
- **多种尺寸** - 小、中、大三种尺寸可选
- **多种形状** - 支持不同的圆角设置
- **多种对齐** - 左、中、右三种文本对齐方式
- **丰富动画** - 淡入、滑入、弹跳、脉冲等动画效果
- **自定义颜色** - 支持自定义背景色和文字色

### 📱 用户体验
- **自动轮播** - 支持自动切换横幅（可暂停/播放）
- **手动控制** - 支持箭头导航和指示器点击
- **时间控制** - 支持设置横幅显示的开始和结束时间
- **优先级排序** - 支持横幅优先级设置
- **浏览统计** - 自动记录浏览量和点击量

## 类型定义

### MarketingBanner
```typescript
interface MarketingBanner {
  id: string;
  type: 'promotion' | 'discount' | 'new_user' | 'activity' | 'announcement';
  titleZh: string;  // 中文标题
  titleEn: string;  // 英文标题
  titleRu: string;  // 俄文标题
  subtitleZh?: string;  // 中文副标题
  subtitleEn?: string;  // 英文副标题
  subtitleRu?: string;  // 俄文副标题
  descriptionZh?: string;  // 中文描述
  descriptionEn?: string;  // 英文描述
  descriptionRu?: string;  // 俄文描述
  imageUrl?: string;  // 背景图片URL
  backgroundColor?: string;  // 背景颜色
  textColor?: string;  // 文字颜色
  textAlign?: 'left' | 'center' | 'right';  // 文字对齐
  width?: 'full' | 'container' | 'auto';  // 宽度设置
  height?: 'small' | 'medium' | 'large';  // 高度设置
  borderRadius?: 'none' | 'small' | 'medium' | 'large';  // 圆角设置
  animation?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'none';  // 动画效果
  autoPlay?: boolean;  // 是否自动播放
  autoPlayInterval?: number;  // 自动播放间隔（毫秒）
  showIndicators?: boolean;  // 是否显示指示器
  showArrows?: boolean;  // 是否显示箭头
  clickable?: boolean;  // 是否可点击
  linkUrl?: string;  // 点击跳转链接
  linkTarget?: '_self' | '_blank';  // 链接打开方式
  priority: number;  // 优先级（数字越大优先级越高）
  enabled: boolean;  // 是否启用
  startTime?: Date;  // 开始时间
  endTime?: Date;  // 结束时间
  viewCount: number;  // 浏览次数
  clickCount: number;  // 点击次数
  conversionRate?: number;  // 转化率
  tags?: string[];  // 标签
  createdAt: Date;  // 创建时间
  updatedAt: Date;  // 更新时间
}
```

### MarketingBannerGroup
```typescript
interface MarketingBannerGroup {
  id: string;
  name: string;  // 组名称
  description?: string;  // 组描述
  banners: MarketingBanner[];  // 横幅列表
  autoPlay?: boolean;  // 是否自动播放
  autoPlayInterval?: number;  // 自动播放间隔
  loop?: boolean;  // 是否循环播放
  showIndicators?: boolean;  // 是否显示指示器
  showArrows?: boolean;  // 是否显示箭头
  responsive?: {  // 响应式设置
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
  enabled: boolean;  // 是否启用
  createdAt: Date;  // 创建时间
  updatedAt: Date;  // 更新时间
}
```

## 使用方法

### 基本用法

#### 1. 单个横幅
```tsx
import MarketingBanner from '@/components/MarketingBanner';

const singleBanner: MarketingBanner = {
  id: '1',
  type: 'promotion',
  titleZh: '双十一大促销',
  titleEn: 'Double 11 Mega Sale',
  titleRu: 'Мега-распродажа Double 11',
  subtitleZh: '全场5折起',
  subtitleEn: 'Up to 50% off',
  subtitleRu: 'До 50% скидки',
  backgroundColor: '#FF6B6B',
  textColor: '#FFFFFF',
  width: 'full',
  height: 'medium',
  borderRadius: 'large',
  animation: 'fade',
  priority: 10,
  enabled: true,
  viewCount: 0,
  clickCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  clickable: true,
  linkUrl: '/promotions/double11'
};

<MarketingBanner
  banner={singleBanner}
  language="zh"
  onBannerClick={(banner) => console.log('Clicked:', banner.titleZh)}
  onBannerView={(banner) => console.log('Viewed:', banner.titleZh)}
/>
```

#### 2. 轮播横幅组
```tsx
const bannerGroup: MarketingBannerGroup = {
  id: 'main-promotions',
  name: '主要促销活动',
  banners: [banner1, banner2, banner3],
  autoPlay: true,
  autoPlayInterval: 4000,
  loop: true,
  showIndicators: true,
  showArrows: true,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

<MarketingBanner
  bannerGroup={bannerGroup}
  language="zh"
  onBannerClick={handleBannerClick}
  onBannerView={handleBannerView}
/>
```

### 高级用法

#### 3. 不同尺寸和样式
```tsx
// 小尺寸横幅
const smallBanner = {
  ...singleBanner,
  height: 'small',
  width: 'auto',
  borderRadius: 'small'
};

// 大尺寸横幅
const largeBanner = {
  ...singleBanner,
  height: 'large',
  width: 'full',
  borderRadius: 'large'
};
```

#### 4. 不同动画效果
```tsx
const animations = ['fade', 'slide', 'bounce', 'pulse', 'none'];

animations.map((animation) => (
  <MarketingBanner
    key={animation}
    banner={{
      ...singleBanner,
      animation: animation as any,
      id: `banner-${animation}`
    }}
    language="zh"
  />
));
```

#### 5. 时间控制
```tsx
const timeControlledBanner = {
  ...singleBanner,
  startTime: new Date('2024-01-01'),  // 2024年1月1日开始
  endTime: new Date('2024-12-31'),    // 2024年12月31日结束
};
```

### Props 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `banner` | `MarketingBanner` | 否 | 单个横幅数据 |
| `bannerGroup` | `MarketingBannerGroup` | 否 | 横幅组数据 |
| `className` | `string` | 否 | 自定义CSS类名 |
| `language` | `'zh' \| 'en' \| 'ru'` | 是 | 当前语言 |
| `onBannerClick` | `(banner: MarketingBanner) => void` | 否 | 横幅点击回调 |
| `onBannerView` | `(banner: MarketingBanner) => void` | 否 | 横幅浏览回调 |

### 注意事项

1. **优先级控制**: 当提供 `bannerGroup` 时，组件会自动按优先级排序显示
2. **时间控制**: 横幅会根据 `startTime` 和 `endTime` 自动显示/隐藏
3. **语言切换**: 确保提供正确的语言参数以显示对应的文本
4. **响应式**: 组件会自动适配不同屏幕尺寸
5. **性能优化**: 大量横幅时建议使用 `bannerGroup` 进行轮播

### 样式定制

组件使用了 Tailwind CSS 类名，可以通过以下方式自定义样式：

```css
/* 自定义动画 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式文本优化 */
.marketing-banner-text {
  @apply text-sm md:text-base lg:text-lg;
}

.marketing-banner-title {
  @apply text-base md:text-lg lg:text-xl font-bold leading-tight;
}
```

## 示例文件

- `MarketingBanner.examples.tsx` - 完整的使用示例
- 包含单个横幅、轮播组、多语言、不同尺寸、不同动画等多种示例

## 文件结构

```
components/
├── MarketingBanner.tsx          # 主组件
├── MarketingBanner.examples.tsx # 使用示例
└── README.md                    # 说明文档
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ 移动端浏览器

## 贡献指南

1. 提交 Issue 描述问题或建议
2. Fork 项目并创建功能分支
3. 提交 Pull Request 并关联 Issue
4. 确保通过所有测试和代码检查

## 许可证

MIT License