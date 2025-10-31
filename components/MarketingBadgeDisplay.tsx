'use client';

import React from 'react';
import { MarketingBadge } from '@/types';

interface MarketingBadgeDisplayProps {
  badge: MarketingBadge | null | undefined;
  language: 'zh' | 'en' | 'ru';
  className?: string;
}

const MarketingBadgeDisplay: React.FC<MarketingBadgeDisplayProps> = ({
  badge,
  language,
  className = ''
}) => {
  if (!badge || !badge.enabled) {
    return null;
  }

  // 根据语言获取文案
  const getText = () => {
    switch (language) {
      case 'zh':
        return badge.textZh;
      case 'en':
        return badge.textEn;
      case 'ru':
        return badge.textRu;
      default:
        return badge.textZh;
    }
  };

  // 获取位置样式
  const getPositionClass = () => {
    switch (badge.position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'top-right':
        return 'top-2 right-2';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-2 right-2';
    }
  };

  // 获取动画样式
  const getAnimationClass = () => {
    switch (badge.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'none':
      default:
        return '';
    }
  };

  const text = getText();
  if (!text) {return null;}

  return (
    <div
      className={`absolute z-10 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-lg ${getPositionClass()} ${getAnimationClass()} ${className}`}
      style={{
        backgroundColor: badge.bgColor,
        color: badge.color
      }}
    >
      {text}
    </div>
  );
};

export default MarketingBadgeDisplay;
