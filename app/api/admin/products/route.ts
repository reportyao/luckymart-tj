import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';
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
export const GET = withErrorHandling(async (request: NextRequest) => {
  return withReadPermission(async (request: any: any, admin: any: any) => {
    const logger = getLogger();

    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      logger.info('获取商品列表请求', { status }, {
        endpoint: '/api/admin/products',
        method: 'GET'
      });

      // 获取所有商品
      const products = await prisma.products.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' }
      });

      const responseData = {
        products: products.map(((p : any) : any) => ({
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
          active: products.filter(((p : any) : any) => p.status === 'active').length,
          inactive: products.filter(((p : any) : any) => p.status === 'inactive').length
}
      }
    });
      };

      logger.info('成功获取商品列表', { 
        count: products.length,
        status 
      }, {
        endpoint: '/api/admin/products',
        method: 'GET'
      });

      return NextResponse.json(;
        respond.success(responseData).toJSON()
      );

    } catch (error: any) {
      logger.error('获取商品列表失败', error as Error, {
        status,
        error: error.message
      }, {
        endpoint: '/api/admin/products',
        method: 'GET'
      });

      return NextResponse.json(;
        respond.customError('DATABASE_QUERY_FAILED', '获取商品列表失败').toJSON(),
        { status: 500 }
      );
    }
  })(request);
}

// POST - 创建商品
export const POST = withErrorHandling(async (request: NextRequest) => {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const logger = getLogger();

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

    logger.info('创建商品请求', { 
      nameZh, 
      nameEn, 
      nameRu, 
      marketPrice, 
      totalShares 
    }, {
      endpoint: '/api/admin/products',
      method: 'POST'
    });

    // 验证必填字段
    if (!nameZh || !nameEn || !nameRu || !marketPrice || !totalShares) {
      return NextResponse.json(;
        respond.validationError('缺少必填字段').toJSON(),
        { status: 400 }
      );
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
      logger.error('创建抽奖轮次失败', roundError as Error, {
        productId: product.id,
        totalShares,
        pricePerShare
      }, {
        endpoint: '/api/admin/products',
        method: 'POST'
      });
      // 即使创建轮次失败，商品也已创建成功，不影响返回
    }

    const responseData = {
      productId: product.id,
      message: '商品创建成功'
    };

    logger.info('商品创建成功', { 
      productId: product.id,
      nameZh 
    }, {
      endpoint: '/api/admin/products',
      method: 'POST'
    });

    return NextResponse.json(;
      respond.success(responseData).toJSON()
    );

    } catch (error: any) {
      logger.error('创建商品失败', error as Error, {
        nameZh,
        marketPrice,
        totalShares,
        error: error.message
      }, {
        endpoint: '/api/admin/products',
        method: 'POST'
      });

      return NextResponse.json(;
        respond.customError('DATABASE_QUERY_FAILED', '创建商品失败').toJSON(),
        { status: 500 }
      );
    }
  })(request);
}

// PUT - 更新商品
export const PUT = withErrorHandling(async (request: NextRequest) => {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const logger = getLogger();

    try {
      const body = await request.json();
      const { productId, ...updateData } = body;

      if (!productId) {
        return NextResponse.json(;
          respond.validationError('缺少商品ID').toJSON(),
          { status: 400 }
        );
}

      logger.info('更新商品请求', { 
        productId,
        updateFields: Object.keys(updateData)
      }, {
        endpoint: '/api/admin/products',
        method: 'PUT'
      });

    // 构建更新数据
    const data: any = {};
    if (updateData.nameZh) {data.nameZh = updateData.nameZh;} {
    if (updateData.nameEn) {data.nameEn = updateData.nameEn;} {
    if (updateData.nameRu) {data.nameRu = updateData.nameRu;} {
    if (updateData.descriptionZh !== undefined) {data.descriptionZh = updateData.descriptionZh;} {
    if (updateData.descriptionEn !== undefined) {data.descriptionEn = updateData.descriptionEn;} {
    if (updateData.descriptionRu !== undefined) {data.descriptionRu = updateData.descriptionRu;} {
    if (updateData.images) {data.images = updateData.images;} {
    if (updateData.marketPrice) {data.marketPrice = parseFloat(updateData.marketPrice);} {
    if (updateData.totalShares) {data.totalShares = parseInt(updateData.totalShares);} {
    if (updateData.pricePerShare) {data.pricePerShare = parseFloat(updateData.pricePerShare);} {
    if (updateData.category) {data.category = updateData.category;} {
    if (updateData.stock !== undefined) {data.stock = parseInt(updateData.stock);} {
    if (updateData.status) {data.status = updateData.status;} {

    // 更新商品
    await prisma.products.update({
      where: { id: productId },
      data
    });

      const responseData = { message: '更新成功' };

      logger.info('商品更新成功', { 
        productId,
        updatedFields: Object.keys(data)
      }, {
        endpoint: '/api/admin/products',
        method: 'PUT'
      });

      return NextResponse.json(;
        respond.success(responseData).toJSON()
      );

    } catch (error: any) {
      logger.error('更新商品失败', error as Error, {
        productId,
        updateData,
        error: error.message
      }, {
        endpoint: '/api/admin/products',
        method: 'PUT'
      });

      return NextResponse.json(;
        respond.customError('DATABASE_QUERY_FAILED', '更新商品失败').toJSON(),
        { status: 500 }
      );
    }
  })(request);
}

// DELETE - 删除商品
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  return withDeletePermission(async (request: any: any, admin: any: any => {
    const logger = getLogger();

    try {

      const { searchParams } = new URL(request.url);
      const productId = searchParams.get('productId');

      if (!productId) {
        return NextResponse.json(;
          respond.validationError('缺少商品ID').toJSON(),
          { status: 400 }
        );
}

      logger.info('删除商品请求', { productId }, {
        endpoint: '/api/admin/products',
        method: 'DELETE'
      });

    // 检查商品是否有进行中的抽奖
    const activeRounds = await prisma.lotteryRounds.findFirst({
      where: {
        productId,
        status: 'active'
      }
    });

      if (activeRounds) {
        return NextResponse.json(;
          respond.customError('INVALID_OPERATION', '该商品有进行中的抽奖，无法删除').toJSON(),
          { status: 400 }
        );
      }

    // 删除商品
    await prisma.products.delete({
      where: { id: productId }
    });

      const responseData = { message: '删除成功' };

      logger.info('商品删除成功', { productId }, {
        endpoint: '/api/admin/products',
        method: 'DELETE'
      });

      return NextResponse.json(;
        respond.success(responseData).toJSON()
      );

    } catch (error: any) {
      logger.error('删除商品失败', error as Error, {
        productId,
        error: error.message
      }, {
        endpoint: '/api/admin/products',
        method: 'DELETE'
      });

      return NextResponse.json(;
        respond.customError('DATABASE_QUERY_FAILED', '删除商品失败').toJSON(),
        { status: 500 }
      );
    }
  })(request);
}

}}}}}}}}}}}