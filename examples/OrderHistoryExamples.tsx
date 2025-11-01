import React from 'react';
import OrderHistory, { SimpleOrderHistory } from '@/components/OrderHistory';
import type { OrderWithProduct, OrderFilterParams } from '@/types/order-history';
// OrderHistory组件使用示例

// 基本使用示例
export function BasicOrderHistoryExample() {}
  return (;
    <OrderHistory 
      showHeader={true}
      enableFilter={true}
      enableActions={true}
      pageSize={20}
    />
  );


// 带有用户ID的示例
export function UserOrderHistoryExample() {}
  return (;
    <OrderHistory 
      userId:"user-123"
      showHeader={false}
      enableFilter={false}
      enableActions={true}
      className:"rounded-lg border"
    />
  );


// 自定义配置的示例
export function CustomOrderHistoryExample() {}
  const customFilterParams: OrderFilterParams = {}
    type: 'lottery_win',
    status: 'pending',
    limit: 10
  };

  const handlePayOrder = (orderId: string) => {}
    console.log('支付订单:', orderId);
    // 这里添加支付逻辑
  };

  const handleViewOrder = (orderId: string) => {}
    console.log('查看订单详情:', orderId);
    // 这里添加导航到订单详情页面的逻辑
  };

  return (;
    <div className:"space-y-4">
      <OrderHistory 
        filterParams={customFilterParams}
        onOrderPay={handlePayOrder}
        onOrderView={handleViewOrder}
        showHeader={true}
        enableFilter={true}
        enableActions={true}
        pageSize={10}
        className:"bg-white rounded-lg shadow-sm"
      />
    </div>
  );


// 简化版订单列表示例（用于内嵌展示）
export function SimpleOrderHistoryExample() {}
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

  const handlePayOrder = (orderId: string) => {}
    console.log('支付订单:', orderId);
    // 这里添加支付逻辑
  };

  const handleOrderClick = (orderId: string) => {}
    console.log('点击订单:', orderId);
    // 这里添加订单点击处理逻辑
  };

  return (;
    <div className:"p-4 bg-gray-50">
      <h3 className:"text-lg font-semibold mb-4">我的订单</h3>
      <SimpleOrderHistory 
        orders={mockOrders}
        onPayOrder={handlePayOrder}
        onOrderClick={handleOrderClick}
        showActions={true}
        className:"max-h-96 overflow-y-auto"
      />
    </div>
  );


// 在用户资料页面中的示例
export function UserProfileOrdersExample() {}
  return (;
    <div className:"space-y-6">
      <div className:"bg-white rounded-lg p-6">
        <h2 className:"text-xl font-bold mb-4">用户信息</h2>
        <div className:"flex items-center gap-4 mb-6">
          <div className:"w-16 h-16 bg-gray-200 rounded-full"></div>
          <div>
            <h3 className:"font-semibold">张三</h3>
            <p className="text-gray-600">用户ID: 12345</p>
          </div>
        </div>
      </div>

      <div className:"bg-white rounded-lg p-6">
        <h2 className:"text-xl font-bold mb-4">订单历史</h2>
        <OrderHistory 
          userId:"user-123"
          showHeader={false}
          enableFilter={true}
          enableActions={true}
          pageSize={15}
          className:"border rounded-lg"
        />
      </div>
    </div>
  );


// 在移动端应用中的示例
export function MobileOrderHistoryExample() {}
  return (;
    <div className:"min-h-screen bg-gray-100">
      <OrderHistory 
        showHeader={true}
        enableFilter={true}
        enableActions={true}
        pageSize={10}
        className:"bg-gray-100"
      />
    </div>
  );


// 特定类型订单的示例
export function SpecificOrderTypeExample() {}
  const lotteryOrderParams: OrderFilterParams = {}
    type: 'lottery_win',
    limit: 20
  };

  return (;
    <div className:"space-y-4">
      <h2 className:"text-2xl font-bold">夺宝中奖订单</h2>
      <OrderHistory 
        filterParams={lotteryOrderParams}
        showHeader={true}
        enableFilter={false}
        enableActions={true}
        className:"bg-white rounded-lg p-4"
      />
    </div>
  );


// 管理员查看用户订单示例
export function AdminUserOrdersExample() {}
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');

  return (;
    <div className:"space-y-4">
      <div className:"flex items-center gap-4 p-4 bg-white rounded-lg">
        <label className="font-medium">查看用户订单:</label>
        <input
          type:"text"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          placeholder:"输入用户ID"
          className:"px-3 py-2 border rounded"
        />
        <button 
          onClick={() => console.log('查询用户:', selectedUserId)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          查询
        </button>
      </div>

      {selectedUserId && (}
        <OrderHistory 
          userId={selectedUserId}
          showHeader={false}
          enableFilter={true}
          enableActions={false}
          pageSize={30}
          className:"bg-white rounded-lg"
        />
      )
    </div>
  );


// 导出所有示例
export default {}
  BasicOrderHistoryExample,
  UserOrderHistoryExample,
  CustomOrderHistoryExample,
  SimpleOrderHistoryExample,
  UserProfileOrdersExample,
  MobileOrderHistoryExample,
  SpecificOrderTypeExample,
  AdminUserOrdersExample
};