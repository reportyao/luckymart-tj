import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationStats {
  language: string;
  namespace: string;
  totalKeys: number;
  missingKeys: number;
  completeness: number;
  qualityScore: number;
  lastUpdated: string;
  issues: TranslationIssue[];
}

interface TranslationIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  count: number;
}

interface QualityDashboardProps {
  refreshInterval?: number;
  showRecommendations?: boolean;
  compact?: boolean;
}

const TranslationQualityDashboard: React.FC<QualityDashboardProps> = ({
  refreshInterval = 30000, // 30秒刷新
  showRecommendations = true,
  compact = false
}) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<TranslationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 模拟数据 - 实际使用时应该从API获取
  const generateMockData = (): TranslationStats[] => {
    const languages = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
    const namespaces = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'];
    
    const mockData: TranslationStats[] = [];
    
    for (const language of languages) {
      for (const namespace of namespaces) {
        const totalKeys = 50 + Math.floor(Math.random() * 100);
        const missingKeys = Math.floor(Math.random() * 10);
        const completeness = Math.max(0, 100 - (missingKeys * 5));
        const qualityScore = Math.floor(Math.random() * 30) + 70;
        
        const issues: TranslationIssue[] = [];
        
        if (missingKeys > 0) {
          issues.push({
            type: 'missing_keys',
            severity: missingKeys > 5 ? 'high' : 'medium',
            message: `${missingKeys} 个缺失翻译键`,
            count: missingKeys
          });
        }
        
        if (qualityScore < 80) {
          issues.push({
            type: 'quality_issues',
            severity: 'medium',
            message: '翻译质量问题',
            count: Math.floor((100 - qualityScore) / 10)
          });
        }
        
        if (Math.random() > 0.7) {
          issues.push({
            type: 'placeholder_issues',
            severity: 'low',
            message: '占位符格式问题',
            count: Math.floor(Math.random() * 3) + 1
          });
        }
        
        mockData.push({
          language,
          namespace,
          totalKeys,
          missingKeys,
          completeness,
          qualityScore,
          lastUpdated: new Date().toISOString(),
          issues
        });
      }
    }
    
    return mockData;
  };

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      // 实际实现时应该调用API
      // const response = await fetch('/api/translation-stats');
      // const data = await response.json();
      
      // 暂时使用模拟数据
      const data = generateMockData();
      setStats(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('获取翻译统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化和定时刷新
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // 筛选数据
  const filteredStats = stats.filter(stat => {
    if (selectedLanguage !== 'all' && stat.language !== selectedLanguage) return false;
    if (selectedNamespace !== 'all' && stat.namespace !== selectedNamespace) return false;
    return true;
  });

  // 计算汇总统计
  const overallStats = {
    totalFiles: filteredStats.length,
    avgCompleteness: filteredStats.length > 0 
      ? Math.round(filteredStats.reduce((sum, stat) => sum + stat.completeness, 0) / filteredStats.length)
      : 0,
    avgQuality: filteredStats.length > 0 
      ? Math.round(filteredStats.reduce((sum, stat) => sum + stat.qualityScore, 0) / filteredStats.length)
      : 0,
    totalIssues: filteredStats.reduce((sum, stat) => sum + stat.issues.length, 0),
    criticalIssues: filteredStats.reduce((sum, stat) => 
      sum + stat.issues.filter(issue => issue.severity === 'critical').length, 0)
  };

  // 获取健康度颜色
  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取健康度背景色
  const getHealthBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // 获取严重程度图标
  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  };

  // 获取语言名称
  const getLanguageName = (code: string): string => {
    const names: { [key: string]: string } = {
      'zh-CN': '中文',
      'en-US': 'English',
      'ru-RU': 'Русский',
      'tg-TJ': 'Тоҷикӣ'
    };
    return names[code] || code;
  };

  // 获取命名空间显示名称
  const getNamespaceDisplayName = (namespace: string): string => {
    const names: { [key: string]: string } = {
      'common': '通用',
      'auth': '认证',
      'lottery': '抽奖',
      'wallet': '钱包',
      'referral': '邀请',
      'task': '任务',
      'error': '错误',
      'admin': '管理',
      'bot': '机器人'
    };
    return names[namespace] || namespace;
  };

  if (compact) {
    // 紧凑模式
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">翻译状态</h3>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthBgColor(overallStats.avgQuality)}`}>
              <span className={getHealthColor(overallStats.avgQuality)}>
                {overallStats.avgQuality}/100
              </span>
            </span>
            <button 
              onClick={fetchStats}
              className="p-1 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              🔄
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <div>文件: {overallStats.totalFiles}</div>
          <div>完整性: {overallStats.avgCompleteness}%</div>
          <div>问题: {overallStats.totalIssues}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('translationDashboard.title', '翻译质量监控仪表板')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('translationDashboard.subtitle', '实时监控翻译完整性和质量状态')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {t('translationDashboard.lastUpdate', '最后更新')}: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>{loading ? t('translationDashboard.refreshing', '刷新中...') : t('translationDashboard.refresh', '刷新')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{t('translationDashboard.totalFiles', '总文件数')}</p>
              <p className="text-2xl font-semibold text-gray-900">{overallStats.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{t('translationDashboard.avgCompleteness', '平均完整性')}</p>
              <p className={`text-2xl font-semibold ${getHealthColor(overallStats.avgCompleteness)}`}>
                {overallStats.avgCompleteness}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{t('translationDashboard.avgQuality', '平均质量')}</p>
              <p className={`text-2xl font-semibold ${getHealthColor(overallStats.avgQuality)}`}>
                {overallStats.avgQuality}/100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{t('translationDashboard.totalIssues', '总问题数')}</p>
              <p className="text-2xl font-semibold text-gray-900">{overallStats.totalIssues}</p>
              {overallStats.criticalIssues > 0 && (
                <p className="text-sm text-red-600">
                  {overallStats.criticalIssues} {t('translationDashboard.critical', '严重')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {t('translationDashboard.language', '语言')}:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">{t('translationDashboard.all', '全部')}</option>
              {['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'].map(lang => (
                <option key={lang} value={lang}>{getLanguageName(lang)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {t('translationDashboard.namespace', '命名空间')}:
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">{t('translationDashboard.all', '全部')}</option>
              {['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'].map(ns => (
                <option key={ns} value={ns}>{getNamespaceDisplayName(ns)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {t('translationDashboard.view', '视图')}:
            </label>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                📊
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 状态列表/网格 */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredStats.map((stat, index) => (
            <div key={`${stat.language}-${stat.namespace}`} className={`bg-white rounded-lg shadow ${viewMode === 'list' ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getLanguageName(stat.language)} / {getNamespaceDisplayName(stat.namespace)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {stat.totalKeys} {t('translationDashboard.keys', '键')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthBgColor(stat.qualityScore)}`}>
                  <span className={getHealthColor(stat.qualityScore)}>
                    {stat.qualityScore}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('translationDashboard.completeness', '完整性')}</span>
                    <span className={getHealthColor(stat.completeness)}>{stat.completeness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stat.completeness >= 90 ? 'bg-green-500' : stat.completeness >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${stat.completeness}%` }}
                    />
                  </div>
                </div>

                {stat.missingKeys > 0 && (
                  <div className="text-sm text-red-600">
                    ⚠️ {stat.missingKeys} {t('translationDashboard.missingKeys', '个缺失键')}
                  </div>
                )}

                {stat.issues.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      {t('translationDashboard.issues', '问题')}:
                    </p>
                    {stat.issues.slice(0, 3).map((issue, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <span>{getSeverityIcon(issue.severity)}</span>
                        <span className="text-gray-600">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 建议和修复提示 */}
      {showRecommendations && overallStats.totalIssues > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">💡</span>
            {t('translationDashboard.recommendations', '修复建议')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallStats.criticalIssues > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-red-600 font-medium">🚨 {t('translationDashboard.criticalIssues', '严重问题')}</div>
                </div>
                <p className="text-sm text-red-700">
                  {t('translationDashboard.criticalIssuesDesc', '存在严重问题需要立即修复')}
                </p>
                <button className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  {t('translationDashboard.fixNow', '立即修复')}
                </button>
              </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-yellow-600 font-medium">⚠️ {t('translationDashboard.missingTranslations', '缺失翻译')}</div>
              </div>
              <p className="text-sm text-yellow-700">
                {t('translationDashboard.missingTranslationsDesc', '补充缺失的翻译键以提高完整性')}
              </p>
              <button className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                {t('translationDashboard.generateKeys', '生成键')}
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 font-medium">📊 {t('translationDashboard.qualityReport', '质量报告')}</div>
              </div>
              <p className="text-sm text-blue-700">
                {t('translationDashboard.qualityReportDesc', '生成详细的翻译质量分析报告')}
              </p>
              <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                {t('translationDashboard.generateReport', '生成报告')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationQualityDashboard;