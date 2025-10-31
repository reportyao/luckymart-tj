import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// 环境变量验证
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
}

// Prisma客户端配置 - 优化连接管理
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // 连接池配置
  errorFormat: 'pretty',
  // 连接超时配置
  __internal: {
    engine: {
      // 连接超时时间（毫秒）
      connectionLimit: 10,
      // 获取连接超时时间（毫秒）
      acquireTimeoutMillis: 60000,
      // 连接空闲超时时间（毫秒）
      idleTimeoutMillis: 300000
    }
  }
};

export const prisma =
  global.prisma ||
  new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 连接健康检查
let connectionChecked = false;
export const checkPrismaConnection = async (): Promise<boolean> => {
  if (!connectionChecked) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectionChecked = true;
      return true;
    } catch (error) {
      console.error('Prisma连接健康检查失败:', error);
      return false;
    }
  }
  return true;
};

// 优雅关闭连接
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect();
    console.log('Prisma连接已优雅关闭');
  } catch (error) {
    console.error('关闭Prisma连接时出错:', error);
  }
});
