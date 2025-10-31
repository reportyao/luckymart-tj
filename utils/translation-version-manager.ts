/**
 * 翻译版本管理系统
 * Translation Version Management System
 * 
 * 功能：
 * - 翻译文件的版本控制和历史管理
 * - 支持翻译变更的跟踪和回滚
 * - 提供翻译更新的冲突解决机制
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createHash } from 'crypto';

export interface TranslationVersion {
  id: string;
  file: string;
  locale: string;
  namespace: string;
  version: string;
  timestamp: number;
  author: string;
  changes: TranslationChange[];
  hash: string;
  parentHash?: string;
  metadata: VersionMetadata;
}

export interface TranslationChange {
  type: 'add' | 'modify' | 'delete' | 'rename';
  key: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VersionMetadata {
  size: number;
  keysCount: number;
  modifiedKeys: string[];
  addedKeys: string[];
  deletedKeys: string[];
  completionRate: number;
  qualityScore?: number;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'merged';
  testCoverage?: number;
}

export interface ConflictResolution {
  conflictId: string;
  key: string;
  currentValue: string;
  incomingValue: string;
  resolution: 'use_current' | 'use_incoming' | 'merge' | 'manual';
  resolvedValue?: string;
  resolvedBy: string;
  timestamp: number;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  source: string;
  head: string;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface Tag {
  name: string;
  version: string;
  message: string;
  timestamp: number;
  author: string;
  files: string[];
}

export class TranslationVersionManager {
  private versionsDir: string;
  private branchesDir: string;
  private tagsDir: string;
  private conflictsDir: string;

  constructor(private basePath: string = './src/locales') {
    this.versionsDir = path.join(basePath, '.versions');
    this.branchesDir = path.join(basePath, '.branches');
    this.conflictsDir = path.join(basePath, '.conflicts');
    this.tagsDir = path.join(basePath, '.tags');
    
    this.initializeDirectories();
  }

  private initializeDirectories(): void {
    [this.versionsDir, this.branchesDir, this.conflictsDir, this.tagsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 创建新版本
   */
  async createVersion(
    filePath: string,
    author: string,
    description: string = '',
    branchName: string = 'main'
  ): Promise<TranslationVersion> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const translationData = JSON.parse(fileContent);
    
    const locale = path.basename(path.dirname(filePath));
    const namespace = path.basename(filePath, '.json');
    
    const versionId = this.generateVersionId();
    const hash = this.calculateHash(fileContent);
    const parentHash = await this.getPreviousHash(locale, namespace, branchName);
    
    const changes = await this.calculateChanges(filePath, locale, namespace, parentHash);
    
    const version: TranslationVersion = {
      id: versionId,
      file: filePath,
      locale,
      namespace,
      version: this.incrementVersion(locale, namespace, branchName),
      timestamp: Date.now(),
      author,
      changes,
      hash,
      parentHash,
      metadata: this.extractMetadata(translationData, changes)
    };

    await this.saveVersion(version, branchName);
    
    return version;
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(
    locale: string,
    namespace: string,
    branchName: string = 'main',
    limit: number = 50
  ): Promise<TranslationVersion[]> {
    const historyFile = path.join(this.branchesDir, `${branchName}_history.json`);
    
    if (!fs.existsSync(historyFile)) {
      return [];
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    
    return history
      .filter((v: any) => v.locale === locale && v.namespace === namespace)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(
    versionId: string,
    targetPath: string,
    author: string
  ): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // 备份当前文件
    await this.backupCurrentFile(targetPath);
    
    // 恢复文件内容
    const originalContent = await this.getFileContentFromHash(version.hash);
    fs.writeFileSync(targetPath, originalContent);
    
    // 创建回滚版本记录
    await this.createRollbackVersion(version, targetPath, author);
  }

  /**
   * 检测冲突
   */
  async detectConflicts(
    currentFile: string,
    incomingFile: string
  ): Promise<ConflictResolution[]> {
    const current = JSON.parse(fs.readFileSync(currentFile, 'utf-8'));
    const incoming = JSON.parse(fs.readFileSync(incomingFile, 'utf-8'));
    
    const conflicts: ConflictResolution[] = [];
    
    // 递归比较所有键
    const allKeys = new Set([
      ...this.getAllKeys(current),
      ...this.getAllKeys(incoming)
    ]);
    
    for (const key of allKeys) {
      const currentValue = this.getValueByKey(current, key);
      const incomingValue = this.getValueByKey(incoming, key);
      
      if (currentValue !== incomingValue && 
          currentValue !== undefined && 
          incomingValue !== undefined) {
        
        conflicts.push({
          conflictId: this.generateConflictId(),
          key,
          currentValue: typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue),
          incomingValue: typeof incomingValue === 'string' ? incomingValue : JSON.stringify(incomingValue),
          resolution: 'manual',
          resolvedBy: '',
          timestamp: Date.now()
        });
      }
    }
    
    return conflicts;
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const conflictFile = path.join(this.conflictsDir, `${conflictId}.json`);
    fs.writeFileSync(conflictFile, JSON.stringify(resolution, null, 2));
    
    console.log(`Conflict ${conflictId} resolved: ${resolution.resolution}`);
  }

  /**
   * 创建分支
   */
  async createBranch(
    name: string,
    source: string = 'main',
    description: string = ''
  ): Promise<Branch> {
    const branch: Branch = {
      id: this.generateBranchId(),
      name,
      description,
      source,
      head: await this.getBranchHead(source),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false
    };

    const branchFile = path.join(this.branchesDir, `${name}.json`);
    fs.writeFileSync(branchFile, JSON.stringify(branch, null, 2));
    
    return branch;
  }

  /**
   * 合并分支
   */
  async mergeBranch(
    sourceBranch: string,
    targetBranch: string,
    author: string
  ): Promise<{ success: boolean; conflicts?: ConflictResolution[] }> {
    const sourceHead = await this.getBranchHead(sourceBranch);
    const targetHead = await this.getBranchHead(targetBranch);
    
    // 检测合并冲突
    const conflicts = await this.detectMergeConflicts(sourceBranch, targetBranch);
    
    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }
    
    // 执行合并
    await this.performMerge(sourceBranch, targetBranch, author);
    
    return { success: true };
  }

  /**
   * 创建标签
   */
  async createTag(
    name: string,
    version: string,
    message: string,
    author: string,
    files: string[] = []
  ): Promise<Tag> {
    const tag: Tag = {
      name,
      version,
      message,
      timestamp: Date.now(),
      author,
      files
    };

    const tagFile = path.join(this.tagsDir, `${name}.json`);
    fs.writeFileSync(tagFile, JSON.stringify(tag, null, 2));
    
    return tag;
  }

  /**
   * 获取差异报告
   */
  async getDiffReport(
    fromVersion: string,
    toVersion: string
  ): Promise<{
    added: string[];
    modified: string[];
    deleted: string[];
    statistics: {
      totalChanges: number;
      filesAffected: number;
      complexity: 'low' | 'medium' | 'high';
    };
  }> {
    const from = await this.getVersion(fromVersion);
    const to = await this.getVersion(toVersion);
    
    if (!from || !to) {
      throw new Error('Invalid version(s) specified');
    }
    
    const changes = to.changes.filter(change => 
      from.changes.some(c => c.key !== change.key)
    );
    
    const added = changes.filter(c => c.type === 'add').map(c => c.key);
    const modified = changes.filter(c => c.type === 'modify').map(c => c.key);
    const deleted = changes.filter(c => c.type === 'delete').map(c => c.key);
    
    const statistics = {
      totalChanges: changes.length,
      filesAffected: new Set([from.file, to.file]).size,
      complexity: changes.length > 20 ? 'high' : changes.length > 10 ? 'medium' : 'low'
    };
    
    return { added, modified, deleted, statistics };
  }

  /**
   * 验证版本完整性
   */
  async validateVersion(versionId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const version = await this.getVersion(versionId);
    if (!version) {
      return {
        isValid: false,
        errors: [`Version ${versionId} not found`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查文件是否存在
    if (!fs.existsSync(version.file)) {
      errors.push(`Source file ${version.file} not found`);
    }
    
    // 验证哈希值
    const currentHash = this.calculateHash(fs.readFileSync(version.file, 'utf-8'));
    if (currentHash !== version.hash) {
      errors.push('File hash mismatch');
    }
    
    // 检查版本号递增
    const lastVersion = await this.getLastVersion(version.locale, version.namespace);
    if (lastVersion && this.compareVersions(version.version, lastVersion.version) <= 0) {
      warnings.push('Version number not incremented');
    }
    
    // 检查变更记录
    if (version.changes.length === 0) {
      warnings.push('No changes recorded');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取版本统计信息
   */
  async getVersionStatistics(
    locale: string,
    namespace: string,
    days: number = 30
  ): Promise<{
    totalVersions: number;
    averageChanges: number;
    frequentAuthors: { author: string; count: number }[];
    changeTypes: { type: string; count: number }[];
    activity: { date: string; changes: number }[];
  }> {
    const history = await this.getVersionHistory(locale, namespace, 'main', 1000);
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const recentVersions = history.filter(v => v.timestamp >= cutoffDate);
    
    const authorCounts: { [author: string]: number } = {};
    const changeTypeCounts: { [type: string]: number } = {};
    const dailyActivity: { [date: string]: number } = {};
    
    let totalChanges = 0;
    
    for (const version of recentVersions) {
      totalChanges += version.changes.length;
      
      authorCounts[version.author] = (authorCounts[version.author] || 0) + 1;
      
      for (const change of version.changes) {
        changeTypeCounts[change.type] = (changeTypeCounts[change.type] || 0) + 1;
      }
      
      const date = new Date(version.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + version.changes.length;
    }
    
    return {
      totalVersions: recentVersions.length,
      averageChanges: recentVersions.length > 0 ? totalChanges / recentVersions.length : 0,
      frequentAuthors: Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      changeTypes: Object.entries(changeTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      activity: Object.entries(dailyActivity)
        .map(([date, changes]) => ({ date, changes }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  // 私有方法

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchId(): string {
    return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async getPreviousHash(
    locale: string,
    namespace: string,
    branchName: string
  ): Promise<string | undefined> {
    const history = await this.getVersionHistory(locale, namespace, branchName, 1);
    return history.length > 0 ? history[0].hash : undefined;
  }

  private incrementVersion(
    locale: string,
    namespace: string,
    branchName: string
  ): string {
    const lastVersion = this.getLastVersionSync(locale, namespace);
    const currentVersion = lastVersion ? lastVersion.version : '0.0.0';
    const parts = currentVersion.split('.').map(Number);
    
    // 递增补丁版本号
    parts[2] = (parts[2] || 0) + 1;
    
    return parts.join('.');
  }

  private getLastVersionSync(
    locale: string,
    namespace: string
  ): TranslationVersion | null {
    const historyFile = path.join(this.branchesDir, 'main_history.json');
    
    if (!fs.existsSync(historyFile)) {
      return null;
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    const versions = history
      .filter((v: any) => v.locale === locale && v.namespace === namespace)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    
    return versions.length > 0 ? versions[0] : null;
  }

  private async getLastVersion(
    locale: string,
    namespace: string
  ): Promise<TranslationVersion | null> {
    return this.getLastVersionSync(locale, namespace);
  }

  private compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const a = p1[i] || 0;
      const b = p2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    
    return 0;
  }

  private async calculateChanges(
    filePath: string,
    locale: string,
    namespace: string,
    parentHash?: string
  ): Promise<TranslationChange[]> {
    const currentContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const changes: TranslationChange[] = [];
    
    if (parentHash) {
      const parentContent = await this.getFileContentFromHash(parentHash);
      const parentData = JSON.parse(parentContent);
      
      // 比较变更
      const allKeys = new Set([
        ...this.getAllKeys(currentContent),
        ...this.getAllKeys(parentData)
      ]);
      
      for (const key of allKeys) {
        const currentValue = this.getValueByKey(currentContent, key);
        const parentValue = this.getValueByKey(parentData, key);
        
        if (parentValue === undefined && currentValue !== undefined) {
          changes.push({
            type: 'add',
            key,
            newValue: typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue),
            severity: 'medium'
          });
        } else if (parentValue !== undefined && currentValue === undefined) {
          changes.push({
            type: 'delete',
            key,
            oldValue: typeof parentValue === 'string' ? parentValue : JSON.stringify(parentValue),
            severity: 'high'
          });
        } else if (JSON.stringify(parentValue) !== JSON.stringify(currentValue)) {
          changes.push({
            type: 'modify',
            key,
            oldValue: typeof parentValue === 'string' ? parentValue : JSON.stringify(parentValue),
            newValue: typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue),
            severity: 'medium'
          });
        }
      }
    } else {
      // 首次创建版本，所有键都是新增
      const keys = this.getAllKeys(currentContent);
      for (const key of keys) {
        const value = this.getValueByKey(currentContent, key);
        changes.push({
          type: 'add',
          key,
          newValue: typeof value === 'string' ? value : JSON.stringify(value),
          severity: 'low'
        });
      }
    }
    
    return changes;
  }

  private extractMetadata(
    data: any,
    changes: TranslationChange[]
  ): VersionMetadata {
    const allKeys = this.getAllKeys(data);
    const modifiedKeys = changes.filter(c => c.type === 'modify').map(c => c.key);
    const addedKeys = changes.filter(c => c.type === 'add').map(c => c.key);
    const deletedKeys = changes.filter(c => c.type === 'delete').map(c => c.key);
    
    const completionRate = 100; // 简化实现
    
    return {
      size: JSON.stringify(data).length,
      keysCount: allKeys.length,
      modifiedKeys,
      addedKeys,
      deletedKeys,
      completionRate,
      reviewStatus: 'pending'
    };
  }

  private async saveVersion(version: TranslationVersion, branchName: string): Promise<void> {
    const versionFile = path.join(this.versionsDir, `${version.id}.json`);
    fs.writeFileSync(versionFile, JSON.stringify(version, null, 2));
    
    // 更新分支历史
    const historyFile = path.join(this.branchesDir, `${branchName}_history.json`);
    let history: TranslationVersion[] = [];
    
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
    
    history.push(version);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }

  private async getVersion(versionId: string): Promise<TranslationVersion | null> {
    const versionFile = path.join(this.versionsDir, `${versionId}.json`);
    
    if (!fs.existsSync(versionFile)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
  }

  private async getFileContentFromHash(hash: string): Promise<string> {
    const contentFile = path.join(this.versionsDir, `content_${hash}.json`);
    
    if (fs.existsSync(contentFile)) {
      const stored = JSON.parse(fs.readFileSync(contentFile, 'utf-8'));
      return stored.content;
    }
    
    throw new Error(`Content for hash ${hash} not found`);
  }

  private async backupCurrentFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`Backed up current file to ${backupPath}`);
    }
  }

  private async createRollbackVersion(
    originalVersion: TranslationVersion,
    targetPath: string,
    author: string
  ): Promise<void> {
    const rollbackChanges: TranslationChange[] = [{
      type: 'modify',
      key: 'rollback',
      description: `Rollback to version ${originalVersion.id}`,
      severity: 'high'
    }];
    
    const rollbackVersion: TranslationVersion = {
      ...originalVersion,
      id: this.generateVersionId(),
      timestamp: Date.now(),
      author,
      changes: rollbackChanges,
      metadata: {
        ...originalVersion.metadata,
        reviewStatus: 'approved'
      }
    };
    
    await this.saveVersion(rollbackVersion, 'main');
  }

  private getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private getValueByKey(obj: any, key: string): any {
    const parts = key.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private async detectMergeConflicts(
    sourceBranch: string,
    targetBranch: string
  ): Promise<ConflictResolution[]> {
    // 简化的冲突检测实现
    // 实际实现中需要比较两个分支的所有文件
    return [];
  }

  private async performMerge(
    sourceBranch: string,
    targetBranch: string,
    author: string
  ): Promise<void> {
    // 简化的合并实现
    // 实际实现中需要执行文件合并操作
    console.log(`Merging ${sourceBranch} into ${targetBranch} by ${author}`);
  }

  private async getBranchHead(branchName: string): Promise<string> {
    const branchFile = path.join(this.branchesDir, `${branchName}.json`);
    
    if (!fs.existsSync(branchFile)) {
      return 'main'; // 默认分支
    }
    
    const branch = JSON.parse(fs.readFileSync(branchFile, 'utf-8'));
    return branch.head;
  }
}

export const translationVersionManager = new TranslationVersionManager();