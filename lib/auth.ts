import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ============= 常量定义 =============
const ACCESS_TOKEN_EXPIRY = '15m'; // 访问token有效期：15分钟
const REFRESH_TOKEN_EXPIRY = '7d'; // 刷新token有效期：7天
const TELEGRAM_AUTH_WINDOW = 5 * 60 * 1000; // Telegram认证时效窗口：5分钟（毫秒）
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Token刷新阈值：5分钟（毫秒）

// ============= 安全工具函数 =============

// 生成安全的随机字符串
function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// 生成哈希值
function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============= Telegram WebApp数据验证 =============

/**
 * 验证Telegram WebApp数据（增强版 - 包含时效性验证）
 * @param initData - Telegram WebApp初始数据
 * @returns 验证后的用户信息
 * @throws Error - 验证失败时抛出错误
 */
export function validateTelegramWebAppData(initData: string): any {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN环境变量未配置');
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  // 验证auth_date时效性
  const authDate = urlParams.get('auth_date');
  if (!authDate) {
    throw new Error('缺少auth_date字段');
  }

  const authTimestamp = parseInt(authDate, 10) * 1000; // 转换为毫秒
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - authTimestamp);

  // 验证时效性：5分钟窗口
  if (timeDiff > TELEGRAM_AUTH_WINDOW) {
    throw new Error(`Telegram认证数据已过期（时效窗口${TELEGRAM_AUTH_WINDOW / 1000 / 60}分钟）`);
  }

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    throw new Error('Telegram认证数据哈希验证失败');
  }

  const userStr = urlParams.get('user');
  if (!userStr) {
    throw new Error('缺少用户信息');
  }

  const user = JSON.parse(userStr);
  
  // 额外的用户信息验证
  if (!user.id || !user.first_name) {
    throw new Error('用户信息不完整');
  }

  return user;
}

// ============= JWT Token管理 =============

/**
 * 生成访问Token（15分钟有效期）
 */
export function generateAccessToken(userId: string, telegramId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET环境变量未配置');
  }

  return jwt.sign(
    { 
      userId, 
      telegramId, 
      tokenType: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'luckymart',
      audience: 'luckymart-users'
    }
  );
}

/**
 * 生成刷新Token（7天有效期）
 */
export function generateRefreshToken(userId: string, telegramId: string): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET环境变量未配置');
  }

  const refreshId = generateSecureRandom(16);
  
  return jwt.sign(
    { 
      userId, 
      telegramId, 
      tokenType: 'refresh',
      refreshId,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'luckymart',
      audience: 'luckymart-users'
    }
  );
}

/**
 * 生成Token对（访问token + 刷新token）
 */
export function generateTokenPair(userId: string, telegramId: string): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessToken = generateAccessToken(userId, telegramId);
  const refreshToken = generateRefreshToken(userId, telegramId);
  const expiresIn = 15 * 60; // 15分钟转换为秒

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
}

/**
 * 验证访问Token
 */
export function verifyAccessToken(token: string): {
  userId: string;
  telegramId: string;
  tokenType: string;
  iat: number;
} | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-users'
    }) as any;

    // 验证token类型
    if (decoded.tokenType !== 'access') {
      throw new Error('无效的token类型');
    }

    return decoded;
  } catch (error) {
    console.error('访问Token验证失败:', error);
    return null;
  }
}

/**
 * 验证刷新Token
 */
export function verifyRefreshToken(token: string): {
  userId: string;
  telegramId: string;
  tokenType: string;
  refreshId: string;
  iat: number;
} | null {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET环境变量未配置');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-users'
    }) as any;

    // 验证token类型
    if (decoded.tokenType !== 'refresh') {
      throw new Error('无效的token类型');
    }

    return decoded;
  } catch (error) {
    console.error('刷新Token验证失败:', error);
    return null;
  }
}

/**
 * 刷新访问Token
 */
export function refreshAccessToken(refreshToken: string): {
  accessToken: string;
  expiresIn: number;
} | null {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return null;
  }

  const newAccessToken = generateAccessToken(decoded.userId, decoded.telegramId);
  const expiresIn = 15 * 60; // 15分钟

  return {
    accessToken: newAccessToken,
    expiresIn
  };
}

// ============= Cookie管理 =============

/**
 * 设置认证Cookie（HttpOnly + Secure）
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  // 设置访问Token Cookie（15分钟）
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60, // 15分钟
    path: '/'
  });

  // 设置刷新Token Cookie（7天）
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/api/auth/refresh'
  });

  return response;
}

/**
 * 清除认证Cookie
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth/refresh'
  });

  return response;
}

/**
 * 从Request中提取Token
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // 首先尝试从Authorization header获取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 然后尝试从Cookie获取
  const accessToken = request.cookies.get('access_token')?.value;
  if (accessToken) {
    return accessToken;
  }

  return null;
}

// ============= 用户认证中间件 =============

/**
 * 用户认证中间件
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const token = extractTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { error: '未提供认证token', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const user = verifyAccessToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: '无效或过期的token', code: 'TOKEN_INVALID' },
          { status: 401 }
        );
      }

      // 检查token是否接近过期（5分钟内）
      const now = Date.now() / 1000;
      const timeToExpiry = (user.iat + 15 * 60) - now; // 15分钟过期
      if (timeToExpiry < 5 * 60) { // 少于5分钟
        const response = await handler(request, user);
        
        // 在响应头中标记需要刷新token
        response.headers.set('X-Token-Expiring', 'true');
        return response;
      }

      return await handler(request, user);
    } catch (error) {
      console.error('认证中间件错误:', error);
      return NextResponse.json(
        { error: '认证失败', code: 'AUTH_FAILED' },
        { status: 401 }
      );
    }
  };
}

// ============= 管理员权限验证 =============

/**
 * 验证管理员权限（增强版）
 */
export function verifyAdminToken(token: string): {
  adminId: string;
  username: string;
  role: string;
  permissions: string[];
  iat: number;
} | null {
  try {
    if (!process.env.JWT_ADMIN_SECRET) {
      throw new Error('JWT_ADMIN_SECRET环境变量未配置');
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-admin'
    }) as any;

    // 验证是否为管理员角色
    if (!decoded.role || !['admin', 'super_admin'].includes(decoded.role)) {
      throw new Error('无效的管理员角色');
    }

    // 验证权限
    if (!decoded.permissions || !Array.isArray(decoded.permissions)) {
      throw new Error('管理员权限信息缺失');
    }

    return decoded;
  } catch (error) {
    console.error('管理员Token验证失败:', error);
    return null;
  }
}

/**
 * 生成管理员Token
 */
export function generateAdminToken(
  adminId: string, 
  username: string, 
  role: string = 'admin',
  permissions: string[] = []
): string {
  if (!process.env.JWT_ADMIN_SECRET) {
    throw new Error('JWT_ADMIN_SECRET环境变量未配置');
  }

  return jwt.sign(
    { 
      adminId, 
      username, 
      role,
      permissions,
      tokenType: 'admin',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_ADMIN_SECRET,
    { 
      expiresIn: '8h', // 管理员token：8小时
      issuer: 'luckymart',
      audience: 'luckymart-admin'
    }
  );
}

/**
 * 从Request中提取管理员信息
 */
export function getAdminFromRequest(request: NextRequest): {
  adminId: string;
  username: string;
  role: string;
  permissions: string[];
  iat: number;
} | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return verifyAdminToken(token);
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    return null;
  }
}

/**
 * 管理员权限中间件
 */
export function withAdminAuth(
  requiredPermissions: string[] = []
) {
  return function(
    handler: (request: NextRequest, admin: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest) => {
      try {
        const admin = getAdminFromRequest(request);
        
        if (!admin) {
          return NextResponse.json(
            { error: '管理员权限验证失败', code: 'ADMIN_UNAUTHORIZED' },
            { status: 403 }
          );
        }

        // 检查权限
        if (requiredPermissions.length > 0) {
          const hasPermission = requiredPermissions.every(permission => 
            admin.permissions.includes(permission) || admin.role === 'super_admin'
          );

          if (!hasPermission) {
            return NextResponse.json(
              { 
                error: '权限不足', 
                code: 'INSUFFICIENT_PERMISSIONS',
                required: requiredPermissions 
              },
              { status: 403 }
            );
          }
        }

        return await handler(request, admin);
      } catch (error) {
        console.error('管理员认证中间件错误:', error);
        return NextResponse.json(
          { error: '管理员认证失败', code: 'ADMIN_AUTH_FAILED' },
          { status: 401 }
        );
      }
    };
  };
}

/**
 * 权限检查装饰器
 */
export function requirePermissions(permissions: string[]) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const request = args[0];
      const admin = getAdminFromRequest(request);
      
      if (!admin) {
        return NextResponse.json(
          { error: '管理员权限验证失败', code: 'ADMIN_UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const hasPermission = permissions.every(permission => 
        admin.permissions.includes(permission) || admin.role === 'super_admin'
      );

      if (!hasPermission) {
        return NextResponse.json(
          { 
            error: '权限不足', 
            code: 'INSUFFICIENT_PERMISSIONS',
            required: permissions 
          },
          { status: 403 }
        );
      }

      return await method.apply(this, args);
    };
  };
}

// ============= 密码安全 =============

/**
 * 哈希密码（使用bcrypt）
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // 提高salt轮数增强安全性
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('密码长度至少8位');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('至少包含一个小写字母');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('至少包含一个大写字母');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('至少包含一个数字');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('至少包含一个特殊字符');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

// ============= 安全最佳实践 =============

/**
 * 生成CSRF Token
 */
export function generateCSRFToken(): string {
  return generateSecureRandom(32);
}

/**
 * 验证CSRF Token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return generateHash(token) === sessionToken;
}

/**
 * 速率限制检查（内存实现，生产环境建议使用Redis）
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15分钟
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // 重置记录
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    };
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime
  };
}

/**
 * 安全响应头设置
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // 防止XSS攻击
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HTTPS强制
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // CSP头（根据需要调整）
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// ============= 向后兼容 =============

/**
 * 兼容旧版generateToken函数
 * @deprecated 使用generateAccessToken代替
 */
export function generateToken(userId: string, telegramId: string): string {
  console.warn('generateToken已弃用，请使用generateAccessToken');
  return generateAccessToken(userId, telegramId);
}

/**
 * 兼容旧版verifyToken函数
 * @deprecated 使用verifyAccessToken代替
 */
export function verifyToken(token: string): { userId: string; telegramId: string; role?: string } | null {
  console.warn('verifyToken已弃用，请使用verifyAccessToken');
  const result = verifyAccessToken(token);
  if (result) {
    return {
      userId: result.userId,
      telegramId: result.telegramId,
      role: 'user'
    };
  }
  return null;
}

/**
 * 兼容旧版getUserFromRequest函数
 * @deprecated 使用withAuth中间件代替
 */
export function getUserFromRequest(request: Request): { userId: string; telegramId: string } | null {
  console.warn('getUserFromRequest已弃用，请使用withAuth中间件');
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const result = verifyAccessToken(token);
    
    if (result) {
      return {
        userId: result.userId,
        telegramId: result.telegramId
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

// ============= 类型定义 =============
export interface AuthenticatedUser {
  userId: string;
  telegramId: string;
  tokenType: string;
  iat: number;
}

export interface AdminUser {
  adminId: string;
  username: string;
  role: string;
  permissions: string[];
  iat: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}