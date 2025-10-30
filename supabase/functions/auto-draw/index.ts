// 自动开奖定时任务 - 优化版本
// 每1分钟检查一次是否有已售罄的夺宝期次需要开奖
// 增加了实时监控、错误处理和数据一致性检查

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface DrawResult {
  winningNumber: number;
  algorithmVersion: string;
  seed: string;
  participationHash: string;
  totalParticipants: number;
  timestamp: string;
  winnerUserId: string;
}

// 开奖算法：增强版安全VRF
async function calculateSecureWinningNumber(
  participationIds: string[],
  productId: string,
  roundId: string,
  totalShares: number
): Promise<DrawResult> {
  const encoder = new TextEncoder();
  
  // 生成系统级随机熵
  const systemEntropy = crypto.getRandomValues(new Uint8Array(32));
  const entropyHex = Array.from(systemEntropy).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 排序参与ID确保一致性
  const sortedIds = participationIds.sort();
  const participationHashData = sortedIds.join('') + entropyHex;
  
  // 计算参与数据哈希
  const participationHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(participationHashData));
  const participationHash = Array.from(new Uint8Array(participationHashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 生成安全种子
  const seedData = {
    roundId,
    productId,
    participationHash,
    entropy: entropyHex,
    timestamp: new Date().toISOString(),
    version: '3.0-secure-vrf'
  };
  
  const seedString = JSON.stringify(seedData);
  const seedHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedString));
  const seed = Array.from(new Uint8Array(seedHashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 使用HKDF导出伪随机函数密钥
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(seed),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // 生成最终随机数
  const prkBuffer = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode('lottery-vrf-key'));
  const finalHashBuffer = await crypto.subtle.digest('SHA-256', prkBuffer);
  const finalHashArray = new Uint8Array(finalHashBuffer);
  
  // 转换为大整数
  const hashHex = Array.from(finalHashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashBigInt = BigInt('0x' + hashHex);
  
  // 计算中奖号码
  const winningNumber = Number(hashBigInt % BigInt(totalShares)) + 10000001;
  
  return {
    winningNumber,
    algorithmVersion: '3.0-secure-vrf',
    seed: seed.substring(0, 32), // 保存前32位
    participationHash,
    totalParticipants: participationIds.length,
    timestamp: new Date().toISOString(),
    winnerUserId: '' // 将在后续步骤中确定
  };
}

// 查找中奖用户
async function findWinner(
  roundId: string,
  winningNumber: number
): Promise<string | null> {
  const { data: participations, error } = await supabase
    .from('participations')
    .select('user_id, numbers')
    .eq('round_id', roundId);
  
  if (error || !participations) {
    console.error('[Auto Draw] 查询参与记录失败:', error);
    return null;
  }

  for (const participation of participations) {
    if (participation.numbers && participation.numbers.includes(winningNumber)) {
      return participation.user_id;
    }
  }
  
  return null;
}

// 验证期次完整性
async function validateRound(roundId: string): Promise<{
  isValid: boolean;
  error?: string;
  round?: any;
  participations?: any[];
}> {
  try {
    // 获取期次信息
    const { data: round, error: roundError } = await supabase
      .from('lottery_rounds')
      .select('*')
      .eq('id', roundId)
      .single();
    
    if (roundError || !round) {
      return { isValid: false, error: '期次不存在' };
    }
    
    // 验证状态
    if (round.status !== 'full') {
      return { isValid: false, error: `期次状态不正确: ${round.status}` };
    }
    
    // 验证是否已开奖
    if (round.status === 'completed' || round.winner_user_id) {
      return { isValid: false, error: '期次已经开奖' };
    }
    
    // 获取参与记录
    const { data: participations, error: partError } = await supabase
      .from('participations')
      .select('*')
      .eq('round_id', roundId);
    
    if (partError || !participations || participations.length === 0) {
      return { isValid: false, error: '无参与记录' };
    }
    
    // 验证售罄状态
    const totalSoldShares = participations.reduce((sum, p) => sum + p.shares_count, 0);
    if (totalSoldShares < round.total_shares) {
      return { isValid: false, error: `期次未售罄: ${totalSoldShares}/${round.total_shares}` };
    }
    
    // 验证份额总数
    const totalAssignedNumbers = participations.reduce((sum, p) => sum + p.shares_count, 0);
    if (totalAssignedNumbers !== round.total_shares) {
      return { isValid: false, error: `份额分配不匹配: ${totalAssignedNumbers}/${round.total_shares}` };
    }
    
    return { 
      isValid: true, 
      round, 
      participations 
    };
    
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

// 原子性更新期次状态
async function updateRoundAtomically(
  roundId: string, 
  winnerUserId: string, 
  winningNumber: number, 
  drawResult: DrawResult
): Promise<boolean> {
  try {
    // 使用条件更新确保原子性
    const { data, error } = await supabase
      .from('lottery_rounds')
      .update({
        status: 'completed',
        winner_user_id: winnerUserId,
        winning_number: winningNumber,
        draw_time: new Date().toISOString(),
        draw_algorithm_data: drawResult
      })
      .eq('id', roundId)
      .eq('status', 'full') // 确保更新前状态仍为full
      .is('winner_user_id', null); // 确保未设置中奖者
    
    if (error) {
      console.error('[Auto Draw] 原子性更新失败:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('[Auto Draw] 更新期次异常:', error);
    return false;
  }
}

// 记录审计日志
async function logDrawAudit(roundId: string, type: string, data: any) {
  try {
    const auditLog = {
      round_id: roundId,
      event_type: type,
      event_data: JSON.stringify(data),
      created_at: new Date().toISOString()
    };
    
    // 记录到notifications表作为审计日志
    await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // 系统用户
        type: 'system_audit',
        content: `开奖审计: ${type} - 期次: ${roundId}`,
        status: 'sent',
        error: null,
        sent_at: new Date().toISOString()
      });
      
    console.log(`[DrawAudit] 记录事件: ${type} - ${roundId}`);
  } catch (error) {
    console.error('[DrawAudit] 记录审计日志失败:', error);
  }
}

Deno.serve(async (_req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (_req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[Auto Draw] 开始检查需要开奖的期次...', new Date().toISOString());

    // 查找已售罄的期次（优化版本）
    const { data: fullRounds, error: queryError } = await supabase
      .from('lottery_rounds')
      .select('*')
      .eq('status', 'full')
      .is('winner_user_id', null) // 确保未开奖
      .order('created_at', { ascending: true })
      .limit(20); // 增加处理数量

    if (queryError) {
      console.error('[Auto Draw] 查询期次失败:', queryError);
      throw queryError;
    }

    if (!fullRounds || fullRounds.length === 0) {
      console.log('[Auto Draw] 没有需要开奖的期次');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '没有需要开奖的期次',
          processed: 0,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Auto Draw] 找到 ${fullRounds.length} 个需要开奖的期次`);

    let processedCount = 0;
    const results = [];
    const errors = [];

    // 并发处理多个期次（限制并发数避免过载）
    const concurrencyLimit = 3;
    const chunks = [];
    for (let i = 0; i < fullRounds.length; i += concurrencyLimit) {
      chunks.push(fullRounds.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (round) => {
        try {
          console.log(`[Auto Draw] 开始处理期次 ${round.id} (第${round.round_number}期)...`);

          // 验证期次完整性
          const validation = await validateRound(round.id);
          if (!validation.isValid) {
            console.log(`[Auto Draw] 期次 ${round.id} 验证失败: ${validation.error}`);
            await logDrawAudit(round.id, 'validation_failed', { error: validation.error });
            return { 
              roundId: round.id, 
              success: false, 
              error: validation.error 
            };
          }

          const participationIds = validation.participations!.map((p: any) => p.id);
          
          // 执行安全开奖算法
          const drawResult = await calculateSecureWinningNumber(
            participationIds,
            round.product_id,
            round.id,
            round.total_shares
          );

          // 查找中奖用户
          const winnerUserId = await findWinner(round.id, drawResult.winningNumber);
          
          if (!winnerUserId) {
            const errorMsg = `未找到中奖用户，期次: ${round.id}, 号码: ${drawResult.winningNumber}`;
            console.error(`[Auto Draw] ${errorMsg}`);
            await logDrawAudit(round.id, 'no_winner_found', { 
              winningNumber: drawResult.winningNumber,
              participationCount: participationIds.length
            });
            return { 
              roundId: round.id, 
              success: false, 
              error: errorMsg 
            };
          }

          // 原子性更新期次状态
          const updateSuccess = await updateRoundAtomically(
            round.id,
            winnerUserId,
            drawResult.winningNumber,
            drawResult
          );

          if (!updateSuccess) {
            const errorMsg = `期次可能已被其他进程处理: ${round.id}`;
            console.log(`[Auto Draw] ${errorMsg}`);
            return { 
              roundId: round.id, 
              success: false, 
              error: errorMsg 
            };
          }

          // 标记中奖参与记录
          const { error: partError } = await supabase
            .from('participations')
            .update({ is_winner: true })
            .eq('round_id', round.id)
            .eq('user_id', winnerUserId);

          if (partError) {
            console.error('[Auto Draw] 更新参与记录失败:', partError);
            // 不影响主流程，继续执行
          }

          // 创建中奖订单
          const orderNumber = `LM${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('name_zh, market_price')
            .eq('id', round.product_id)
            .single();

          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              user_id: winnerUserId,
              round_id: round.id,
              product_id: round.product_id,
              type: 'lottery_win',
              total_amount: 0,
              payment_status: 'paid',
              fulfillment_status: 'pending',
              quantity: 1,
              status: 'pending',
              notes: JSON.stringify({
                roundNumber: round.round_number,
                winningNumber: drawResult.winningNumber,
                drawTime: drawResult.timestamp,
                algorithmVersion: drawResult.algorithmVersion
              })
            });

          if (orderError) {
            console.error('[Auto Draw] 创建订单失败:', orderError);
            // 不影响主流程，继续执行
          }

          // 记录中奖交易
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: winnerUserId,
              type: 'lottery_win',
              amount: product?.market_price || 0,
              balance_type: 'platform_balance',
              description: `恭喜中奖：${product?.name_zh || '商品'} - 第${round.round_number}期，中奖号码 ${drawResult.winningNumber}`
            });

          if (txError) {
            console.error('[Auto Draw] 创建交易记录失败:', txError);
          }

          // 发送中奖通知
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: winnerUserId,
              type: 'lottery_win',
              content: `🎉 恭喜您在第 ${round.round_number} 期夺宝中获胜！\n中奖号码：${drawResult.winningNumber}\n请尽快填写收货地址。`,
              status: 'pending'
            });

          if (notifError) {
            console.error('[Auto Draw] 发送通知失败:', notifError);
          }

          // 记录成功审计日志
          await logDrawAudit(round.id, 'draw_completed', {
            winnerUserId,
            winningNumber: drawResult.winningNumber,
            orderNumber,
            participationCount: participationIds.length,
            algorithmVersion: drawResult.algorithmVersion
          });

          processedCount++;
          const result = {
            roundId: round.id,
            roundNumber: round.round_number,
            productName: product?.name_zh || '未知商品',
            winnerId: winnerUserId,
            winningNumber: drawResult.winningNumber,
            orderNumber,
            participationCount: participationIds.length,
            processedAt: new Date().toISOString()
          };

          console.log(`[Auto Draw] 期次 ${round.id} 开奖完成 ✅`, result);

          return { 
            roundId: round.id, 
            success: true, 
            ...result 
          };

        } catch (error) {
          const errorMsg = error.message;
          console.error(`[Auto Draw] 处理期次 ${round.id} 失败:`, error);
          
          errors.push({
            roundId: round.id,
            error: errorMsg,
            timestamp: new Date().toISOString()
          });
          
          await logDrawAudit(round.id, 'draw_failed', { 
            error: errorMsg,
            stack: error.stack 
          });
          
          return { 
            roundId: round.id, 
            success: false, 
            error: errorMsg 
          };
        }
      });

      // 等待当前批次完成
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // 批次间短暂延迟
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const summary = {
      totalFound: fullRounds.length,
      processed: processedCount,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errors: errors.length,
      timestamp: new Date().toISOString()
    };

    console.log(`[Auto Draw] 处理完成:`, summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功开奖 ${processedCount} 个期次`,
        processed: processedCount,
        summary,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Auto Draw] 系统错误:', error);
    
    // 记录系统错误
    await logDrawAudit('system', 'system_error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
