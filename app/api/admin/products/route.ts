import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-auth-middleware';

import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';


const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.write()
});

const withDeletePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.delete()
});

// GET - 获取所有商品
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    try {

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 获取所有商品
    const products = await prisma.products.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p : any) => ({
          id: p.id,
          nameZh: p.nameZh,
          nameEn: p.nameEn,
          nameRu: p.nameRu,
          descriptionZh: p.descriptionZh,
          descriptionEn: p.descriptionEn,
          descriptionRu: p.descriptionRu,
          images: p.images,
          marketPrice: Number(p.marketPrice),
          totalShares: p.totalShares,
          pricePerShare: Number(p.pricePerShare),
          category: p.category,
          stock: p.stock,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        stats: {
          total: products.length,
          active: products.filter((p : any) => p.status === 'active').length,
          inactive: products.filter((p : any) => p.status === 'inactive').length
        }
      }
    });
    } catch (error: any) {
      console.error('获取商品列表失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取商品列表失败'
      }, { status: 500 });
    }
  })(request);
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const {
      nameZh,
      nameEn,
      nameRu,
      descriptionZh,
      descriptionEn,
      descriptionRu,
      images,
      marketPrice,
      totalShares,
      pricePerShare,
      category,
      stock
    } = body;

    // 验证必填字段
    if (!nameZh || !nameEn || !nameRu || !marketPrice || !totalShares) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 });
    }

    // 创建商品
    const product = await prisma.products.create({
      data: {
        nameZh,
        nameEn,
        nameRu,
        descriptionZh: descriptionZh || '',
        descriptionEn: descriptionEn || '',
        descriptionRu: descriptionRu || '',
        images: images || [],
        marketPrice: parseFloat(marketPrice),
        totalShares: parseInt(totalShares),
        pricePerShare: pricePerShare ? parseFloat(pricePerShare) : 1.0,
        category: category || '默认',
        stock: stock ? parseInt(stock) : 0,
        status: 'active'
      }
    });

    // 自动创建一个抽奖轮次（lottery_round）
    try {
      await prisma.lotteryRounds.create({
        data: {
          productId: product.id,
          roundNumber: 1,
          totalShares: parseInt(totalShares),
          pricePerShare: pricePerShare ? parseFloat(pricePerShare) : 1.0,
          soldShares: 0,
          status: 'active',
          participants: 0
        }
      });
    } catch (roundError) {
      console.error('Failed to create lottery round:', roundError);
      // 即使创建轮次失败，商品也已创建成功，不影响返回
    }

    return NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        message: '商品创建成功'
      }
    });
    } catch (error: any) {
      console.error('Create product error:', error);
      return NextResponse.json({
        success: false,
        error: '创建商品失败'
      }, { status: 500 });
    }
  })(request);
}

// PUT - 更新商品
export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    try {

    const body = await request.json();
    const { productId, ...updateData } = body;

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: '缺少商品ID'
      }, { status: 400 });
    }

    // 构建更新数据
    const data: any = {};
    if (updateData.nameZh) {data.nameZh = updateData.nameZh;}
    if (updateData.nameEn) {data.nameEn = updateData.nameEn;}
    if (updateData.nameRu) {data.nameRu = updateData.nameRu;}
    if (updateData.descriptionZh !== undefined) {data.descriptionZh = updateData.descriptionZh;}
    if (updateData.descriptionEn !== undefined) {data.descriptionEn = updateData.descriptionEn;}
    if (updateData.descriptionRu !== undefined) {data.descriptionRu = updateData.descriptionRu;}
    if (updateData.images) {data.images = updateData.images;}
    if (updateData.marketPrice) {data.marketPrice = parseFloat(updateData.marketPrice);}
    if (updateData.totalShares) {data.totalShares = parseInt(updateData.totalShares);}
    if (updateData.pricePerShare) {data.pricePerShare = parseFloat(updateData.pricePerShare);}
    if (updateData.category) {data.category = updateData.category;}
    if (updateData.stock !== undefined) {data.stock = parseInt(updateData.stock);}
    if (updateData.status) {data.status = updateData.status;}

    // 更新商品
    await prisma.products.update({
      where: { id: productId },
      data
    });

    return NextResponse.json({
      success: true,
      data: { message: '更新成功' }
    });
    } catch (error: any) {
      console.error('Update product error:', error);
      return NextResponse.json({
        success: false,
        error: '更新商品失败'
      }, { status: 500 });
    }
  })(request);
}

// DELETE - 删除商品
export async function DELETE(request: NextRequest) {
  return withDeletePermission(async (request: any, admin: any) => {
    try {

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: '缺少商品ID'
      }, { status: 400 });
    }

    // 检查商品是否有进行中的抽奖
    const activeRounds = await prisma.lotteryRounds.findFirst({
      where: {
        productId,
        status: 'active'
      }
    });

    if (activeRounds) {
      return NextResponse.json({
        success: false,
        error: '该商品有进行中的抽奖，无法删除'
      }, { status: 400 });
    }

    // 删除商品
    await prisma.products.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      success: true,
      data: { message: '删除成功' }
    });
    } catch (error: any) {
      console.error('Delete product error:', error);
      return NextResponse.json({
        success: false,
        error: '删除商品失败'
      }, { status: 500 });
    }
  })(request);
}
