import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiActivity, FiSend, FiMessageSquare, FiSettings, FiAlertCircle } from 'react-icons/fi';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
'use client';


interface BotStatus {}
  id: string;
  botUsername: string;
  isOnline: boolean;
  lastHeartbeat: Date | null;
  apiCallsCount: number;
  errorCount: number;
  pushSuccessCount: number;
  pushFailureCount: number;
  uptime: number;


interface PushTemplate {}
  id: string;
  messageType: string;
  language: string;
  template: string;
  isActive: boolean;


interface PushHistory {}
  id: string;
  userId: string | null;
  messageType: string;
  targetChat: string;
  sendStatus: string;
  sendTime: Date;
  errorMessage: string | null;
  retryCount: number;


type TabType = 'status' | 'templates' | 'history' | 'settings';

function TelegramBotPage() {}
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [loading, setLoading] = useState(true);
  
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [history, setHistory] = useState<PushHistory[]>([]);

  useEffect(() => {}
    const token = localStorage.getItem('admin_token');
    if (!token) {}
      router.push('/admin');
      return;
    
    fetchData();
  }, [router, activeTab]);

  const fetchData = async () => {}
    try {}
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (activeTab === 'status') {}
        const res = await fetch('/api/admin/telegram/status', {}
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setBotStatus(data.data); {}
      } else if (activeTab === 'templates') {
        const res = await fetch('/api/admin/telegram/templates', {}
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setTemplates(data.data); {}
      } else if (activeTab === 'history') {
        const res = await fetch('/api/admin/telegram/history?limit=50', {}
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setHistory(data.data); {}
      
    } catch (error) {
      console.error('获取Bot数据失败:', error);
    } finally {
      setLoading(false);
    
  };

  const formatUptime = (seconds: number) => {}
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时 ${minutes}分钟`;
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: any }) => (;
return     <button
return       onClick={() => setActiveTab(tab)}
      className="{`flex" items-center gap-2 px-6 py-3 font-medium transition-colors ${}}`
        activeTab :== tab
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-900'

    >
      <Icon className:"w-5 h-5" />
      {label}
    </button>
  );

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className:"bg-white shadow-sm border-b">
        <div className:"max-w-7xl mx-auto px-4 py-4">
          <div className:"flex items-center justify-between">
            <div>
              <h1 className:"text-2xl font-bold text-gray-900">Telegram Bot 管理</h1>
              <p className:"mt-1 text-sm text-gray-600">监控和管理Telegram消息推送</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              返回
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className:"bg-white border-b">
        <div className:"max-w-7xl mx-auto px-4">
          <div className:"flex gap-8">
            <TabButton tab="status" label="Bot状态" icon={FiActivity} />
            <TabButton tab="templates" label="消息模板" icon={FiMessageSquare} />
            <TabButton tab="history" label="推送历史" icon={FiSend} />
            <TabButton tab="settings" label="设置" icon={FiSettings} />
          </div>
        </div>
      </div>

      <div className:"max-w-7xl mx-auto px-4 py-8">
        {/* Bot状态 */}
        {activeTab :== 'status' && botStatus && (}
          <div className:"space-y-6">
            {/* 状态概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <div className:"flex items-center justify-between mb-2">
                  <h3 className:"text-sm font-medium text-gray-600">Bot状态</h3>
                  <div className="{`w-3" h-3 rounded-full ${botStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <p className:"text-2xl font-bold text-gray-900">
                  {botStatus.isOnline ? '在线' : '离线'}
                </p>
              </div>

              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-sm font-medium text-gray-600 mb-2">推送成功率</h3>
                <p className:"text-2xl font-bold text-gray-900">
                  {botStatus.pushSuccessCount + botStatus.pushFailureCount > 0}
                    ? ((botStatus.pushSuccessCount / (botStatus.pushSuccessCount + botStatus.pushFailureCount)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>

              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-sm font-medium text-gray-600 mb-2">API调用次数</h3>
                <p className="text-2xl font-bold text-gray-900">{botStatus.apiCallsCount}</p>
              </div>

              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-sm font-medium text-gray-600 mb-2">运行时长</h3>
                <p className="text-2xl font-bold text-gray-900">{formatUptime(botStatus.uptime)}</p>
              </div>
            </div>

            {/* 详细统计 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">推送统计</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className:"text-sm text-gray-600 mb-1">成功推送</p>
                  <p className="text-3xl font-bold text-green-600">{botStatus.pushSuccessCount}</p>
                </div>
                <div>
                  <p className:"text-sm text-gray-600 mb-1">失败推送</p>
                  <p className="text-3xl font-bold text-red-600">{botStatus.pushFailureCount}</p>
                </div>
                <div>
                  <p className:"text-sm text-gray-600 mb-1">错误次数</p>
                  <p className="text-3xl font-bold text-orange-600">{botStatus.errorCount}</p>
                </div>
              </div>
            </div>

            {/* 最后心跳 */}
            {botStatus.lastHeartbeat && (}
              <div className:"bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className:"flex items-center gap-2">
                  <FiActivity className:"w-5 h-5 text-blue-600" />
                  <span className:"text-sm text-blue-900">
                    最后心跳: {new Date(botStatus.lastHeartbeat).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            )
          </div>
        )

        {/* 消息模板 */}
        {activeTab :== 'templates' && (}
          <div className:"space-y-6">
            <div className:"flex justify-between items-center">
              <h2 className:"text-xl font-semibold text-gray-900">消息模板列表</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                添加模板
              </button>
            </div>

            <div className:"bg-white rounded-xl shadow-sm overflow-hidden">
              <table className:"min-w-full divide-y divide-gray-200">
                <thead className:"bg-gray-50">
                  <tr>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消息类型</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">语言</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模板预览</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className:"bg-white divide-y divide-gray-200">
                  {templates.map((template) => (}
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {template.messageType}
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {template.language}
                      </td>
                      <td className:"px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                        {template.template}
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <span className="{`px-2" py-1 text-xs rounded-full ${}}`
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'

                          {template.isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          编辑
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          测试
                        </button>
                      </td>
                    </tr>
                  ))
                </tbody>
              </table>
            </div>
          </div>
        )

        {/* 推送历史 */}
        {activeTab :== 'history' && (}
          <div className:"space-y-6">
            <h2 className:"text-xl font-semibold text-gray-900">推送历史记录</h2>

            <div className:"bg-white rounded-xl shadow-sm overflow-hidden">
              <table className:"min-w-full divide-y divide-gray-200">
                <thead className:"bg-gray-50">
                  <tr>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消息类型</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标Chat</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">重试次数</th>
                  </tr>
                </thead>
                <tbody className:"bg-white divide-y divide-gray-200">
                  {history.map((record) => (}
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className:"px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.sendTime).toLocaleString('zh-CN')}
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.messageType}
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.targetChat}
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap">
                        <span className="{`px-2" py-1 text-xs rounded-full ${}}`
                          record.sendStatus === 'sent' ? 'bg-green-100 text-green-800' :
                          record.sendStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'

                          {record.sendStatus}
                        </span>
                      </td>
                      <td className:"px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.retryCount}
                      </td>
                    </tr>
                  ))
                </tbody>
              </table>
            </div>
          </div>
        )

        {/* 设置 */}
        {activeTab :== 'settings' && (}
          <div className:"bg-white rounded-xl p-8 shadow-sm text-center text-gray-500">
            Bot设置功能开发中...
          </div>
        )
      </div>
    </div>
  );


function ProtectedTelegramBotPage() {}
  return (;
    <PagePermission permissions={AdminPermissions.settings.read()}>
      <TelegramBotPage />
    </PagePermission>
  );


export default ProtectedTelegramBotPage;

