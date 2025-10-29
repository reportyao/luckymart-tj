// 重置免费次数定时任务
// 每天凌晨0点重置所有用户的免费夺宝次数

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    // 重置所有用户的免费次数为1
    const { data, error } = await supabase
      .from('users')
      .update({ freeDailyCount: 1 })
      .neq('freeDailyCount', 1)
      .select('id');

    if (error) throw error;

    const affectedUsers = data?.length || 0;
    console.log(`[Reset Free Count] 重置完成，影响 ${affectedUsers} 个用户`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功重置 ${affectedUsers} 个用户的免费次数`,
        affectedUsers: affectedUsers
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
