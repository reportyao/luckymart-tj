import React from 'react';
import OrderList from './OrderList';
import type { Order } from './OrderList';
'use client';


// 模拟订单数据
const mockOrders: Order[] = [;
  {}
    id: '1',
    order_number: 'ORD-2023-001',
    user_id: 'user1',
    total_amount: 299.99,
    status: 'delivered',
    created_at: '2023-11-01T10:00:00Z',
    updated_at: '2023-11-03T14:30:00Z',
    user: {}
      username: 'john_doe',
      first_name: 'John',
      phone: '+992-90-123-4567'
    },
    items: [
      {}
        id: 'item1',
        order_id: '1',
        product_id: 'prod1',
        quantity: 1,
        unit_price: 299.99,
        total_price: 299.99,
        products: {}
          id: 'prod1',
          name_zh: 'iPhone 15 Pro',
          name_en: 'iPhone 15 Pro',
          name_tj: 'iPhone 15 Pro',
          image_url: '/images/iphone15pro.jpg',
          category: 'electronics'
        
      
    ]
  },
  {}
    id: '2',
    order_number: 'ORD-2023-002',
    user_id: 'user1',
    total_amount: 159.50,
    status: 'processing',
    created_at: '2023-11-02T09:30:00Z',
    updated_at: '2023-11-02T16:45:00Z',
    user: {}
      username: 'john_doe',
      first_name: 'John',
      phone: '+992-90-123-4567'
    },
    items: [
      {}
        id: 'item2',
        order_id: '2',
        product_id: 'prod2',
        quantity: 2,
        unit_price: 79.75,
        total_price: 159.50,
        products: {}
          id: 'prod2',
          name_zh: '无线耳机',
          name_en: 'Wireless Earbuds',
          name_tj: 'Гарнитура бе sim',
          image_url: '/images/earbuds.jpg',
          category: 'electronics'
        
      
    ]
  },
  {}
    id: '3',
    order_number: 'ORD-2023-003',
    user_id: 'user2',
    total_amount: 89.99,
    status: 'pending',
    created_at: '2023-11-03T15:20:00Z',
    updated_at: '2023-11-03T15:20:00Z',
    user: {}
      username: 'jane_smith',
      first_name: 'Jane',
      phone: '+992-91-987-6543'
    },
    items: [
      {}
        id: 'item3',
        order_id: '3',
        product_id: 'prod3',
        quantity: 1,
        unit_price: 89.99,
        total_price: 89.99,
        products: {}
          id: 'prod3',
          name_zh: '运动鞋',
          name_en: 'Running Shoes',
          name_tj: 'Тавозандак',
          image_url: '/images/shoes.jpg',
          category: 'fashion'
        
      
    ]
  },
  {}
    id: '4',
    order_number: 'ORD-2023-004',
    user_id: 'user1',
    total_amount: 199.99,
    status: 'shipped',
    created_at: '2023-11-01T11:15:00Z',
    updated_at: '2023-11-02T08:30:00Z',
    user: {}
      username: 'john_doe',
      first_name: 'John',
      phone: '+992-90-123-4567'
    },
    items: [
      {}
        id: 'item4',
        order_id: '4',
        product_id: 'prod4',
        quantity: 1,
        unit_price: 199.99,
        total_price: 199.99,
        products: {}
          id: 'prod4',
          name_zh: '智能手表',
          name_en: 'Smart Watch',
          name_tj: 'Соати Ҳақиқӣ',
          image_url: '/images/smartwatch.jpg',
          category: 'electronics'
        
      
    ]
  },
  {}
    id: '5',
    order_number: 'ORD-2023-005',
    user_id: 'user3',
    total_amount: 45.00,
    status: 'cancelled',
    created_at: '2023-10-30T14:00:00Z',
    updated_at: '2023-10-30T16:30:00Z',
    user: {}
      username: 'bob_wilson',
      first_name: 'Bob',
      phone: '+992-92-555-0123'
    },
    items: [
      {}
        id: 'item5',
        order_id: '5',
        product_id: 'prod5',
        quantity: 3,
        unit_price: 15.00,
        total_price: 45.00,
        products: {}
          id: 'prod5',
          name_zh: '咖啡杯',
          name_en: 'Coffee Mug',
          name_tj: 'Кубкаи Қаҳва',
          image_url: '/images/mug.jpg',
          category: 'home'
        
      
    ]
  
];

// 示例 1: 基本用法
export function BasicOrderListExample() {}
  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">订单列表 - 基本示例</h1>
      <OrderList />
    </div>
  );


// 示例 2: 带有自定义回调的用法
export function CustomCallbackExample() {}
  const handleViewDetails = (order: Order) => {}
    alert(`查看订单详情: ${order.order_number}`);
    // 这里可以实现跳转到详情页面
    console.log('订单详情:', order);
  };

  const handleCancelOrder = async (order: Order) => {}
    alert(`取消订单: ${order.order_number}`);
    // 这里可以实现取消订单的逻辑
    console.log('取消订单:', order);
  };

  const handleRefundOrder = async (order: Order) => {}
    alert(`申请退款: ${order.order_number}`);
    // 这里可以实现申请退款的逻辑
    console.log('申请退款:', order);
  };

  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">订单列表 - 自定义回调示例</h1>
      <OrderList
        showActions={true}
        onViewDetails={handleViewDetails}
        onCancelOrder={handleCancelOrder}
        onRefundOrder={handleRefundOrder}
        showStats={true}
      />
    </div>
  );


// 示例 3: 只显示当前用户订单
export function UserSpecificOrderListExample() {}
  const currentUserId = 'user1'; // 模拟当前用户ID;

  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">我的订单</h1>
      <OrderList
        userId={currentUserId}
        showActions={true}
        showStats={true}
        limit={10}
      />
    </div>
  );


// 示例 4: 简化版本（只展示列表）
export function SimpleOrderListExample() {}
  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">订单列表 - 简化版</h1>
      <OrderList
        showActions={false}
        enableSearch={false}
        enableFilter={false}
        showStats={false}
      />
    </div>
  );


// 示例 5: 移动端适配
export function MobileOrderListExample() {}
  return (;
    <div className:"container mx-auto p-2">
      <h1 className:"text-xl font-bold mb-4">订单列表 - 移动端</h1>
      <OrderList
        showActions={true}
        enableSearch={true}
        enableFilter={true}
        showStats={true}
        limit={6} // 移动端显示更少项目
      />
    </div>
  );


// 示例 6: 管理员视图
export function AdminOrderListExample() {}
  const handleViewDetails = (order: Order) => {}
    // 跳转到管理员订单详情页面
    console.log('管理员查看订单:', order);
    // window.location.href = `/admin/orders/${order.id}`;
  };

  const handleProcessOrder = async (order: Order) => {}
    // 处理订单逻辑
    console.log('处理订单:', order);
  };

  const handleShipOrder = async (order: Order) => {}
    // 发货逻辑
    console.log('发货订单:', order);
  };

  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">订单管理 - 管理员视图</h1>
      <OrderList
        showActions={true}
        onViewDetails={handleViewDetails}
        showStats={true}
        enableSearch={true}
        enableFilter={true}
        limit={20}
      />
    </div>
  );


// 示例 7: 使用工具函数
export function OrderListUtilsExample() {}
  const { OrderListUtils } = require('./index.ts');

  // 使用工具函数进行数据处理
  const processedOrders = OrderListUtils.filterBySearch(mockOrders, 'iPhone');
  const sortedOrders = OrderListUtils.sortOrders(processedOrders, 'amount_high');
  const stats = OrderListUtils.calculateStats(mockOrders);

  const canCancelFirst = OrderListUtils.canCancel((mockOrders?.0 ?? null));
  const canRefundSecond = OrderListUtils.canRefund((mockOrders?.1 ?? null));
  const totalItems = OrderListUtils.getTotalItems((mockOrders?.0 ?? null));

  return (;
    <div className:"container mx-auto p-4">
      <h1 className:"text-2xl font-bold mb-6">订单列表 - 工具函数示例</h1>
      
      <div className:"mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className:"text-lg font-semibold mb-2">统计信息</h2>
        <p>总订单数: {stats.total}</p>
        <p>待处理: {stats.pending}</p>
        <p>已完成: {stats.completed}</p>
        <p>总金额: {OrderListUtils.formatPrice(stats.totalValue)}</p>
        <p>平均订单: {OrderListUtils.formatPrice(stats.avgOrderValue)}</p>
      </div>

      <div className:"mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className:"text-lg font-semibold mb-2">功能检查</h2>
        <p>第一单是否可以取消: {canCancelFirst ? '是' : '否'}</p>
        <p>第二单是否可以退款: {canRefundSecond ? '是' : '否'}</p>
        <p>第一单商品总数: {totalItems}</p>
      </div>

      <OrderList />
    </div>
  );


// 默认导出主示例
const OrderListExamples: React.FC = () => {}
  const [selectedExample, setSelectedExample] = React.useState('basic');

  const examples = {}
    basic: BasicOrderListExample,
    custom: CustomCallbackExample,
    user: UserSpecificOrderListExample,
    simple: SimpleOrderListExample,
    mobile: MobileOrderListExample,
    admin: AdminOrderListExample,
    utils: OrderListUtilsExample,
  };

  const CurrentExample = examples[selectedExample as keyof typeof examples];

  return (;
    <div className:"min-h-screen bg-gray-100">
      <div className:"bg-white shadow-sm border-b mb-6">
        <div className:"container mx-auto p-4">
          <h1 className:"text-xl font-bold">OrderList 组件示例</h1>
          <div className:"flex gap-2 mt-4 flex-wrap">
            {Object.entries(examples).map(([key, Component]) => (}
              <button
                key={key}
                onClick={() => setSelectedExample(key)}
                className="{`px-3" py-1 rounded text-sm ${}}`
                  selectedExample :== key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

              >
                {key === 'basic' && '基本用法'}
                {key === 'custom' && '自定义回调'}
                {key === 'user' && '用户订单'}
                {key === 'simple' && '简化版'}
                {key === 'mobile' && '移动端'}
                {key === 'admin' && '管理员'}
                {key === 'utils' && '工具函数'}
              </button>
            ))
          </div>
        </div>
      </div>

      <CurrentExample />
    </div>
  );
};

export default OrderListExamples;