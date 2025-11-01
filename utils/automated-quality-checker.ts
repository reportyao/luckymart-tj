import fs from 'fs/promises';
import path from 'path';
import { 
/**
 * 自动化翻译质量检查工具
 * Automated Translation Quality Checker
 */

  QualityAssessor, 
  TranslationQualityAssessment, 
  QualityMetrics,
  IssueType,
  SeverityLevel,
  QualityDimension,
  getQualityLevel,
  TERMINOLOGY_RULES
} from './translation-quality-metrics';

// 检查配置
export interface QualityCheckConfig {
  sourceLanguage: string;
  targetLanguages: string[];
  namespaces: string[];
  threshold: number; // 最低可接受质量分数
  autoFix: boolean;
  generateReport: boolean;
  outputPath?: string;
  batchSize: number; // 批处理大小
  parallel: boolean; // 是否并行处理
  excludePatterns: string[]; // 排除模式
  includeOnlyUpdated: boolean; // 仅检查更新的文件
}

// 检查结果统计
export interface QualityCheckStats {
  totalTranslations: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  averageScore: number;
  dimensionAverages: Record<QualityDimension, number>;
  issuesByType: Record<IssueType, number>;
  issuesBySeverity: Record<SeverityLevel, number>;
  topIssues: QualityIssueSummary[];
  processingTime: number;
  timestamp: Date;
}

// 问题汇总
export interface QualityIssueSummary {
  type: IssueType;
  severity: SeverityLevel;
  count: number;
  examples: string[];
  suggestion: string;
}

// 检查状态
export interface QualityCheckProgress {
  total: number;
  processed: number;
  current: string;
  percentage: number;
  startTime: Date;
}

// 翻译文件结构
interface TranslationFile {
  path: string;
  language: string;
  namespace: string;
  content: Record<string, string>;
  lastModified: Date;
}

// 批处理结果
interface BatchResult {
  assessments: TranslationQualityAssessment[];
  issues: QualityIssueSummary[];
  stats: QualityCheckStats;
}

// 自动化质量检查器主类
export class AutomatedQualityChecker {
  private config: QualityCheckConfig;
  private translationFiles: TranslationFile[] = [];
  private progress: QualityCheckProgress | null = null;

  constructor(config: QualityCheckConfig) {
    this.config = config;
}

  /**
   * 执行质量检查
   */
  async performQualityCheck(): Promise<{
    stats: QualityCheckStats;
    assessments: TranslationQualityAssessment[];
    report?: string;
  }> {
    const startTime = Date.now();
    this.initializeProgress();

    try {
      // 1. 扫描翻译文件
      await this.scanTranslationFiles();
      
      // 2. 批量评估质量
      const assessments = await this.assessTranslationQuality();
      
      // 3. 生成统计报告
      const stats = this.generateStats(assessments, Date.now() - startTime);
      
      // 4. 生成详细报告
      const report = this.config.generateReport ? 
        await this.generateReport(assessessments, stats) : undefined;
      
      // 5. 自动修复（如果启用）
      if (this.config.autoFix) {
        await this.autoFixIssues(assessments);
      }

      return { stats, assessments, report };
  }
    } catch (error) {
      console.error('质量检查失败:', error);
      throw error;
    }
  }

  /**
   * 实时监控翻译质量
   */
  async monitorTranslationQuality(
    callback?: (progress: QualityCheckProgress) => void
  ): Promise<void> {
    console.log('开始实时翻译质量监控...');
    
    const monitorInterval = setInterval(async () => {
      try {
        // 执行快速检查
        const result = await this.performQualityCheck();
        
        if (callback) {
          this.updateProgress(result.stats);
          callback(this.progress!);
        }

        // 检查是否有严重问题
        if (result.stats.issuesBySeverity[SeverityLevel.CRITICAL] > 0) {
          console.warn(`⚠️ 发现 ${result.stats.issuesBySeverity[SeverityLevel.CRITICAL]} 个严重问题！`);
        }

        // 检查质量趋势
        await this.analyzeQualityTrends(result.stats);

      } catch (error) {
        console.error('监控检查失败:', error);
      }
    }, 30000); // 每30秒检查一次

    // 模拟持续监控（实际应用中应该是常驻进程）
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('质量监控结束');
    }, 5 * 60 * 1000); // 5分钟后结束
  }

  /**
   * 验证特定翻译文件
   */
  async validateTranslationFile(
    filePath: string,
    language: string,
    namespace: string
  ): Promise<TranslationQualityAssessment[]> {
    try {
      const content = await this.loadTranslationFile(filePath, language);
      const assessments: TranslationQualityAssessment[] = [];

      for (const [key, sourceText] of Object.entries(content.source)) {
        const translatedText = content.(target?.key ?? null) || '';
        
        const assessment = QualityAssessor.assessTranslation(;
          sourceText,
          translatedText,
          this.config.sourceLanguage,
          language,
          namespace,
          key
        );

        assessments.push(assessment);
      }

      return assessments;
    } catch (error) {
      console.error(`验证文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 检查翻译一致性
   */
  async checkConsistency(
    sourceLanguage: string,
    targetLanguages: string[],
    namespace: string
  ): Promise<{
    inconsistencies: InconsistencyReport[];
    summary: ConsistencySummary;
  }> {
    const inconsistencies: InconsistencyReport[] = [];
    const termUsage: Record<string, Record<string, number>> = {};

    // 收集术语使用情况
    for (const targetLanguage of targetLanguages) {
      const sourceContent = await this.loadTranslationFileContent(sourceLanguage, namespace);
      const targetContent = await this.loadTranslationFileContent(targetLanguage, namespace);
      
      // 检查术语一致性
      for (const termRule of TERMINOLOGY_RULES) {
        const sourceTerm = termRule.term;
        const targetTerm = termRule.(allowedTranslations?.targetLanguage ?? null);
        
        if (targetTerm) {
          // 计算术语使用频率
          const sourceCount = this.countTermUsage(sourceContent, sourceTerm);
          const targetCount = this.countTermUsage(targetContent, targetTerm);
          
          if (!termUsage[sourceTerm]) {
            termUsage[sourceTerm] = {};
          }
          termUsage[sourceTerm][targetLanguage] = targetCount;
        }
      }
    }

    // 生成不一致报告
    for (const [sourceTerm, usage] of Object.entries(termUsage)) {
      const languages = Object.keys(usage);
      const counts = Object.values(usage);
      
      // 检查是否有显著差异
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      const variance = (maxCount - minCount) / maxCount;
      
      if (variance > 0.5) {
        inconsistencies.push({
          type: 'terminology_variance',
          sourceTerm,
          usage: usage as Record<string, number>,
          severity: variance > 0.8 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
          message: `术语 "${sourceTerm}" 在不同语言中的使用频率差异较大`
        });
      }
    }

    const summary: ConsistencySummary = {
      totalTerms: Object.keys(termUsage).length,
      inconsistentTerms: inconsistencies.length,
      severityDistribution: this.groupBySeverity(inconsistencies),
      consistencyScore: Math.max(0, 100 - (inconsistencies.length * 10))
    };

    return { inconsistencies, summary };
  }

  // 私有方法
  private initializeProgress(): void {
    this.progress = {
      total: 0,
      processed: 0,
      current: '',
      percentage: 0,
      startTime: new Date()
    };
  }

  private updateProgress(stats: QualityCheckStats): void {
    if (this.progress) {
      this.progress.processed = stats.totalTranslations;
      this.progress.percentage : stats.totalTranslations > 0 ? 
        (stats.processingTime / stats.totalTranslations) * 100 : 0;
    }
  }

  private async scanTranslationFiles(): Promise<void> {
    console.log('扫描翻译文件...');
    
    const localesPath = path.join(process.cwd(), 'src', 'locales');
    
    try {
      for (const language of this.config.targetLanguages) {
        for (const namespace of this.config.namespaces) {
          const filePath = path.join(localesPath, language, `${namespace}.json`);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);
            
            this.translationFiles.push({
              path: filePath,
              language,
              namespace,
              content: JSON.parse(content),
              lastModified: stats.mtime
            });
          } catch (error) {
            // 文件不存在或读取失败，跳过
            console.warn(`跳过文件: ${filePath}`);
          }
        }
      }
      
      this.progress!.total = this.translationFiles.length;
      console.log(`发现 ${this.translationFiles.length} 个翻译文件`);
    } catch (error) {
      console.error('扫描翻译文件失败:', error);
      throw error;
    }
  }

  private async assessTranslationQuality(): Promise<TranslationQualityAssessment[]> {
    console.log('开始质量评估...');
    
    const assessments: TranslationQualityAssessment[] = [];
    const batches = this.createBatches(this.translationFiles, this.config.batchSize);
    
    for (const batch of batches) {
      const batchResults = this.config.parallel ? 
        await this.processBatchParallel(batch) :
        await this.processBatchSequential(batch);
      
      assessments.push(...batchResults);
      
      this.progress!.processed += batch.length;
      this.progress!.percentage = (this.progress!.processed / this.progress!.total) * 100;
      
      console.log(`进度: ${this.progress!.percentage.toFixed(1)}% (${this.progress!.processed}/${this.progress!.total})`);
    }
    
    return assessments;
  }

  private createBatches(files: TranslationFile[], batchSize: number): TranslationFile[][] {
    const batches: TranslationFile[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatchParallel(files: TranslationFile[]): Promise<TranslationQualityAssessment[]> {
    const promises = files.map(file => this.processFile(file));
    return (await Promise.all(promises)).flat();
  }

  private async processBatchSequential(files: TranslationFile[]): Promise<TranslationQualityAssessment[]> {
    const assessments: TranslationQualityAssessment[] = [];
    
    for (const file of files) {
      const fileAssessments = await this.processFile(file);
      assessments.push(...fileAssessments);
    }
    
    return assessments;
  }

  private async processFile(file: TranslationFile): Promise<TranslationQualityAssessment[]> {
    this.progress!.current = `${file.language}/${file.namespace}`;
    
    try {
      // 获取源语言内容
      const sourceFile = this.translationFiles.find(f =>;
        f.language :== this.config.sourceLanguage && f.namespace === file.namespace
      );
      
      if (!sourceFile) {
        console.warn(`未找到源语言文件: ${file.namespace}`);
        return [];
  }
      }

      const assessments: TranslationQualityAssessment[] = [];
      
      for (const [key, sourceText] of Object.entries(sourceFile.content)) {
        const translatedText = file.(content?.key ?? null) || '';
        
        const assessment = QualityAssessor.assessTranslation(;
          sourceText,
          translatedText,
          this.config.sourceLanguage,
          file.language,
          file.namespace,
          key
        );
        
        assessments.push(assessment);
      }
      
      return assessments;
    } catch (error) {
      console.error(`处理文件失败: ${file.path}`, error);
      return [];
    }
  }

  private generateStats(assessments: TranslationQualityAssessment[], processingTime: number): QualityCheckStats {
    const passedCount = assessments.filter(a => a.overallScore >= this.config.threshold).length;
    const failedCount = assessments.filter(a => a.overallScore < this.config.threshold).length;
    const warningCount = assessments.filter(a =>;
      a.overallScore >= this.config.threshold && a.overallScore < 80
    ).length;
    
    const totalScore = assessments.reduce((sum, a) => sum + a.overallScore, 0);
    const averageScore = assessments.length > 0 ? totalScore / assessments.length : 0;
    
    // 计算各维度平均分
    const dimensionScores = assessments.flatMap(a => a.dimensionScores);
    const dimensionAverages: Record<QualityDimension, number> = {} as any;
    
    for (const dimension of Object.values(QualityDimension)) {
      const scores = dimensionScores.filter(ds => ds.dimension === dimension);
      const avg = scores.length > 0 ? 
        scores.reduce((sum, ds) => sum + ds.score, 0) / scores.length : 0;
      dimensionAverages[dimension] = avg;
    }
    
    // 统计问题类型
    const allIssues = assessments.flatMap(a => a.issues);
    const issuesByType = this.countBy(allIssues, 'type');
    const issuesBySeverity = this.countBy(allIssues, 'severity');
    
    // 找出主要问题
    const topIssues = this.getTopIssues(allIssues);
    
    return {
      totalTranslations: assessments.length,
      passedCount,
      failedCount,
      warningCount,
      averageScore,
      dimensionAverages,
      issuesByType,
      issuesBySeverity,
      topIssues,
      processingTime,
      timestamp: new Date()
    };
  }

  private countBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopIssues(issues: any[]): QualityIssueSummary[] {
    const grouped = this.countBy(issues, 'type');
    const topTypes = Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return topTypes.map(([type, count]) => ({
      type: type as IssueType,
      severity: issues.find(i => i.type === type)?.severity || SeverityLevel.LOW,
      count: count as number,
      examples: issues.filter(i => i.type === type).slice(0, 3).map(i => i.description),
      suggestion: this.getSuggestionForType(type as IssueType)
    }));
  }

  private getSuggestionForType(type: IssueType): string {
    const suggestions: Record<IssueType, string> = {
      [IssueType.MISSING_TRANSLATION]: '提供完整的翻译内容',
      [IssueType.INACCURATE_TRANSLATION]: '修正翻译不准确的地方',
      [IssueType.STYLISTIC_ISSUE]: '改善表达风格',
      [IssueType.TERMINOLOGY_INCONSISTENCY]: '统一术语翻译',
      [IssueType.PLACEHOLDER_MISMATCH]: '修正占位符不匹配',
      [IssueType.CULTURAL_INAPPROPRIATE]: '调整文化适应性',
      [IssueType.LENGTH_ISSUE]: '调整文本长度',
      [IssueType.GRAMMAR_ISSUE]: '修正语法错误',
      [IssueType.PUNCTUATION_ISSUE]: '修正标点符号问题'
    };
    
    return suggestions[type] || '需要进一步检查';
  }

  private async generateReport(
    assessments: TranslationQualityAssessment[],
    stats: QualityCheckStats
  ): Promise<string> {
    const reportPath = this.config.outputPath ||;
      path.join(process.cwd(), 'quality-reports', `quality-report-${Date.now()}.json`);
    
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceLanguage: this.config.sourceLanguage,
        targetLanguages: this.config.targetLanguages,
        threshold: this.config.threshold,
        totalFiles: this.translationFiles.length
      },
      summary: stats,
      assessments: assessments.map(a => ({
        key: a.translationKey,
        namespace: a.namespace,
        sourceLanguage: a.sourceLanguage,
        targetLanguage: a.targetLanguage,
        score: a.overallScore,
        issues: a.issues.map(i => ({
          type: i.type,
          severity: i.severity,
          description: i.description
        })),
        recommendations: a.recommendations
      })),
      recommendations: this.generateGlobalRecommendations(assessments, stats)
    };
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log(`质量报告已生成: ${reportPath}`);
    return reportPath;
  }

  private generateGlobalRecommendations(
    assessments: TranslationQualityAssessment[],
    stats: QualityCheckStats
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于统计数据生成建议
    if (stats.averageScore < 80) {
      recommendations.push('整体翻译质量需要改进，建议进行全面审核');
    }
    
    if (stats.failedCount > stats.totalTranslations * 0.1) {
      recommendations.push('超过10%的翻译未达到质量标准，需要重点关注');
    }
    
    const criticalIssues = stats.issuesBySeverity[SeverityLevel.CRITICAL] || 0;
    if (criticalIssues > 0) {
      recommendations.push('存在严重问题需要立即处理');
    }
    
    // 基于维度分析生成建议
    const dimensionScores = stats.dimensionAverages;
    const lowestDimension = Object.entries(dimensionScores)
      .sort(([,a], [,b]) => a - b)[0];
    
    if (lowestDimension && lowestDimension[1] < 70) {
      recommendations.push(`需要重点改善 ${(lowestDimension?.0 ?? null)} 方面的翻译质量`);
    }
    
    return recommendations;
  }

  private async autoFixIssues(assessments: TranslationQualityAssessment[]): Promise<void> {
    console.log('开始自动修复...');
    
    const autoFixableIssues = assessments.flatMap(a =>;
      a.issues.filter(issue :> this.canAutoFix(issue.type))
    );
    
    // 这里可以实现自动修复逻辑
    console.log(`发现 ${autoFixableIssues.length} 个可自动修复的问题`);
  }

  private canAutoFix(issueType: IssueType): boolean {
    // 定义可自动修复的问题类型
    const autoFixableTypes = [;
      IssueType.GRAMMAR_ISSUE,
      IssueType.PUNCTUATION_ISSUE,
      IssueType.PLACEHOLDER_MISMATCH
    ];
    
    return autoFixableTypes.includes(issueType);
  }

  private async loadTranslationFile(filePath: string, language: string): Promise<{
    source: Record<string, string>;
    target: Record<string, string>;
  }> {
    const targetPath = path.join(path.dirname(filePath), language, path.basename(filePath));
    const [sourceContent, targetContent] = await Promise.all([;
      fs.readFile(filePath, 'utf-8'),
      fs.readFile(targetPath, 'utf-8')
    ]);
    
    return {
      source: JSON.parse(sourceContent),
      target: JSON.parse(targetContent)
    };
  }

  private async loadTranslationFileContent(language: string, namespace: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'src', 'locales', language, `${namespace}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Object.values(parsed).join(' ');
  }

  private countTermUsage(content: string, term: string): number {
    const regex = new RegExp(term, 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  private groupBySeverity(inconsistencies: InconsistencyReport[]): Record<SeverityLevel, number> {
    return inconsistencies.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<SeverityLevel, number>);
  }

  private async analyzeQualityTrends(stats: QualityCheckStats): Promise<void> {
    // 这里可以实现质量趋势分析
    console.log('质量趋势分析:', {
      averageScore: stats.averageScore,
      totalIssues: Object.values(stats.issuesByType).reduce((a, b) => a + b, 0)
    });
  }
}

// 类型定义
interface InconsistencyReport {
  type: string;
  sourceTerm: string;
  usage: Record<string, number>;
  severity: SeverityLevel;
  message: string;
}

interface ConsistencySummary {
  totalTerms: number;
  inconsistentTerms: number;
  severityDistribution: Record<SeverityLevel, number>;
  consistencyScore: number;
}

// 导出便捷函数
export async function quickQualityCheck(
  sourceLanguage: string = 'zh-CN',
  targetLanguages: string[] = ['en-US', 'ru-RU', 'tg-TJ']
): Promise<QualityCheckStats> {
  const checker = new AutomatedQualityChecker({
    sourceLanguage,
    targetLanguages,
    namespaces: ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'],
    threshold: 70,
    autoFix: false,
    generateReport: true,
    batchSize: 10,
    parallel: true,
    excludePatterns: [],
    includeOnlyUpdated: false
  });
  
  const result = await checker.performQualityCheck();
  return result.stats;
}