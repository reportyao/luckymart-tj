import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  threshold?: number;
  rootMargin?: string;
  aspectRatio?: string | number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export interface ImageSrcSet {
  webp?: string;
  avif?: string;
  jpeg?: string;
  png?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  blurDataURL,
  threshold = 0.1,
  rootMargin = '50px',
  aspectRatio,
  sizes,
  quality = 75,
  priority = false,
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 生成响应式图片URL
  const generateSrcSet = useCallback((baseSrc: string, imageSet?: ImageSrcSet) => {
    if (imageSet) {
      return {
        webp: imageSet.webp,
        avif: imageSet.avif,
        jpeg: imageSet.jpeg,
        png: imageSet.png
      };
    }

    // 自动生成不同尺寸的URL
    const widths = [320, 480, 640, 768, 1024, 1280, 1536];
    const { url, query } = parseImageUrl(baseSrc);
    
    return {
      webp: generateSrcUrl(url, query, 'webp', widths),
      avif: generateSrcUrl(url, query, 'avif', widths),
      jpeg: generateSrcUrl(url, query, 'jpeg', widths)
    };
  }, []);

  const parseImageUrl = (url: string) => {
    const [baseUrl, queryString] = url.split('?');
    const query = new URLSearchParams(queryString || '');
    return { url: baseUrl, query };
  };

  const generateSrcUrl = (url: string, query: URLSearchParams, format: string, widths: number[]) => {
    return widths
      .map(width => {
        const newQuery = new URLSearchParams(query);
        newQuery.set('w', width.toString());
        newQuery.set('q', quality.toString());
        newQuery.set('fm', format);
        return `${url}?${newQuery.toString()} ${width}w`;
      })
      .join(', ');
  };

  // Intersection Observer 设置
  useEffect(() => {
    if (priority || imgRef.current === null) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, threshold, rootMargin]);

  // 图片加载处理
  useEffect(() => {
    if (!isInView || currentSrc) return;

    const img = new Image();
    const srcSet = generateSrcSet(src);

    // 检查浏览器支持
    const supportsAvif = img.canPlayType('image/avif') === 'probably';
    const supportsWebp = img.canPlayType('image/webp') === 'probably';

    let finalSrc = src;
    let finalSrcSet = '';

    if (supportsAvif && srcSet.avif) {
      finalSrcSet = srcSet.avif;
      const firstSrc = srcSet.avif.split(',')[0].split(' ')[0];
      finalSrc = firstSrc;
    } else if (supportsWebp && srcSet.webp) {
      finalSrcSet = srcSet.webp;
      const firstSrc = srcSet.webp.split(',')[0].split(' ')[0];
      finalSrc = firstSrc;
    } else if (srcSet.jpeg) {
      finalSrcSet = srcSet.jpeg;
      const firstSrc = srcSet.jpeg.split(',')[0].split(' ')[0];
      finalSrc = firstSrc;
    }

    setCurrentSrc(finalSrc);

    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    img.src = finalSrc;
    if (finalSrcSet) {
      img.srcset = finalSrcSet;
      img.sizes = sizes || '100vw';
    }
  }, [isInView, src, generateSrcSet, sizes, quality, onLoad, onError, currentSrc]);

  const aspectRatioStyle = aspectRatio ? {
    aspectRatio: typeof aspectRatio === 'number' ? aspectRatio : undefined,
    '--aspect-ratio': typeof aspectRatio === 'string' ? aspectRatio : undefined
  } as React.CSSProperties : {};

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        className
      )}
      style={aspectRatioStyle}
    >
      {/* 占位符 */}
      {!isLoaded && (
        <div className="absolute inset-0 luckymart-layout-flex luckymart-layout-center justify-center">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
              aria-hidden="true"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 luckymart-animation-pulse" />
          )}
        </div>
      )}

      {/* 实际图片 */}
      {isInView && (
        <picture>
          {generateSrcSet(currentSrc).webp && (
            <source 
              srcSet={generateSrcSet(currentSrc).webp}
              sizes={sizes || '100vw'}
              type="image/webp"
            />
          )}
          {generateSrcSet(currentSrc).avif && (
            <source 
              srcSet={generateSrcSet(currentSrc).avif}
              sizes={sizes || '100vw'}
              type="image/avif"
            />
          )}
          <img
            src={currentSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            {...props}
          />
        </picture>
      )}

      {/* 加载状态指示器 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 luckymart-layout-flex luckymart-layout-center justify-center">
          <div className="luckymart-size-lg luckymart-size-lg border-2 border-blue-500 border-t-transparent rounded-full luckymart-animation-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 luckymart-layout-flex luckymart-layout-center justify-center luckymart-bg-gray-light dark:bg-gray-800">
          <div className="luckymart-text-center luckymart-text-secondary dark:text-gray-400">
            <svg className="luckymart-size-lg luckymart-size-lg mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="luckymart-text-sm">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;