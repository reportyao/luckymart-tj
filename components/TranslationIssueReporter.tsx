import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Flag, 
  Clock, 
  User, 
  MapPin, 
  Send,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

export interface TranslationIssue {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  timestamp: Date;
  title: string;
  description: string;
  category: 'accuracy' | 'grammar' | 'terminology' | 'style' | 'context' | 'cultural' | 'technical' | 'ui';
  subcategory?: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'reported' | 'acknowledged' | 'investigating' | 'fixing' | 'testing' | 'resolved' | 'closed';
  
  // 翻译相关
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  page?: string;
  component?: string;
  
  // 位置信息
  location?: {
    page?: string;
    section?: string;
    elementId?: string;
    coordinates?: { x: number; y: number };
  };
  
  // 附件和证据
  screenshots?: string[];
  additionalFiles?: string[];
  reproductionSteps?: string[];
  
  // 处理信息
  assignedTo?: string;
  estimatedFixTime?: number; // 小时
  actualFixTime?: number;
  resolution?: string;
  preventionMeasures?: string[];
  
  // 统计
  votes: number; // 用户投票支持
  duplicates?: string[]; // 重复问题ID
  relatedIssues?: string[]; // 相关问题
  
  // 元数据
  tags: string[];
  isPublic: boolean;
  isUrgent: boolean;
}

export interface IssueFilter {
  status?: TranslationIssue['status'][];
  category?: TranslationIssue['category'][];
  severity?: TranslationIssue['severity'][];
  priority?: TranslationIssue['priority'][];
  assignedTo?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  reporter?: string;
  tags?: string[];
  text?: string;
}

interface TranslationIssueReporterProps {
  onIssueCreated?: (issue: TranslationIssue) => void;
  initialData?: Partial<TranslationIssue>;
  isModal?: boolean;
  onClose?: () => void;
}

export const TranslationIssueReporter: React.FC<TranslationIssueReporterProps> = ({
  onIssueCreated,
  initialData,
  isModal = false,
  onClose
}) => {
  const { t, currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState<Partial<TranslationIssue>>({
    category: 'accuracy',
    severity: 'moderate',
    priority: 'medium',
    status: 'reported',
    votes: 0,
    tags: [],
    isPublic: true,
    isUrgent: false,
    sourceLanguage: 'en-US',
    targetLanguage: 'zh-CN',
    ...initialData
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reproductionStep, setReproductionStep] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    { value: 'accuracy', label: '翻译准确性' },
    { value: 'grammar', label: '语法问题' },
    { value: 'terminology', label: '术语使用' },
    { value: 'style', label: '表达风格' },
    { value: 'context', label: '语境适配' },
    { value: 'cultural', label: '文化适应' },
    { value: 'technical', label: '技术问题' },
    { value: 'ui', label: '界面显示' }
  ];

  const severityOptions = [
    { value: 'minor', label: '轻微', description: '不影响使用的小问题' },
    { value: 'moderate', label: '中等', description: '影响用户体验' },
    { value: 'major', label: '严重', description: '严重影响使用' },
    { value: 'critical', label: '紧急', description: '系统无法正常工作' }
  ];

  const priorityOptions = [
    { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-800' }
  ];

  const statusOptions = [
    { value: 'reported', label: '已报告', color: 'bg-gray-100 text-gray-800' },
    { value: 'acknowledged', label: '已确认', color: 'bg-blue-100 text-blue-800' },
    { value: 'investigating', label: '调查中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'fixing', label: '修复中', color: 'bg-orange-100 text-orange-800' },
    { value: 'testing', label: '测试中', color: 'bg-purple-100 text-purple-800' },
    { value: 'resolved', label: '已解决', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: '已关闭', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleInputChange = (field: keyof TranslationIssue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddReproductionStep = () => {
    if (reproductionStep.trim()) {
      const currentSteps = formData.reproductionSteps || [];
      setFormData(prev => ({
        ...prev,
        reproductionSteps: [...currentSteps, reproductionStep.trim()]
      }));
      setReproductionStep('');
    }
  };

  const handleRemoveReproductionStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reproductionSteps: prev.reproductionSteps?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category);
      case 2:
        return !!(formData.originalText && formData.translatedText && formData.sourceLanguage && formData.targetLanguage);
      case 3:
        return true; // 可选步骤
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      const issue: TranslationIssue = {
        id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reporterId: 'current_user_id', // 需要从用户上下文获取
        reporterName: 'Current User',
        timestamp: new Date(),
        title: formData.title!,
        description: formData.description!,
        category: formData.category!,
        subcategory: formData.subcategory,
        severity: formData.severity!,
        priority: formData.priority!,
        status: formData.status!,
        originalText: formData.originalText!,
        translatedText: formData.translatedText!,
        sourceLanguage: formData.sourceLanguage!,
        targetLanguage: formData.targetLanguage!,
        context: formData.context || '',
        page: formData.page,
        component: formData.component,
        location: formData.location,
        screenshots: formData.screenshots || [],
        additionalFiles: formData.additionalFiles || [],
        reproductionSteps: formData.reproductionSteps || [],
        assignedTo: formData.assignedTo,
        estimatedFixTime: formData.estimatedFixTime,
        resolution: formData.resolution,
        preventionMeasures: formData.preventionMeasures || [],
        votes: 0,
        duplicates: [],
        relatedIssues: [],
        tags: formData.tags || [],
        isPublic: formData.isPublic!,
        isUrgent: formData.isUrgent!
      };

      // 保存到本地存储（实际应该发送到后端）
      await saveIssueToStorage(issue);
      
      onIssueCreated?.(issue);
      
      // 重置表单
      setFormData({
        category: 'accuracy',
        severity: 'moderate',
        priority: 'medium',
        status: 'reported',
        votes: 0,
        tags: [],
        isPublic: true,
        isUrgent: false,
        sourceLanguage: 'en-US',
        targetLanguage: 'zh-CN'
      });
      setCurrentStep(1);
      
      if (isModal && onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('提交问题报告失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveIssueToStorage = async (issue: TranslationIssue) => {
    try {
      const existing = JSON.parse(localStorage.getItem('translation_issues') || '[]');
      existing.push(issue);
      localStorage.setItem('translation_issues', JSON.stringify(existing));
    } catch (error) {
      console.error('保存问题数据失败:', error);
      throw error;
    }
  };

  const renderStepIndicator = () => (
    <div className="luckymart-layout-flex luckymart-layout-center justify-center mb-6">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            step <= currentStep 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 text-gray-400'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base luckymart-font-medium">
                问题标题 *
              </Label>
              <Input
                id="title"
                placeholder="简要描述问题"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base luckymart-font-medium">
                详细描述 *
              </Label>
              <Textarea
                id="description"
                placeholder="详细描述问题现象、影响范围等"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base luckymart-font-medium">问题分类 *</Label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full mt-2 px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-base luckymart-font-medium">严重程度 *</Label>
                <select
                  value={formData.severity || ''}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full mt-2 px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {severityOptions.map(sev => (
                    <option key={sev.value} value={sev.value}>{sev.label}</option>
                  ))}
                </select>
                <p className="text-xs luckymart-text-secondary mt-1">
                  {severityOptions.find(s => s.value === formData.severity)?.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base luckymart-font-medium">优先级</Label>
                <div className="luckymart-layout-flex gap-2 mt-2">
                  {priorityOptions.map(priority => (
                    <label key={priority.value} className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="luckymart-rounded"
                      />
                      <Badge className={priority.color}>
                        {priority.label}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              <div className="luckymart-layout-flex luckymart-layout-center space-x-4 mt-6">
                <label className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent || false}
                    onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                    className="luckymart-rounded"
                  />
                  <span className="luckymart-text-sm">紧急问题</span>
                </label>

                <label className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                  <input
                    type="checkbox"
                    checked={formData.isPublic !== false}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    className="luckymart-rounded"
                  />
                  <span className="luckymart-text-sm">公开问题</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base luckymart-font-medium">源语言 *</Label>
                <select
                  value={formData.sourceLanguage || ''}
                  onChange={(e) => handleInputChange('sourceLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en-US">English (US)</option>
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="zh-TW">中文 (繁體)</option>
                  <option value="ru-RU">Русский</option>
                  <option value="tg-TJ">Тоҷикӣ</option>
                </select>
              </div>

              <div>
                <Label className="text-base luckymart-font-medium">目标语言 *</Label>
                <select
                  value={formData.targetLanguage || ''}
                  onChange={(e) => handleInputChange('targetLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="zh-TW">中文 (繁體)</option>
                  <option value="en-US">English (US)</option>
                  <option value="ru-RU">Русский</option>
                  <option value="tg-TJ">Тоҷикӣ</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="originalText" className="text-base luckymart-font-medium">
                原文内容 *
              </Label>
              <Textarea
                id="originalText"
                placeholder="请输入有问题的原文内容"
                value={formData.originalText || ''}
                onChange={(e) => handleInputChange('originalText', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="translatedText" className="text-base luckymart-font-medium">
                译文内容 *
              </Label>
              <Textarea
                id="translatedText"
                placeholder="请输入有问题的译文内容"
                value={formData.translatedText || ''}
                onChange={(e) => handleInputChange('translatedText', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="context" className="text-base luckymart-font-medium">
                使用场景/上下文
              </Label>
              <Textarea
                id="context"
                placeholder="描述这个翻译的使用场景，有助于更好地理解问题"
                value={formData.context || ''}
                onChange={(e) => handleInputChange('context', e.target.value)}
                rows={2}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page" className="text-base luckymart-font-medium">
                  所在页面
                </Label>
                <Input
                  id="page"
                  placeholder="例如：产品详情页"
                  value={formData.page || ''}
                  onChange={(e) => handleInputChange('page', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="component" className="text-base luckymart-font-medium">
                  组件名称
                </Label>
                <Input
                  id="component"
                  placeholder="例如：ProductCard"
                  value={formData.component || ''}
                  onChange={(e) => handleInputChange('component', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base luckymart-font-medium">重现步骤</Label>
              <div className="mt-2 luckymart-spacing-sm">
                {formData.reproductionSteps?.map((step, index) => (
                  <div key={index} className="luckymart-layout-flex luckymart-layout-center gap-2 luckymart-padding-sm bg-gray-50 luckymart-rounded">
                    <span className="luckymart-text-sm text-gray-600">{index + 1}.</span>
                    <span className="flex-1">{step}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveReproductionStep(index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="luckymart-layout-flex gap-2">
                  <Input
                    placeholder="添加重现步骤"
                    value={reproductionStep}
                    onChange={(e) => setReproductionStep(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddReproductionStep()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddReproductionStep}
                    disabled={!reproductionStep.trim()}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base luckymart-font-medium">标签</Label>
              <div className="mt-2 luckymart-spacing-sm">
                <div className="luckymart-layout-flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="luckymart-layout-flex luckymart-layout-center gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="luckymart-layout-flex gap-2">
                  <Input
                    placeholder="添加标签"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? '隐藏' : '显示'}高级选项
              </Button>
              
              {showAdvanced && (
                <div className="luckymart-spacing-md space-y-4 luckymart-padding-md luckymart-border luckymart-border-light luckymart-rounded-lg">
                  <div>
                    <Label htmlFor="assignedTo" className="luckymart-text-sm luckymart-font-medium">
                      分配给
                    </Label>
                    <Input
                      id="assignedTo"
                      placeholder="负责人姓名或ID"
                      value={formData.assignedTo || ''}
                      onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedFixTime" className="luckymart-text-sm luckymart-font-medium">
                      预计修复时间（小时）
                    </Label>
                    <Input
                      id="estimatedFixTime"
                      type="number"
                      placeholder="24"
                      value={formData.estimatedFixTime || ''}
                      onChange={(e) => handleInputChange('estimatedFixTime', parseInt(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="luckymart-text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full luckymart-layout-flex luckymart-layout-center justify-center mx-auto luckymart-spacing-md">
                <Flag className="luckymart-size-lg luckymart-size-lg text-blue-600" />
              </div>
              <h3 className="luckymart-text-lg font-semibold text-gray-900 mb-2">
                确认问题报告
              </h3>
              <p className="text-gray-600">
                请检查以下信息，确认无误后提交
              </p>
            </div>

            <div className="space-y-4 luckymart-padding-md bg-gray-50 luckymart-rounded-lg">
              <div>
                <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">标题</Label>
                <p className="text-gray-900">{formData.title}</p>
              </div>
              
              <div>
                <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">分类</Label>
                <div className="luckymart-layout-flex luckymart-layout-center gap-2 mt-1">
                  <Badge>{categories.find(c => c.value === formData.category)?.label}</Badge>
                  <Badge variant="outline">{formData.severity}</Badge>
                  <Badge className={
                    priorityOptions.find(p => p.value === formData.priority)?.color
                  }>
                    {priorityOptions.find(p => p.value === formData.priority)?.label}优先级
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">语言对</Label>
                <p className="text-gray-900 mt-1">
                  {formData.sourceLanguage} → {formData.targetLanguage}
                </p>
              </div>
              
              <div>
                <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">描述</Label>
                <p className="text-gray-900 mt-1">{formData.description}</p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                提交后，我们将在24小时内处理您的问题报告。您可以在问题追踪页面查看处理进度。
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const containerClass = isModal 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    : "w-full max-w-4xl mx-auto";

  return (
    <div className={containerClass}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
              <Flag className="luckymart-size-sm luckymart-size-sm" />
              翻译问题报告
            </CardTitle>
            {isModal && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepIndicator()}
          {renderStepContent()}

          {/* 导航按钮 */}
          <div className="luckymart-layout-flex justify-between pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  上一步
                </Button>
              )}
            </div>
            
            <div className="luckymart-layout-flex gap-3">
              {currentStep < 4 ? (
                <Button 
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full luckymart-animation-spin" />
                      提交中...
                    </div>
                  ) : (
                    <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                      <Send className="w-4 h-4" />
                      提交报告
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationIssueReporter;