'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MarketingBanner as MarketingBannerType, MarketingBannerGroup } from '@/types';

interface MarketingBannerProps {
  banner?: MarketingBannerType | null;
  bannerGroup?: MarketingBannerGroup | null;
  className?: string;
  language: 'zh' | 'en' | 'ru';
  onBannerClick?: (banner: MarketingBannerType) => void;
  onBannerView?: (banner: MarketingBannerType) => void;
}

// 单个横幅组件
const SingleBanner: React.FC<{
  banner: MarketingBannerType;
  language: 'zh' | 'en' | 'ru';
  className?: string;
  onClick?: (banner: MarketingBannerType) => void;
  onView?: (banner: MarketingBannerType) => void;
}> = ({ banner, language, className = '', onClick, onView }) => {
  // 检查横幅是否在有效时间范围内
  const isActive = useCallback(() => {
    const now = new Date();
    if (banner.startTime && now < banner.startTime) return false;
    if (banner.endTime && now > banner.endTime) return false;
    return true;
  }, [banner.startTime, banner.endTime]);

  // 获取多语言文本
  const getText = useCallback((field: 'title' | 'subtitle' | 'description') => {
    const fieldMap = {
      title: ['titleZh', 'titleEn', 'titleRu'],
      subtitle: ['subtitleZh', 'subtitleEn', 'subtitleRu'],
      description: ['descriptionZh', 'descriptionEn', 'descriptionRu']
    };
    
    const langMap = { zh: 0, en: 1, ru: 2 };
    const index = langMap[language];
    
    return banner[fieldMap[field][index] as keyof MarketingBannerType] as string || '';
  }, [banner, language]);

  // 获取样式类
  const getWidthClass = () => {
    switch (banner.width) {
      case 'full': return 'w-full';
      case 'container': return 'max-w-7xl mx-auto';
      case 'auto': 
      default: return 'w-auto';
    }
  };

  const getHeightClass = () => {
    switch (banner.height) {
      case 'small': return 'h-16 md:h-20';
      case 'large': return 'h-48 md:h-64';
      case 'medium':
      default: return 'h-24 md:h-32';
    }
  };

  const getBorderRadiusClass = () => {
    switch (banner.borderRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded-md';
      case 'large': return 'rounded-2xl';
      case 'medium':
      default: return 'rounded-lg';
    }
  };

  const getTextAlignClass = () => {
    switch (banner.textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const getAnimationClass = () => {
    switch (banner.animation) {
      case 'fade': return 'animate-fade-in';
      case 'slide': return 'animate-slide-in';
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'none':
      default: return '';
    }
  };

  // 处理点击事件
  const handleClick = () => {
    if (onClick && banner.clickable !== false) {
      onClick(banner);
    }
    if (banner.linkUrl && banner.clickable !== false) {
      const target = banner.linkTarget || '_self';
      window.open(banner.linkUrl, target);
    }
  };

  // 记录浏览量
  useEffect(() => {
    if (onView && isActive()) {
      onView(banner);
    }
  }, [banner, onView, isActive]);

  // 如果不在有效时间范围内，不渲染
  if (!isActive() || !banner.enabled) {
    return null;
  }

  const title = getText('title');
  const subtitle = getText('subtitle');
  const description = getText('description');
  
  if (!title) return null;

  const BannerContent = (
    <div
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg
        ${getWidthClass()} ${getHeightClass()} ${getBorderRadiusClass()} ${getAnimationClass()}
        ${className}
      `}
      style={{
        backgroundColor: banner.backgroundColor || '#3B82F6',
        color: banner.textColor || '#FFFFFF'
      }}
      onClick={handleClick}
    >
      {/* 背景图片 */}
      {banner.imageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${banner.imageUrl})` }}
        />
      )}
      
      {/* 内容区域 */}
      <div className={`relative z-10 h-full flex flex-col justify-center px-4 md:px-8 ${getTextAlignClass()}`}>
        {/* 主标题 */}
        <h3 className="text-sm md:text-lg lg:text-xl font-bold leading-tight mb-1">
          {title}
        </h3>
        
        {/* 副标题 */}
        {subtitle && (
          <p className="text-xs md:text-sm opacity-90 mb-1">
            {subtitle}
          </p>
        )}
        
        {/* 描述 */}
        {description && (
          <p className="text-xs opacity-75 hidden md:block">
            {description}
          </p>
        )}
      </div>
      
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
    </div>
  );

  return BannerContent;
};

// 轮播横幅组件
const CarouselBanner: React.FC<{
  bannerGroup: MarketingBannerGroup;
  language: 'zh' | 'en' | 'ru';
  className?: string;
  onBannerClick?: (banner: MarketingBannerType) => void;
  onBannerView?: (banner: MarketingBannerType) => void;
}> = ({ bannerGroup, language, className = '', onBannerClick, onBannerView }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(bannerGroup.autoPlay || false);

  // 过滤有效的横幅（启用且在时间范围内）
  const activeBanners = bannerGroup.banners.filter(banner => {
    if (!banner.enabled) return false;
    
    const now = new Date();
    if (banner.startTime && now < banner.startTime) return false;
    if (banner.endTime && now > banner.endTime) return false;
    
    return true;
  });

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;

    const interval = bannerGroup.autoPlayInterval || 3000;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        bannerGroup.loop === false 
          ? Math.min(prevIndex + 1, activeBanners.length - 1)
          : (prevIndex + 1) % activeBanners.length
      );
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, activeBanners.length, bannerGroup.autoPlayInterval, bannerGroup.loop]);

  // 手动切换
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? activeBanners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === activeBanners.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* 横幅容器 */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeBanners.map((banner) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              <SingleBanner
                banner={banner}
                language={language}
                onClick={onBannerClick}
                onView={onBannerView}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 箭头导航 */}
      {bannerGroup.showArrows && activeBanners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            aria-label="Previous banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            aria-label="Next banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 指示器 */}
      {bannerGroup.showIndicators && activeBanners.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* 暂停/播放按钮 */}
      {bannerGroup.autoPlay && activeBanners.length > 1 && (
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors"
          aria-label={isAutoPlaying ? 'Pause autoplay' : 'Start autoplay'}
        >
          {isAutoPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

// 主组件
const MarketingBanner: React.FC<MarketingBannerProps> = ({
  banner,
  bannerGroup,
  className = '',
  language,
  onBannerClick,
  onBannerView
}) => {
  // 优先级排序横幅
  const getSortedBanners = useCallback((banners: MarketingBannerType[]) => {
    return [...banners].sort((a, b) => b.priority - a.priority);
  }, []);

  // 如果提供了横幅组，使用轮播组件
  if (bannerGroup) {
    return (
      <CarouselBanner
        bannerGroup={bannerGroup}
        language={language}
        className={className}
        onBannerClick={onBannerClick}
        onBannerView={onBannerView}
      />
    );
  }

  // 如果提供了单个横幅，使用单个横幅组件
  if (banner) {
    return (
      <SingleBanner
        banner={banner}
        language={language}
        className={className}
        onClick={onBannerClick}
        onView={onBannerView}
      />
    );
  }

  // 如果没有提供横幅，返回 null
  return null;
};

export default MarketingBanner;