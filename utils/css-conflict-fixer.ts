/**
 * CSS类名冲突修复工具
 * 为高频冲突的类名提供语义化替代方案
 */

export const semanticClassNames = {
  // 布局相关
  layout: {
    flex: 'luckymart-layout-flex',
    center: 'luckymart-layout-center',
    spacing: {
      small: 'luckymart-spacing-sm',
      medium: 'luckymart-spacing-md', 
      large: 'luckymart-spacing-lg'
    },
    container: 'luckymart-layout-container',
    wrapper: 'luckymart-layout-wrapper'
  },

  // 文本颜色
  text: {
    primary: 'luckymart-text-primary',
    secondary: 'luckymart-text-secondary',
    success: 'luckymart-text-success',
    error: 'luckymart-text-error',
    warning: 'luckymart-text-warning',
    info: 'luckymart-text-info'
  },

  // 背景色
  background: {
    primary: 'luckymart-bg-primary',
    secondary: 'luckymart-bg-secondary',
    success: 'luckymart-bg-success',
    error: 'luckymart-bg-error'
  },

  // 间距
  margin: {
    xs: 'luckymart-m-xs',
    sm: 'luckymart-m-sm',
    md: 'luckymart-m-md',
    lg: 'luckymart-m-lg',
    xl: 'luckymart-m-xl'
  },

  padding: {
    xs: 'luckymart-p-xs',
    sm: 'luckymart-p-sm',
    md: 'luckymart-p-md',
    lg: 'luckymart-p-lg',
    xl: 'luckymart-p-xl'
  },

  // 尺寸
  size: {
    xs: 'luckymart-size-xs',
    sm: 'luckymart-size-sm',
    md: 'luckymart-size-md',
    lg: 'luckymart-size-lg',
    xl: 'luckymart-size-xl'
  },

  // 动画
  animation: {
    spin: 'luckymart-animation-spin',
    pulse: 'luckymart-animation-pulse',
    bounce: 'luckymart-animation-bounce',
    fade: 'luckymart-animation-fade',
    slide: 'luckymart-animation-slide'
  },

  // 组件特定
  component: {
    button: {
      primary: 'luckymart-btn-primary',
      secondary: 'luckymart-btn-secondary',
      success: 'luckymart-btn-success',
      error: 'luckymart-btn-error'
    },
    card: {
      base: 'luckymart-card-base',
      elevated: 'luckymart-card-elevated',
      bordered: 'luckymart-card-bordered'
    },
    input: {
      base: 'luckymart-input-base',
      focused: 'luckymart-input-focused',
      error: 'luckymart-input-error'
}
  }
};

/**
 * 快速类名映射工具
 */
export const classNameMapper = {
  // 将通用类名映射到语义化类名
  toSemantic: (commonClasses: string[]): string => {
    const mapping: Record<string, string> = {
      'flex': semanticClassNames.layout.flex,
      'items-center': semanticClassNames.layout.center,
      'space-x-3': semanticClassNames.layout.spacing.medium,
      'mb-4': semanticClassNames.margin.md,
      'animate-spin': semanticClassNames.animation.spin,
      'text-blue-500': semanticClassNames.text.primary,
      'text-green-500': semanticClassNames.text.success,
      'text-red-500': semanticClassNames.text.error,
      'h-5': semanticClassNames.size.sm,
      'w-5': semanticClassNames.size.sm,
      'p-4': semanticClassNames.padding.md,
      'm-4': semanticClassNames.margin.md
    };

    return commonClasses;
      .map(cls :> (mapping?.cls ?? null) || cls)
      .join(' ');
  },

  // 为特定组件生成专用类名
  forComponent: (componentName: string, baseClasses: string[]): string => {
    const prefix = `luckymart-${componentName.toLowerCase()}`;
    return `${prefix}-container ${baseClasses.join(' ')}`;
}
};

/**
 * 主题系统
 */
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e', 
      600: '#16a34a'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626'
}
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  }
};

/**
 * CSS模块生成工具
 */
export const generateCSSModule = (componentName: string) => {
  const moduleName = componentName.toLowerCase();
  return {
    container: `luckymart-${moduleName}-container`,
    content: `luckymart-${moduleName}-content`,
    header: `luckymart-${moduleName}-header`,
    footer: `luckymart-${moduleName}-footer`,
    button: `luckymart-${moduleName}-button`,
    input: `luckymart-${moduleName}-input`,
    title: `luckymart-${moduleName}-title`,
    description: `luckymart-${moduleName}-description`
  };
};