// 获取用户地址列表
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';
import { ErrorFactory } from '@/lib/errors';
import type { ApiResponse, UserAddress } from '@/types';

// 获取地址列表
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `addresses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('获取地址列表请求开始', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('未授权访问地址列表', { requestId, user });
      return NextResponse.json(
        respond.customError('UNAUTHORIZED', '未授权访问').toJSON(),
        { status: 401 }
      );
    }

    // 查询用户地址
    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('userId', user.userId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) {
      logger.error('查询地址列表失败', error, { requestId, userId: user.userId });
      throw ErrorFactory.createDatabaseError('查询地址列表失败', { error: error.message });
    }

    logger.info('成功获取地址列表', { 
      requestId, 
      userId: user.userId, 
      addressCount: addresses?.length || 0 
    });

    return NextResponse.json(
      respond.success(addresses || [], '获取地址列表成功').toJSON()
    );

  } catch (error) {
    logger.error('获取地址列表失败', error as Error, { requestId });
    throw error;
  }
});

// 创建新地址
export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `addresses_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('创建地址请求开始', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('未授权访问创建地址', { requestId, user });
      return NextResponse.json(
        respond.customError('UNAUTHORIZED', '未授权访问').toJSON(),
        { status: 401 }
      );
    }

    const body = await request.json();
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
      logger.warn('创建地址缺少必填字段', { 
        requestId, 
        userId: user.userId,
        missingFields: {
          recipientName: !recipientName,
          recipientPhone: !recipientPhone,
          province: !province,
          city: !city,
          detailAddress: !detailAddress
        }
      });
      return NextResponse.json(
        respond.validationError('缺少必填字段', 'required_fields').toJSON(),
        { status: 400 }
      );
    }

    // 如果设置为默认地址，先取消其他默认地址
    if (isDefault) {
      const { error: updateError } = await supabaseAdmin
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('userId', user.userId);
      
      if (updateError) {
        logger.warn('取消其他默认地址失败', { 
          requestId, 
          userId: user.userId, 
          error: updateError.message 
        });
      }
    }

    // 插入新地址
    const { data: newAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .insert({
        userId: user.userId,
        recipientName,
        recipientPhone,
        province,
        city,
        district: district || null,
        detailAddress,
        isDefault: isDefault || false
      })
      .select()
      .single();

    if (error) {
      logger.error('创建地址失败', error, { requestId, userId: user.userId });
      throw ErrorFactory.createDatabaseError('创建地址失败', { error: error.message });
    }

    logger.info('成功创建地址', { 
      requestId, 
      userId: user.userId, 
      addressId: newAddress.id,
      isDefault: newAddress.isDefault
    });

    return NextResponse.json(
      respond.success(newAddress, '地址添加成功').toJSON()
    );

  } catch (error) {
    logger.error('创建地址失败', error as Error, { requestId });
    throw error;
  }
});