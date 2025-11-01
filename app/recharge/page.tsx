import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
'use client';


interface RechargePackage {}
  id: number;
  amount: number;
  bonus: number;
  totalCoins: number;
  isActive: boolean;
  sortOrder: number;


function RechargePage() {}
  const router = useRouter();
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {}
    fetchPackages();
  }, []);

  const fetchPackages = async () => {}
    try {}
      const response = await fetch('/api/payment/packages');
      const data = await response.json();
      if (data.success) {}
        setPackages(data.data);
      
    } catch (error) {
      console.error('获取充值礼包失败:', error);
    } finally {
      setLoading(false);
    
  };

  const handleSelectPackage = (packageId: number) => {}
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
  };

  const handlePayment = async (method: 'alif_mobi' | 'dc_bank') => {}
    if (!selectedPackage) {return;} {}

    try {}
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/recharge', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}
          packageId: selectedPackage,
          paymentMethod: method
        })
      });

      const data = await response.json();
      if (data.success) {}
        alert(`充值订单创建成功！\n\n请使用以下信息完成支付：\n${data.data.paymentInfo}\n\n支付完成后，请联系客服进行核销。`);
        setShowPaymentModal(false);
      } else {
        alert(data.error || '充值失败');
      
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败，请重试');
    
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  const pkg = packages.find(p => p.id === selectedPackage);

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className:"ml-4 text-xl font-bold text-gray-900">账户充值</h1>
        </div>
      </div>

      {/* 充值礼包列表 */}
      <div className:"max-w-4xl mx-auto px-4 py-8">
        <div className:"mb-6">
          <h2 className:"text-lg font-semibold text-gray-900 mb-2">选择充值金额</h2>
          <p className:"text-sm text-gray-600">充值即送夺宝币，充值越多送得越多！</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (}
            <button
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg.id)}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              <div className:"text-center">
                <div className:"text-3xl font-bold text-gray-900 mb-2">
                  {pkg.amount} TJS
                </div>
                {pkg.bonus > 0 && (}
                  <div className:"inline-block bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    送 {pkg.bonus} 币
                  </div>
                )
                <div className:"text-sm text-gray-600">
                  共获得 <span className="font-bold text-blue-600">{pkg.totalCoins}</span> 夺宝币
                </div>
              </div>
            </button>
          ))
        </div>

        {/* 充值说明 */}
        <div className:"mt-8 bg-white rounded-xl p-6 shadow-md">
          <h3 className:"text-lg font-semibold text-gray-900 mb-4">充值说明</h3>
          <ul className:"space-y-2 text-sm text-gray-600">
            <li className:"flex items-start">
              <svg className:"w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>充值后需联系客服核销，1-5分钟到账</span>
            </li>
            <li className:"flex items-start">
              <svg className:"w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>支持 Alif Mobi 和 DC Bank 两种支付方式</span>
            </li>
            <li className:"flex items-start">
              <svg className:"w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>充值金额仅用于平台消费，不可提现</span>
            </li>
            <li className:"flex items-start">
              <svg className:"w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>如有疑问，请联系客服：@LuckyMartSupport</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 支付方式选择弹窗 */}
      {showPaymentModal && pkg && (}
        <div className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className:"bg-white rounded-2xl max-w-md w-full p-6">
            <div className:"text-center mb-6">
              <h3 className:"text-xl font-bold text-gray-900 mb-2">选择支付方式</h3>
              <p className:"text-sm text-gray-600">
                充值金额: <span className="font-bold text-blue-600">{pkg.amount} TJS</span>
                {pkg.bonus > 0 && ` + ${pkg.bonus} 币`}
              </p>
            </div>

            <div className:"space-y-3">
              <button
                onClick={() => handlePayment('alif_mobi')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <div className:"flex items-center justify-center">
                  <svg className:"w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Alif Mobi
                </div>
              </button>

              <button
                onClick={() => handlePayment('dc_bank')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                <div className:"flex items-center justify-center">
                  <svg className:"w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  DC Bank
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )
    </div>
  );


