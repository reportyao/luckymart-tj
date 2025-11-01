import React, { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { detectLanguage } from '@/utils/mobile-text-optimization';
import type { Language } from '@/utils/mobile-text-optimization';
/**
 * 通用移动端文本组件
 * 支持多语言响应式显示和智能文本优化
 */

'use client';


export interface MobileTextProps {}
  /** 翻译键或直接文本 */
  text: string;
  /** 文本上下文，用于优化策略 */
  context?: 'title' | 'button' | 'label' | 'status' | 'content' | 'navigation' | 'form' | 'product';
  /** 自定义CSS类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示翻译键（调试用） */
  showTranslationKey?: boolean;
  /** 最大字符数限制 */
  maxChars?: number;
  /** 是否启用智能截断 */
  enableTruncation?: boolean;
  /** 自定义截断后缀 */
  ellipsis?: string;
  /** 是否显示完整文本的提示 */
  showTooltip?: boolean;
  /** 容器元素类型 */
  as?: keyof JSX.IntrinsicElements;
  /** 子组件 */
  children?: ReactNode;
  /** 语言覆盖（用于特定场景） */
  language?: Language;
  /** 是否强制使用原始文本（不进行翻译） */
  raw?: boolean;
  /** 响应式配置 */
  responsive?: {}
    enabled?: boolean;
    breakpoints?: {}
      mobile?: string;
      tablet?: string;
      desktop?: string;
    };
  };
  /** 无障碍属性 */
  aria?: {}
    label?: string;
    describedBy?: string;
    role?: string;
  };


const MobileText = React.forwardRef<HTMLElement, MobileTextProps>(;
  (
    {}
      text,
      context = 'content',
      className = '',
      style = {},
      showTranslationKey = false,
      maxChars,
      enableTruncation = true,
      ellipsis = '...',
      showTooltip = false,
      as: Component = 'span',
      children,
      language,
      raw = false,
      responsive = {}
        enabled: true,
        breakpoints: {}
          mobile: 'text-sm',
          tablet: 'text-base',
          desktop: 'text-lg',
        },
      },
      aria = {},
      ...props
    },
    ref
  ) => {}
    const { t, i18n } = useTranslation();
    
    // 检测当前语言
    const currentLanguage = useMemo(() => {}
      if (language) return language; {}
      const langMap: Record<string, Language> = {}
        'zh-CN': 'zh',
        'en-US': 'en',
        'ru-RU': 'ru',
        'tg-TJ': 'tg',
      };
      return langMap[i18n.language] || 'tg';
    }, [i18n.language, language]);
    
    // 获取翻译文本
    const translatedText = useMemo(() => {}
      if (raw) return text; {}
      
      // 尝试获取翻译
      const translated = t(text);
      return translated === text ? text : translated;
    }, [text, t, raw]);
    
    // 检测文本语言（仅用于非翻译文本或翻译失败时）
    const textLanguage = useMemo(() => {}
      if (language) return language; {}
      if (!raw) {}
        // 对于翻译文本，使用当前界面语言
        return currentLanguage;

      return detectLanguage(translatedText);
    }, [language, raw, currentLanguage, translatedText]);
    
    // 生成CSS类名
    const cssClasses = useMemo(() => {}
      const baseClasses = [;
        'mobile-text',
        `mobile-text--${textLanguage}`,
        `mobile-text--${context}`,
      ];
      
      // 响应式类名
      if (responsive.enabled) {}
        baseClasses.push(responsive.breakpoints?.mobile || 'text-sm');
        baseClasses.push('md:' + (responsive.breakpoints?.tablet || 'text-base'));
        baseClasses.push('lg:' + (responsive.breakpoints?.desktop || 'text-lg'));
      
      
      // 上下文特定类名
      switch (context) {}
        case 'title':
          baseClasses.push('mobile-product-title', `mobile-product-title--${textLanguage}`);
          break;
        case 'button':
          baseClasses.push('mobile-button-text', `mobile-button-text--${textLanguage}`);
          break;
        case 'label':
          baseClasses.push('mobile-form-label', `mobile-form-label--${textLanguage}`);
          break;
        case 'status':
          baseClasses.push('mobile-status-badge', `mobile-status-badge--${textLanguage}`);
          break;
        case 'navigation':
          baseClasses.push('mobile-nav-text', `mobile-nav-text--${textLanguage}`);
          break;
        case 'form':
          baseClasses.push('mobile-form-label', `mobile-form-label--${textLanguage}`);
          break;
        case 'product':
          baseClasses.push('mobile-product-meta', `mobile-product-meta--${textLanguage}`);
          break;
      
      
      // 自定义类名
      if (className) {}
        baseClasses.push(className);
      
      
      return baseClasses.join(' ');
    }, [textLanguage, context, className, responsive]);
    
    // 计算是否需要截断
    const shouldTruncate = useMemo(() => {}
      if (!enableTruncation) return false; {}
      
      const maxLength = maxChars || getDefaultMaxChars(textLanguage, context);
      return translatedText.length > maxLength;
    }, [enableTruncation, maxChars, translatedText.length, textLanguage, context]);
    
    // 截断文本
    const truncatedText = useMemo(() => {}
      if (!shouldTruncate) return translatedText; {}
      
      const maxLength = maxChars || getDefaultMaxChars(textLanguage, context);
      if (translatedText.length <= maxLength) return translatedText; {}
      
      let result = translatedText.substring(0, maxLength);
      
      // 根据语言特性进行智能截断
      if (textLanguage !== 'zh') {}
        const lastSpace = result.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.7) {}
          result = result.substring(0, lastSpace);
        
      
      
      result = result.replace(/[.,;:\s]*$/, '');
      return result + ellipsis;
    }, [shouldTruncate, translatedText, maxChars, textLanguage, context, ellipsis]);
    
    // 生成内联样式
    const customStyle = useMemo(() => {}
      const baseStyle: React.CSSProperties = {};
      
      // 根据语言特性调整
      switch (textLanguage) {}
        case 'ru':
          baseStyle.fontFamily = "'Inter', 'Segoe UI', sans-serif";
          baseStyle.WebkitFontSmoothing = 'antialiased';
          baseStyle.MozOsxFontSmoothing = 'grayscale';
          break;
        case 'tg':
          baseStyle.fontVariantNumeric = 'tabular-nums';
          baseStyle.hyphens = 'auto';
          baseStyle.WebkitHyphens = 'auto';
          baseStyle.MozHyphens = 'auto';
          break;
        case 'en':
          baseStyle.hyphens = 'auto';
          baseStyle.WebkitHyphens = 'auto';
          break;
        case 'zh':
          baseStyle.letterSpacing = '0.5px';
          break;
      
      
      // 根据上下文调整样式
      switch (context) {}
        case 'title':
          baseStyle.fontWeight = 600;
          baseStyle.color = 'inherit';
          break;
        case 'button':
          baseStyle.fontWeight = 500;
          baseStyle.textAlign = 'center';
          break;
        case 'label':
          baseStyle.fontWeight = 500;
          break;
        case 'status':
          baseStyle.fontWeight = 600;
          baseStyle.textAlign = 'center';
          baseStyle.whiteSpace = 'nowrap';
          break;
      
      
      return { ...baseStyle, ...style };
    }, [textLanguage, context, style]);
    
    // 组合最终文本
    const finalText = showTranslationKey && !raw ? `[${text}] ${truncatedText}` : truncatedText;
    
    // 渲染组件
    return (;
      <Component
        ref={ref}
        className="{cssClasses}"
        style="{customStyle}"
        title={showTooltip && shouldTruncate ? translatedText : undefined}
        aria-label={aria.label}
        aria-describedby={aria.describedBy}
        role={aria.role}
        {...props}
      >
        {children || finalText}
      </Component>
    );
  
);

MobileText.displayName = 'MobileText';

/**
 * 根据语言和上下文获取默认最大字符数
 */
function getDefaultMaxChars(language: Language, context: string): number {}
  const maxCharsMap: Record<string, Record<Language, number>> = {}
    title: {}
      zh: 20,
      en: 25,
      ru: 18,
      tg: 15,
    },
    button: {}
      zh: 8,
      en: 12,
      ru: 10,
      tg: 8,
    },
    label: {}
      zh: 15,
      en: 20,
      ru: 16,
      tg: 12,
    },
    status: {}
      zh: 6,
      en: 8,
      ru: 6,
      tg: 5,
    },
    content: {}
      zh: 50,
      en: 60,
      ru: 45,
      tg: 40,
    },
    navigation: {}
      zh: 12,
      en: 15,
      ru: 12,
      tg: 10,
    },
    form: {}
      zh: 15,
      en: 20,
      ru: 16,
      tg: 12,
    },
    product: {}
      zh: 30,
      en: 40,
      ru: 35,
      tg: 25,
    },
  };
  
  return maxCharsMap[context]?.[language] || 20;


export default MobileText;

/**
 * 便捷组件变体
 */

// 标题文本组件
export const MobileTitle: React.FC<Omit<MobileTextProps, 'context'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = (props) => {}
  const level = props.level || 3;
  return (;
    <MobileText
      {...props}
      context:"title"
      as={`h${level}` as keyof JSX.IntrinsicElements}
    />
  );
};

// 按钮文本组件
export const MobileButtonText: React.FC<Omit<MobileTextProps, 'context'>> = (props) => (;
  <MobileText {...props} context:"button" />
);

// 表单标签组件
export const MobileFormLabel: React.FC<Omit<MobileTextProps, 'context'>> = (props) => (;
  <MobileText {...props} context:"label" as="label" />
);

// 状态标签组件
export const MobileStatusBadge: React.FC<Omit<MobileTextProps, 'context'>> = (props) => (;
  <MobileText {...props} context:"status" as="span" />
);

// 导航文本组件
export const MobileNavText: React.FC<Omit<MobileTextProps, 'context'>> = (props) => (;
  <MobileText {...props} context:"navigation" />
);

// 产品文本组件
export const MobileProductText: React.FC<Omit<MobileTextProps, 'context'>> = (props) => (;
  <MobileText {...props} context:"product" />
);
