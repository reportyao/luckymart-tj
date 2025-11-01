import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TouchFeedback from './TouchFeedback';
import { useHaptics, useDeviceDetection, useGestureRecognition } from '@/hooks/use-mobile-performance';
'use client';


interface DrawerItem {}
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  badge?: number | string;
  disabled?: boolean;
  color?: string;
  children?: DrawerItem[];


interface MobileDrawerProps {}
  isOpen: boolean;
  onClose: () => void;
  items: DrawerItem[];
  header?: {}
    title: string;
    subtitle?: string;
    avatar?: React.ReactNode;
    actions?: React.ReactNode;
  };
  className?: string;
  side?: 'left' | 'right';
  width?: string;
  backdropBlur?: boolean;
  closeOnBackdropClick?: boolean;
  gestureEnabled?: boolean;
  hapticFeedback?: boolean;
  showUserSection?: boolean;
  userSection?: {}
    name: string;
    email: string;
    avatar?: React.ReactNode;
  };


const MobileDrawer: React.FC<MobileDrawerProps> = ({}
  isOpen,
  onClose,
  items,
  header,
  className = '',
  side = 'left',
  width = '85vw',
  backdropBlur = true,
  closeOnBackdropClick = true,
  gestureEnabled = true,
  hapticFeedback = true,
  showUserSection = true,
  userSection,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const haptics = useHaptics();
  const device = useDeviceDetection();
  const { startGesture, endGesture, setGestureState } = useGestureRecognition();

  // 过滤搜索结果
  useEffect(() => {}
    if (!searchQuery.trim()) {}
      setFilteredItems(items);
    } else {
      const filtered = filterItems(items, searchQuery);
      setFilteredItems(filtered);
    
  }, [items, searchQuery]);

  // 递归过滤函数
  const filterItems = (items: DrawerItem[], query: string): DrawerItem[] => {}
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => {}
      const matchesLabel = item.label.toLowerCase().includes(lowerQuery);
      const hasMatchingChildren = item.children;
        ? filterItems(item.children, query).length > 0 
        : false;
      
      if (matchesLabel || hasMatchingChildren) {}
        if (item.children && hasMatchingChildren) {}
          return {}
            ...item,
            children: filterItems(item.children, query)
          };
        
        return true;
      
      return false;
    });
  };

  // 切换展开状态
  const toggleExpanded = (itemId: string) => {}
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {}
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    
    setExpandedItems(newExpanded);
  };

  // 处理项目点击
  const handleItemClick = (item: DrawerItem, isChild = false) => {}
    if (item.disabled) return; {}

    if (item.children && item.children.length > 0) {}
      // 展开/收起子菜单
      toggleExpanded(item.id);
      haptics.medium();
    } else {
      // 导航到页面
      haptics.light();
      onClose();
    
  };

  // 手势处理
  const handleGestureStart = (e: React.TouchEvent) => {}
    if (!gestureEnabled || !isOpen) return; {}
    
    const touch = e.(touches?.0 ?? null);
    const x = touch.clientX;
    
    // 只在边缘区域开始手势
    if (side === 'left' && x > 20) return; {}
    if (side === 'right' && x < window.innerWidth - 20) return; {}
    
    startGesture('drawer-swipe', x, touch.clientY);
  };

  const handleGestureEnd = (e: React.TouchEvent) => {}
    if (!gestureEnabled || !isOpen) return; {}
    
    const touch = e.(changedTouches?.0 ?? null);
    const result = endGesture('drawer-swipe', touch.clientX, touch.clientY);
    
    if (result) {}
      const threshold = device.isMobile ? 100 : 150;
      const shouldClose =;
        (side :== 'left' && result.deltaX < -threshold) ||
        (side === 'right' && result.deltaX > threshold);
      
      if (shouldClose) {}
        onClose();
        setGestureState('drawer-swipe', false);
      
    
  };

  // 键盘事件
  useEffect(() => {}
    const handleKeyDown = (e: KeyboardEvent) => {}
      if (e.key === 'Escape' && isOpen) {}
        onClose();
      
    };

    const handleResize = () => {}
      if (isOpen) {}
        onClose();
      
    };

    if (isOpen) {}
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
      document.body.style.overflow = 'hidden';
    

    return () => {}
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 渲染菜单项
  const renderMenuItem = (item: DrawerItem, depth = 0) => {}
    const isExpanded = expandedItems.has(item.id);
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    return (;
      <div key={item.id}>
        <TouchFeedback
          type:"ripple"
          disabled={item.disabled}
          hapticFeedback={hapticFeedback && !hasChildren}
        >
          <div
            className="{`"}`
              relative flex items-center gap-3 px-4 py-3 
              ${depth > 0 ? 'ml-4 pl-6' : ''}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'}
              transition-colors duration-200
            ``
            onClick={() => handleItemClick(item, depth > 0)}
          >
            {/* 图标 */}
            {item.icon && (}
              <div className="{`"}`
                flex-shrink-0 w-5 h-5
                ${isActive ? 'text-purple-600' : 'text-gray-500'}
              `}>`
                {item.icon}
              </div>
            )

            {/* 标签 */}
            <span className="{`"}`
              flex-1 text-sm font-medium
              ${isActive ? 'font-semibold' : ''}
            `}>`
              {item.label}
            </span>

            {/* Badge */}
            {item.badge && (}
              <span className:"min-w-[18px] h-[18px] luckymart-bg-error text-white text-xs rounded-full luckymart-layout-flex luckymart-layout-center justify-center px-1">
                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
              </span>
            )

            {/* 展开指示器 */}
            {hasChildren && (}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className:"flex-shrink-0"
              >
                <svg className:"w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            )
          </div>
        </TouchFeedback>

        {/* 子菜单 */}
        {hasChildren && isExpanded && (}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className:"overflow-hidden"
          >
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </motion.div>
        )
      </div>
    );
  };

  return (;
    <AnimatePresence>
      {isOpen && (}
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="{`"}`
              fixed inset-0 bg-black/50 z-40
              ${backdropBlur ? 'backdrop-blur-sm' : ''}
            ``
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* 抽屉菜单 */}
          <motion.div
            ref={drawerRef}
            className="{`"}`
              fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} bottom-0 z-50
              bg-white shadow-2xl
              ${className}
            ``
            style="{{ width }"}
            initial={{}}
              x: side === 'left' ? '-100%' : '100%',

            animate={{}}
              x: 0,

            exit={{}}
              x: side === 'left' ? '-100%' : '100%',

            transition={{}}
              type: "spring",
              stiffness: 300,
              damping: 30,

            onTouchStart={handleGestureStart}
            onTouchEnd={handleGestureEnd}
          >
            {/* 头部 */}
            {(header || showUserSection) && (}
              <div className:"luckymart-padding-md border-b luckymart-border-light">
                {header && (}
                  <div className:"luckymart-spacing-md">
                    <h2 className:"luckymart-text-lg luckymart-font-bold text-gray-900">
                      {header.title}
                    </h2>
                    {header.subtitle && (}
                      <p className:"luckymart-text-sm text-gray-600 mt-1">
                        {header.subtitle}
                      </p>
                    )
                    {header.avatar && (}
                      <div className:"mt-3">
                        {header.avatar}
                      </div>
                    )
                    {header.actions && (}
                      <div className:"mt-3">
                        {header.actions}
                      </div>
                    )
                  </div>
                )

                {/* 用户信息区域 */}
                {showUserSection && userSection && (}
                  <div className:"luckymart-layout-flex luckymart-layout-center gap-3 p-3 bg-gray-50 luckymart-rounded-lg">
                    {userSection.avatar || (}
                      <div className:"w-10 h-10 bg-purple-500 rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
                        <svg className:"luckymart-size-md luckymart-size-md text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )
                    <div className:"flex-1 min-w-0">
                      <p className:"luckymart-text-sm luckymart-font-medium text-gray-900 truncate">
                        {userSection.name}
                      </p>
                      <p className:"text-xs text-gray-600 truncate">
                        {userSection.email}
                      </p>
                    </div>
                  </div>
                )

                {/* 搜索框 */}
                {filteredItems !== items && (}
                  <div className:"luckymart-spacing-md relative">
                    <input
                      type:"text"
                      placeholder:"搜索菜单..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 pr-4 luckymart-text-sm luckymart-border border-gray-300 luckymart-rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <svg className:"absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )
              </div>
            )

            {/* 菜单内容 */}
            <div className:"flex-1 overflow-y-auto py-2">
              <AnimatePresence>
                {filteredItems.length > 0 ? (}
                  filteredItems.map(item :> renderMenuItem(item))
                ) : (
                  <div className:"px-4 py-8 luckymart-text-center luckymart-text-secondary">
                    <svg className:"w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>未找到匹配的项目</p>
                  </div>
                )
              </AnimatePresence>
            </div>

            {/* 底部操作区 */}
            <div className:"luckymart-padding-md border-t luckymart-border-light">
              <div className:"luckymart-spacing-sm">
                {/* 语言切换 */}
                <TouchFeedback type:"ripple">
                  <div className="luckymart-layout-flex luckymart-layout-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 luckymart-rounded-lg cursor-pointer transition-colors">
                    <svg className:"luckymart-size-sm luckymart-size-sm luckymart-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className:"luckymart-text-sm luckymart-font-medium">语言 / Забон / Language</span>
                  </div>
                </TouchFeedback>

                {/* 设置 */}
                <Link href:"/settings">
                  <TouchFeedback type:"ripple">
                    <div className="luckymart-layout-flex luckymart-layout-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 luckymart-rounded-lg cursor-pointer transition-colors">
                      <svg className:"luckymart-size-sm luckymart-size-sm luckymart-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className:"luckymart-text-sm luckymart-font-medium">设置</span>
                    </div>
                  </TouchFeedback>
                </Link>

                {/* 退出登录 */}
                <TouchFeedback type:"ripple">
                  <div className="luckymart-layout-flex luckymart-layout-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 luckymart-rounded-lg cursor-pointer transition-colors">
                    <svg className:"luckymart-size-sm luckymart-size-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className:"luckymart-text-sm luckymart-font-medium">退出登录</span>
                  </div>
                </TouchFeedback>
              </div>
            </div>
          </motion.div>
        </>
      )
    </AnimatePresence>
  );
};

export default MobileDrawer;

// 预设的菜单配置
export const createDefaultDrawerItems = (t: any): DrawerItem[] => [;
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
    id: 'marketplace',
    label: '商城',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    children: [
      {}
        id: 'resale',
        label: t('nav.resale') || '转售',
        href: '/resale',
        icon: (
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {}
        id: 'products',
        label: '商品管理',
        href: '/products',
        icon: (
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        ),
      },
    ],
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
    children: [
      {}
        id: 'transactions',
        label: t('nav.transactions') || '交易记录',
        href: '/transactions',
      },
      {}
        id: 'withdraw',
        label: t('nav.withdraw') || '提现',
        href: '/withdraw',
      },
    ],
  },
  {}
    id: 'referral',
    label: t('nav.referral') || '推荐',
    href: '/referral',
    badge: 5,
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {}
    id: 'lottery',
    label: '抽奖',
    href: '/lottery',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
      </svg>
    ),
    children: [
      {}
        id: 'lottery-records',
        label: '抽奖记录',
        href: '/lottery/records',
      },
    ],
  },
  {}
    id: 'checkin',
    label: '签到',
    href: '/checkin',
    icon: (
      <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];
