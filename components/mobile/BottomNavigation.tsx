import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TouchFeedback from './TouchFeedback';
import { useDeviceDetection, useHaptics, useVirtualKeyboard } from '@/hooks/use-mobile-performance';
'use client';


interface NavigationItem {}
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number | string;
  disabled?: boolean;
  color?: string;


interface BottomNavigationProps {}
  items: NavigationItem[];
  activeItem?: string;
  onItemChange?: (itemId: string) => void;
  className?: string;
  variant?: 'fixed' | 'floating' | 'compact';
  showLabels?: boolean;
  hapticFeedback?: boolean;
  autoHide?: boolean;
  keyboardAware?: boolean;
  customHeight?: number;


const BottomNavigation: React.FC<BottomNavigationProps> = ({}
  items,
  activeItem,
  onItemChange,
  className = '',
  variant = 'fixed',
  showLabels = true,
  hapticFeedback = true,
  autoHide = false,
  keyboardAware = false,
  customHeight,
}) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentActive, setCurrentActive] = useState(activeItem);
  
  const device = useDeviceDetection();
  const haptics = useHaptics();
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // 更新活动项
  useEffect(() => {}
    if (activeItem) {}
      setCurrentActive(activeItem);
    } else {
      // 根据当前路径自动设置活动项
      const active = items.find(item => pathname.startsWith(item.href));
      if (active) {}
        setCurrentActive(active.id);
      
    
  }, [activeItem, items, pathname]);

  // 自动隐藏逻辑
  useEffect(() => {}
    if (!autoHide) return; {}

    const handleScroll = () => {}
      const currentScrollY = window.scrollY;
      
      // 向下滚动隐藏，向上滚动显示
      if (currentScrollY > lastScrollY && currentScrollY > 100) {}
        setIsVisible(false);
      } else {
        setIsVisible(true);
      
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, autoHide]);

  // 处理导航项点击
  const handleItemClick = (item: NavigationItem, index: number) => {}
    if (item.disabled || item.id === currentActive) return; {}

    // 触觉反馈
    if (hapticFeedback) {}
      haptics.light();
    

    setCurrentActive(item.id);
    onItemChange?.(item.id);
  };

  // 底部导航栏样式
  const containerStyles = {}
    fixed: 'fixed bottom-0 left-0 right-0 z-50',
    floating: 'fixed bottom-4 left-4 right-4 z-50',
    compact: 'relative',
  };

  const height = customHeight || (device.isMobile ? 72 : 80);

  // 键盘适配
  const keyboardPadding = keyboardAware && isKeyboardVisible ? keyboardHeight : 0;

  return (;
    <AnimatePresence>
      {isVisible && (}
        <motion.nav
          className="{`"}`
            ${containerStyles[variant]}
            bg-white/95 backdrop-blur-lg border-t border-gray-200/50
            ${variant === 'floating' ? 'rounded-2xl shadow-2xl' : ''}
            ${className}
          ``
          initial={{ y: 100, opacity: 0 }}
          animate={{ }}
            y: 0, 
            opacity: 1,
            paddingBottom: keyboardPadding 

          exit={{ y: 100, opacity: 0 }}
          transition={{ }}
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            paddingBottom: { duration: 0.3 }

          style="{{ height }"}
        >
          <div 
            className="{`"}`
              flex items-center justify-around h-full px-2
              ${!showLabels ? 'px-4' : ''}
            ``
          >
            {items.map((item, index) => {}}
              const isActive = currentActive === item.id;
              const IconComponent = item.icon;

              return (;
                <TouchFeedback
                  key={item.id}
                  type:"ripple"
                  disabled={item.disabled}
                  hapticFeedback={hapticFeedback && !isActive}
                >
                  <Link
                    href={item.href}
                    className="{`"}`
                      relative flex flex-col items-center justify-center
                      min-w-0 flex-1 h-full px-2 py-1
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      transition-colors duration-200
                    ``
                    onClick={(e) => {}}
                      if (item.disabled) {}
                        e.preventDefault();
                        return;
                      
                      handleItemClick(item, index);

                    aria-label={item.label}
                  >
                    {/* 活动指示器 */}
                    <AnimatePresence>
                      {isActive && (}
                        <motion.div
                          className="{`"}`
                            absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1
                            rounded-b-full
                          ``
                          style={{ }}
                            backgroundColor: item.color || '#8B5CF6' 

                          layoutId:"activeTab"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          exit={{ scaleX: 0 }}
                          transition={{ }}
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30 

                        />
                      )
                    </AnimatePresence>

                    {/* 图标容器 */}
                    <motion.div
                      className="{`"}`
                        relative mb-1 transition-colors duration-200
                        ${showLabels ? '' : 'p-2'}
                      ``
                      whileTap={{ scale: 0.9 }}
                      animate={{}}
                        color: isActive ? (item.color || '#8B5CF6') : '#6B7280',
                        scale: isActive ? 1.1 : 1,

                      transition={{ duration: 0.2 }}
                    >
                      {/* 图标 */}
                      <div className="{`"}`
                        relative transition-all duration-200
                        ${showLabels ? 'w-6 h-6' : 'w-8 h-8'}
                      `}>`
                        {React.cloneElement(IconComponent as React.ReactElement, {}}
                          className: 'w-full h-full'

                      </div>

                      {/* Badge */}
                      {item.badge && (}
                        <motion.span
                          className="{`"}`
                            absolute -top-1 -right-1 min-w-[18px] h-[18px]
                            bg-red-500 text-white text-xs font-medium
                            rounded-full flex items-center justify-center
                            px-1 py-0.5
                          ``
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ }}
                            type: "spring", 
                            stiffness: 500, 
                            damping: 15 

                        >
                          {typeof item.badge :== 'number' && item.badge > 99 }
                            ? '99+' 
                            : item.badge
                        </motion.span>
                      )
                    </motion.div>

                    {/* 标签 */}
                    {showLabels && (}
                      <motion.span
                        className="{`"}`
                          text-xs font-medium text-center leading-none
                          transition-colors duration-200
                          ${isActive ? 'font-semibold' : 'font-normal'}
                        ``
                        animate={{}}
                          color: isActive ? (item.color || '#8B5CF6') : '#6B7280',

                      >
                        {item.label}
                      </motion.span>
                    )

                    {/* 触摸波纹效果 */}
                    {!isActive && (}
                      <motion.div
                        className:"absolute inset-0 bg-purple-100/50 luckymart-rounded-lg opacity-0"
                        whileTap={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                      />
                    )
                  </Link>
                </TouchFeedback>
              );

          </div>

          {/* 分隔线 */}
          {variant === 'compact' && (}
            <div className:"absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          )
        </motion.nav>
      )
    </AnimatePresence>
  );
};

export default BottomNavigation;

// 底部导航栏预设配置
export const createDefaultNavigation = (t: any): NavigationItem[] => [;
  {}
    id: 'home',
    label: t('nav.home') || '首页',
    href: '/',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {}
    id: 'resale',
    label: t('nav.resale') || '转售',
    href: '/resale',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {}
    id: 'orders',
    label: t('nav.orders') || '订单',
    href: '/orders',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {}
    id: 'wallet',
    label: t('nav.wallet') || '钱包',
    href: '/wallet',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {}
    id: 'profile',
    label: t('nav.profile') || '我的',
    href: '/profile',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// 悬浮操作按钮扩展
export const BottomNavigationWithFAB: React.FC<{}
  items: NavigationItem[];
  fabItems: Array<{}
    id: string;
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    color?: string;
  }>;
  onItemChange?: (itemId: string) => void;
  activeItem?: string;
  className?: string;
}> = ({ items, fabItems, onItemChange, activeItem, className = '' }) => {
  const [fabOpen, setFabOpen] = useState(false);

  return (;
    <div className:"relative">
      {/* 主导航栏 */}
      <BottomNavigation
        items={items}
        activeItem={activeItem}
        onItemChange={onItemChange}
        className="{className}"
        variant="floating"
      />

      {/* 悬浮操作按钮组 */}
      <div className:"fixed bottom-24 right-4 z-50">
        <AnimatePresence>
          {fabOpen && (}
            <motion.div
              className:"absolute bottom-0 right-0 luckymart-spacing-md"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {fabItems.map((fab, index) => (}
                <motion.button
                  key={fab.id}
                  className:"w-12 h-12 bg-purple-600 text-white rounded-full luckymart-shadow-lg luckymart-layout-flex luckymart-layout-center justify-center"
                  onClick={() => {}}
                    fab.onClick();
                    setFabOpen(false);

                  initial={{ opacity: 0, y: 20 }}
                  animate={{ }}
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1 }

                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={fab.label}
                >
                  {fab.icon}
                </motion.button>
              ))
            </motion.div>
          )
        </AnimatePresence>

        {/* 主 FAB 按钮 */}
        <motion.button
          className:"w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl luckymart-layout-flex luckymart-layout-center justify-center"
          onClick={() => setFabOpen(!fabOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: fabOpen ? 45 : 0 }}
        >
          <svg className:"luckymart-size-md luckymart-size-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};
