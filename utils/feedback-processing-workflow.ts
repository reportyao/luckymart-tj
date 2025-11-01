import { FeedbackData } from '../components/TranslationFeedbackCollector';
import { TranslationIssue } from '../components/TranslationIssueReporter';
/**
 * 反馈处理和响应机制
 * 定义用户反馈的处理流程、响应时间、分类和优先级管理
 */


export interface ProcessingWorkflow {
  id: string;
  name: string;
  description: string;
  triggerConditions: WorkflowTrigger[];
  steps: WorkflowStep[];
  sla: SLAConfig;
  escalationRules: EscalationRule[];
  automationRules: AutomationRule[];
}

export interface WorkflowTrigger {
  type: 'feedback_created' | 'issue_reported' | 'rating_below_threshold' | 'urgent_priority' | 'repeat_issue';
  condition: string;
  value?: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'auto' | 'manual' | 'approval' | 'notification';
  assignee?: string;
  assigneeRole?: 'translation_team' | 'quality_control' | 'product_manager' | 'engineering';
  timeLimit?: number; // 小时
  actions: StepAction[];
  dependencies?: string[]; // 依赖的前置步骤
  conditions?: StepCondition[];
}

export interface StepAction {
  type: 'assign' | 'notify' | 'update_status' | 'create_task' | 'escalate' | 'auto_resolve';
  parameters: { [key: string]: any };
  template?: string;
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface SLAConfig {
  responseTime: number; // 首次响应时间（小时）
  resolutionTime: number; // 解决时间（小时）
  acknowledgmentTime: number; // 确认时间（小时）
  escalationTime: number; // 升级时间（小时）
  businessHoursOnly: boolean;
  weekendIncluded: boolean;
  workingHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
}

export interface EscalationRule {
  id: string;
  name: string;
  trigger: 'sla_breach' | 'priority_upgrade' | 'repeat_issue' | 'customer_complaint';
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  timeout?: number; // 小时
}

export interface EscalationCondition {
  field: string;
  operator: string;
  value: any;
}

export interface EscalationAction {
  type: 'notify_manager' | 'assign_to_senior' | 'create_incident' | 'update_priority';
  recipients: string[];
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AutomationAction {
  type: 'auto_assign' | 'auto_tag' | 'auto_respond' | 'auto_close' | 'create_jira_ticket';
  parameters: { [key: string]: any };
}

export interface ProcessingStats {
  totalProcessed: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
  escalations: number;
  automationRate: number;
  customerSatisfaction: number;
}

export interface QueueItem {
  id: string;
  type: 'feedback' | 'issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'waiting' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  data: FeedbackData | TranslationIssue;
  workflow: ProcessingWorkflow;
  currentStep?: string;
  history: ProcessingHistoryItem[];
}

export interface ProcessingHistoryItem {
  id: string;
  step: string;
  action: string;
  performedBy?: string;
  timestamp: Date;
  notes?: string;
  attachments?: string[];
}

// 默认工作流程配置
export const DEFAULT_WORKFLOWS: ProcessingWorkflow[] = [;
  {
    id: 'standard_feedback',
    name: '标准反馈处理',
    description: '处理一般用户反馈的标准流程',
    triggerConditions: [
      {
        type: 'feedback_created',
        condition: 'rating >= 3',
        value: 3
}
    ],
    steps: [
      {
        id: 'auto_acknowledgment',
        name: '自动确认',
        type: 'auto',
        timeLimit: 1,
        actions: [
          {
            type: 'auto_respond',
            parameters: {
              message: '感谢您的反馈，我们已收到并正在处理中。',
              channel: 'email'
            }
          }
        ]
      },
      {
        id: 'initial_assessment',
        name: '初步评估',
        type: 'manual',
        assigneeRole: 'quality_control',
        timeLimit: 4,
        actions: [
          {
            type: 'update_status',
            parameters: {
              status: 'acknowledged'
            }
          }
        ],
        dependencies: ['auto_acknowledgment']
      },
      {
        id: 'detailed_analysis',
        name: '详细分析',
        type: 'manual',
        assigneeRole: 'translation_team',
        timeLimit: 24,
        actions: [
          {
            type: 'assign',
            parameters: {
              category: 'translation'
            }
          },
          {
            type: 'notify',
            parameters: {
              recipients: ['translation_lead'],
              message: '有新的翻译问题需要处理'
            }
          }
        ],
        dependencies: ['initial_assessment']
      },
      {
        id: 'implementation',
        name: '实施改进',
        type: 'manual',
        assigneeRole: 'engineering',
        timeLimit: 72,
        actions: [
          {
            type: 'update_status',
            parameters: {
              status: 'implementing'
            }
          },
          {
            type: 'create_task',
            parameters: {
              system: 'jira',
              project: 'TRANSLATION',
              issueType: 'Improvement'
            }
          }
        ],
        dependencies: ['detailed_analysis']
      },
      {
        id: 'verification',
        name: '验证确认',
        type: 'manual',
        assigneeRole: 'quality_control',
        timeLimit: 8,
        actions: [
          {
            type: 'update_status',
            parameters: {
              status: 'verified'
            }
          }
        ],
        dependencies: ['implementation']
      },
      {
        id: 'closure',
        name: '关闭反馈',
        type: 'auto',
        actions: [
          {
            type: 'auto_resolve',
            parameters: {
              notifyUser: true
            }
          },
          {
            type: 'notify',
            parameters: {
              recipients: ['original_reporter'],
              message: '您的反馈已经处理完成，感谢您的耐心等待。'
            }
          }
        ],
        dependencies: ['verification']
      }
    ],
    sla: {
      responseTime: 1,
      resolutionTime: 96,
      acknowledgmentTime: 4,
      escalationTime: 12,
      businessHoursOnly: false,
      weekendIncluded: true
    },
    escalationRules: [
      {
        id: 'urgent_escalation',
        name: '紧急问题升级',
        trigger: 'sla_breach',
        conditions: [
          {
            field: 'priority',
            operator: 'equals',
            value: 'urgent'
          }
        ],
        actions: [
          {
            type: 'notify_manager',
            recipients: ['translation_manager', 'product_manager'],
            message: '紧急翻译问题SLA即将超时，需要立即关注',
            urgency: 'urgent'
          }
        ],
        timeout: 2
      }
    ],
    automationRules: [
      {
        id: 'auto_assignment',
        name: '自动分配规则',
        trigger: 'feedback_created',
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: 'terminology'
          }
        ],
        actions: [
          {
            type: 'auto_assign',
            parameters: {
              assignee: 'terminology_specialist'
            }
          }
        ],
        enabled: true
      }
    ]
  },
  {
    id: 'critical_issue',
    name: '紧急问题处理',
    description: '处理严重翻译问题和用户投诉',
    triggerConditions: [
      {
        type: 'rating_below_threshold',
        condition: 'rating <= 2',
        value: 2
      },
      {
        type: 'urgent_priority',
        condition: 'urgency = high',
        value: 'high'
      }
    ],
    steps: [
      {
        id: 'immediate_response',
        name: '立即响应',
        type: 'auto',
        timeLimit: 0.5,
        actions: [
          {
            type: 'auto_respond',
            parameters: {
              message: '我们非常重视您的问题，将立即进行紧急处理。',
              channel: 'email'
            }
          },
          {
            type: 'notify',
            parameters: {
              recipients: ['on_call_manager'],
              message: '紧急翻译问题报告，需要立即处理',
              urgency: 'urgent'
            }
          }
        ]
      },
      {
        id: 'urgent_assessment',
        name: '紧急评估',
        type: 'manual',
        assigneeRole: 'product_manager',
        timeLimit: 2,
        actions: [
          {
            type: 'update_status',
            parameters: {
              status: 'emergency_assessment'
            }
          },
          {
            type: 'assign',
            parameters: {
              priority: 'urgent'
            }
          }
        ],
        dependencies: ['immediate_response']
      },
      {
        id: 'rapid_fix',
        name: '快速修复',
        type: 'manual',
        assigneeRole: 'engineering',
        timeLimit: 8,
        actions: [
          {
            type: 'create_task',
            parameters: {
              system: 'jira',
              project: 'CRITICAL_FIX',
              issueType: 'Bug'
            }
          }
        ],
        dependencies: ['urgent_assessment']
      },
      {
        id: 'critical_verification',
        name: '关键验证',
        type: 'manual',
        assigneeRole: 'quality_control',
        timeLimit: 4,
        actions: [
          {
            type: 'update_status',
            parameters: {
              status: 'critical_verified'
            }
          }
        ],
        dependencies: ['rapid_fix']
      }
    ],
    sla: {
      responseTime: 0.5,
      resolutionTime: 24,
      acknowledgmentTime: 1,
      escalationTime: 4,
      businessHoursOnly: false,
      weekendIncluded: true
    },
    escalationRules: [
      {
        id: 'critical_escalation',
        name: '关键问题升级',
        trigger: 'sla_breach',
        conditions: [
          {
            field: 'severity',
            operator: 'equals',
            value: 'critical'
          }
        ],
        actions: [
          {
            type: 'notify_manager',
            recipients: ['cto', 'vp_product'],
            message: '关键翻译问题已超过SLA时限，需要高层关注',
            urgency: 'urgent'
          }
        ],
        timeout: 1
      }
    ],
    automationRules: []
  }
];

class FeedbackProcessingWorkflow {
  private workflows: Map<string, ProcessingWorkflow> = new Map();
  private queues: Map<string, QueueItem[]> = new Map();
  private processingHistory: Map<string, ProcessingHistoryItem[]> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  /**
   * 初始化默认工作流程
   */
  private initializeDefaultWorkflows(): void {
    DEFAULT_WORKFLOWS.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * 处理新的反馈
   */
  async processFeedback(feedback: FeedbackData): Promise<string> {
    // 确定适用的工作流程
    const workflow = this.selectWorkflow(feedback);
    if (!workflow) {
      throw new Error('没有找到适用的工作流程');
    }

    // 创建队列项
    const queueItem: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'feedback',
      priority: this.determinePriority(feedback),
      dueDate: new Date(Date.now() + workflow.sla.resolutionTime * 60 * 60 * 1000),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      data: feedback,
      workflow,
      history: []
    };

    // 添加到队列
    const queueKey = this.getQueueKey(workflow.id);
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }
    this.queues.get(queueKey)!.push(queueItem);

    // 启动工作流程
    await this.startWorkflow(queueItem);

    return queueItem.id;
  }

  /**
   * 处理新问题报告
   */
  async processIssue(issue: TranslationIssue): Promise<string> {
    // 为问题创建工作流程实例
    const workflow = await this.selectIssueWorkflow(issue);
    
    const queueItem: QueueItem = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'issue',
      priority: this.determineIssuePriority(issue),
      dueDate: new Date(Date.now() + workflow.sla.resolutionTime * 60 * 60 * 1000),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      data: issue,
      workflow,
      history: []
    };

    const queueKey = this.getQueueKey(workflow.id);
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }
    this.queues.get(queueKey)!.push(queueItem);

    await this.startWorkflow(queueItem);

    return queueItem.id;
  }

  /**
   * 选择适用的工作流程
   */
  private selectWorkflow(feedback: FeedbackData): ProcessingWorkflow | null {
    for (const workflow of this.workflows.values()) {
      if (this.matchesTriggerConditions(feedback, workflow.triggerConditions)) {
        return workflow;
      }
    }
    
    // 返回默认工作流程
    return this.workflows.get('standard_feedback') || null;
  }

  /**
   * 选择问题工作流程
   */
  private async selectIssueWorkflow(issue: TranslationIssue): Promise<ProcessingWorkflow> {
    if (issue.severity === 'critical' || issue.priority === 'urgent') {
      return this.workflows.get('critical_issue')!;
    }
    
    return this.workflows.get('standard_feedback')!;
  }

  /**
   * 检查触发条件
   */
  private matchesTriggerConditions(data: any, triggers: WorkflowTrigger[]): boolean {
    return triggers.every(trigger => {
      switch (trigger.type) {
        case 'feedback_created':
          return true; // 总是匹配;
        case 'rating_below_threshold':
          return data.rating <= trigger.value;
        case 'urgent_priority':
          return data.urgency === trigger.value;
        case 'repeat_issue':
          // 简化处理，假设重复问题有标记
          return data.isDuplicate === true;
        default:
          return false;
      }
    });
  }

  /**
   * 确定优先级
   */
  private determinePriority(feedback: FeedbackData): QueueItem['priority'] {
    if (feedback.urgency === 'high' || feedback.rating <= 2) {
      return 'urgent';
    }
    if (feedback.urgency === 'medium' || feedback.rating === 3) {
      return 'high';
    }
    if (feedback.issues.length > 0) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 确定问题优先级
   */
  private determineIssuePriority(issue: TranslationIssue): QueueItem['priority'] {
    if (issue.severity === 'critical' || issue.priority === 'urgent') {
      return 'urgent';
    }
    if (issue.severity === 'major' || issue.priority === 'high') {
      return 'high';
    }
    if (issue.severity === 'moderate' || issue.priority === 'medium') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 获取队列键
   */
  private getQueueKey(workflowId: string): string {
    return `queue_${workflowId}`;
  }

  /**
   * 启动工作流程
   */
  private async startWorkflow(queueItem: QueueItem): Promise<void> {
    // 记录工作流程开始
    this.addToHistory(queueItem, 'workflow_started', '工作流程已开始');
    
    // 执行第一个步骤
    await this.executeNextStep(queueItem);
  }

  /**
   * 执行下一个步骤
   */
  private async executeNextStep(queueItem: QueueItem): Promise<void> {
    const workflow = queueItem.workflow;
    const nextStepIndex = queueItem.history.length;
    
    if (nextStepIndex >= workflow.steps.length) {
      // 工作流程完成
      queueItem.status = 'completed';
      this.addToHistory(queueItem, 'workflow_completed', '工作流程已完成');
      return;
    }

    const step = workflow.(steps?.nextStepIndex ?? null);
    queueItem.currentStep = step.id;
    queueItem.updatedAt = new Date();

    // 记录步骤开始
    this.addToHistory(queueItem, `step_started:${step.id}`, `开始执行步骤: ${step.name}`);

    try {
      if (step.type === 'auto') {
        await this.executeAutoStep(queueItem, step);
      } else {
        await this.assignManualStep(queueItem, step);
      }
    } catch (error) {
      console.error(`执行步骤 ${step.id} 失败:`, error);
      // 可以在这里添加错误处理逻辑
    }
  }

  /**
   * 执行自动步骤
   */
  private async executeAutoStep(queueItem: QueueItem, step: WorkflowStep): Promise<void> {
    for (const action of step.actions) {
      await this.executeAction(queueItem, action);
    }

    // 记录步骤完成
    this.addToHistory(queueItem, `step_completed:${step.id}`, `自动步骤完成: ${step.name}`);

    // 继续下一步
    await this.executeNextStep(queueItem);
  }

  /**
   * 分配手动步骤
   */
  private async assignManualStep(queueItem: QueueItem, step: WorkflowStep): Promise<void> {
    queueItem.status = 'waiting';
    
    // 分配给相应人员
    if (step.assignee) {
      queueItem.assignee = step.assignee;
    } else if (step.assigneeRole) {
      queueItem.assignee = await this.findAssignee(step.assigneeRole);
    }

    // 发送通知
    await this.sendStepNotification(queueItem, step);

    // 添加到处理历史
    this.addToHistory(queueItem, `step_assigned:${step.id}`, 
      `步骤已分配给: ${queueItem.assignee}`);
  }

  /**
   * 执行动作
   */
  private async executeAction(queueItem: QueueItem, action: StepAction): Promise<void> {
    switch (action.type) {
      case 'auto_respond':
        await this.sendAutoResponse(queueItem, action.parameters);
        break;
      case 'notify':
        await this.sendNotification(action.parameters.recipients, action.parameters.message);
        break;
      case 'update_status':
        await this.updateStatus(queueItem, action.parameters.status);
        break;
      case 'assign':
        // 分配逻辑已在assignManualStep中处理
        break;
      case 'create_task':
        await this.createTask(action.parameters);
        break;
      case 'auto_resolve':
        await this.autoResolve(queueItem);
        break;
    }
  }

  /**
   * 查找处理人
   */
  private async findAssignee(role: WorkflowStep['assigneeRole']): Promise<string> {
    // 简化的角色分配逻辑
    const roleMapping: { [key: string]: string } = {
      'translation_team': 'translator_001',
      'quality_control': 'qa_specialist_001',
      'product_manager': 'pm_001',
      'engineering': 'developer_001'
    };
    
    return roleMapping[role || ''] || 'default_handler';
  }

  /**
   * 添加处理历史
   */
  private addToHistory(queueItem: QueueItem, action: string, notes?: string): void {
    const historyItem: ProcessingHistoryItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      step: queueItem.currentStep || '',
      action,
      timestamp: new Date(),
      notes
    };

    queueItem.history.push(historyItem);
    queueItem.updatedAt = new Date();

    // 保存到存储
    const key = `history_${queueItem.id}`;
    if (!this.processingHistory.has(key)) {
      this.processingHistory.set(key, []);
    }
    this.processingHistory.get(key)!.push(historyItem);
  }

  /**
   * 发送自动响应
   */
  private async sendAutoResponse(queueItem: QueueItem, params: any): Promise<void> {
    // 这里应该集成实际的邮件或通知服务
    console.log(`发送自动响应: ${params.message}`);
  }

  /**
   * 发送通知
   */
  private async sendNotification(recipients: string[], message: string): Promise<void> {
    // 实际实现中会调用邮件或消息服务
    console.log(`发送通知给 ${recipients.join(', ')}: ${message}`);
  }

  /**
   * 更新状态
   */
  private async updateStatus(queueItem: QueueItem, status: string): Promise<void> {
    queueItem.status = status as any;
    queueItem.updatedAt = new Date();
  }

  /**
   * 发送步骤通知
   */
  private async sendStepNotification(queueItem: QueueItem, step: WorkflowStep): Promise<void> {
    const message = `您有新的处理任务: ${step.name}`;
    if (queueItem.assignee) {
      await this.sendNotification([queueItem.assignee], message);
    }
  }

  /**
   * 创建任务
   */
  private async createTask(params: any): Promise<void> {
    // 这里会集成Jira、Trello等任务管理系统
    console.log(`创建任务: ${JSON.stringify(params)}`);
  }

  /**
   * 自动解决
   */
  private async autoResolve(queueItem: QueueItem): Promise<void> {
    queueItem.status = 'completed';
    queueItem.updatedAt = new Date();
    this.addToHistory(queueItem, 'auto_resolved', '问题已自动解决');
  }

  /**
   * 获取队列项
   */
  getQueueItem(queueId: string): QueueItem | null {
    for (const queue of this.queues.values()) {
      const item = queue.find(q => q.id === queueId);
      if (item) return item; {
    }
    return null;
  }

  /**
   * 获取处理统计
   */
  getProcessingStats(): ProcessingStats {
    let totalProcessed = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let slaCompliant = 0;
    let escalations = 0;

    for (const queue of this.queues.values()) {
      for (const item of queue) {
        if (item.status === 'completed') {
          totalProcessed++;
          const responseTime = item.history.find(h => h.action.includes('step_assigned'))?.timestamp.getTime() - item.createdAt.getTime();
          const resolutionTime = item.updatedAt.getTime() - item.createdAt.getTime();
          
          totalResponseTime += responseTime / (1000 * 60 * 60); // 转换为小时
          totalResolutionTime += resolutionTime / (1000 * 60 * 60);
          
          if (responseTime < item.workflow.sla.responseTime * 60 * 60 * 1000) {
            slaCompliant++;
          }
          
          escalations += item.history.filter(h => h.action.includes('escalation')).length;
        }
      }
    }

    return {
      totalProcessed,
      averageResponseTime: totalProcessed > 0 ? totalResponseTime / totalProcessed : 0,
      averageResolutionTime: totalProcessed > 0 ? totalResolutionTime / totalProcessed : 0,
      slaComplianceRate: totalProcessed > 0 ? slaCompliant / totalProcessed : 0,
      escalations,
      automationRate: 0.6, // 简化计算
      customerSatisfaction: 4.2 // 模拟数据
    };
  }

  /**
   * 检查SLA状态
   */
  checkSLAStatus(queueItem: QueueItem): {
    isBreached: boolean;
    timeRemaining: number;
    status: 'on_time' | 'warning' | 'breached';
  } {
    const workflow = queueItem.workflow;
    const timeElapsed = Date.now() - queueItem.createdAt.getTime();
    const timeLimit = workflow.sla.resolutionTime * 60 * 60 * 1000;
    const timeRemaining = timeLimit - timeElapsed;

    if (timeRemaining < 0) {
      return { isBreached: true, timeRemaining, status: 'breached' };
    } else if (timeRemaining < timeLimit * 0.2) {
      return { isBreached: false, timeRemaining, status: 'warning' };
    } else {
      return { isBreached: false, timeRemaining, status: 'on_time' };
    }
  }

  /**
   * 导出处理报告
   */
  exportProcessingReport(): string {
    const stats = this.getProcessingStats();
    const report = {
      generatedAt: new Date().toISOString(),
      stats,
      workflows: Array.from(this.workflows.values()),
      queues: Object.fromEntries(
        Array.from(this.queues.entries()).map(([key, items]) => [
          key,
          items.length
        ])
      )
    };

    return JSON.stringify(report, null, 2);
  }
}

// 创建单例实例
export const feedbackProcessingWorkflow = new FeedbackProcessingWorkflow();

export default feedbackProcessingWorkflow;
}