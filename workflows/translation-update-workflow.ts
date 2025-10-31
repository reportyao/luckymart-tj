/**
 * 翻译更新工作流
 * Translation Update Workflow
 * 
 * 功能：
 * - 翻译更新的自动化工作流程
 * - 支持多人协作翻译和审核
 * - 提供翻译质量检查和验收流程
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { TranslationVersionManager } from './translation-version-manager';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'validation' | 'translation' | 'review' | 'approval' | 'deployment';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  assignee?: string;
  dependencies: string[];
  config: StepConfig;
  result?: any;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface StepConfig {
  timeout?: number;
  retryCount?: number;
  requiredApprovals?: number;
  autoAssign?: boolean;
  notifyUsers?: string[];
  validationRules?: ValidationRule[];
  qualityThresholds?: QualityThresholds;
}

export interface ValidationRule {
  type: 'completeness' | 'consistency' | 'format' | 'length' | 'special_chars';
  threshold?: number;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface QualityThresholds {
  completeness: number; // 最低完整性百分比
  consistency: number; // 最低一致性分数
  format: number; // 最低格式正确率
  length: number; // 文本长度限制
}

export interface TranslationTask {
  id: string;
  title: string;
  description: string;
  type: 'new' | 'update' | 'review' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: {
    locale: string;
    namespace: string;
    file: string;
  };
  targets: {
    locale: string;
    namespace: string;
    assignee?: string;
    dueDate?: number;
  }[];
  status: 'draft' | 'active' | 'in_review' | 'approved' | 'deployed' | 'cancelled';
  createdAt: number;
  createdBy: string;
  workflow: WorkflowStep[];
  metadata: {
    tags: string[];
    dependencies: string[];
    estimatedHours?: number;
    actualHours?: number;
    businessValue: string;
  };
}

export interface ReviewComment {
  id: string;
  stepId: string;
  author: string;
  content: string;
  type: 'suggestion' | 'question' | 'approval' | 'rejection';
  resolved: boolean;
  timestamp: number;
  lineNumber?: number;
  key?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'translator' | 'reviewer' | 'approver' | 'manager' | 'admin';
  languages: string[];
  specialties: string[];
  availability: 'available' | 'busy' | 'offline';
  workload: number; // 当前任务数量
}

export class TranslationWorkflowManager extends EventEmitter {
  private workflows = new Map<string, TranslationTask>();
  private users = new Map<string, User>();
  private activeWorkflows = new Set<string>();
  private workflowHistory: string[] = [];

  private workflowsDir: string;
  private usersDir: string;
  private commentsDir: string;

  constructor(
    private versionManager: TranslationVersionManager,
    private basePath: string = './src/locales'
  ) {
    super();
    this.workflowsDir = path.join(basePath, '.workflows');
    this.usersDir = path.join(basePath, '.users');
    this.commentsDir = path.join(basePath, '.comments');
    
    this.initializeDirectories();
    this.setupEventListeners();
  }

  private initializeDirectories(): void {
    [this.workflowsDir, this.usersDir, this.commentsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private setupEventListeners(): void {
    this.on('workflow:started', (taskId: string) => {
      console.log(`Workflow started: ${taskId}`);
    });

    this.on('workflow:completed', (taskId: string) => {
      console.log(`Workflow completed: ${taskId}`);
    });

    this.on('workflow:failed', (taskId: string, error: string) => {
      console.error(`Workflow failed: ${taskId}`, error);
    });

    this.on('step:started', (stepId: string, taskId: string) => {
      console.log(`Step started: ${stepId} in workflow ${taskId}`);
    });

    this.on('step:completed', (stepId: string, taskId: string) => {
      console.log(`Step completed: ${stepId} in workflow ${taskId}`);
    });

    this.on('step:failed', (stepId: string, taskId: string, error: string) => {
      console.error(`Step failed: ${stepId} in workflow ${taskId}`, error);
    });
  }

  /**
   * 创建新的翻译工作流
   */
  async createWorkflow(task: Omit<TranslationTask, 'id' | 'status' | 'createdAt' | 'workflow'>): Promise<string> {
    const taskId = this.generateTaskId();
    const workflowTask: TranslationTask = {
      ...task,
      id: taskId,
      status: 'draft',
      createdAt: Date.now(),
      workflow: this.generateWorkflowSteps(task)
    };

    this.workflows.set(taskId, workflowTask);
    await this.saveWorkflow(workflowTask);
    
    return taskId;
  }

  /**
   * 启动工作流
   */
  async startWorkflow(taskId: string, initiator: string): Promise<void> {
    const task = this.workflows.get(taskId);
    if (!task) {
      throw new Error(`Workflow ${taskId} not found`);
    }

    if (task.status !== 'draft') {
      throw new Error(`Workflow ${taskId} is not in draft status`);
    }

    task.status = 'active';
    this.activeWorkflows.add(taskId);
    
    await this.saveWorkflow(task);
    this.emit('workflow:started', taskId);

    // 执行第一个步骤
    await this.executeNextStep(taskId, initiator);
  }

  /**
   * 执行工作流步骤
   */
  private async executeNextStep(taskId: string, executor: string): Promise<void> {
    const task = this.workflows.get(taskId);
    if (!task) return;

    const nextStep = task.workflow.find(step => step.status === 'pending');
    
    if (!nextStep) {
      // 所有步骤完成，工作流结束
      task.status = 'approved';
      this.activeWorkflows.delete(taskId);
      await this.saveWorkflow(task);
      this.emit('workflow:completed', taskId);
      return;
    }

    // 检查依赖步骤是否完成
    const dependenciesMet = nextStep.dependencies.every(depId => {
      const depStep = task.workflow.find(s => s.id === depId);
      return depStep?.status === 'completed';
    });

    if (!dependenciesMet) {
      throw new Error(`Dependencies not met for step ${nextStep.id}`);
    }

    await this.executeStep(taskId, nextStep.id, executor);
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(taskId: string, stepId: string, executor: string): Promise<void> {
    const task = this.workflows.get(taskId);
    if (!task) return;

    const step = task.workflow.find(s => s.id === stepId);
    if (!step) return;

    const startTime = Date.now();
    
    try {
      step.status = 'running';
      step.startedAt = startTime;
      step.assignee = executor;
      
      await this.saveWorkflow(task);
      this.emit('step:started', stepId, taskId);

      // 执行步骤逻辑
      switch (step.type) {
        case 'validation':
          step.result = await this.executeValidationStep(task, step);
          break;
        case 'translation':
          step.result = await this.executeTranslationStep(task, step);
          break;
        case 'review':
          step.result = await this.executeReviewStep(task, step);
          break;
        case 'approval':
          step.result = await this.executeApprovalStep(task, step);
          break;
        case 'deployment':
          step.result = await this.executeDeploymentStep(task, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = 'completed';
      step.completedAt = Date.now();

      await this.saveWorkflow(task);
      this.emit('step:completed', stepId, taskId);

      // 继续执行下一个步骤
      await this.executeNextStep(taskId, executor);

    } catch (error) {
      step.status = 'failed';
      step.completedAt = Date.now();
      step.error = error instanceof Error ? error.message : String(error);

      await this.saveWorkflow(task);
      this.emit('step:failed', stepId, taskId, step.error);

      // 标记整个工作流失败
      task.status = 'cancelled';
      this.activeWorkflows.delete(taskId);
      await this.saveWorkflow(task);
      this.emit('workflow:failed', taskId, step.error);
    }
  }

  /**
   * 验证步骤
   */
  private async executeValidationStep(task: TranslationTask, step: WorkflowStep): Promise<any> {
    const { validationRules, qualityThresholds } = step.config;
    
    if (!validationRules || !qualityThresholds) {
      throw new Error('Validation step missing required configuration');
    }

    const validationResults = await this.runValidationRules(task, validationRules);
    
    // 检查质量阈值
    for (const [metric, threshold] of Object.entries(qualityThresholds)) {
      const actual = validationResults[metric];
      if (actual < threshold) {
        throw new Error(`Quality threshold failed for ${metric}: ${actual} < ${threshold}`);
      }
    }

    return validationResults;
  }

  /**
   * 翻译步骤
   */
  private async executeTranslationStep(task: TranslationTask, step: WorkflowStep): Promise<any> {
    // 自动分配译者
    if (step.config.autoAssign) {
      const assignedUsers = await this.autoAssignTranslators(task, step);
      step.assignee = assignedUsers[0]; // 选择第一个可用的译者
    }

    if (!step.assignee) {
      throw new Error('No translator assigned');
    }

    // 执行翻译任务
    const translations = await this.performTranslation(task, step.assignee);
    
    // 创建版本
    const version = await this.versionManager.createVersion(
      task.source.file,
      step.assignee,
      `Translation work for ${task.title}`
    );

    return {
      translations,
      versionId: version.id,
      assignee: step.assignee
    };
  }

  /**
   * 审核步骤
   */
  private async executeReviewStep(task: TranslationTask, step: WorkflowStep): Promise<any> {
    const requiredApprovals = step.config.requiredApprovals || 1;
    
    // 获取指定的审核人员
    const reviewers = step.config.notifyUsers || await this.getReviewers(task);
    
    // 等待审核
    const approvals = await this.waitForApprovals(task.id, step.id, reviewers, requiredApprovals);
    
    return {
      approvals,
      reviewers,
      requiredApprovals
    };
  }

  /**
   * 批准步骤
   */
  private async executeApprovalStep(task: TranslationTask, step: WorkflowStep): Promise<any> {
    // 需要管理员或项目负责人批准
    const approvers = await this.getApprovers();
    
    // 等待最终批准
    const approval = await this.waitForFinalApproval(task.id, step.id, approvers);
    
    return approval;
  }

  /**
   * 部署步骤
   */
  private async executeDeploymentStep(task: TranslationTask, step: WorkflowStep): Promise<any> {
    // 执行部署前检查
    await this.preDeploymentChecks(task);
    
    // 执行部署
    const deploymentResult = await this.performDeployment(task);
    
    // 验证部署
    await this.verifyDeployment(task);
    
    return deploymentResult;
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(taskId: string): any {
    const task = this.workflows.get(taskId);
    if (!task) return null;

    return {
      id: task.id,
      status: task.status,
      progress: this.calculateProgress(task.workflow),
      currentStep: task.workflow.find(s => s.status === 'running'),
      completedSteps: task.workflow.filter(s => s.status === 'completed').length,
      totalSteps: task.workflow.length,
      duration: task.createdAt ? Date.now() - task.createdAt : 0,
      assignee: task.workflow.find(s => s.status === 'running')?.assignee
    };
  }

  /**
   * 获取工作流列表
   */
  listWorkflows(filters?: {
    status?: string;
    assignee?: string;
    type?: string;
    priority?: string;
  }): TranslationTask[] {
    let workflows = Array.from(this.workflows.values());

    if (filters) {
      workflows = workflows.filter(workflow => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === 'assignee') {
            return workflow.workflow.some(step => step.assignee === value);
          }
          return (workflow as any)[key] === value;
        });
      });
    }

    return workflows.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 添加审核评论
   */
  async addReviewComment(
    taskId: string,
    stepId: string,
    author: string,
    content: string,
    type: ReviewComment['type'],
    lineNumber?: number,
    key?: string
  ): Promise<string> {
    const comment: ReviewComment = {
      id: this.generateCommentId(),
      stepId,
      author,
      content,
      type,
      resolved: false,
      timestamp: Date.now(),
      lineNumber,
      key
    };

    const commentFile = path.join(this.commentsDir, `${taskId}_${stepId}.json`);
    let comments: ReviewComment[] = [];

    if (fs.existsSync(commentFile)) {
      comments = JSON.parse(fs.readFileSync(commentFile, 'utf-8'));
    }

    comments.push(comment);
    fs.writeFileSync(commentFile, JSON.stringify(comments, null, 2));

    // 通知相关用户
    await this.notifyUsers([author], 'review_comment_added', {
      taskId,
      stepId,
      comment: comment.content
    });

    return comment.id;
  }

  /**
   * 获取用户工作量
   */
  getUserWorkload(userId: string): {
    activeTasks: number;
    completedTasks: number;
    pendingApprovals: number;
    averageCompletionTime: number;
  } {
    const userTasks = this.listWorkflows({ assignee: userId });
    const activeTasks = userTasks.filter(t => t.status === 'active').length;
    const completedTasks = userTasks.filter(t => t.status === 'approved').length;
    
    // 计算待审核任务
    const pendingReviews = Array.from(this.workflows.values()).filter(task => 
      task.status === 'in_review' && 
      task.workflow.some(step => step.assignee === userId && step.status === 'running')
    ).length;

    return {
      activeTasks,
      completedTasks,
      pendingApprovals: pendingReviews,
      averageCompletionTime: 0 // 简化实现
    };
  }

  /**
   * 获取工作流统计信息
   */
  getWorkflowStatistics(days: number = 30): {
    totalWorkflows: number;
    completedWorkflows: number;
    averageCompletionTime: number;
    failureRate: number;
    mostActiveUsers: { userId: string; tasks: number }[];
    workflowTypeDistribution: { type: string; count: number }[];
    priorityDistribution: { priority: string; count: number }[];
  } {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentWorkflows = this.listWorkflows().filter(w => w.createdAt >= cutoffDate);
    
    const completedWorkflows = recentWorkflows.filter(w => w.status === 'approved');
    const failedWorkflows = recentWorkflows.filter(w => w.status === 'cancelled');
    
    const userTasks: { [userId: string]: number } = {};
    const typeDistribution: { [type: string]: number } = {};
    const priorityDistribution: { priority: string]: number } = {};
    
    let totalCompletionTime = 0;
    
    recentWorkflows.forEach(workflow => {
      // 统计用户任务数
      workflow.workflow.forEach(step => {
        if (step.assignee) {
          userTasks[step.assignee] = (userTasks[step.assignee] || 0) + 1;
        }
      });
      
      // 统计类型分布
      typeDistribution[workflow.type] = (typeDistribution[workflow.type] || 0) + 1;
      
      // 统计优先级分布
      priorityDistribution[workflow.priority] = (priorityDistribution[workflow.priority] || 0) + 1;
      
      // 计算完成时间
      if (workflow.createdAt && completedWorkflows.includes(workflow)) {
        const completedAt = Math.max(...workflow.workflow.map(s => s.completedAt || 0));
        totalCompletionTime += completedAt - workflow.createdAt;
      }
    });
    
    return {
      totalWorkflows: recentWorkflows.length,
      completedWorkflows: completedWorkflows.length,
      averageCompletionTime: completedWorkflows.length > 0 ? totalCompletionTime / completedWorkflows.length : 0,
      failureRate: recentWorkflows.length > 0 ? failedWorkflows.length / recentWorkflows.length : 0,
      mostActiveUsers: Object.entries(userTasks)
        .map(([userId, tasks]) => ({ userId, tasks }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 5),
      workflowTypeDistribution: Object.entries(typeDistribution)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      priorityDistribution: Object.entries(priorityDistribution)
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  // 私有方法

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowSteps(task: Omit<TranslationTask, 'id' | 'status' | 'createdAt' | 'workflow'>): WorkflowStep[] {
    const steps: WorkflowStep[] = [
      {
        id: 'validation',
        name: '数据验证',
        type: 'validation',
        status: 'pending',
        dependencies: [],
        config: {
          timeout: 300000, // 5分钟
          retryCount: 3,
          validationRules: [
            {
              type: 'completeness',
              threshold: 80,
              severity: 'error',
              description: '翻译完整性检查'
            }
          ],
          qualityThresholds: {
            completeness: 80,
            consistency: 85,
            format: 95,
            length: 500
          }
        }
      },
      {
        id: 'translation',
        name: '翻译执行',
        type: 'translation',
        status: 'pending',
        dependencies: ['validation'],
        config: {
          timeout: 3600000, // 1小时
          retryCount: 1,
          autoAssign: true,
          notifyUsers: []
        }
      },
      {
        id: 'review',
        name: '质量审核',
        type: 'review',
        status: 'pending',
        dependencies: ['translation'],
        config: {
          timeout: 1800000, // 30分钟
          requiredApprovals: 2,
          notifyUsers: []
        }
      },
      {
        id: 'approval',
        name: '最终批准',
        type: 'approval',
        status: 'pending',
        dependencies: ['review'],
        config: {
          timeout: 600000, // 10分钟
          requiredApprovals: 1,
          notifyUsers: []
        }
      },
      {
        id: 'deployment',
        name: '部署发布',
        type: 'deployment',
        status: 'pending',
        dependencies: ['approval'],
        config: {
          timeout: 300000, // 5分钟
          retryCount: 2,
          notifyUsers: []
        }
      }
    ];

    // 根据任务类型调整步骤
    if (task.type === 'urgent') {
      // 紧急任务跳过一些步骤
      steps[0].dependencies = [];
      steps[1].dependencies = [];
    }

    return steps;
  }

  private calculateProgress(steps: WorkflowStep[]): number {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  }

  private async saveWorkflow(task: TranslationTask): Promise<void> {
    const taskFile = path.join(this.workflowsDir, `${task.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  }

  private async runValidationRules(task: TranslationTask, rules: ValidationRule[]): Promise<any> {
    const results: any = {
      completeness: 100,
      consistency: 90,
      format: 95,
      length: 0
    };

    // 简化的验证实现
    for (const rule of rules) {
      switch (rule.type) {
        case 'completeness':
          // 检查翻译完整性
          break;
        case 'consistency':
          // 检查翻译一致性
          break;
        case 'format':
          // 检查格式正确性
          break;
        case 'length':
          // 检查文本长度
          break;
      }
    }

    return results;
  }

  private async autoAssignTranslators(task: TranslationTask, step: WorkflowStep): Promise<string[]> {
    const availableTranslators = Array.from(this.users.values())
      .filter(user => user.role === 'translator' && user.availability === 'available')
      .sort((a, b) => a.workload - b.workload);

    return availableTranslators.slice(0, 3).map(u => u.id);
  }

  private async performTranslation(task: TranslationTask, translatorId: string): Promise<any> {
    // 模拟翻译过程
    console.log(`Performing translation for task ${task.id} by ${translatorId}`);
    return { translated: true, translatorId };
  }

  private async getReviewers(task: TranslationTask): Promise<string[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'reviewer')
      .map(u => u.id);
  }

  private async waitForApprovals(
    taskId: string,
    stepId: string,
    reviewers: string[],
    required: number
  ): Promise<string[]> {
    // 简化的审批等待实现
    return reviewers.slice(0, required);
  }

  private async getApprovers(): Promise<string[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'approver' || user.role === 'admin')
      .map(u => u.id);
  }

  private async waitForFinalApproval(
    taskId: string,
    stepId: string,
    approvers: string[]
  ): Promise<any> {
    // 简化的最终批准等待实现
    return { approved: true, approver: approvers[0] };
  }

  private async preDeploymentChecks(task: TranslationTask): Promise<void> {
    console.log(`Running pre-deployment checks for task ${task.id}`);
  }

  private async performDeployment(task: TranslationTask): Promise<any> {
    console.log(`Performing deployment for task ${task.id}`);
    return { deployed: true, timestamp: Date.now() };
  }

  private async verifyDeployment(task: TranslationTask): Promise<void> {
    console.log(`Verifying deployment for task ${task.id}`);
  }

  private async notifyUsers(userIds: string[], event: string, data: any): Promise<void> {
    // 简化实现 - 实际中会发送到邮件、Slack等
    console.log(`Notifying users ${userIds.join(', ')} about ${event}`, data);
  }
}

export const translationWorkflowManager = new TranslationWorkflowManager(
  new (require('./translation-version-manager').TranslationVersionManager)()
);