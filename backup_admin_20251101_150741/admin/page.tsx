import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
'use client';


function AdminLoginPage() {}
  const { t } = useTranslation('admin');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {}
    e.preventDefault();
    setError('');
    setLoading(true);

    try {}
      const response = await fetch('/api/admin/login', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {}
        // 保存 token 和管理员信息
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_info', JSON.stringify(data.data.admin));
        
        // 跳转到管理后台
        router.push('/admin/dashboard');
      } else {
        setError(data.error || t('admin:login.login_failed'));
      
    } catch (error) {
      console.error(t('admin:login.login_failed') + ':', error);
      setError(t('admin:login.login_failed_retry'));
    } finally {
      setLoading(false);
    
  };

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className:"max-w-md w-full">
        {/* Logo 和标题 */}
        <div className:"text-center mb-8">
          <div className:"bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <svg className:"w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('admin:login.title')}</h1>
          <p className="text-indigo-200">{t('admin:login.subtitle')}</p>
        </div>

        {/* 登录表单 */}
        <div className:"bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('admin:login.admin_login')}</h2>

          {error && (}
            <div className:"mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )

          <form onSubmit={handleSubmit}>
            <div className:"mb-4">
              <label className:"block text-sm font-medium text-gray-700 mb-2">
                {t('admin:login.username')}
              </label>
              <input
                type:"text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder={t('admin:login.please_enter_username')}
                required
              />
            </div>

            <div className:"mb-6">
              <label className:"block text-sm font-medium text-gray-700 mb-2">
                {t('admin:login.password')}
              </label>
              <input
                type:"password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder={t('admin:login.please_enter_password')}
                required
              />
            </div>

            <button
              type:"submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? t('admin:login.logging_in') : t('admin:login.login')}
            </button>
          </form>

          <div className:"mt-6 text-center text-sm text-gray-500">
            <p>默认账号: admin / admin123456</p>
          </div>
        </div>

        {/* 底部说明 */}
        <div className:"mt-6 text-center text-sm text-indigo-200">
          <p>LuckyMart TJ © 2025 - 运营管理系统</p>
        </div>
      </div>
    </div>
  );

