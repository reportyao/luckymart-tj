'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  marketPrice: number;
  currentRound: {
    id: string;
    soldShares: number;
    totalShares: number;
    progress: number;
  } | null;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language, t } = useLanguage();

  useEffect(() => {
    loadProducts();
  }, [language]);

  useEffect(() => {
    // 监听语言切换事件
    const handleLanguageChange = () => {
      loadProducts();
    };
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/products/list?language=${language}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
      } else {
        setError(data.error || t('common.loading'));
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => loadProducts()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <nav className="flex items-center gap-4">
            <Link href="/resale" className="text-gray-600 hover:text-purple-600 transition">
              {t('nav.resale')}
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-purple-600 transition">
              {t('nav.profile')}
            </Link>
            <Link href="/orders" className="text-gray-600 hover:text-purple-600 transition">
              {t('nav.orders')}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t('home.banner.title')}</h2>
          <p className="text-lg opacity-90">{t('home.banner.subtitle')}</p>
        </div>
      </div>

      {/* 商品列表 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {product.images && product.images[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      暂无图片
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-purple-600 font-bold text-xl">
                      {product.marketPrice} {t('common.tjs')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {t('home.market_price')}
                    </span>
                  </div>

                  {product.currentRound && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{t('home.progress')}</span>
                        <span>{product.currentRound.soldShares}/{product.currentRound.totalShares}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${product.currentRound.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
