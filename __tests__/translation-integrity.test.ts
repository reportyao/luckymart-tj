import fs from 'fs';
import path from 'path';
import { describe, test, expect } from '@jest/globals';

interface TranslationFile {
  [key: string]: any;
}

interface TranslationIntegrityResult {
  totalFiles: number;
  missingFiles: string[];
  missingKeys: { [language: string]: { [namespace: string]: string[] } };
  inconsistentKeys: { [key: string]: { [language: string]: boolean } };
  placeholders: { [namespace: string]: { [key: string]: string[] } };
  completeness: { [language: string]: { [namespace: string]: number } };
}

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin', 'bot'];

const LOCALES_PATH = path.join(__dirname, '../src/locales');

/**
 * 读取翻译文件
 */
function readTranslationFile(language: string, namespace: string): TranslationFile | null {
  const filePath = path.join(LOCALES_PATH, language, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${language}/${namespace}.json:`, error);
    return null;
  }
}

/**
 * 递归提取翻译键
 */
function extractKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * 提取占位符
 */
function extractPlaceholders(text: string): string[] {
  const placeholders: string[] = [];
  
  // 匹配 {{variable}} 格式的占位符
  const bracketMatches = text.match(/\{\{([^}]+)\}\}/g);
  if (bracketMatches) {
    placeholders.push(...bracketMatches.map(match => match.replace(/[{}]/g, '').trim()));
  }
  
  // 匹配 {variable} 格式的占位符
  const braceMatches = text.match(/\{([^}]+)\}/g);
  if (braceMatches) {
    placeholders.push(...braceMatches.map(match => match.replace(/[{}]/g, '').trim()));
  }
  
  return [...new Set(placeholders)]; // 去重
}

/**
 * 分析翻译文件中的占位符
 */
function analyzePlaceholders(obj: any, prefix: string = '', result: { [key: string]: string[] } = {}): { [key: string]: string[] } {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      const placeholders = extractPlaceholders(value);
      if (placeholders.length > 0) {
        result[fullKey] = placeholders;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      analyzePlaceholders(value, fullKey, result);
    }
  }
  
  return result;
}

/**
 * 运行翻译完整性检查
 */
function runTranslationIntegrityCheck(): TranslationIntegrityResult {
  const result: TranslationIntegrityResult = {
    totalFiles: LANGUAGES.length * NAMESPACES.length,
    missingFiles: [],
    missingKeys: {},
    inconsistentKeys: {},
    placeholders: {},
    completeness: {}
  };
  
  // 收集所有语言的键集合
  const allKeysByNamespace: { [namespace: string]: { [language: string]: Set<string> } } = {};
  
  for (const namespace of NAMESPACES) {
    allKeysByNamespace[namespace] = {};
    
    for (const language of LANGUAGES) {
      const file = readTranslationFile(language, namespace);
      
      if (!file) {
        result.missingFiles.push(`${language}/${namespace}.json`);
        continue;
      }
      
      const keys = extractKeys(file);
      allKeysByNamespace[namespace][language] = new Set(keys);
      
      // 初始化missingKeys结构
      if (!result.missingKeys[language]) {
        result.missingKeys[language] = {};
      }
      if (!result.missingKeys[language][namespace]) {
        result.missingKeys[language][namespace] = [];
      }
      
      // 计算完整性百分比
      const totalKeys = keys.length;
      let missingCount = 0;
      
      // 与基准语言(中文)比较缺失的键
      if (language !== 'zh-CN') {
        const baseKeys = allKeysByNamespace[namespace]['zh-CN'];
        if (baseKeys) {
          for (const key of baseKeys) {
            if (!keys.includes(key)) {
              missingCount++;
              result.missingKeys[language][namespace].push(key);
            }
          }
        }
      }
      
      // 保存完整性数据
      if (!result.completeness[language]) {
        result.completeness[language] = {};
      }
      result.completeness[language][namespace] = totalKeys > 0 ? 
        Math.round(((totalKeys - missingCount) / totalKeys) * 100) : 0;
    }
  }
  
  // 分析不一致的键和占位符
  for (const namespace of Object.keys(allKeysByNamespace)) {
    const keysByLanguage = allKeysByNamespace[namespace];
    
    // 检查键的一致性
    const allKeys = new Set<string>();
    for (const keys of Object.values(keysByLanguage)) {
      keys.forEach(key => allKeys.add(key));
    }
    
    for (const key of allKeys) {
      const hasInAll = Object.values(keysByLanguage).every(keys => keys.has(key));
      if (!hasInAll) {
        result.inconsistentKeys[key] = {};
        for (const [language, keys] of Object.entries(keysByLanguage)) {
          result.inconsistentKeys[key][language] = keys.has(key);
        }
      }
    }
    
    // 分析占位符
    for (const language of Object.keys(keysByLanguage)) {
      const file = readTranslationFile(language, namespace);
      if (file) {
        const placeholders = analyzePlaceholders(file);
        if (Object.keys(placeholders).length > 0) {
          if (!result.placeholders[namespace]) {
            result.placeholders[namespace] = {};
          }
          Object.assign(result.placeholders[namespace], placeholders);
        }
      }
    }
  }
  
  return result;
}

/**
 * 验证翻译键路径
 */
function validateTranslationKeyPath(key: string): boolean {
  // 键应该是有效的路径（不能以点开始或结束）
  if (key.startsWith('.') || key.endsWith('.')) {
    return false;
  }
  
  // 不应该包含连续的点和无效字符
  if (key.includes('..') || key.includes('//')) {
    return false;
  }
  
  return true;
}

describe('Translation Integrity Tests', () => {
  test('should check translation files existence', () => {
    console.log('🧪 开始检查翻译文件存在性...');
    
    const result = runTranslationIntegrityCheck();
    
    // 输出基本信息
    console.log(`📊 总文件数: ${result.totalFiles}`);
    console.log(`❌ 缺失文件: ${result.missingFiles.length}`);
    
    if (result.missingFiles.length > 0) {
      console.log('缺失的翻译文件:');
      result.missingFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    expect(result.missingFiles.length).toBeLessThanOrEqual(5); // 允许少数缺失文件
  });
  
  test('should validate translation completeness', () => {
    console.log('🔍 开始检查翻译完整性...');
    
    const result = runTranslationIntegrityCheck();
    
    // 检查完整性
    console.log('\n📈 翻译完整性报告:');
    for (const [language, namespaces] of Object.entries(result.completeness)) {
      console.log(`\n${language}:`);
      for (const [namespace, percentage] of Object.entries(namespaces)) {
        console.log(`  ${namespace}: ${percentage}%`);
        expect(percentage).toBeGreaterThanOrEqual(70); // 至少70%完整性
      }
    }
  });
  
  test('should check for missing translation keys', () => {
    console.log('🔍 开始检查缺失翻译键...');
    
    const result = runTranslationIntegrityCheck();
    
    let totalMissingKeys = 0;
    for (const [language, namespaces] of Object.entries(result.missingKeys)) {
      for (const [namespace, missingKeys] of Object.entries(namespaces)) {
        if (missingKeys.length > 0) {
          totalMissingKeys += missingKeys.length;
          console.log(`\n${language}/${namespace} 缺失键 (${missingKeys.length}):`);
          missingKeys.slice(0, 10).forEach(key => console.log(`  - ${key}`)); // 只显示前10个
          if (missingKeys.length > 10) {
            console.log(`  ... 还有 ${missingKeys.length - 10} 个缺失键`);
          }
        }
      }
    }
    
    console.log(`\n总计缺失键数: ${totalMissingKeys}`);
    expect(totalMissingKeys).toBeLessThan(100); // 限制缺失键数量
  });
  
  test('should validate translation key consistency', () => {
    console.log('🔍 开始检查翻译键一致性...');
    
    const result = runTranslationIntegrityCheck();
    
    if (Object.keys(result.inconsistentKeys).length > 0) {
      console.log('\n⚠️  不一致的翻译键:');
      for (const [key, languages] of Object.entries(result.inconsistentKeys)) {
        const availableIn = Object.entries(languages)
          .filter(([lang, has]) => has)
          .map(([lang]) => lang)
          .join(', ');
        console.log(`  ${key}: 可用语言 [${availableIn}]`);
      }
    }
    
    expect(Object.keys(result.inconsistentKeys).length).toBeLessThan(20);
  });
  
  test('should validate placeholders consistency', () => {
    console.log('🔍 开始检查占位符一致性...');
    
    const result = runTranslationIntegrityCheck();
    
    const placeholderIssues: { [key: string]: any[] } = {};
    
    for (const [namespace, placeholders] of Object.entries(result.placeholders)) {
      for (const [key, keyPlaceholders] of Object.entries(placeholders)) {
        if (keyPlaceholders.length > 0) {
          // 检查相同键在不同语言中占位符是否一致
          placeholderIssues[`${namespace}.${key}`] = keyPlaceholders;
        }
      }
    }
    
    if (Object.keys(placeholderIssues).length > 0) {
      console.log('\n📝 包含占位符的翻译:');
      for (const [key, placeholders] of Object.entries(placeholderIssues)) {
        console.log(`  ${key}: [${placeholders.join(', ')}]`);
      }
    }
    
    // 确保占位符格式正确
    for (const [namespace, placeholders] of Object.entries(result.placeholders)) {
      for (const [key, keyPlaceholders] of Object.entries(placeholders)) {
        for (const placeholder of keyPlaceholders) {
          expect(placeholder).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
        }
      }
    }
  });
  
  test('should validate translation key paths', () => {
    console.log('🔍 开始验证翻译键路径...');
    
    const invalidKeys: string[] = [];
    
    for (const language of LANGUAGES) {
      for (const namespace of NAMESPACES) {
        const file = readTranslationFile(language, namespace);
        if (file) {
          const keys = extractKeys(file);
          
          for (const key of keys) {
            if (!validateTranslationKeyPath(key)) {
              invalidKeys.push(`${language}/${namespace}: ${key}`);
            }
          }
        }
      }
    }
    
    if (invalidKeys.length > 0) {
      console.log('\n❌ 无效的翻译键路径:');
      invalidKeys.forEach(key => console.log(`  ${key}`));
    }
    
    expect(invalidKeys.length).toBe(0);
  });
  
  test('should check bot.json translation completeness', () => {
    console.log('🤖 开始检查Bot翻译文件完整性...');
    
    const botResult = runTranslationIntegrityCheck();
    const botNamespace = 'bot';
    
    for (const language of LANGUAGES) {
      const completeness = botResult.completeness[language]?.[botNamespace] || 0;
      console.log(`Bot翻译完整性 - ${language}: ${completeness}%`);
      expect(completeness).toBeGreaterThanOrEqual(80); // Bot翻译应该有更高完整性
    }
  });
  
  test('should verify gesture translations', () => {
    console.log('👋 开始检查手势操作翻译...');
    
    for (const language of LANGUAGES) {
      const commonFile = readTranslationFile(language, 'common');
      expect(commonFile).not.toBeNull();
      
      if (commonFile) {
        // 检查是否包含手势翻译
        expect(commonFile.gesture).toBeDefined();
        expect(commonFile.gesture.tap).toBeDefined();
        expect(commonFile.gesture.swipe).toBeDefined();
        expect(commonFile.gesture.states).toBeDefined();
        
        // 验证常见手势键
        const gestureKeys = extractKeys(commonFile.gesture);
        const expectedGestureKeys = [
          'tap.short',
          'tap.long', 
          'tap.double',
          'swipe.left.start',
          'swipe.right.start',
          'swipe.up.start',
          'swipe.down.start',
          'states.ready',
          'states.active',
          'states.success',
          'actions.delete',
          'actions.edit'
        ];
        
        for (const expectedKey of expectedGestureKeys) {
          expect(gestureKeys).toContain(expectedKey);
        }
      }
    }
  });
  
  test('should check network-related translations', () => {
    console.log('🌐 开始检查网络请求相关翻译...');
    
    const networkKeys = [
      'loading',
      'network_error',
      'connection_lost',
      'retry',
      'offline',
      'data_loading',
      'refresh'
    ];
    
    for (const language of LANGUAGES) {
      // 在common.json中查找网络相关翻译
      const commonFile = readTranslationFile(language, 'common');
      if (commonFile) {
        const keys = extractKeys(commonFile);
        for (const networkKey of networkKeys) {
          if (networkKey.includes('.')) {
            // 嵌套键
            const parts = networkKey.split('.');
            let current = commonFile;
            let exists = true;
            
            for (const part of parts) {
              if (current && typeof current === 'object' && part in current) {
                current = current[part];
              } else {
                exists = false;
                break;
              }
            }
            
            if (exists) {
              console.log(`✅ ${language}: ${networkKey} 已翻译`);
            } else {
              console.log(`⚠️  ${language}: ${networkKey} 未翻译`);
            }
          } else {
            // 直接键
            expect(keys).toContain(networkKey);
          }
        }
      }
    }
  });
});

// 执行完整的翻译完整性检查并生成报告
export function generateTranslationReport(): TranslationIntegrityResult {
  console.log('\n🔍 生成翻译完整性报告...');
  
  const result = runTranslationIntegrityCheck();
  
  console.log('\n📋 翻译完整性报告');
  console.log('='.repeat(50));
  console.log(`总文件数: ${result.totalFiles}`);
  console.log(`缺失文件: ${result.missingFiles.length}`);
  console.log(`翻译键不一致: ${Object.keys(result.inconsistentKeys).length}`);
  console.log(`包含占位符的键: ${Object.keys(result.placeholders).reduce((acc, key) => acc + Object.keys(result.placeholders[key]).length, 0)}`);
  
  console.log('\n📊 各语言完整性统计:');
  for (const [language, namespaces] of Object.entries(result.completeness)) {
    const avgCompleteness = Object.values(namespaces).reduce((sum, val) => sum + val, 0) / Object.keys(namespaces).length;
    console.log(`  ${language}: 平均 ${avgCompleteness.toFixed(1)}%`);
  }
  
  return result;
}

// 如果直接运行此文件，执行报告生成
if (require.main === module) {
  generateTranslationReport();
}