import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.products.read()
});

// GET - 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withReadPermission(async (request: any, admin: any) => {
    try {
    const productId = params.id;

    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: '商品不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          nameZh: product.nameZh,
          nameEn: product.nameEn,
          nameRu: product.nameRu,
          descriptionZh: product.descriptionZh,
          descriptionEn: product.descriptionEn,
          descriptionRu: product.descriptionRu,
          images: product.images,
          marketPrice: Number(product.marketPrice),
          totalShares: product.totalShares,
          pricePerShare: Number(product.pricePerShare),
          category: product.category,
          stock: product.stock,
          status: product.status,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString()
        }
      }
    });
    } catch (error: any) {
      console.error('获取商品详情失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取商品详情失败'
      }, { status: 500 });
    }
  })(request);
}
