// 更新和删除地址
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import type { ApiResponse, UserAddress } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const addressId = parseInt(params.id);
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
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '地址不存在或无权操作'
      }, { status: 404 });
    }

    // 如果设置为默认地址，先取消其他默认地址
    if (isDefault && !existingAddress.isDefault) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('userId', user.userId);
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

    if (error) {throw error;}

    return NextResponse.json<ApiResponse<UserAddress>>({
      success: true,
      data: updatedAddress,
      message: '地址更新成功'
    });

  } catch (error: any) {
    console.error('更新地址失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '更新地址失败'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未授权访问'
      }, { status: 401 });
    }

    const addressId = parseInt(params.id);

    // 验证地址归属
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
      }, { status: 404 });
    }

    // 删除地址
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {throw error;}

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '地址删除成功'
    });

  } catch (error: any) {
    console.error('删除地址失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '删除地址失败'
    }, { status: 500 });
  }
}
