'use client';

import { useState } from 'react';
import Link from 'next/link';
import TransactionList from '@/components/TransactionList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, List } from 'lucide-react';

export default function TransactionListPage() {
  const [currentView, setCurrentView] = useState<'enhanced' | 'simple'>('enhanced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/profile" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{currentView === 'enhanced' ? '交易记录详情' : '交易记录'}</h1>
          </div>
          
          {/* 视图切换按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('simple')}
              className="flex items-center space-x-2"
            >
              <List className="w-4 h-4" />
              <span>简单视图</span>
            </Button>
            <Button
              variant={currentView === 'enhanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('enhanced')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>详细视图</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'enhanced' ? (
          <div className="space-y-6">
            {/* 使用新的 TransactionList 组件 */}
            <TransactionList 
              pageSize={10}
              showExport={true}
              showStats={true}
              defaultTypeFilter="all"
              className="enhanced-transaction-list"
              onExport={(data) => {
                console.log('导出交易数据:', data);
                // 可以在这里实现具体的导出逻辑，比如下载CSV文件
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "交易ID,类型,金额,状态,描述,时间\n"
                  + data.map(row => 
                      `${row.transactionId},${row.type},${row.amount},${row.status},${row.description},${row.createDate}`
                    ).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onPageChange={(page) => {
                console.log('切换到页面:', page);
                // 可以在这里实现分页逻辑，比如滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onFilter={(filters) => {
                console.log('筛选条件:', filters);
                // 可以在这里实现筛选逻辑
              }}
              onError={(error) => {
                console.error('交易数据加载错误:', error);
                // 可以在这里显示错误提示
              }}
            />
          </div>
        ) : (
          // 简单视图 - 使用原有的简单实现
          <SimpleTransactionView />
        )}
      </div>
    </div>
  );
}

// 简单的交易记录视图（原有的实现）
function SimpleTransactionView() {
  const [loading] = useState(false);
  const [transactions] = useState([
    {
      id: '1',
      type: 'recharge',
      amount: 100,
      balance: 250,
      description: '充值',
      createdAt: '2025-11-01T10:30:00Z'
    },
    {
      id: '2', 
      type: 'consume',
      amount: -25,
      balance: 150,
      description: '购买彩票',
      createdAt: '2025-10-31T15:20:00Z'
    },
    {
      id: '3',
      type: 'reward', 
      amount: 5,
      balance: 175,
      description: '邀请奖励',
      createdAt: '2025-10-31T14:45:00Z'
    },
    {
      id: '4',
      type: 'withdraw',
      amount: -30,
      balance: 170,
      description: '提现申请',
      createdAt: '2025-10-30T09:15:00Z'
    }
  ]);

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      recharge: '充值',
      consume: '消费',
      withdraw: '提现',
      reward: '奖励'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    if (['recharge', 'reward'].includes(type)) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">交易记录</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 text-gray-400 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    ['recharge', 'reward'].includes(tx.type) ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{getTypeLabel(tx.type)}</h3>
                    <p className="text-sm text-gray-500">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getTypeColor(tx.type)}`}>
                    {['recharge', 'reward'].includes(tx.type) ? '+' : '-'}
                    {Math.abs(tx.amount)}
                  </span>
                  <p className="text-sm text-gray-500">余额: {tx.balance}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 说明文字 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">简单视图说明</h3>
        <p className="text-blue-800 text-sm">
          这是原有的简单交易记录视图，展示了基本的交易信息展示方式。
          点击右上角的"详细视图"按钮可以查看功能更丰富的交易列表组件。
        </p>
      </Card>
    </div>
  );
}