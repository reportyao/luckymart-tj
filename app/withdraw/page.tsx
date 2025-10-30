'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateWithdrawFee } from '@/lib/utils';
import type { WithdrawRequest } from '@/types';

export default function WithdrawPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'alif_mobi' | 'dc_bank'>('alif_mobi');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [withdrawList, setWithdrawList] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchWithdrawList();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.data.balance);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const fetchWithdrawList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdraw/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWithdrawList(data.data.withdrawals);
      }
    } catch (error) {
      console.error('获取提现记录失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('请输入有效的提现金额');
      return;
    }

    if (withdrawAmount < 50) {
      alert('最低提现金额为 50 TJS');
      return;
    }

    if (!paymentAccount) {
      alert('请输入收款账号');
      return;
    }

    const fee = calculateWithdrawFee(withdrawAmount);
    const total = withdrawAmount + fee;

    if (total > balance) {
      alert(`余额不足。需要 ${total} TJS（含手续费 ${fee} TJS），当前余额 ${balance} TJS`);
      return;
    }

    if (!confirm(`确认提现 ${withdrawAmount} TJS？\n手续费: ${fee} TJS\n实际到账: ${withdrawAmount - fee} TJS`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          paymentMethod,
          paymentAccount
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('提现申请提交成功！\n\n审核通过后，1-3个工作日内到账。');
        setAmount('');
        setPaymentAccount('');
        fetchUserProfile();
        fetchWithdrawList();
      } else {
        alert(data.error || '提现申请失败');
      }
    } catch (error) {
      console.error('提现失败:', error);
      alert('提现失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fee = amount ? calculateWithdrawFee(parseFloat(amount)) : 0;
  const actualAmount = amount ? parseFloat(amount) - fee : 0;

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '待审核',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">提现</h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showHistory ? '返回提现' : '提现记录'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!showHistory ? (
          <>
            {/* 余额显示 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl mb-6">
              <div className="text-sm opacity-90 mb-2">可提现余额</div>
              <div className="text-4xl font-bold">{balance.toFixed(2)} TJS</div>
            </div>

            {/* 提现表单 */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提现金额 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="最低 50 TJS"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    min="50"
                    step="0.01"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-500">TJS</span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div>手续费: {fee.toFixed(2)} TJS (5% 或最低 2 TJS)</div>
                    <div className="font-semibold text-blue-600">实际到账: {actualAmount.toFixed(2)} TJS</div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支付方式 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('alif_mobi')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      paymentMethod === 'alif_mobi'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Alif Mobi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dc_bank')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      paymentMethod === 'dc_bank'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    DC Bank
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {paymentMethod === 'alif_mobi' ? '手机号' : '银行账号'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  placeholder={paymentMethod === 'alif_mobi' ? '+992XXXXXXXXX' : '请输入银行账号'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交申请'}
              </button>

              {/* 提现说明 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">提现说明</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 最低提现金额: 50 TJS</li>
                  <li>• 手续费: 5% 或最低 2 TJS</li>
                  <li>• 审核时间: 1-3个工作日</li>
                  <li>• 到账时间: 审核通过后1-3个工作日</li>
                </ul>
              </div>
            </form>
          </>
        ) : (
          /* 提现记录 */
          <div className="space-y-4">
            {withdrawList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">暂无提现记录</p>
              </div>
            ) : (
              withdrawList.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-5 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{item.amount.toFixed(2)} TJS</div>
                      <div className="text-sm text-gray-600">实际到账: {item.actualAmount.toFixed(2)} TJS</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>收款账号: {item.paymentAccount}</div>
                    <div>申请时间: {new Date(item.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
