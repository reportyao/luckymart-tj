import React from 'react';
import MarketingBanner from './MarketingBanner';
import { MarketingBanner as MarketingBannerType, MarketingBannerGroup } from '@/types';

// 示例营销横幅数据
const sampleBanners: MarketingBannerType[] = [
  {
    id: '1',
    type: 'promotion',
    titleZh: '双十一大促销',
    titleEn: 'Double 11 Mega Sale',
    titleRu: 'Мега-распродажа Double 11',
    subtitleZh: '全场5折起',
    subtitleEn: 'Up to 50% off',
    subtitleRu: 'До 50% скидки',
    descriptionZh: '限时优惠，错过再等一年',
    descriptionEn: 'Limited time offer, next year wait',
    descriptionRu: 'Предложение ограничено по времени',
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
    textAlign: 'center',
    width: 'full',
    height: 'medium',
    borderRadius: 'large',
    animation: 'fade',
    autoPlay: false,
    priority: 10,
    enabled: true,
    viewCount: 0,
    clickCount: 0,
    tags: ['promotion', 'sale'],
    createdAt: new Date(),
    updatedAt: new Date(),
    clickable: true,
    linkUrl: '/promotions/double11'
  },
  {
    id: '2',
    type: 'new_user',
    titleZh: '新用户专享',
    titleEn: 'New User Special',
    titleRu: 'Специальное предложение для новых пользователей',
    subtitleZh: '注册送100金币',
    subtitleEn: 'Register and get 100 coins',
    subtitleRu: 'Зарегистрируйтесь и получите 100 монет',
    backgroundColor: '#4ECDC4',
    textColor: '#FFFFFF',
    textAlign: 'left',
    width: 'container',
    height: 'small',
    borderRadius: 'medium',
    animation: 'bounce',
    priority: 9,
    enabled: true,
    viewCount: 0,
    clickCount: 0,
    tags: ['newuser', 'bonus'],
    createdAt: new Date(),
    updatedAt: new Date(),
    clickable: true,
    linkUrl: '/register'
  },
  {
    id: '3',
    type: 'activity',
    titleZh: '每日签到奖励',
    titleEn: 'Daily Check-in Rewards',
    titleRu: 'Ежедневные награды за регистрацию',
    subtitleZh: '连续签到有惊喜',
    subtitleEn: 'Surprise for consecutive check-ins',
    subtitleRu: 'Сюрприз за последовательные регистрации',
    backgroundColor: '#45B7D1',
    textColor: '#FFFFFF',
    textAlign: 'center',
    width: 'auto',
    height: 'medium',
    borderRadius: 'small',
    animation: 'pulse',
    priority: 8,
    enabled: true,
    viewCount: 0,
    clickCount: 0,
    tags: ['checkin', 'reward'],
    createdAt: new Date(),
    updatedAt: new Date(),
    clickable: true,
    linkUrl: '/checkin'
  }
];

// 示例横幅组
const sampleBannerGroup: MarketingBannerGroup = {
  id: 'main-promotions',
  name: '主要促销活动',
  description: '首页主要营销横幅轮播',
  banners: sampleBanners,
  autoPlay: true,
  autoPlayInterval: 4000,
  loop: true,
  showIndicators: true,
  showArrows: true,
  responsive: {
    mobile: true,
    tablet: true,
    desktop: true
  },
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const MarketingBannerExamples: React.FC = () => {
  // 横幅点击处理
  const handleBannerClick = (banner: MarketingBannerType) => {
    console.log('Banner clicked:', banner.titleZh);
    // 这里可以添加统计代码
  };

  // 横幅浏览处理
  const handleBannerView = (banner: MarketingBannerType) => {
    console.log('Banner viewed:', banner.titleZh);
    // 这里可以添加浏览统计代码
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">MarketingBanner 组件示例</h1>

      {/* 单个横幅示例 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">单个横幅示例</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg mb-2">促销横幅</h3>
            <MarketingBanner
              banner={sampleBanners[0]}
              language="zh"
              className="mb-4"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">新用户横幅</h3>
            <MarketingBanner
              banner={sampleBanners[1]}
              language="zh"
              className="mb-4"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">签到横幅</h3>
            <MarketingBanner
              banner={sampleBanners[2]}
              language="zh"
              className="mb-4"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
        </div>
      </section>

      {/* 轮播横幅组示例 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">轮播横幅组示例</h2>
        <MarketingBanner
          bannerGroup={sampleBannerGroup}
          language="zh"
          className="mb-4"
          onBannerClick={handleBannerClick}
          onBannerView={handleBannerView}
        />
      </section>

      {/* 不同语言示例 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">多语言示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg mb-2">中文</h3>
            <MarketingBanner
              banner={sampleBanners[0]}
              language="zh"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">英文</h3>
            <MarketingBanner
              banner={sampleBanners[0]}
              language="en"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">俄文</h3>
            <MarketingBanner
              banner={sampleBanners[0]}
              language="ru"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
        </div>
      </section>

      {/* 不同尺寸示例 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">不同尺寸示例</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg mb-2">小尺寸</h3>
            <MarketingBanner
              banner={{
                ...sampleBanners[0],
                height: 'small',
                width: 'auto'
              }}
              language="zh"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">中等尺寸</h3>
            <MarketingBanner
              banner={{
                ...sampleBanners[0],
                height: 'medium',
                width: 'container'
              }}
              language="zh"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
          
          <div>
            <h3 className="text-lg mb-2">大尺寸</h3>
            <MarketingBanner
              banner={{
                ...sampleBanners[0],
                height: 'large',
                width: 'full'
              }}
              language="zh"
              onBannerClick={handleBannerClick}
              onBannerView={handleBannerView}
            />
          </div>
        </div>
      </section>

      {/* 不同动画示例 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">不同动画示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['fade', 'slide', 'bounce', 'pulse', 'none'].map((animation) => (
            <div key={animation}>
              <h3 className="text-lg mb-2 capitalize">{animation} 动画</h3>
              <MarketingBanner
                banner={{
                  ...sampleBanners[0],
                  animation: animation as any,
                  titleZh: `${animation} 动画示例`,
                  id: `animation-${animation}`
                }}
                language="zh"
                onBannerClick={handleBannerClick}
                onBannerView={handleBannerView}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MarketingBannerExamples;