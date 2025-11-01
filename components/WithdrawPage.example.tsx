import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TransactionList from '@/components/TransactionList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User, WithdrawRequest, Transaction } from '@/types';
// 提现页面完整示例
'use client';


export default function WithdrawPage() {}
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('withdraw');

  // 获取用户资料
  const fetchUserProfile = async () => {}
    try {}
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {}
        headers: {}
          'Authorization': `Bearer ${token}`

      });
      const data = await response.json();
      
      if (data.success) {}
        setUser(data.data);
        setBalance(data.data.balance || data.data.coinBalance);
      } else {
        throw new Error(data.error || '获取用户信息失败');
      
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setError('获取用户信息失败，请刷新页面重试');
    
  };

  // 获取提现记录
  const fetchWithdrawHistory = async () => {}
    try {}
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdraw/list', {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });
      const data = await response.json();
      
      if (data.success) {}
        setWithdrawHistory(data.data.withdrawals || []);
      } else {
        throw new Error(data.error || '获取提现记录失败');
      
    } catch (error) {
      console.error('获取提现记录失败:', error);
    
  };

  useEffect(() => {}
    const loadData = async () => {}
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchWithdrawHistory()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // 处理提现提交
  const handleWithdrawSubmit = async (data: WithdrawFormData): Promise<void> => {}
    try {}
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdraw/create', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}
          amount: parseFloat(data.amount),
          withdrawMethod: data.method,
          accountInfo: {}
            accountNumber: data.accountInfo.accountNumber,
            accountName: data.accountInfo.accountName,
            bankName: data.accountInfo.bankName,
            phoneNumber: data.accountInfo.phoneNumber
          },
          password: data.password // 在生产环境中应该加密传输
        })
      });

      const result = await response.json();
      
      if (result.success) {}
        // 显示成功消息
        alert('提现申请提交成功！\n审核通过后，1-3个工作日内到账。');
        
        // 刷新数据
        await Promise.all([
          fetchUserProfile(),
          fetchWithdrawHistory()
        ]);
        
        // 切换到提现记录标签页
        setActiveTab('history');
      } else {
        throw new Error(result.error || '提现申请失败');
      
    } catch (error) {
      console.error('提现失败:', error);
      throw error; // 让组件处理错误;
    
  };

  // 获取状态显示文本
  const getStatusText = (status: string) => {}
    const statusMap: Record<string, string> = {}
      pending: '待审核',
      approved: '已审核',
      rejected: '已拒绝',
      completed: '已完成'
    };
    return statusMap[status] || status;
  };

  // 获取状态显示颜色
  const getStatusColor = (status: string) => {}
    const colorMap: Record<string, string> = {}
      pending: 'text-yellow-600 bg-yellow-100',
      approved: 'text-blue-600 bg-blue-100',
      rejected: 'text-red-600 bg-red-100',
      completed: 'text-green-600 bg-green-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className:"text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  if (error) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className:"text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className:"flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className:"text-xl font-bold text-gray-900">提现</h1>
          </div>
          <div className:"text-sm text-gray-500">
            当前余额: <span className="font-semibold text-blue-600">{balance.toFixed(2)} TJS</span>
          </div>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className:"grid w-full grid-cols-2">
            <TabsTrigger value:"withdraw">提现申请</TabsTrigger>
            <TabsTrigger value:"history">提现记录</TabsTrigger>
          </TabsList>

          {/* 提现申请标签页 */}
          <TabsContent value:"withdraw" className="mt-6">
            <WithdrawForm
              balance={balance}
              user={user}
              onSubmit={handleWithdrawSubmit}
              loading={loading}
              minWithdrawAmount={50}
              feeRate={0.05}
              minFee={2}
            />
          </TabsContent>

          {/* 提现记录标签页 */}
          <TabsContent value:"history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>提现记录</CardTitle>
                <CardDescription>
                  查看您的提现申请记录和状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawHistory.length :== 0 ? (}
                  <div className:"text-center py-12">
                    <div className:"text-gray-300 text-6xl mb-4">📄</div>
                    <p className:"text-gray-500">暂无提现记录</p>
                    <Button 
                      onClick={() => setActiveTab('withdraw')}
                      className:"mt-4"
                      variant="outline"
                    >
                      立即提现
                    </Button>
                  </div>
                ) : (
                  <div className:"space-y-4">
                    {withdrawHistory.map((item) => (}
                      <div 
                        key={item.id} 
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className:"flex justify-between items-start mb-3">
                          <div>
                            <div className:"text-lg font-bold text-gray-900">
                              {item.amount.toFixed(2)} TJS
                            </div>
                            <div className:"text-sm text-gray-600">
                              手续费: {item.fee.toFixed(2)} TJS
                            </div>
                            <div className:"text-sm font-medium text-blue-600">
                              实际到账: {item.actualAmount.toFixed(2)} TJS
                            </div>
                          </div>
                          <span 
                            className="{`px-3" py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}
                          >
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">收款账号:</span>
                            <br />
                            {item.accountInfo?.accountName} ({item.accountInfo?.accountNumber})
                          </div>
                          <div>
                            <span className="font-medium">提现方式:</span>
                            <br />
                            {item.withdrawMethod === 'alif_mobi' && 'Alif Mobi'}
                            {item.withdrawMethod === 'dc_bank' && 'DC Bank'}
                            {item.withdrawMethod === 'bank_card' && '银行卡'}
                            {item.withdrawMethod === 'alipay' && '支付宝'}
                            {item.withdrawMethod === 'wechat' && '微信'}
                          </div>
                          <div>
                            <span className="font-medium">申请时间:</span>
                            <br />
                            {new Date(item.createdAt).toLocaleString('zh-CN')}
                          </div>
                          {item.processedAt && (}
                            <div>
                              <span className="font-medium">处理时间:</span>
                              <br />
                              {new Date(item.processedAt).toLocaleString('zh-CN')}
                            </div>
                          )
                        </div>
                        
                        {item.rejectReason && (}
                          <div className:"mt-3 p-3 bg-red-50 rounded border border-red-200">
                            <p className:"text-sm text-red-700">
                              <span className="font-medium">拒绝原因:</span> {item.rejectReason}
                            </p>
                          </div>
                        )
                        
                        {item.adminNote && (}
                          <div className:"mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className:"text-sm text-blue-700">
                              <span className="font-medium">备注:</span> {item.adminNote}
                            </p>
                          </div>
                        )
                      </div>
                    ))
                  </div>
                )
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
