// 获取转售商品列表
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const offset = (page - 1) * limit;

    // 构建查询 - 只显示活跃的转售商品
    let query = supabaseAdmin
      .from('resale_listings')
      .select(`
        *,
        products(id, name_zh, name_en, image_url, market_price),
        sellers:users!resale_listings_seller_user_id_fkey(username, first_name)
      `, { count: 'exact' })
      .eq('status', 'active')
      .order('listed_at', { ascending: false });

    // 分类筛选
    if (category) {
      query = query.eq('products.category', category);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: listings, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        listings: listings || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('获取转售列表失败:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || '获取转售列表失败'
    }, { status: 500 });
  }
}
