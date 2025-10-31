/**
 * 产品列表组件 - 多语言集成示例
 * 
 * 展示如何在前端组件中集成i18n系统和多语言API
 */

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { useTranslation } from 'react-i18next';

interface Product {
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
}

export default function ProductListExample() {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation('lottery');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取产品列表（根据当前语言）
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/products?language=${language}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data);
        } else {
          setError(data.error?.message || '加载失败');
        }
      } catch (err: any) {
        setError(err.message || '网络错误');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [language]); // 当语言改变时重新获取数据

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{t('error.load_failed')}</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* 语言切换器（演示） */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => changeLanguage('zh-CN')}
          className={`px-4 py-2 rounded ${language === 'zh-CN' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          中文
        </button>
        <button
          onClick={() => changeLanguage('en-US')}
          className={`px-4 py-2 rounded ${language === 'en-US' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ru-RU')}
          className={`px-4 py-2 rounded ${language === 'ru-RU' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          Русский
        </button>
        <button
          onClick={() => changeLanguage('tg-TJ')}
          className={`px-4 py-2 rounded ${language === 'tg-TJ' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          Тоҷикӣ
        </button>
      </div>

      {/* 产品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* 产品图片 */}
            {product.images && product.images.length > 0 && (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
            
            {/* 产品信息 */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{t('category')}: {product.category}</span>
                <span className="text-sm text-purple-600">{t('total_shares')}: {product.totalShares}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('market_price')}</p>
                  <p className="text-lg font-bold text-purple-600">{product.marketPrice} TJS</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('per_share')}</p>
                  <p className="text-md font-semibold">{product.pricePerShare} TJS</p>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors">
                {t('join_now')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 无数据提示 */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('no_products')}</p>
        </div>
      )}

      {/* 当前语言信息（调试用） */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          当前语言: <span className="font-semibold">{language}</span>
        </p>
        <p className="text-sm text-gray-600">
          产品数量: <span className="font-semibold">{products.length}</span>
        </p>
      </div>
    </div>
  );
}
