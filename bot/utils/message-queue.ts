import { EventEmitter } from 'events';
import { logger, errorTracker } from './logger';
/**
 * 消息队列和重试机制
 * 提供可靠的消息传递和失败重试功能
 */


export interface Message {
  id: string;
  type: 'telegram' | 'notification' | 'system' | 'webhook';
  payload: any;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  delay?: number;
  metadata?: Record<string, any>;
}

export interface QueueStats {
  queueLength: number;
  processing: Message[];
  failed: Message[];
  processed: number;
  averageProcessingTime: number;
  successRate: number;
}

export class MessageQueue extends EventEmitter {
  private queue: Message[] = [];
  private processing: Map<string, NodeJS.Timeout> = new Map();
  private failed: Message[] = [];
  private stats: QueueStats = {
    queueLength: 0,
    processing: [],
    failed: [],
    processed: 0,
    averageProcessingTime: 0,
    successRate: 100
  };
  private maxConcurrent = 10;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private retryConfig = {
    initialDelay: 1000, // 1秒
    maxDelay: 60000, // 1分钟
    backoffFactor: 2,
    maxRetries: 3
  };

  constructor(maxConcurrent: number = 10) {
    super();
    this.maxConcurrent = maxConcurrent;
    this.startProcessing();
    
    logger.info('Message queue initialized', { maxConcurrent });
}

  // 添加消息到队列
  public async addMessage(
    type: Message['type'],
    payload: any,
    options: {
      priority?: 'high' | 'normal' | 'low';
      maxAttempts?: number;
      delay?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      payload,
      priority: options.priority || 'normal',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts || this.retryConfig.maxRetries,
      delay: options.delay,
      metadata: options.metadata
    };

    // 根据优先级插入队列
    this.insertMessageByPriority(message);
    this.updateStats();

    logger.debug('Message added to queue', {
      messageId: message.id,
      type,
      priority: message.priority,
      queueLength: this.stats.queueLength
    });

    // 触发处理
    this.triggerProcessing();

    return message.id;
  }

  // 按优先级插入消息
  private insertMessageByPriority(message: Message) {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const messagePriority = priorityOrder[message.priority];

    // 找到插入位置
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.(queue?.i ?? null).priority];
      if (messagePriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, message);
  }

  // 处理队列中的消息
  private startProcessing() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // 每100ms检查一次

    logger.info('Message queue processing started');
  }

  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 检查过期的延迟消息
      this.processDelayedMessages();

      // 处理正常队列中的消息
      while (this.canProcessMore() && this.hasReadyMessages()) {
        const message = this.queue.shift();
        if (message) {
          await this.processMessage(message);
        }
      }

      // 处理失败队列的重试
      this.processFailedMessages();

    } catch (error) {
      logger.error('Queue processing error', { error: (error as Error).message }, error as Error);
    } finally {
      this.isProcessing = false;
      this.updateStats();
    }
  }

  private processDelayedMessages() {
    const now = new Date();
    this.queue.forEach((message, index) => {
      if (message.delay && message.nextRetryAt && message.nextRetryAt <= now) {
        // 移除延迟消息，准备重新处理
        this.queue.splice(index, 1);
        this.queue.unshift(message);
      }
    });
  }

  private processFailedMessages() {
    const now = new Date();
    const retryMessages: Message[] = [];

    this.failed.forEach((message, index) => {
      if (message.nextRetryAt && message.nextRetryAt <= now) {
        retryMessages.push(message);
      }
    });

    // 移除需要重试的消息
    retryMessages.forEach(message => {
      const failedIndex = this.failed.findIndex(m => m.id === message.id);
      if (failedIndex !== -1) {
        this.failed.splice(failedIndex, 1);
        this.queue.unshift(message); // 插入队首优先处理
      }
    });
  }

  private canProcessMore(): boolean {
    return this.processing.size < this.maxConcurrent;
  }

  private hasReadyMessages(): boolean {
    return this.queue.length > 0;
  }

  private triggerProcessing() {
    // 立即触发一次处理
    setImmediate(() => this.processQueue());
  }

  // 处理单个消息
  private async processMessage(message: Message) {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      logger.warn('Message processing timeout', { messageId: message.id });
      this.markProcessingFailed(message.id, new Error('Processing timeout'));
    }, 30000); // 30秒超时

    try {
      this.processing.set(message.id, timeout);

      logger.debug('Processing message', {
        messageId: message.id,
        type: message.type,
        attempts: message.attempts
      });

      // 根据消息类型执行不同的处理逻辑
      const result = await this.handleMessage(message);

      // 清理超时定时器
      clearTimeout(timeout);
      this.processing.delete(message.id);

      // 处理成功
      this.stats.processed++;
      const duration = Date.now() - startTime;
      this.updateAverageProcessingTime(duration);

      logger.debug('Message processed successfully', {
        messageId: message.id,
        duration
      });

      this.emit('message:success', { messageId: message.id, result, duration });

    } catch (error) {
      clearTimeout(timeout);
      this.processing.delete(message.id);

      await this.handleMessageError(message, error as Error);
      const duration = Date.now() - startTime;
      this.emit('message:error', { messageId: message.id, error, duration });
    }
  }

  // 处理不同类型的消息
  private async handleMessage(message: Message): Promise<any> {
    switch (message.type) {
      case 'telegram':
        return await this.handleTelegramMessage(message.payload);
      case 'notification':
        return await this.handleNotificationMessage(message.payload);
      case 'system':
        return await this.handleSystemMessage(message.payload);
      case 'webhook':
        return await this.handleWebhookMessage(message.payload);
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleTelegramMessage(payload: any): Promise<any> {
    // 这里应该调用实际的Telegram API
    // 暂时模拟实现
    logger.info('Sending Telegram message', { payload });
    
    // 模拟发送时间
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // 10% 模拟失败率（用于测试重试机制）
    if (Math.random() < 0.1) {
      throw new Error('Simulated Telegram API error');
    }
    
    return { success: true, messageId: payload.messageId };
  }

  private async handleNotificationMessage(payload: any): Promise<any> {
    logger.info('Sending notification', { payload });
    
    // 实现具体的通知逻辑
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));
    
    return { success: true };
  }

  private async handleSystemMessage(payload: any): Promise<any> {
    logger.info('Processing system message', { payload });
    
    // 实现系统消息处理逻辑
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 100));
    
    return { success: true };
  }

  private async handleWebhookMessage(payload: any): Promise<any> {
    logger.info('Sending webhook', { payload });
    
    // 实现webhook发送逻辑
    const response = await fetch(payload.url, {
      method: payload.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...payload.headers
      },
      body: JSON.stringify(payload.data)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
    
    return { success: true, status: response.status };
  }

  // 处理消息错误
  private async handleMessageError(message: Message, error: Error) {
    message.attempts++;
    errorTracker.recordError(`${message.type}_processing_error`, error);

    logger.warn('Message processing failed', {
      messageId: message.id,
      type: message.type,
      attempts: message.attempts,
      maxAttempts: message.maxAttempts,
      error: error.message
    });

    if (message.attempts < message.maxAttempts) {
      // 计算重试延迟（指数退避）
      const delay = this.calculateRetryDelay(message.attempts);
      message.nextRetryAt = new Date(Date.now() + delay);

      // 添加到失败队列
      this.failed.push(message);

      logger.info('Message scheduled for retry', {
        messageId: message.id,
        retryDelay: delay,
        nextRetryAt: message.nextRetryAt.toISOString()
      });
    } else {
      // 达到最大重试次数，永久失败
      logger.error('Message failed permanently', {
        messageId: message.id,
        type: message.type,
        attempts: message.attempts,
        error: error.message
      });

      // 移动到失败队列，但不重试
      this.failed.push({
        ...message,
        nextRetryAt: undefined,
        attempts: message.maxAttempts
      });

      this.emit('message:failed', { messageId: message.id, error, message });
    }
  }

  private calculateRetryDelay(attempt: number): number {
    const { initialDelay, maxDelay, backoffFactor } = this.retryConfig;
    const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  private markProcessingFailed(messageId: string, error: Error) {
    if (this.processing.has(messageId)) {
      clearTimeout(this.processing.get(messageId) as NodeJS.Timeout);
      this.processing.delete(messageId);
    }

    // 查找对应的消息并标记为失败
    const message = this.queue.find(m => m.id === messageId) ||;
                   this.failed.find(m => m.id === messageId);

    if (message) {
      this.handleMessageError(message, error);
    }
  }

  private updateStats() {
    this.stats = {
      queueLength: this.queue.length,
      processing: Array.from(this.processing.keys()).map(id => {
        // 这里应该返回完整的消息对象，简化处理
        return { id } as Message;
      }),
      failed: [...this.failed],
      processed: this.stats.processed,
      averageProcessingTime: this.stats.averageProcessingTime,
      successRate: this.calculateSuccessRate()
    };
  }

  private updateAverageProcessingTime(newDuration: number) {
    const totalProcessed = this.stats.processed;
    const currentAverage = this.stats.averageProcessingTime;
    
    this.stats.averageProcessingTime : 
      (currentAverage * (totalProcessed - 1) + newDuration) / totalProcessed;
  }

  private calculateSuccessRate(): number {
    const totalAttempts = this.stats.processed + this.failed.filter(m => m.attempts >= m.maxAttempts).length;
    if (totalAttempts === 0) return 100; {
    
    const successful = this.stats.processed;
    return (successful / totalAttempts) * 100;
  }

  // 生成消息ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取队列统计信息
  public async getStats(): Promise<QueueStats> {
    this.updateStats();
    return this.stats;
  }

  // 获取队列中的消息数量
  public getQueueLength(): number {
    return this.queue.length;
  }

  // 清理失败的消息
  public clearFailedMessages(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    const beforeCount = this.failed.length;
    this.failed = this.failed.filter(message => {
      return message.createdAt > cutoffTime || message.attempts >= message.maxAttempts;
    });
    
    const removedCount = beforeCount - this.failed.length;
    
    if (removedCount > 0) {
      logger.info('Cleared failed messages', { count: removedCount, olderThanHours });
    }
    
    return removedCount;
  }

  // 重启队列处理器
  public async restart() {
    logger.info('Restarting message queue');
    
    // 停止当前处理
    this.stopProcessing();
    
    // 清空处理中的消息（这些消息会重新加入队列）
    for (const [messageId, timeout] of this.processing) {
      clearTimeout(timeout);
      const message = this.failed.find(m => m.id === messageId);
      if (message) {
        this.queue.unshift(message);
      }
    }
    
    this.processing.clear();
    
    // 清空失败队列
    this.failed = [];
    
    // 重新启动处理
    this.startProcessing();
    
    logger.info('Message queue restarted');
  }

  // 停止处理
  public stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Message queue processing stopped');
    }
  }

  // 销毁队列
  public destroy() {
    this.stopProcessing();
    
    // 清理所有处理中的消息
    for (const [messageId, timeout] of this.processing) {
      clearTimeout(timeout);
      logger.warn('Message processing cancelled during destroy', { messageId });
    }
    
    this.processing.clear();
    this.queue = [];
    this.failed = [];
    
    logger.info('Message queue destroyed');
  }

  // 批量添加消息
  public async batchAddMessages(
    messages: Array<{
      type: Message['type'];
      payload: any;
      priority?: 'high' | 'normal' | 'low';
      maxAttempts?: number;
      delay?: number;
      metadata?: Record<string, any>;
    }>
  ): Promise<string[]> {
    const messageIds: string[] = [];
    
    for (const msg of messages) {
      const id = await this.addMessage(msg.type, msg.payload, msg);
      messageIds.push(id);
    }
    
    logger.info('Batch messages added', { count: messageIds.length });
    return messageIds;
  }

  // 优先级调整
  public adjustMessagePriority(messageId: string, newPriority: 'high' | 'normal' | 'low'): boolean {
    const message = this.queue.find(m => m.id === messageId);
    if (!message) {
      return false;
    }

    // 移除原消息
    const index = this.queue.findIndex(m => m.id === messageId);
    this.queue.splice(index, 1);

    // 更新优先级并重新插入
    message.priority = newPriority;
    this.insertMessageByPriority(message);

    logger.debug('Message priority adjusted', { messageId, newPriority });
    return true;
  }

  // 获取队列状态
  public getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      processingCount: this.processing.size,
      queueLength: this.queue.length,
      failedCount: this.failed.length,
      uptime: process.uptime(),
      lastUpdated: new Date().toISOString()
    };
  }
}
}