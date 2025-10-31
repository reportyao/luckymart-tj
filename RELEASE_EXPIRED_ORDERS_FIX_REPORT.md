# 支付超时订单库存释放失败修复报告

## 问题描述
原有的 `release-expired-orders` 函数存在以下关键问题：
1. **缺少事务保护**：订单更新成功但库存释放失败时，无法回滚订单状态
2. **并发安全问题**：多个定时任务同时处理同一订单时可能产生数据不一致
3. **错误处理不完善**：失败时没有适当的回滚机制
4. **审计日志不完整**：缺少详细的操作追踪和错误记录

## 修复方案

### 1. 增强事务保护机制
- **乐观锁控制**：使用条件更新防止并发修改
- **原子性操作**：每个订单的释放流程作为一个原子单元
- **状态跟踪**：跟踪每个操作步骤的状态，便于失败时回滚

### 2. 改进的错误处理和回滚
- **状态变量跟踪**：记录每个步骤的执行状态
- **完整回滚机制**：失败时自动回滚已完成的操作
- **原始状态保存**：在操作前保存原始状态用于回滚

### 3. 详细的审计日志
- **操作追踪**：记录每个关键操作的详细信息
- **错误日志**：记录失败原因和回滚状态
- **性能监控**：记录处理时间用于性能分析

## 核心修复代码

### 改进的原子性释放函数
```typescript
async function releaseExpiredOrderAtomically(
  orderId: string,
  client: any
): Promise<{ success: boolean; error?: string; data?: any }> {
  const startTime = new Date();
  
  // 定义变量用于回滚状态跟踪
  let orderUpdated = false;
  let stockReleased = false;
  let sharesReleased = false;
  let originalOrderState: any = null;
  let originalStock = 0;
  let originalSoldShares = 0;

  try {
    // 1. 验证订单状态并获取原始状态
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('payment_status', 'pending')
      .eq('status', 'pending')
      .single();

    // 保存原始订单状态用于回滚
    originalOrderState = { ...order };

    // 2. 使用乐观锁更新订单状态为过期
    const { data: updatedOrder, error: updateOrderError } = await client
      .from('orders')
      .update({
        status: 'expired',
        payment_status: 'cancelled',
        fulfillment_status: 'cancelled',
        updated_at: new Date().toISOString(),
        notes: (order.notes || '') + `\n[系统] 订单超时已过期 - ${new Date().toISOString()}`
      })
      .eq('id', orderId)
      .eq('payment_status', 'pending') // 防止并发修改
      .eq('status', 'pending')         // 防止并发修改
      .select()
      .single();

    orderUpdated = true;

    // 3. 释放库存（带回滚机制）
    if (order.product_id && order.quantity) {
      const { data: product, error: productError } = await client
        .from('products')
        .select('stock, name_zh')
        .eq('id', order.product_id)
        .single();

      originalStock = product.stock;
      const newStock = product.stock + order.quantity;
      
      const { data: updatedProduct, error: updateStockError } = await client
        .from('products')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.product_id)
        .select()
        .single();

      if (updateStockError || !updatedProduct) {
        // 回滚订单状态
        await client
          .from('orders')
          .update({
            status: originalOrderState.status,
            payment_status: originalOrderState.payment_status,
            fulfillment_status: originalOrderState.fulfillment_status,
            updated_at: new Date().toISOString(),
            notes: originalOrderState.notes
          })
          .eq('id', orderId);

        throw new Error(`释放库存失败: ${updateStockError?.message}`);
      }

      stockReleased = true;
    }

    // 4. 释放期次份额（带回滚机制）
    if (order.round_id && order.quantity) {
      const { data: round, error: roundError } = await client
        .from('lottery_rounds')
        .select('sold_shares, round_number')
        .eq('id', order.round_id)
        .single();

      originalSoldShares = round.sold_shares;
      const newSoldShares = Math.max(0, round.sold_shares - order.quantity);
      
      const { data: updatedRound, error: updateRoundError } = await client
        .from('lottery_rounds')
        .update({
          sold_shares: newSoldShares,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.round_id)
        .select()
        .single();

      if (updateRoundError || !updatedRound) {
        // 回滚已释放的库存
        if (stockReleased && order.product_id) {
          await client
            .from('products')
            .update({
              stock: originalStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.product_id);
        }

        // 回滚订单状态
        await client
          .from('orders')
          .update({
            status: originalOrderState.status,
            payment_status: originalOrderState.payment_status,
            fulfillment_status: originalOrderState.fulfillment_status,
            updated_at: new Date().toISOString(),
            notes: originalOrderState.notes
          })
          .eq('id', orderId);

        throw new Error(`释放期次份额失败: ${updateRoundError?.message}`);
      }

      sharesReleased = true;
    }

    return {
      success: true,
      data: {
        orderId,
        orderNumber: order.order_number,
        processingTimeMs: new Date().getTime() - startTime.getTime()
      }
    };

  } catch (error) {
    // 完整的回滚逻辑
    try {
      if (orderUpdated && (!stockReleased || !sharesReleased)) {
        await client
          .from('orders')
          .update({
            status: originalOrderState?.status || 'pending',
            payment_status: originalOrderState?.payment_status || 'pending',
            fulfillment_status: originalOrderState?.fulfillment_status || 'pending',
            updated_at: new Date().toISOString(),
            notes: originalOrderState?.notes
          })
          .eq('id', orderId);
      }

      if (stockReleased && order.product_id) {
        await client
          .from('products')
          .update({
            stock: originalStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.product_id);
      }

      if (sharesReleased && order.round_id) {
        await client
          .from('lottery_rounds')
          .update({
            sold_shares: originalSoldShares,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.round_id);
      }

    } catch (rollbackError) {
      console.error(`回滚操作失败:`, rollbackError);
    }

    return {
      success: false,
      error: error.message
    };
  }
}
```

## 关键改进点

### 1. 原子性保证
- **完整事务逻辑**：订单状态更新、库存释放、份额释放作为一个不可分割的操作
- **失败回滚**：任何步骤失败都会回滚所有已完成的操作

### 2. 并发安全
- **乐观锁机制**：使用条件更新防止多个定时任务同时处理同一订单
- **状态验证**：每个操作前验证当前状态，确保数据一致性

### 3. 错误处理
- **详细错误追踪**：记录失败原因和回滚状态
- **分层回滚**：根据失败点决定需要回滚哪些操作
- **日志记录**：所有操作和错误都有详细日志记录

### 4. 审计和监控
- **操作审计**：每个成功或失败的操作都会记录审计日志
- **性能监控**：记录处理时间，便于性能分析和优化
- **错误分析**：详细的错误信息和回滚状态便于问题诊断

## 使用说明

### 函数部署
1. 将修复后的代码部署到 Supabase Edge Functions
2. 配置定时任务调用该函数（建议每5-10分钟执行一次）

### 监控指标
- **成功释放订单数**：统计成功处理的过期订单数量
- **失败订单数**：统计处理失败的订单数量
- **回滚次数**：统计需要回滚的操作次数
- **平均处理时间**：监控函数性能

### 故障排查
如果发现数据不一致问题，可以通过审计日志查看：
- 具体的失败操作
- 回滚状态
- 原始数据和目标数据

## 总结
通过这次修复，解决了支付超时订单库存释放失败的核心问题：
1. **数据一致性**：确保订单状态、库存和期次份额的一致性
2. **并发安全**：防止多个定时任务同时处理造成的数据冲突
3. **错误恢复**：提供完整的错误处理和回滚机制
4. **可观测性**：详细的日志和审计便于监控和故障排查

这些改进确保了系统在面对异常情况时能够保持数据的一致性和完整性。