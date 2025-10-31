import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  QualityAssessor, 
  QualityDimension, 
  SeverityLevel, 
  getQualityLevel,
  type TranslationQualityAssessment,
  type QualityIssue
} from '../utils/translation-quality-metrics';
import { AutomatedQualityChecker } from '../utils/automated-quality-checker';

interface TranslationStats {
  language: string;
  namespace: string;
  totalKeys: number;
  missingKeys: number;
  completeness: number;
  qualityScore: number;
  lastUpdated: string;
  issues: TranslationIssue[];
  dimensionScores: {
    [key in QualityDimension]?: number;
  };
  assessment?: TranslationQualityAssessment;
}

interface TranslationIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  count: number;
  location?: string;
  suggestedFix?: string;
}

interface QualityDashboardProps {
  refreshInterval?: number;
  showRecommendations?: boolean;
  compact?: boolean;
  autoRefresh?: boolean;
  showTrends?: boolean;
  enableRealTimeMonitoring?: boolean;
}

interface QualityTrend {
  date: string;
  score: number;
  completeness: number;
  issues: number;
}

interface QualityAlert {
  id: string;
  type: 'quality_drop' | 'critical_issue' | 'missing_translations';
  severity: SeverityLevel;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

const TranslationQualityDashboard: React.FC<QualityDashboardProps> = ({
  refreshInterval = 30000, // 30秒刷新
  showRecommendations = true,
  compact = false,
  autoRefresh = true,
  showTrends = true,
  enableRealTimeMonitoring = false
}) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<TranslationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [trends, setTrends] = useState<QualityTrend[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [qualityChecker] = useState(() => new AutomatedQualityChecker({
    sourceLanguage: 'zh-CN',
    targetLanguages: ['en-US', 'ru-RU', 'tg-TJ'],
    namespaces: ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'],
    threshold: 70,
    autoFix: false,
    generateReport: false,
    batchSize: 10,
    parallel: true,
    excludePatterns: [],
    includeOnlyUpdated: false
  }));

  // 生成模拟质量数据
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
        
        const dimensionScores: any = {
          [QualityDimension.ACCURACY]: qualityScore + Math.random() * 10 - 5,
          [QualityDimension.FLUENCY]: qualityScore + Math.random() * 10 - 5,
          [QualityDimension.CONSISTENCY]: qualityScore + Math.random() * 10 - 5,
          [QualityDimension.CULTURAL_ADAPTATION]: qualityScore + Math.random() * 10 - 5,
          [QualityDimension.COMPLETENESS]: completeness,
          [QualityDimension.TECHNICAL_QUALITY]: qualityScore + Math.random() * 15 - 7.5
        };
        
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
        
        // 模拟评估对象
        const assessment: TranslationQualityAssessment = {
          translationKey: `${language}:${namespace}`,
          sourceText: '示例源文本',
          translatedText: '示例翻译文本',
          sourceLanguage: 'zh-CN',
          targetLanguage: language,
          namespace,
          overallScore: qualityScore,
          dimensionScores: [],
          issues: [],
          recommendations: [],
          assessmentDate: new Date()
        };
        
        mockData.push({
          language,
          namespace,
          totalKeys,
          missingKeys,
          completeness,
          qualityScore,
          lastUpdated: new Date().toISOString(),
          issues,
          dimensionScores,
          assessment
        });
      }
    }
    
    return mockData;
  };

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      // 实际实现时应该调用质量检查器
      const data = generateMockData();
      setStats(data);
      
      // 生成趋势数据
      if (showTrends) {
        await generateTrends();
      }
      
      // 检查告警
      if (enableRealTimeMonitoring) {
        await checkQualityAlerts(data);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('获取翻译统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成质量趋势数据
  const generateTrends = async () => {
    const now = new Date();
    const trendsData: QualityTrend[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trendsData.push({
        date: date.toISOString().split('T')[0],
        score: 70 + Math.random() * 25,
        completeness: 80 + Math.random() * 15,
        issues: Math.floor(Math.random() * 20)
      });
    }
    
    setTrends(trendsData);
  };

  // 检查质量告警
  const checkQualityAlerts = async (statsData: TranslationStats[]) => {
    const newAlerts: QualityAlert[] = [];
    
    // 检查整体质量下降
    const avgScore = statsData.reduce((sum, stat) => sum + stat.qualityScore, 0) / statsData.length;
    if (avgScore < 70) {
      newAlerts.push({
        id: `quality_drop_${Date.now()}`,
        type: 'quality_drop',
        severity: SeverityLevel.HIGH,
        message: `整体质量分数下降至 ${avgScore.toFixed(1)}`,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // 检查严重问题
    const criticalIssues = statsData.flatMap(stat => stat.issues)
      .filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      newAlerts.push({
        id: `critical_issues_${Date.now()}`,
        type: 'critical_issue',
        severity: SeverityLevel.CRITICAL,
        message: `发现 ${criticalIssues.length} 个严重问题`,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // 检查缺失翻译
    const totalMissing = statsData.reduce((sum, stat) => sum + stat.missingKeys, 0);
    if (totalMissing > 50) {
      newAlerts.push({
        id: `missing_translations_${Date.now()}`,
        type: 'missing_translations',
        severity: SeverityLevel.HIGH,
        message: `存在 ${totalMissing} 个缺失翻译`,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    setAlerts(prev => [...prev, ...newAlerts]);
  };

  // 确认告警
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // 执行质量检查
  const performQualityCheck = async () => {
    try {
      setLoading(true);
      const result = await qualityChecker.performQualityCheck();
      console.log('质量检查完成:', result.stats);
      await fetchStats(); // 重新获取数据
    } catch (error) {
      console.error('质量检查失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成质量报告
  const generateReport = async (format: string = 'json') => {
    try {
      const reportPath = await qualityChecker.generateComprehensiveReport({
        format,
        languages: selectedLanguage !== 'all' ? [selectedLanguage] : undefined,
        namespaces: selectedNamespace !== 'all' ? [selectedNamespace] : undefined
      });
      console.log('质量报告已生成:', reportPath);
    } catch (error) {
      console.error('生成报告失败:', error);
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
      <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-md">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between mb-2">
          <h3 className="luckymart-text-lg font-semibold">翻译状态</h3>
          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthBgColor(overallStats.avgQuality)}`}>
              <span className={getHealthColor(overallStats.avgQuality)}>
                {overallStats.avgQuality}/100
              </span>
            </span>
            <button 
              onClick={fetchStats}
              className="p-1 luckymart-text-secondary hover:text-gray-700"
              disabled={loading}
            >
              🔄
            </button>
          </div>
        </div>
        <div className="luckymart-text-sm text-gray-600">
          <div>文件: {overallStats.totalFiles}</div>
          <div>完整性: {overallStats.avgCompleteness}%</div>
          <div>问题: {overallStats.totalIssues}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto luckymart-padding-lg bg-gray-50 min-h-screen">
      {/* 告警面板 */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="bg-red-50 luckymart-border border-red-200 luckymart-rounded-lg luckymart-padding-md">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div className="luckymart-layout-flex luckymart-layout-center">
                <span className="text-red-600 font-semibold">🚨 质量告警</span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 luckymart-text-sm luckymart-rounded">
                  {alerts.filter(a => !a.acknowledged).length} 未确认
                </span>
              </div>
              <button
                onClick={() => setAlerts([])}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 luckymart-spacing-sm">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-bg-white p-3 luckymart-rounded luckymart-border">
                  <div className="luckymart-layout-flex luckymart-layout-center">
                    <span className={`w-2 h-2 rounded-full mr-3 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                    <span className="luckymart-text-sm">{alert.message}</span>
                  </div>
                  <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                    <span className="text-xs luckymart-text-secondary">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 luckymart-rounded hover:bg-blue-200"
                      >
                        确认
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="mb-8">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between">
          <div>
            <h1 className="text-3xl luckymart-font-bold text-gray-900">
              {t('translationDashboard.title', '翻译质量监控仪表板')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('translationDashboard.subtitle', '实时监控翻译完整性和质量状态')}
            </p>
          </div>
          <div className="luckymart-layout-flex luckymart-layout-center space-x-4">
            {enableRealTimeMonitoring && (
              <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                <span className="w-2 h-2 luckymart-bg-success rounded-full luckymart-animation-pulse"></span>
                <span className="luckymart-text-sm text-gray-600">实时监控</span>
              </div>
            )}
            <div className="luckymart-text-sm luckymart-text-secondary">
              {t('translationDashboard.lastUpdate', '最后更新')}: {lastRefresh.toLocaleTimeString()}
            </div>
            <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
              <button
                onClick={performQualityCheck}
                disabled={loading}
                className="px-3 py-2 bg-green-600 text-white luckymart-rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm luckymart-text-sm"
              >
                <span>🔍</span>
                <span>质量检查</span>
              </button>
              <button
                onClick={() => generateReport('html')}
                className="px-3 py-2 bg-purple-600 text-white luckymart-rounded-lg hover:bg-purple-700 luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm luckymart-text-sm"
              >
                <span>📊</span>
                <span>生成报告</span>
              </button>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white luckymart-rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm"
              >
                <span>🔄</span>
                <span>{loading ? t('translationDashboard.refreshing', '刷新中...') : t('translationDashboard.refresh', '刷新')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center">
            <div className="luckymart-padding-sm bg-blue-100 luckymart-rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="luckymart-text-sm text-gray-600">{t('translationDashboard.totalFiles', '总文件数')}</p>
              <p className="text-2xl font-semibold text-gray-900">{overallStats.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center">
            <div className="luckymart-padding-sm bg-green-100 luckymart-rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="luckymart-text-sm text-gray-600">{t('translationDashboard.avgCompleteness', '平均完整性')}</p>
              <p className={`text-2xl font-semibold ${getHealthColor(overallStats.avgCompleteness)}`}>
                {overallStats.avgCompleteness}%
              </p>
            </div>
          </div>
        </div>

        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center">
            <div className="luckymart-padding-sm bg-purple-100 luckymart-rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="luckymart-text-sm text-gray-600">{t('translationDashboard.avgQuality', '平均质量')}</p>
              <p className={`text-2xl font-semibold ${getHealthColor(overallStats.avgQuality)}`}>
                {overallStats.avgQuality}/100
              </p>
            </div>
          </div>
        </div>

        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center">
            <div className="luckymart-padding-sm bg-red-100 luckymart-rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="luckymart-text-sm text-gray-600">{t('translationDashboard.totalIssues', '总问题数')}</p>
              <p className="text-2xl font-semibold text-gray-900">{overallStats.totalIssues}</p>
              {overallStats.criticalIssues > 0 && (
                <p className="luckymart-text-sm text-red-600">
                  {overallStats.criticalIssues} {t('translationDashboard.critical', '严重')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg mb-6">
        <div className="luckymart-layout-flex flex-wrap luckymart-layout-center gap-4">
          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
            <label className="luckymart-text-sm luckymart-font-medium text-gray-700">
              {t('translationDashboard.language', '语言')}:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="luckymart-border border-gray-300 luckymart-rounded-md px-3 py-1 luckymart-text-sm"
            >
              <option value="all">{t('translationDashboard.all', '全部')}</option>
              {['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'].map(lang => (
                <option key={lang} value={lang}>{getLanguageName(lang)}</option>
              ))}
            </select>
          </div>

          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
            <label className="luckymart-text-sm luckymart-font-medium text-gray-700">
              {t('translationDashboard.namespace', '命名空间')}:
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="luckymart-border border-gray-300 luckymart-rounded-md px-3 py-1 luckymart-text-sm"
            >
              <option value="all">{t('translationDashboard.all', '全部')}</option>
              {['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'].map(ns => (
                <option key={ns} value={ns}>{getNamespaceDisplayName(ns)}</option>
              ))}
            </select>
          </div>

          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
            <label className="luckymart-text-sm luckymart-font-medium text-gray-700">
              {t('translationDashboard.view', '视图')}:
            </label>
            <div className="luckymart-layout-flex luckymart-border border-gray-300 luckymart-rounded-md overflow-hidden">
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
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow p-8 luckymart-text-center">
          <div className="luckymart-text-secondary">加载中...</div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredStats.map((stat, index) => (
            <div key={`${stat.language}-${stat.namespace}`} className={`bg-white rounded-lg shadow ${viewMode === 'list' ? 'p-4' : 'p-6'}`}>
              <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-spacing-md">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getLanguageName(stat.language)} / {getNamespaceDisplayName(stat.namespace)}
                  </h3>
                  <p className="luckymart-text-sm luckymart-text-secondary">
                    {stat.totalKeys} {t('translationDashboard.keys', '键')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthBgColor(stat.qualityScore)}`}>
                  <span className={getHealthColor(stat.qualityScore)}>
                    {stat.qualityScore}/100
                  </span>
                </div>
              </div>

              <div className="luckymart-spacing-md">
                {/* 维度评分 */}
                {stat.dimensionScores && (
                  <div className="luckymart-spacing-sm">
                    <p className="luckymart-text-sm luckymart-font-medium text-gray-700">质量维度</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(stat.dimensionScores).slice(0, 4).map(([dimension, score]) => (
                        <div key={dimension} className="luckymart-layout-flex justify-between">
                          <span className="text-gray-600">
                            {dimension === QualityDimension.ACCURACY ? '准确性' :
                             dimension === QualityDimension.FLUENCY ? '流畅性' :
                             dimension === QualityDimension.CONSISTENCY ? '一致性' :
                             dimension === QualityDimension.CULTURAL_ADAPTATION ? '文化适应' :
                             dimension === QualityDimension.COMPLETENESS ? '完整性' :
                             dimension === QualityDimension.TECHNICAL_QUALITY ? '技术质量' : dimension}
                          </span>
                          <span className={getHealthColor(score || 0)}>{(score || 0).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="luckymart-layout-flex justify-between luckymart-text-sm mb-1">
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
                  <div className="luckymart-text-sm text-red-600">
                    ⚠️ {stat.missingKeys} {t('translationDashboard.missingKeys', '个缺失键')}
                  </div>
                )}

                {stat.issues.length > 0 && (
                  <div className="space-y-1">
                    <p className="luckymart-text-sm luckymart-font-medium text-gray-700">
                      {t('translationDashboard.issues', '问题')}:
                    </p>
                    {stat.issues.slice(0, 3).map((issue, idx) => (
                      <div key={idx} className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-text-sm">
                        <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                          <span>{getSeverityIcon(issue.severity)}</span>
                          <span className="text-gray-600">{issue.message}</span>
                        </div>
                        {issue.suggestedFix && (
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title={issue.suggestedFix}
                          >
                            💡
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 质量趋势图 */}
      {showTrends && trends.length > 0 && (
        <div className="mt-8 luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <h3 className="luckymart-text-lg font-semibold luckymart-spacing-md luckymart-layout-flex luckymart-layout-center">
            <span className="mr-2">📈</span>
            {t('translationDashboard.qualityTrends', '质量趋势')}
          </h3>
          <div className="h-64 luckymart-layout-flex items-end justify-between luckymart-spacing-sm">
            {trends.map((trend, index) => (
              <div key={index} className="flex-1 luckymart-layout-flex flex-col luckymart-layout-center">
                <div className="w-full bg-gray-200 rounded-t" style={{ height: '120px' }}>
                  <div 
                    className="luckymart-bg-primary rounded-t w-full transition-all duration-300"
                    style={{ height: `${trend.score}%` }}
                    title={`${trend.date}: ${trend.score.toFixed(1)}分`}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(trend.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 建议和修复提示 */}
      {showRecommendations && overallStats.totalIssues > 0 && (
        <div className="mt-8 luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <h3 className="luckymart-text-lg font-semibold luckymart-spacing-md luckymart-layout-flex luckymart-layout-center">
            <span className="mr-2">💡</span>
            {t('translationDashboard.recommendations', '修复建议')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallStats.criticalIssues > 0 && (
              <div className="luckymart-padding-md bg-red-50 luckymart-border border-red-200 luckymart-rounded-lg">
                <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                  <span className="text-red-600 luckymart-font-medium">🚨 {t('translationDashboard.criticalIssues', '严重问题')}</div>
                </div>
                <p className="luckymart-text-sm text-red-700">
                  存在 {overallStats.criticalIssues} 个严重问题需要立即修复
                </p>
                <div className="mt-2 luckymart-spacing-sm">
                  <button 
                    onClick={performQualityCheck}
                    className="px-3 py-1 bg-red-600 text-white luckymart-text-sm luckymart-rounded hover:bg-red-700"
                  >
                    执行检查
                  </button>
                  <button 
                    onClick={() => generateReport('html')}
                    className="px-3 py-1 bg-gray-600 text-white luckymart-text-sm luckymart-rounded hover:bg-gray-700"
                  >
                    生成报告
                  </button>
                </div>
              </div>
            )}

            <div className="luckymart-padding-md bg-yellow-50 luckymart-border border-yellow-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-yellow-600 luckymart-font-medium">⚠️ {t('translationDashboard.missingTranslations', '缺失翻译')}</div>
              </div>
              <p className="luckymart-text-sm text-yellow-700">
                检测到缺失翻译，建议补充以提高完整性
              </p>
              <div className="mt-2 luckymart-spacing-sm">
                <button className="px-3 py-1 bg-yellow-600 text-white luckymart-text-sm luckymart-rounded hover:bg-yellow-700">
                  自动补全
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white luckymart-text-sm luckymart-rounded hover:bg-gray-700">
                  查看详情
                </button>
              </div>
            </div>

            <div className="luckymart-padding-md bg-blue-50 luckymart-border border-blue-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-blue-600 luckymart-font-medium">📊 {t('translationDashboard.qualityReport', '质量报告')}</div>
              </div>
              <p className="luckymart-text-sm text-blue-700">
                生成详细的翻译质量分析报告和趋势分析
              </p>
              <div className="mt-2 luckymart-spacing-sm">
                <button 
                  onClick={() => generateReport('html')}
                  className="px-3 py-1 bg-blue-600 text-white luckymart-text-sm luckymart-rounded hover:bg-blue-700"
                >
                  HTML报告
                </button>
                <button 
                  onClick={() => generateReport('json')}
                  className="px-3 py-1 bg-gray-600 text-white luckymart-text-sm luckymart-rounded hover:bg-gray-700"
                >
                  JSON数据
                </button>
              </div>
            </div>

            <div className="luckymart-padding-md bg-green-50 luckymart-border border-green-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-green-600 luckymart-font-medium">🔍 {t('translationDashboard.qualityAnalysis', '质量分析')}</div>
              </div>
              <p className="luckymart-text-sm text-green-700">
                深度分析翻译质量问题并提供改进建议
              </p>
              <button className="mt-2 px-3 py-1 bg-green-600 text-white luckymart-text-sm luckymart-rounded hover:bg-green-700">
                开始分析
              </button>
            </div>

            <div className="luckymart-padding-md bg-purple-50 luckymart-border border-purple-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-purple-600 luckymart-font-medium">⚙️ {t('translationDashboard.autoFix', '自动修复')}</div>
              </div>
              <p className="luckymart-text-sm text-purple-700">
                尝试自动修复可识别的翻译质量问题
              </p>
              <button className="mt-2 px-3 py-1 bg-purple-600 text-white luckymart-text-sm luckymart-rounded hover:bg-purple-700">
                启用自动修复
              </button>
            </div>

            <div className="luckymart-padding-md bg-indigo-50 luckymart-border border-indigo-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-indigo-600 luckymart-font-medium">📋 {t('translationDashboard.terminologyCheck', '术语检查')}</div>
              </div>
              <p className="luckymart-text-sm text-indigo-700">
                检查术语一致性和标准化翻译
              </p>
              <button className="mt-2 px-3 py-1 bg-indigo-600 text-white luckymart-text-sm luckymart-rounded hover:bg-indigo-700">
                执行检查
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationQualityDashboard;