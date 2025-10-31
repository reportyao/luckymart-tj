'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RiskRule {
  id: string;
  name: string;
  description: string;
  category: string;
  riskType: string;
  condition: string;
  threshold: number;
  action: string;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
  executionCount: number;
  successRate: number;
}

// 风控规则详情弹窗
const RiskRuleDetail = ({ 
  rule, 
  onClose, 
  onSave,
  isEditing = false 
}: { 
  rule: RiskRule | null;
  onClose: () => void;
  onSave: (rule: RiskRule) => void;
  isEditing?: boolean;
}) => {
  const [editRule, setEditRule] = useState<RiskRule | null>(null);

  useEffect(() => {
    if (rule) {
      setEditRule({ ...rule });
    }
  }, [rule]);

  if (!rule || !editRule) return null;

  const handleSave = () => {
    if (editRule) {
      onSave(editRule);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? '编辑风控规则' : '风控规则详情'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则名称</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editRule.name}
                    onChange={(e) => setEditRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-gray-900">{rule.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则分类</label>
                {isEditing ? (
                  <select
                    value={editRule.category}
                    onChange={(e) => setEditRule(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="login">登录安全</option>
                    <option value="transaction">交易安全</option>
                    <option value="behavior">行为分析</option>
                    <option value="device">设备安全</option>
                    <option value="ip">IP安全</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{rule.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">规则描述</label>
              {isEditing ? (
                <textarea
                  value={editRule.description}
                  onChange={(e) => setEditRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-gray-900">{rule.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">风险类型</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editRule.riskType}
                    onChange={(e) => setEditRule(prev => prev ? { ...prev, riskType: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-gray-900">{rule.riskType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">阈值</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editRule.threshold}
                    onChange={(e) => setEditRule(prev => prev ? { ...prev, threshold: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-gray-900">{rule.threshold}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">触发条件</label>
              {isEditing ? (
                <textarea
                  value={editRule.condition}
                  onChange={(e) => setEditRule(prev => prev ? { ...prev, condition: e.target.value } : null)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-gray-900">{rule.condition}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">执行动作</label>
              {isEditing ? (
                <select
                  value={editRule.action}
                  onChange={(e) => setEditRule(prev => prev ? { ...prev, action: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="block">阻止操作</option>
                  <option value="alert">发出警告</option>
                  <option value="review">人工审核</option>
                  <option value="limit">限制功能</option>
                </select>
              ) : (
                <p className="text-gray-900">{rule.action}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">创建时间</label>
                <p className="text-gray-900">{new Date(rule.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最后修改</label>
                <p className="text-gray-900">{new Date(rule.lastModified).toLocaleString('zh-CN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">执行次数</label>
                <p className="text-gray-900">{rule.executionCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成功率</label>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${rule.successRate}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-900">{rule.successRate}%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">规则状态</label>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editRule.isActive}
                      onChange={(e) => setEditRule(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {editRule.isActive ? '启用' : '禁用'}
                    </span>
                  </label>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    rule.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {rule.isActive ? '启用' : '禁用'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                保存
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RiskRulesPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<RiskRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState<Partial<RiskRule>>({
    name: '',
    description: '',
    category: 'login',
    riskType: '',
    condition: '',
    threshold: 0,
    action: 'alert',
    isActive: true
  });
  const [filters, setFilters] = useState({
    category: 'all',
    isActive: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {
      router.push('/admin');
      return;
    }

    setAdminInfo(JSON.parse(info));
    loadRiskRules();
    setLoading(false);
  }, [router]);

  // 模拟数据
  const loadRiskRules = () => {
    const mockRules: RiskRule[] = [
      {
        id: 'RR001',
        name: '异常登录检测',
        description: '检测用户从异常地理位置或设备登录',
        category: 'login',
        riskType: '异常登录',
        condition: 'IP地址不在常用范围内 或 设备指纹不匹配',
        threshold: 70,
        action: 'alert',
        isActive: true,
        createdAt: '2025-10-01T10:00:00Z',
        lastModified: '2025-10-30T14:30:00Z',
        executionCount: 156,
        successRate: 92.5
      },
      {
        id: 'RR002',
        name: '大额交易监控',
        description: '监控单笔交易金额异常的行为',
        category: 'transaction',
        riskType: '大额交易',
        condition: '单笔交易金额 > 用户历史平均值的3倍',
        threshold: 80,
        action: 'review',
        isActive: true,
        createdAt: '2025-10-02T09:00:00Z',
        lastModified: '2025-10-29T16:20:00Z',
        executionCount: 89,
        successRate: 87.2
      },
      {
        id: 'RR003',
        name: '频繁操作检测',
        description: '检测用户在短时间内进行大量操作',
        category: 'behavior',
        riskType: '频繁操作',
        condition: '5分钟内操作次数 > 20次',
        threshold: 85,
        action: 'block',
        isActive: true,
        createdAt: '2025-10-03T11:30:00Z',
        lastModified: '2025-10-28T10:15:00Z',
        executionCount: 234,
        successRate: 95.8
      },
      {
        id: 'RR004',
        name: '设备指纹异常',
        description: '检测设备指纹与历史记录不符的情况',
        category: 'device',
        riskType: '设备指纹异常',
        condition: '当前设备指纹与历史指纹不匹配',
        threshold: 75,
        action: 'alert',
        isActive: false,
        createdAt: '2025-10-04T14:20:00Z',
        lastModified: '2025-10-25T09:45:00Z',
        executionCount: 67,
        successRate: 89.1
      },
      {
        id: 'RR005',
        name: 'IP地理位置检测',
        description: '检测登录IP地理位置异常',
        category: 'ip',
        riskType: 'IP地理位置异常',
        condition: '登录IP地理位置与常用地点不符',
        threshold: 60,
        action: 'limit',
        isActive: true,
        createdAt: '2025-10-05T08:15:00Z',
        lastModified: '2025-10-27T13:30:00Z',
        executionCount: 123,
        successRate: 91.3
      },
      {
        id: 'RR006',
        name: '机器人行为检测',
        description: '检测疑似机器人或自动化操作',
        category: 'behavior',
        riskType: '机器人行为',
        condition: '操作模式符合机器人特征',
        threshold: 90,
        action: 'block',
        isActive: true,
        createdAt: '2025-10-06T16:45:00Z',
        lastModified: '2025-10-26T11:20:00Z',
        executionCount: 45,
        successRate: 97.8
      }
    ];
    setRules(mockRules);
  };

  // 筛选和排序
  useEffect(() => {
    let filtered = rules.filter(rule => {
      if (filters.category !== 'all' && rule.category !== filters.category) return false;
      if (filters.isActive !== 'all') {
        const isActive = filters.isActive === 'active';
        if (rule.isActive !== isActive) return false;
      }
      if (filters.search && !rule.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !rule.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'createdAt':
        case 'lastModified':
          aValue = new Date(a[sortBy as keyof RiskRule] as string).getTime();
          bValue = new Date(b[sortBy as keyof RiskRule] as string).getTime();
          break;
        case 'executionCount':
        case 'successRate':
        case 'threshold':
          aValue = a[sortBy as keyof RiskRule];
          bValue = b[sortBy as keyof RiskRule];
          break;
        default:
          aValue = a[sortBy as keyof RiskRule];
          bValue = b[sortBy as keyof RiskRule];
      }
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredRules(filtered);
  }, [rules, filters, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreateRule = () => {
    if (newRule.name && newRule.description) {
      const rule: RiskRule = {
        id: `RR${String(rules.length + 1).padStart(3, '0')}`,
        name: newRule.name!,
        description: newRule.description!,
        category: newRule.category!,
        riskType: newRule.riskType!,
        condition: newRule.condition!,
        threshold: newRule.threshold!,
        action: newRule.action!,
        isActive: newRule.isActive!,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        executionCount: 0,
        successRate: 0
      };
      setRules(prev => [...prev, rule]);
      setShowCreateForm(false);
      setNewRule({
        name: '',
        description: '',
        category: 'login',
        riskType: '',
        condition: '',
        threshold: 0,
        action: 'alert',
        isActive: true
      });
    }
  };

  const handleUpdateRule = (updatedRule: RiskRule) => {
    setRules(prev => prev.map(rule => 
      rule.id === updatedRule.id 
        ? { ...updatedRule, lastModified: new Date().toISOString() }
        : rule
    ));
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive, lastModified: new Date().toISOString() }
        : rule
    ));
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">风控规则管理</h1>
              <p className="text-sm text-gray-600">配置和管理风控规则</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              新建规则
            </button>
            <button
              onClick={() => router.push('/admin/risk-dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              返回风控面板
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">总规则数</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">活跃规则</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {rules.filter(r => r.isActive).length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">总执行次数</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {rules.reduce((sum, r) => sum + r.executionCount, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">平均成功率</h3>
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {Math.round(rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length)}%
            </p>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <input
                type="text"
                placeholder="搜索规则名称或描述"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">规则分类</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">全部</option>
                <option value="login">登录安全</option>
                <option value="transaction">交易安全</option>
                <option value="behavior">行为分析</option>
                <option value="device">设备安全</option>
                <option value="ip">IP安全</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">全部</option>
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
        </div>

        {/* 规则列表 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    规则名称 {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('executionCount')}
                  >
                    执行次数 {sortBy === 'executionCount' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('successRate')}
                    >
                    成功率 {sortBy === 'successRate' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastModified')}
                  >
                    最后修改 {sortBy === 'lastModified' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {rule.category === 'login' && '登录安全'}
                        {rule.category === 'transaction' && '交易安全'}
                        {rule.category === 'behavior' && '行为分析'}
                        {rule.category === 'device' && '设备安全'}
                        {rule.category === 'ip' && 'IP安全'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {rule.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.executionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${rule.successRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{rule.successRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rule.lastModified).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsEditing(false);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsEditing(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`${rule.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {rule.isActive ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredRules.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
              <p className="mt-1 text-sm text-gray-500">没有找到匹配的风控规则</p>
            </div>
          )}
        </div>
      </div>

      {/* 创建规则表单 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">创建风控规则</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">规则名称</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="请输入规则名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">规则描述</label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="请输入规则描述"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">规则分类</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="login">登录安全</option>
                      <option value="transaction">交易安全</option>
                      <option value="behavior">行为分析</option>
                      <option value="device">设备安全</option>
                      <option value="ip">IP安全</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">风险类型</label>
                    <input
                      type="text"
                      value={newRule.riskType}
                      onChange={(e) => setNewRule(prev => ({ ...prev, riskType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="风险类型"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">触发条件</label>
                  <textarea
                    value={newRule.condition}
                    onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="请输入触发条件"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">阈值</label>
                    <input
                      type="number"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="风险阈值"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">执行动作</label>
                    <select
                      value={newRule.action}
                      onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="block">阻止操作</option>
                      <option value="alert">发出警告</option>
                      <option value="review">人工审核</option>
                      <option value="limit">限制功能</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRule.isActive}
                    onChange={(e) => setNewRule(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="text-sm text-gray-700">启用此规则</label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreateRule}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  创建规则
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 规则详情/编辑弹窗 */}
      <RiskRuleDetail
        rule={selectedRule}
        onClose={() => {
          setSelectedRule(null);
          setIsEditing(false);
        }}
        onSave={handleUpdateRule}
        isEditing={isEditing}
      />
    </div>
  );
}