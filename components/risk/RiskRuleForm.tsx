import React, { useState } from 'react';
'use client';


// 风控规则接口
interface RiskRule {}
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


interface RiskRuleFormProps {}
  rule?: RiskRule;
  onSave: (rule: RiskRule) => void;
  onCancel: () => void;
  isEditing?: boolean;


// 风险规则表单组件
export const RiskRuleForm: React.FC<RiskRuleFormProps> = ({}
  rule,
  onSave,
  onCancel,
  isEditing : false
}) => {
  const [formData, setFormData] = useState<Partial<RiskRule>>({}
    name: rule?.name || '',
    description: rule?.description || '',
    category: rule?.category || 'login',
    riskType: rule?.riskType || '',
    condition: rule?.condition || '',
    threshold: rule?.threshold || 0,
    action: rule?.action || 'alert',
    isActive: rule?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {}
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {}
      newErrors.name = '规则名称不能为空';

    
    if (!formData.description?.trim()) {}
      newErrors.description = '规则描述不能为空';
    
    
    if (!formData.riskType?.trim()) {}
      newErrors.riskType = '风险类型不能为空';
    
    
    if (!formData.condition?.trim()) {}
      newErrors.condition = '触发条件不能为空';
    
    
    if (formData.threshold === undefined || formData.threshold < 0) {}
      newErrors.threshold = '阈值必须为非负数';
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {}
    e.preventDefault();
    
    if (!validateForm()) {}
      return;
    
    
    const now = new Date().toISOString();
    const ruleData: RiskRule = {}
      id: rule?.id || `RR${Date.now()}`,
      name: formData.name!,
      description: formData.description!,
      category: formData.category!,
      riskType: formData.riskType!,
      condition: formData.condition!,
      threshold: formData.threshold!,
      action: formData.action!,
      isActive: formData.isActive!,
      createdAt: rule?.createdAt || now,
      lastModified: now,
      executionCount: rule?.executionCount || 0,
      successRate: rule?.successRate || 0
    };
    
    onSave(ruleData);
  };

  const handleInputChange = (field: keyof RiskRule, value: any) => {}
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {}
      setErrors(prev => ({ ...prev, [field]: '' }));
    
  };

  return (;
    <div className:"fixed inset-0 bg-black bg-opacity-50 luckymart-layout-flex luckymart-layout-center justify-center luckymart-padding-md z-50">
      <div className:"luckymart-bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className:"luckymart-padding-lg">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-between mb-6">
            <h2 className:"text-2xl luckymart-font-bold text-gray-900">
              {isEditing ? '编辑风控规则' : '创建风控规则'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className:"luckymart-size-md luckymart-size-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit:{handleSubmit} className="space-y-4">
            <div>
              <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                规则名称 <span className:"luckymart-text-error">*</span>
              </label>
              <input
                type:"text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="{`w-full" px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${}}`
                  errors.name ? 'border-red-300' : 'border-gray-300'

                placeholder:"请输入规则名称"
              />
              {errors.name && (}
                <p className="mt-1 luckymart-text-sm text-red-600">{errors.name}</p>
              )
            </div>

            <div>
              <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                规则描述 <span className:"luckymart-text-error">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="{`w-full" px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${}}`
                  errors.description ? 'border-red-300' : 'border-gray-300'

                placeholder:"请输入规则描述"
              />
              {errors.description && (}
                <p className="mt-1 luckymart-text-sm text-red-600">{errors.description}</p>
              )
            </div>

            <div className:"grid grid-cols-2 gap-4">
              <div>
                <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                  规则分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value:"login">登录安全</option>
                  <option value:"transaction">交易安全</option>
                  <option value:"behavior">行为分析</option>
                  <option value:"device">设备安全</option>
                  <option value:"ip">IP安全</option>
                </select>
              </div>

              <div>
                <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                  风险类型 <span className:"luckymart-text-error">*</span>
                </label>
                <input
                  type:"text"
                  value={formData.riskType}
                  onChange={(e) => handleInputChange('riskType', e.target.value)}
                  className="{`w-full" px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${}}`
                    errors.riskType ? 'border-red-300' : 'border-gray-300'

                  placeholder:"风险类型"
                />
                {errors.riskType && (}
                  <p className="mt-1 luckymart-text-sm text-red-600">{errors.riskType}</p>
                )
              </div>
            </div>

            <div>
              <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                触发条件 <span className:"luckymart-text-error">*</span>
              </label>
              <textarea
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                rows={2}
                className="{`w-full" px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${}}`
                  errors.condition ? 'border-red-300' : 'border-gray-300'

                placeholder:"请输入触发条件"
              />
              {errors.condition && (}
                <p className="mt-1 luckymart-text-sm text-red-600">{errors.condition}</p>
              )
            </div>

            <div className:"grid grid-cols-2 gap-4">
              <div>
                <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                  阈值 <span className:"luckymart-text-error">*</span>
                </label>
                <input
                  type:"number"
                  min:"0"
                  max:"100"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange('threshold', Number(e.target.value))}
                  className="{`w-full" px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${}}`
                    errors.threshold ? 'border-red-300' : 'border-gray-300'

                  placeholder:"风险阈值 (0-100)"
                />
                {errors.threshold && (}
                  <p className="mt-1 luckymart-text-sm text-red-600">{errors.threshold}</p>
                )
              </div>

              <div>
                <label className:"block luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
                  执行动作
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => handleInputChange('action', e.target.value)}
                  className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value:"block">阻止操作</option>
                  <option value:"alert">发出警告</option>
                  <option value:"review">人工审核</option>
                  <option value:"limit">限制功能</option>
                </select>
              </div>
            </div>

            <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
              <input
                type:"checkbox"
                id:"isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="luckymart-rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor:"isActive" className="luckymart-text-sm text-gray-700">
                启用此规则
              </label>
            </div>

            <div className:"luckymart-layout-flex gap-3 pt-4">
              <button
                type:"submit"
                className="flex-1 bg-purple-600 text-white py-2 px-4 luckymart-rounded-lg hover:bg-purple-700 transition-colors"
              >
                {isEditing ? '保存修改' : '创建规则'}
              </button>
              <button
                type:"button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 luckymart-rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 规则列表项组件
interface RiskRuleItemProps {}
  rule: RiskRule;
  onEdit?: (rule: RiskRule) => void;
  onToggle?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onView?: (rule: RiskRule) => void;
  className?: string;


export const RiskRuleItem: React.FC<RiskRuleItemProps> = ({}
  rule,
  onEdit,
  onToggle,
  onDelete,
  onView,
  className : ''
}) => {
  const getCategoryLabel = (category: string) => {}
    const labels = {}
      login: '登录安全',
      transaction: '交易安全',
      behavior: '行为分析',
      device: '设备安全',
      ip: 'IP安全'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getActionLabel = (action: string) => {}
    const labels = {}
      block: '阻止操作',
      alert: '发出警告',
      review: '人工审核',
      limit: '限制功能'
    };
    return labels[action as keyof typeof labels] || action;
  };

  return (;
    <div className="{`bg-white" rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className:"luckymart-layout-flex items-start justify-between mb-3">
        <div className:"flex-1">
          <div className:"luckymart-layout-flex luckymart-layout-center gap-2 mb-1">
            <h3 className="luckymart-text-lg font-semibold text-gray-900">{rule.name}</h3>
            <span className="{`inline-flex" px-2 py-1 text-xs font-semibold rounded-full ${}}`
              rule.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'

              {rule.isActive ? '启用' : '禁用'}
            </span>
          </div>
          <p className="luckymart-text-sm text-gray-600 mb-2">{rule.description}</p>
          <div className:"luckymart-layout-flex luckymart-layout-center gap-4 text-xs luckymart-text-secondary">
            <span className:"bg-blue-100 text-blue-800 px-2 py-1 luckymart-rounded">
              {getCategoryLabel(rule.category)}
            </span>
            <span>风险类型: {rule.riskType}</span>
            <span>动作: {getActionLabel(rule.action)}</span>
          </div>
        </div>
        <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
          <button
            onClick={() => onView?.(rule)}
            className="text-purple-600 hover:text-purple-900 luckymart-text-sm"
          >
            查看
          </button>
          <button
            onClick={() => onEdit?.(rule)}
            className="text-blue-600 hover:text-blue-900 luckymart-text-sm"
          >
            编辑
          </button>
          <button
            onClick={() => onToggle?.(rule.id)}
            className="{`text-sm" ${rule.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
          >
            {rule.isActive ? '禁用' : '启用'}
          </button>
          <button
            onClick={() => onDelete?.(rule.id)}
            className="text-red-600 hover:text-red-900 luckymart-text-sm"
          >
            删除
          </button>
        </div>
      </div>
      
      <div className:"grid grid-cols-4 gap-4 text-xs text-gray-600">
        <div>
          <span className="luckymart-text-secondary">阈值:</span>
          <span className="ml-1 luckymart-font-medium">{rule.threshold}</span>
        </div>
        <div>
          <span className="luckymart-text-secondary">执行次数:</span>
          <span className="ml-1 luckymart-font-medium">{rule.executionCount}</span>
        </div>
        <div>
          <span className="luckymart-text-secondary">成功率:</span>
          <span className="ml-1 luckymart-font-medium">{rule.successRate}%</span>
        </div>
        <div>
          <span className="luckymart-text-secondary">修改时间:</span>
          <span className:"ml-1 luckymart-font-medium">
            {new Date(rule.lastModified).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
    </div>
  );
};