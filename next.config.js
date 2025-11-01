/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用检查
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // 性能优化
  compress: true,
  
  // 代码分割优化
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // 优化打包大小
    workerThreads: true,
    cpus: Math.max(1, require('os').cpus().length - 1),
    // 路由级别的代码分割
    optimizePackageImports: [
      '@/components/ui',
      '@/components/admin',
      '@/components/lazy',
      '@/utils',
      '@/lib'
    ]
  },
  
  // Webpack 配置优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 代码分割分析
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
    
    // 动态导入优化
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      
      // React相关库单独打包
      react: {
        name: 'react',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
        priority: 50,
        enforce: true
      },
      
      // UI组件库单独打包
      ui: {
        name: 'ui-components',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](@radix-ui|tailwindcss|clsx|class-variance-authority)[\\/]/,
        priority: 40,
        enforce: true
      },
      
      // 管理组件单独打包
      admin: {
        name: 'admin-components',
        chunks: 'all',
        test: /[\\/]components[\\/]admin[\\/]/,
        priority: 30,
        enforce: true,
        filename: 'admin-[contenthash].js'
      },
      
      // 业务组件单独打包
      business: {
        name: 'business-components',
        chunks: 'all',
        test: /[\\/]components[\\/](lottery|wallet|order|transaction)[\\/]/,
        priority: 25,
        enforce: true,
        filename: 'business-[contenthash].js'
      },
      
      // 懒加载组件单独打包
      lazy: {
        name: 'lazy-components',
        chunks: 'all',
        test: /[\\/]components[\\/]lazy[\\/]/,
        priority: 20,
        enforce: true,
        filename: 'lazy-[contenthash].js'
      },
      
      // 工具函数单独打包
      utils: {
        name: 'utils',
        chunks: 'all',
        test: /[\\/]utils[\\/]/,
        priority: 15,
        enforce: true,
        filename: 'utils-[contenthash].js'
      },
      
      // 图书馆函数单独打包
      lib: {
        name: 'lib',
        chunks: 'all',
        test: /[\\/]lib[\\/]/,
        priority: 10,
        enforce: true,
        filename: 'lib-[contenthash].js'
      },
      
      // 默认缓存组
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true
      }
    };
    
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
  
  // 启用 SWC 编译
  swcMinify: true,
  
  // 生产环境优化
  productionBrowserSourceMaps: false,
  
  // 缓存和CDN优化
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // 缓存和安全头
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
