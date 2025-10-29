'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ResaleListing {
  id: number;
  orderId: number;
  sellerId: number;
  productId: number;
  price: number;
  status: string;
  createdAt: string;
  products: {
    id: number;
    nameZh: string;
    nameEn: string;
    imageUrl: string;
    marketPrice: number;
  };
  sellers: {
    username?: string;
    firstName?: string;
  };
}

export default function ResalePage() {
  const router = useRouter();
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  useEffect(() => {
    fetchResaleListings();
  }, []);

  const fetchResaleListings = async () => {
    try {
      const response = await fetch('/api/resale/list?limit=50');
      const data = await response.json();
      if (data.success) {
        setListings(data.data.listings);
      }
    } catch (error) {
      console.error('获取转售列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listingId: number, price: number, productName: string) => {
    if (!confirm(`确认购买该商品？\n\n商品: ${productName}\n价格: ${price} TJS`)) {
      return;
    }

    setPurchasing(listingId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resale/purchase/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('购买成功！商品已转入您的订单，请前往"我的订单"查看。');
        fetchResaleListings();
      } else {
        alert(data.error || '购买失败');
      }
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败，请重试');
    } finally {
      setPurchasing(null);
    }
  };

  const getDiscount = (price: number, marketPrice: number) => {
    return Math.round((1 - price / marketPrice) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-900">转售市场</h1>
        </div>
      </div>

      {/* 说明横幅 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg mb-1">什么是转售市场？</h3>
              <p className="text-sm opacity-90">
                转售市场让您可以以优惠价格购买其他用户转售的中奖商品，无需参与夺宝即可获得心仪商品！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 转售商品列表 */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">暂无转售商品</p>
            <p className="text-gray-400 text-sm">转售商品会在这里显示，请稍后查看</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const discount = getDiscount(listing.price, listing.products.marketPrice);
              const sellerName = listing.sellers.firstName || listing.sellers.username || '匿名用户';

              return (
                <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  {/* 商品图片 */}
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={listing.products.imageUrl || '/images/placeholder.png'}
                      alt={listing.products.nameZh}
                      fill
                      className="object-cover"
                    />
                    {/* 折扣标签 */}
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {discount}% OFF
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {listing.products.nameZh}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-600">卖家: {sellerName}</span>
                    </div>

                    {/* 价格信息 */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-red-600">
                          {listing.price.toFixed(2)} TJS
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {listing.products.marketPrice.toFixed(2)} TJS
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        节省 {(listing.products.marketPrice - listing.price).toFixed(2)} TJS
                      </p>
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={() => handlePurchase(listing.id, listing.price, listing.products.nameZh)}
                      disabled={purchasing === listing.id}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {purchasing === listing.id ? '购买中...' : '立即购买'}
                    </button>

                    {/* 发布时间 */}
                    <p className="text-xs text-gray-400 text-center mt-3">
                      {new Date(listing.createdAt).toLocaleDateString('zh-CN')} 发布
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">购买须知</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>转售商品为其他用户中奖后转售，价格由卖家设定</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>购买成功后，商品将转入您的订单，请及时填写收货地址</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>转售商品享受与夺宝中奖同等的物流和售后服务</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>转售价格通常远低于市场价，性价比极高</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
