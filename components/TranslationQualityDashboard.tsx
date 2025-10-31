'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationStats {
  totalFiles: number;
  avgCompleteness: number;
  totalIssues: number;
  criticalIssues: number;
}

interface QualityAlert {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  acknowledged: boolean;
}

interface TrendData {
  date: string;
  completeness: number;
  issues: number;
}

interface TranslationQualityDashboardProps {
  className?: string;
}

const TranslationQualityDashboard: React.FC<TranslationQualityDashboardProps> = ({ 
  className = "" 
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<TranslationStats>({
    totalFiles: 0,
    avgCompleteness: 0,
    totalIssues: 0,
    criticalIssues: 0
  });
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setStats({
        totalFiles: 15,
        avgCompleteness: 87,
        totalIssues: 23,
        criticalIssues: 5
      });
      setAlerts([
        {
          id: '1',
          message: '发现缺失的塔吉克语翻译',
          type: 'error',
          acknowledged: false
        },
        {
          id: '2', 
          message: '术语使用不一致',
          type: 'warning',
          acknowledged: false
        }
      ]);
      setTrends([
        { date: '2025-10-29', completeness: 85, issues: 25 },
        { date: '2025-10-30', completeness: 87, issues: 23 },
        { date: '2025-10-31', completeness: 87, issues: 23 }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const performQualityCheck = () => {
    // 模拟质量检查
    console.log('执行翻译质量检查...');
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto luckymart-padding-lg bg-gray-50 min-h-screen">
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-lg">
            <div className="luckymart-text-lg luckymart-font-medium">
              {t('translationDashboard.loading', '加载翻译质量数据...')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overallStats = stats;

  return (
    <div className={`max-w-7xl mx-auto luckymart-padding-lg bg-gray-50 min-h-screen ${className}`}>
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
                    <span className="text-sm text-gray-800">{alert.message}</span>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      确认
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 头部标题 */}
      <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg mb-6">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between">
          <h1 className="luckymart-text-2xl luckymart-font-bold luckymart-text-gray-800">
            {t('translationDashboard.title', '翻译质量监控')}
          </h1>
          <div className="luckymart-layout-flex luckymart-layout-center">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="px-4 py-2 bg-blue-600 text-white luckymart-rounded hover:bg-blue-700"
            >
              {t('translationDashboard.showRecommendations', showRecommendations ? '隐藏建议' : '显示建议')}
            </button>
          </div>
        </div>
      </div>

      {/* 统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-text-sm luckymart-text-gray-600 mb-1">
            {t('translationDashboard.totalFiles', '总文件数')}
          </div>
          <div className="luckymart-text-2xl luckymart-font-bold luckymart-text-blue-600">
            {overallStats.totalFiles}
          </div>
        </div>
        
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-text-sm luckymart-text-gray-600 mb-1">
            {t('translationDashboard.avgCompleteness', '平均完整性')}
          </div>
          <div className="luckymart-text-2xl luckymart-font-bold luckymart-text-green-600">
            {overallStats.avgCompleteness}%
          </div>
        </div>
        
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-text-sm luckymart-text-gray-600 mb-1">
            {t('translationDashboard.totalIssues', '总问题数')}
          </div>
          <div className="luckymart-text-2xl luckymart-font-bold luckymart-text-orange-600">
            {overallStats.totalIssues}
          </div>
        </div>
        
        <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg">
          <div className="luckymart-text-sm luckymart-text-gray-600 mb-1">
            {t('translationDashboard.criticalIssues', '严重问题')}
          </div>
          <div className="luckymart-text-2xl luckymart-font-bold luckymart-text-red-600">
            {overallStats.criticalIssues}
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-lg mb-6">
        <h2 className="luckymart-text-lg luckymart-font-semibold luckymart-spacing-md">
          {t('translationDashboard.trend', '质量趋势')}
        </h2>
        <div className="luckymart-spacing-md">
          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-lg">
            {trends.map((trend, index) => (
              <div key={index} className="luckymart-layout-flex luckymart-layout-column luckymart-layout-center luckymart-spacing-sm">
                <div className="luckymart-text-lg luckymart-font-medium">
                  {trend.completeness}%
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(trend.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                  <span className="text-red-600 luckymart-font-medium">🚨 {t('translationDashboard.criticalIssues', '严重问题')}</span>
                </div>
                <p className="luckymart-text-sm text-red-700">
                  存在 {overallStats.criticalIssues} 个严重问题需要立即修复
                </p>
                <div className="mt-2 luckymart-spacing-sm">
                  <button 
                    onClick={performQualityCheck}
                    className="px-3 py-1 bg-red-600 text-white luckymart-text-sm luckymart-rounded hover:bg-red-700"
                  >
                    立即修复
                  </button>
                </div>
              </div>
            )}

            <div className="luckymart-padding-md bg-yellow-50 luckymart-border border-yellow-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-yellow-600 luckymart-font-medium">⚠️ {t('translationDashboard.missingTranslations', '缺失翻译')}</span>
              </div>
              <p className="luckymart-text-sm text-yellow-700">
                检测到缺失翻译，建议补充以提高完整性
              </p>
              <div className="mt-2 luckymart-spacing-sm">
                <button className="px-3 py-1 bg-yellow-600 text-white luckymart-text-sm luckymart-rounded hover:bg-yellow-700">
                  自动补全
                </button>
              </div>
            </div>

            <div className="luckymart-padding-md bg-green-50 luckymart-border border-green-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-green-600 luckymart-font-medium">📊 {t('translationDashboard.qualityReport', '质量报告')}</span>
              </div>
              <p className="luckymart-text-sm text-green-700">
                生成详细的翻译质量分析报告
              </p>
              <button className="mt-2 px-3 py-1 bg-green-600 text-white luckymart-text-sm luckymart-rounded hover:bg-green-700">
                生成报告
              </button>
            </div>

            <div className="luckymart-padding-md bg-purple-50 luckymart-border border-purple-200 luckymart-rounded-lg">
              <div className="luckymart-layout-flex luckymart-layout-center mb-2">
                <span className="text-purple-600 luckymart-font-medium">⚙️ {t('translationDashboard.autoFix', '自动修复')}</span>
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
                <span className="text-indigo-600 luckymart-font-medium">📋 {t('translationDashboard.terminologyCheck', '术语检查')}</span>
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