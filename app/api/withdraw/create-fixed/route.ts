// 创建提现申请（增强安全版本）
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { calculateWithdrawFee } from '@/lib/utils';
import type { ApiResponse, WithdrawRequest } from '@/types';
import {
  validateWithdrawRequest,
  validateAndSanitizeAmount,
  validateIPAddress,
  setSecurityResponseHeaders,
  getClientIP,
  RateLimitChecker,
  maskSensitiveData,
  checkSQLInjectionRisk,
  detectXSSAttempt
} from '@/lib/security-validation';
import { AppError, ErrorFactory } from '@/lib/errors';

// 速率限制检查器
const rateLimitChecker = new RateLimitChecker();

// 提现操作频率限制配置
const WITHDRAW_RATE_LIMITS = {
  CREATE: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },      // 每天最多5次提现
  VERIFICATION: { limit: 3, windowMs: 60 * 60 * 1000 },      // 每小时最多3次验证码请求
};

// 提现限制配置
const WITHDRAW_CONFIG = {
  MIN_AMOUNT: 50,        // 最低提现金额
  MAX_AMOUNT: 10000,     // 最高提现金额
  DAILY_LIMIT: 50000,    // 每日提现总限制
  MONTHLY_LIMIT: 500000, // 每月提现总限制
  MIN_INTERVAL: 30 * 60 * 1000, // 最短提现间隔（30分钟）
};

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    
    // 1. 用户认证
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { 
        status: 401,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 2. 获取客户端信息
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent');
    
    // 验证IP地址格式
    if (clientIP !== 'unknown' && !validateIPAddress(clientIP)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的IP地址'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 3. 请求频率限制检查
    const rateLimitKey = `${user.userId}:${clientIP}:withdraw_create`;
    const rateLimitResult = rateLimitChecker.check(
      rateLimitKey,
      WITHDRAW_RATE_LIMITS.CREATE.limit,
      WITHDRAW_RATE_LIMITS.CREATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现操作过于频繁，请明日再来'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 4. 请求体解析和大小限制
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024) { // 5KB限制
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '请求数据过大'
      }, {
        status: 413,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    const body = await request.json();
    
    // 5. 输入验证和清洗
    const validatedData = validateWithdrawRequest(body);
    
    // 检查恶意输入
    const inputData = [
      validatedData.paymentAccount,
      validatedData.verificationCode
    ];
    if (inputData.some(data => checkSQLInjectionRisk(data) || detectXSSAttempt(data))) {
      await logSecurityEvent({
        type: 'WITHDRAW_SUSPICIOUS_INPUT',
        userId: user.userId,
        ip: clientIP,
        details: { 
          input: inputData,
          endpoint: '/api/withdraw/create',
          method: 'POST'
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '输入包含非法内容'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 6. 验证码验证
    const isCodeValid = await verifySMSCode(
      user.userId,
      validatedData.paymentAccount,
      validatedData.verificationCode
    );
    
    if (!isCodeValid) {
      await logSecurityEvent({
        type: 'WITHDRAW_INVALID_CODE',
        userId: user.userId,
        ip: clientIP,
        details: { 
          account: maskAccountNumber(validatedData.paymentAccount),
          endpoint: '/api/withdraw/create'
        }
      });
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '验证码错误或已过期'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 7. 提现金额验证
    const amount = validateAndSanitizeAmount(validatedData.amount);
    
    if (amount < WITHDRAW_CONFIG.MIN_AMOUNT) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `最低提现金额为 ${WITHDRAW_CONFIG.MIN_AMOUNT} TJS`
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }
    
    if (amount > WITHDRAW_CONFIG.MAX_AMOUNT) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `单次最高提现金额为 ${WITHDRAW_CONFIG.MAX_AMOUNT} TJS`
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 8. 提现频率检查
    const recentWithdraw = await checkWithdrawFrequency(user.userId);
    if (recentWithdraw.tooFrequent) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提现操作过于频繁，请稍后再试'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 9. 业务限制检查
    const dailyTotal = await getWithdrawTotalToday(user.userId);
    if (dailyTotal + amount > WITHDRAW_CONFIG.DAILY_LIMIT) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `今日提现额度已用完（${dailyTotal}/${WITHDRAW_CONFIG.DAILY_LIMIT} TJS）`
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    const monthlyTotal = await getWithdrawTotalThisMonth(user.userId);
    if (monthlyTotal + amount > WITHDRAW_CONFIG.MONTHLY_LIMIT) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `本月提现额度已用完（${monthlyTotal}/${WITHDRAW_CONFIG.MONTHLY_LIMIT} TJS）`
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 10. 查询用户信息
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('platform_balance, phone, is_active')
      .eq('id', user.userId)
      .single();

    if (userError || !userData) {
      throw new Error('用户不存在');
    }

    // 验证用户状态
    if (!userData.is_active) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '账户已被冻结，无法提现'
      }, {
        status: 403,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 11. 计算手续费和余额验证
    const fee = calculateWithdrawFee(amount);
    const totalRequired = amount + fee;

    // 检查余额
    if (userData.platform_balance < totalRequired) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `余额不足。需要 ${totalRequired} TJS（含手续费 ${fee} TJS），当前余额 ${userData.platform_balance} TJS`
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 12. 创建提现申请（使用事务保证原子性）
    const { data: withdrawRequest, error: insertError } = await supabaseAdmin
      .from('withdraw_requests')
      .insert({
        user_id: user.userId,
        amount,
        fee,
        actual_amount: amount - fee,
        withdraw_method: validatedData.paymentMethod,
        account_info: { 
          account: maskAccountNumber(validatedData.paymentAccount),
          verified: true
        },
        status: 'pending',
        ip_address: clientIP,
        user_agent: userAgent
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建提现申请失败:', insertError);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '创建提现申请失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 13. 扣除余额（使用原子操作）
    const { error: updateError } = await supabaseAdmin.rpc('atomic_balance_deduction', {
      p_user_id: user.userId,
      p_deduction_amount: totalRequired,
      p_operation_type: 'withdraw',
      p_related_id: withdrawRequest.id
    });

    if (updateError) {
      console.error('扣除余额失败:', updateError);
      
      // 回滚提现申请
      await supabaseAdmin
        .from('withdraw_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawRequest.id);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '余额操作失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 14. 记录交易日志
    await logUserActivity({
      userId: user.userId,
      action: 'CREATE_WITHDRAW',
      details: {
        withdrawId: withdrawRequest.id,
        amount,
        fee,
        method: validatedData.paymentMethod,
        operationTime: Date.now() - startTime
      },
      ip: clientIP,
      userAgent
    });

    // 15. 风险评估和标记
    const riskScore = await assessWithdrawRisk({
      userId: user.userId,
      amount,
      clientIP,
      userAgent
    });
    
    if (riskScore > 80) {
      // 高风险标记，需要人工审核
      await supabaseAdmin
        .from('withdraw_requests')
        .update({ 
          risk_score: riskScore,
          requires_manual_review: true 
        })
        .eq('id', withdrawRequest.id);
    }

    // 16. 返回响应
    const response = NextResponse.json<ApiResponse<WithdrawRequest>>({
      success: true,
      data: {
        ...withdrawRequest,
        account_info: {
          ...withdrawRequest.account_info,
          account: maskAccountNumber(validatedData.paymentAccount)
        }
      },
      message: riskScore > 80 ? 
        '提现申请提交成功，正在进行安全审核' : 
        '提现申请提交成功，请等待审核',
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        },
        riskScore,
        requiresManualReview: riskScore > 80
      }
    });

    return setSecurityResponseHeaders(response.headers);

  } catch (error: any) {
    console.error('创建提现申请失败:', error);
    
    const appError = ErrorFactory.wrapError(error, '创建提现申请');
    const response = NextResponse.json<ApiResponse>({
      success: false,
      error: appError.message,
      code: appError.code
    }, {
      status: appError.statusCode || 500,
      headers: setSecurityResponseHeaders(new Headers())
    });

    return setSecurityResponseHeaders(response.headers);
  }
}

// ============= 工具函数 =============

/**
 * 验证码验证
 */
async function verifySMSCode(userId: string, account: string, code: string): Promise<boolean> {
  try {
    // 检查验证码是否存在且未过期
    const { data: verification } = await supabaseAdmin
      .from('sms_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', account)
      .eq('code', code)
      .eq('type', 'withdraw_verification')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return false;
    }

    // 标记验证码为已使用
    await supabaseAdmin
      .from('sms_verifications')
      .update({ is_used: true })
      .eq('id', verification.id);

    return true;
  } catch (error) {
    console.error('验证码验证失败:', error);
    return false;
  }
}

/**
 * 检查提现频率
 */
async function checkWithdrawFrequency(userId: string): Promise<{ tooFrequent: boolean }> {
  const recentTime = new Date(Date.now() - WITHDRAW_CONFIG.MIN_INTERVAL);
  
  const { count } = await supabaseAdmin
    .from('withdraw_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', recentTime.toISOString());

  return {
    tooFrequent: (count || 0) > 0
  };
}

/**
 * 获取今日提现总额
 */
async function getWithdrawTotalToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data } = await supabaseAdmin
    .from('withdraw_requests')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', today.toISOString());

  return data?.reduce((sum, item) => sum + item.amount, 0) || 0;
}

/**
 * 获取本月提现总额
 */
async function getWithdrawTotalThisMonth(userId: string): Promise<number> {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const { data } = await supabaseAdmin
    .from('withdraw_requests')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', thisMonth.toISOString());

  return data?.reduce((sum, item) => sum + item.amount, 0) || 0;
}

/**
 * 提现风险评估
 */
async function assessWithdrawRisk(data: {
  userId: string;
  amount: number;
  clientIP: string;
  userAgent?: string | null;
}): Promise<number> {
  let riskScore = 0;

  try {
    // 1. 大额提现风险
    if (data.amount > 5000) {
      riskScore += 30;
    } else if (data.amount > 1000) {
      riskScore += 15;
    }

    // 2. 提现频率风险
    const { data: recentWithdraws } = await supabaseAdmin
      .from('withdraw_requests')
      .select('amount, created_at')
      .eq('user_id', data.userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentWithdraws && recentWithdraws.length > 3) {
      riskScore += 20;
    }

    // 3. IP地址风险检查
    const { data: ipHistory } = await supabaseAdmin
      .from('withdraw_requests')
      .select('ip_address')
      .eq('user_id', data.userId)
      .neq('ip_address', data.clientIP)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ipHistory && ipHistory.length > 0) {
      riskScore += 25; // IP地址变化
    }

    // 4. 新用户风险
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', data.userId)
      .single();

    if (userData) {
      const userAge = Date.now() - new Date(userData.created_at).getTime();
      if (userAge < 7 * 24 * 60 * 60 * 1000) { // 注册不到7天
        riskScore += 20;
      }
    }

    // 5. User-Agent检查
    if (!data.userAgent || data.userAgent.length < 10) {
      riskScore += 10;
    }

    return Math.min(100, riskScore);
  } catch (error) {
    console.error('风险评估失败:', error);
    return 50; // 中等风险
  }
}

/**
 * 账号脱敏
 */
function maskAccountNumber(account: string): string {
  if (account.length <= 4) {
    return account;
  }
  
  const start = account.substring(0, 4);
  const end = account.substring(account.length - 4);
  return `${start}****${end}`;
}

/**
 * 安全事件记录
 */
async function logSecurityEvent(event: {
  type: string;
  userId?: string;
  ip: string;
  details: any;
}) {
  try {
    await supabaseAdmin
      .from('security_logs')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        ip_address: event.ip,
        details: event.details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('记录安全事件失败:', error);
  }
}

/**
 * 用户活动记录
 */
async function logUserActivity(activity: {
  userId: string;
  action: string;
  details: any;
  ip: string;
  userAgent?: string | null;
}) {
  try {
    await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: activity.userId,
        action: activity.action,
        details: activity.details,
        ip_address: activity.ip,
        user_agent: activity.userAgent,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('记录用户活动失败:', error);
  }
}