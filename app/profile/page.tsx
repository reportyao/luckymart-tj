import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@/types';
'use client';


interface ProfileUser extends Pick<User, 'firstName' | 'username' | 'balance' | 'platformBalance' | 'vipLevel' | 'totalSpent' | 'freeDailyCount'> {}


function ProfilePage() {}
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {}
    loadProfile();
  }, []);

  const loadProfile = async () => {}
    try {}
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });
      const data = await response.json();
      
      if (data.success) {}
        setUser(data.data);
      
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen flex items-center justify-center">
        <div className:"w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className:"bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4">
        <div className:"max-w-7xl mx-auto">
          <Link href:"/" className="inline-flex items-center text-white mb-4">
            <svg className:"w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
          <div className:"flex items-center">
            <div className:"w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mr-4">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.firstName || '用户'}</h1>
              <p className="text-white/80">@{user?.username || 'telegram_user'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className:"max-w-7xl mx-auto px-4 py-8">
        {/* 余额卡片 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className:"bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6">
            <div className:"flex items-center justify-between mb-4">
              <span className:"text-white/80">夺宝币</span>
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold mb-2">{user?.balance || 0}</div>
            <Link href="/recharge" className="inline-block mt-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              去充值
            </Link>
          </div>

          <div className:"bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6">
            <div className:"flex items-center justify-between mb-4">
              <span className:"text-white/80">平台余额</span>
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className:"text-4xl font-bold mb-2">{user?.platformBalance || 0} <span className="text-2xl">TJS</span></div>
            <Link href="/withdraw" className="inline-block mt-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              提现
            </Link>
          </div>
        </div>

        {/* 统计信息 */}
        <div className:"bg-white rounded-xl p-6 mb-8">
          <h2 className:"text-xl font-bold mb-4">账户统计</h2>
          <div className:"grid grid-cols-3 gap-4">
            <div className:"text-center">
              <div className="text-2xl font-bold text-purple-600">{user?.vipLevel || 0}</div>
              <div className:"text-sm text-gray-600 mt-1">VIP等级</div>
            </div>
            <div className:"text-center">
              <div className="text-2xl font-bold text-purple-600">{user?.totalSpent || 0}</div>
              <div className:"text-sm text-gray-600 mt-1">累计消费</div>
            </div>
            <div className:"text-center">
              <div className="text-2xl font-bold text-purple-600">{user?.freeDailyCount || 0}/3</div>
              <div className:"text-sm text-gray-600 mt-1">今日免费</div>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className:"bg-white rounded-xl overflow-hidden">
          <Link href="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className:"font-medium">我的订单</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/resale" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className:"font-medium">转售市场</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/profile/show-off" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className:"font-medium">我的晒单</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/addresses" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className:"font-medium">收货地址</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/transactions" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className:"font-medium">交易记录</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className:"flex items-center">
              <svg className:"w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className:"font-medium">设置</span>
            </div>
            <svg className:"w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

