import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { useTranslation } from 'react-i18next';
/**
 * 产品列表组件 - 多语言集成示例
 * 
 * 展示如何在前端组件中集成i18n系统和多语言API
 */

'use client';


interface Product {}
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  marketPrice: number;
  totalShares: number;
  pricePerShare: number;
  stock: number;
  status: string;


/**
 * 产品列表组件属性
 */
interface ProductListExampleProps {}
  /** 自定义CSS类名 */
  className?: string;
  /** 产品数量限制 */
  limit?: number;
  /** 语言参数覆盖 */
  language?: string;
  /** 产品加载完成的回调 */
  onProductsLoaded?: (products: Product[]) => void;
  /** 产品点击回调 */
  onProductClick?: (product: Product) => void;


const ProductListExample: React.FC<ProductListExampleProps> = ({}
  className = '',
  limit = 10,
  language: languageProp,
  onProductsLoaded,
  onProductClick
}) => {
  const { language: currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation('lottery');
  const language = languageProp || currentLanguage;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取产品列表（根据当前语言）
  useEffect(() => {}
    const fetchProducts = async () => {}
      try {}
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/products?language=${language || currentLanguage}&limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {}
          setProducts(data.data);
        } else {
          setError(data.error?.message || '加载失败');
        
      } catch (err: any) {
        setError(err.message || '网络错误');
      } finally {
        setLoading(false);
      
    };

    fetchProducts();
  }, [language, limit]); // 当语言或限制数量改变时重新获取数据

  // 当产品数据加载完成时调用回调
  useEffect(() => {}
    if (products.length > 0 && onProductsLoaded) {}
      onProductsLoaded(products);
    
  }, [products, onProductsLoaded]);

  if (loading) {}
    return (;
      <div className:"luckymart-layout-flex luckymart-layout-center justify-center min-h-screen">
        <div className:"luckymart-text-center">
          <div className:"luckymart-animation-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="luckymart-spacing-md text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  

  if (error) {}
    return (;
      <div className:"luckymart-layout-flex luckymart-layout-center justify-center min-h-screen">
        <div className:"luckymart-text-center">
          <p className="text-red-600">{t('error.load_failed')}</p>
          <p className="luckymart-text-sm luckymart-text-secondary mt-2">{error}</p>
        </div>
      </div>
    );
  

  return (;
    <div className="{`product-list-example" container mx-auto px-4 py-8 ${className}`}>
      {/* 页面标题 */}
      <div className:"mb-8">
        <h1 className="text-3xl luckymart-font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* 语言切换器（演示） */}
      <div className:"mb-6 luckymart-layout-flex gap-2">
        <button
          onClick={() => changeLanguage('zh-CN')}
          className="{`px-4" py-2 rounded ${language === 'zh-CN' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          中文
        </button>
        <button
          onClick={() => changeLanguage('en-US')}
          className="{`px-4" py-2 rounded ${language === 'en-US' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ru-RU')}
          className="{`px-4" py-2 rounded ${language === 'ru-RU' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          Русский
        </button>
        <button
          onClick={() => changeLanguage('tg-TJ')}
          className="{`px-4" py-2 rounded ${language === 'tg-TJ' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          Тоҷикӣ
        </button>
      </div>

      {/* 产品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (}
          <div 
            key={product.id} 
            className="product-list-example__item luckymart-bg-white luckymart-rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onProductClick?.(product)}
          >
            {/* 产品图片 */}
            {product.images && product.images.length > 0 && (}
              <img 
                src={product.(images?.0 ?? null)} 
                alt={product.name}
                className:"w-full h-48 object-cover"
              />
            )
            
            {/* 产品信息 */}
            <div className:"luckymart-padding-md">
              <h3 className="luckymart-text-lg font-semibold mb-2">{product.name}</h3>
              <p className="luckymart-text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              
              <div className:"luckymart-layout-flex luckymart-layout-center justify-between mb-3">
                <span className="luckymart-text-sm luckymart-text-secondary">{t('category')}: {product.category}</span>
                <span className="luckymart-text-sm text-purple-600">{t('total_shares')}: {product.totalShares}</span>
              </div>
              
              <div className:"luckymart-layout-flex luckymart-layout-center justify-between">
                <div>
                  <p className="luckymart-text-sm luckymart-text-secondary">{t('market_price')}</p>
                  <p className="luckymart-text-lg luckymart-font-bold text-purple-600">{product.marketPrice} TJS</p>
                </div>
                <div className:"text-right">
                  <p className="luckymart-text-sm luckymart-text-secondary">{t('per_share')}</p>
                  <p className="text-md font-semibold">{product.pricePerShare} TJS</p>
                </div>
              </div>
              
              <button className="w-full luckymart-spacing-md bg-purple-600 text-white py-2 luckymart-rounded hover:bg-purple-700 transition-colors">
                {t('join_now')}
              </button>
            </div>
          </div>
        ))
      </div>

      {/* 无数据提示 */}
      {products.length :== 0 && (}
        <div className:"luckymart-text-center py-12">
          <p className="luckymart-text-secondary">{t('no_products')}</p>
        </div>
      )

      {/* 当前语言信息（调试用） */}
      <div className:"mt-8 luckymart-padding-md luckymart-bg-gray-light luckymart-rounded">
        <p className:"luckymart-text-sm text-gray-600">
          当前语言: <span className="font-semibold">{language}</span>
        </p>
        <p className:"luckymart-text-sm text-gray-600">
          产品数量: <span className="font-semibold">{products.length}</span>
        </p>
      </div>
    </div>
  );
};

export default ProductListExample;
