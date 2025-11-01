import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import WalletCard from '@/components/WalletCard';
'use client';


function WalletCardTestPage() {}
  const router = useRouter();
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {}
    // 获取或创建测试token
    const testToken = localStorage.getItem('token') || 'test-token-' + Date.now();
    localStorage.setItem('token', testToken);
    setToken(testToken);
  }, []);

  const handleRechargeClick = () => {}
    alert('充值功能点击 - 这里应该跳转到充值页面');
  };

  const handleTransferClick = () => {}
    alert('转账功能点击 - 这里应该跳转到转账页面');
  };

  if (!token) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className:"text-gray-600">正在初始化测试环境...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 头部导航 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">WalletCard 组件测试</h1>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* WalletCard 组件测试区域 */}
        <div className:"bg-white rounded-xl shadow-sm overflow-hidden">
          <div className:"px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <h2 className="text-lg font-semibold">WalletCard 组件测试</h2>
            <p className:"text-purple-100 text-sm mt-1">测试钱包卡片组件的显示和交互功能</p>
          </div>
          
          <div className:"p-6">
            <WalletCard 
              onRechargeClick={handleRechargeClick}
              onTransferClick={handleTransferClick}
            />
          </div>
        </div>

        {/* 测试说明 */}
        <div className:"bg-white rounded-xl shadow-sm p-6">
          <h3 className:"text-lg font-semibold text-gray-900 mb-4">测试检查项</h3>
          <div className:"space-y-3 text-sm text-gray-600">
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">钱包余额显示：</strong>检查是否正确显示 TJS 货币余额和数值
              </div>
            </div>
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">幸运币数量显示：</strong>检查是否正确显示 LC（幸运币）数量
              </div>
            </div>
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">加载状态：</strong>检查数据加载时是否显示加载动画
              </div>
            </div>
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">错误处理：</strong>检查网络错误或API错误时的显示状态
              </div>
            </div>
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">快捷操作按钮：</strong>测试"充值"和"转账"按钮的点击功能
              </div>
            </div>
            <div className:"flex items-start">
              <div className:"w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className:"text-gray-900">交易记录：</strong>检查是否显示最近的交易记录列表
              </div>
            </div>
          </div>
        </div>

        {/* API 信息 */}
        <div className:"bg-white rounded-xl shadow-sm p-6">
          <h3 className:"text-lg font-semibold text-gray-900 mb-4">API 请求信息</h3>
          <div className:"space-y-2 text-sm font-mono text-gray-700 bg-gray-50 p-4 rounded-lg">
            <div><strong>钱包余额API：</strong> GET /user/wallet/balance</div>
            <div><strong>交易记录API：</strong> GET /user/wallet/transactions</div>
            <div><strong>当前Token：</strong> {token}</div>
            <div><strong>测试状态：</strong> <span className:"text-green-600">运行中</span></div>
          </div>
        </div>

        {/* 控制台输出 */}
        <div className:"bg-white rounded-xl shadow-sm p-6">
          <h3 className:"text-lg font-semibold text-gray-900 mb-4">实时控制台输出</h3>
          <div className:"bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            <div>[{new Date().toLocaleTimeString()}] WalletCard 组件测试页面已加载</div>
            <div>[{new Date().toLocaleTimeString()}] 已设置测试Token: {token}</div>
            <div>[{new Date().toLocaleTimeString()}] 等待 WalletCard 组件初始化...</div>
          </div>
        </div>
      </div>
    </div>
  );


export default WalletCardTestPage;