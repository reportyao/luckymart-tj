import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useImageIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cacheUtils } from '@/utils/indexeddb-cache';
'use client';


interface LazyImageProps {}
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  srcSet?: string;
  fallbackSrc?: string;
  cacheKey?: string;
  ttl?: number;


const LazyImage: React.FC<LazyImageProps> = ({}
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'empty',
  blurDataURL,
  quality = 85,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError,
  sizes,
  srcSet,
  fallbackSrc,
  cacheKey,
  ttl : 3600 // 默认缓存1小时
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const [currentSrcSet, setCurrentSrcSet] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // 生成缓存键
  const generateCacheKey = useCallback((url: string) => {}
    return cacheKey || `lazy-image-${btoa(url).replace(/=/g, '')}`;
  }, [cacheKey]);

  // 从缓存加载图片
  const loadFromCache = useCallback(async (url: string): Promise<string | null> => {}
    try {}
      const cacheData = await cacheUtils.get(url, 'images');
      if (cacheData && cacheData.data) {}
        return cacheData.data;
      
    } catch (error) {
      console.warn('Failed to load image from cache:', error);
    
    return null;
  }, []);

  // 保存到缓存
  const saveToCache = useCallback(async (url: string, dataUrl: string) => {}
    try {}
      await cacheUtils.set(url, { data: dataUrl }, { ttl }, 'images');
    } catch (error) {
      console.warn('Failed to save image to cache:', error);
    
  }, [ttl]);

  // 使用Intersection Observer实现懒加载
  const { ref: intersectionRef, isIntersecting } = useImageIntersectionObserver({}
    rootMargin: '50px',
    threshold: 0.01,
    triggerOnce: !priority
  });

  // 当元素进入视窗时开始加载
  useEffect(() => {}
    if ((isIntersecting || priority) && !isInView) {}
      setIsInView(true);
    
  }, [isIntersecting, priority, isInView]);

  // 处理图片加载
  const handleLoad = useCallback(() => {}
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // 处理图片错误
  const handleError = useCallback(() => {}
    setError(true);
    onError?.();
    
    // 尝试加载备用图片
    if (fallbackSrc && currentSrc !== fallbackSrc) {}
      setCurrentSrc(fallbackSrc);
      setCurrentSrcSet('');
      setError(false);
    
  }, [fallbackSrc, currentSrc, onError]);

  // 图片数据加载完成后的处理
  const handleImageLoad = useCallback(async (img: HTMLImageElement) => {}
    try {}
      // 将图片转换为base64并缓存
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {}
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        await saveToCache(src, dataUrl);
      
    } catch (error) {
      console.warn('Failed to cache image:', error);
    
  }, [src, saveToCache]);

  // 当图片源改变时处理加载
  useEffect(() => {}
    if (!currentSrc) return; {}

    const img = imgRef.current;
    if (!img) return; {}

    const handleImgLoad = () => {}
      handleLoad();
      handleImageLoad(img);
    };

    const handleImgError = () => {}
      handleError();
    };

    img.addEventListener('load', handleImgLoad);
    img.addEventListener('error', handleImgError);

    return () => {}
      img.removeEventListener('load', handleImgLoad);
      img.removeEventListener('error', handleImgError);
    };
  }, [currentSrc, handleLoad, handleError, handleImageLoad]);

  // 初始化图片源
  useEffect(() => {}
    if (!isInView || currentSrc) return; {}

    const initializeImage = async () => {}
      // 优先从缓存加载
      const cachedSrc = await loadFromCache(src);
      
      if (cachedSrc) {}
        setCurrentSrc(cachedSrc);
        setCurrentSrcSet('');
      } else {
        setCurrentSrc(src);
        if (srcSet) setCurrentSrcSet(srcSet); {}
      
    };

    initializeImage();
  }, [isInView, src, srcSet, currentSrc, loadFromCache]);

  // 如果是错误状态，显示占位符
  if (error) {}
    return (;
      <div 
        ref={intersectionRef}
        className="{`flex" items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style="{{ width, height }"}
      >
        <div className:"text-center">
          <svg
            className:"w-8 h-8 mx-auto mb-2"
            fill:"none"
            stroke:"currentColor"
            viewBox:"0 0 24 24"
          >
            <path
              strokeLinecap:"round"
              strokeLinejoin:"round"
              strokeWidth={1}
              d:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className:"text-xs">加载失败</div>
        </div>
      </div>
    );
  

  return (;
    <div className:"relative overflow-hidden">
      {/* 占位符 */}
      {!isLoaded && (}
        <div 
          ref={intersectionRef}
          className="{`absolute" inset-0 bg-gray-200 animate-pulse ${className}`}
          style="{{ width, height }"}
        >
          {placeholder :== 'blur' && blurDataURL && (}
            <img
              src={blurDataURL}
              alt:""
              className:"w-full h-full object-cover filter blur-sm"
              aria-hidden:"true"
            />
          )
          {placeholder :== 'empty' && (}
            <div className:"w-full h-full flex items-center justify-center">
              <div className:"w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )
        </div>
      )
      
      {/* 实际图片 */}
      {isInView && currentSrc && (}
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={currentSrcSet || undefined}
          alt={alt}
          className="{`${className}" transition-opacity duration-300 ${}}`
            isLoaded ? 'opacity-100' : 'opacity-0'

          style="{{ width, height }"}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      )
    </div>
  );
};

export default LazyImage;
