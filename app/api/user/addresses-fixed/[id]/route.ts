// 更新和删除地址（增强安全版本）
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, UserAddress } from '@/types';
import {
  validateAndSanitizeName,
  validateAndSanitizePhone,
  validateAndSanitizeAddress,
  validateIdParam,
  checkSQLInjectionRisk,
  detectXSSAttempt,
  setSecurityResponseHeaders,
  getClientIP,
  RateLimitChecker,
  maskSensitiveData
} from '@/lib/security-validation';
import { AppError, ErrorFactory } from '@/lib/errors';

// 速率限制检查器
const rateLimitChecker = new RateLimitChecker();

// 地址操作频率限制配置
const ADDRESS_OPERATION_LIMITS = {
  UPDATE: { limit: 20, windowMs: 60 * 60 * 1000 }, // 每小时最多更新20次
  DELETE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 每小时最多删除10次
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const startTime = Date.now();
    
    // 1. 参数验证
    if (!params.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址ID不能为空'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    const addressId = validateIdParam(params.id);
    
    // 2. 用户认证
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

    // 3. 频率限制检查
    const clientIP = getClientIP(request);
    const rateLimitKey = `${user.userId}:${clientIP}:address_update:${addressId}`;
    
    const rateLimitResult = rateLimitChecker.check(
      rateLimitKey,
      ADDRESS_OPERATION_LIMITS.UPDATE.limit,
      ADDRESS_OPERATION_LIMITS.UPDATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址更新操作过于频繁，请稍后再试'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 4. 请求体解析和大小限制
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024) { // 10KB限制
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
    const {
      recipientName,
      recipientPhone,
      province,
      city,
      district,
      detailAddress,
      isDefault
    } = body;

    // 检查是否有更新字段
    const updateFields = { recipientName, recipientPhone, province, city, district, detailAddress, isDefault };
    const hasUpdateFields = Object.values(updateFields).some(value => value !== undefined);
    
    if (!hasUpdateFields) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '没有提供要更新的字段'
      }, { 
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 6. 安全验证和清洗
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (recipientName !== undefined) {
      updateData.recipientName = validateAndSanitizeName(recipientName);
    }
    if (recipientPhone !== undefined) {
      updateData.recipientPhone = validateAndSanitizePhone(recipientPhone);
    }
    if (province !== undefined) {
      updateData.province = validateAndSanitizeAddress(province);
    }
    if (city !== undefined) {
      updateData.city = validateAndSanitizeAddress(city);
    }
    if (district !== undefined) {
      updateData.district = district ? validateAndSanitizeAddress(district) : null;
    }
    if (detailAddress !== undefined) {
      updateData.detailAddress = validateAndSanitizeAddress(detailAddress);
    }
    if (isDefault !== undefined) {
      updateData.isDefault = Boolean(isDefault);
    }

    // 检查恶意输入
    const inputValues = Object.values(updateData).filter(v => typeof v === 'string');
    if (inputValues.some(data => detectXSSAttempt(data))) {
      await logSecurityEvent({
        type: 'XSS_ATTACK_ATTEMPT',
        userId: user.userId,
        ip: clientIP,
        details: { 
          addressId,
          input: inputValues,
          endpoint: `/api/user/addresses/${addressId}`,
          method: 'PUT'
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

    // 7. 权限验证：检查地址归属
    const { data: existingAddress, error: checkError } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('userId', user.userId)
      .single();

    if (checkError || !existingAddress) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址不存在或无权操作'
      }, { 
        status: 404,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 8. 业务逻辑验证
    // 如果设置为默认地址，先取消其他默认地址
    if (updateData.isDefault === true && !existingAddress.isDefault) {
      const { error: updateError } = await supabaseAdmin
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('userId', user.userId);

      if (updateError) {
        console.error('取消其他默认地址失败:', updateError);
        throw new Error('设置默认地址失败');
      }
    }

    // 9. 更新地址
    const { data: updatedAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .update(updateData)
      .eq('id', addressId)
      .eq('userId', user.userId) // 双重验证，防止TOCTOU攻击
      .select(`
        id,
        recipientName,
        recipientPhone,
        province,
        city,
        district,
        detailAddress,
        isDefault,
        updatedAt
      `)
      .single();

    if (error) {
      console.error('更新地址失败:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '更新地址失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 10. 验证更新是否成功（并发安全检查）
    if (!updatedAddress) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址已被删除或不存在'
      }, {
        status: 404,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 11. 记录操作日志
    await logUserActivity({
      userId: user.userId,
      action: 'UPDATE_ADDRESS',
      details: {
        addressId,
        updatedFields: Object.keys(updateData),
        operationTime: Date.now() - startTime
      },
      ip: clientIP,
      userAgent: request.headers.get('user-agent')
    });

    // 12. 返回响应
    const response = NextResponse.json<ApiResponse<UserAddress>>({
      success: true,
      data: {
        ...updatedAddress,
        recipientPhone: maskPhoneNumber(updatedAddress.recipientPhone) // 返回脱敏手机号
      },
      message: '地址更新成功',
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }
      }
    });

    return setSecurityResponseHeaders(response.headers);

  } catch (error: any) {
    console.error('更新地址失败:', error);
    
    const appError = ErrorFactory.wrapError(error, '更新地址');
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const startTime = Date.now();
    
    // 1. 参数验证
    if (!params.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址ID不能为空'
      }, {
        status: 400,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    const addressId = validateIdParam(params.id);
    
    // 2. 用户认证
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

    // 3. 频率限制检查
    const clientIP = getClientIP(request);
    const rateLimitKey = `${user.userId}:${clientIP}:address_delete:${addressId}`;
    
    const rateLimitResult = rateLimitChecker.check(
      rateLimitKey,
      ADDRESS_OPERATION_LIMITS.DELETE.limit,
      ADDRESS_OPERATION_LIMITS.DELETE.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址删除操作过于频繁，请稍后再试'
      }, {
        status: 429,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 4. 权限验证：检查地址归属
    const { data: existingAddress, error: checkError } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('userId', user.userId)
      .single();

    if (checkError || !existingAddress) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址不存在或无权操作'
      }, { 
        status: 404,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 5. 业务逻辑检查
    // 检查是否为默认地址，如果是则需要特殊处理
    if (existingAddress.isDefault) {
      // 查询用户是否还有其他地址
      const { data: otherAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id, isDefault')
        .eq('userId', user.userId)
        .neq('id', addressId);

      // 如果没有其他地址，不允许删除最后一个地址
      if (!otherAddresses || otherAddresses.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: '不能删除最后一个地址'
        }, {
          status: 400,
          headers: setSecurityResponseHeaders(new Headers())
        });
      }

      // 如果有其他地址，将第一个设置为默认地址
      if (otherAddresses.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('user_addresses')
          .update({ isDefault: true })
          .eq('id', otherAddresses[0].id);

        if (updateError) {
          console.error('设置新的默认地址失败:', updateError);
        }
      }
    }

    // 6. 删除地址（使用软删除或硬删除策略）
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('userId', user.userId); // 双重验证

    if (error) {
      console.error('删除地址失败:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '删除地址失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 7. 验证删除是否成功
    const { data: verifyAddress } = await supabaseAdmin
      .from('user_addresses')
      .select('id')
      .eq('id', addressId)
      .single();

    if (verifyAddress) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址删除失败'
      }, {
        status: 500,
        headers: setSecurityResponseHeaders(new Headers())
      });
    }

    // 8. 记录操作日志
    await logUserActivity({
      userId: user.userId,
      action: 'DELETE_ADDRESS',
      details: {
        addressId,
        wasDefault: existingAddress.isDefault,
        operationTime: Date.now() - startTime
      },
      ip: clientIP,
      userAgent: request.headers.get('user-agent')
    });

    // 9. 返回响应
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: '地址删除成功',
      meta: {
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }
      }
    });

    return setSecurityResponseHeaders(response.headers);

  } catch (error: any) {
    console.error('删除地址失败:', error);
    
    const appError = ErrorFactory.wrapError(error, '删除地址');
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