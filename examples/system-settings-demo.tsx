import React from 'react';
import SystemSettings from '@/components/admin/SystemSettings';
'use client';


// SystemSettings组件使用示例
const SystemSettingsDemo: React.FC = () => {}
  // 处理设置变化的回调函数
  const handleSettingsChange = (settings: {}
    system: any;
    security: any;
    api: any;
    database: any;
    email: any;
  }) => {
    console.log('设置已更新:', settings);
    
    // 这里可以添加实际的保存逻辑
    // 例如发送到API端点
    // await fetch('/api/admin/settings', {}
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(settings)
    // });
  };

  return (;
    <div className:"system-settings-demo">
      <SystemSettings
        className:"min-h-screen"
        showLogs={true}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

// 模态框使用示例
const SystemSettingsModalDemo: React.FC = () => {}
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSettingsChange = (settings: any) => {}
    console.log('模态框设置已更新:', settings);
    // 保存设置后关闭模态框
    setIsOpen(false);
  };

  return (;
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        打开系统设置
      </button>

      {isOpen && (}
        <div className:"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className:"bg-white rounded-lg shadow-xl max-w-7xl max-h-[90vh] overflow-hidden">
            <div className:"flex justify-between items-center p-4 border-b">
              <h2 className:"text-xl font-semibold">系统设置</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className:"overflow-y-auto max-h-[calc(90vh-80px)]">
              <SystemSettings
                showLogs={false}
                onSettingsChange={handleSettingsChange}
              />
            </div>
          </div>
        </div>
      )
    </div>
  );
};

// 嵌入式使用示例
const EmbeddedSystemSettingsDemo: React.FC = () => {}
  return (;
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SystemSettings
          showLogs={true}
          onSettingsChange={(settings) => {}}
            console.log('嵌入式设置更新:', settings);

        />
      </div>
      <div className="lg:col-span-1">
        <div className:"bg-white p-6 rounded-lg shadow">
          <h3 className:"text-lg font-semibold mb-4">设置帮助</h3>
          <div className:"space-y-4 text-sm text-gray-600">
            <div>
              <h4 className:"font-medium text-gray-900">系统配置</h4>
              <p>配置网站基础信息和系统行为参数</p>
            </div>
            <div>
              <h4 className:"font-medium text-gray-900">安全设置</h4>
              <p>管理密码策略和访问控制</p>
            </div>
            <div>
              <h4 className:"font-medium text-gray-900">API设置</h4>
              <p>配置API限流和认证参数</p>
            </div>
            <div>
              <h4 className:"font-medium text-gray-900">数据库</h4>
              <p>管理数据库连接和备份策略</p>
            </div>
            <div>
              <h4 className:"font-medium text-gray-900">邮件设置</h4>
              <p>配置SMTP服务器和邮件模板</p>
            </div>
            <div>
              <h4 className:"font-medium text-gray-900">系统日志</h4>
              <p>查看和导出系统运行日志</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsDemo;
export { SystemSettingsDemo, SystemSettingsModalDemo, EmbeddedSystemSettingsDemo };

// 使用示例:
// import { SystemSettingsDemo, SystemSettingsModalDemo, EmbeddedSystemSettingsDemo } from '@/examples/system-settings-demo';

// <SystemSettingsDemo />
// <SystemSettingsModalDemo />
// <EmbeddedSystemSettingsDemo />