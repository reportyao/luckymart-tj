import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { BaseApiHandler, ApiOptions, validationSchemas, permissionConfigs } from '@/lib/api-base';
import { InputValidator, RateLimiter, PermissionValidator, AuditLogger, DataMasker } from '@/lib/security-validator';
import { createDatabaseOptimizer } from '@/lib/database-optimizer';
import { getMonitor } from '@/lib/monitoring';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
/**
 * 优化后的用户资料API
 * 展示如何使用新的API基础组件和优化措施
 */


// 数据库客户端
const prisma = new PrismaClient();

// 监控和日志
const monitor = getMonitor();
const logger = getLogger();

// 输入验证模式
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().max(255).optional(),
  language: z.string().min(2).max(5).optional(),
  avatarUrl: z.string().url().optional()
});

const GetProfileSchema = z.object({
  userId: validationSchemas.userId.optional() // 管理员可以查看其他用户
});

// API选项配置
const apiOptions: ApiOptions = {
  ...permissionConfigs.user,
  validateInput: true,
  inputSchema: GetProfileSchema,
  trackPerformance: true,
  trackBusinessMetrics: true,
  metricName: 'user_profile_requests',
  enableCache: true,
  cacheTtl: 300,
  cacheKeyBuilder: (ctx, data) => `user:${ctx.user?.id || 'unknown'}:profile`,
  enableRateLimit: true,
  rateLimitConfig: RateLimiter.getConfig('DEFAULT')
};

// 用户资料API处理器
class UserProfileApiHandler extends BaseApiHandler {
  private inputValidator: InputValidator;
  private rateLimiter: RateLimiter;
  private permissionValidator: PermissionValidator;
  private auditLogger: AuditLogger;
  private databaseOptimizer: ReturnType<typeof createDatabaseOptimizer>;

  constructor() {
    super(apiOptions);
    
    // 初始化安全组件
    this.inputValidator = new InputValidator(prisma);
    this.rateLimiter = new RateLimiter();
    this.permissionValidator = new PermissionValidator(prisma);
    this.auditLogger = new AuditLogger();
    this.databaseOptimizer = createDatabaseOptimizer(monitor);
  }

  /**
   * 处理GET请求 - 获取用户资料
   */
  async executeBusinessLogic(ctx: any): Promise<any> {
    const { request } = ctx;
    const validatedInput = (ctx as any).validatedInput || {};
    
    try {
      // 检查频率限制
      const rateLimitKey = `profile_get:${ctx.user?.id || 'anonymous'}`;
      const rateLimitResult = await this.rateLimiter.checkRateLimit(rateLimitKey);
      
      if (!rateLimitResult.allowed) {
        throw this.createError('RATE_LIMIT_EXCEEDED', '请求频率超限，请稍后再试');
      }

      let userId = validatedInput.userId;
      const isViewingOtherUser = userId && userId !== ctx.user.id;

      // 权限检查 - 如果查看其他用户，需要管理员权限
      if (isViewingOtherUser) {
        if (this.options.requireAdmin && ctx.admin) {
          // 管理员权限验证
          const adminPermission = await this.permissionValidator.validateAdminPermissions(;
            ctx.admin.id,
            'users',
            'read'
          );
          
          if (!adminPermission.canPerform) {
            throw this.createError('FORBIDDEN', '没有查看用户资料的权限');
          }
        } else {
          throw this.createError('FORBIDDEN', '无权限查看其他用户资料');
        }
      }

      // 如果没有指定用户ID，使用当前用户
      if (!userId) {
        userId = ctx.user.id;
      }

      // 使用数据库优化器构建查询
      const optimizedQuery = this.databaseOptimizer.queryOptimizer.optimizeJoinQuery(;
        prisma,
        'users',
        {
          where: { id: userId },
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            language: true,
            balance: true,
            vipLevel: true,
            totalSpent: true,
            freeDailyCount: true,
            lastFreeResetDate: true,
            createdAt: true,
            updatedAt: true
          }
        }
      );

      // 执行查询
      const user = await prisma.users.findUnique(optimizedQuery);

      if (!user) {
        throw this.createError('NOT_FOUND', '用户不存在');
      }

      // 脱敏敏感数据
      const maskedUser = DataMasker.maskSensitiveData(user, ['telegramId']);

      // 记录审计日志
      this.auditLogger.logUserAction(
        ctx.user.id,
        'view_profile',
        'user',
        {
          targetUserId: userId,
          isViewingOtherUser
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent'),
          sessionId: ctx.sessionId
        }
      );

      // 记录业务指标
      this.monitor.increment('user_profile_viewed', 1, {
        userId: userId,
        isViewingOtherUser: isViewingOtherUser.toString()
      });

      return maskedUser;
  }

    } catch (error) {
      this.logger.error('User profile fetch failed', error as Error, {
        requestId: ctx.requestId,
        userId: ctx.user?.id,
        targetUserId: validatedInput.userId
      });
      
      throw error;
    }
  }
}

// POST请求处理器 - 更新用户资料
class UpdateUserProfileHandler extends BaseApiHandler {
  private inputValidator: InputValidator;
  private rateLimiter: RateLimiter;
  private auditLogger: AuditLogger;
  private databaseOptimizer: ReturnType<typeof createDatabaseOptimizer>;

  constructor() {
    super({
      ...permissionConfigs.user,
      validateInput: true,
      inputSchema: UpdateProfileSchema,
      trackPerformance: true,
      enableRateLimit: true,
      rateLimitConfig: RateLimiter.getConfig('SENSITIVE')
    });
    
    this.inputValidator = new InputValidator(prisma);
    this.rateLimiter = new RateLimiter();
    this.auditLogger = new AuditLogger();
    this.databaseOptimizer = createDatabaseOptimizer(monitor);
  }

  async executeBusinessLogic(ctx: any): Promise<any> {
    const { request } = ctx;
    const validatedInput = (ctx as any).validatedInput;
    
    try {
      // 检查频率限制
      const rateLimitKey = `profile_update:${ctx.user.id}`;
      const rateLimitResult = await this.rateLimiter.checkRateLimit(rateLimitKey);
      
      if (!rateLimitResult.allowed) {
        throw this.createError('RATE_LIMIT_EXCEEDED', '更新频率超限，请稍后再试');
  }
      }

      // 安全验证和输入清理
      const sanitizedInput = await this.inputValidator.validateAndSanitize(;
        validatedInput,
        UpdateProfileSchema,
        {
          userId: ctx.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1'
        }
      );

      // 执行优化的事务更新
      const updatedUser = await this.databaseOptimizer.transactionOptimizer.executeOptimizedTransaction(;
        prisma,
        async (tx) => {
          return tx.users.update({
  }
            where: { id: ctx.user.id },
            data: {
              ...sanitizedInput,
              updatedAt: new Date()
            }
          });
        }
      );

      // 脱敏返回数据
      const maskedUser = DataMasker.maskSensitiveData(updatedUser, ['telegramId']);

      // 记录审计日志
      this.auditLogger.logUserAction(
        ctx.user.id,
        'update_profile',
        'user',
        {
          updatedFields: Object.keys(sanitizedInput),
          previousData: {
            firstName: ctx.user.firstName,
            lastName: ctx.user.lastName,
            language: ctx.user.language
          }
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent'),
          sessionId: ctx.sessionId
        }
      );

      // 清除相关缓存
      // TODO: 实现缓存失效逻辑
      
      return maskedUser;

    } catch (error) {
      this.logger.error('User profile update failed', error as Error, {
        requestId: ctx.requestId,
        userId: ctx.user.id,
        errorType: error.name
      });
      
      throw error;
    }
  }
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `profile-optimized_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('profile-optimized_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('profile-optimized_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
}
});

async function handleGET(request: NextRequest) {

    // 导出API路由
    export async function GET(request: NextRequest) {
      const handler = new UserProfileApiHandler();
      return handler.handleRequest(request);
    }

    export async function POST(request: NextRequest) {
      const handler = new UpdateUserProfileHandler();
      return handler.handleRequest(request);
    }

    /**
     * API文档和使用示例
     * 
     * GET /api/user/profile
     * 获取当前用户的资料信息
     * 
     * Headers:
     *   Authorization: Bearer <token>
     * 
     * Query Parameters:
     *   userId?: string - 用户ID（管理员权限才能查看其他用户）
     * 
     * Response:
     *   {
     *     "success": true,
     *     "data": {
     *       "id": "uuid",
     *       "username": "string",
     *       "firstName": "string",
     *       "lastName": "string",
     *       "avatarUrl": "string",
     *       "language": "zh",
     *       "balance": "decimal",
     *       "vipLevel": 0,
     *       "totalSpent": "decimal",
     *       "freeDailyCount": 0,
     *       "lastFreeResetDate": "datetime",
     *       "createdAt": "datetime",
     *       "updatedAt": "datetime"
}
 *     "timestamp": "2025-10-31T10:08:09.000Z",
 *     "requestId": "req_1727687890123_abc123def"
 *   }
 * 
 * POST /api/user/profile
 * 更新当前用户的资料信息
 * 
 * Headers:
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 * 
 * Request Body:
 *   {
 *     "firstName": "string", // 可选
 *     "lastName": "string",  // 可选
 *     "language": "zh",      // 可选
 *     "avatarUrl": "string"  // 可选
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       // 更新后的用户资料
 *     },
 *     "timestamp": "2025-10-31T10:08:09.000Z",
 *     "requestId": "req_1727687890456_def456ghi"
 *   }
 * 
 * 错误响应:
 *   {
 *     "success": false,
 *     "error": "错误描述",
 *     "code": "ERROR_CODE",
 *     "timestamp": "2025-10-31T10:08:09.000Z",
 *     "requestId": "req_1727687890789_ghi789jkl"
 *   }
 * 
 * 常见错误码:
 *   - UNAUTHORIZED: 未授权访问
 *   - FORBIDDEN: 权限不足
 *   - NOT_FOUND: 用户不存在
 *   - INVALID_INPUT: 输入参数无效
 *   - RATE_LIMIT_EXCEEDED: 请求频率超限
 * 
 * 性能优化:
 *   - 使用数据库查询优化器
 *   - 实现缓存机制
 *   - 添加频率限制
 *   - 记录详细的审计日志
 *   - 脱敏敏感数据
 * 
 * 安全特性:
 *   - 输入验证和清理
 *   - SQL注入防护
 *   - XSS防护
 *   - 权限验证
 *   - 审计日志记录
 */