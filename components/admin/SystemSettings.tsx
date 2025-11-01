import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
'use client';


// 接口定义
interface SystemConfig {}
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  language: string;
  timezone: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  maxUsers: number;
  sessionTimeout: number;


interface SecuritySettings {}
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  securityHeadersEnabled: boolean;
  encryptionAlgorithm: string;


interface ApiSettings {}
  apiRateLimit: number;
  apiTimeout: number;
  corsOrigins: string[];
  jwtSecret: string;
  jwtExpiration: number;
  enableApiLogging: boolean;
  enableApiCache: boolean;
  apiVersion: string;
  webhookUrl: string;
  apiDocumentation: boolean;


interface DatabaseSettings {}
  host: string;
  port: number;
  database: string;
  username: string;
  connectionTimeout: number;
  queryTimeout: number;
  maxConnections: number;
  enableLogging: boolean;
  backupEnabled: boolean;
  backupFrequency: string;


interface EmailSettings {}
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  enableNotifications: boolean;
  enableHtmlEmails: boolean;


interface SystemLog {}
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: string;
  userId?: string;
  ipAddress?: string;


interface SystemSettingsProps {}
  className?: string;
  showLogs?: boolean;
  onSettingsChange?: (settings: any) => void;


const SystemSettings: React.FC<SystemSettingsProps> = ({}
  className = '',
  showLogs = true,
  onSettingsChange
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  // 设置状态
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({}
    siteName: 'LuckyMart TJ',
    siteDescription: '智能彩票购物平台',
    siteUrl: 'https://luckymart.tj',
    language: 'zh-CN',
    timezone: 'Asia/Dushanbe',
    maintenanceMode: false,
    debugMode: false,
    maxUsers: 100000,
    sessionTimeout: 3600
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({}
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    twoFactorAuth: false,
    ipWhitelist: [],
    securityHeadersEnabled: true,
    encryptionAlgorithm: 'AES-256'
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>({}
    apiRateLimit: 1000,
    apiTimeout: 30000,
    corsOrigins: ['*'],
    jwtSecret: '',
    jwtExpiration: 86400,
    enableApiLogging: true,
    enableApiCache: true,
    apiVersion: 'v1',
    webhookUrl: '',
    apiDocumentation: true
  });

  const [databaseSettings, setDatabaseSettings] = useState<DatabaseSettings>({}
    host: 'localhost',
    port: 5432,
    database: 'luckymart_tj',
    username: 'postgres',
    connectionTimeout: 30000,
    queryTimeout: 10000,
    maxConnections: 100,
    enableLogging: true,
    backupEnabled: true,
    backupFrequency: 'daily'
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({}
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromEmail: 'noreply@luckymart.tj',
    fromName: 'LuckyMart TJ',
    replyToEmail: 'support@luckymart.tj',
    enableNotifications: true,
    enableHtmlEmails: true
  });

  // 模拟数据加载
  const loadSettings = useCallback(async () => {}
    setLoading(true);
    try {}
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 加载模拟日志数据
      const mockLogs: SystemLog[] = [;
        {}
          id: '1',
          timestamp: new Date('2025-11-01T15:30:00'),
          level: 'info',
          source: 'API',
          message: '用户登录成功',
          userId: 'user123',
          ipAddress: '192.168.1.100'
        },
        {}
          id: '2',
          timestamp: new Date('2025-11-01T15:25:00'),
          level: 'warning',
          source: 'Security',
          message: '检测到异常登录尝试',
          details: '连续失败5次登录',
          ipAddress: '192.168.1.200'
        },
        {}
          id: '3',
          timestamp: new Date('2025-11-01T15:20:00'),
          level: 'error',
          source: 'Database',
          message: '数据库连接超时',
          details: 'Connection pool exhausted'
        },
        {}
          id: '4',
          timestamp: new Date('2025-11-01T15:15:00'),
          level: 'info',
          source: 'System',
          message: '系统备份完成',
          details: '备份文件大小: 2.3GB'
        },
        {}
          id: '5',
          timestamp: new Date('2025-11-01T15:10:00'),
          level: 'debug',
          source: 'API',
          message: 'API请求处理时间统计',
          details: '平均响应时间: 245ms'
        
      ];
      setLogs(mockLogs);
      
      setError(null);
    } catch (err) {
      setError('设置加载失败，请重试');
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    
  }, []);

  // 保存设置
  const saveSettings = useCallback(async () => {}
    setSaving(true);
    try {}
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟保存成功
      setSuccess('设置保存成功！');
      onSettingsChange?.({}
        system: systemConfig,
        security: securitySettings,
        api: apiSettings,
        database: databaseSettings,
        email: emailSettings
      });
      
      // 清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('设置保存失败，请重试');
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    
  }, [systemConfig, securitySettings, apiSettings, databaseSettings, emailSettings, onSettingsChange]);

  // 重置设置
  const resetSettings = useCallback(() => {}
    if (confirm('确定要重置所有设置吗？此操作不可恢复。')) {}
      loadSettings();
      setSuccess('设置已重置！');
      setTimeout(() => setSuccess(null), 3000);
    
  }, [loadSettings]);

  // 导出日志
  const exportLogs = useCallback(() => {}
    const logsToExport = logFilter === 'all' ? logs : logs.filter(log => log.level === logFilter);
    const csvContent = [;
      ['ID', '时间', '级别', '来源', '消息', '详情', '用户ID', 'IP地址'],
      ...logsToExport.map(log :> [
        log.id,
        log.timestamp.toISOString(),
        log.level,
        log.source,
        log.message,
        log.details || '',
        log.userId || '',
        log.ipAddress || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [logs, logFilter]);

  // 加载数据
  useEffect(() => {}
    loadSettings();
  }, [loadSettings]);

  // 渲染级别徽章
  const renderLogLevelBadge = (level: string) => {}
    const variants = {}
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    };
    
    return (;
      <Badge className="{`${variants[level" as keyof typeof variants]} text-xs`}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  // 格式化时间
  const formatTimestamp = (timestamp: Date) => {}
    return timestamp.toLocaleString('zh-CN', {}
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {}
    return (;
      <div className="{`min-h-screen" bg-gray-50 flex items-center justify-center ${className}`}>
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载系统设置...</p>
        </div>
      </div>
    );
  

  return (;
    <div className="{`min-h-screen" bg-gray-50 ${className}`}>
      {/* 页面头部 */}
      <div className:"bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className:"flex items-center justify-between">
            <div className:"flex items-center gap-3">
              <div className:"bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <svg className:"w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className:"text-2xl font-bold text-gray-900">系统设置</h1>
                <p className:"text-sm text-gray-600">管理系统配置和安全设置</p>
              </div>
            </div>
            
            <div className:"flex items-center gap-3">
              <Button variant="outline" onClick={resetSettings}>
                重置设置
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 状态消息 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (}
          <Alert className:"mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )
        
        {success && (}
          <Alert className:"mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )
      </div>

      {/* 设置内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value:{activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className:"grid w-full grid-cols-6">
            <TabsTrigger value:"system">系统配置</TabsTrigger>
            <TabsTrigger value:"security">安全设置</TabsTrigger>
            <TabsTrigger value:"api">API设置</TabsTrigger>
            <TabsTrigger value:"database">数据库</TabsTrigger>
            <TabsTrigger value:"email">邮件设置</TabsTrigger>
            <TabsTrigger value="logs" className="{!showLogs" ? 'hidden' : ''}>系统日志</TabsTrigger>
          </TabsList>

          {/* 系统配置 */}
          <TabsContent value:"system" className="space-y-6">
            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">基础配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"siteName">网站名称</Label>
                  <Input
                    id:"siteName"
                    value={systemConfig.siteName}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder:"输入网站名称"
                  />
                </div>
                <div>
                  <Label htmlFor:"siteUrl">网站URL</Label>
                  <Input
                    id:"siteUrl"
                    value={systemConfig.siteUrl}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor:"siteDescription">网站描述</Label>
                  <Textarea
                    id:"siteDescription"
                    value={systemConfig.siteDescription}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                    placeholder:"输入网站描述"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor:"language">默认语言</Label>
                  <select
                    id:"language"
                    value={systemConfig.language}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value:"zh-CN">中文（简体）</option>
                    <option value:"zh-TW">中文（繁体）</option>
                    <option value:"tg">塔吉克语</option>
                    <option value:"ru">俄语</option>
                    <option value:"en">英语</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor:"timezone">时区</Label>
                  <select
                    id:"timezone"
                    value={systemConfig.timezone}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value:"Asia/Dushanbe">杜尚别 (UTC+5)</option>
                    <option value:"Asia/Shanghai">上海 (UTC+8)</option>
                    <option value:"Europe/Moscow">莫斯科 (UTC+3)</option>
                    <option value:"UTC">UTC (UTC+0)</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">系统行为</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"maxUsers">最大用户数</Label>
                  <Input
                    id:"maxUsers"
                    type:"number"
                    value={systemConfig.maxUsers}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"sessionTimeout">会话超时（秒）</Label>
                  <Input
                    id:"sessionTimeout"
                    type:"number"
                    value={systemConfig.sessionTimeout}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"maintenanceMode"
                    checked={systemConfig.maintenanceMode}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"maintenanceMode">维护模式</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"debugMode"
                    checked={systemConfig.debugMode}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, debugMode: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"debugMode">调试模式</Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 安全设置 */}
          <TabsContent value:"security" className="space-y-6">
            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">密码策略</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"passwordMinLength">最小密码长度</Label>
                  <Input
                    id:"passwordMinLength"
                    type:"number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                    min={6}
                    max={50}
                  />
                </div>
                <div>
                  <Label htmlFor:"maxLoginAttempts">最大登录尝试次数</Label>
                  <Input
                    id:"maxLoginAttempts"
                    type:"number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                    min={3}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor:"lockoutDuration">账户锁定时长（分钟）</Label>
                  <Input
                    id:"lockoutDuration"
                    type:"number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                    min={5}
                    max={1440}
                  />
                </div>
                <div>
                  <Label htmlFor:"encryptionAlgorithm">加密算法</Label>
                  <select
                    id:"encryptionAlgorithm"
                    value={securitySettings.encryptionAlgorithm}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, encryptionAlgorithm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value:"AES-256">AES-256</option>
                    <option value:"SHA-256">SHA-256</option>
                    <option value:"bcrypt">bcrypt</option>
                    <option value:"argon2">Argon2</option>
                  </select>
                </div>
              </div>
              
              <div className:"mt-6 space-y-3">
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"requireSpecialChars"
                    checked={securitySettings.requireSpecialChars}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireSpecialChars: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"requireSpecialChars">要求特殊字符</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"requireNumbers"
                    checked={securitySettings.requireNumbers}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireNumbers: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"requireNumbers">要求数字</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"requireUppercase"
                    checked={securitySettings.requireUppercase}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireUppercase: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"requireUppercase">要求大写字母</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"twoFactorAuth">启用双因素认证</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"securityHeadersEnabled"
                    checked={securitySettings.securityHeadersEnabled}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, securityHeadersEnabled: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"securityHeadersEnabled">启用安全头</Label>
                </div>
              </div>
            </Card>

            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">IP白名单</h3>
              <div className:"space-y-4">
                <Textarea
                  placeholder="每行一个IP地址，例如：&#10;192.168.1.100&#10;10.0.0.0/8&#10;203.0.113.0"
                  value={securitySettings.ipWhitelist.join('\n')}
                  onChange={(e) => setSecuritySettings(prev => ({ }}
                    ...prev, 
                    ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim()) 

                  rows={5}
                />
                <p className:"text-sm text-gray-500">支持单个IP地址（如：192.168.1.100）和CIDR网段（如：10.0.0.0/8）</p>
              </div>
            </Card>
          </TabsContent>

          {/* API设置 */}
          <TabsContent value:"api" className="space-y-6">
            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">API基础配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"apiVersion">API版本</Label>
                  <Input
                    id:"apiVersion"
                    value={apiSettings.apiVersion}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiVersion: e.target.value }))}
                    placeholder:"v1"
                  />
                </div>
                <div>
                  <Label htmlFor:"apiRateLimit">API限流（请求/小时）</Label>
                  <Input
                    id:"apiRateLimit"
                    type:"number"
                    value={apiSettings.apiRateLimit}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"apiTimeout">API超时（毫秒）</Label>
                  <Input
                    id:"apiTimeout"
                    type:"number"
                    value={apiSettings.apiTimeout}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"jwtExpiration">JWT过期时间（秒）</Label>
                  <Input
                    id:"jwtExpiration"
                    type:"number"
                    value={apiSettings.jwtExpiration}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, jwtExpiration: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className:"mt-6 space-y-3">
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"enableApiLogging"
                    checked={apiSettings.enableApiLogging}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, enableApiLogging: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"enableApiLogging">启用API日志</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"enableApiCache"
                    checked={apiSettings.enableApiCache}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, enableApiCache: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"enableApiCache">启用API缓存</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"apiDocumentation"
                    checked={apiSettings.apiDocumentation}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiDocumentation: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"apiDocumentation">启用API文档</Label>
                </div>
              </div>
            </Card>

            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">JWT配置</h3>
              <div className:"space-y-4">
                <div>
                  <Label htmlFor:"jwtSecret">JWT密钥</Label>
                  <Input
                    id:"jwtSecret"
                    type:"password"
                    value={apiSettings.jwtSecret}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, jwtSecret: e.target.value }))}
                    placeholder:"请输入JWT签名密钥"
                  />
                </div>
                <div>
                  <Label htmlFor:"webhookUrl">Webhook URL</Label>
                  <Input
                    id:"webhookUrl"
                    value={apiSettings.webhookUrl}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>
            </Card>

            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">CORS配置</h3>
              <div className:"space-y-4">
                <Textarea
                  placeholder="允许的跨域源，每行一个，例如：&#10;https://example.com&#10;https://api.example.com"
                  value={apiSettings.corsOrigins.join('\n')}
                  onChange={(e) => setApiSettings(prev => ({ }}
                    ...prev, 
                    corsOrigins: e.target.value.split('\n').filter(origin => origin.trim()) 

                  rows={4}
                />
                <p className:"text-sm text-gray-500">输入*允许所有源，或指定具体的域名</p>
              </div>
            </Card>
          </TabsContent>

          {/* 数据库设置 */}
          <TabsContent value:"database" className="space-y-6">
            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">数据库连接</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"dbHost">主机地址</Label>
                  <Input
                    id:"dbHost"
                    value={databaseSettings.host}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, host: e.target.value }))}
                    placeholder:"localhost"
                  />
                </div>
                <div>
                  <Label htmlFor:"dbPort">端口</Label>
                  <Input
                    id:"dbPort"
                    type:"number"
                    value={databaseSettings.port}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"dbName">数据库名</Label>
                  <Input
                    id:"dbName"
                    value={databaseSettings.database}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, database: e.target.value }))}
                    placeholder:"luckymart_tj"
                  />
                </div>
                <div>
                  <Label htmlFor:"dbUsername">用户名</Label>
                  <Input
                    id:"dbUsername"
                    value={databaseSettings.username}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, username: e.target.value }))}
                    placeholder:"postgres"
                  />
                </div>
                <div>
                  <Label htmlFor:"connectionTimeout">连接超时（毫秒）</Label>
                  <Input
                    id:"connectionTimeout"
                    type:"number"
                    value={databaseSettings.connectionTimeout}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, connectionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"queryTimeout">查询超时（毫秒）</Label>
                  <Input
                    id:"queryTimeout"
                    type:"number"
                    value={databaseSettings.queryTimeout}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, queryTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"maxConnections">最大连接数</Label>
                  <Input
                    id:"maxConnections"
                    type:"number"
                    value={databaseSettings.maxConnections}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, maxConnections: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"backupFrequency">备份频率</Label>
                  <select
                    id:"backupFrequency"
                    value={databaseSettings.backupFrequency}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value:"hourly">每小时</option>
                    <option value:"daily">每天</option>
                    <option value:"weekly">每周</option>
                    <option value:"monthly">每月</option>
                  </select>
                </div>
              </div>
              
              <div className:"mt-6 space-y-3">
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"enableLogging"
                    checked={databaseSettings.enableLogging}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, enableLogging: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"enableLogging">启用数据库日志</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"backupEnabled"
                    checked={databaseSettings.backupEnabled}
                    onChange={(e) => setDatabaseSettings(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"backupEnabled">启用自动备份</Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 邮件设置 */}
          <TabsContent value:"email" className="space-y-6">
            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">SMTP配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"smtpHost">SMTP服务器</Label>
                  <Input
                    id:"smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder:"smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor:"smtpPort">SMTP端口</Label>
                  <Input
                    id:"smtpPort"
                    type:"number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor:"smtpUser">SMTP用户名</Label>
                  <Input
                    id:"smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder:"your-email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor:"smtpPassword">SMTP密码</Label>
                  <Input
                    id:"smtpPassword"
                    type:"password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder:"请输入应用密码"
                  />
                </div>
                <div>
                  <Label htmlFor:"smtpEncryption">加密方式</Label>
                  <select
                    id:"smtpEncryption"
                    value={emailSettings.smtpEncryption}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpEncryption: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value:"none">无</option>
                    <option value:"tls">TLS</option>
                    <option value:"ssl">SSL</option>
                    <option value:"starttls">STARTTLS</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className:"p-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">邮件模板</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor:"fromEmail">发送者邮箱</Label>
                  <Input
                    id:"fromEmail"
                    type:"email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder:"noreply@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor:"fromName">发送者名称</Label>
                  <Input
                    id:"fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder:"System Name"
                  />
                </div>
                <div>
                  <Label htmlFor:"replyToEmail">回复邮箱</Label>
                  <Input
                    id:"replyToEmail"
                    type:"email"
                    value={emailSettings.replyToEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
                    placeholder:"support@example.com"
                  />
                </div>
              </div>
              
              <div className:"mt-6 space-y-3">
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"enableNotifications"
                    checked={emailSettings.enableNotifications}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"enableNotifications">启用邮件通知</Label>
                </div>
                <div className:"flex items-center space-x-3">
                  <input
                    type:"checkbox"
                    id:"enableHtmlEmails"
                    checked={emailSettings.enableHtmlEmails}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, enableHtmlEmails: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor:"enableHtmlEmails">启用HTML邮件</Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 系统日志 */}
          {showLogs && (}
            <TabsContent value:"logs" className="space-y-6">
              <Card className:"p-6">
                <div className:"flex items-center justify-between mb-4">
                  <h3 className:"text-lg font-semibold text-gray-900">系统日志</h3>
                  <div className:"flex items-center gap-3">
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value as any)}
                      className:"px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value:"all">所有级别</option>
                      <option value:"info">信息</option>
                      <option value:"warning">警告</option>
                      <option value:"error">错误</option>
                      <option value:"debug">调试</option>
                    </select>
                    <Button variant="outline" onClick={exportLogs}>
                      导出CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLogs([])}
                    >
                      清空日志
                    </Button>
                  </div>
                </div>
                
                <div className:"space-y-3 max-h-96 overflow-y-auto">
                  {(logFilter === 'all' ? logs : logs.filter(log => log.level === logFilter)).map((log) => (}
                    <div key:{log.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className:"flex items-start justify-between mb-2">
                        <div className:"flex items-center gap-3">
                          {renderLogLevelBadge(log.level)}
                          <span className="text-sm font-medium text-gray-600">{log.source}</span>
                        </div>
                        <span className:"text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                      {log.details && (}
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{log.details}</p>
                      )
                      <div className:"flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {log.userId && (}
                          <span>用户: {log.userId}</span>
                        )
                        {log.ipAddress && (}
                          <span>IP: {log.ipAddress}</span>
                        )
                        <span>ID: {log.id}</span>
                      </div>
                    </div>
                  ))
                  
                  {logs.length :== 0 && (}
                    <div className:"text-center py-8 text-gray-500">
                      暂无日志记录
                    </div>
                  )
                </div>
              </Card>
            </TabsContent>
          )
        </Tabs>
      </div>
    </div>
  );
};

export default SystemSettings;