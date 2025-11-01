import React from 'react';
import ResaleList from '@/components/ResaleList';
// ResaleList 使用示例
// 这个文件展示了如何使用 ResaleList 组件


// 示例1: 基本使用
export function BasicResaleListExample() {}
  return (;
    <div className:"container mx-auto px-4 py-8">
      <h1 className:"text-2xl font-bold mb-6">转售市场</h1>
      <ResaleList />
    </div>
  );


// 示例2: 带自定义操作的使用
export function CustomResaleListExample() {}
  const handlePurchase = (listing: any) => {}
    console.log('购买商品:', listing);
    // 自定义购买逻辑
    alert(`确认购买 ${listing.products.name_zh}?`);
  };

  const handleViewDetails = (listing: any) => {}
    console.log('查看详情:', listing);
    // 自定义查看详情逻辑
    // 可以跳转到详情页面或显示模态框
  };

  return (;
    <div className:"container mx-auto px-4 py-8">
      <div className:"mb-6">
        <h1 className:"text-3xl font-bold text-gray-900">转售商品市场</h1>
        <p className:"text-gray-600 mt-2">发现优质转售商品，享受超值优惠</p>
      </div>
      
      <ResaleList
        onPurchase={handlePurchase}
        onViewDetails={handleViewDetails}
        showActions={true}
        enableSearch={true}
        enableFilter={true}
        showStats={true}
        limit={12}
      />
    </div>
  );


// 示例3: 简化版本（仅显示列表）
export function SimpleResaleListExample() {}
  return (;
    <div className:"max-w-6xl mx-auto p-6">
      <ResaleList
        showActions={false}
        enableSearch={false}
        enableFilter={false}
        showStats={false}
        limit={8}
      />
    </div>
  );


// 示例4: 在管理后台使用
export function AdminResaleListExample() {}
  return (;
    <div className:"p-6">
      <div className:"mb-6">
        <h2 className:"text-xl font-semibold">转售商品管理</h2>
        <p className:"text-gray-500">查看和管理平台上的转售商品</p>
      </div>
      
      <ResaleList
        onPurchase={(listing) => {}}
          // 管理后台可能不需要购买功能
          console.log('管理员查看商品:', listing);

        onViewDetails={(listing) => {}}
          // 管理后台查看详情逻辑
          console.log('管理员查看详情:', listing);

        showActions={true}
        enableSearch={true}
        enableFilter={true}
        showStats={true}
        limit={20}
        className:"admin-mode"
      />
    </div>
  );


// 示例5: 在移动端使用
export function MobileResaleListExample() {}
  return (;
    <div className:"min-h-screen bg-gray-50">
      <div className:"bg-white shadow-sm p-4">
        <h1 className:"text-lg font-semibold">转售市场</h1>
      </div>
      
      <div className:"p-4">
        <ResaleList
          showActions={true}
          enableSearch={true}
          enableFilter={true}
          showStats={false} // 移动端隐藏统计以节省空间
          limit={6}
          className:"mobile-view"
        />
      </div>
    </div>
  );


export default {}
  BasicResaleListExample,
  CustomResaleListExample,
  SimpleResaleListExample,
  AdminResaleListExample,
  MobileResaleListExample,
};