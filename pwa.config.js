module.exports = {
  // PWA配置选项
  pwa: {
    // 应用名称
    name: 'LuckyMart-TJ 乐享商城',
    shortName: 'LuckyMart',
    description: '基于Next.js的现代化电商平台，提供优质购物体验',
    
    // 主题配置
    themeColor: '#6366f1',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    
    // 范围配置
    startUrl: '/',
    scope: '/',
    
    // 图标配置
    icons: {
      // 通用图标
      any: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }
      ],
      
      // 掩码图标（用于支持maskable的设备）
      maskable: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      
      // 最小分辨率图标
      appleTouchIcon: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ],
      
      // 苹果设备配置
      apple: {
        icon: '/icons/icon-192x192.png',
        startupImage: '/icons/icon-512x512.png',
        statusBarStyle: 'default',
        backgroundColor: '#6366f1'
      }
    },
    
    // 功能配置
    features: {
      // 快捷方式
      shortcuts: [
        {
          name: '签到',
          shortName: '签到',
          description: '每日签到获得奖励',
          url: '/checkin',
          icons: [
            {
              src: '/icons/shortcut-checkin.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        {
          name: '抽奖',
          shortName: '抽奖',
          description: '参与每日抽奖',
          url: '/lottery',
          icons: [
            {
              src: '/icons/shortcut-lottery.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        {
          name: '我的邀请',
          shortName: '邀请',
          description: '邀请好友获得奖励',
          url: '/referral',
          icons: [
            {
              src: '/icons/shortcut-referral.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        {
          name: '钱包',
          shortName: '钱包',
          description: '查看余额和交易记录',
          url: '/wallet',
          icons: [
            {
              src: '/icons/shortcut-wallet.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        }
      ],
      
      // 分享目标
      shareTarget: {
        action: '/share-target/',
        method: 'GET',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      
      // 协议处理
      protocolHandlers: [
        {
          protocol: 'luckymart',
          url: '/?share=%s'
        }
      ]
    },
    
    // 缓存配置
    caching: {
      // 静态资源缓存
      static: {
        pattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
        strategy: 'cache-first'
      },
      
      // API数据缓存
      api: {
        pattern: /\/api\//,
        maxAge: 5 * 60 * 1000, // 5分钟
        strategy: 'network-first'
      },
      
      // 页面缓存
      pages: {
        pattern: /\.(html|htm)$/,
        maxAge: 60 * 60 * 1000, // 1小时
        strategy: 'network-first'
      }
    },
    
    // 离线配置
    offline: {
      // 离线页面
      page: '/offline',
      
      // 离线资源
      resources: [
        '/',
        '/offline',
        '/404',
        '/favicon.ico',
        '/manifest.json'
      ],
      
      // 离线策略
      strategies: {
        // 导航请求
        navigation: 'network-first',
        
        // API请求
        api: 'network-first',
        
        // 静态资源
        assets: 'cache-first'
      }
    },
    
    // 通知配置
    notifications: {
      // VAPID公钥（生产环境需要替换为真实的）
      vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NQD6F0jFSJj7Up5khOs8HCAHOqBZGNqn1jWiGCZbfZMUjO_gCZME4Pg',
      
      // 通知图标
      icon: '/icons/icon-192x192.png',
      
      // 通知徽章
      badge: '/icons/icon-72x72.png',
      
      // 通知选项
      options: {
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: 'luckymart-notification'
      }
    },
    
    // 开发配置
    development: {
      // 调试模式
      debug: process.env.NODE_ENV === 'development',
      
      // 更新提示
      updatePrompt: true,
      
      // 日志级别
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    }
  },
  
  // Next.js PWA配置
  workbox: {
    // 工作盒配置
    globPatterns: ['**/*.{js,css,html,png,svg,ico,jpg,jpeg,webp,json}'],
    
    // 运行时缓存
    runtimeCaching: [
      {
        // API请求缓存
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      
      {
        // 静态资源缓存
        urlPattern: /\/_next\/static\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
          }
        }
      },
      
      {
        // 图片缓存
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 7天
          }
        }
      }
    ],
    
    // 离线页面
    offlinePage: '/offline',
    
    // 离线备用页面
    fallbacks: {
      document: '/offline',
      api: '/api/offline',
      image: '/images/offline.png'
    }
  }
};