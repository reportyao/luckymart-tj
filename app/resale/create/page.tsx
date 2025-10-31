'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  lottery_rounds?: {
    products: {
      id: string;
      name_zh: string;
      images: string[];
      market_price: number;
    };
  };
  fulfillment_status: string;
}

interface PriceRecommendation {
  type: string;
  price: number;
  percentage: number;
  description: string;
  estimatedTime: string;
}

interface CustomAnalysis {
  price: number;
  platformFee: number;
  netAmount: number;
  platformFeeRate: number;
  isReasonable: boolean;
  suggestedRange: {
    min: number;
    max: number;
  };
}

export default function CreateResalePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customPrice, setCustomPrice] = useState('');
  const [priceRecommendations, setPriceRecommendations] = useState<PriceRecommendation[]>([]);
  const [customAnalysis, setCustomAnalysis] = useState<CustomAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/list?status=won&limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // 过滤出可以转售的订单（已中奖且未转售）
        const resalableOrders = data.data.orders.filter((order: Order) =>
          order.fulfillment_status === 'won' || order.fulfillment_status === 'delivered'
        );
        setOrders(resalableOrders);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceRecommendations = async (orderId: string, price?: string) => {
    try {
      const token = localStorage.getItem('token');
      const body: any = { orderId };
      if (price) {body.customPrice = parseFloat(price);}

      const response = await fetch('/api/resale/suggest-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (data.success) {
        setPriceRecommendations(data.data.recommendations);
        setCustomAnalysis(data.data.customAnalysis);
      }
    } catch (error) {
      console.error('获取定价建议失败:', error);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    fetchPriceRecommendations(order.id);
  };

  const handleCustomPriceChange = (price: string) => {
    // 基础验证：只允许数字和小数点
    const numericPrice = price.replace(/[^0-9.]/g, '');
    
    // 限制小数位数
    const parts = numericPrice.split('.');
    if (parts.length > 2) {
      return; // 不允许多个小数点
    }
    if (parts[1] && parts[1].length > 2) {
      return; // 最多2位小数
    }
    
    setCustomPrice(numericPrice);
    if (selectedOrder && numericPrice && !isNaN(Number(numericPrice))) {
      fetchPriceRecommendations(selectedOrder.id, numericPrice);
    }
  };

  const handleCreateResale = async (price: number) => {
    if (!selectedOrder) {return;}

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resale/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          listing_price: price
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`转售创建成功！正在为您寻找买家，预计1-10分钟内快速成交。\n\n您的商品：${selectedOrder.lottery_rounds?.products.name_zh}\n转售价格：${price} TJS\n平台手续费：${Math.round(price * 0.02 * 100) / 100} TJS`);
        router.push(`/resale/status/${  data.data.id}`);
      } else {
        alert(data.error || '创建转售失败');
      }
    } catch (error) {
      console.error('创建转售失败:', error);
      alert('创建转售失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-900">创建转售</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 选择订单 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">选择要转售的商品</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-lg">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">暂无可转售的商品</p>
              <p className="text-gray-400 text-sm">只有中奖且已完成的订单才能转售</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className={`cursor-pointer bg-white rounded-xl p-4 shadow-lg transition-all hover:shadow-xl ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={order.lottery_rounds?.products.images?.[0] || '/images/placeholder.png'}
                      alt={order.lottery_rounds?.products.name_zh}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {order.lottery_rounds?.products.name_zh}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        订单号: {order.order_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        市场价格: {order.lottery_rounds?.products.market_price} TJS
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 定价建议 */}
        {selectedOrder && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">智能定价建议</h2>
            
            {/* 推荐定价 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {priceRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => handleCreateResale(rec.price)}
                >
                  <div className="text-center">
                    <h3 className="font-bold text-purple-600 mb-2">{rec.type}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {rec.price} TJS
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-500">{rec.estimatedTime}</p>
                    <button
                      disabled={submitting}
                      className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      确认定价
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 自定义定价 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">自定义定价</h3>
              <div className="flex gap-4 mb-4">
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => handleCustomPriceChange(e.target.value)}
                  placeholder="请输入自定义价格"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {customAnalysis && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">定价分析</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">设定价格：</span>
                      <span className="font-semibold">{customAnalysis.price} TJS</span>
                    </div>
                    <div>
                      <span className="text-gray-600">平台手续费(2%)：</span>
                      <span className="font-semibold text-red-600">{customAnalysis.platformFee} TJS</span>
                    </div>
                    <div>
                      <span className="text-gray-600">实际到手：</span>
                      <span className="font-semibold text-green-600">{customAnalysis.netAmount} TJS</span>
                    </div>
                    <div>
                      <span className="text-gray-600">建议范围：</span>
                      <span className="font-semibold">{customAnalysis.suggestedRange.min} - {customAnalysis.suggestedRange.max} TJS</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {customAnalysis.isReasonable ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        价格合理，易于成交
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        价格过高，可能影响成交
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCreateResale(customAnalysis.price)}
                    disabled={submitting}
                    className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? '创建中...' : `确认 ${customAnalysis.price} TJS 定价`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 说明信息 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">转售说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-4 h-4 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              平台回购：您的商品将由平台快速回购，通常1-10分钟内完成交易
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              资金到账：交易完成后，资金将直接存入您的平台余额
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              平台保障：平台承担交易风险，确保您的资金安全
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}