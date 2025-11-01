// 更新和删除地址
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';
import { ErrorFactory } from '@/lib/errors';
import type { ApiResponse, UserAddress } from '@/types';

// 更新地址
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const requestId = `addresses_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const addressId = parseInt(params.id);
  
  logger.info('更新地址请求开始', {
    requestId,
    addressId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  try {
    const user = getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('未授权访问更新地址', { requestId, addressId, user });
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

    // 验证地址归属
    const { data: existingAddress, error: checkError } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('userId', user.userId)
      .single();

    if (checkError || !existingAddress) {
      logger.warn('地址不存在或无权操作', { 
        requestId, 
        addressId, 
        userId: user.userId,
        checkError: checkError?.message 
      });
      return NextResponse.json(
        respond.customError('NOT_FOUND', '地址不存在或无权操作').toJSON(),
        { status: 404 }
      );
    }

    // 如果设置为默认地址，先取消其他默认地址
    if (isDefault && !existingAddress.isDefault) {
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

    // 更新地址
    const { data: updatedAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .update({
        recipientName,
        recipientPhone,
        province,
        city,
        district: district || null,
        detailAddress,
        isDefault: isDefault || false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      logger.error('更新地址失败', error, { requestId, addressId, userId: user.userId });
      throw ErrorFactory.createDatabaseError('更新地址失败', { error: error.message });
    }

    logger.info('成功更新地址', { 
      requestId, 
      addressId, 
      userId: user.userId,
      updatedFields: Object.keys(body)
    });

    return NextResponse.json(
      respond.success(updatedAddress, '地址更新成功').toJSON()
    );

  } catch (error) {
    logger.error('更新地址失败', error as Error, { requestId, addressId });
    throw error;
  }
});

// 删除地址
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const requestId = `addresses_delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const addressId = parseInt(params.id);
  
  logger.info('删除地址请求开始', {
    requestId,
    addressId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  try {
    const user = getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('未授权访问删除地址', { requestId, addressId, user });
      return NextResponse.json(
        respond.customError('UNAUTHORIZED', '未授权访问').toJSON(),
        { status: 401 }
      );
    }

    // 验证地址归属
    const { data: existingAddress, error: checkError } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('userId', user.userId)
      .single();

    if (checkError || !existingAddress) {
      logger.warn('地址不存在或无权操作', { 
        requestId, 
        addressId, 
        userId: user.userId,
        checkError: checkError?.message 
      });
      return NextResponse.json(
        respond.customError('NOT_FOUND', '地址不存在或无权操作').toJSON(),
        { status: 404 }
      );
    }

    // 删除地址
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      logger.error('删除地址失败', error, { requestId, addressId, userId: user.userId });
      throw ErrorFactory.createDatabaseError('删除地址失败', { error: error.message });
    }

    logger.info('成功删除地址', { 
      requestId, 
      addressId, 
      userId: user.userId
    });

    return NextResponse.json(
      respond.success(null, '地址删除成功').toJSON()
    );

  } catch (error) {
    logger.error('删除地址失败', error as Error, { requestId, addressId });
    throw error;
  }
});
