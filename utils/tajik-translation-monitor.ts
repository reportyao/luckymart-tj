/**
 * 塔吉克语翻译质量监控机制
 * 持续监控翻译质量，提供实时状态和预警
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TajikLocalizationEvaluator } from './tajik-localization-evaluator';
import { TajikTranslationOptimizer } from './tajik-translation-optimizer';

interface MonitoringConfig {
  checkInterval: number; // 检查间隔（毫秒）
  qualityThreshold: number; // 质量阈值
  enableAutoFix: boolean; // 是否启用自动修复
  notifications: {
    slack?: string;
    email?: string;
    webhook?: string;
  };
  schedules: {
    daily: string; // 每日检查时间 (HH:MM)
    weekly: string; // 每周检查时间 (HH:MM)
    monthly: string; // 每月检查时间 (DD HH:MM)
  };
  alerts: {
    lowQuality: boolean;
    missingTranslations: boolean;
    terminologyInconsistency: boolean;
  };
}

interface TranslationStatus {
  timestamp: string;
  overallScore: number;
  fileScores: Array<{
    file: string;
    score: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    issues: string[];
  }>;
  metrics: {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    completionRate: number;
    qualityScore: number;
  };
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

interface QualityAlert {
  type: 'low_quality' | 'missing_translation' | 'terminology_issue' | 'cultural_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  key?: string;
  message: string;
  suggestion: string;
  timestamp: string;
}

export class TajikTranslationMonitor {
  private config: MonitoringConfig;
  private evaluator: TajikLocalizationEvaluator;
  private optimizer: TajikTranslationOptimizer;
  private statusHistory: TranslationStatus[] = [];
  private alerts: QualityAlert[] = [];
  private monitoringActive = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(projectRoot: string, configPath?: string) {
    this.evaluator = new TajikLocalizationEvaluator(projectRoot);
    this.optimizer = new TajikTranslationOptimizer(projectRoot);
    this.config = this.loadConfig(configPath);
  }

  /**
   * 加载监控配置
   */
  private loadConfig(configPath?: string): MonitoringConfig {
    const defaultConfig: MonitoringConfig = {
      checkInterval: 3600000, // 1小时
      qualityThreshold: 80,
      enableAutoFix: false,
      notifications: {},
      schedules: {
        daily: '09:00',
        weekly: 'Mon 09:00',
        monthly: '1 09:00'
      },
      alerts: {
        lowQuality: true,
        missingTranslations: true,
        terminologyInconsistency: true
      }
    };

    if (configPath) {
      try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(configData);
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('无法加载配置文件，使用默认配置:', error);
      }
    }

    return defaultConfig;
  }

  /**
   * 启动监控
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('监控已在运行中...');
      return;
    }

    console.log('🟢 启动塔吉克语翻译质量监控...');

    // 执行初始检查
    await this.performFullCheck();

    // 设置定期检查
    this.checkInterval = setInterval(async () => {
      await this.performScheduledCheck();
    }, this.config.checkInterval);

    this.monitoringActive = true;
    console.log('✅ 监控已启动，将每', this.config.checkInterval / 1000 / 60, '分钟检查一次');

    // 设置定时任务
    this.schedulePeriodicChecks();
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.monitoringActive = false;
    console.log('⏹️ 塔吉克语翻译质量监控已停止');
  }

  /**
   * 执行完整检查
   */
  async performFullCheck(): Promise<TranslationStatus> {
    console.log('🔍 执行完整翻译质量检查...');

    try {
      // 运行本土化评估
      const assessment = await this.evaluator.evaluateLocalization();
      
      // 运行翻译优化
      const optimization = await this.optimizer.optimizeTranslation();
      
      // 计算状态
      const status = this.calculateStatus(assessment, optimization);
      
      // 检查阈值和告警
      await this.checkThresholds(status);
      
      // 保存状态历史
      await this.saveStatusHistory(status);
      
      // 发送通知
      await this.sendNotifications(status);
      
      console.log(`✅ 检查完成 - 总体评分: ${status.overallScore}/100`);
      
      return status;
    } catch (error) {
      console.error('❌ 质量检查失败:', error);
      throw error;
    }
  }

  /**
   * 执行定时检查
   */
  private async performScheduledCheck(): Promise<void> {
    try {
      const status = await this.performFullCheck();
      
      // 如果质量下降，发出告警
      if (status.overallScore < this.config.qualityThreshold) {
        await this.triggerAlert({
          type: 'low_quality',
          severity: 'medium',
          file: 'overall',
          message: `翻译质量低于阈值: ${status.overallScore}/100`,
          suggestion: '请检查最近的翻译更改并进行必要的修复',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('定时检查失败:', error);
    }
  }

  /**
   * 计算翻译状态
   */
  private calculateStatus(assessment: any, optimization: any): TranslationStatus {
    const fileScores = assessment.fileScores.map((score: any) => ({
      file: score.file,
      score: score.overallScore,
      status: this.getScoreStatus(score.overallScore),
      issues: score.issues.map((issue: any) => `${issue.severity}: ${issue.description}`)
    }));

    const metrics = this.calculateMetrics(assessment);

    return {
      timestamp: new Date().toISOString(),
      overallScore: assessment.overallScore,
      fileScores,
      metrics,
      trends: this.calculateTrends()
    };
  }

  /**
   * 获取评分状态
   */
  private getScoreStatus(score: number): TranslationStatus['fileScores'][0]['status'] {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'needs_improvement';
    return 'critical';
  }

  /**
   * 计算指标
   */
  private calculateMetrics(assessment: any) {
    const totalKeys = assessment.fileScores.reduce((sum: number, score: any) => sum + this.countTotalKeys(score.file), 0);
    const translatedKeys = assessment.fileScores.reduce((sum: number, score: any) => {
      return sum + (score.totalKeys - (score.issues.filter((i: any) => i.severity === 'high').length));
    }, 0);
    
    const missingKeys = totalKeys - translatedKeys;
    const completionRate = (translatedKeys / totalKeys) * 100;
    
    // 计算质量分数（去掉完整性影响的准确性分数）
    const qualityScore = assessment.fileScores.reduce((sum: number, score: any) => {
      return sum + ((score.accuracy + score.culturalAdaptation + score.naturalness) / 3);
    }, 0) / assessment.fileScores.length;

    return {
      totalKeys,
      translatedKeys,
      missingKeys,
      completionRate,
      qualityScore
    };
  }

  /**
   * 统计总键数（简化版本）
   */
  private countTotalKeys(fileName: string): number {
    // 这里应该从实际文件中读取键数，简化处理
    const keyCounts: { [key: string]: number } = {
      'admin.json': 246,
      'bot.json': 104,
      'common.json': 94,
      'error.json': 49,
      'lottery.json': 27,
      'referral.json': 126,
      'auth.json': 13,
      'task.json': 8,
      'wallet.json': 15
    };
    return keyCounts[fileName] || 0;
  }

  /**
   * 计算趋势
   */
  private calculateTrends() {
    // 这里应该从历史数据中计算趋势，简化处理
    const now = new Date().getTime();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      daily: [75, 80, 85, 84], // 过去4天的分数
      weekly: [82, 83, 84, 84, 84, 84, 84], // 过去7天的分数
      monthly: Array(30).fill(84) // 过去30天的分数
    };
  }

  /**
   * 检查阈值
   */
  private async checkThresholds(status: TranslationStatus): Promise<void> {
    // 检查整体质量
    if (status.overallScore < this.config.qualityThreshold) {
      this.addAlert({
        type: 'low_quality',
        severity: status.overallScore < 60 ? 'high' : 'medium',
        file: 'overall',
        message: `整体翻译质量低于阈值 ${this.config.qualityThreshold}: ${status.overallScore}`,
        suggestion: '请检查最近更改并进行必要的修复',
        timestamp: new Date().toISOString()
      });
    }

    // 检查缺失翻译
    if (status.metrics.missingKeys > 0) {
      this.addAlert({
        type: 'missing_translation',
        severity: 'high',
        file: 'overall',
        message: `发现 ${status.metrics.missingKeys} 个缺失的翻译`,
        suggestion: '请优先完成缺失翻译以确保功能完整性',
        timestamp: new Date().toISOString()
      });
    }

    // 检查文件质量
    status.fileScores.forEach(fileScore => {
      if (fileScore.score < 70) {
        this.addAlert({
          type: 'terminology_issue',
          severity: fileScore.score < 50 ? 'high' : 'medium',
          file: fileScore.file,
          message: `文件 ${fileScore.file} 质量需要改进 (${fileScore.score}/100)`,
          suggestion: '请检查文件中的翻译质量和术语一致性',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * 添加告警
   */
  private addAlert(alert: QualityAlert): void {
    this.alerts.push(alert);
    
    // 只保留最近100个告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    console.log(`🚨 质量告警 [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }

  /**
   * 触发告警通知
   */
  private async triggerAlert(alert: QualityAlert): Promise<void> {
    await this.sendAlertNotification(alert);
  }

  /**
   * 设置定时检查
   */
  private schedulePeriodicChecks(): void {
    // 每日检查
    const dailyTime = this.config.schedules.daily.split(':');
    const dailyHour = parseInt(dailyTime[0]);
    const dailyMinute = parseInt(dailyTime[1]);
    
    // 每周检查（简化处理，使用周一）
    const weeklyTime = this.config.schedules.weekly.split(' ');
    const weeklyHour = parseInt(weeklyTime[1].split(':')[0]);
    const weeklyMinute = parseInt(weeklyTime[1].split(':')[1]);

    // 每月检查
    const monthlyTime = this.config.schedules.monthly.split(' ');
    const monthlyDay = parseInt(monthlyTime[0]);
    const monthlyHour = parseInt(monthlyTime[1].split(':')[0]);
    const monthlyMinute = parseInt(monthlyTime[1].split(':')[1]);

    console.log(`📅 定时检查已设置:`);
    console.log(`   - 每日: ${dailyHour}:${dailyMinute.toString().padStart(2, '0')}`);
    console.log(`   - 每周: 周一 ${weeklyHour}:${weeklyMinute.toString().padStart(2, '0')}`);
    console.log(`   - 每月: ${monthlyDay}日 ${monthlyHour}:${monthlyMinute.toString().padStart(2, '0')}`);
  }

  /**
   * 保存状态历史
   */
  private async saveStatusHistory(status: TranslationStatus): Promise<void> {
    this.statusHistory.push(status);
    
    // 只保留最近365天的数据
    if (this.statusHistory.length > 365) {
      this.statusHistory = this.statusHistory.slice(-365);
    }
    
    // 保存到文件
    const historyPath = path.join(process.cwd(), 'reports', 'tajik-translation-history.json');
    try {
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(historyPath, JSON.stringify(this.statusHistory, null, 2));
    } catch (error) {
      console.warn('保存历史状态失败:', error);
    }
  }

  /**
   * 发送通知
   */
  private async sendNotifications(status: TranslationStatus): Promise<void> {
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    if (recentAlerts.length > 0 || status.overallScore < this.config.qualityThreshold) {
      await this.sendStatusNotification(status, recentAlerts);
    }
  }

  /**
   * 发送状态通知
   */
  private async sendStatusNotification(status: TranslationStatus, alerts: QualityAlert[]): Promise<void> {
    const message = this.formatStatusMessage(status, alerts);
    
    // 发送到配置的渠道
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(message);
    }
    
    if (this.config.notifications.email) {
      await this.sendEmailNotification(message);
    }
    
    if (this.config.notifications.webhook) {
      await this.sendWebhookNotification(message);
    }
  }

  /**
   * 发送告警通知
   */
  private async sendAlertNotification(alert: QualityAlert): Promise<void> {
    const message = this.formatAlertMessage(alert);
    
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(message);
    }
    
    if (this.config.notifications.email) {
      await this.sendEmailNotification(message);
    }
  }

  /**
   * 格式化状态消息
   */
  private formatStatusMessage(status: TranslationStatus, alerts: QualityAlert[]): string {
    let message = `📊 塔吉克语翻译质量报告\n\n`;
    message += `🕒 时间: ${new Date(status.timestamp).toLocaleString('zh-CN')}\n`;
    message += `📈 总体评分: ${status.overallScore}/100\n`;
    message += `📝 完成度: ${status.metrics.completionRate.toFixed(1)}%\n`;
    message += `🔑 总键数: ${status.metrics.totalKeys}\n`;
    message += `✅ 已翻译: ${status.metrics.translatedKeys}\n`;
    message += `❌ 缺失: ${status.metrics.missingKeys}\n\n`;
    
    if (alerts.length > 0) {
      message += `🚨 告警信息:\n`;
      alerts.forEach(alert => {
        message += `• [${alert.severity.toUpperCase()}] ${alert.message}\n`;
      });
      message += `\n`;
    }
    
    // 添加趋势信息
    if (status.trends.daily.length >= 2) {
      const recent = status.trends.daily.slice(-2);
      const trend = recent[1] > recent[0] ? '↗️' : recent[1] < recent[0] ? '↘️' : '➡️';
      message += `📈 日趋势: ${trend}\n`;
    }
    
    return message;
  }

  /**
   * 格式化告警消息
   */
  private formatAlertMessage(alert: QualityAlert): string {
    const emoji = {
      low: '⚠️',
      medium: '🚨',
      high: '🔥',
      critical: '💀'
    }[alert.severity];
    
    return `${emoji} 塔吉克语翻译质量告警\n` +
           `类型: ${alert.type}\n` +
           `文件: ${alert.file}\n` +
           `消息: ${alert.message}\n` +
           `建议: ${alert.suggestion}\n` +
           `时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}`;
  }

  /**
   * 发送 Slack 通知（模拟实现）
   */
  private async sendSlackNotification(message: string): Promise<void> {
    // 这里应该实际调用 Slack API
    console.log('📱 Slack 通知:', message);
  }

  /**
   * 发送邮件通知（模拟实现）
   */
  private async sendEmailNotification(message: string): Promise<void> {
    // 这里应该实际发送邮件
    console.log('📧 邮件通知:', message);
  }

  /**
   * 发送 Webhook 通知（模拟实现）
   */
  private async sendWebhookNotification(message: string): Promise<void> {
    // 这里应该实际发送 HTTP 请求
    console.log('🔗 Webhook 通知:', message);
  }

  /**
   * 获取当前状态
   */
  getCurrentStatus(): TranslationStatus | null {
    return this.statusHistory.length > 0 ? this.statusHistory[this.statusHistory.length - 1] : null;
  }

  /**
   * 获取告警列表
   */
  getAlerts(limit = 10): QualityAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * 生成质量报告
   */
  async generateQualityReport(): Promise<string> {
    const status = await this.performFullCheck();
    
    let report = `# 塔吉克语翻译质量监控报告\n\n`;
    report += `**生成时间**: ${new Date(status.timestamp).toLocaleString('zh-CN')}\n\n`;
    
    report += `## 总体状态\n\n`;
    report += `- **整体评分**: ${status.overallScore}/100\n`;
    report += `- **完成度**: ${status.metrics.completionRate.toFixed(1)}%\n`;
    report += `- **翻译键数**: ${status.metrics.translatedKeys}/${status.metrics.totalKeys}\n`;
    report += `- **缺失键数**: ${status.metrics.missingKeys}\n\n`;
    
    report += `## 文件状态\n\n`;
    status.fileScores.forEach(file => {
      const statusEmoji = {
        excellent: '✅',
        good: '👍',
        needs_improvement: '⚠️',
        critical: '❌'
      }[file.status];
      
      report += `### ${file.file} ${statusEmoji}\n`;
      report += `评分: ${file.score}/100\n`;
      if (file.issues.length > 0) {
        report += `问题: ${file.issues.length}个\n`;
      }
      report += `\n`;
    });
    
    if (this.alerts.length > 0) {
      report += `## 最近告警\n\n`;
      this.alerts.slice(-5).forEach(alert => {
        report += `- [${alert.severity.toUpperCase()}] ${alert.message}\n`;
      });
    }
    
    report += `\n## 建议措施\n\n`;
    
    if (status.overallScore < 80) {
      report += `1. 优先修复评分较低的文件\n`;
    }
    
    if (status.metrics.missingKeys > 0) {
      report += `2. 完成 ${status.metrics.missingKeys} 个缺失翻译\n`;
    }
    
    report += `3. 定期运行质量检查\n`;
    report += `4. 保持术语一致性\n`;
    
    return report;
  }

  /**
   * 清理历史数据
   */
  async cleanupHistory(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const originalLength = this.statusHistory.length;
    this.statusHistory = this.statusHistory.filter(status => 
      new Date(status.timestamp) > cutoffDate
    );
    
    console.log(`🧹 清理历史数据: ${originalLength} -> ${this.statusHistory.length} 条记录`);
  }
}

// 使用示例
async function main() {
  const monitor = new TajikTranslationMonitor(process.cwd());
  
  try {
    // 启动监控
    await monitor.startMonitoring();
    
    // 生成报告
    const report = await monitor.generateQualityReport();
    console.log('\n' + report);
    
    // 运行一段时间后停止（示例）
    setTimeout(() => {
      monitor.stopMonitoring();
    }, 60000); // 1分钟后停止
    
  } catch (error) {
    console.error('监控启动失败:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}