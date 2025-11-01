import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MobileText } from '../components/MobileText';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import type { SupportedLanguage } from '../src/i18n/config';
/**
 * 多语言文本长度测试
 * 测试中文、英文、俄文、塔吉克语文本在不同尺寸下的显示效果
 */


// 确保 JSX 编译正确
/* eslint-disable @typescript-eslint/no-unused-vars */

export interface TextLengthTestCase {
  language: SupportedLanguage;
  context: string;
  originalText: string;
  expectedMaxLength: number;
  shouldTruncate: boolean;
  truncationBehavior: 'none' | 'ellipsis' | 'smart';
}

export interface ScreenSizeConfiguration {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
}

export interface MultilingualTextTestResult {
  language: SupportedLanguage;
  context: string;
  originalLength: number;
  truncatedLength: number;
  isCorrectlyTruncated: boolean;
  screenSize: string;
  characterWidth: number;
  lineBreaks: number;
  renderingTime: number;
}

// 多语言测试文本数据
export const TEST_TEXTS: Record<SupportedLanguage, Record<string, string>> = {
  'zh-CN': {
    short: '短文本',
    medium: '这是一个中等长度的中文文本',
    long: '这是一个非常长的中文文本，需要在移动设备上进行适配和优化显示，确保用户能够清晰地阅读和理解内容',
    veryLong: '这是一个极长的中文文本示例，包含了大量的字符和内容，用于测试在各种不同尺寸的移动设备屏幕上的显示效果和文本处理能力，包括但不限于iPhone SE、iPhone 12、iPad等各种设备的适配性验证',
    productTitle: 'Apple iPhone 13 Pro Max 256GB 深空灰色 5G智能手机',
    buttonText: '立即购买',
    statusText: '配送中',
    navigationText: '个人中心',
    errorMessage: '抱歉，网络连接失败，请检查网络设置后重试',
    successMessage: '操作成功完成，感谢您的使用',
    formLabel: '收货地址',
    productDescription: '全新设计，配备先进的三摄系统，支持夜间模式拍摄和4K视频录制',
  },
  'en-US': {
    short: 'Short',
    medium: 'This is a medium length English text for mobile testing',
    long: 'This is a very long English text that needs to be properly adapted and optimized for display on mobile devices, ensuring users can clearly read and understand the content regardless of screen size or device type',
    veryLong: 'This is an extremely long English text example containing a substantial amount of characters and content, designed to test display effects and text processing capabilities on various different sizes of mobile device screens, including but not limited to iPhone SE, iPhone 12, iPad and other device adaptation verification',
    productTitle: 'Apple iPhone 13 Pro Max 256GB Space Gray 5G Smartphone',
    buttonText: 'Buy Now',
    statusText: 'In Transit',
    navigationText: 'Profile',
    errorMessage: 'Sorry, network connection failed. Please check your network settings and try again',
    successMessage: 'Operation completed successfully. Thank you for your usage',
    formLabel: 'Shipping Address',
    productDescription: 'Brand new design with advanced triple camera system, supporting night mode photography and 4K video recording',
  },
  'ru-RU': {
    short: 'Короткий',
    medium: 'Это текст средней длины на русском языке для мобильного тестирования',
    long: 'Это очень длинный русский текст, который необходимо правильно адаптировать и оптимизировать для отображения на мобильных устройствах, обеспечивая пользователям возможность четко читать и понимать контент',
    veryLong: 'Это чрезвычайно длинный пример русского текста, содержащий значительное количество символов и контента, предназначенный для проверки эффектов отображения и возможностей обработки текста на экранах мобильных устройств различных размеров, включая, но не ограничиваясь, iPhone SE, iPhone 12, iPad и другие устройства',
    productTitle: 'Apple iPhone 13 Pro Max 256GB Серый космос 5G смартфон',
    buttonText: 'Купить сейчас',
    statusText: 'В пути',
    navigationText: 'Профиль',
    errorMessage: 'Извините, сетевое соединение не удалось. Проверьте настройки сети и попробуйте снова',
    successMessage: 'Операция успешно завершена. Спасибо за использование',
    formLabel: 'Адрес доставки',
    productDescription: 'Новый дизайн с усовершенствованной тройной камерой, поддержка ночного режима и записи 4K видео',
  },
  'tg-TJ': {
    short: 'Кутоҳ',
    medium: 'Ин матни миёнаҳаҷми тоҷикӣ барои санҷиши мобилӣ аст',
    long: 'Ин матни дарози русӣ аст, ки бояд дуруст мутобиқат ва оптимизация карда шавад барои намоиш дар дастгоҳҳои мобилӣ, тавассути он ки истифодабарандагон метавонанд мӯҳтавоиро возеҳ хонанд ва фаҳманд',
    veryLong: 'Ин намунаи хеле дарози матни тоҷикӣ аст, ки миқдори зиёди аломатҳо ва мӯҳтаво дорост, барои санҷиши таъсири намоиш ва қобилияти коркарди матн дар экранҳои дастгоҳҳои мобилӣ бо андозаҳои гуногун, аз ҷумла iPhone SE, iPhone 12, iPad ва дигар дастгоҳҳо пешбинӣ шудааст',
    productTitle: 'Apple iPhone 13 Pro Max 256GB Space Gray 5G смартфон',
    buttonText: 'Ҳоло харида гиред',
    statusText: 'Дар роҳ',
    navigationText: 'Профил',
    errorMessage: 'Бубахшед, пайвастагии шабакаи интернет қатъ шуд. Таҳаммулсозии шабакаи худро санҷед ва бори дигар кӯшиш кунед',
    successMessage: 'Амалиёт бомуваффақият анҷом ёфт. Ташаккур барои истифодаи шумо',
    formLabel: 'Суроғаи интиқол',
    productDescription: 'Тарҳи нав бо системаи секамераи пешрафта, дастгирии режими шаб ва сабти видеои 4K',
  },
};

// 屏幕尺寸配置
export const SCREEN_SIZES: ScreenSizeConfiguration[] = [;
  { name: 'iPhone SE', width: 320, height: 568, pixelRatio: 2 },
  { name: 'iPhone 12', width: 390, height: 844, pixelRatio: 3 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, pixelRatio: 3 },
  { name: 'Samsung S20', width: 360, height: 800, pixelRatio: 3 },
  { name: 'iPad Mini', width: 768, height: 1024, pixelRatio: 2 },
  { name: 'iPad Pro', width: 1024, height: 1366, pixelRatio: 2 },
  { name: 'Desktop Small', width: 1366, height: 768, pixelRatio: 1 },
  { name: 'Desktop Large', width: 1920, height: 1080, pixelRatio: 1 },
];

// 测试用例配置
export const TEXT_LENGTH_TEST_CASES: TextLengthTestCase[] = [;
  // 中文测试用例
  {
    language: 'zh-CN',
    context: 'title',
    originalText: 'Apple iPhone 13 Pro Max 256GB 深空灰色 5G智能手机',
    expectedMaxLength: 20,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  {
    language: 'zh-CN',
    context: 'button',
    originalText: '立即购买',
    expectedMaxLength: 8,
    shouldTruncate: false,
    truncationBehavior: 'ellipsis',
  },
  {
    language: 'zh-CN',
    context: 'content',
    originalText: '这是一个非常长的中文文本，需要在移动设备上进行适配和优化显示',
    expectedMaxLength: 50,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  
  // 英文测试用例
  {
    language: 'en-US',
    context: 'title',
    originalText: 'Apple iPhone 13 Pro Max 256GB Space Gray 5G Smartphone',
    expectedMaxLength: 25,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  {
    language: 'en-US',
    context: 'button',
    originalText: 'Buy Now',
    expectedMaxLength: 12,
    shouldTruncate: false,
    truncationBehavior: 'ellipsis',
  },
  {
    language: 'en-US',
    context: 'content',
    originalText: 'This is a very long English text that needs proper adaptation for mobile devices',
    expectedMaxLength: 60,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  
  // 俄文测试用例
  {
    language: 'ru-RU',
    context: 'title',
    originalText: 'Apple iPhone 13 Pro Max 256GB Серый космос 5G смартфон',
    expectedMaxLength: 18,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  {
    language: 'ru-RU',
    context: 'button',
    originalText: 'Купить сейчас',
    expectedMaxLength: 10,
    shouldTruncate: false,
    truncationBehavior: 'ellipsis',
  },
  {
    language: 'ru-RU',
    context: 'content',
    originalText: 'Это очень длинный русский текст для мобильных устройств',
    expectedMaxLength: 45,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  
  // 塔吉克语测试用例
  {
    language: 'tg-TJ',
    context: 'title',
    originalText: 'Apple iPhone 13 Pro Max 256GB Space Gray 5G смартфон',
    expectedMaxLength: 15,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
  {
    language: 'tg-TJ',
    context: 'button',
    originalText: 'Ҳоло харида гиред',
    expectedMaxLength: 8,
    shouldTruncate: false,
    truncationBehavior: 'ellipsis',
  },
  {
    language: 'tg-TJ',
    context: 'content',
    originalText: 'Ин матни дарози тоҷикӣ барои дастгоҳҳои мобилӣ аст',
    expectedMaxLength: 40,
    shouldTruncate: true,
    truncationBehavior: 'smart',
  },
];

// 字符宽度测试数据
export const CHARACTER_WIDTH_DATA: Record<SupportedLanguage, number> = {
  'zh-CN': 16, // 中文字符宽度 (px)
  'en-US': 8,  // 英文字符宽度 (px)
  'ru-RU': 9,  // 俄文字符宽度 (px)
  'tg-TJ': 8,  // 塔吉克语字符宽度 (px)
};

// 模拟屏幕尺寸
const mockScreenSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height,
  });
};

// 主要测试套件
describe('多语言文本长度测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本文本截断测试', () => {
    test('中文文本截断测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"这是一个很长的中文文本需要截断处理" 
            context:"content"
            enableTruncation={true}
            maxChars={15}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent.length).toBeLessThanOrEqual(18); // 15 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/); // 以省略号结尾
    });

    test('英文文本截断测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"This is a very long English text that needs truncation" 
            context:"content"
            enableTruncation={true}
            maxChars={25}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent.length).toBeLessThanOrEqual(28); // 25 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/);
    });

    test('俄文文本截断测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"Это очень длинный русский текст для мобильных устройств" 
            context:"content"
            enableTruncation={true}
            maxChars={20}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent.length).toBeLessThanOrEqual(23); // 20 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/);
    });

    test('塔吉克语文本截断测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"Ин матни дарози тоҷикӣ барои дастгоҳҳои мобилӣ аст" 
            context:"content"
            enableTruncation={true}
            maxChars={18}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent.length).toBeLessThanOrEqual(21); // 18 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/);
    });
  });

  describe('不同屏幕尺寸下的文本适配测试', () => {
    SCREEN_SIZES.forEach(screenSize => {
      test(`${screenSize.name} (${screenSize.width}x${screenSize.height}) 中文文本适配测试`, () => {
        mockScreenSize(screenSize.width, screenSize.height);
        
        const testTexts = [;
          { text: '短文本', maxChars: 10 },
          { text: '这是一个中等长度的中文文本测试', maxChars: 20 },
          { text: '这是一个非常长的中文文本需要在移动设备上进行适配和优化显示', maxChars: 30 },
        ];
        
        testTexts.forEach(({ text, maxChars }) => {
          const { container } = render(;
            <I18nextProvider i18n={i18n}>
              <MobileText 
                text={text}
                context:"content"
                enableTruncation={true}
                maxChars={maxChars}
              />
            </I18nextProvider>
          );
          
          const mobileText = container.querySelector('.mobile-text');
          expect(mobileText).toBeInTheDocument();
          
          const textContent = mobileText?.textContent || '';
          const expectedMaxLength = maxChars + 3; // + "...";
          
          if (text.length > maxChars) {
            expect(textContent.length).toBeLessThanOrEqual(expectedMaxLength);
          } else {
            expect(textContent).toBe(text);
}
        });
      });

      test(`${screenSize.name} (${screenSize.width}x${screenSize.height}) 英文文本适配测试`, () => {
        mockScreenSize(screenSize.width, screenSize.height);
        
        const testTexts = [;
          { text: 'Short text', maxChars: 12 },
          { text: 'This is a medium length English text for mobile testing', maxChars: 30 },
          { text: 'This is a very long English text that needs proper adaptation for mobile devices', maxChars: 40 },
        ];
        
        testTexts.forEach(({ text, maxChars }) => {
          const { container } = render(;
            <I18nextProvider i18n={i18n}>
              <MobileText 
                text={text}
                context:"content"
                enableTruncation={true}
                maxChars={maxChars}
              />
            </I18nextProvider>
          );
          
          const mobileText = container.querySelector('.mobile-text');
          expect(mobileText).toBeInTheDocument();
          
          const textContent = mobileText?.textContent || '';
          const expectedMaxLength = maxChars + 3; // + "...";
          
          if (text.length > maxChars) {
            expect(textContent.length).toBeLessThanOrEqual(expectedMaxLength);
          } else {
            expect(textContent).toBe(text);
          }
        });
      });
    });
  });

  describe('上下文特定截断测试', () => {
    const contexts = ['title', 'button', 'label', 'status', 'content', 'navigation', 'form', 'product'] as const;
    
    contexts.forEach(context => {
      test(`${context} 上下文中文文本测试`, () => {
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text:"这是一个用于测试的文本内容"
              context={context}
              enableTruncation={true}
            />
          </I18nextProvider>
        );
        
        const mobileText = container.querySelector('.mobile-text');
        expect(mobileText).toBeInTheDocument();
        
        // 检查上下文特定的CSS类
        expect(mobileText).toHaveClass(`mobile-text--${context}`);
        
        // 检查文本是否被正确处理
        const textContent = mobileText?.textContent || '';
        expect(textContent.length).toBeGreaterThan(0);
      });
    });
  });

  describe('智能截断算法测试', () => {
    test('中文智能截断 - 按字符截断', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"这是一个很长的中文文本，需要在适当的位置截断"
            context:"content"
            enableTruncation={true}
            maxChars={15}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      // 中文按字符截断，不考虑空格
      expect(textContent.length).toBeLessThanOrEqual(18); // 15 + "..."
      expect(textContent).toBe('这是一个很长的中...');
    });

    test('英文智能截断 - 考虑单词边界', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"This is a very long English text that needs intelligent truncation"
            context:"content"
            enableTruncation={true}
            maxChars={30}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      // 英文应该考虑单词边界
      expect(textContent.length).toBeLessThanOrEqual(33); // 30 + "..."
      // 检查是否在单词边界处截断
      expect(textContent).not.toMatch(/[a-zA-Z]$/); // 不应该在单词中间截断
    });

    test('俄文智能截断 - 考虑西里尔字母特性', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"Это очень длинный русский текст для мобильных устройств"
            context:"content"
            enableTruncation={true}
            maxChars={25}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      expect(textContent.length).toBeLessThanOrEqual(28); // 25 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/);
    });

    test('塔吉克语智能截断', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"Ин матни дарози тоҷикӣ барои дастгоҳҳои мобилӣ лозим аст"
            context:"content"
            enableTruncation={true}
            maxChars={20}
            ellipsis:"..."
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      expect(textContent.length).toBeLessThanOrEqual(23); // 20 + "..."
      expect(textContent).toMatch(/.*\.\.\.$/);
    });
  });

  describe('性能测试', () => {
    test('大量文本渲染性能测试', () => {
      const startTime = performance.now();
      
      const testTexts = Array.from({ length: 100 }, (_, i) =>;
        `测试文本 ${i} - 这是一个非常长的中文文本内容用于性能测试`
      );
      
      testTexts.forEach((text, index) => {
        render(
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text={text}
              context:"content"
              enableTruncation={true}
              maxChars={25}
            />
          </I18nextProvider>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染时间应该少于1秒
      expect(renderTime).toBeLessThan(1000);
    });

    test('多语言切换性能测试', () => {
      const languages: SupportedLanguage[] = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
      
      const startTime = performance.now();
      
      languages.forEach(lang => {
        i18n.changeLanguage(lang);
        
        render(
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text:"多语言测试文本"
              context:"content"
              enableTruncation={true}
              maxChars={20}
            />
          </I18nextProvider>
        );
      });
      
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      // 语言切换时间应该少于500ms
      expect(switchTime).toBeLessThan(500);
    });
  });

  describe('边界条件测试', () => {
    test('空文本处理测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:""
            context:"content"
            enableTruncation={true}
            maxChars={10}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      expect(mobileText?.textContent).toBe('');
    });

    test('单字符文本测试', () => {
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text:"中"
            context:"content"
            enableTruncation={true}
            maxChars={10}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      expect(mobileText?.textContent).toBe('中');
    });

    test('极大长度文本测试', () => {
      const longText = '测试文本'.repeat(1000);
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text={longText}
            context:"content"
            enableTruncation={true}
            maxChars={50}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent.length).toBeLessThanOrEqual(53); // 50 + "..."
    });

    test('禁用截断测试', () => {
      const longText = '这是一个很长的中文文本不应该被截断';
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text={longText}
            context:"content"
            enableTruncation={false}
            maxChars={10}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      expect(mobileText).toBeInTheDocument();
      
      const textContent = mobileText?.textContent || '';
      expect(textContent).toBe(longText); // 应该保持完整文本
    });
  });

  describe('特殊字符处理测试', () => {
    test('包含标点符号的文本测试', () => {
      const textWithPunctuation = '这是一个包含，：！？。标点符号的测试文本';
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text={textWithPunctuation}
            context:"content"
            enableTruncation={true}
            maxChars={20}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      // 检查标点符号是否被正确处理
      expect(textContent).toMatch(/.*\.\.\.$/);
      expect(textContent.length).toBeLessThanOrEqual(23);
    });

    test('包含数字和字母的混合文本测试', () => {
      const mixedText = 'Product ABC123这是一个混合文本测试案例';
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text={mixedText}
            context:"content"
            enableTruncation={true}
            maxChars={15}
          />
        </I18nextProvider>
      );
      
      const mobileText = container.querySelector('.mobile-text');
      const textContent = mobileText?.textContent || '';
      
      expect(textContent.length).toBeLessThanOrEqual(18);
    });
  });

  describe('响应式文本适配测试', () => {
    test('响应式断点文本适配测试', () => {
      const responsiveConfigs = [;
        { width: 320, expectedMaxChars: 10 },
        { width: 768, expectedMaxChars: 20 },
        { width: 1024, expectedMaxChars: 30 },
      ];
      
      responsiveConfigs.forEach(({ width, expectedMaxChars }) => {
        mockScreenSize(width, 600);
        
        const { container } = render(;
          <I18nextProvider i18n={i18n}>
            <MobileText 
              text:"这是一个响应式文本适配测试案例"
              context:"content"
              enableTruncation={true}
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
      });
    });
  });
});

// 辅助测试函数
export const runMultilingualTextLengthTests = async (): Promise<MultilingualTextTestResult[]> => {
  const results: MultilingualTextTestResult[] = [];
  
  for (const testCase of TEXT_LENGTH_TEST_CASES) {
    for (const screenSize of SCREEN_SIZES) {
      mockScreenSize(screenSize.width, screenSize.height);
      
      const startTime = performance.now();
      
      const { container } = render(;
        <I18nextProvider i18n={i18n}>
          <MobileText 
            text={testCase.originalText}
            context={testCase.context}
            enableTruncation={testCase.shouldTruncate}
            maxChars={testCase.expectedMaxLength}
          />
        </I18nextProvider>
      );
      
      const endTime = performance.now();
      
      const mobileText = container.querySelector('.mobile-text');
      const renderedText = mobileText?.textContent || '';
      
      const result: MultilingualTextTestResult = {
        language: testCase.language,
        context: testCase.context,
        originalLength: testCase.originalText.length,
        truncatedLength: renderedText.length,
        isCorrectlyTruncated: testCase.shouldTruncate ? 
          renderedText.length <= testCase.expectedMaxLength + 3 : 
          renderedText === testCase.originalText,
        screenSize: screenSize.name,
        characterWidth: CHARACTER_WIDTH_DATA[testCase.language],
        lineBreaks: (renderedText.match(/\n/g) || []).length,
        renderingTime: endTime - startTime,
      };
      
      results.push(result);
}
  }
  
  return results;
};

export const generateTextLengthTestReport = (results: MultilingualTextTestResult[]): string => {
  let report = '# 多语言文本长度测试报告\n\n';
  report += `生成时间: ${new Date().toLocaleString()}\n\n`;
  
  // 总体统计
  const totalTests = results.length;
  const passedTests = results.filter(r => r.isCorrectlyTruncated).length;
  const averageRenderingTime = results.reduce((sum, r) => sum + r.renderingTime, 0) / totalTests;
  
  report += `## 总体统计\n`;
  report += `- 测试用例总数: ${totalTests}\n`;
  report += `- 通过测试: ${passedTests}\n`;
  report += `- 失败测试: ${totalTests - passedTests}\n`;
  report += `- 平均渲染时间: ${averageRenderingTime.toFixed(2)}ms\n\n`;
  
  // 按语言统计
  const languages = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'] as SupportedLanguage[];
  languages.forEach(lang => {
    const langResults = results.filter(r => r.language === lang);
    const langPassed = langResults.filter(r => r.isCorrectlyTruncated).length;
    
    report += `## ${lang} 语言测试结果\n`;
    report += `- 测试数量: ${langResults.length}\n`;
    report += `- 通过数量: ${langPassed}\n`;
    report += `- 成功率: ${((langPassed / langResults.length) * 100).toFixed(1)}%\n`;
    
    // 显示详细结果
    report += `\n### 详细结果\n`;
    langResults.forEach(result => {
      const status = result.isCorrectlyTruncated ? '✅' : '❌';
      report += `${status} ${result.context} (${result.screenSize}): ${result.originalLength} → ${result.truncatedLength} chars, ${result.renderingTime.toFixed(1)}ms\n`;
    });
    report += '\n';
  });
  
  return report;
};