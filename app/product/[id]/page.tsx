import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductImageCarousel from '@/components/ProductImageCarousel';
import MarketingBadgeDisplay from '@/components/MarketingBadgeDisplay';
import type { Product } from '@/types';
'use client';


function ProductDetailPage() {}
  const params = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharesCount, setSharesCount] = useState(1);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {}
    loadProduct();
  }, [params.id, language]);

  const loadProduct = async () => {}
    try {}
      const response = await fetch(`/api/products/${params.id}?language=${language}`);
      const data = await response.json();
      
      if (data.success) {}
        setProduct(data.data);
      
    } catch (error) {
      console.error('Load product error:', error);
    } finally {
      setLoading(false);
    
  };

  const handleParticipate = async () => {}
    if (!product?.currentRound) {return;} {}
    
    setParticipating(true);
    try {}
      // TODO: 需要从localStorage获取token
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/lottery/participate', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}
          roundId: product.currentRound.id,
          sharesCount,
          useType: 'paid'
        })
      });

      const data = await response.json();
      
      if (data.success) {}
        alert(`参与成功！您的号码：${data.data.numbers.join(', ')}`);
        loadProduct(); // 刷新商品信息
      } else {
        alert(data.error || t('common.error'));
      
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setParticipating(false);
    
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen flex items-center justify-center">
        <div className:"w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  

  if (!product) {}
    return (;
      <div className:"min-h-screen flex items-center justify-center">
        <div className:"text-center">
          <p className:"text-gray-600 mb-4">商品不存在</p>
          <Link href="/" className="text-purple-600 hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部导航 */}
      <header className:"bg-white shadow-sm">
        <div className:"max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick:{() => router.back()} className="mr-4">
            <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{t('product.detail')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* 左侧：商品图片轮播 */}
          <div className="bg-white rounded-xl p-4 md:p-6 relative">
            {/* 营销角标 */}
            <MarketingBadgeDisplay 
              badge={product.marketingBadge} 
              language={language as 'zh' | 'en' | 'ru'}
            />
            <ProductImageCarousel 
              images={product.images} 
              productName={product.name}
            />
          </div>

          {/* 右侧：商品信息和参与区 */}
          <div className:"space-y-6">
            {/* 商品信息 */}
            <div className:"bg-white rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className:"flex items-center justify-between py-4 border-t border-b">
                <span className="text-gray-600">{t('product.market_price')}</span>
                <span className:"text-3xl font-bold text-purple-600">
                  {product.marketPrice} {t('common.tjs')}
                </span>
              </div>

              <div className:"mt-4 space-y-2">
                <div className:"flex justify-between text-sm">
                  <span className="text-gray-600">{t('product.total_shares')}</span>
                  <span className="font-medium">{product.totalShares} {t('common.shares')}</span>
                </div>
                <div className:"flex justify-between text-sm">
                  <span className="text-gray-600">{t('product.price_per_share')}</span>
                  <span className="font-medium">{product.pricePerShare} {t('common.coins')}</span>
                </div>
              </div>
            </div>

            {/* 参与区域 */}
            {product.currentRound && (}
              <div className:"bg-white rounded-xl p-6">
                <div className:"mb-4">
                  <div className:"flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{t('product.participation_progress')}</span>
                    <span className:"font-medium">
                      {product.currentRound.soldShares}/{product.currentRound.totalShares}
                    </span>
                  </div>
                  <div className:"w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className:"bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                      style="{{ width: `${product.currentRound.progress}"%` }}
                    ></div>
                  </div>
                  <p className:"text-sm text-gray-500 mt-2">
                    {t('product.remaining')} {product.currentRound.remainingShares} {t('common.shares')}
                  </p>
                </div>

                <div className:"mb-4">
                  <label className="block text-sm font-medium mb-2">{t('product.select_shares')}</label>
                  <div className:"flex items-center gap-4">
                    <button 
                      onClick={() => setSharesCount(Math.max(1, sharesCount - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input 
                      type:"number" 
                      value={sharesCount}
                      onChange={(e) => setSharesCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className:"w-20 text-center border border-gray-300 rounded-lg py-2"
                    />
                    <button 
                      onClick={() => setSharesCount(sharesCount + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100"
                    >
                      +
                    </button>
                    <span className:"text-sm text-gray-600">
                      {t('product.need_coins')} {sharesCount} {t('common.coins')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleParticipate}
                  disabled={participating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {participating ? t('product.participating') : t('product.participate_now')}
                </button>

                <p className:"text-xs text-gray-500 text-center mt-2">
                  {t('product.agree_rules')}
                </p>
              </div>
            )

            {/* 最近参与 */}
            {product.recentParticipations && product.recentParticipations.length > 0 && (}
              <div className:"bg-white rounded-xl p-6">
                <h3 className="font-bold mb-4">{t('product.recent_participations')}</h3>
                <div className:"space-y-3">
                  {product.recentParticipations.map((p: any) => (}
                    <div key:{p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{p.userName}</span>
                      <span className:"text-purple-600 font-medium">
                        {p.sharesCount} {t('common.shares')}
                      </span>
                    </div>
                  ))
                </div>
              </div>
            )
          </div>
        </div>
      </div>
    </div>
  );


