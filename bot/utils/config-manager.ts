/**
 * 配置管理和热更新系统
 * 支持动态配置更新、验证、备份和回滚
 */

import { EventEmitter } from 'events';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

export interface ConfigSchema {
  [key: string]: ConfigProperty;
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  validation?: ValidationRule[];
  description?: string;
  sensitive?: boolean; // 是否为敏感信息
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'required' | 'enum' | 'custom';
  value?: any;
  message?: string;
  customValidator?: (value: any) => boolean | string;
}

export interface ConfigBackup {
  id: string;
  timestamp: string;
  config: Record<string, any>;
  version: string;
  metadata: {
    user?: string;
    reason?: string;
    checksum: string;
  };
}

export interface ConfigChange {
  id: string;
  timestamp: string;
  type: 'add' | 'modify' | 'delete';
  key: string;
  oldValue?: any;
  newValue?: any;
  user?: string;
  reason?: string;
}

export class ConfigManager extends EventEmitter {
  private config: Record<string, any> = {};
  private schema: ConfigSchema = {};
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private backups: ConfigBackup[] = [];
  private changeHistory: ConfigChange[] = [];
  private maxBackups = 50;
  private maxHistory = 1000;
  private configPath: string;
  private schemaPath: string;
  private isLoaded = false;
  private lastLoadTime?: Date;

  constructor(configDir: string = './config') {
    super();
    this.configPath = path.join(configDir, 'config.json');
    this.schemaPath = path.join(configDir, 'schema.json');

    this.loadConfig();
  }

  // 加载配置
  private async loadConfig(): Promise<void> {
    try {
      // 加载配置架构
      await this.loadSchema();

      // 加载配置文件
      await this.loadConfigFile();

      // 启动文件监控
      this.startWatching();

      this.isLoaded = true;
      this.lastLoadTime = new Date();

      logger.info('Configuration loaded successfully', {
        configPath: this.configPath,
        schemaPath: this.schemaPath,
        keysCount: Object.keys(this.config).length
      });

      this.emit('config:loaded', this.config);

    } catch (error) {
      logger.error('Failed to load configuration', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 加载配置架构
  private async loadSchema(): Promise<void> {
    try {
      if (fs.existsSync(this.schemaPath)) {
        const schemaData = await fs.promises.readFile(this.schemaPath, 'utf8');
        this.schema = JSON.parse(schemaData);
        logger.debug('Config schema loaded', { 
          propertiesCount: Object.keys(this.schema).length 
        });
      } else {
        logger.warn('Config schema file not found, using default schema');
        this.schema = this.getDefaultSchema();
      }
    } catch (error) {
      logger.error('Failed to load config schema', { 
        error: (error as Error).message 
      }, error as Error);
      this.schema = this.getDefaultSchema();
    }
  }

  // 加载配置文件
  private async loadConfigFile(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = await fs.promises.readFile(this.configPath, 'utf8');
        const parsedConfig = JSON.parse(configData);

        // 验证配置
        const validationResult = this.validateConfig(parsedConfig);
        if (!validationResult.isValid) {
          throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
        }

        this.config = this.mergeWithDefaults(parsedConfig);
        
        // 保存备份
        await this.createBackup('loaded', 'Configuration loaded from file');

        logger.info('Configuration file loaded and validated');

      } else {
        logger.info('Config file not found, using default configuration');
        this.config = this.getDefaultConfig();
        await this.saveConfig();
      }
    } catch (error) {
      logger.error('Failed to load config file', { 
        error: (error as Error).message 
      }, error as Error);
      
      // 使用默认配置
      this.config = this.getDefaultConfig();
      await this.saveConfig();
    }
  }

  // 验证配置
  private validateConfig(config: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证必需字段
    for (const [key, property] of Object.entries(this.schema)) {
      if (property.required && !(key in config)) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      if (key in config) {
        const validationErrors = this.validateProperty(key, config[key], property);
        errors.push(...validationErrors);
      }
    }

    // 检查未知字段
    for (const key of Object.keys(config)) {
      if (!(key in this.schema)) {
        logger.warn('Unknown configuration key', { key });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证属性
  private validateProperty(key: string, value: any, property: ConfigProperty): string[] {
    const errors: string[] = [];

    // 类型检查
    if (!this.isValidType(value, property.type)) {
      errors.push(`Invalid type for ${key}: expected ${property.type}, got ${typeof value}`);
    }

    // 验证规则检查
    if (property.validation) {
      for (const rule of property.validation) {
        const ruleError = this.validateRule(key, value, rule);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    }

    return errors;
  }

  // 验证规则
  private validateRule(key: string, value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `${key} must be >= ${rule.value}`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `${key} must be <= ${rule.value}`;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message || `${key} must match pattern ${rule.value}`;
        }
        break;
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message || `${key} is required`;
        }
        break;
      case 'enum':
        if (!rule.value.includes(value)) {
          return rule.message || `${key} must be one of: ${rule.value.join(', ')}`;
        }
        break;
      case 'custom':
        if (rule.customValidator) {
          const result = rule.customValidator(value);
          if (result !== true) {
            return rule.message || result || `${key} validation failed`;
          }
        }
        break;
    }
    return null;
  }

  // 检查类型
  private isValidType(value: any, type: string): boolean {
    switch (type) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      default: return true;
    }
  }

  // 合并默认值
  private mergeWithDefaults(config: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = { ...config };

    for (const [key, property] of Object.entries(this.schema)) {
      if (!(key in result) && property.default !== undefined) {
        result[key] = property.default;
      }
    }

    return result;
  }

  // 启动文件监控
  private startWatching(): void {
    // 监控配置文件
    if (fs.existsSync(this.configPath)) {
      const watcher = fs.watch(this.configPath, { persistent: true }, (eventType, filename) => {
        if (eventType === 'change') {
          logger.info('Config file changed, reloading...');
          this.reloadConfig().catch(error => {
            logger.error('Failed to reload config after file change', { error: error.message });
          });
        }
      });

      this.watchers.set('config', watcher);
    }

    // 监控架构文件
    if (fs.existsSync(this.schemaPath)) {
      const watcher = fs.watch(this.schemaPath, { persistent: true }, (eventType, filename) => {
        if (eventType === 'change') {
          logger.info('Config schema changed, reloading schema...');
          this.reloadSchema().catch(error => {
            logger.error('Failed to reload schema after file change', { error: error.message });
          });
        }
      });

      this.watchers.set('schema', watcher);
    }

    logger.debug('File watchers started');
  }

  // 重新加载配置
  public async reloadConfig(): Promise<void> {
    logger.info('Reloading configuration...');

    const oldConfig = { ...this.config };
    
    try {
      await this.loadConfigFile();
      
      // 比较变化
      const changes = this.detectChanges(oldConfig, this.config);
      if (changes.length > 0) {
        logger.info('Configuration changed', { changes });
        this.emit('config:changed', { 
          oldConfig, 
          newConfig: this.config, 
          changes 
        });
      }

    } catch (error) {
      logger.error('Failed to reload configuration', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  // 重新加载架构
  private async reloadSchema(): Promise<void> {
    try {
      await this.loadSchema();
      logger.info('Configuration schema reloaded');
      this.emit('schema:changed', this.schema);
    } catch (error) {
      logger.error('Failed to reload schema', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  // 检测变化
  private detectChanges(oldConfig: Record<string, any>, newConfig: Record<string, any>): ConfigChange[] {
    const changes: ConfigChange[] = [];
    const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);

    for (const key of allKeys) {
      const oldValue = oldConfig[key];
      const newValue = newConfig[key];

      if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'add',
          key,
          newValue
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'delete',
          key,
          oldValue
        });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'modify',
          key,
          oldValue,
          newValue
        });
      }
    }

    return changes;
  }

  // 获取配置值
  public get<T = any>(key: string, defaultValue?: T): T | undefined {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  // 设置配置值
  public async set(key: string, value: any, options: {
    validate?: boolean;
    save?: boolean;
    createBackup?: boolean;
    user?: string;
    reason?: string;
  } = {}): Promise<void> {
    const { validate = true, save = true, createBackup = true, user, reason } = options;

    const keys = key.split('.');
    const configClone = JSON.parse(JSON.stringify(this.config));
    let current: any = configClone;

    // 导航到目标位置
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    const targetKey = keys[keys.length - 1];
    const oldValue = current[targetKey];

    // 验证值
    if (validate) {
      const property = this.schema[key];
      if (property) {
        const errors = this.validateProperty(key, value, property);
        if (errors.length > 0) {
          throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
      }
    }

    // 创建备份
    if (createBackup && JSON.stringify(oldValue) !== JSON.stringify(value)) {
      await this.createBackup('update', `Updated ${key}: ${reason || 'Configuration update'}`);
    }

    // 更新值
    current[targetKey] = value;

    // 验证整个配置
    if (validate) {
      const validationResult = this.validateConfig(configClone);
      if (!validationResult.isValid) {
        throw new Error(`Configuration validation failed after update: ${validationResult.errors.join(', ')}`);
      }
    }

    // 应用更改
    this.config = configClone;

    // 保存到文件
    if (save) {
      await this.saveConfig();
    }

    // 记录变更历史
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      this.changeHistory.push({
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: oldValue === undefined ? 'add' : (value === undefined ? 'delete' : 'modify'),
        key,
        oldValue,
        newValue: value,
        user,
        reason
      });

      // 限制历史大小
      if (this.changeHistory.length > this.maxHistory) {
        this.changeHistory = this.changeHistory.slice(-this.maxHistory);
      }
    }

    this.emit('config:set', { key, oldValue, newValue, user, reason });
    logger.info('Configuration updated', { key, oldValue, newValue, user, reason });
  }

  // 获取所有配置
  public getAll(): Record<string, any> {
    return { ...this.config };
  }

  // 更新多个配置值
  public async update(updates: Record<string, any>, options: {
    validate?: boolean;
    save?: boolean;
    createBackup?: boolean;
    user?: string;
    reason?: string;
  } = {}): Promise<void> {
    const { validate = true, save = true, createBackup = true, user, reason } = options;

    const oldConfig = { ...this.config };
    const changes: ConfigChange[] = [];

    // 创建备份
    if (createBackup) {
      await this.createBackup('batch_update', `Batch update: ${reason || 'Multiple configuration updates'}`);
    }

    // 更新各个配置项
    for (const [key, value] of Object.entries(updates)) {
      await this.set(key, value, { 
        validate, 
        save: false, // 暂不保存，批量更新最后一起保存
        createBackup: false, // 不重复创建备份
        user, 
        reason 
      });

      const oldValue = this.get(key);
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: oldValue === undefined ? 'add' : 'modify',
          key,
          oldValue,
          newValue: value,
          user,
          reason
        });
      }
    }

    // 保存配置
    if (save) {
      await this.saveConfig();
    }

    // 发送变更事件
    this.emit('config:batch_updated', { 
      oldConfig, 
      newConfig: this.config, 
      changes,
      user,
      reason 
    });

    logger.info('Configuration batch updated', { 
      changesCount: changes.length,
      user,
      reason 
    });
  }

  // 删除配置
  public async delete(key: string, options: {
    validate?: boolean;
    save?: boolean;
    createBackup?: boolean;
    user?: string;
    reason?: string;
  } = {}): Promise<void> {
    await this.set(key, undefined, options);
  }

  // 保存配置到文件
  public async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        await fs.promises.mkdir(configDir, { recursive: true });
      }

      const configData = JSON.stringify(this.config, null, 2);
      await fs.promises.writeFile(this.configPath, configData, 'utf8');

      logger.debug('Configuration saved to file');
    } catch (error) {
      logger.error('Failed to save configuration', { 
        error: (error as Error).message 
      }, error as Error);
      throw error;
    }
  }

  // 创建备份
  public async createBackup(reason: string, metadata: Record<string, any> = {}): Promise<string> {
    const backup: ConfigBackup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(this.config)),
      version: process.env.npm_package_version || '1.0.0',
      metadata: {
        ...metadata,
        checksum: this.calculateChecksum(JSON.stringify(this.config))
      }
    };

    this.backups.push(backup);

    // 限制备份数量
    if (this.backups.length > this.maxBackups) {
      this.backups = this.backups.slice(-this.maxBackups);
    }

    logger.info('Configuration backup created', {
      backupId: backup.id,
      reason,
      timestamp: backup.timestamp
    });

    this.emit('backup:created', backup);
    return backup.id;
  }

  // 计算校验和
  private calculateChecksum(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // 恢复备份
  public async restoreBackup(backupId: string, options: {
    validate?: boolean;
    save?: boolean;
    createBackup?: boolean;
    user?: string;
    reason?: string;
  } = {}): Promise<void> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const { validate = true, save = true, createBackup = true, user, reason } = options;

    const oldConfig = { ...this.config };

    // 创建当前配置的备份
    if (createBackup) {
      await this.createBackup('restore', `Restored to backup ${backupId}: ${reason || 'Configuration restore'}`);
    }

    // 验证备份配置
    if (validate) {
      const validationResult = this.validateConfig(backup.config);
      if (!validationResult.isValid) {
        throw new Error(`Backup configuration validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // 应用备份配置
    this.config = JSON.parse(JSON.stringify(backup.config));

    // 保存配置
    if (save) {
      await this.saveConfig();
    }

    // 检测变更
    const changes = this.detectChanges(oldConfig, this.config);

    this.emit('config:restored', {
      backupId,
      oldConfig,
      newConfig: this.config,
      changes,
      user,
      reason
    });

    logger.info('Configuration restored from backup', {
      backupId,
      changesCount: changes.length,
      user,
      reason
    });
  }

  // 获取备份列表
  public getBackups(): ConfigBackup[] {
    return [...this.backups].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // 获取变更历史
  public getChangeHistory(limit?: number): ConfigChange[] {
    const history = [...this.changeHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? history.slice(0, limit) : history;
  }

  // 导出配置
  public async exportConfig(format: 'json' | 'env' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.config, null, 2);
    } else if (format === 'env') {
      return this.configToEnvFormat(this.config);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  // 配置转换为环境变量格式
  private configToEnvFormat(config: Record<string, any>, prefix = ''): string {
    let envContent = '';

    for (const [key, value] of Object.entries(config)) {
      const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        envContent += this.configToEnvFormat(value, envKey);
      } else if (Array.isArray(value)) {
        envContent += `${envKey}=${JSON.stringify(value)}\n`;
      } else {
        envContent += `${envKey}=${value}\n`;
      }
    }

    return envContent;
  }

  // 获取配置模式
  public getSchema(): ConfigSchema {
    return { ...this.schema };
  }

  // 获取默认架构
  private getDefaultSchema(): ConfigSchema {
    return {
      'telegram.botToken': {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'Telegram Bot Token',
        validation: [
          { type: 'pattern', value: '^\\d+:[a-zA-Z0-9_-]{35}$', message: 'Invalid Telegram bot token format' }
        ]
      },
      'telegram.apiUrl': {
        type: 'string',
        default: 'https://api.telegram.org',
        description: 'Telegram API URL',
        validation: [
          { type: 'pattern', value: '^https?://', message: 'Must be a valid HTTP/HTTPS URL' }
        ]
      },
      'database.url': {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'Database connection URL'
      },
      'logging.level': {
        type: 'string',
        default: 'info',
        description: 'Logging level',
        validation: [
          { type: 'enum', value: ['debug', 'info', 'warn', 'error'] }
        ]
      },
      'monitoring.enabled': {
        type: 'boolean',
        default: true,
        description: 'Enable monitoring and alerts'
      },
      'faultTolerance.maxRestarts': {
        type: 'number',
        default: 10,
        description: 'Maximum restart attempts',
        validation: [
          { type: 'min', value: 1 },
          { type: 'max', value: 100 }
        ]
      },
      'alerting.webhookUrl': {
        type: 'string',
        description: 'Alert webhook URL',
        validation: [
          { type: 'pattern', value: '^https?://', message: 'Must be a valid HTTP/HTTPS URL' }
        ]
      }
    };
  }

  // 获取默认配置
  private getDefaultConfig(): Record<string, any> {
    const config: Record<string, any> = {};

    for (const [key, property] of Object.entries(this.schema)) {
      if (property.default !== undefined) {
        this.setNestedProperty(config, key, property.default);
      }
    }

    return config;
  }

  // 设置嵌套属性
  private setNestedProperty(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  // 销毁配置管理器
  public destroy(): void {
    // 停止文件监控
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    this.removeAllListeners();
    logger.info('Config manager destroyed');
  }

  // 获取配置状态
  public getStatus() {
    return {
      isLoaded: this.isLoaded,
      lastLoadTime: this.lastLoadTime,
      configPath: this.configPath,
      schemaPath: this.schemaPath,
      backupsCount: this.backups.length,
      changeHistoryCount: this.changeHistory.length,
      watchersCount: this.watchers.size
    };
  }
}

// 单例配置管理器
export const configManager = new ConfigManager();