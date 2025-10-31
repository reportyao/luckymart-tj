import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Star, 
  MessageSquare, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown,
  Send,
  X,
  Calendar,
  User
} from 'lucide-react';

export interface FeedbackData {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  translationContext: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  rating: number; // 1-5 stars
  feedbackType: 'quality' | 'accuracy' | 'context' | 'cultural' | 'technical';
  comment?: string;
  issues: FeedbackIssue[];
  improvementSuggestion?: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'grammar' | 'terminology' | 'style' | 'meaning' | 'formatting';
  isResolved: boolean;
  tags: string[];
}

export interface FeedbackIssue {
  type: 'incorrect' | 'missing' | 'inappropriate' | 'format' | 'context';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  location?: string;
}

interface TranslationFeedbackCollectorProps {
  translationId?: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
  onClose?: () => void;
}

export const TranslationFeedbackCollector: React.FC<TranslationFeedbackCollectorProps> = ({
  translationId,
  originalText,
  translatedText,
  sourceLanguage,
  targetLanguage,
  context,
  onFeedbackSubmit,
  onClose
}) => {
  const { t, currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    rating: 0,
    feedbackType: 'quality' as FeedbackData['feedbackType'],
    comment: '',
    improvementSuggestion: '',
    urgency: 'medium' as FeedbackData['urgency'],
    category: 'meaning' as FeedbackData['category'],
    issues: [] as FeedbackIssue[],
    tags: [] as string[]
  });

  const [showIssuesForm, setShowIssuesForm] = useState(false);
  const [newIssue, setNewIssue] = useState<Partial<FeedbackIssue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 预定义的问题类型
  const predefinedIssueTypes = [
    { type: 'incorrect' as const, label: '翻译不准确', severity: 'major' },
    { type: 'missing' as const, label: '内容缺失', severity: 'moderate' },
    { type: 'inappropriate' as const, label: '用词不当', severity: 'moderate' },
    { type: 'format' as const, label: '格式错误', severity: 'minor' },
    { type: 'context' as const, label: '上下文不符', severity: 'major' }
  ];

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleAddIssue = useCallback(() => {
    if (newIssue.type && newItem.description) {
      const issue: FeedbackIssue = {
        type: newIssue.type,
        description: newIssue.description,
        severity: newIssue.severity || 'minor',
        location: newIssue.location
      };
      
      setFormData(prev => ({
        ...prev,
        issues: [...prev.issues, issue]
      }));
      
      setNewIssue({});
      setShowIssuesForm(false);
    }
  }, [newIssue]);

  const handleRemoveIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.rating || !formData.feedbackType) return;
    
    setIsSubmitting(true);
    
    try {
      const feedback: FeedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current_user_id', // 需要从用户上下文获取
        userName: 'Current User',
        timestamp: new Date(),
        translationContext: context || 'general',
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage,
        rating: formData.rating,
        feedbackType: formData.feedbackType,
        comment: formData.comment,
        issues: formData.issues,
        improvementSuggestion: formData.improvementSuggestion,
        urgency: formData.urgency,
        category: formData.category,
        isResolved: false,
        tags: formData.tags
      };

      // 发送反馈数据到后端
      await submitFeedbackToAPI(feedback);
      
      setIsSubmitted(true);
      onFeedbackSubmit?.(feedback);
      
      // 3秒后重置状态
      setTimeout(() => {
        setIsSubmitted(false);
        onClose?.();
      }, 3000);
      
    } catch (error) {
      console.error('提交反馈失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedbackToAPI = async (feedback: FeedbackData) => {
    // 这里应该调用实际的API端点
    const response = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback)
    });
    
    if (!response.ok) {
      throw new Error('提交反馈失败');
    }
    
    return response.json();
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="luckymart-padding-lg luckymart-text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full luckymart-layout-flex luckymart-layout-center justify-center mx-auto luckymart-spacing-md">
            <ThumbsUp className="luckymart-size-lg luckymart-size-lg text-green-600" />
          </div>
          <h3 className="luckymart-text-lg font-semibold text-gray-900 mb-2">
            感谢您的反馈！
          </h3>
          <p className="text-gray-600">
            您的意见对我们改进翻译质量非常重要
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="luckymart-layout-flex luckymart-layout-center justify-between">
          <CardTitle className="luckymart-layout-flex luckymart-layout-center gap-2">
            <MessageSquare className="luckymart-size-sm luckymart-size-sm" />
            翻译质量反馈
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 翻译内容展示 */}
        <div className="luckymart-spacing-md luckymart-padding-md bg-gray-50 luckymart-rounded-lg">
          <div>
            <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">原文:</Label>
            <p className="text-gray-900 mt-1">{originalText}</p>
          </div>
          <div>
            <Label className="luckymart-text-sm luckymart-font-medium text-gray-600">译文:</Label>
            <p className="text-gray-900 mt-1">{translatedText}</p>
          </div>
          <div className="luckymart-layout-flex luckymart-layout-center gap-2 luckymart-text-sm luckymart-text-secondary">
            <Badge variant="outline">{sourceLanguage}</Badge>
            <span>→</span>
            <Badge variant="outline">{targetLanguage}</Badge>
            {context && <span>• {context}</span>}
          </div>
        </div>

        {/* 评分 */}
        <div className="luckymart-spacing-md">
          <Label className="luckymart-text-sm luckymart-font-medium">整体评分 *</Label>
          <div className="luckymart-layout-flex luckymart-layout-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className={`p-1 transition-colors ${
                  star <= formData.rating 
                    ? 'text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                <Star className="luckymart-size-md luckymart-size-md fill-current" />
              </button>
            ))}
            <span className="ml-2 luckymart-text-sm text-gray-600">
              {formData.rating > 0 && `${formData.rating}/5`}
            </span>
          </div>
        </div>

        {/* 反馈类型 */}
        <div className="luckymart-spacing-md">
          <Label className="luckymart-text-sm luckymart-font-medium">反馈类型 *</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'quality', label: '整体质量' },
              { value: 'accuracy', label: '翻译准确性' },
              { value: 'context', label: '语境适配' },
              { value: 'cultural', label: '文化适应' },
              { value: 'technical', label: '技术问题' }
            ].map((type) => (
              <label key={type.value} className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                <input
                  type="radio"
                  name="feedbackType"
                  value={type.value}
                  checked={formData.feedbackType === type.value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    feedbackType: e.target.value as FeedbackData['feedbackType']
                  }))}
                  className="luckymart-rounded"
                />
                <span className="luckymart-text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 分类和优先级 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="luckymart-spacing-md">
            <Label className="luckymart-text-sm luckymart-font-medium">问题分类</Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                category: e.target.value as FeedbackData['category']
              }))}
              className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="meaning">含义理解</option>
              <option value="grammar">语法结构</option>
              <option value="terminology">专业术语</option>
              <option value="style">表达风格</option>
              <option value="formatting">格式排版</option>
            </select>
          </div>
          
          <div className="luckymart-spacing-md">
            <Label className="luckymart-text-sm luckymart-font-medium">紧急程度</Label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                urgency: e.target.value as FeedbackData['urgency']
              }))}
              className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低优先级</option>
              <option value="medium">中优先级</option>
              <option value="high">高优先级</option>
            </select>
          </div>
        </div>

        {/* 具体问题 */}
        <div className="luckymart-spacing-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <Label className="luckymart-text-sm luckymart-font-medium">发现的问题</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIssuesForm(!showIssuesForm)}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              添加问题
            </Button>
          </div>
          
          {formData.issues.length > 0 && (
            <div className="luckymart-spacing-sm">
              {formData.issues.map((issue, index) => (
                <div key={index} className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-padding-sm bg-red-50 luckymart-rounded luckymart-border">
                  <div>
                    <Badge 
                      variant={issue.severity === 'critical' || issue.severity === 'major' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {issue.type}
                    </Badge>
                    <p className="luckymart-text-sm text-gray-700 mt-1">{issue.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIssue(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showIssuesForm && (
            <div className="luckymart-padding-md luckymart-border luckymart-border-light luckymart-rounded-lg luckymart-spacing-md">
              <select
                value={newIssue.type || ''}
                onChange={(e) => setNewIssue(prev => ({ ...prev, type: e.target.value as FeedbackIssue['type'] }))}
                className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md"
              >
                <option value="">选择问题类型</option>
                {predefinedIssueTypes.map(issue => (
                  <option key={issue.type} value={issue.type}>{issue.label}</option>
                ))}
              </select>
              
              <Input
                placeholder="问题描述"
                value={newIssue.description || ''}
                onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <select
                value={newIssue.severity || 'minor'}
                onChange={(e) => setNewIssue(prev => ({ ...prev, severity: e.target.value as FeedbackIssue['severity'] }))}
                className="w-full px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md"
              >
                <option value="minor">轻微</option>
                <option value="moderate">中等</option>
                <option value="major">严重</option>
                <option value="critical">紧急</option>
              </select>
              
              <div className="luckymart-layout-flex gap-2">
                <Button size="sm" onClick={handleAddIssue}>添加</Button>
                <Button variant="outline" size="sm" onClick={() => setShowIssuesForm(false)}>取消</Button>
              </div>
            </div>
          )}
        </div>

        {/* 详细评论 */}
        <div className="luckymart-spacing-md">
          <Label className="luckymart-text-sm luckymart-font-medium">详细评论</Label>
          <Textarea
            placeholder="请详细描述您对翻译质量的看法..."
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            rows={3}
          />
        </div>

        {/* 改进建议 */}
        <div className="luckymart-spacing-md">
          <Label className="luckymart-text-sm luckymart-font-medium">改进建议</Label>
          <Textarea
            placeholder="您认为应该如何改进这个翻译？"
            value={formData.improvementSuggestion}
            onChange={(e) => setFormData(prev => ({ ...prev, improvementSuggestion: e.target.value }))}
            rows={2}
          />
        </div>

        {/* 提交按钮 */}
        <div className="luckymart-layout-flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!formData.rating || !formData.feedbackType || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full luckymart-animation-spin" />
                提交中...
              </div>
            ) : (
              <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                <Send className="w-4 h-4" />
                提交反馈
              </div>
            )}
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            您的反馈将帮助我们持续改进翻译质量。我们会在24小时内处理重要反馈。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TranslationFeedbackCollector;