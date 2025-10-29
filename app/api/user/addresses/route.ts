// 获取用户地址列表
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, UserAddress } from '@/types';

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

    // 查询用户地址
    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('userId', user.userId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json<ApiResponse<UserAddress[]>>({
      success: true,
      data: addresses || []
    });

  } catch (error: any) {
    console.error('获取地址列表失败:', error);
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

    // 如果设置为默认地址，先取消其他默认地址
    if (isDefault) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('userId', user.userId);
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

    if (error) throw error;

    return NextResponse.json<ApiResponse<UserAddress>>({
      success: true,
      data: newAddress,
      message: '地址添加成功'
    });

  } catch (error: any) {
    console.error('添加地址失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '添加地址失败'
    }, { status: 500 });
  }
}
