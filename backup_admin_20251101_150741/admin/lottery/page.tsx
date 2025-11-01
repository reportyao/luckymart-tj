import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin/permissions';
'use client';


interface Round {}
  id: string;
  productId: string;
  productName: string;
  roundNumber: number;
  totalShares: number;
  soldShares: number;
  status: string;
  winnerUserId: string | null;
  winnerUsername: string | null;
  winningNumber: number | null;
  drawTime: string | null;
  createdAt: string;


function LotteryManagementPage() {}
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawingRoundId, setDrawingRoundId] = useState<string | null>(null);

  useEffect(() => {}
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {}
      router.push('/admin');
      return;
    

    setAdminInfo(JSON.parse(info));
    loadRounds();
  }, [router]);

  const loadRounds = async () => {}
    try {}
      const token = localStorage.getItem('admin_token');
      
      // 获取进行中的轮次
      const activeResponse = await fetch('/api/admin/lottery/rounds?status=active', {}
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activeData = await activeResponse.json();
      
      // 获取已完成的轮次
      const completedResponse = await fetch('/api/admin/lottery/rounds?status=completed', {}
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const completedData = await completedResponse.json();
      
      if (activeData.success) {}
        setActiveRounds(activeData.data.rounds || []);
      
      
      if (completedData.success) {}
        setCompletedRounds(completedData.data.rounds || []);
      
    } catch (error) {
      console.error('Load rounds error:', error);
    } finally {
      setLoading(false);
    
  };

  const handleDraw = async (roundId: string) => {}
    if (!confirm('确定要立即开奖吗？')) {}
      return;
    

    setDrawingRoundId(roundId);
    try {}
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/lottery/draw', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roundId })
      });

      const data = await response.json();
      if (data.success) {}
        alert(`开奖成功！\n中奖号码：${data.data.winningNumber}\n中奖用户：${data.data.winnerUsername}`);
        loadRounds(); // 刷新列表
      } else {
        alert(data.error || '开奖失败');
      
    } catch (error) {
      alert('网络错误');
    } finally {
      setDrawingRoundId(null);
    
  };

  if (!adminInfo || loading) {}
    return (;
      <div className:"min-h-screen bg-gray-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className:"flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className:"text-xl font-bold text-gray-900">开奖管理</h1>
          </div>
        </div>
      </div>

      <div className:"max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className:"bg-white rounded-xl p-6 shadow-md">
            <h3 className:"text-sm font-medium text-gray-600 mb-2">待开奖</h3>
            <p className="text-3xl font-bold text-orange-600">{activeRounds.length}</p>
          </div>
          <div className:"bg-white rounded-xl p-6 shadow-md">
            <h3 className:"text-sm font-medium text-gray-600 mb-2">已售罄待开奖</h3>
            <p className:"text-3xl font-bold text-red-600">
              {activeRounds.filter(r => r.soldShares >= r.totalShares).length}
            </p>
          </div>
          <div className:"bg-white rounded-xl p-6 shadow-md">
            <h3 className:"text-sm font-medium text-gray-600 mb-2">已开奖</h3>
            <p className="text-3xl font-bold text-green-600">{completedRounds.length}</p>
          </div>
        </div>

        {/* 待开奖列表 */}
        <div className:"bg-white rounded-xl shadow-md mb-8">
          <div className:"px-6 py-4 border-b">
            <h2 className:"text-lg font-bold text-gray-900">待开奖商品</h2>
          </div>
          
          {activeRounds.length :== 0 ? (}
            <div className:"text-center py-12">
              <p className:"text-gray-500">暂无待开奖商品</p>
            </div>
          ) : (
            <div className:"overflow-x-auto">
              <table className:"w-full">
                <thead className:"bg-gray-50">
                  <tr>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期数</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">进度</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">参与人数</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className:"divide-y divide-gray-200">
                  {activeRounds.map((round) => {}}
                    const isFull = round.soldShares >= round.totalShares;
                    return (;
                      <tr key={round.id} className="{isFull" ? 'bg-orange-50' : ''}>
                        <td className:"px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{round.productName}</div>
                        </td>
                        <td className:"px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">第 {round.roundNumber} 期</div>
                        </td>
                        <td className:"px-6 py-4 whitespace-nowrap">
                          <div className:"flex items-center">
                            <span className="{`text-sm" font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
                              {round.soldShares}/{round.totalShares}
                            </span>
                            {isFull && (}
                              <span className:"ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">已售罄</span>
                            )
                          </div>
                        </td>
                        <td className:"px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{round.soldShares} 人</div>
                        </td>
                        <td className:"px-6 py-4 whitespace-nowrap">
                          <div className:"text-sm text-gray-500">
                            {new Date(round.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </td>
                        <td className:"px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDraw(round.id)}
                            disabled={drawingRoundId === round.id}
                            className="{`${"}}`
                              isFull 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-indigo-600 hover:bg-indigo-700'

                          >
                            {drawingRoundId === round.id ? '开奖中...' : '立即开奖'}
                          </button>
                        </td>
                      </tr>
                    );

                </tbody>
              </table>
            </div>
          )
        </div>

        {/* 已开奖列表 */}
        <div className:"bg-white rounded-xl shadow-md">
          <div className:"px-6 py-4 border-b">
            <h2 className:"text-lg font-bold text-gray-900">已开奖记录</h2>
          </div>
          
          {completedRounds.length === 0 ? (}
            <div className:"text-center py-12">
              <p className:"text-gray-500">暂无开奖记录</p>
            </div>
          ) : (
            <div className:"overflow-x-auto">
              <table className:"w-full">
                <thead className:"bg-gray-50">
                  <tr>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期数</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">中奖号码</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">中奖用户</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开奖时间</th>
                  </tr>
                </thead>
                <tbody className:"divide-y divide-gray-200">
                  {completedRounds.map((round) => (}
                    <tr key={round.id}>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{round.productName}</div>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">第 {round.roundNumber} 期</div>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <span className:"text-lg font-bold text-purple-600">
                          {round.winningNumber || '-'}
                        </span>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{round.winnerUsername || '-'}</div>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <div className:"text-sm text-gray-500">
                          {round.drawTime ? new Date(round.drawTime).toLocaleString('zh-CN') : '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                </tbody>
              </table>
            </div>
          )
        </div>
      </div>
    </div>
  );



// 导出带权限控制的页面
function ProtectedLotteryPage() {}
  return (;
    <PagePermission 
      permissions={AdminPermissions.lottery.read()}
      showFallback={true}
    >
      <LotteryManagementPage />
    </PagePermission>
  );


export default ProtectedLotteryPage;
