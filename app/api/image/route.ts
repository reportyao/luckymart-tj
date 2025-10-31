import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 图片优化参数验证
const ImageOptimizationSchema = z.object({
  src: z.string(),
  width: z.number().min(1).max(4000).optional(),
  height: z.number().min(1).max(4000).optional(),
  quality: z.number().min(1).max(100).default(75),
  format: z.enum(['auto', 'webp', 'avif', 'jpeg', 'png']).default('auto'),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
  position: z.string().default('center'),
  background: z.string().optional(),
  dpr: z.number().min(1).max(3).default(1),
});

// GET /api/image/optimize - 图片优化端点
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const imageParams = ImageOptimizationSchema.parse({
      src: searchParams.get('src'),
      width: searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined,
      height: searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined,
      quality: searchParams.get('quality') ? parseInt(searchParams.get('quality')!) : 75,
      format: searchParams.get('format') || 'auto',
      fit: searchParams.get('fit') || 'cover',
      position: searchParams.get('position') || 'center',
      background: searchParams.get('background') || undefined,
      dpr: searchParams.get('dpr') ? parseInt(searchParams.get('dpr')!) : 1,
    });

    // 生成优化后的图片URL
    const optimizedUrl = generateOptimizedImageUrl(imageParams);
    
    // 返回重定向到优化后的图片
    return NextResponse.redirect(optimizedUrl);

  } catch (error) {
    console.error('Image optimization error:', error);
    
    return NextResponse.json({
      success: false,
      error: '图片优化失败',
      details: error instanceof z.ZodError ? error.errors : undefined
    }, { status: 400 });
  }
}

// 生成优化图片URL
function generateOptimizedImageUrl(params: z.infer<typeof ImageOptimizationSchema>): string {
  const { src, width, height, quality, format, fit, position, background, dpr } = params;
  
  // 解析原始URL
  const url = new URL(src, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  
  // 添加图片处理参数
  const searchParams = url.searchParams;
  
  if (width) searchParams.set('w', width.toString());
  if (height) searchParams.set('h', height.toString());
  searchParams.set('q', quality.toString());
  searchParams.set('fm', format);
  searchParams.set('fit', fit);
  searchParams.set('pos', position);
  if (background) searchParams.set('bg', background);
  if (dpr > 1) searchParams.set('dpr', dpr.toString());
  
  return url.toString();
}

// POST /api/image/analyze - 图片分析端点
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'analyze') {
      return analyzeImage(body);
    }
    
    if (action === 'bulk-optimize') {
      return bulkOptimizeImages(body);
    }
    
    if (action === 'generate-srcset') {
      return generateSrcSet(body);
    }

    return NextResponse.json({
      success: false,
      error: '不支持的操作'
    }, { status: 400 });

  } catch (error) {
    console.error('Image analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: '图片分析失败',
      details: error instanceof z.ZodError ? error.errors : undefined
    }, { status: 400 });
  }
}

// 分析图片
async function analyzeImage(data: {
  src: string;
  analyzeType?: 'basic' | 'detailed';
}) {
  const { src, analyzeType = 'basic' } = data;
  
  // 模拟图片分析结果
  const analysis = {
    src,
    originalSize: getFileSize(src),
    dimensions: await getImageDimensions(src),
    format: getImageFormat(src),
    colorSpace: 'sRGB',
    compressionRatio: 0.75,
    optimizationSuggestions: generateOptimizationSuggestions(src),
    ...(analyzeType === 'detailed' && {
      histogram: generateColorHistogram(),
      quality: assessImageQuality(src),
      accessibility: assessAccessibility(src)
    })
  };

  return NextResponse.json({
    success: true,
    data: analysis
  });
}

// 批量优化图片
async function bulkOptimizeImages(data: {
  images: Array<{
    src: string;
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }>;
  outputFormat?: 'webp' | 'avif';
}) {
  const { images, outputFormat = 'webp' } = data;
  
  const optimizedImages = images.map(image => ({
    original: image.src,
    optimized: generateOptimizedImageUrl({
      src: image.src,
      width: image.width,
      height: image.height,
      quality: image.quality || 75,
      format: outputFormat,
      fit: 'cover',
      position: 'center',
      dpr: 1
    }),
    estimatedSizeReduction: calculateSizeReduction(image.src, outputFormat),
    quality: image.quality || 75
  }));

  return NextResponse.json({
    success: true,
    data: {
      totalImages: images.length,
      optimizedImages,
      totalSizeReduction: optimizedImages.reduce((sum, img) => sum + img.estimatedSizeReduction, 0)
    }
  });
}

// 生成响应式图片srcset
async function generateSrcSet(data: {
  src: string;
  sizes?: number[];
  formats?: string[];
  quality?: number;
}) {
  const { src, sizes = [320, 640, 768, 1024, 1280, 1536], formats = ['webp', 'avif'], quality = 75 } = data;
  
  const srcSet: Record<string, string> = {};
  
  formats.forEach(format => {
    const urlSet = sizes.map(size => {
      const url = generateOptimizedImageUrl({
        src,
        width: size,
        quality,
        format,
        fit: 'cover',
        position: 'center',
        dpr: 1
      });
      return `${url} ${size}w`;
    }).join(', ');
    
    srcSet[format] = urlSet;
  });

  // 添加默认URL
  const defaultUrl = generateOptimizedImageUrl({
    src,
    width: sizes[0],
    quality,
    format: 'auto',
    fit: 'cover',
    position: 'center',
    dpr: 1
  });

  return NextResponse.json({
    success: true,
    data: {
      default: defaultUrl,
      srcSet,
      sizes: sizes.join(', '),
      recommendedSizes: {
        mobile: '320px, 640px',
        tablet: '768px, 1024px',
        desktop: '1280px, 1536px'
      }
    }
  });
}

// 辅助函数
function getFileSize(src: string): number {
  // 模拟文件大小，实际中应该从图片元数据获取
  return Math.floor(Math.random() * 500000) + 100000; // 100KB - 600KB
}

async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  // 模拟图片尺寸，实际中应该从图片元数据获取
  return {
    width: Math.floor(Math.random() * 2000) + 500,
    height: Math.floor(Math.random() * 2000) + 500
  };
}

function getImageFormat(src: string): string {
  const extension = src.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
}

function generateOptimizationSuggestions(src: string): string[] {
  const suggestions: string[] = [];
  
  const format = getImageFormat(src);
  if (['jpg', 'jpeg'].includes(format)) {
    suggestions.push('建议转换为WebP格式以减少文件大小');
    suggestions.push('可以进一步压缩图片质量');
  }
  
  if (getFileSize(src) > 200000) {
    suggestions.push('图片文件较大，建议压缩或使用CDN');
    suggestions.push('考虑使用响应式图片');
  }
  
  suggestions.push('启用懒加载以提升页面性能');
  suggestions.push('添加适当的alt文本以提升可访问性');
  
  return suggestions;
}

function generateColorHistogram(): number[] {
  // 模拟颜色直方图数据
  return Array.from({ length: 256 }, () => Math.floor(Math.random() * 1000));
}

function assessImageQuality(src: string): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const score = Math.floor(Math.random() * 30) + 70; // 70-100分
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (score < 80) {
    issues.push('图片压缩过度，可能影响质量');
    recommendations.push('适当提高压缩质量');
  }
  
  if (getFileSize(src) > 300000) {
    issues.push('文件大小偏大');
    recommendations.push('优化文件大小');
  }
  
  return { score, issues, recommendations };
}

function assessAccessibility(src: string): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const score = Math.floor(Math.random() * 20) + 80; // 80-100分
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  issues.push('建议添加alt文本描述');
  recommendations.push('添加有意义的alt文本');
  recommendations.push('考虑图片的对比度');
  
  return { score, issues, recommendations };
}

function calculateSizeReduction(src: string, outputFormat: string): number {
  const originalSize = getFileSize(src);
  const reductionRates: Record<string, number> = {
    'webp': 0.25,
    'avif': 0.35,
    'jpeg': 0.15
  };
  
  return Math.floor(originalSize * (reductionRates[outputFormat] || 0.2));
}