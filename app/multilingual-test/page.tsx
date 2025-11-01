/**
 * 多语言系统集成测试页面
 * 
 * 测试i18n前端系统、多语言API和数据库查询的完整集成
 */

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function MultilingualTestPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(['common', 'lottery']);
  
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiTests, setApiTests] = useState({
    products: { status: 'pending', data: null, error: null },
    packages: { status: 'pending', data: null, error: null },
  });

  // 测试API端点
  useEffect(() => {
    const testAPIs = async () => {
      setLoading(true);
      
      // 测试产品API
      try {
        const res = await fetch(`/api/products?language=${language}&limit=3`);
        const data = await res.json();
        
        if (data.success) {
          setProducts(data.data);
          setApiTests(prev => ({
            ...prev,
            products: { status: 'success', data, error: null }
          }));
        } else {
          setApiTests(prev => ({
            ...prev,
            products: { status: 'error', data: null, error: data.error?.message }
          }));
        }
      } catch (err: any) {
        setApiTests(prev => ({
          ...prev,
          products: { status: 'error', data: null, error: err.message }
        }));
      }

      // 测试充值包API
      try {
        const res = await fetch(`/api/recharge/packages?language=${language}`);
        const data = await res.json();
        
        if (data.success) {
          setPackages(data.data);
          setApiTests(prev => ({
            ...prev,
            packages: { status: 'success', data, error: null }
          }));
        } else {
          setApiTests(prev => ({
            ...prev,
            packages: { status: 'error', data: null, error: data.error?.message }
          }));
        }
      } catch (err: any) {
        setApiTests(prev => ({
          ...prev,
          packages: { status: 'error', data: null, error: err.message }
        }));
      }

      setLoading(false);
    };

    testAPIs();
  }, [language]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="text-green-600">✓</span>;
      case 'error':
        return <span className="text-red-600">✗</span>;
      case 'pending':
        return <span className="text-yellow-600">⏳</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {t('common:app_name')} - 多语言系统测试
          </h1>
          <p className="text-gray-600">
            测试i18n前端、多语言API和数据库JSONB查询的完整集成
          </p>
        </div>

        {/* 语言切换器 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. 前端i18n系统</h2>
          <LanguageSwitcher />
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>当前语言:</strong> <span className="font-mono">{language}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>翻译示例:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              <li>app_name: {t('common:app_name')}</li>
              <li>coins: {t('common:coins')}</li>
              <li>shares: {t('common:shares')}</li>
              <li>loading: {t('common:loading')}</li>
            </ul>
          </div>
        </div>

        {/* API测试状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. 多语言API测试</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">产品API</p>
                <p className="text-sm text-gray-500">/api/products?language={language}</p>
              </div>
              <div className="text-2xl">
                {getStatusIcon(apiTests.products.status)}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">充值包API</p>
                <p className="text-sm text-gray-500">/api/recharge/packages?language={language}</p>
              </div>
              <div className="text-2xl">
                {getStatusIcon(apiTests.packages.status)}
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {(apiTests.products.error || apiTests.packages.error) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 font-medium">API错误:</p>
              {apiTests.products.error && (
                <p className="text-sm text-red-500">产品API: {apiTests.products.error}</p>
              )}
              {apiTests.packages.error && (
                <p className="text-sm text-red-500">充值包API: {apiTests.packages.error}</p>
              )}
            </div>
          )}
        </div>

        {/* 产品数据展示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. 产品数据（数据库JSONB查询）</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common:loading')}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  <div className="text-sm text-gray-500">
                    <p>分类: {product.category}</p>
                    <p className="text-purple-600 font-medium mt-2">
                      {product.marketPrice} {t('common:tjs')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">暂无产品数据</p>
          )}
        </div>

        {/* 充值包数据展示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">4. 充值包数据（数据库JSONB查询）</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common:loading')}</p>
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-purple-600 my-2">{pkg.price} {t('common:tjs')}</p>
                  <p className="text-sm text-gray-600">{pkg.coins} {t('common:coins')}</p>
                  {pkg.bonusCoins > 0 && (
                    <p className="text-sm text-green-600 mt-1">+{pkg.bonusCoins} 赠送</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">暂无充值包数据</p>
          )}
        </div>

        {/* 系统信息 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">5. 系统信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">前端i18n系统</p>
              <ul className="space-y-1 text-gray-600">
                <li>框架: i18next + react-i18next</li>
                <li>支持语言: 4种 (zh-CN, en-US, ru-RU, tg-TJ)</li>
                <li>命名空间: 8个</li>
                <li>实时切换: 支持</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">后端数据库</p>
              <ul className="space-y-1 text-gray-600">
                <li>数据库: PostgreSQL (Supabase)</li>
                <li>存储方案: JSONB多语言字段</li>
                <li>查询优化: GIN索引</li>
                <li>服务层: MultilingualService</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 测试说明 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">测试说明</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>使用顶部的语言切换器切换语言</li>
            <li>观察页面内容是否立即更新为选择的语言</li>
            <li>检查产品名称、描述、分类是否正确翻译</li>
            <li>检查充值包名称是否正确翻译</li>
            <li>验证API返回的数据语言与选择的语言一致</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
