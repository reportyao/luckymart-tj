import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import Link from 'next/link';
'use client';


interface SystemSettings {}
  siteName: string;
  minRechargeAmount: number;
  maxRechargeAmount: number;
  minWithdrawAmount: number;
  maxWithdrawAmount: number;
  withdrawFeeRate: number;
  freeDrawsPerDay: number;
  enableNotifications: boolean;
  enableTelegramBot: boolean;
  maintenanceMode: boolean;
  // 转售价格限制设置
  resale_min_discount_rate: number;
  resale_max_discount_rate: number;
  resale_min_price: number;
  resale_max_price: number;
  resale_platform_fee_rate: number;
  // 输入验证设置
  max_account_length: number;
  max_description_length: number;
  max_phone_length: number;
  max_address_length: number;
  enable_price_limits: boolean;
  enable_input_sanitization: boolean;
  enable_amount_validation: boolean;
  // 银行充值信息
  rechargeBankName: string;
  rechargeBankAccountNumber: string;
  rechargeBankAccountHolder: string;
  rechargeBankBranch: string;
  rechargeInstructions: string;


function AdminSettings() {}
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({}
    siteName: 'LuckyMart TJ',
    minRechargeAmount: 10,
    maxRechargeAmount: 10000,
    minWithdrawAmount: 50,
    maxWithdrawAmount: 5000,
    withdrawFeeRate: 0.05,
    freeDrawsPerDay: 3,
    enableNotifications: true,
    enableTelegramBot: true,
    maintenanceMode: false,
    // 转售价格限制设置默认值
    resale_min_discount_rate: 0.10,
    resale_max_discount_rate: 0.90,
    resale_min_price: 1.00,
    resale_max_price: 99999.00,
    resale_platform_fee_rate: 0.02,
    // 输入验证设置默认值
    max_account_length: 100,
    max_description_length: 500,
    max_phone_length: 20,
    max_address_length: 200,
    enable_price_limits: true,
    enable_input_sanitization: true,
    enable_amount_validation: true,
    // 银行充值信息默认值
    rechargeBankName: '',
    rechargeBankAccountNumber: '',
    rechargeBankAccountHolder: '',
    rechargeBankBranch: '',
    rechargeInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {}
    const token = localStorage.getItem('admin_token');
    if (!token) {}
      router.push('/admin');
      return;
    
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {}
    try {}
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings', {}
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {}
        const data = await response.json();
        if (data.settings) {}
          setSettings(data.settings);
        
      
    } catch (error) {
      console.error('获取设置失败:', error);
    
  };

  const handleSave = async () => {}
    setLoading(true);
    setMessage('');

    try {}
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings', {}
        method: 'POST',
        headers: {}
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {}
        setMessage('设置保存成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || '保存失败');
      
    } catch (error) {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    
  };

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
            <h1 className:"text-xl font-bold text-gray-900">系统设置</h1>
          </div>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8">
        {/* 成功/错误消息 */}
        {message && (}
          <div className="{`mb-6" p-4 rounded-lg ${}}`
            message.includes('成功') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'

            {message}
          </div>
        )

        <div className:"space-y-6">
          {/* 基本设置 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">基本设置</h2>
            
            <div className:"space-y-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  站点名称
                </label>
                <input
                  type:"text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 财务设置 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">财务设置</h2>
            
            <div className:"space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最小充值金额（索莫尼）
                  </label>
                  <input
                    type:"number"
                    value={settings.minRechargeAmount}
                    onChange={(e) => setSettings({ ...settings, minRechargeAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最大充值金额（索莫尼）
                  </label>
                  <input
                    type:"number"
                    value={settings.maxRechargeAmount}
                    onChange={(e) => setSettings({ ...settings, maxRechargeAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最小提现金额（索莫尼）
                  </label>
                  <input
                    type:"number"
                    value={settings.minWithdrawAmount}
                    onChange={(e) => setSettings({ ...settings, minWithdrawAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最大提现金额（索莫尼）
                  </label>
                  <input
                    type:"number"
                    value={settings.maxWithdrawAmount}
                    onChange={(e) => setSettings({ ...settings, maxWithdrawAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    提现手续费率（0-1）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    value={settings.withdrawFeeRate}
                    onChange={(e) => setSettings({ ...settings, withdrawFeeRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className:"mt-1 text-xs text-gray-500">
                    例如：0.05 : 5%手续费
                  </p>
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    每日免费抽奖次数
                  </label>
                  <input
                    type:"number"
                    value={settings.freeDrawsPerDay}
                    onChange={(e) => setSettings({ ...settings, freeDrawsPerDay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 转售价格限制设置 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">转售价格限制设置</h2>
            <p className:"text-sm text-gray-600 mb-4">
              设置转售价格的上下限，防止0价格或天价恶意转售
            </p>
            
            <div className:"space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最低折扣率（0-1）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    min:"0"
                    max:"1"
                    value={settings.resale_min_discount_rate}
                    onChange={(e) => setSettings({ ...settings, resale_min_discount_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className:"mt-1 text-xs text-gray-500">
                    例如：0.10 : 最低10%折扣（转售价不高于市场价的90%）
                  </p>
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最高折扣率（0-1）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    min:"0"
                    max:"1"
                    value={settings.resale_max_discount_rate}
                    onChange={(e) => setSettings({ ...settings, resale_max_discount_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className:"mt-1 text-xs text-gray-500">
                    例如：0.90 : 最高90%折扣（转售价不低于市场价的10%）
                  </p>
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最低价格（TJS）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    min:"0"
                    value={settings.resale_min_price}
                    onChange={(e) => setSettings({ ...settings, resale_min_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    最高价格（TJS）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    min:"0"
                    value={settings.resale_max_price}
                    onChange={(e) => setSettings({ ...settings, resale_max_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    转售平台手续费率（0-1）
                  </label>
                  <input
                    type:"number"
                    step:"0.01"
                    min:"0"
                    max:"1"
                    value={settings.resale_platform_fee_rate}
                    onChange={(e) => setSettings({ ...settings, resale_platform_fee_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className:"mt-1 text-xs text-gray-500">
                    例如：0.02 : 2%平台手续费
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 输入验证设置 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">输入验证设置</h2>
            <p className:"text-sm text-gray-600 mb-4">
              控制各种输入字段的长度限制和验证规则
            </p>
            
            <div className:"space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    账户信息最大长度
                  </label>
                  <input
                    type:"number"
                    value={settings.max_account_length}
                    onChange={(e) => setSettings({ ...settings, max_account_length: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    描述信息最大长度
                  </label>
                  <input
                    type:"number"
                    value={settings.max_description_length}
                    onChange={(e) => setSettings({ ...settings, max_description_length: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    电话号码最大长度
                  </label>
                  <input
                    type:"number"
                    value={settings.max_phone_length}
                    onChange={(e) => setSettings({ ...settings, max_phone_length: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className:"block text-sm font-medium text-gray-700 mb-2">
                    地址信息最大长度
                  </label>
                  <input
                    type:"number"
                    value={settings.max_address_length}
                    onChange={(e) => setSettings({ ...settings, max_address_length: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className:"mt-6">
              <h3 className:"text-md font-medium text-gray-900 mb-3">验证开关</h3>
              <div className:"space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <div className:"font-medium text-gray-900">启用价格限制</div>
                    <div className:"text-sm text-gray-500">对转售价格进行上下限限制</div>
                  </div>
                  <input
                    type:"checkbox"
                    checked={settings.enable_price_limits}
                    onChange={(e) => setSettings({ ...settings, enable_price_limits: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <div className:"font-medium text-gray-900">启用输入数据清理</div>
                    <div className:"text-sm text-gray-500">自动清理和验证用户输入数据</div>
                  </div>
                  <input
                    type:"checkbox"
                    checked={settings.enable_input_sanitization}
                    onChange={(e) => setSettings({ ...settings, enable_input_sanitization: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <div className:"font-medium text-gray-900">启用金额验证</div>
                    <div className:"text-sm text-gray-500">对所有金额输入进行严格验证</div>
                  </div>
                  <input
                    type:"checkbox"
                    checked={settings.enable_amount_validation}
                    onChange={(e) => setSettings({ ...settings, enable_amount_validation: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 银行充值信息 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">银行充值信息</h2>
            <p className:"text-sm text-gray-600 mb-4">
              用户通过银行转账充值时，将显示这些信息
            </p>
            
            <div className:"space-y-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  银行名称
                </label>
                <input
                  type:"text"
                  value={settings.rechargeBankName}
                  onChange={(e) => setSettings({ ...settings, rechargeBankName: e.target.value })}
                  placeholder:"例如：塔吉克斯坦国家银行"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  银行账号
                </label>
                <input
                  type:"text"
                  value={settings.rechargeBankAccountNumber}
                  onChange={(e) => setSettings({ ...settings, rechargeBankAccountNumber: e.target.value })}
                  placeholder:"输入银行账号"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  账户持有人姓名
                </label>
                <input
                  type:"text"
                  value={settings.rechargeBankAccountHolder}
                  onChange={(e) => setSettings({ ...settings, rechargeBankAccountHolder: e.target.value })}
                  placeholder:"输入账户持有人姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  银行分支机构/地址
                </label>
                <input
                  type:"text"
                  value={settings.rechargeBankBranch}
                  onChange={(e) => setSettings({ ...settings, rechargeBankBranch: e.target.value })}
                  placeholder:"例如：杜尚别中心支行"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  充值说明
                </label>
                <textarea
                  value={settings.rechargeInstructions}
                  onChange={(e) => setSettings({ ...settings, rechargeInstructions: e.target.value })}
                  placeholder:"充值时的注意事项和说明"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className:"mt-1 text-xs text-gray-500">
                  此内容将显示在用户充值页面
                </p>
              </div>
            </div>
          </div>

          {/* 功能开关 */}
          <div className:"bg-white rounded-lg shadow p-6">
            <h2 className:"text-lg font-semibold text-gray-900 mb-4">功能开关</h2>
            
            <div className:"space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <div className:"font-medium text-gray-900">启用通知</div>
                  <div className:"text-sm text-gray-500">向用户推送中奖、订单等通知</div>
                </div>
                <input
                  type:"checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <div className:"font-medium text-gray-900">启用 Telegram Bot</div>
                  <div className:"text-sm text-gray-500">用户可通过 Telegram Bot 接收通知和操作</div>
                </div>
                <input
                  type:"checkbox"
                  checked={settings.enableTelegramBot}
                  onChange={(e) => setSettings({ ...settings, enableTelegramBot: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100">
                <div>
                  <div className:"font-medium text-red-900">维护模式</div>
                  <div className:"text-sm text-red-600">开启后，用户将无法访问网站</div>
                </div>
                <input
                  type:"checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className:"flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );



// 导出带权限控制的页面
function ProtectedSettingsPage() {}
  return (;
    <PagePermission 
      permissions={AdminPermissions.settings.read()}
      showFallback={true}
    >
      <AdminSettings />
    </PagePermission>
  );


export default ProtectedSettingsPage;
