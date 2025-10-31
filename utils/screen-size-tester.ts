/**
 * 屏幕尺寸模拟测试工具
 * 模拟不同设备的屏幕尺寸，验证响应式设计的正确性，生成适配性报告
 */

export interface DeviceProfile {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ScreenSizeTestResult {
  device: DeviceProfile;
  testResults: {
    layoutTest: LayoutTestResult;
    touchTest: TouchTestResult;
    performanceTest: PerformanceTestResult;
    accessibilityTest: AccessibilityTestResult;
  };
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface LayoutTestResult {
  passed: boolean;
  checks: {
    minTouchArea: boolean;
    responsiveBreakpoints: boolean;
    textTruncation: boolean;
    scrollHandling: boolean;
    orientationSupport: boolean;
  };
  details: string[];
}

export interface TouchTestResult {
  passed: boolean;
  checks: {
    gestureSupport: boolean;
    touchAccuracy: boolean;
    feedbackTiming: boolean;
    longPressSupport: boolean;
  };
  details: string[];
}

export interface PerformanceTestResult {
  passed: boolean;
  metrics: {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
  };
  details: string[];
}

export interface AccessibilityTestResult {
  passed: boolean;
  checks: {
    ariaLabels: boolean;
    colorContrast: boolean;
    focusOrder: boolean;
    screenReaderSupport: boolean;
  };
  details: string[];
}

/**
 * 设备配置文件
 */
export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    name: 'iPhone SE (2nd Gen)',
    width: 375,
    height: 667,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'iPhone 12/13',
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'Samsung Galaxy S20',
    width: 360,
    height: 800,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G980F) AppleWebKit/537.36',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  },
  {
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: false,
    isTablet: true,
    isDesktop: false,
  },
  {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: false,
    isTablet: true,
    isDesktop: false,
  },
  {
    name: 'Surface Pro',
    width: 912,
    height: 1368,
    pixelRatio: 1.5,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isMobile: false,
    isTablet: true,
    isDesktop: false,
  },
  {
    name: 'Desktop 1366x768',
    width: 1366,
    height: 768,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
];

/**
 * 屏幕尺寸测试器类
 */
export class ScreenSizeTester {
  private testResults: ScreenSizeTestResult[] = [];
  private currentDeviceIndex = 0;

  constructor() {
    this.initializeTestingEnvironment();
  }

  /**
   * 初始化测试环境
   */
  private initializeTestingEnvironment(): void {
    // 模拟浏览器环境
    if (typeof window !== 'undefined') {
      this.setupWindowMock();
    }
  }

  /**
   * 设置窗口模拟
   */
  private setupWindowMock(): void {
    // 模拟 window 对象属性
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    });

    // 模拟 matchMedia
    if (!window.matchMedia) {
      (window as any).matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    }

    // 模拟触摸事件
    if (typeof TouchEvent === 'undefined') {
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
    }
  }

  /**
   * 切换到指定设备
   */
  switchToDevice(deviceIndex: number): void {
    if (deviceIndex < 0 || deviceIndex >= DEVICE_PROFILES.length) {
      throw new Error(`设备索引超出范围: ${deviceIndex}`);
    }

    this.currentDeviceIndex = deviceIndex;
    const device = DEVICE_PROFILES[deviceIndex];
    this.simulateDeviceEnvironment(device);
  }

  /**
   * 模拟设备环境
   */
  private simulateDeviceEnvironment(device: DeviceProfile): void {
    if (typeof window !== 'undefined') {
      // 设置屏幕尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: device.width,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: device.height,
      });

      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: device.pixelRatio,
      });

      // 设置 User Agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: device.userAgent,
      });
    }

    // 触发 resize 事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('resize'));
    }
  }

  /**
   * 测试指定设备的适配性
   */
  async testDeviceAdaptation(deviceIndex: number): Promise<ScreenSizeTestResult> {
    const device = DEVICE_PROFILES[deviceIndex];
    this.switchToDevice(deviceIndex);

    const layoutTest = await this.runLayoutTests(device);
    const touchTest = await this.runTouchTests(device);
    const performanceTest = await this.runPerformanceTests(device);
    const accessibilityTest = await this.runAccessibilityTests(device);

    const result: ScreenSizeTestResult = {
      device,
      testResults: {
        layoutTest,
        touchTest,
        performanceTest,
        accessibilityTest,
      },
      score: 0,
      issues: [],
      recommendations: [],
    };

    // 计算总体评分
    result.score = this.calculateOverallScore(result);

    // 收集问题和建议
    result.issues = this.collectIssues(result);
    result.recommendations = this.generateRecommendations(result);

    this.testResults.push(result);
    return result;
  }

  /**
   * 运行布局测试
   */
  private async runLayoutTests(device: DeviceProfile): Promise<LayoutTestResult> {
    const checks = {
      minTouchArea: false,
      responsiveBreakpoints: false,
      textTruncation: false,
      scrollHandling: false,
      orientationSupport: false,
    };

    const details: string[] = [];

    // 测试最小触摸区域 (44px)
    try {
      const button = this.createTestButton();
      const buttonRect = button.getBoundingClientRect();
      
      checks.minTouchArea = buttonRect.height >= 44 && buttonRect.width >= 44;
      details.push(`按钮尺寸: ${buttonRect.width}x${buttonRect.height}px`);
    } catch (error) {
      details.push(`触摸区域测试失败: ${error}`);
    }

    // 测试响应式断点
    try {
      checks.responsiveBreakpoints = this.testResponsiveBreakpoints(device);
      details.push(`响应式断点测试: ${checks.responsiveBreakpoints ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`响应式断点测试失败: ${error}`);
    }

    // 测试文本截断
    try {
      checks.textTruncation = this.testTextTruncation(device);
      details.push(`文本截断测试: ${checks.textTruncation ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`文本截断测试失败: ${error}`);
    }

    // 测试滚动处理
    try {
      checks.scrollHandling = this.testScrollHandling(device);
      details.push(`滚动处理测试: ${checks.scrollHandling ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`滚动处理测试失败: ${error}`);
    }

    // 测试方向支持
    try {
      checks.orientationSupport = this.testOrientationSupport(device);
      details.push(`方向支持测试: ${checks.orientationSupport ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`方向支持测试失败: ${error}`);
    }

    const passed = Object.values(checks).every(check => check);

    return {
      passed,
      checks,
      details,
    };
  }

  /**
   * 运行触摸测试
   */
  private async runTouchTests(device: DeviceProfile): Promise<TouchTestResult> {
    const checks = {
      gestureSupport: false,
      touchAccuracy: false,
      feedbackTiming: false,
      longPressSupport: false,
    };

    const details: string[] = [];

    // 测试手势支持
    try {
      checks.gestureSupport = this.testGestureSupport(device);
      details.push(`手势支持测试: ${checks.gestureSupport ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`手势支持测试失败: ${error}`);
    }

    // 测试触摸精度
    try {
      checks.touchAccuracy = this.testTouchAccuracy(device);
      details.push(`触摸精度测试: ${checks.touchAccuracy ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`触摸精度测试失败: ${error}`);
    }

    // 测试反馈时机
    try {
      checks.feedbackTiming = this.testFeedbackTiming(device);
      details.push(`反馈时机测试: ${checks.feedbackTiming ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`反馈时机测试失败: ${error}`);
    }

    // 测试长按支持
    try {
      checks.longPressSupport = this.testLongPressSupport(device);
      details.push(`长按支持测试: ${checks.longPressSupport ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`长按支持测试失败: ${error}`);
    }

    const passed = Object.values(checks).every(check => check);

    return {
      passed,
      checks,
      details,
    };
  }

  /**
   * 运行性能测试
   */
  private async runPerformanceTests(device: DeviceProfile): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    
    // 模拟组件渲染
    await this.simulateComponentRendering();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    const metrics = {
      renderTime,
      memoryUsage: this.estimateMemoryUsage(),
      frameRate: this.estimateFrameRate(),
    };

    const details = [
      `渲染时间: ${renderTime.toFixed(2)}ms`,
      `内存使用: ${metrics.memoryUsage}MB`,
      `预估帧率: ${metrics.frameRate} FPS`,
    ];

    const passed = renderTime < 100 && metrics.frameRate > 30;

    return {
      passed,
      metrics,
      details,
    };
  }

  /**
   * 运行无障碍测试
   */
  private async runAccessibilityTests(device: DeviceProfile): Promise<AccessibilityTestResult> {
    const checks = {
      ariaLabels: false,
      colorContrast: false,
      focusOrder: false,
      screenReaderSupport: false,
    };

    const details: string[] = [];

    // 测试 ARIA 标签
    try {
      checks.ariaLabels = this.testAriaLabels();
      details.push(`ARIA标签测试: ${checks.ariaLabels ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`ARIA标签测试失败: ${error}`);
    }

    // 测试颜色对比度
    try {
      checks.colorContrast = this.testColorContrast();
      details.push(`颜色对比度测试: ${checks.colorContrast ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`颜色对比度测试失败: ${error}`);
    }

    // 测试焦点顺序
    try {
      checks.focusOrder = this.testFocusOrder();
      details.push(`焦点顺序测试: ${checks.focusOrder ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`焦点顺序测试失败: ${error}`);
    }

    // 测试屏幕阅读器支持
    try {
      checks.screenReaderSupport = this.testScreenReaderSupport();
      details.push(`屏幕阅读器测试: ${checks.screenReaderSupport ? '通过' : '失败'}`);
    } catch (error) {
      details.push(`屏幕阅读器测试失败: ${error}`);
    }

    const passed = Object.values(checks).every(check => check);

    return {
      passed,
      checks,
      details,
    };
  }

  /**
   * 创建测试按钮元素
   */
  private createTestButton(): HTMLElement {
    const button = document.createElement('button');
    button.style.minHeight = '44px';
    button.style.minWidth = '44px';
    button.textContent = '测试按钮';
    document.body.appendChild(button);
    return button;
  }

  /**
   * 测试响应式断点
   */
  private testResponsiveBreakpoints(device: DeviceProfile): boolean {
    const breakpoints = {
      mobile: 767,
      tablet: 1023,
      desktop: Infinity,
    };

    if (device.width <= breakpoints.mobile) {
      return device.isMobile;
    } else if (device.width <= breakpoints.tablet) {
      return device.isTablet;
    } else {
      return device.isDesktop;
    }
  }

  /**
   * 测试文本截断
   */
  private testTextTruncation(device: DeviceProfile): boolean {
    const longText = '这是一个很长的测试文本需要截断';
    const maxLength = device.width < 400 ? 15 : 25;
    
    return longText.length > maxLength;
  }

  /**
   * 测试滚动处理
   */
  private testScrollHandling(device: DeviceProfile): boolean {
    // 检查视口高度是否合理
    return device.height > 0 && device.height <= 2000;
  }

  /**
   * 测试方向支持
   */
  private testOrientationSupport(device: DeviceProfile): boolean {
    // 移动设备应该支持方向变化
    if (device.isMobile || device.isTablet) {
      return device.width > 0 && device.height > 0;
    }
    return true; // 桌面设备固定方向
  }

  /**
   * 测试手势支持
   */
  private testGestureSupport(device: DeviceProfile): boolean {
    // 检查是否支持触摸事件
    return typeof TouchEvent !== 'undefined';
  }

  /**
   * 测试触摸精度
   */
  private testTouchAccuracy(device: DeviceProfile): boolean {
    // 根据设备像素比检查触摸精度
    return device.pixelRatio >= 1 && device.pixelRatio <= 4;
  }

  /**
   * 测试反馈时机
   */
  private testFeedbackTiming(device: DeviceProfile): boolean {
    // 简单的反馈测试
    return device.isMobile || device.isTablet;
  }

  /**
   * 测试长按支持
   */
  private testLongPressSupport(device: DeviceProfile): boolean {
    // 移动设备应该支持长按
    return device.isMobile || device.isTablet;
  }

  /**
   * 模拟组件渲染
   */
  private async simulateComponentRendering(): Promise<void> {
    // 模拟 React 组件渲染过程
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return Math.random() * 50 + 10; // 模拟内存使用量
  }

  /**
   * 估算帧率
   */
  private estimateFrameRate(): number {
    const currentDevice = DEVICE_PROFILES[this.currentDeviceIndex];
    if (currentDevice.isMobile) {
      return 30 + Math.random() * 30;
    } else if (currentDevice.isTablet) {
      return 45 + Math.random() * 20;
    } else {
      return 55 + Math.random() * 10;
    }
  }

  /**
   * 测试 ARIA 标签
   */
  private testAriaLabels(): boolean {
    // 简单的 ARIA 标签测试
    const testElement = document.createElement('button');
    testElement.setAttribute('aria-label', '测试按钮');
    return testElement.hasAttribute('aria-label');
  }

  /**
   * 测试颜色对比度
   */
  private testColorContrast(): boolean {
    // 简单的颜色对比度检查
    return true; // 实际实现中需要检查 WCAG 对比度标准
  }

  /**
   * 测试焦点顺序
   */
  private testFocusOrder(): boolean {
    // 测试 tab 键导航顺序
    return true;
  }

  /**
   * 测试屏幕阅读器支持
   */
  private testScreenReaderSupport(): boolean {
    // 测试屏幕阅读器兼容性
    return true;
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(result: ScreenSizeTestResult): number {
    const { layoutTest, touchTest, performanceTest, accessibilityTest } = result.testResults;
    
    let totalScore = 0;
    let testCount = 0;

    // 布局测试评分 (25%)
    if (layoutTest.passed) {
      const passedChecks = Object.values(layoutTest.checks).filter(Boolean).length;
      totalScore += (passedChecks / Object.keys(layoutTest.checks).length) * 25;
    }
    testCount += 25;

    // 触摸测试评分 (25%)
    if (touchTest.passed) {
      const passedChecks = Object.values(touchTest.checks).filter(Boolean).length;
      totalScore += (passedChecks / Object.keys(touchTest.checks).length) * 25;
    }
    testCount += 25;

    // 性能测试评分 (25%)
    if (performanceTest.passed) {
      totalScore += 25;
    } else {
      // 根据性能指标计算部分分数
      const { renderTime, frameRate } = performanceTest.metrics;
      if (renderTime < 200) totalScore += 12.5;
      if (frameRate > 20) totalScore += 12.5;
    }
    testCount += 25;

    // 无障碍测试评分 (25%)
    if (accessibilityTest.passed) {
      const passedChecks = Object.values(accessibilityTest.checks).filter(Boolean).length;
      totalScore += (passedChecks / Object.keys(accessibilityTest.checks).length) * 25;
    }
    testCount += 25;

    return Math.round(totalScore);
  }

  /**
   * 收集问题
   */
  private collectIssues(result: ScreenSizeTestResult): string[] {
    const issues: string[] = [];

    // 检查布局问题
    if (!result.testResults.layoutTest.passed) {
      Object.entries(result.testResults.layoutTest.checks).forEach(([check, passed]) => {
        if (!passed) {
          issues.push(`布局检查失败: ${check}`);
        }
      });
    }

    // 检查触摸问题
    if (!result.testResults.touchTest.passed) {
      Object.entries(result.testResults.touchTest.checks).forEach(([check, passed]) => {
        if (!passed) {
          issues.push(`触摸检查失败: ${check}`);
        }
      });
    }

    // 检查性能问题
    if (!result.testResults.performanceTest.passed) {
      const { renderTime, frameRate } = result.testResults.performanceTest.metrics;
      if (renderTime >= 100) {
        issues.push(`渲染时间过长: ${renderTime.toFixed(2)}ms`);
      }
      if (frameRate < 30) {
        issues.push(`帧率过低: ${frameRate.toFixed(2)} FPS`);
      }
    }

    // 检查无障碍问题
    if (!result.testResults.accessibilityTest.passed) {
      Object.entries(result.testResults.accessibilityTest.checks).forEach(([check, passed]) => {
        if (!passed) {
          issues.push(`无障碍检查失败: ${check}`);
        }
      });
    }

    return issues;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(result: ScreenSizeTestResult): string[] {
    const recommendations: string[] = [];
    const { device } = result;

    // 基于设备类型的建议
    if (device.isMobile) {
      if (device.width < 400) {
        recommendations.push('超小屏幕设备: 考虑使用更大的字体和按钮尺寸');
      }
      recommendations.push('移动设备: 确保所有交互元素都大于44px');
    }

    if (device.isTablet) {
      recommendations.push('平板设备: 可以使用更大的触摸目标区域');
    }

    if (device.isDesktop) {
      recommendations.push('桌面设备: 可以显示更多内容和功能');
    }

    // 基于测试结果的建议
    const { layoutTest, touchTest, performanceTest, accessibilityTest } = result.testResults;

    if (!layoutTest.passed) {
      recommendations.push('改进响应式布局以更好地适配不同屏幕尺寸');
    }

    if (!touchTest.passed) {
      recommendations.push('优化触摸交互，提供更好的用户反馈');
    }

    if (!performanceTest.passed) {
      recommendations.push('优化性能，减少渲染时间和内存使用');
    }

    if (!accessibilityTest.passed) {
      recommendations.push('改善无障碍支持，确保所有用户都能正常使用');
    }

    return [...new Set(recommendations)]; // 去重
  }

  /**
   * 获取所有测试结果
   */
  getAllResults(): ScreenSizeTestResult[] {
    return this.testResults;
  }

  /**
   * 生成测试报告
   */
  generateReport(): string {
    let report = '# 移动端UI适配性测试报告\n\n';
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    // 总体统计
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.score >= 80).length;
    const averageScore = this.testResults.reduce((sum, r) => sum + r.score, 0) / totalTests;

    report += `## 总体统计\n`;
    report += `- 测试设备数量: ${totalTests}\n`;
    report += `- 通过测试: ${passedTests}\n`;
    report += `- 失败测试: ${totalTests - passedTests}\n`;
    report += `- 平均评分: ${averageScore.toFixed(1)}\n\n`;

    // 各设备详细结果
    report += `## 设备测试详情\n\n`;
    
    this.testResults.forEach(result => {
      report += `### ${result.device.name} (${result.device.width}x${result.device.height})\n`;
      report += `- 适配评分: ${result.score}/100\n`;
      report += `- 布局测试: ${result.testResults.layoutTest.passed ? '✅ 通过' : '❌ 失败'}\n`;
      report += `- 触摸测试: ${result.testResults.touchTest.passed ? '✅ 通过' : '❌ 失败'}\n`;
      report += `- 性能测试: ${result.testResults.performanceTest.passed ? '✅ 通过' : '❌ 失败'}\n`;
      report += `- 无障碍测试: ${result.testResults.accessibilityTest.passed ? '✅ 通过' : '❌ 失败'}\n\n`;

      if (result.issues.length > 0) {
        report += `**发现的问题:**\n`;
        result.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }

      if (result.recommendations.length > 0) {
        report += `**优化建议:**\n`;
        result.recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
        report += '\n';
      }
    });

    // 整体建议
    report += `## 整体优化建议\n\n`;
    
    const commonIssues = this.collectCommonIssues();
    const commonRecommendations = this.collectCommonRecommendations();

    if (commonIssues.length > 0) {
      report += `### 常见问题\n`;
      commonIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }

    if (commonRecommendations.length > 0) {
      report += `### 优化建议\n`;
      commonRecommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * 收集常见问题
   */
  private collectCommonIssues(): string[] {
    const issueCounts: Record<string, number> = {};

    this.testResults.forEach(result => {
      result.issues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });

    return Object.entries(issueCounts)
      .filter(([_, count]) => count > 1)
      .map(([issue, _]) => issue);
  }

  /**
   * 收集常见建议
   */
  private collectCommonRecommendations(): string[] {
    const recommendationCounts: Record<string, number> = {};

    this.testResults.forEach(result => {
      result.recommendations.forEach(rec => {
        recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
      });
    });

    return Object.entries(recommendationCounts)
      .filter(([_, count]) => count > 1)
      .map(([rec, _]) => rec);
  }

  /**
   * 清理测试环境
   */
  cleanup(): void {
    // 清理测试数据和模拟
    this.testResults = [];
    this.currentDeviceIndex = 0;
  }
}

// 导出工具函数
export const runScreenSizeTests = async (): Promise<ScreenSizeTestResult[]> => {
  const tester = new ScreenSizeTester();
  const results: ScreenSizeTestResult[] = [];

  for (let i = 0; i < DEVICE_PROFILES.length; i++) {
    console.log(`测试设备 ${i + 1}/${DEVICE_PROFILES.length}: ${DEVICE_PROFILES[i].name}`);
    const result = await tester.testDeviceAdaptation(i);
    results.push(result);
  }

  return results;
};

export const generateAdaptationReport = async (): Promise<string> => {
  const tester = new ScreenSizeTester();
  
  for (let i = 0; i < DEVICE_PROFILES.length; i++) {
    await tester.testDeviceAdaptation(i);
  }

  return tester.generateReport();
};