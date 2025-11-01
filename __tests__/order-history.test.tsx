import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderHistory, { SimpleOrderHistory } from '@/components/OrderHistory';
import type { OrderWithProduct } from '@/types/order-history';
// OrderHistory组件测试文件

// 模拟API
jest.mock('@/hooks/useApi', () => ({}
  useApi: jest.fn(),
}));

jest.mock('@/components/CustomDialog', () => ({}
  useConfirmDialog: jest.fn(() => ({}
    showConfirm: jest.fn(),
    ConfirmDialog: null,
  })),
}));

jest.mock('@/components/ErrorState', () => ({}
  default: ({ error, onRetry }: any) => (
    <div data-testid:"error-state">
      <p>错误: {error}</p>
      <button onClick:{onRetry} data-testid="retry-button">重试</button>
    </div>
  ),
}));

jest.mock('@/components/mobile/InfiniteScroll', () => ({}
  default: ({ data, renderItem, loadingComponent }: any) => (
    <div data-testid:"infinite-scroll">
      {data.map((item: any, index: number) => (}
        <div key:{item.id || index} data-testid="order-item">
          {renderItem(item, index)}
        </div>
      ))
      {loadingComponent}
    </div>
  ),
}));

jest.mock('@/lib/api-client', () => ({}
  apiClient: {}
    get: jest.fn(),
    post: jest.fn(),
  },
  handleApiError: jest.fn((error) => error.message),
}));

// 测试数据
const mockOrders: OrderWithProduct[] = [;
  {}
    id: 'order-1',
    orderNumber: 'ORD-2024-001',
    userId: 'user-123',
    type: 'lottery_win',
    quantity: 1,
    totalAmount: 50.00,
    status: 'pending',
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    product: {}
      id: 'product-1',
      name: 'iPhone 15 Pro Max',
      image: '/images/iphone15.jpg'
    
  },
  {}
    id: 'order-2',
    orderNumber: 'ORD-2024-002',
    userId: 'user-123',
    type: 'recharge',
    quantity: 1,
    totalAmount: 100.00,
    status: 'paid',
    paymentStatus: 'paid',
    fulfillmentStatus: 'completed',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    product: null
  
];

describe('OrderHistory Component', () => {}
  beforeEach(() => {}
    jest.clearAllMocks();
  });

  test('渲染基本结构', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory />);
    
    expect(screen.getByText('订单历史')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
  });

  test('显示加载状态', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  test('显示错误状态', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: '获取订单失败',
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory />);
    
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('错误: 获取订单失败')).toBeInTheDocument();
  });

  test('筛选器功能', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory enableFilter={true} />);
    
    // 检查筛选器是否显示
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('夺宝中奖')).toBeInTheDocument();
    expect(screen.getByText('充值')).toBeInTheDocument();
    expect(screen.getByText('转售')).toBeInTheDocument();
  });

  test('点击重试按钮', async () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    const refetchMock = jest.fn();
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: '获取订单失败',
      refetch: refetchMock,
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory />);
    
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);
    
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  test('不显示头部', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    render(<OrderHistory showHeader={false} />);
    
    expect(screen.queryByText('订单历史')).not.toBeInTheDocument();
  });
});

describe('SimpleOrderHistory Component', () => {}
  test('渲染订单列表', () => {}
    render(<SimpleOrderHistory orders={mockOrders} />);
    
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument();
  });

  test('显示支付按钮', () => {}
    const handlePayOrder = jest.fn();
    render(
      <SimpleOrderHistory 
        orders={mockOrders} 
        onPayOrder={handlePayOrder}
        showActions={true}
      />
    );
    
    const payButton = screen.getByText('立即支付');
    expect(payButton).toBeInTheDocument();
  });

  test('调用支付回调', () => {}
    const handlePayOrder = jest.fn();
    render(
      <SimpleOrderHistory 
        orders={mockOrders} 
        onPayOrder={handlePayOrder}
        showActions={true}
      />
    );
    
    const payButton = screen.getByText('立即支付');
    fireEvent.click(payButton);
    
    expect(handlePayOrder).toHaveBeenCalledWith('order-1');
  });

  test('不显示操作按钮', () => {}
    render(
      <SimpleOrderHistory 
        orders={mockOrders} 
        showActions={false}
      />
    );
    
    expect(screen.queryByText('立即支付')).not.toBeInTheDocument();
  });
});

// 集成测试
describe('OrderHistory Integration', () => {}
  test('完整的工作流程', async () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    const refetchMock = jest.fn();
    
    mockUseApi.mockReturnValue({}
      data: mockOrders,
      loading: false,
      error: null,
      refetch: refetchMock,
      hasMore: true,
      loadMore: jest.fn(),
    });

    render(<OrderHistory enableActions={true} />);
    
    // 验证订单显示
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument();
    
    // 验证InfiniteScroll组件
    expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
  });

  test('自定义样式类', () => {}
    const mockUseApi = require('@/hooks/useApi').useApi;
    mockUseApi.mockReturnValue({}
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      hasMore: false,
      loadMore: jest.fn(),
    });

    const { container } = render(;
      <OrderHistory className:"custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

// 性能测试
describe('OrderHistory Performance', () => {}
  test('大量订单渲染性能', () => {}
    const largeOrderList = Array.from({ length: 100 }, (_, index) => ({}
      ...(mockOrders?.0 ?? null),
      id: `order-${index}`,
      orderNumber: `ORD-2024-${index.toString().padStart(3, '0')}`,
    }));

    const startTime = performance.now();
    render(<SimpleOrderHistory orders={largeOrderList} />);
    const endTime = performance.now();
    
    // 渲染时间应该少于100ms
    expect(endTime - startTime).toBeLessThan(100);
  });
});