import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderList from './OrderList';
import type { Order } from './OrderList';

// 模拟 fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// 模拟订单数据
const mockOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-2023-001',
    user_id: 'user1',
    total_amount: 299.99,
    status: 'delivered',
    created_at: '2023-11-01T10:00:00Z',
    updated_at: '2023-11-03T14:30:00Z',
    user: {
      username: 'john_doe',
      first_name: 'John',
      phone: '+992-90-123-4567'
    },
    items: [
      {
        id: 'item1',
        order_id: '1',
        product_id: 'prod1',
        quantity: 1,
        unit_price: 299.99,
        total_price: 299.99,
        products: {
          id: 'prod1',
          name_zh: 'iPhone 15 Pro',
          name_en: 'iPhone 15 Pro',
          name_tj: 'iPhone 15 Pro',
          image_url: '/images/iphone15pro.jpg',
          category: 'electronics'
        }
      }
    ]
  },
  {
    id: '2',
    order_number: 'ORD-2023-002',
    user_id: 'user1',
    total_amount: 159.50,
    status: 'pending',
    created_at: '2023-11-02T09:30:00Z',
    updated_at: '2023-11-02T16:45:00Z',
    user: {
      username: 'john_doe',
      first_name: 'John',
      phone: '+992-90-123-4567'
    },
    items: [
      {
        id: 'item2',
        order_id: '2',
        product_id: 'prod2',
        quantity: 2,
        unit_price: 79.75,
        total_price: 159.50,
        products: {
          id: 'prod2',
          name_zh: '无线耳机',
          name_en: 'Wireless Earbuds',
          name_tj: 'Гарнитура бе sim',
          image_url: '/images/earbuds.jpg',
          category: 'electronics'
        }
      }
    ]
  }
];

// 模拟 API 响应
const mockApiResponse = {
  success: true,
  data: {
    orders: mockOrders,
    totalPages: 2,
    currentPage: 1,
    totalCount: 2
  }
};

describe('OrderList Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  describe('基本渲染测试', () => {
    it('应该正确渲染订单列表组件', () => {
      render(<OrderList />);
      
      expect(screen.getByText('订单列表')).toBeInTheDocument();
      expect(screen.getByText('总订单')).toBeInTheDocument();
      expect(screen.getByText('待处理')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('应该在加载时显示加载状态', () => {
      render(<OrderList />);
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该在加载完成后显示订单数据', async () => {
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2023-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-2023-002')).toBeInTheDocument();
      });
    });
  });

  describe('搜索功能测试', () => {
    it('应该正确渲染搜索输入框', async () => {
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('搜索订单号、商品名称、用户名、电话...')).toBeInTheDocument();
      });
    });

    it('应该可以通过订单号搜索', async () => {
      const user = userEvent.setup();
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2023-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索订单号、商品名称、用户名、电话...');
      await user.type(searchInput, 'ORD-2023-001');
      
      // 等待搜索防抖
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=ORD-2023-001'),
          expect.any(Object)
        );
      }, { timeout: 500 });
    });

    it('应该可以通过商品名称搜索', async () => {
      const user = userEvent.setup();
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索订单号、商品名称、用户名、电话...');
      await user.type(searchInput, 'iPhone');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=iPhone'),
          expect.any(Object)
        );
      }, { timeout: 500 });
    });
  });

  describe('状态筛选测试', () => {
    it('应该正确渲染状态筛选按钮', async () => {
      render(<OrderList enableFilter={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('全部')).toBeInTheDocument();
        expect(screen.getByText('待支付')).toBeInTheDocument();
        expect(screen.getByText('已支付')).toBeInTheDocument();
        expect(screen.getByText('已送达')).toBeInTheDocument();
      });
    });

    it('应该可以通过状态筛选订单', async () => {
      const user = userEvent.setup();
      render(<OrderList enableFilter={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('全部')).toBeInTheDocument();
      });

      const pendingButton = screen.getByText('待支付');
      await user.click(pendingButton);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        expect.any(Object)
      );
    });
  });

  describe('排序功能测试', () => {
    it('应该正确渲染排序选择框', async () => {
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('最新创建')).toBeInTheDocument();
      });
    });

    it('应该可以通过排序选择改变排序', async () => {
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        const sortSelect = screen.getByDisplayValue('最新创建');
        fireEvent.change(sortSelect, { target: { value: 'amount_high' } });
      });
    });
  });

  describe('统计信息测试', () => {
    it('应该正确显示统计信息', async () => {
      render(<OrderList showStats={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // 总订单数
        expect(screen.getByText('1')).toBeInTheDocument(); // 待处理数
        expect(screen.getByText('1')).toBeInTheDocument(); // 已完成数
        expect(screen.getByText('459.49 TJS')).toBeInTheDocument(); // 总金额
      });
    });
  });

  describe('分页功能测试', () => {
    it('当只有一页时不应该显示分页控件', async () => {
      const singlePageResponse = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          totalPages: 1
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => singlePageResponse,
      });

      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.queryByText('上一页')).not.toBeInTheDocument();
        expect(screen.queryByText('下一页')).not.toBeInTheDocument();
      });
    });

    it('当有多页时应该显示分页控件', async () => {
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('操作按钮测试', () => {
    it('应该显示操作按钮', async () => {
      render(<OrderList showActions={true} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('查看详情')[0]).toBeInTheDocument();
        expect(screen.getAllByText('取消订单')[0]).toBeInTheDocument();
      });
    });

    it('应该调用查看详情回调', async () => {
      const mockViewDetails = jest.fn();
      const user = userEvent.setup();
      render(<OrderList showActions={true} onViewDetails={mockViewDetails} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('查看详情')[0]).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText('查看详情')[0];
      await user.click(viewButton);
      
      expect(mockViewDetails).toHaveBeenCalledWith(mockOrders[0]);
    });

    it('应该调用取消订单回调', async () => {
      const mockCancelOrder = jest.fn();
      const user = userEvent.setup();
      render(<OrderList showActions={true} onCancelOrder={mockCancelOrder} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('取消订单')[0]).toBeInTheDocument();
      });

      const cancelButton = screen.getAllByText('取消订单')[0];
      await user.click(cancelButton);
      
      expect(mockCancelOrder).toHaveBeenCalledWith(mockOrders[1]);
    });
  });

  describe('错误处理测试', () => {
    it('应该在API错误时显示错误信息', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('网络错误，请重试')).toBeInTheDocument();
      });
    });

    it('应该在API返回错误时显示错误信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: '获取订单数据失败'
        }),
      });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('获取订单数据失败')).toBeInTheDocument();
      });
    });

    it('应该可以重试加载数据', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });
      
      const { rerender } = render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('网络错误，请重试')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('重试');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2023-001')).toBeInTheDocument();
      });
    });
  });

  describe('空状态测试', () => {
    it('应该在没有订单时显示空状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orders: [],
            totalPages: 1,
            currentPage: 1,
            totalCount: 0
          }
        }),
      });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('暂无订单数据')).toBeInTheDocument();
      });
    });

    it('应该在搜索无结果时显示相应信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orders: [],
            totalPages: 1,
            currentPage: 1,
            totalCount: 0
          }
        }),
      });
      
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索订单号、商品名称、用户名、电话...');
        fireEvent.change(searchInput, { target: { value: '不存在的订单' } });
      });

      await waitFor(() => {
        expect(screen.getByText('没有找到符合条件的订单')).toBeInTheDocument();
      });
    });
  });

  describe('属性测试', () => {
    it('应该根据 userId 属性过滤订单', () => {
      render(<OrderList userId="user1" />);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('user_id=user1'),
        expect.any(Object)
      );
    });

    it('应该在禁用搜索时不显示搜索框', async () => {
      render(<OrderList enableSearch={false} />);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('搜索订单号、商品名称、用户名、电话...')).not.toBeInTheDocument();
      });
    });

    it('应该在禁用筛选时不显示筛选按钮', async () => {
      render(<OrderList enableFilter={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('全部')).not.toBeInTheDocument();
        expect(screen.queryByText('待支付')).not.toBeInTheDocument();
      });
    });

    it('应该在禁用统计时不显示统计信息', async () => {
      render(<OrderList showStats={false} />);
      
      expect(screen.queryByText('总订单')).not.toBeInTheDocument();
      expect(screen.queryByText('待处理')).not.toBeInTheDocument();
    });

    it('应该在禁用操作时不显示操作按钮', async () => {
      render(<OrderList showActions={false} />);
      
      expect(screen.queryByText('查看详情')).not.toBeInTheDocument();
      expect(screen.queryByText('取消订单')).not.toBeInTheDocument();
    });
  });

  describe('性能测试', () => {
    it('应该对搜索输入进行防抖处理', async () => {
      const user = userEvent.setup();
      jest.useFakeTimers();
      
      render(<OrderList enableSearch={true} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索订单号、商品名称、用户名、电话...');
        user.type(searchInput, 'iPhone');
        
        // 快速输入不应该立即触发搜索
        expect(mockFetch).toHaveBeenCalledTimes(1); // 只有初始加载
      
        // 等待防抖延迟
        jest.advanceTimersByTime(300);
      });

      jest.useRealTimers();
    });
  });

  describe('辅助功能测试', () => {
    it('应该正确渲染状态徽章', async () => {
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('已送达')).toBeInTheDocument();
        expect(screen.getByText('待支付')).toBeInTheDocument();
      });
    });

    it('应该正确格式化日期', async () => {
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText(/2023年11月/i)).toBeInTheDocument();
      });
    });

    it('应该正确格式化价格', async () => {
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByText('299.99 TJS')).toBeInTheDocument();
        expect(screen.getByText('159.50 TJS')).toBeInTheDocument();
      });
    });
  });
});

// 工具函数测试
describe('OrderListUtils', () => {
  const { OrderListUtils } = require('./index.ts');

  describe('formatPrice', () => {
    it('应该正确格式化价格', () => {
      expect(OrderListUtils.formatPrice(123.456)).toBe('123.46 TJS');
      expect(OrderListUtils.formatPrice(100)).toBe('100.00 TJS');
      expect(OrderListUtils.formatPrice(0)).toBe('0.00 TJS');
    });
  });

  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = '2023-11-01T10:30:00Z';
      const formatted = OrderListUtils.formatDate(date);
      expect(formatted).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    });
  });

  describe('getStatusBadge', () => {
    it('应该返回正确的状态样式', () => {
      const pendingBadge = OrderListUtils.getStatusBadge('pending');
      expect(pendingBadge).toEqual({
        color: 'bg-yellow-100 text-yellow-800',
        label: '待支付'
      });

      const deliveredBadge = OrderListUtils.getStatusBadge('delivered');
      expect(deliveredBadge).toEqual({
        color: 'bg-green-100 text-green-800',
        label: '已送达'
      });
    });

    it('应该处理未知状态', () => {
      const unknownBadge = OrderListUtils.getStatusBadge('unknown');
      expect(unknownBadge).toEqual({
        color: 'bg-gray-100 text-gray-800',
        label: '待支付'
      });
    });
  });

  describe('filterBySearch', () => {
    it('应该正确过滤订单', () => {
      const result = OrderListUtils.filterBySearch(mockOrders, 'iPhone');
      expect(result).toHaveLength(1);
      expect(result[0].order_number).toBe('ORD-2023-001');
    });

    it('应该处理空搜索条件', () => {
      const result = OrderListUtils.filterBySearch(mockOrders, '');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('filterByStatus', () => {
    it('应该按状态过滤订单', () => {
      const result = OrderListUtils.filterByStatus(mockOrders, 'pending');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('应该处理 all 状态', () => {
      const result = OrderListUtils.filterByStatus(mockOrders, 'all');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('canCancel', () => {
    it('应该正确判断订单是否可以取消', () => {
      expect(OrderListUtils.canCancel(mockOrders[1])).toBe(true); // pending
      expect(OrderListUtils.canCancel(mockOrders[0])).toBe(false); // delivered
    });
  });

  describe('canRefund', () => {
    it('应该正确判断订单是否可以退款', () => {
      expect(OrderListUtils.canRefund(mockOrders[1])).toBe(false); // pending
      expect(OrderListUtils.canRefund(mockOrders[0])).toBe(false); // delivered
    });
  });

  describe('getTotalItems', () => {
    it('应该计算订单商品总数', () => {
      const total = OrderListUtils.getTotalItems(mockOrders[1]); // 2个商品
      expect(total).toBe(2);
    });
  });

  describe('calculateStats', () => {
    it('应该计算正确的统计信息', () => {
      const stats = OrderListUtils.calculateStats(mockOrders);
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.totalValue).toBe(459.49);
    });
  });
});