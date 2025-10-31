/**
 * 翻译同步和发布工具
 * Translation Sync and Publish Tool
 * 
 * 功能：
 * - 翻译文件的同步和发布机制
 * - 支持不同环境的翻译部署
 * - 提供翻译更新的批量处理和回滚
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production';
  baseUrl: string;
  translationPath: string;
  deploymentPath: string;
  webhookUrl?: string;
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
  };
  features: {
    hotReload: boolean;
    autoBackup: boolean;
    rollbackEnabled: boolean;
    notificationEnabled: boolean;
  };
}

export interface SyncOperation {
  id: string;
  type: 'sync' | 'deploy' | 'rollback' | 'validate' | 'backup';
  source: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: any;
  metadata: {
    files: SyncFile[];
    environments: string[];
    languages: string[];
    namespaces: string[];
    user: string;
    description: string;
  };
}

export interface SyncFile {
  path: string;
  relativePath: string;
  locale: string;
  namespace: string;
  size: number;
  lastModified: number;
  checksum: string;
  action: 'added' | 'modified' | 'deleted' | 'unchanged';
  version?: string;
}

export interface DeploymentResult {
  success: boolean;
  deployedFiles: number;
  skippedFiles: number;
  errors: string[];
  warnings: string[];
  deploymentId: string;
  timestamp: number;
  environment: string;
  duration: number;
}

export interface RollbackResult {
  success: boolean;
  rolledBackFiles: number;
  errors: string[];
  previousDeploymentId?: string;
  timestamp: number;
  environment: string;
}

export interface SyncConfig {
  environments: EnvironmentConfig[];
  defaultEnvironment: string;
  sync: {
    batchSize: number;
    retryAttempts: number;
    timeout: number;
    parallel: boolean;
    validateFiles: boolean;
  };
  deployment: {
    backupBeforeDeploy: boolean;
    validationRequired: boolean;
    rollbackAvailable: boolean;
    notificationEnabled: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

export class TranslationSyncTool extends EventEmitter {
  private configs: Map<string, EnvironmentConfig> = new Map();
  private activeOperations: Map<string, SyncOperation> = new Map();
  private deploymentHistory: DeploymentResult[] = [];
  private basePath: string;
  private tempDir: string;

  constructor(private baseTranslationPath: string = './src/locales') {
    super();
    this.basePath = baseTranslationPath;
    this.tempDir = path.join(baseTranslationPath, '.temp');
    
    this.initializeDirectories();
    this.setupEventListeners();
  }

  private initializeDirectories(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private setupEventListeners(): void {
    this.on('operation:started', (operationId: string, operation: SyncOperation) => {
      console.log(`Sync operation started: ${operationId}`, operation.metadata);
    });

    this.on('operation:completed', (operationId: string, result: any) => {
      console.log(`Sync operation completed: ${operationId}`, result);
    });

    this.on('operation:failed', (operationId: string, error: string) => {
      console.error(`Sync operation failed: ${operationId}`, error);
    });

    this.on('file:sync', (file: SyncFile, environment: string) => {
      console.log(`File synced to ${environment}: ${file.relativePath}`);
    });

    this.on('deployment:started', (environment: string, deploymentId: string) => {
      console.log(`Deployment started to ${environment}: ${deploymentId}`);
    });

    this.on('deployment:completed', (environment: string, result: DeploymentResult) => {
      console.log(`Deployment completed to ${environment}:`, result);
    });

    this.on('rollback:started', (environment: string, deploymentId: string) => {
      console.log(`Rollback started to ${environment}: ${deploymentId}`);
    });

    this.on('rollback:completed', (environment: string, result: RollbackResult) => {
      console.log(`Rollback completed to ${environment}:`, result);
    });
  }

  /**
   * 添加环境配置
   */
  addEnvironment(config: EnvironmentConfig): void {
    this.configs.set(config.name, config);
    this.saveConfig();
  }

  /**
   * 获取环境配置
   */
  getEnvironment(name: string): EnvironmentConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 列出所有环境
   */
  listEnvironments(): EnvironmentConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 同步翻译文件到指定环境
   */
  async syncToEnvironment(
    environmentName: string,
    options: {
      languages?: string[];
      namespaces?: string[];
      dryRun?: boolean;
      force?: boolean;
      user?: string;
      description?: string;
    } = {}
  ): Promise<string> {
    const environment = this.configs.get(environmentName);
    if (!environment) {
      throw new Error(`Environment ${environmentName} not found`);
    }

    const operationId = this.generateOperationId();
    
    // 获取要同步的文件
    const files = await this.getFilesToSync(options);
    
    const operation: SyncOperation = {
      id: operationId,
      type: 'sync',
      source: this.basePath,
      target: environmentName,
      status: 'pending',
      progress: 0,
      metadata: {
        files,
        environments: [environmentName],
        languages: options.languages || [],
        namespaces: options.namespaces || [],
        user: options.user || 'system',
        description: options.description || 'Manual sync'
      }
    };

    this.activeOperations.set(operationId, operation);
    this.emit('operation:started', operationId, operation);

    // 执行同步
    if (options.dryRun) {
      const result = await this.performDryRunSync(operation);
      operation.status = 'completed';
      operation.result = result;
    } else {
      try {
        const result = await this.performSync(operation, environment);
        operation.status = 'completed';
        operation.result = result;
      } catch (error) {
        operation.status = 'failed';
        operation.error = error instanceof Error ? error.message : String(error);
        this.emit('operation:failed', operationId, operation.error);
        throw error;
      }
    }

    this.emit('operation:completed', operationId, operation.result);
    return operationId;
  }

  /**
   * 批量同步到多个环境
   */
  async syncToMultipleEnvironments(
    environmentNames: string[],
    options: {
      languages?: string[];
      namespaces?: string[];
      dryRun?: boolean;
      user?: string;
      description?: string;
    } = {}
  ): Promise<string[]> {
    const operationIds: string[] = [];

    if (options.dryRun) {
      // 干运行模式：并行执行
      const promises = environmentNames.map(env => 
        this.syncToEnvironment(env, { ...options, dryRun: true })
      );
      operationIds.push(...await Promise.all(promises));
    } else {
      // 生产模式：串行执行以避免冲突
      for (const envName of environmentNames) {
        const operationId = await this.syncToEnvironment(envName, options);
        operationIds.push(operationId);
      }
    }

    return operationIds;
  }

  /**
   * 部署翻译到生产环境
   */
  async deployToProduction(
    options: {
      environment?: string;
      validateBeforeDeploy?: boolean;
      backupBeforeDeploy?: boolean;
      rollbackIfFailed?: boolean;
      user?: string;
      description?: string;
      tags?: string[];
    } = {}
  ): Promise<string> {
    const environmentName = options.environment || 'production';
    const environment = this.configs.get(environmentName);
    
    if (!environment) {
      throw new Error(`Environment ${environmentName} not found`);
    }

    if (environment.type !== 'production') {
      throw new Error(`Environment ${environmentName} is not a production environment`);
    }

    const deploymentId = this.generateDeploymentId();
    const startTime = Date.now();

    this.emit('deployment:started', environmentName, deploymentId);

    let backupId: string | undefined;
    
    try {
      // 部署前备份
      if (options.backupBeforeDeploy || environment.features.autoBackup) {
        backupId = await this.createBackup(environmentName, 'Pre-deployment backup');
      }

      // 部署前验证
      if (options.validateBeforeDeploy || environment.features.notificationEnabled) {
        const validationResult = await this.validateEnvironment(environmentName);
        if (!validationResult.isValid) {
          throw new Error(`Pre-deployment validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // 执行部署
      const deploymentResult = await this.performDeployment(environment, deploymentId, options);

      // 验证部署结果
      const verificationResult = await this.verifyDeployment(environmentName, deploymentResult);
      
      if (!verificationResult.success) {
        if (options.rollbackIfFailed || environment.features.rollbackEnabled) {
          await this.rollbackToBackup(environmentName, backupId!);
          throw new Error(`Deployment verification failed, rolled back: ${verificationResult.errors.join(', ')}`);
        }
      }

      // 记录部署历史
      this.deploymentHistory.push(deploymentResult);

      this.emit('deployment:completed', environmentName, deploymentResult);
      
      return deploymentId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 自动回滚
      if ((options.rollbackIfFailed || environment.features.rollbackEnabled) && backupId) {
        try {
          await this.rollbackToBackup(environmentName, backupId);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      this.emit('deployment:failed', environmentName, deploymentId, errorMessage);
      throw error;
    }
  }

  /**
   * 回滚到之前的部署
   */
  async rollbackToDeployment(
    environmentName: string,
    targetDeploymentId: string,
    options: {
      reason?: string;
      user?: string;
      confirmRollback?: boolean;
    } = {}
  ): Promise<RollbackResult> {
    if (!options.confirmRollback) {
      throw new Error('Rollback requires explicit confirmation');
    }

    const environment = this.configs.get(environmentName);
    if (!environment) {
      throw new Error(`Environment ${environmentName} not found`);
    }

    if (!environment.features.rollbackEnabled) {
      throw new Error(`Rollback is not enabled for environment ${environmentName}`);
    }

    const rollbackResult: RollbackResult = {
      success: false,
      rolledBackFiles: 0,
      errors: [],
      timestamp: Date.now(),
      environment: environmentName
    };

    try {
      this.emit('rollback:started', environmentName, targetDeploymentId);

      // 找到目标部署
      const targetDeployment = this.deploymentHistory.find(d => d.deploymentId === targetDeploymentId);
      if (!targetDeployment) {
        throw new Error(`Deployment ${targetDeploymentId} not found`);
      }

      // 执行回滚
      const rollbackFiles = await this.getDeploymentFiles(environmentName, targetDeploymentId);
      
      let rolledBackFiles = 0;
      const errors: string[] = [];

      for (const file of rollbackFiles) {
        try {
          await this.rollbackFile(environment, file);
          rolledBackFiles++;
          this.emit('file:rollback', file, environmentName);
        } catch (error) {
          errors.push(`Failed to rollback ${file.path}: ${error}`);
        }
      }

      rollbackResult.success = errors.length === 0;
      rollbackResult.rolledBackFiles = rolledBackFiles;
      rollbackResult.errors = errors;
      rollbackResult.previousDeploymentId = targetDeploymentId;

      this.emit('rollback:completed', environmentName, rollbackResult);

      return rollbackResult;

    } catch (error) {
      rollbackResult.errors.push(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 创建环境备份
   */
  async createBackup(
    environmentName: string,
    description: string,
    options: {
      includeCache?: boolean;
      compression?: boolean;
    } = {}
  ): Promise<string> {
    const environment = this.configs.get(environmentName);
    if (!environment) {
      throw new Error(`Environment ${environmentName} not found`);
    }

    const backupId = this.generateBackupId();
    const backupDir = path.join(this.tempDir, `backup_${backupId}`);

    try {
      // 获取当前环境的文件
      const files = await this.getEnvironmentFiles(environmentName);
      
      // 创建备份目录
      fs.mkdirSync(backupDir, { recursive: true });

      // 复制文件
      for (const file of files) {
        const sourcePath = path.join(environment.deploymentPath, file.relativePath);
        const backupPath = path.join(backupDir, file.relativePath);
        
        // 确保目录存在
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        
        // 复制文件
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, backupPath);
        }
      }

      // 保存备份元数据
      const metadata = {
        id: backupId,
        environment: environmentName,
        description,
        timestamp: Date.now(),
        files: files,
        compression: options.compression
      };

      fs.writeFileSync(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      return backupId;

    } catch (error) {
      // 清理失败的备份
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true });
      }
      throw error;
    }
  }

  /**
   * 获取同步操作状态
   */
  getOperationStatus(operationId: string): SyncOperation | null {
    return this.activeOperations.get(operationId) || null;
  }

  /**
   * 列出所有操作
   */
  listOperations(filters?: {
    status?: string;
    type?: string;
    environment?: string;
    user?: string;
  }): SyncOperation[] {
    let operations = Array.from(this.activeOperations.values());

    if (filters) {
      operations = operations.filter(op => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === 'environment') {
            return op.metadata.environments.includes(value);
          }
          if (key === 'user') {
            return op.metadata.user === value;
          }
          return (op as any)[key] === value;
        });
      });
    }

    return operations.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  }

  /**
   * 获取部署历史
   */
  getDeploymentHistory(environmentName?: string, limit: number = 50): DeploymentResult[] {
    let history = this.deploymentHistory;

    if (environmentName) {
      history = history.filter(d => d.environment === environmentName);
    }

    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 验证环境配置
   */
  async validateEnvironment(environmentName: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingFiles: string[];
  }> {
    const environment = this.configs.get(environmentName);
    if (!environment) {
      return {
        isValid: false,
        errors: [`Environment ${environmentName} not found`],
        warnings: [],
        missingFiles: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFiles: string[] = [];

    // 检查环境配置
    if (!environment.baseUrl) {
      errors.push('baseUrl is required');
    }

    if (!environment.translationPath) {
      errors.push('translationPath is required');
    }

    // 检查部署路径是否存在
    if (!fs.existsSync(environment.deploymentPath)) {
      warnings.push('deploymentPath does not exist, will be created during deployment');
    }

    // 检查源文件
    const expectedFiles = await this.getExpectedFiles();
    const existingFiles = await this.getEnvironmentFiles(environmentName);

    expectedFiles.forEach(expected => {
      if (!existingFiles.find(f => f.relativePath === expected)) {
        missingFiles.push(expected);
      }
    });

    if (missingFiles.length > 0) {
      warnings.push(`${missingFiles.length} expected files are missing`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFiles
    };
  }

  /**
   * 清理临时文件
   */
  cleanupTempFiles(olderThanDays: number = 7): number {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let cleanedFiles = 0;

    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.rmSync(filePath, { recursive: true });
          cleanedFiles++;
        }
      }
    }

    return cleanedFiles;
  }

  /**
   * 获取同步统计信息
   */
  getSyncStatistics(days: number = 30): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    totalFilesSynced: number;
    popularEnvironments: { name: string; deployments: number }[];
    syncFrequency: { date: string; operations: number }[];
  } {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentOperations = this.listOperations().filter(op => 
      op.startTime && op.startTime >= cutoffDate
    );

    const recentDeployments = this.deploymentHistory.filter(d => d.timestamp >= cutoffDate);

    const successfulOperations = recentOperations.filter(op => op.status === 'completed').length;
    const failedOperations = recentOperations.filter(op => op.status === 'failed').length;
    
    const totalDuration = recentOperations.reduce((sum, op) => {
      if (op.startTime && op.endTime) {
        return sum + (op.endTime - op.startTime);
      }
      return sum;
    }, 0);

    const environmentCounts: { [name: string]: number } = {};
    const dailyActivity: { [date: string]: number } = {};

    recentOperations.forEach(op => {
      op.metadata.environments.forEach(env => {
        environmentCounts[env] = (environmentCounts[env] || 0) + 1;
      });

      if (op.startTime) {
        const date = new Date(op.startTime).toISOString().split('T')[0];
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      }
    });

    return {
      totalOperations: recentOperations.length,
      successfulOperations,
      failedOperations,
      averageDuration: recentOperations.length > 0 ? totalDuration / recentOperations.length : 0,
      totalFilesSynced: recentOperations.reduce((sum, op) => sum + op.metadata.files.length, 0),
      popularEnvironments: Object.entries(environmentCounts)
        .map(([name, deployments]) => ({ name, deployments }))
        .sort((a, b) => b.deployments - a.deployments),
      syncFrequency: Object.entries(dailyActivity)
        .map(([date, operations]) => ({ date, operations }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  // 私有方法

  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveConfig(): void {
    const configPath = path.join(this.basePath, 'sync-config.json');
    const config = {
      environments: Array.from(this.configs.entries())
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private async getFilesToSync(options: any): Promise<SyncFile[]> {
    const languages = options.languages || ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
    const namespaces = options.namespaces || ['common', 'auth', 'lottery', 'wallet', 'referral', 'error'];
    
    const files: SyncFile[] = [];

    for (const lang of languages) {
      for (const ns of namespaces) {
        const filePath = path.join(this.basePath, lang, `${ns}.json`);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          files.push({
            path: filePath,
            relativePath: path.join(lang, `${ns}.json`),
            locale: lang,
            namespace: ns,
            size: stats.size,
            lastModified: stats.mtime.getTime(),
            checksum: this.calculateChecksum(content),
            action: 'modified'
          });
        }
      }
    }

    return files;
  }

  private async performDryRunSync(operation: SyncOperation): Promise<any> {
    const result = {
      dryRun: true,
      filesToSync: operation.metadata.files.length,
      estimatedDuration: operation.metadata.files.length * 100, // 简化估算
      conflicts: [],
      warnings: []
    };

    return result;
  }

  private async performSync(operation: SyncOperation, environment: EnvironmentConfig): Promise<any> {
    operation.status = 'running';
    operation.startTime = Date.now();

    let syncedFiles = 0;
    const errors: string[] = [];

    for (let i = 0; i < operation.metadata.files.length; i++) {
      const file = operation.metadata.files[i];
      operation.progress = Math.round((i / operation.metadata.files.length) * 100);

      try {
        await this.syncFile(environment, file);
        syncedFiles++;
        this.emit('file:sync', file, environment.name);
      } catch (error) {
        errors.push(`Failed to sync ${file.path}: ${error}`);
      }
    }

    operation.endTime = Date.now();

    return {
      syncedFiles,
      errors,
      duration: operation.endTime - (operation.startTime || 0)
    };
  }

  private async syncFile(environment: EnvironmentConfig, file: SyncFile): Promise<void> {
    const targetPath = path.join(environment.deploymentPath, file.relativePath);
    
    // 确保目录存在
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    // 复制文件
    fs.copyFileSync(file.path, targetPath);
  }

  private async performDeployment(
    environment: EnvironmentConfig,
    deploymentId: string,
    options: any
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    const files = await this.getFilesToSync({});
    
    let deployedFiles = 0;
    let skippedFiles = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      try {
        await this.deployFile(environment, file, deploymentId);
        deployedFiles++;
      } catch (error) {
        errors.push(`Failed to deploy ${file.path}: ${error}`);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const result: DeploymentResult = {
      success: errors.length === 0,
      deployedFiles,
      skippedFiles,
      errors,
      warnings,
      deploymentId,
      timestamp: endTime,
      environment: environment.name,
      duration
    };

    return result;
  }

  private async deployFile(environment: EnvironmentConfig, file: SyncFile, deploymentId: string): Promise<void> {
    const targetPath = path.join(environment.deploymentPath, file.relativePath);
    
    // 部署前备份
    if (fs.existsSync(targetPath)) {
      const backupPath = `${targetPath}.backup.${deploymentId}`;
      fs.copyFileSync(targetPath, backupPath);
    }

    // 部署文件
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(file.path, targetPath);
  }

  private async verifyDeployment(environmentName: string, deployment: DeploymentResult): Promise<any> {
    // 简化的部署验证
    return {
      success: deployment.success,
      errors: deployment.errors,
      warnings: deployment.warnings
    };
  }

  private async rollbackFile(environment: EnvironmentConfig, file: SyncFile): Promise<void> {
    const currentPath = path.join(environment.deploymentPath, file.relativePath);
    const backupPath = `${currentPath}.backup`;
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, currentPath);
    }
  }

  private async getDeploymentFiles(environmentName: string, deploymentId: string): Promise<SyncFile[]> {
    // 简化的实现
    return await this.getFilesToSync({});
  }

  private async getEnvironmentFiles(environmentName: string): Promise<SyncFile[]> {
    const environment = this.configs.get(environmentName);
    if (!environment) return [];

    // 简化实现 - 实际中需要从环境部署路径读取文件
    return await this.getFilesToSync({});
  }

  private async getExpectedFiles(): Promise<string[]> {
    const languages = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
    const namespaces = ['common', 'auth', 'lottery', 'wallet', 'referral', 'error'];
    
    const files: string[] = [];
    for (const lang of languages) {
      for (const ns of namespaces) {
        files.push(path.join(lang, `${ns}.json`));
      }
    }
    
    return files;
  }

  private calculateChecksum(content: string): string {
    return require('crypto').createHash('md5').update(content).digest('hex');
  }

  private async validateBeforeDeploy(environmentName: string): Promise<boolean> {
    const validation = await this.validateEnvironment(environmentName);
    return validation.isValid;
  }

  private async rollbackToBackup(environmentName: string, backupId: string): Promise<void> {
    const backupDir = path.join(this.tempDir, `backup_${backupId}`);
    const environment = this.configs.get(environmentName);
    
    if (!environment || !fs.existsSync(backupDir)) {
      throw new Error('Backup not found');
    }

    // 从备份恢复文件
    const backupFiles = fs.readdirSync(backupDir, { recursive: true });
    
    for (const file of backupFiles) {
      if (file.endsWith('.json')) {
        const sourcePath = path.join(backupDir, file);
        const targetPath = path.join(environment.deploymentPath, file);
        
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

export const translationSyncTool = new TranslationSyncTool();