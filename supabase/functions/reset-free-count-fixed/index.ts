// 重置免费次数定时任务 - 修复版
// 每天塔吉克斯坦凌晨0点重置所有用户的免费夺宝次数

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 塔吉克斯坦时区工具
class TajikistanTimeUtils {
  static readonly TIMEZONE = 'Asia/Dushanbe';
  
  static getCurrentTime(): Date {
    return new Date(new Date().toLocaleString('en-US', {
      timeZone: this.TIMEZONE
    }));
  }
  
  static getCurrentDateString(): string {
    return this.getCurrentTime().toISOString().split('T')[0];
  }
}

Deno.serve(async (_req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    const tajikistanNow = TajikistanTimeUtils.getCurrentTime();
    const today = TajikistanTimeUtils.getCurrentDateString();
    
    console.log(`[Reset Free Count] 塔吉克斯坦当前时间: ${tajikistanNow.toISOString()}`);
    console.log(`[Reset Free Count] 开始重置免费次数...`);

    // 使用原子性操作重置免费次数
    // 只重置昨天已经重置过的用户，避免重复操作
    const { data, error } = await supabase
      .from('users')
      .update({ 
        freeDailyCount: 3,
        lastFreeResetDate: tajikistanNow.toISOString()
      })
      .neq('lastFreeResetDate', today) // 只处理今天未重置的用户
      .select('id, telegramId, username, freeDailyCount');

    if (error) throw error;

    const affectedUsers = data?.length || 0;
    console.log(`[Reset Free Count] 重置完成，影响 ${affectedUsers} 个用户`);

    // 记录操作日志
    if (affectedUsers > 0) {
      await supabase.from('system_logs').insert({
        log_type: 'free_count_reset',
        content: `免费次数重置完成，影响 ${affectedUsers} 个用户`,
        metadata: { 
          affected_count: affectedUsers,
          tajikistan_time: tajikistanNow.toISOString(),
          date: today
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功重置 ${affectedUsers} 个用户的免费次数`,
        affectedUsers: affectedUsers,
        tajikistanTime: tajikistanNow.toISOString(),
        date: today
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Reset Free Count] 错误:', error);
    
    // 记录错误日志
    try {
      await supabase.from('system_logs').insert({
        log_type: 'free_count_reset_error',
        content: `免费次数重置失败: ${error.message}`,
        metadata: { 
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('记录错误日志失败:', logError);
    }

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