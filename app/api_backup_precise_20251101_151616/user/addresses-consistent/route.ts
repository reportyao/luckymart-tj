// 用户地址管理（缓存一致性版本）
import { NextResponse } from 'next/server';
import { userService } from '@/lib/user-service';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, UserAddress } from '@/types';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

// 获取用户地址列表
export async function GET(request: Request) {
  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    logger.info('获取用户地址列表', { userId: user.userId });

    // 使用用户服务获取地址列表（带缓存）
    const addresses = await userService.getUserAddresses(user.userId);

    return NextResponse.json<ApiResponse<UserAddress[]>>({
      success: true,
      data: addresses
    });

  } catch (error: any) {
    logger.error('获取地址列表失败', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取地址列表失败'
    }, { status: 500 });
  }
}

// 创建新地址
export async function POST(request: Request) {
  try {
    // 验证用户
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
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
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 });
    }

    logger.info('创建用户地址', {
      userId: user.userId,
      recipientName,
      isDefault
    });

    // 使用用户服务添加地址（缓存失效+重载）
    const result = await userService.addUserAddress(user.userId, {
      recipientName,
      recipientPhone,
      province,
      city,
      district: district || null,
      detailAddress,
      isDefault: isDefault || false
    });

    if (!result) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '添加地址失败'
      }, { status: 500 });
    }

    // 获取最新添加的地址
    const newAddress = result[result.length - 1];

    logger.info('用户地址创建成功', {
      userId: user.userId,
      addressId: newAddress.id
    });

    return NextResponse.json<ApiResponse<UserAddress>>({
      success: true,
      data: newAddress,
      message: '地址添加成功'
    });

  } catch (error: any) {
    logger.error('添加地址失败', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '添加地址失败'
    }, { status: 500 });
  }
}