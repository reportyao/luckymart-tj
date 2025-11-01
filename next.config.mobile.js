/**
 * 移动端专用Next.js配置文件
 * 针对移动设备优化的Bundle大小、加载性能和用户体验
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const mobileOptimizedConfig = {
  // 生产环境优化
  ...(isDevelopment ? {} : {
    // 生产环境压缩
    compress: true,
    poweredByHeader: false,
    
    // 图片优化
    images: {
      domains: ['localhost', 'luckymart-tj.vercel.app'],
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 31536000, // 1年缓存
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
  }),

  // 实验性功能 (适合移动端优化)
  experimental: {
    // 启用优化器
    optimizeCss: true,
    
    // 启用esm模式打包
    esmExternals: true,
    
    // 懒加载优化
    lazyRoot: null,
    
    // 服务端组件优化
    serverComponentsExternalPackages: [
      '@prisma/client',
      '@supabase/supabase-js'
    ],
  },

  // Webpack优化配置
  webpack: (config: any, { dev, isServer, defaultLoaders, webpack }: any) => {
    // 基础配置
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: defaultLoaders.babel
    });

    // 开发环境特定配置
    if (dev) {
      config.devtool = 'eval-source-map';
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      };
    }

    // 生产环境优化
    if (!dev) {
      // 启用Tree Shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // 基础库chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true
          },
          
          // React相关库
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true
          },
          
          // Next.js相关
          next: {
            test: /[\\/]node_modules[\\/]next[\\/]/,
            name: 'next',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true
          },
          
          // Admin相关 (低优先级)
          admin: {
            test: /[\\/]app[\\/]admin[\\/]/,
            name: 'admin',
            chunks: 'all',
            priority: 1,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Bot相关 (低优先级)
          bot: {
            test: /[\\/]bot[\\/]/,
            name: 'bot',
            chunks: 'all',
            priority: 1,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // 图表库 (独立chunk)
          charts: {
            test: /[\\/]node_modules[\\/](recharts|chart\.js|d3)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          },
          
          // 多语言相关
          i18n: {
            test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
            name: 'i18n',
            chunks: 'all',
            priority: 8,
            reuseExistingChunk: true
          }
        }
      };

      // Bundle分析器
      if (process.env.ANALYZE === 'true') {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-report.html'
          })
        );
      }

      // 移除未使用的CSS
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUNDLE_ANALYZE': JSON.stringify(process.env.BUNDLE_ANALYZE === 'true')
        })
      );
    }

    // 移动端特定优化
    if (!dev) {
      // 启用预取
      config.experiments = {
        ...config.experiments,
        topLevelAwait: true
      };

      // 资源压缩
      config.module.rules.push({
        test: /\.(js|css)$/,
        use: [
          {
            loader: 'terser-webpack-plugin',
            options: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug']
              }
            }
          }
        ]
      });
    }

    return config;
  },

  // PWA支持
  async headers() {
    return [;
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=300, stale-while-revalidate=600'
          }
        ]
      }
    ];
  },

  // 重定向配置 (移动端友好)
  async redirects() {
    return [;
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false
      },
      {
        source: '/dashboard',
        destination: '/admin/dashboard',
        permanent: false
      }
    ];
  },

  // 中间件配置
  async rewrites() {
    return [;
      {
        source: '/api/mobile/:path*',
        destination: '/api/:path*'
      }
    ];
  },

  // 输出优化
  output: 'standalone', // 更好的性能和更小的部署包

  // 页面扩展名
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // 静态文件配置
  assetPrefix: process.env.ASSET_PREFIX || '',

  // 性能配置
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2
  }
};

// 移动端特定的环境变量配置
const getMobileConfig = () => {
  const baseConfig = { ...mobileOptimizedConfig };
  
  // 生产环境移动端优化
  if (process.env.NODE_ENV === 'production') {
    // 启用所有移动端优化
    baseConfig.experimental = {
      ...baseConfig.experimental,
      optimizeCss: true,
      optimizePackageImports: ['@supabase/supabase-js', '@prisma/client']
    };
    
    // 最小化配置
    baseConfig.compiler = {
      removeConsole: {
        exclude: ['error', 'warn']
      }
    };
  }
  
  // 开发环境移动端优化
  if (process.env.NODE_ENV === 'development') {
    // 启用快速刷新和调试
    baseConfig.experimental = {
      ...baseConfig.experimental,
      forceSwcTransforms: true
    };
  }
  
  return baseConfig;
};

// 性能监控和报告配置
const performanceConfig = {
  // Bundle大小警告阈值
  bundleSizeLimits: {
    initial: 250 * 1024, // 250KB
    total: 1024 * 1024,  // 1MB
    chunk: 500 * 1024    // 500KB per chunk
  },
  
  // 性能预算
  performanceBudgets: {
    // 首屏加载时间
    firstContentfulPaint: 1.8, // 1.8秒
    largestContentfulPaint: 2.5, // 2.5秒
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // 100ms
    timeToInteractive: 3.8 // 3.8秒
  },
  
  // 移动端特定优化
  mobileOptimizations: {
    // 启用Service Worker
    serviceWorker: true,
    
    // 预取关键资源
    preloadFonts: true,
    preloadCriticalCss: true,
    
    // 延迟加载非关键资源
    lazyLoadImages: true,
    lazyLoadComponents: true,
    
    // 压缩优化
    compressImages: true,
    compressAssets: true,
    
    // 缓存策略
    longTermCaching: true,
    cacheApiResponses: true
  }
};

// 导出配置
export default getMobileConfig();

// 导出性能配置供其他模块使用
export { performanceConfig };

// 类型定义
export interface MobileOptimizationConfig {
  bundleSizeLimits: {
    initial: number;
    total: number;
    chunk: number;
  };
  performanceBudgets: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
  };
  mobileOptimizations: {
    serviceWorker: boolean;
    preloadFonts: boolean;
    preloadCriticalCss: boolean;
    lazyLoadImages: boolean;
    lazyLoadComponents: boolean;
    compressImages: boolean;
    compressAssets: boolean;
    longTermCaching: boolean;
    cacheApiResponses: boolean;
  };
}