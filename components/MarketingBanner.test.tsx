import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketingBanner from './MarketingBanner';
import { MarketingBanner as MarketingBannerType, MarketingBannerGroup } from '@/types';

// 测试数据
const createMockBanner = (overrides: Partial<MarketingBannerType> = {}): MarketingBannerType => ({
  id: '1',
  type: 'promotion',
  titleZh: '测试横幅',
  titleEn: 'Test Banner',
  titleRu: 'Тестовый баннер',
  backgroundColor: '#FF6B6B',
  textColor: '#FFFFFF',
  width: 'full',
  height: 'medium',
  borderRadius: 'large',
  animation: 'fade',
  priority: 10,
  enabled: true,
  viewCount: 0,
  clickCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  clickable: true,
  ...overrides,
});

const createMockBannerGroup = (overrides: Partial<MarketingBannerGroup> = {}): MarketingBannerGroup => ({
  id: 'group-1',
  name: '测试横幅组',
  banners: [
    createMockBanner({ id: '1', titleZh: '横幅1', priority: 10 }),
    createMockBanner({ id: '2', titleZh: '横幅2', priority: 8 }),
  ],
  autoPlay: false,
  showIndicators: true,
  showArrows: true,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('MarketingBanner', () => {
  describe('单个横幅渲染', () => {
    it('应该渲染单个横幅', () => {
      const banner = createMockBanner();
      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      expect(screen.getByText('测试横幅')).toBeInTheDocument();
    });

    it('应该支持多语言显示', () => {
      const banner = createMockBanner();
      const { rerender } = render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      expect(screen.getByText('测试横幅')).toBeInTheDocument();

      rerender(
        <MarketingBanner
          banner={banner}
          language="en"
        />
      );

      expect(screen.getByText('Test Banner')).toBeInTheDocument();

      rerender(
        <MarketingBanner
          banner={banner}
          language="ru"
        />
      );

      expect(screen.getByText('Тестовый баннер')).toBeInTheDocument();
    });

    it('应该隐藏禁用的横幅', () => {
      const banner = createMockBanner({ enabled: false });
      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      expect(screen.queryByText('测试横幅')).not.toBeInTheDocument();
    });

    it('应该根据时间控制横幅显示', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 未来开始的横幅（不应该显示）
      const futureBanner = createMockBanner({
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      });

      render(
        <MarketingBanner
          banner={futureBanner}
          language="zh"
        />
      );

      expect(screen.queryByText('测试横幅')).not.toBeInTheDocument();

      // 已过期的横幅（不应该显示）
      const expiredBanner = createMockBanner({
        startTime: yesterday,
        endTime: yesterday,
      });

      render(
        <MarketingBanner
          banner={expiredBanner}
          language="zh"
        />
      );

      expect(screen.queryByText('测试横幅')).not.toBeInTheDocument();

      // 有效时间内的横幅（应该显示）
      const validBanner = createMockBanner({
        startTime: yesterday,
        endTime: tomorrow,
      });

      render(
        <MarketingBanner
          banner={validBanner}
          language="zh"
        />
      );

      expect(screen.getByText('测试横幅')).toBeInTheDocument();
    });

    it('应该显示副标题和描述', () => {
      const banner = createMockBanner({
        subtitleZh: '副标题测试',
        descriptionZh: '描述测试',
      });

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      expect(screen.getByText('副标题测试')).toBeInTheDocument();
      expect(screen.getByText('描述测试')).toBeInTheDocument();
    });

    it('应该应用自定义样式', () => {
      const banner = createMockBanner({
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        width: 'container',
        height: 'small',
        borderRadius: 'none',
      });

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      const bannerElement = screen.getByText('测试横幅').closest('div');
      expect(bannerElement).toHaveStyle({
        backgroundColor: '#000000',
        color: '#FFFFFF',
      });
    });
  });

  describe('横幅点击功能', () => {
    it('应该支持点击回调', () => {
      const banner = createMockBanner();
      const onBannerClick = jest.fn();

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
          onBannerClick={onBannerClick}
        />
      );

      fireEvent.click(screen.getByText('测试横幅'));

      expect(onBannerClick).toHaveBeenCalledWith(banner);
    });

    it('应该支持链接跳转', () => {
      const banner = createMockBanner({
        linkUrl: '/test-page',
        linkTarget: '_blank',
      });

      // 模拟 window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      fireEvent.click(screen.getByText('测试横幅'));

      expect(mockOpen).toHaveBeenCalledWith('/test-page', '_blank');
    });

    it('应该在不可点击时不触发点击事件', () => {
      const banner = createMockBanner({ clickable: false });
      const onBannerClick = jest.fn();

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
          onBannerClick={onBannerClick}
        />
      );

      fireEvent.click(screen.getByText('测试横幅'));

      expect(onBannerClick).not.toHaveBeenCalled();
    });
  });

  describe('横幅浏览统计', () => {
    it('应该在横幅可见时调用浏览回调', () => {
      const banner = createMockBanner();
      const onBannerView = jest.fn();

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
          onBannerView={onBannerView}
        />
      );

      expect(onBannerView).toHaveBeenCalledWith(banner);
    });

    it('应该在横幅不可见时不调用浏览回调', () => {
      const banner = createMockBanner({ enabled: false });
      const onBannerView = jest.fn();

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
          onBannerView={onBannerView}
        />
      );

      expect(onBannerView).not.toHaveBeenCalled();
    });
  });

  describe('轮播横幅组', () => {
    it('应该渲染横幅组', () => {
      const bannerGroup = createMockBannerGroup();

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      expect(screen.getByText('横幅1')).toBeInTheDocument();
    });

    it('应该显示箭头导航', () => {
      const bannerGroup = createMockBannerGroup({ showArrows: true });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      expect(screen.getByLabelText('Previous banner')).toBeInTheDocument();
      expect(screen.getByLabelText('Next banner')).toBeInTheDocument();
    });

    it('应该显示指示器', () => {
      const bannerGroup = createMockBannerGroup({ showIndicators: true });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 检查是否有指示器按钮
      const indicators = screen.getAllByLabelText(/Go to slide/);
      expect(indicators).toHaveLength(2); // 2个横幅应该有2个指示器
    });

    it('应该支持手动切换横幅', async () => {
      const bannerGroup = createMockBannerGroup({ showArrows: true });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 初始显示第一个横幅
      expect(screen.getByText('横幅1')).toBeInTheDocument();
      expect(screen.queryByText('横幅2')).not.toBeInTheDocument();

      // 点击下一个箭头
      fireEvent.click(screen.getByLabelText('Next banner'));

      // 等待动画完成
      await waitFor(() => {
        expect(screen.queryByText('横幅1')).not.toBeInTheDocument();
        expect(screen.getByText('横幅2')).toBeInTheDocument();
      });
    });

    it('应该支持指示器点击切换', async () => {
      const bannerGroup = createMockBannerGroup({ showIndicators: true });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 点击第二个指示器
      const indicators = screen.getAllByLabelText(/Go to slide/);
      fireEvent.click(indicators[1]);

      // 等待动画完成
      await waitFor(() => {
        expect(screen.getByText('横幅2')).toBeInTheDocument();
      });
    });

    it('应该支持自动轮播', async () => {
      jest.useFakeTimers();
      
      const bannerGroup = createMockBannerGroup({
        autoPlay: true,
        autoPlayInterval: 1000, // 1秒
      });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 初始显示第一个横幅
      expect(screen.getByText('横幅1')).toBeInTheDocument();

      // 推进时间到自动切换
      jest.advanceTimersByTime(1000);

      // 等待并检查是否切换到第二个横幅
      await waitFor(() => {
        expect(screen.getByText('横幅2')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('应该支持暂停/播放控制', async () => {
      jest.useFakeTimers();
      
      const bannerGroup = createMockBannerGroup({
        autoPlay: true,
        autoPlayInterval: 1000,
      });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 点击暂停按钮
      const pauseButton = screen.getByLabelText('Pause autoplay');
      fireEvent.click(pauseButton);

      // 推进时间
      jest.advanceTimersByTime(2000);

      // 检查是否仍在第一个横幅（没有自动切换）
      expect(screen.getByText('横幅1')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('应该只显示启用的横幅', () => {
      const bannerGroup = createMockBannerGroup({
        banners: [
          createMockBanner({ id: '1', titleZh: '横幅1', enabled: true, priority: 10 }),
          createMockBanner({ id: '2', titleZh: '横幅2', enabled: false, priority: 8 }),
          createMockBanner({ id: '3', titleZh: '横幅3', enabled: true, priority: 5 }),
        ],
      });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      expect(screen.getByText('横幅1')).toBeInTheDocument();
      expect(screen.getByText('横幅3')).toBeInTheDocument();
      expect(screen.queryByText('横幅2')).not.toBeTheDocument();
    });

    it('应该按优先级排序横幅', () => {
      const bannerGroup = createMockBannerGroup({
        banners: [
          createMockBanner({ id: '1', titleZh: '横幅1', enabled: true, priority: 5 }),
          createMockBanner({ id: '2', titleZh: '横幅2', enabled: true, priority: 10 }),
          createMockBanner({ id: '3', titleZh: '横幅3', enabled: true, priority: 8 }),
        ],
      });

      render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      // 优先级高的横幅应该先显示
      const firstBanner = screen.getByText('横幅2'); // 优先级10，最高
      expect(firstBanner).toBeInTheDocument();
    });

    it('应该在没有有效横幅时返回null', () => {
      const bannerGroup = createMockBannerGroup({
        banners: [
          createMockBanner({ id: '1', enabled: false }),
          createMockBanner({ id: '2', enabled: false }),
        ],
      });

      const { container } = render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('组件边界情况', () => {
    it('在没有任何横幅数据时应该返回null', () => {
      const { container } = render(
        <MarketingBanner
          language="zh"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('应该处理空横幅组', () => {
      const bannerGroup = createMockBannerGroup({ banners: [] });

      const { container } = render(
        <MarketingBanner
          bannerGroup={bannerGroup}
          language="zh"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('应该处理缺失的文本字段', () => {
      const banner = createMockBanner({
        titleZh: '', // 空标题
        titleEn: undefined, // 缺失的英文标题
      });

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
        />
      );

      expect(screen.queryByText('测试横幅')).not.toBeInTheDocument();
    });
  });

  describe('自定义样式类', () => {
    it('应该应用自定义className', () => {
      const banner = createMockBanner();

      render(
        <MarketingBanner
          banner={banner}
          language="zh"
          className="custom-class"
        />
      );

      const bannerElement = screen.getByText('测试横幅').closest('div');
      expect(bannerElement).toHaveClass('custom-class');
    });
  });
});