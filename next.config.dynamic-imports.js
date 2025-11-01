/**
 * LuckyMart-TJ Next.js 配置 - 动态导入优化版
 * 专门针对大型组件和第三方库的动态导入优化
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基础配置
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // 性能优化
  compress: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    workerThreads: true,
    cpus: Math.max(1, require('os').cpus().length - 1),
    
    // 优化包导入 - 动态导入优化
    optimizePackageImports: [
      '@/components/ui',
      '@/components/admin', 
      '@/components/lazy',
      '@/components/dynamic', // 新增动态组件目录
      '@/utils',
      '@/lib',
      'recharts',
      'framer-motion'
    ],
    
    // 优化依赖
    optimizeDependencies: {
      exclude: ['@prisma/client', '@supabase/supabase-js']
    }
  },
  
  // Webpack 优化配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    
    // Bundle 分析器
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerHost: '127.0.0.1',
          analyzerPort: 8888,
          reportFilename: process.env.ANALYZE_OUTPUT || 'bundle-report.html',
          defaultSizes: 'gzip',
          openAnalyzer: false,
          statsFilename: 'stats.json'
        })
      );
    }

    // 代码分割配置 - 动态导入优化
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      
      // React 相关库
      react: {
        name: 'react',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        priority: 60,
        enforce: true
      },

      // Next.js 核心
      nextjs: {
        name: 'nextjs',
        chunks: 'all', 
        test: /[\\/]node_modules[\\/](next)[\\/]/,
        priority: 55,
        enforce: true
      },

      // 图表库 - 动态导入优化
      charts: {
        name: 'charts',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](recharts|d3|chart\.js|chartjs-adapter-date-fns)[\\/]/,
        priority: 50,
        enforce: true,
        filename: 'charts-[contenthash].js'
      },

      // 动画库 - 动态导入优化  
      animations: {
        name: 'animations',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](framer-motion|lottie-web|@react-spring)[\\/]/,
        priority: 45,
        enforce: true,
        filename: 'animations-[contenthash].js'
      },

      // UI 组件库
      ui: {
        name: 'ui-components',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](@radix-ui|tailwindcss|clsx|class-variance-authority)[\\/]/,
        priority: 40,
        enforce: true
      },

      // 数据库相关库 - 服务端隔离
      database: {
        name: 'database',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](@prisma\/client|@supabase\/supabase-js|ioredis|bcryptjs)[\\/]/,
        priority: 35,
        enforce: true,
        filename: 'database-[contenthash].js'
      },

      // Telegram Bot 库 - 后台任务隔离
      telegram: {
        name: 'telegram',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](telegraf|node-telegram-bot-api)[\\/]/,
        priority: 30,
        enforce: true,
        filename: 'telegram-[contenthash].js'
      },

      // 文件处理库 - 按需加载
      fileProcessing: {
        name: 'file-processing',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](papaparse|xlsx|qrcode|multer)[\\/]/,
        priority: 25,
        enforce: true,
        filename: 'file-processing-[contenthash].js'
      },

      // 管理组件 - 懒加载
      admin: {
        name: 'admin-components',
        chunks: 'all',
        test: /[\\/]components[\\/]admin[\\/]/,
        priority: 20,
        enforce: true,
        filename: 'admin-[contenthash].js'
      },

      // 动态组件 - 智能加载
      dynamic: {
        name: 'dynamic-components',
        chunks: 'all',
        test: /[\\/]components[\\/]dynamic[\\/]/,
        priority: 18,
        enforce: true,
        filename: 'dynamic-[contenthash].js'
      },

      // 懒加载组件
      lazy: {
        name: 'lazy-components',
        chunks: 'all',
        test: /[\\/]components[\\/]lazy[\\/]/,
        priority: 15,
        enforce: true,
        filename: 'lazy-[contenthash].js'
      },

      // 业务组件
      business: {
        name: 'business-components',
        chunks: 'all',
        test: /[\\/]components[\\/](lottery|wallet|order|transaction|product)[\\/]/,
        priority: 12,
        enforce: true,
        filename: 'business-[contenthash].js'
      },

      // 工具函数
      utils: {
        name: 'utils',
        chunks: 'all',
        test: /[\\/]utils[\\/]/,
        priority: 10,
        enforce: true,
        filename: 'utils-[contenthash].js'
      },

      // 库函数
      lib: {
        name: 'lib',
        chunks: 'all',
        test: /[\\/]lib[\\/]/,
        priority: 8,
        enforce: true,
        filename: 'lib-[contenthash].js'
      },

      // 国际化库
      i18n: {
        name: 'i18n',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/,
        priority: 25,
        enforce: true,
        filename: 'i18n-[contenthash].js'
      },

      // 默认缓存组
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true
      }
    };

    // 动态导入优化
    config.module.rules.push({
      test: /\.(tsx?|jsx?)$/,
      sideEffects: false,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            // 动态导入优化插件
            ...(process.env.NODE_ENV :== 'production' ? [
              ['dynamic-import-webpack', {
                // 动态导入配置
                chunkName: (param) => {
                  // 根据导入路径生成chunk名称
                  if (param.moduleId.includes('charts')) return 'charts-chunk'; {
                  if (param.moduleId.includes('animations')) return 'animations-chunk'; {
                  if (param.moduleId.includes('admin')) return 'admin-chunk'; {
                  return 'default-chunk';
                }
              }]
            ] : [])
          ].filter(Boolean)
        }
      }
    });

    // 性能监控
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUNDLE_ANALYZE': JSON.stringify(true)
        })
      );
    }

    return config;
  },

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },

  // 按需条目
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // 安全和缓存头
  async headers() {
    return [;
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 缓存优化头
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },

  // 重写规则 - 优化动态导入
  async rewrites() {
    return [;
      {
        source: '/dashboard',
        destination: '/admin/financial-dashboard',
      },
      {
        source: '/analytics',
        destination: '/admin/analytics',
      },
    ];
  },

  // 重定向规则
  async redirects() {
    return [;
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

// 导出配置
module.exports = nextConfig;
}}}