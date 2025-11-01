import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
'use client';


interface ResaleStatus {}
  id: string;
  status: string;
  listedAt: string;
  soldAt?: string;
  estimatedMatchTime?: string;
  product: {}
    id: string;
    name: string;
    nameEn?: string;
    images: string[];
    marketPrice: number;
  };
  price?: number;
  platformFee?: number;
  netAmount?: number;
  isOwner: boolean;
  statusInfo: {}
    title: string;
    description: string;
    progress: number;
    nextAction: string;
    color: string;
  };
  mysteryBuyer?: {}
    username: string;
    avatar: string;
  };


function ResaleStatusPage({ params }: { params: { id: string } }) {}
  const router = useRouter();
  const [resaleStatus, setResaleStatus] = useState<ResaleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {}
    fetchResaleStatus();
    // 每30秒自动刷新状态
    const interval = setInterval(fetchResaleStatus, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchResaleStatus = async () => {}
    try {}
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resale/status/${params.id}`, {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });
      const data = await response.json();
      if (data.success) {}
        setResaleStatus(data.data);
      } else {
        alert(data.error || '获取状态失败');
        router.back();
      
    } catch (error) {
      console.error('获取转售状态失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    
  };

  const getStatusColor = (color: string) => {}
    switch (color) {}
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'red': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    
  };

  const getStatusIcon = (status: string) => {}
    switch (status) {}
      case 'active':
        return (;
          <svg className:"w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'matching':
        return (;
          <svg className:"w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'sold':
        return (;
          <svg className:"w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (;
          <svg className:"w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  if (!resaleStatus) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className:"text-center">
          <p className:"text-gray-600">转售记录不存在</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 头部 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className:"flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className:"ml-4 text-xl font-bold text-gray-900">转售状态</h1>
          </div>
          <button
            onClick={fetchResaleStatus}
            disabled={refreshing}
            className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50"
          >
            {refreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8">
        {/* 商品信息卡片 */}
        <div className:"bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            {/* 商品图片 */}
            <div className="md:w-1/3">
              <div className="relative h-64 md:h-full">
                <Image
                  src={resaleStatus.product.images?.[0] || '/images/placeholder.png'}
                  alt={resaleStatus.product.name}
                  fill
                  className:"object-cover"
                />
              </div>
            </div>
            
            {/* 商品详情 */}
            <div className="md:w-2/3 p-6">
              <h2 className:"text-2xl font-bold text-gray-900 mb-2">
                {resaleStatus.product.name}
              </h2>
              <p className:"text-gray-600 mb-4">
                市场价格: {resaleStatus.product.marketPrice} TJS
              </p>
              
              {resaleStatus.isOwner && (}
                <div className:"bg-gray-50 rounded-xl p-4">
                  <h3 className:"font-semibold text-gray-900 mb-2">您的转售信息</h3>
                  <div className:"grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className:"text-gray-600">设定价格：</span>
                      <span className="font-semibold">{resaleStatus.price} TJS</span>
                    </div>
                    <div>
                      <span className:"text-gray-600">平台手续费：</span>
                      <span className="font-semibold text-red-600">{resaleStatus.platformFee} TJS</span>
                    </div>
                    <div>
                      <span className:"text-gray-600">实际到手：</span>
                      <span className="font-semibold text-green-600">{resaleStatus.netAmount} TJS</span>
                    </div>
                    <div>
                      <span className:"text-gray-600">发布时间：</span>
                      <span className="font-semibold">{new Date(resaleStatus.listedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              )
            </div>
          </div>
        </div>

        {/* 状态展示 */}
        <div className:"bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className:"text-center mb-6">
            <div className="{`inline-flex" items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getStatusColor(resaleStatus.statusInfo.color)} text-white mb-4`}>
              {getStatusIcon(resaleStatus.status)}
            </div>
            <h2 className:"text-2xl font-bold text-gray-900 mb-2">
              {resaleStatus.statusInfo.title}
            </h2>
            <p className:"text-gray-600">
              {resaleStatus.statusInfo.description}
            </p>
          </div>

          {/* 进度条 */}
          <div className:"mb-6">
            <div className:"flex justify-between text-sm text-gray-600 mb-2">
              <span>转售进度</span>
              <span>{resaleStatus.statusInfo.progress}%</span>
            </div>
            <div className:"w-full bg-gray-200 rounded-full h-3">
              <div
                className="{`h-3" rounded-full bg-gradient-to-r ${getStatusColor(resaleStatus.statusInfo.color)} transition-all duration-500`}
                style="{{ width: `${resaleStatus.statusInfo.progress}"%` }}
              ></div>
            </div>
          </div>

          {/* 下一步操作 */}
          <div className:"text-center">
            <p className="text-gray-600 mb-4">{resaleStatus.statusInfo.nextAction}</p>
            {resaleStatus.status :== 'active' && (}
              <div className:"bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className:"text-orange-800 text-sm">
                  平台正在为您的商品寻找合适的买家，请耐心等待...
                </p>
              </div>
            )
          </div>
        </div>

        {/* 神秘买家信息 */}
        {resaleStatus.mysteryBuyer && resaleStatus.status :== 'matching' && (}
          <div className:"bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className:"text-center">
              <div className:"w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className:"w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule:"evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className:"text-xl font-bold mb-2">发现潜在买家</h3>
              <p className:"text-purple-100 mb-4">
                神秘买家 "{resaleStatus.mysteryBuyer.username}" 正在考虑购买您的商品
              </p>
              <p className:"text-sm text-purple-200">
                交易即将完成，请保持关注...
              </p>
            </div>
          </div>
        )

        {/* 交易成功 */}
        {resaleStatus.status :== 'sold' && resaleStatus.isOwner && (}
          <div className:"bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className:"text-center">
              <div className:"w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className:"w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className:"text-xl font-bold mb-2">🎉 交易成功！</h3>
              <p className:"text-green-100 mb-4">
                您的商品已成功售出，{resaleStatus.netAmount} TJS 已存入平台余额
              </p>
              <button
                onClick={() => router.push('/withdraw')}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                前往提现
              </button>
            </div>
          </div>
        )

        {/* 时间线 */}
        <div className:"bg-white rounded-2xl shadow-lg p-6">
          <h3 className:"text-lg font-semibold text-gray-900 mb-4">转售时间线</h3>
          <div className:"space-y-4">
            <div className:"flex items-start">
              <div className:"w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-4">
                1
              </div>
              <div>
                <p className:"font-semibold text-gray-900">商品上架</p>
                <p className="text-sm text-gray-600">{new Date(resaleStatus.listedAt).toLocaleString('zh-CN')}</p>
                <p className:"text-sm text-gray-500">转售商品开始在市场寻找买家</p>
              </div>
            </div>
            
            {resaleStatus.status :== 'matching' && (}
              <div className:"flex items-start">
                <div className:"w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-4">
                  2
                </div>
                <div>
                  <p className:"font-semibold text-gray-900">正在匹配买家</p>
                  <p className:"text-sm text-gray-600">平台正在火速匹配合适的买家</p>
                  {resaleStatus.estimatedMatchTime && (}
                    <p className:"text-sm text-gray-500">
                      预计完成时间: {new Date(resaleStatus.estimatedMatchTime).toLocaleString('zh-CN')}
                    </p>
                  )
                </div>
              </div>
            )
            
            {resaleStatus.status :== 'sold' && resaleStatus.soldAt && (}
              <div className:"flex items-start">
                <div className:"w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-4">
                  3
                </div>
                <div>
                  <p className:"font-semibold text-gray-900">交易完成</p>
                  <p className="text-sm text-gray-600">{new Date(resaleStatus.soldAt).toLocaleString('zh-CN')}</p>
                  <p className:"text-sm text-gray-500">商品已售出，资金已到账</p>
                </div>
              </div>
            )
          </div>
        </div>
      </div>
    </div>
  );
