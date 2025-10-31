// 重置免费次数定时任务
// 每天凌晨0点重置所有用户的免费夺宝次数

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// 时区工具函数 - 统一使用塔吉克斯坦时区
function getTajikistanTime(): Date {
  return new Date(new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dushanbe'
  }));
}

function isResetTime(): boolean {
  const tajikistanTime = getTajikistanTime();
  return tajikistanTime.getHours() === 0 && 
         tajikistanTime.getMinutes() === 0 && 
         tajikistanTime.getSeconds() <= 30; // 30秒容错时间
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (_req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    console.log('[Reset Free Count] 开始重置免费次数...');

    // 验证是否为正确的重置时间（塔吉克斯坦时间凌晨0点）
    if (!isResetTime()) {
      const tajikistanTime = getTajikistanTime();
      const nextReset = new Date(tajikistanTime);
      nextReset.setHours(0, 0, 0, 0);
      nextReset.setDate(nextReset.getDate() + 1);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `当前不是重置时间。当前塔吉克斯坦时间: ${tajikistanTime.toLocaleString('zh-CN', { timeZone: 'Asia/Dushanbe' })}`,
          currentTime: tajikistanTime.toISOString(),
          nextResetTime: nextReset.toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 获取塔吉克斯坦当前日期
    const tajikistanNow = getTajikistanTime();
    const currentDate = tajikistanNow.toISOString().split('T')[0];

    // 只重置需要重置的用户（避免重复重置）
    const { data, error } = await supabase
      .from('users')
      .update({ 
        freeDailyCount: 3,
        lastFreeResetDate: currentDate
      })
      .or(`lastFreeResetDate.is.null,lastFreeResetDate.lt.${currentDate}`)
      .select('id, lastFreeResetDate, freeDailyCount');

    if (error) throw error;

    const affectedUsers = data?.length || 0;
    console.log(`[Reset Free Count] 重置完成，影响 ${affectedUsers} 个用户`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功重置 ${affectedUsers} 个用户的免费次数为3次`,
        affectedUsers: affectedUsers,
        resetTime: tajikistanNow.toISOString(),
        resetDate: currentDate,
        timezone: 'Asia/Dushanbe'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Reset Free Count] 错误:', error);
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
