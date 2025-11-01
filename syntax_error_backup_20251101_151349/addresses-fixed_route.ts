import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, UserAddress } from '@/types';
import {
import { AppError, ErrorFactory } from '@/lib/errors';
// 获取和创建用户地址（增强安全版本）
  validateAndSanitizeName,
  validateAndSanitizePhone,
  validateAndSanitizeAddress,
  checkSQLInjectionRisk,
  detectXSSAttempt,
  setSecurityResponseHeaders,
  getClientIP,
  RateLimitChecker,
  maskSensitiveData
} from '@/lib/security-validation';

// 速率限制检查器
const rateLimitChecker = new RateLimitChecker();

// 地址操作频率限制配置
const ADDRESS_RATE_LIMITS = {
  CREATE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 每小时最多创建10个地址
  LIST: { limit: 100, windowMs: 60 * 60 * 1000 },   // 每小时最多查询100次
};

export async function GET(request: Request) {
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

    // 2. 频率限制检查
    const clientIP = getClientIP(request);
    const rateLimitKey = `${user.userId}:${clientIP}:address_list`;
    
    const rateLimitResult = rateLimitChecker.check(;
      rateLimitKey,
      ADDRESS_RATE_LIMITS.LIST.limit,
      ADDRESS_RATE_LIMITS.LIST.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '请求过于频繁，请稍后再试'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 3. 参数安全检查
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // 检查是否存在SQL注入攻击迹象
    for (const [key, value] of searchParams.entries()) {
      if (checkSQLInjectionRisk(value) || detectXSSAttempt(value)) {
        await logSecurityEvent({
          type: 'SUSPICIOUS_REQUEST',
          userId: user.userId,
          ip: clientIP,
          details: { 
            parameter: key, 
            value,
            endpoint: '/api/user/addresses',
            method: 'GET'
          }
        });
        
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '请求包含非法参数'
        }, {
          status: 400,
          headers: setSecurityResponseHeaders(new Headers())
        });
      }
    }

    // 4. 数据库查询优化：使用索引字段
    const { data: addresses, error } = await supabaseAdmin;
      .from('user_addresses')
      .select(`
        id,
        recipientName,
        recipientPhone,
        province,
        city,
        district,
        detailAddress,
        isDefault,
        createdAt,
        updatedAt
      `)
      .eq('userId', user.userId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('获取地址列表失败:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '获取地址列表失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 5. 数据脱敏处理
    const sanitizedAddresses = (addresses || []).map(address => ({
      ...address,
      recipientPhone: maskPhoneNumber(address.recipientPhone), // 脱敏手机号
    }));

    // 6. 记录操作日志
    await logUserActivity({
      userId: user.userId,
      action: 'VIEW_ADDRESSES',
      details: {
        count: sanitizedAddresses.length,
        operationTime: Date.now() - startTime
      },
      ip: clientIP,
      userAgent: request.headers.get('user-agent')
    });

    // 7. 返回响应（包含安全头）
    const response = NextResponse.json<ApiResponse<UserAddress[]>>({
      success: true,
      data: sanitizedAddresses,
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }
      }
    });

    return setSecurityResponseHeaders(response.headers);
  }

  } catch (error: any) {
    console.error('获取地址列表失败:', error);
    
    const appError = ErrorFactory.wrapError(error, '获取地址列表');
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

// 创建新地址
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

    // 2. 频率限制检查
    const clientIP = getClientIP(request);
    const rateLimitKey = `${user.userId}:${clientIP}:address_create`;
    
    const rateLimitResult = rateLimitChecker.check(;
      rateLimitKey,
      ADDRESS_RATE_LIMITS.CREATE.limit,
      ADDRESS_RATE_LIMITS.CREATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址创建操作过于频繁，请稍后再试'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 3. 请求体解析和大小限制
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024) { // 10KB限制 {
      return NextResponse.json<ApiResponse>({
  }
        success: false,
        error: '请求数据过大'
      }, {
        status: 413,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    const body = await request.json();
    
    // 4. 输入验证和清洗
    const {
      recipientName,
      recipientPhone,
      province,
      city,
      district,
      detailAddress,
      isDefault
    } = body;

    // 验证必填字段
    if (!recipientName || !recipientPhone || !province || !city || !detailAddress) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必填字段'
      }, { 
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 安全验证和清洗
    const safeRecipientName = validateAndSanitizeName(recipientName);
    const safeRecipientPhone = validateAndSanitizePhone(recipientPhone);
    const safeProvince = validateAndSanitizeAddress(province);
    const safeCity = validateAndSanitizeAddress(city);
    const safeDistrict = district ? validateAndSanitizeAddress(district) : null;
    const safeDetailAddress = validateAndSanitizeAddress(detailAddress);

    // 检查恶意输入
    const inputData = [safeRecipientName, safeRecipientPhone, safeProvince, safeCity, safeDetailAddress];
    if (inputData.some(data => detectXSSAttempt(data))) {
      await logSecurityEvent({
        type: 'XSS_ATTACK_ATTEMPT',
        userId: user.userId,
        ip: clientIP,
        details: { 
          input: inputData,
          endpoint: '/api/user/addresses',
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

    // 5. 业务逻辑验证
    // 检查用户地址数量限制
    const { count: addressCount } = await supabaseAdmin;
      .from('user_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.userId);

    if (addressCount && addressCount >= 20) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址数量已达上限（最多20个）'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 6. 事务处理：设置默认地址
    if (isDefault && isDefault === true) {
      // 先取消其他默认地址
      const { error: updateError } = await supabaseAdmin;
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('userId', user.userId);

      if (updateError) {
        console.error('取消其他默认地址失败:', updateError);
        throw new Error('设置默认地址失败');
      }
    }

    // 7. 插入新地址
    const { data: newAddress, error } = await supabaseAdmin;
      .from('user_addresses')
      .insert({
        userId: user.userId,
        recipientName: safeRecipientName,
        recipientPhone: safeRecipientPhone,
        province: safeProvince,
        city: safeCity,
        district: safeDistrict,
        detailAddress: safeDetailAddress,
        isDefault: isDefault === true
      })
      .select(`
        id,
        recipientName,
        recipientPhone,
        province,
        city,
        district,
        detailAddress,
        isDefault,
        createdAt
      `)
      .single();

    if (error) {
      console.error('插入地址失败:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '创建地址失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 8. 记录操作日志
    await logUserActivity({
      userId: user.userId,
      action: 'CREATE_ADDRESS',
      details: {
        addressId: newAddress.id,
        operationTime: Date.now() - startTime
      },
      ip: clientIP,
      userAgent: request.headers.get('user-agent')
    });

    // 9. 返回响应
    const response = NextResponse.json<ApiResponse<UserAddress>>({
      success: true,
      data: {
        ...newAddress,
        recipientPhone: maskPhoneNumber(newAddress.recipientPhone) // 返回脱敏手机号
      },
      message: '地址添加成功',
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }
      }
    });

    return setSecurityResponseHeaders(response.headers);

  } catch (error: any) {
    console.error('添加地址失败:', error);
    
    const appError = ErrorFactory.wrapError(error, '创建地址');
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

// :============ 工具函数 =============

/**
 * 手机号脱敏
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 7) {
    return phone;
  }
  
  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 4);
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