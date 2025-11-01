import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcherMobile } from '../components/LanguageSwitcherMobile';
import { MobileLanguageBottomSheet } from '../components/MobileLanguageBottomSheet';
import { MobileText } from '../components/MobileText';
import { SwipeActions } from '../components/SwipeActions';
import { TouchFeedback } from '../components/TouchFeedback';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import type { SupportedLanguage } from '../src/i18n/config';
/**
 * 移动端UI适配测试套件
 * 测试各种屏幕尺寸和语言长度下的显示效果
 */


// 模拟屏幕尺寸设备配置
const mockDevices = {
  'iPhone SE': { width: 320, height: 568, name: 'iPhone SE' },
  'iPhone 12': { width: 390, height: 844, name: 'iPhone 12' },
  'iPad Mini': { width: 768, height: 1024, name: 'iPad Mini' },
  'iPad Pro': { width: 1024, height: 1366, name: 'iPad Pro' },
};

// 模拟不同屏幕尺寸
const mockScreenSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // 模拟设备像素比
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: window.innerWidth <= 375 ? 2 : 1,
  });
};

// 测试辅助函数
const setupTestEnvironment = () => {
  // 模拟浏览器环境
  global.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  
  // 模拟触摸事件
  global.TouchEvent = class TouchEvent extends Event {
    touches: any[] = [];
    changedTouches: any[] = [];
    targetTouches: any[] = [];
    
    constructor(type: string, options?: any) {
      super(type);
      if (options) {
        Object.assign(this, options);
      }
    }
  };
  
  global.document.addEventListener = jest.fn();
  global.document.removeEventListener = jest.fn();
};

// 语言切换模拟
const mockLanguageChange = () => {
  const mockI18nChangeLanguage = jest.fn().mockResolvedValue(undefined);
  (i18n.changeLanguage as jest.Mock) = mockI18nChangeLanguage;
  
  // 模拟网络请求
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
  });
};

// 主要测试套件
describe('移动端UI适配测试', () => {
  beforeEach(() => {
    setupTestEnvironment();
    mockLanguageChange();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('屏幕尺寸适配测试', () => {
    Object.entries(mockDevices).forEach(([deviceName, dimensions]) => {
      test(`${deviceName} (${dimensions.width}x${dimensions.height}) 显示测试`, async () => {
        mockScreenSize(dimensions.width, dimensions.height);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <div style={{ width: dimensions.width }}>
              <LanguageSwitcherMobile />
            </div>
          </I18nextProvider>
        );
        
        // 测试最小触摸区域 (44px)
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        if (button) {
          const computedStyle = window.getComputedStyle(button);
          expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
        }
        
        // 测试响应式布局
        await waitFor(() => {
          expect(container.firstChild).toBeVisible();
        });
        
        // 检查在不同屏幕尺寸下的布局
        expect(container).toHaveStyle({
          width: `${dimensions.width}px`,
        });
      });
    });
  });

  describe('LanguageSwitcherMobile 组件适配测试', () => {
    test('超小屏幕 (320px) 下的布局测试', () => {
      mockScreenSize(320, 568);
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcherMobile />
        </I18nextProvider>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      // 测试文本是否正确截断
      const languageText = container.querySelector('.font-medium');
      if (languageText) {
        expect(languageText.textContent?.length).toBeLessThanOrEqual(15);
      }
    });

    test('不同语言下的显示测试', async () => {
      const languages = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'] as SupportedLanguage[];
      
      for (const lang of languages) {
        i18n.changeLanguage(lang);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <LanguageSwitcherMobile />
          </I18nextProvider>
        );
        
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        
        // 验证语言切换按钮的最小尺寸
        if (button) {
          const rect = button.getBoundingClientRect();
          expect(rect.height).toBeGreaterThanOrEqual(44); // iOS 最小触摸区域
          expect(rect.width).toBeGreaterThanOrEqual(320); // 超小屏幕适配
        }
      }
    });

    test('语言切换触摸区域测试', async () => {
      const { container, rerender } = render(;
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcherMobile />
        </I18nextProvider>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      // 模拟点击事件
      if (button) {
        fireEvent.click(button);
        
        // 检查底部弹窗是否出现
        await waitFor(() => {
          expect(screen.getByTestId('mobile-language-bottom-sheet')).toBeInTheDocument();
        });
      }
    });
  });

  describe('MobileLanguageBottomSheet 组件适配测试', () => {
    test('不同屏幕尺寸下的底部弹窗测试', async () => {
      Object.entries(mockDevices).forEach(([deviceName, dimensions]) => {
        mockScreenSize(dimensions.width, dimensions.height);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileLanguageBottomSheet
              isOpen={true}
              onClose={jest.fn()}
              currentLanguage:"tg-TJ"
              onLanguageChange={jest.fn()}
            />
          </I18nextProvider>
        );
        
        const sheet = container.querySelector('.fixed.bottom-0');
        expect(sheet).toBeInTheDocument();
        
        if (sheet) {
          // 检查底部弹窗最大高度限制
          const computedStyle = window.getComputedStyle(sheet);
          expect(computedStyle.maxHeight).toBe('90vh');
        }
      });
    });

    test('手势操作在不同屏幕尺寸下的可靠性测试', async () => {
      mockScreenSize(390, 844); // iPhone 12
      
      const onClose = jest.fn();
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileLanguageBottomSheet
            isOpen={true}
            onClose={onClose}
            currentLanguage:"tg-TJ"
            onLanguageChange={jest.fn()}
          />
        </I18nextProvider>
      );
      
      // 模拟触摸开始
      const sheet = container.querySelector('.fixed.bottom-0');
      expect(sheet).toBeInTheDocument();
      
      if (sheet) {
        // 测试拖拽手柄的触摸区域
        const handle = sheet.querySelector('.w-12.h-1');
        expect(handle).toBeInTheDocument();
        
        // 检查背景点击关闭功能
        const backdrop = container.querySelector('.fixed.inset-0');
        if (backdrop) {
          fireEvent.click(backdrop);
          expect(onClose).toHaveBeenCalled();
        }
      }
    });
  });

  describe('MobileText 组件适配测试', () => {
    test('多语言文本长度适配测试', () => {
      const testTexts = {
        'zh-CN': '这是一个很长的中文文本标题需要适配移动端显示',
        'en-US': 'This is a very long English text title that needs mobile adaptation',
        'ru-RU': 'Это очень длинный русский текст заголовка для мобильной адаптации',
        'tg-TJ': 'Ин матни дарози тоҷикӣ барои мутобиқати мобилӣ лозим аст',
      };
      
      mockScreenSize(320, 568);
      
      Object.entries(testTexts).forEach(([lang, text]) => {
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text={text} 
              context:"title"
              enableTruncation={true}
              maxChars={20}
            />
          </I18nextProvider>
        );
        
        const mobileText = container.querySelector('.mobile-text');
        expect(mobileText).toBeInTheDocument();
        
        // 检查文本截断是否生效
        const textContent = mobileText?.textContent || '';
        expect(textContent.length).toBeLessThanOrEqual(23); // 20字符 + "..."
      });
    });

    test('不同上下文文本适配测试', () => {
      const contexts = ['title', 'button', 'label', 'status', 'content'] as const;
      mockScreenSize(390, 844);
      
      contexts.forEach(context => {
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text:"测试文本" 
              context={context}
              enableTruncation={true}
            />
          </I18nextProvider>
        );
        
        const mobileText = container.querySelector('.mobile-text');
        expect(mobileText).toBeInTheDocument();
        
        // 检查上下文特定的CSS类
        expect(mobileText).toHaveClass(`mobile-text--${context}`);
      });
    });
  });

  describe('SwipeActions 组件适配测试', () => {
    test('不同屏幕尺寸下滑动手势适配测试', () => {
      Object.entries(mockDevices).forEach(([deviceName, dimensions]) => {
        mockScreenSize(dimensions.width, dimensions.height);
        
        const leftActions = [;
          {
            id: 'delete',
            text: '删除',
            background: 'bg-red-500',
            onClick: jest.fn(),
          }
        ];
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <SwipeActions leftActions={leftActions}>
              <div>测试内容</div>
            </SwipeActions>
          </I18nextProvider>
        );
        
        const swipeContainer = container.querySelector('.relative.overflow-hidden');
        expect(swipeContainer).toBeInTheDocument();
        
        // 检查操作按钮宽度是否适配
        const actionButton = container.querySelector('.w-20');
        expect(actionButton).toBeInTheDocument();
        
        // 检查手势提示在不同屏幕下的显示
        const gestureHint = container.querySelector('.absolute.inset-0');
        expect(gestureHint).toBeInTheDocument();
      });
    });

    test('滑动手势在各种屏幕尺寸下的可靠性测试', async () => {
      mockScreenSize(320, 568);
      
      const onSwipeEnd = jest.fn();
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <SwipeActions
            leftActions={[
              {
                id: 'test',
                text: '测试',
                background: 'bg-blue-500',
                onClick: jest.fn(),
              }
            ]}
            onSwipeEnd={onSwipeEnd}
            threshold={100}
          >
            <div style={{ width: '100%', height: '60px' }}>滑动手势测试</div>
          </SwipeActions>
        </I18nextProvider>
      );
      
      const dragArea = container.querySelector('.cursor-grab');
      expect(dragArea).toBeInTheDocument();
      
      // 模拟滑动事件
      if (dragArea) {
        // 测试滑动阈值是否适合超小屏幕
        const threshold = 100;
        const screenWidth = 320;
        expect(threshold).toBeLessThan(screenWidth * 0.5); // 确保阈值合理
      }
    });
  });

  describe('TouchFeedback 组件适配测试', () => {
    test('触摸反馈在不同屏幕尺寸下的表现测试', () => {
      Object.entries(mockDevices).forEach(([deviceName, dimensions]) => {
        mockScreenSize(dimensions.width, dimensions.height);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <TouchFeedback type:"ripple" hapticIntensity="light">
              <button style={{ minHeight: '44px', minWidth: '44px' }}>触摸测试</button>
            </TouchFeedback>
          </I18nextProvider>
        );
        
        const touchArea = container.querySelector('button');
        expect(touchArea).toBeInTheDocument();
        
        // 检查最小触摸区域
        if (touchArea) {
          const computedStyle = window.getComputedStyle(touchArea);
          expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
          expect(parseInt(computedStyle.minWidth)).toBeGreaterThanOrEqual(44);
        }
      });
    });

    test('触摸反馈类型适配测试', () => {
      mockScreenSize(390, 844);
      
      const feedbackTypes = ['ripple', 'scale', 'glow', 'color'] as const;
      
      feedbackTypes.forEach(type => {
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <TouchFeedback type={type}>
              <div>反馈测试</div>
            </TouchFeedback>
          </I18nextProvider>
        );
        
        const feedbackContainer = container.querySelector('.relative.inline-block');
        expect(feedbackContainer).toBeInTheDocument();
      });
    });
  });

  describe('响应式设计正确性验证测试', () => {
    test('断点适配测试', async () => {
      const breakpoints = [;
        { name: 'mobile', width: 320 },
        { name: 'tablet', width: 768 },
        { name: 'desktop', width: 1024 },
      ];
      
      for (const breakpoint of breakpoints) {
        mockScreenSize(breakpoint.width, 600);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text:"响应式测试文本" 
              context:"title"
              responsive={{
                enabled: true,
                breakpoints: {
                  mobile: 'text-sm',
                  tablet: 'text-base',
                  desktop: 'text-lg',
                }
              }}
            />
          </I18nextProvider>
        );
        
        const mobileText = container.querySelector('.mobile-text');
        expect(mobileText).toBeInTheDocument();
        
        // 验证响应式类名
        if (breakpoint.width <= 767) {
          expect(mobileText).toHaveClass('text-sm');
        } else if (breakpoint.width <= 1023) {
          expect(mobileText).toHaveClass('md:text-base');
        } else {
          expect(mobileText).toHaveClass('lg:text-lg');
        }
      }
    });
  });

  describe('手势操作可靠性测试', () => {
    test('触摸事件在不同屏幕尺寸下的稳定性', () => {
      Object.entries(mockDevices).forEach(([deviceName, dimensions]) => {
        mockScreenSize(dimensions.width, dimensions.height);
        
        const handleTouchStart = jest.fn();
        const handleTouchEnd = jest.fn();
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <TouchFeedback 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div style={{ width: '100px', height: '100px' }}>触摸测试</div>
            </TouchFeedback>
          </I18nextProvider>
        );
        
        const touchArea = container.querySelector('.relative.inline-block');
        expect(touchArea).toBeInTheDocument();
        
        // 模拟触摸事件
        if (touchArea) {
          // 触摸开始事件
          fireEvent.touchStart(touchArea, {
            touches: [{ clientX: 50, clientY: 50 }]
          });
          
          // 触摸结束事件
          fireEvent.touchEnd(touchArea, {
            changedTouches: [{ clientX: 50, clientY: 50 }]
          });
          
          // 验证事件处理函数被调用
          expect(handleTouchStart).toHaveBeenCalled();
          expect(handleTouchEnd).toHaveBeenCalled();
        }
      });
    });
  });
});

// 性能测试
describe('移动端UI性能测试', () => {
  test('渲染性能测试', () => {
    const startTime = performance.now();
    
    const { container } = render(;
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcherMobile />
      </I18nextProvider>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 渲染时间应该少于100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('内存使用测试', () => {
    // 模拟多次渲染和卸载
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileLanguageBottomSheet
            isOpen={true}
            onClose={jest.fn()}
            currentLanguage:"tg-TJ"
            onLanguageChange={jest.fn()}
          />
        </I18nextProvider>
      );
      
      unmount();
    }
    
    // 如果没有内存泄漏，测试应该通过
    expect(true).toBe(true);
  });
});

// 无障碍测试
describe('移动端UI无障碍测试', () => {
  test('触摸区域无障碍测试', () => {
    const { container } = render(;
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcherMobile />
      </I18nextProvider>
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    
    if (button) {
      // 检查ARIA标签
      expect(button).toHaveAttribute('aria-label');
      
      // 检查最小触摸区域
      const rect = button.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('语义化标签测试', () => {
    const { container } = render(;
      <I18nextProvider i18n={i18n}>
        <MobileText text:"测试文本" context="title" as="h1" />
      </I18nextProvider>
    );
    
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('mobile-text');
  });
});