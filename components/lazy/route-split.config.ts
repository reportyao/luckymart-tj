// 路由代码分割配置
export interface RouteSplitConfig {
  // 路由名称
  name: string;
  // 路由路径
  path: string;
  // 动态导入函数
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  // 优先级（影响预加载策略）
  priority: 'critical' | 'high' | 'medium' | 'low';
  // 组件大小（用于决定是否需要分割）
  size: 'small' | 'medium' | 'large' | 'xlarge';
  // 预加载策略
  preloadStrategy: 'immediate' | 'on-hover' | 'on-click' | 'idle' | 'never';
  // 是否启用SSR
  ssr: boolean;
  // 加载超时时间（毫秒）
  timeout?: number;
}

// 核心业务页面 - 关键路径，立即加载
export const CRITICAL_ROUTES: RouteSplitConfig[] = [;
  {
    name: '首页',
    path: '/',
    loader: () => import('@/app/page'),
    priority: 'critical',
    size: 'medium',
    preloadStrategy: 'immediate',
    ssr: true
  },
  {
    name: '抽奖记录',
    path: '/lottery/records',
    loader: () => import('@/app/lottery/records/page'),
    priority: 'critical',
    size: 'large',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '钱包页面',
    path: '/wallet',
    loader: () => import('@/app/wallet/page'),
    priority: 'critical',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
}
];

// 管理后台路由 - 延迟加载
export const ADMIN_ROUTES: RouteSplitConfig[] = [;
  {
    name: '管理员登录',
    path: '/admin',
    loader: () => import('@/app/admin/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '管理仪表盘',
    path: '/admin/dashboard',
    loader: () => import('@/app/admin/dashboard/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '用户管理',
    path: '/admin/users',
    loader: () => import('@/app/admin/users/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '商品管理',
    path: '/admin/products',
    loader: () => import('@/app/admin/products/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '订单管理',
    path: '/admin/orders',
    loader: () => import('@/app/admin/orders/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '用户分析',
    path: '/admin/user-analytics',
    loader: () => import('@/app/admin/user-analytics/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '产品分析',
    path: '/admin/product-analytics',
    loader: () => import('@/app/admin/product-analytics/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '数据分析',
    path: '/admin/analytics',
    loader: () => import('@/app/admin/analytics/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '财务仪表盘',
    path: '/admin/financial-dashboard',
    loader: () => import('@/app/admin/financial-dashboard/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '成本监控',
    path: '/admin/cost-monitoring',
    loader: () => import('@/app/admin/cost-monitoring/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '增长中心',
    path: '/admin/growth-center',
    loader: () => import('@/app/admin/growth-center/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '商业智能',
    path: '/admin/commerce',
    loader: () => import('@/app/admin/commerce/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '组织管理',
    path: '/admin/organization',
    loader: () => import('@/app/admin/organization/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '邀请管理',
    path: '/admin/invitations',
    loader: () => import('@/app/admin/invitations/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '开奖管理',
    path: '/admin/lottery',
    loader: () => import('@/app/admin/lottery/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '提现审核',
    path: '/admin/withdrawals',
    loader: () => import('@/app/admin/withdrawals/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '展示管理',
    path: '/admin/show-off',
    loader: () => import('@/app/admin/show-off/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: 'Telegram Bot管理',
    path: '/admin/telegram-bot',
    loader: () => import('@/app/admin/telegram-bot/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '系统设置',
    path: '/admin/settings',
    loader: () => import('@/app/admin/settings/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '高级设置',
    path: '/admin/system-settings',
    loader: () => import('@/app/admin/system-settings/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '风险控制面板',
    path: '/admin/risk-control',
    loader: () => import('@/app/admin/risk-control/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '风险仪表盘',
    path: '/admin/risk-dashboard',
    loader: () => import('@/app/admin/risk-dashboard/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '风险事件',
    path: '/admin/risk-events',
    loader: () => import('@/app/admin/risk-events/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '风险用户',
    path: '/admin/risk-users',
    loader: () => import('@/app/admin/risk-users/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '风险规则',
    path: '/admin/risk-rules',
    loader: () => import('@/app/admin/risk-rules/page'),
    priority: 'low',
    size: 'large',
    preloadStrategy: 'idle',
    ssr: false
}
];

// 复杂业务功能页面 - 高优先级，但按需加载
export const BUSINESS_ROUTES: RouteSplitConfig[] = [;
  {
    name: '订单页面',
    path: '/orders',
    loader: () => import('@/app/orders/page'),
    priority: 'high',
    size: 'large',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '交易记录',
    path: '/transactions',
    loader: () => import('@/app/transactions/page'),
    priority: 'high',
    size: 'large',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '邀请页面',
    path: '/invitation',
    loader: () => import('@/app/invitation/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '转售页面',
    path: '/resale',
    loader: () => import('@/app/resale/page'),
    priority: 'high',
    size: 'large',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '奖励页面',
    path: '/rewards',
    loader: () => import('@/app/rewards/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '充值页面',
    path: '/recharge',
    loader: () => import('@/app/recharge/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '设置页面',
    path: '/settings',
    loader: () => import('@/app/settings/page'),
    priority: 'medium',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '个人资料',
    path: '/profile',
    loader: () => import('@/app/profile/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '地址管理',
    path: '/addresses',
    loader: () => import('@/app/addresses/page'),
    priority: 'medium',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '展示页面',
    path: '/show-off',
    loader: () => import('@/app/show-off/page'),
    priority: 'medium',
    size: 'large',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '转账页面',
    path: '/wallet/transfer',
    loader: () => import('@/app/wallet/transfer/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-hover',
    ssr: false
}
];

// 大型仪表板组件
export const DASHBOARD_COMPONENTS: RouteSplitConfig[] = [;
  {
    name: '演示仪表盘',
    path: '/admin/dashboard-demo',
    loader: () => import('@/app/admin/dashboard-demo/page'),
    priority: 'low',
    size: 'xlarge',
    preloadStrategy: 'never',
    ssr: false
}
];

// 工具和演示页面 - 低优先级
export const UTILITY_ROUTES: RouteSplitConfig[] = [;
  {
    name: '签到页面',
    path: '/checkin',
    loader: () => import('@/app/checkin/page'),
    priority: 'medium',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '支付指南',
    path: '/payment-guide',
    loader: () => import('@/app/payment-guide/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '性能测试',
    path: '/performance',
    loader: () => import('@/app/performance/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '手势示例',
    path: '/gesture-example',
    loader: () => import('@/app/gesture-example/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '移动端演示',
    path: '/mobile-demo',
    loader: () => import('@/app/mobile-demo/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '多语言测试',
    path: '/multilingual-test',
    loader: () => import('@/app/multilingual-test/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '离线页面',
    path: '/offline',
    loader: () => import('@/app/offline/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: 'PWA设置',
    path: '/pwa-settings',
    loader: () => import('@/app/pwa-settings/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '国际化演示',
    path: '/i18n-demo',
    loader: () => import('@/app/i18n-demo/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: 'Telegram演示',
    path: '/telegram-demo',
    loader: () => import('@/app/telegram-demo/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '钱包卡片测试',
    path: '/wallet-card-test',
    loader: () => import('@/app/wallet-card-test/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '钱包卡片简单测试',
    path: '/wallet-card-test-simple',
    loader: () => import('@/app/wallet-card-test-simple/page'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
  },
  {
    name: '交易列表演示',
    path: '/transactions/transaction-list-demo',
    loader: () => import('@/app/transactions/transaction-list-demo'),
    priority: 'low',
    size: 'small',
    preloadStrategy: 'never',
    ssr: false
}
];

// 产品相关路由
export const PRODUCT_ROUTES: RouteSplitConfig[] = [;
  {
    name: '产品详情',
    path: '/product/[id]',
    loader: () => import('@/app/product/[id]/page'),
    priority: 'high',
    size: 'large',
    preloadStrategy: 'on-hover',
    ssr: false
  },
  {
    name: '转售创建',
    path: '/resale/create',
    loader: () => import('@/app/resale/create/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '转售状态',
    path: '/resale/status/[id]',
    loader: () => import('@/app/resale/status/[id]/page'),
    priority: 'high',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '商品创建',
    path: '/admin/products/create',
    loader: () => import('@/app/admin/products/create/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
  },
  {
    name: '商品编辑',
    path: '/admin/products/[id]/edit',
    loader: () => import('@/app/admin/products/[id]/edit/page'),
    priority: 'low',
    size: 'medium',
    preloadStrategy: 'idle',
    ssr: false
}
];

// 展示相关路由
export const SHOWOFF_ROUTES: RouteSplitConfig[] = [;
  {
    name: '展示详情',
    path: '/show-off/[id]',
    loader: () => import('@/app/show-off/[id]/page'),
    priority: 'medium',
    size: 'large',
    preloadStrategy: 'on-click',
    ssr: false
  },
  {
    name: '创建展示',
    path: '/show-off/create',
    loader: () => import('@/app/show-off/create/page'),
    priority: 'medium',
    size: 'medium',
    preloadStrategy: 'on-click',
    ssr: false
}
];

// 全部路由配置
export const ALL_ROUTE_CONFIGS: RouteSplitConfig[] = [;
  ...CRITICAL_ROUTES,
  ...ADMIN_ROUTES,
  ...BUSINESS_ROUTES,
  ...DASHBOARD_COMPONENTS,
  ...UTILITY_ROUTES,
  ...PRODUCT_ROUTES,
  ...SHOWOFF_ROUTES
];

// 按优先级分组的路由
export const ROUTES_BY_PRIORITY = {
  critical: CRITICAL_ROUTES,
  high: BUSINESS_ROUTES.filter(route => route.priority === 'high'),
  medium: [
    ...BUSINESS_ROUTES.filter(route => route.priority === 'medium'),
    ...UTILITY_ROUTES.filter(route :> route.priority === 'medium')
  ],
  low: [
    ...ADMIN_ROUTES,
    ...UTILITY_ROUTES.filter(route => route.priority === 'low'),
    ...DASHBOARD_COMPONENTS
  ]
};

// 按大小分组的路由
export const ROUTES_BY_SIZE = {
  small: ALL_ROUTE_CONFIGS.filter(route => route.size === 'small'),
  medium: ALL_ROUTE_CONFIGS.filter(route => route.size === 'medium'),
  large: ALL_ROUTE_CONFIGS.filter(route => route.size === 'large'),
  xlarge: ALL_ROUTE_CONFIGS.filter(route => route.size === 'xlarge')
};

// 按预加载策略分组的路由
export const ROUTES_BY_PRELOAD = {
  immediate: ALL_ROUTE_CONFIGS.filter(route => route.preloadStrategy === 'immediate'),
  'on-hover': ALL_ROUTE_CONFIGS.filter(route => route.preloadStrategy === 'on-hover'),
  'on-click': ALL_ROUTE_CONFIGS.filter(route => route.preloadStrategy === 'on-click'),
  idle: ALL_ROUTE_CONFIGS.filter(route => route.preloadStrategy === 'idle'),
  never: ALL_ROUTE_CONFIGS.filter(route => route.preloadStrategy === 'never')
};

// 路由统计信息
export const getRouteStats = () => ({
  totalRoutes: ALL_ROUTE_CONFIGS.length,
  byPriority: {
    critical: CRITICAL_ROUTES.length,
    high: BUSINESS_ROUTES.filter(r => r.priority === 'high').length,
    medium: [...BUSINESS_ROUTES, ...UTILITY_ROUTES].filter(r => r.priority === 'medium').length,
    low: [...ADMIN_ROUTES, ...UTILITY_ROUTES.filter(r => r.priority === 'low'), ...DASHBOARD_COMPONENTS].length
  },
  bySize: {
    small: ALL_ROUTE_CONFIGS.filter(r => r.size === 'small').length,
    medium: ALL_ROUTE_CONFIGS.filter(r => r.size === 'medium').length,
    large: ALL_ROUTE_CONFIGS.filter(r => r.size === 'large').length,
    xlarge: ALL_ROUTE_CONFIGS.filter(r => r.size === 'xlarge').length
  },
  byPreloadStrategy: {
    immediate: ROUTES_BY_PRELOAD.immediate.length,
    'on-hover': ROUTES_BY_PRELOAD['on-hover'].length,
    'on-click': ROUTES_BY_PRELOAD['on-click'].length,
    idle: ROUTES_BY_PRELOAD.idle.length,
    never: ROUTES_BY_PRELOAD.never.length
}
});