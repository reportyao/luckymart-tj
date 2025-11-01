/**
 * 移动端多语言文本优化工具函数
 * 提供文本长度检测、截断、字体大小计算等功能
 */

export type Language = 'zh' | 'en' | 'ru' | 'tg';

export interface TextMetrics {
  charCount: number;
  wordCount: number;
  estimatedWidth: number;
  estimatedHeight: number;
  isTooLong: boolean;
  recommendedTruncation: 'none' | 'single' | 'double' | 'triple';
}

export interface TextOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxChars?: number;
  fontSize?: number;
  lineHeight?: number;
  allowBreakWord?: boolean;
}

/**
 * 语言特性配置
 */
const LANGUAGE_CONFIG: Record<Language, {
  avgCharWidth: number;
  avgWordLength: number;
  compressionRatio: number;
  recommendedFontSize: number;
  lineHeight: number;
}> = {
  zh: {
    avgCharWidth: 12,
    avgWordLength: 1,
    compressionRatio: 1.0,
    recommendedFontSize: 14,
    lineHeight: 1.3,
  },
  en: {
    avgCharWidth: 8,
    avgWordLength: 5,
    compressionRatio: 1.2,
    recommendedFontSize: 13,
    lineHeight: 1.4,
  },
  ru: {
    avgCharWidth: 9,
    avgWordLength: 6,
    compressionRatio: 1.4,
    recommendedFontSize: 12,
    lineHeight: 1.3,
  },
  tg: {
    avgCharWidth: 10,
    avgWordLength: 7,
    compressionRatio: 1.6,
    recommendedFontSize: 11,
    lineHeight: 1.2,
  },
};

/**
 * 检测文本语言
 */
export function detectLanguage(text: string): Language {
  // 简单的语言检测逻辑
  const tajikPattern = /[ӣқғӯҳҷӯ]/;
  const russianPattern = /[а-яё]/i;
  const chinesePattern = /[\u4e00-\u9fff]/;
  const englishPattern = /^[a-zA-Z\s]*$/;
  
  if (tajikPattern.test(text)) return 'tg'; {
  if (russianPattern.test(text)) return 'ru'; {
  if (chinesePattern.test(text)) return 'zh'; {
  if (englishPattern.test(text)) return 'en'; {
  
  // 默认返回塔吉克语（项目默认语言）
  return 'tg';
}

/**
 * 计算文本度量指标
 */
export function calculateTextMetrics(
  text: string,
  language: Language,
  options: TextOptimizationOptions = {}
): TextMetrics {
  const config = LANGUAGE_CONFIG[language];
  const {
    maxWidth = 280,
    maxHeight = 60,
    fontSize = config.recommendedFontSize,
    lineHeight = config.lineHeight,
    maxChars = 50,
  } = options;

  // 基础文本分析
  const charCount = text.length;
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  
  // 估算文本宽度
  let estimatedWidth = 0;
  if (language === 'zh') {
    // 中文：按字符数计算
    estimatedWidth = charCount * config.avgCharWidth;
  } else if (language === 'en') {
    // 英文：按单词计算，空格考虑在内
    estimatedWidth = wordCount * config.avgWordLength * config.avgCharWidth + (wordCount - 1) * 4;
  } else {
    // 俄文和塔吉克语：按字符计算，但有额外的字符间距
    estimatedWidth = charCount * config.avgCharWidth * config.compressionRatio;
}
  
  // 估算文本高度
  const linesNeeded = Math.ceil(estimatedWidth / maxWidth) || 1;
  const estimatedHeight = linesNeeded * fontSize * lineHeight;
  
  // 判断是否过长
  const isTooLong = estimatedWidth > maxWidth || estimatedHeight > maxHeight || charCount > maxChars;
  
  // 推荐截断策略
  let recommendedTruncation: 'none' | 'single' | 'double' | 'triple' = 'none';
  if (linesNeeded > 3) {
    recommendedTruncation = 'triple';
  } else if (linesNeeded > 2) {
    recommendedTruncation = 'double';
  } else if (linesNeeded > 1 && charCount > 20) {
    recommendedTruncation = 'single';
  }
  
  return {
    charCount,
    wordCount,
    estimatedWidth,
    estimatedHeight,
    isTooLong,
    recommendedTruncation,
  };
}

/**
 * 智能文本截断
 */
export function smartTruncate(
  text: string,
  language: Language,
  maxChars: number,
  options: {
    preserveWords?: boolean;
    addEllipsis?: boolean;
  } = {}
): string {
  const { preserveWords = true, addEllipsis = true } = options;
  
  if (text.length <= maxChars) {
    return text;
}
  
  let truncated = text.substring(0, maxChars);
  
  if (preserveWords && language !== 'zh') {
    // 对于非中文，尝试在单词边界截断
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.7) {
      truncated = truncated.substring(0, lastSpace);
    }
  }
  
  if (addEllipsis) {
    truncated = truncated.replace(/[.,;:\s]*$/, '');
    truncated += '...';
  }
  
  return truncated;
}

/**
 * 获取推荐的CSS类名
 */
export function getRecommendedClasses(
  text: string,
  language: Language,
  context: 'title' | 'button' | 'label' | 'status' | 'content' = 'content'
): string[] {
  const metrics = calculateTextMetrics(text, language);
  const classes = [`mobile-text`, `mobile-text--${language}`];
  
  // 根据上下文添加特定类
  switch (context) {
    case 'title':
      classes.push('mobile-product-title', `mobile-product-title--${language}`);
      break;
    case 'button':
      classes.push('mobile-button-text', `mobile-button-text--${language}`);
      break;
    case 'label':
      classes.push('mobile-form-label', `mobile-form-label--${language}`);
      break;
    case 'status':
      classes.push('mobile-status-badge', `mobile-status-badge--${language}`);
      break;
    default:
      break;
}
  
  // 添加截断类
  if (metrics.recommendedTruncation === 'single') {
    classes.push('mobile-text--truncate');
  } else if (metrics.recommendedTruncation === 'double') {
    classes.push('mobile-text--truncate-2');
  } else if (metrics.recommendedTruncation === 'triple') {
    classes.push('mobile-text--truncate-3');
  }
  
  return classes;
}

/**
 * 获取响应式字体大小
 */
export function getResponsiveFontSize(
  language: Language,
  baseSize: number = 14,
  screenWidth: number = typeof window !== 'undefined' ? window.innerWidth : 375
): number {
  const config = LANGUAGE_CONFIG[language];
  let size = baseSize || config.recommendedFontSize;
  
  // 根据屏幕宽度调整
  if (screenWidth < 360) {
    // 超小屏幕
    size *= 0.9;
  } else if (screenWidth < 768) {
    // 小屏幕
    size *= 0.95;
  } else if (screenWidth >= 768) {
    // 平板或更大
    size *= 1.1;
}
  
  // 根据语言调整
  const languageMultiplier = {
    zh: 1.1,
    en: 1.0,
    ru: 0.9,
    tg: 0.8,
  };
  
  size *= languageMultiplier[language];
  
  // 确保最小字体大小
  return Math.max(size, 8);
}

/**
 * 检测是否需要特殊处理
 */
export function needsSpecialHandling(
  text: string,
  language: Language
): {
  needsBreakWord: boolean;
  needsHyphens: boolean;
  needsSmallerFont: boolean;
  recommendedContainer: 'sm' | 'md' | 'lg' | 'xl';
} {
  const metrics = calculateTextMetrics(text, language);
  
  // 检测是否需要强制换行
  const needsBreakWord = ['en', 'ru', 'tg'].includes(language) && metrics.wordCount > 3;
  
  // 检测是否需要连字符
  const needsHyphens = ['en', 'ru', 'tg'].includes(language);
  
  // 检测是否需要更小字体
  const needsSmallerFont = language === 'tg' && metrics.charCount > 15;
  
  // 推荐容器大小
  let recommendedContainer: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  if (metrics.charCount < 10) {
    recommendedContainer = 'sm';
  } else if (metrics.charCount < 20) {
    recommendedContainer = 'md';
  } else if (metrics.charCount < 40) {
    recommendedContainer = 'lg';
  } else {
    recommendedContainer = 'xl';
}
  
  return {
    needsBreakWord,
    needsHyphens,
    needsSmallerFont,
    recommendedContainer,
  };
}

/**
 * 生成优化的内联样式
 */
export function generateInlineStyles(
  text: string,
  language: Language,
  context: 'title' | 'button' | 'label' | 'status' | 'content' = 'content'
): React.CSSProperties {
  const config = LANGUAGE_CONFIG[language];
  const metrics = calculateTextMetrics(text, language);
  const specialHandling = needsSpecialHandling(text, language);
  const fontSize = getResponsiveFontSize(language);
  
  const styles: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: config.lineHeight,
    fontFamily: language === 'ru' ? "'Inter', 'Segoe UI', sans-serif" : 'inherit',
  };
  
  // 根据上下文调整
  switch (context) {
    case 'title':
      styles.fontWeight = 600;
      styles.marginBottom = '8px';
      break;
    case 'button':
      styles.fontWeight = 500;
      styles.textAlign = 'center';
      break;
    case 'label':
      styles.fontWeight = 500;
      styles.marginBottom = '4px';
      break;
    case 'status':
      styles.fontWeight = 600;
      styles.fontSize = `${Math.max(fontSize - 2, 8)}px`;
      break;
}
  
  // 根据语言特性添加样式
  if (specialHandling.needsBreakWord) {
    styles.wordBreak = 'break-word';
  }
  
  if (specialHandling.needsHyphens) {
    styles.hyphens = 'auto';
    styles.WebkitHyphens = 'auto';
    styles.MozHyphens = 'auto';
  }
  
  // 俄文字体渲染优化
  if (language === 'ru') {
    styles.WebkitFontSmoothing = 'antialiased';
    styles.MozOsxFontSmoothing = 'grayscale';
  }
  
  // 塔吉克语数字显示优化
  if (language === 'tg') {
    styles.fontVariantNumeric = 'tabular-nums';
  }
  
  // 如果文本过长，添加最大宽度限制
  if (metrics.isTooLong) {
    styles.maxWidth = '100%';
    styles.overflow = 'hidden';
    styles.textOverflow = 'ellipsis';
    
    if (metrics.recommendedTruncation !== 'none') {
      styles.whiteSpace = 'nowrap';
      if (metrics.recommendedTruncation === 'double') {
        styles.whiteSpace = 'normal';
        styles.display = '-webkit-box';
        styles.WebkitLineClamp = 2;
        styles.WebkitBoxOrient = 'vertical';
      } else if (metrics.recommendedTruncation === 'triple') {
        styles.whiteSpace = 'normal';
        styles.display = '-webkit-box';
        styles.WebkitLineClamp = 3;
        styles.WebkitBoxOrient = 'vertical';
      }
    }
  }
  
  return styles;
}

/**
 * 检测设备信息
 */
export function getDeviceInfo(): {
  isMobile: boolean;
  screenWidth: number;
  isDarkMode: boolean;
  prefersReducedMotion: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      isMobile: true,
      screenWidth: 375,
      isDarkMode: false,
      prefersReducedMotion: false,
    };
}
  
  return {
    isMobile: window.innerWidth < 768,
    screenWidth: window.innerWidth,
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

/**
 * 文本优化Hook配置
 */
export interface UseTextOptimizationConfig {
  text: string;
  language: Language;
  context?: 'title' | 'button' | 'label' | 'status' | 'content';
  options?: TextOptimizationOptions;
}

/**
 * 使用文本优化的Hook配置
 */
export function createTextOptimizationHook(config: UseTextOptimizationConfig) {
  const { text, language, context = 'content', options = {} } = config;
  
  const metrics = calculateTextMetrics(text, language, options);
  const classes = getRecommendedClasses(text, language, context);
  const styles = generateInlineStyles(text, language, context);
  const specialHandling = needsSpecialHandling(text, language);
  const deviceInfo = getDeviceInfo();
  
  return {
    text,
    language,
    context,
    metrics,
    classes,
    styles,
    specialHandling,
    deviceInfo,
    shouldTruncate: metrics.isTooLong,
    truncatedText: metrics.isTooLong ? smartTruncate(text, language, options.maxChars || 20) : text,
  };
}

/**
 * 批量文本分析
 */
export function batchAnalyzeTexts(
  texts: Array<{ text: string; context?: string; language?: Language }>,
  options: TextOptimizationOptions = {}
): Array<{
  originalText: string;
  context: string;
  language: Language;
  metrics: TextMetrics;
  needsTruncation: boolean;
  recommendedClasses: string[];
  optimizedText: string;
}> {
  return texts.map(({ text, context = 'content', language }) => {
    const detectedLang = language || detectLanguage(text);
    const metrics = calculateTextMetrics(text, detectedLang, options);
    const classes = getRecommendedClasses(text, detectedLang, context as any);
    const optimizedText = metrics.isTooLong;
      ? smartTruncate(text, detectedLang, options.maxChars || 20)
      : text;
    
    return {
      originalText: text,
      context,
      language: detectedLang,
      metrics,
      needsTruncation: metrics.isTooLong,
      recommendedClasses: classes,
      optimizedText,
    };
  });
}
}}}}