// 自动开奖定时任务
// 每5分钟检查一次是否有已售罄的夺宝期次需要开奖

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface DrawResult {
  winningNumber: number;
  A: number;
  B: number;
  hashA: string;
  hashB: string;
  totalShares: number;
  timestamp: string;
}

// 开奖算法：SHA256哈希算法
async function calculateWinningNumber(
  participationIds: string[],
  productId: string,
  totalShares: number
): Promise<DrawResult> {
  const encoder = new TextEncoder();
  
  // 计算A：所有参与记录ID的哈希
  const idsString = participationIds.sort().join('');
  const hashABuffer = await crypto.subtle.digest('SHA-256', encoder.encode(idsString));
  const hashAArray = Array.from(new Uint8Array(hashABuffer));
  const hashA = hashAArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const A = parseInt(hashA.substring(0, 8), 16);
  
  // 计算B：商品ID + 当前时间戳的哈希
  const timestamp = new Date().toISOString();
  const hashBBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${productId}${timestamp}`));
  const hashBArray = Array.from(new Uint8Array(hashBBuffer));
  const hashB = hashBArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const B = parseInt(hashB.substring(0, 8), 16);
  
  // 计算中奖号码
  const winningNumber = ((A + B) % totalShares) + 10000001;
  
  return {
    winningNumber,
    A,
    B,
    hashA,
    hashB,
    totalShares,
    timestamp
  };
}

// 查找中奖用户
function findWinner(
  participations: Array<{ user_id: string; numbers: number[] }>,
  winningNumber: number
): string | null {
  for (const participation of participations) {
    if (participation.numbers && participation.numbers.includes(winningNumber)) {
      return participation.user_id;
    }
  }
  return null;
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
    console.log('[Auto Draw] 开始检查需要开奖的期次...');

    // 查询已售罄的活跃期次
    const { data: fullRounds, error: queryError } = await supabase
      .from('lottery_rounds')
      .select(`
        *,
        product:products(*),
        participations(*)
      `)
      .eq('status', 'active')
      .gte('sold_shares', supabase.raw('total_shares'))
      .order('created_at', { ascending: true })
      .limit(10);

    if (queryError) throw queryError;

    if (!fullRounds || fullRounds.length === 0) {
      console.log('[Auto Draw] 没有需要开奖的期次');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '没有需要开奖的期次',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Auto Draw] 找到 ${fullRounds.length} 个需要开奖的期次`);

    let processedCount = 0;
    const results = [];

    for (const round of fullRounds) {
      try {
        console.log(`[Auto Draw] 处理期次 ${round.id} (第${round.round_number}期)...`);

        if (!round.participations || round.participations.length === 0) {
          console.log(`[Auto Draw] 期次 ${round.id} 无参与记录，跳过`);
          continue;
        }

        // 执行开奖算法
        const participationIds = round.participations.map((p: any) => p.id);
        const drawResult = await calculateWinningNumber(
          participationIds,
          round.product_id,
          round.total_shares
        );

        console.log(`[Auto Draw] 中奖号码: ${drawResult.winningNumber}`);

        // 查找中奖用户
        const winnerUserId = findWinner(round.participations, drawResult.winningNumber);

        if (!winnerUserId) {
          console.error(`[Auto Draw] 未找到中奖用户，期次 ${round.id}`);
          continue;
        }

        console.log(`[Auto Draw] 中奖用户: ${winnerUserId}`);

        // 更新轮次状态
        const { error: updateError } = await supabase
          .from('lottery_rounds')
          .update({
            status: 'completed',
            winner_user_id: winnerUserId,
            winning_number: drawResult.winningNumber,
            draw_time: new Date().toISOString(),
            draw_algorithm_data: drawResult
          })
          .eq('id', round.id);

        if (updateError) {
          console.error(`[Auto Draw] 更新轮次失败:`, updateError);
          continue;
        }

        // 标记中奖参与记录
        const { error: partError } = await supabase
          .from('participations')
          .update({ is_winner: true })
          .eq('round_id', round.id)
          .eq('user_id', winnerUserId)
          .contains('numbers', [drawResult.winningNumber]);

        if (partError) console.error('[Auto Draw] 更新参与记录失败:', partError);

        // 创建中奖订单
        const orderNumber = `LM${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
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
              drawTime: drawResult.timestamp
            })
          });

        if (orderError) console.error('[Auto Draw] 创建订单失败:', orderError);

        // 记录交易
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: winnerUserId,
            type: 'lottery_win',
            amount: round.product.market_price,
            balance_type: 'platform_balance',
            description: `恭喜中奖：${round.product.name_zh} - 第${round.round_number}期，中奖号码 ${drawResult.winningNumber}`
          });

        if (txError) console.error('[Auto Draw] 创建交易记录失败:', txError);

        // 发送通知
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: winnerUserId,
            type: 'lottery_won',
            content: `恭喜您在第 ${round.round_number} 期夺宝中中奖！中奖号码：${drawResult.winningNumber}，请尽快填写收货地址。`,
            status: 'pending'
          });

        if (notifError) console.error('[Auto Draw] 发送通知失败:', notifError);

        processedCount++;
        results.push({
          roundId: round.id,
          roundNumber: round.round_number,
          productName: round.product.name_zh,
          winnerId: winnerUserId,
          winningNumber: drawResult.winningNumber
        });

        console.log(`[Auto Draw] 期次 ${round.id} 开奖完成 ✅`);

      } catch (error) {
        console.error(`[Auto Draw] 处理期次 ${round.id} 失败:`, error);
      }
    }

    console.log(`[Auto Draw] 处理完成，共开奖 ${processedCount} 个期次`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功开奖 ${processedCount} 个期次`,
        processed: processedCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Auto Draw] 错误:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
