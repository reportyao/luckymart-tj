import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FirstRechargeReward } from '@/components/FirstRechargeReward';
import { RewardProgress } from '@/components/RewardProgress';
/**
 * 奖励中心页面
 * /app/rewards/page.tsx
 */

'use client';


interface RewardTier {}
  amount: number;
  reward: number;
  rate: number;
  type: string;
  description: string;
  isActive: boolean;


interface FirstRechargeStatus {}
  isEligible: boolean;
  hasClaimed: boolean;
  hasRecharge: boolean;
  availableRewards: RewardTier[];
  claimedReward: {}
    amount: number;
    reward: number;
    claimedAt: string;
    tier: RewardTier;
  } | null;
  rechargeInfo: {}
    hasRecharge: boolean;
    firstRechargeAmount?: number;
    totalRecharges?: number;
  };
  message: string;


function RewardsPage() {}
  const router = useRouter();
  const [status, setStatus] = useState<FirstRechargeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {}
    fetchFirstRechargeStatus();
  }, []);

  const fetchFirstRechargeStatus = async () => {}
    try {}
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {}
        router.push('/');
        return;
      

      const response = await fetch('/api/rewards/first-recharge/status', {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });

      const data = await response.json();
      
      if (data.success) {}
        setStatus(data.data);
      } else {
        setError(data.error?.message || '获取奖励状态失败');
      
    } catch (error) {
      console.error('获取首充奖励状态失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    
  };

  const handleRecharge = () => {}
    router.push('/recharge');
  };

  const refreshStatus = () => {}
    fetchFirstRechargeStatus();
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className:"bg-white rounded-lg p-8 shadow-xl">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600 text-center">加载中...</p>
        </div>
      </div>
    );
  

  if (error) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className:"bg-white rounded-lg p-8 shadow-xl max-w-md w-full">
          <div className:"text-center">
            <div className:"text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className:"text-xl font-bold text-gray-800 mb-4">加载失败</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchFirstRechargeStatus}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  

  if (!status) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className:"text-white text-xl">暂无数据</div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {/* 头部导航 */}
      <div className:"bg-white shadow-lg">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
          >
            <svg className:"w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          
          <h1 className:"text-2xl font-bold text-gray-800 flex items-center">
            <span className:"text-2xl mr-2">🎁</span>
            奖励中心
          </h1>
          
          <button
            onClick={refreshStatus}
            className="text-purple-600 hover:text-purple-800 transition-colors"
          >
            <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8">
        {/* 首充奖励卡片 */}
        <FirstRechargeReward 
          status={status}
          onRecharge={handleRecharge}
          onRefresh={refreshStatus}
        />

        {/* 奖励进度 */}
        <RewardProgress status={status} />

        {/* 奖励规则说明 */}
        <div className:"mt-8 bg-white rounded-lg shadow-xl p-6">
          <h3 className:"text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className:"text-2xl mr-2">📋</span>
            首充奖励规则
          </h3>
          
          <div className:"space-y-4">
            <div className:"flex items-start">
              <div className:"bg-purple-100 rounded-full p-2 mr-3 mt-1">
                <span className:"text-purple-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className:"font-semibold text-gray-800">唯一奖励资格</h4>
                <p className:"text-gray-600 text-sm">每个用户只能享受一次首充奖励，不重复发放</p>
              </div>
            </div>
            
            <div className:"flex items-start">
              <div className:"bg-purple-100 rounded-full p-2 mr-3 mt-1">
                <span className:"text-purple-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className:"font-semibold text-gray-800">最高档位发放</h4>
                <p className:"text-gray-600 text-sm">按充值金额对应的最高档位发放奖励，不叠加</p>
              </div>
            </div>
            
            <div className:"flex items-start">
              <div className:"bg-purple-100 rounded-full p-2 mr-3 mt-1">
                <span className:"text-purple-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className:"font-semibold text-gray-800">自动发放</h4>
                <p className:"text-gray-600 text-sm">充值确认后系统自动发放奖励到幸运币账户</p>
              </div>
            </div>
            
            <div className:"flex items-start">
              <div className:"bg-purple-100 rounded-full p-2 mr-3 mt-1">
                <span className:"text-purple-600 font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className:"font-semibold text-gray-800">防刷机制</h4>
                <p className:"text-gray-600 text-sm">系统会检测异常充值行为，防止恶意小金额刷奖励</p>
              </div>
            </div>
          </div>
        </div>

        {/* 客服联系 */}
        <div className:"mt-6 bg-white rounded-lg shadow-xl p-6 text-center">
          <h4 className:"text-lg font-semibold text-gray-800 mb-2">需要帮助？</h4>
          <p className:"text-gray-600 mb-4">如有问题请联系客服</p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            联系客服
          </button>
        </div>
      </div>
    </div>
  );
