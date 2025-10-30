'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions || []);
      }
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      recharge: '充值',
      lottery: '参与夺宝',
      win: '中奖奖励',
      resale_income: '转售收入',
      resale_purchase: '购买转售',
      withdraw: '提现',
      refund: '退款'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    if (['recharge', 'win', 'resale_income', 'refund'].includes(type)) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/profile" className="mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">交易记录</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-20 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-md">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 border-b hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{getTypeLabel(tx.type)}</h3>
                    <p className="text-sm text-gray-500 mt-1">{tx.description}</p>
                  </div>
                  <span className={`text-lg font-bold ${getTypeColor(tx.type)}`}>
                    {['recharge', 'win', 'resale_income', 'refund'].includes(tx.type) ? '+' : '-'}
                    {Math.abs(tx.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>余额: {tx.balance}</span>
                  <span>{new Date(tx.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
