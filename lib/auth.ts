import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ============= 常量定义 =============
const ACCESS_TOKEN_EXPIRY = '15m'; // 访问token有效期：15分钟
const REFRESH_TOKEN_EXPIRY = '7d'; // 刷新token有效期：7天
const TELEGRAM_AUTH_WINDOW = 5 * 60 * 1000; // Telegram认证时效窗口：5分钟（毫秒）
const TELEGRAM_HASH_ALGORITHM = 'sha256'; // Telegram使用的哈希算法
const TELEGRAM_SECRET_PREFIX = 'WebAppData'; // Telegram密钥前缀
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Token刷新阈值：5分钟（毫秒）

// ============= 邀请系统常量 =============
const REFERRAL_CODE_LENGTH = 8; // 邀请码长度
const REFERRAL_CODE_PREFIX = 'LM'; // 邀请码前缀
const MAX_REFERRAL_DEPTH = 3; // 最大推荐层级
const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 邀请码字符集

// ============= 安全工具函数 =============

// 生成安全的随机字符串
function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// 生成哈希值
function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============= 邀请码生成和验证 =============

/**
 * 生成唯一邀请码
 */
function generateUniqueReferralCode(): string {
  const chars = REFERRAL_CODE_CHARS;
  let result = REFERRAL_CODE_PREFIX;
  
  for (let i = 0; i < REFERRAL_CODE_LENGTH - REFERRAL_CODE_PREFIX.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 验证邀请码格式
 */
export function validateReferralCodeFormat(code: string): {
  isValid: boolean;
  error?: string;
} {
  if (!code) {
    return { isValid: false, error: '邀请码不能为空' };
  }

  if (code.length !== REFERRAL_CODE_LENGTH) {
    return { isValid: false, error: `邀请码长度必须为${REFERRAL_CODE_LENGTH}位` };
  }

  if (!code.startsWith(REFERRAL_CODE_PREFIX)) {
    return { isValid: false, error: '邀请码格式无效' };
  }

  // 检查是否包含有效字符
  const invalidChars = code.split('').filter(char => !REFERRAL_CODE_CHARS.includes(char));
  if (invalidChars.length > 0) {
    return { isValid: false, error: '邀请码包含无效字符' };
  }

  return { isValid: true };
}

/**
 * 生成邀请相关的安全令牌
 */
export function generateReferralToken(userId: string, referrerId: string, expiresIn: string = '24h'): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET环境变量未配置');
  }

  return jwt.sign(
    {
      userId,
      referrerId,
      tokenType: 'referral',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    {
      expiresIn,
      issuer: 'luckymart',
      audience: 'luckymart-referral'
    }
  );
}

/**
 * 验证邀请令牌
 */
export function verifyReferralToken(token: string): {
  userId: string;
  referrerId: string;
  tokenType: string;
  iat: number;
} | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-referral'
    }) as any;

    // 验证token类型
    if (decoded.tokenType !== 'referral') {
      throw new Error('无效的邀请token类型');
    }

    return decoded;
  } catch (error) {
    console.error('邀请Token验证失败:', error);
    return null;
  }
}

// ============= Telegram WebApp数据验证 =============

/**
 * 验证Telegram WebApp数据（完整安全版本 - 防止认证绕过）
 * @param initData - Telegram WebApp初始数据
 * @returns 验证后的用户信息
 * @throws Error - 验证失败时抛出错误
 */
export function validateTelegramWebAppData(initData: string): any {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN环境变量未配置');
  }

  if (!initData || typeof initData !== 'string') {
    throw new Error('无效的initData格式');
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  
  if (!hash) {
    throw new Error('缺少hash字段');
  }

  // 提取并删除hash字段
  urlParams.delete('hash');

  // 1. 验证auth_date时效性（防止重放攻击）
  const authDate = urlParams.get('auth_date');
  if (!authDate) {
    throw new Error('缺少auth_date字段');
  }

  const authTimestamp = parseInt(authDate, 10);
  if (isNaN(authTimestamp) || authTimestamp <= 0) {
    throw new Error('无效的auth_date格式');
  }

  const currentTime = Math.floor(Date.now() / 1000); // 秒级时间戳
  const timeDiff = currentTime - authTimestamp;

  // 严格验证时效性：5分钟窗口期
  if (timeDiff < -60) {
    // 允许60秒的系统时间偏差（客户端时间超前）
    throw new Error('认证数据时间超前，请检查设备时间');
  }
  
  if (timeDiff > TELEGRAM_AUTH_WINDOW / 1000) {
    throw new Error(`Telegram认证数据已过期（时效窗口${TELEGRAM_AUTH_WINDOW / 1000 / 60}分钟），请重新授权`);
  }

  // 2. 验证必需字段存在性
  const userStr = urlParams.get('user');
  if (!userStr) {
    throw new Error('缺少用户信息');
  }

  // 3. 解析并验证用户信息格式
  let user: any;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    throw new Error('用户信息格式无效');
  }

  // 4. 验证用户信息完整性
  if (!user || typeof user !== 'object') {
    throw new Error('用户信息不是有效对象');
  }

  if (!user.id || typeof user.id !== 'number') {
    throw new Error('缺少或无效的用户ID');
  }

  if (!user.first_name || typeof user.first_name !== 'string') {
    throw new Error('缺少或无效的用户名');
  }

  // 5. 生成data_check_string（严格按照Telegram文档）
  const dataCheckString = Array.from(urlParams.entries())
    .filter(([key, value]) => key && value !== null && value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  if (!dataCheckString) {
    throw new Error('无有效的认证参数');
  }

  // 6. 按照Telegram官方文档计算HMAC密钥
  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN, 'utf8')
    .digest();

  // 7. 计算数据哈希
  // hash = HMAC_SHA256(data_check_string, secret_key)
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString, 'utf8')
    .digest('hex');

  // 8. 验证哈希匹配（防止数据篡改）
  if (calculatedHash !== hash) {
    console.warn('Telegram认证失败:', {
      providedHash: hash,
      calculatedHash,
      dataCheckString: dataCheckString.substring(0, 100) + '...'
    });
    throw new Error('Telegram认证数据哈希验证失败，可能是数据被篡改或Bot Token配置错误');
  }

  // 9. 额外的安全验证：检查用户ID的有效性范围
  if (user.id <= 0 || user.id > 9223372036854775807) {
    throw new Error('无效的用户ID范围');
  }

  // 10. 验证用户名长度（防止过长字符串攻击）
  if (user.first_name.length > 100 || (user.last_name && user.last_name.length > 100)) {
    throw new Error('用户名长度超出限制');
  }

  // 11. 清理并返回安全的用户信息
  return {
    id: user.id,
    first_name: user.first_name.substring(0, 100), // 限制长度
    last_name: user.last_name ? user.last_name.substring(0, 100) : undefined,
    username: user.username ? user.username.substring(0, 100) : undefined,
    language_code: user.language_code,
    photo_url: user.photo_url ? user.photo_url.substring(0, 500) : undefined,
    allows_write_to_pm: user.allows_write_to_pm,
    auth_date: authTimestamp
  };
}

// ============= JWT Token管理 =============

/**
 * 生成访问Token（15分钟有效期 - 加强安全版本）
 */
export function generateAccessToken(userId: string, telegramId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET环境变量未配置');
  }

  if (!userId || !telegramId) {
    throw new Error('用户ID和Telegram ID不能为空');
  }

  const payload = {
    userId: String(userId),
    telegramId: String(telegramId),
    tokenType: 'access',
    iat: Math.floor(Date.now() / 1000),
    jti: generateSecureRandom(16) // 添加唯一标识符防止重放攻击
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'luckymart',
    audience: 'luckymart-users',
    algorithm: 'HS256',
    header: {
      typ: 'JWT',
      alg: 'HS256',
      kid: 'access-v1'
    }
  });
}

/**
 * 生成刷新Token（7天有效期 - 加强安全版本）
 */
export function generateRefreshToken(userId: string, telegramId: string): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET环境变量未配置');
  }

  if (!userId || !telegramId) {
    throw new Error('用户ID和Telegram ID不能为空');
  }

  const refreshId = generateSecureRandom(16);
  
  const payload = {
    userId: String(userId),
    telegramId: String(telegramId),
    tokenType: 'refresh',
    refreshId,
    iat: Math.floor(Date.now() / 1000),
    jti: generateSecureRandom(16) // 添加唯一标识符
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'luckymart',
    audience: 'luckymart-users',
    algorithm: 'HS256',
    header: {
      typ: 'JWT',
      alg: 'HS256',
      kid: 'refresh-v1'
    }
  });
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
 * 验证访问Token（加强安全版本）
 */
export function verifyAccessToken(token: string): {
  userId: string;
  telegramId: string;
  tokenType: string;
  iat: number;
  jti?: string;
} | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('无效的token格式');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-users',
      algorithms: ['HS256']
    }) as any;

    // 验证token类型
    if (decoded.tokenType !== 'access') {
      throw new Error('无效的token类型');
    }

    // 验证必需字段
    if (!decoded.userId || !decoded.telegramId || !decoded.jti) {
      throw new Error('token字段缺失或不完整');
    }

    // 验证JWT ID存在性（防止重放攻击）
    if (typeof decoded.jti !== 'string' || decoded.jti.length < 8) {
      throw new Error('无效的token唯一标识符');
    }

    return decoded;
  } catch (error) {
    console.error('访问Token验证失败:', error);
    return null;
  }
}

/**
 * 验证刷新Token（加强安全版本）
 */
export function verifyRefreshToken(token: string): {
  userId: string;
  telegramId: string;
  tokenType: string;
  refreshId: string;
  iat: number;
  jti?: string;
} | null {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET环境变量未配置');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('无效的token格式');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'luckymart',
      audience: 'luckymart-users',
      algorithms: ['HS256']
    }) as any;

    // 验证token类型
    if (decoded.tokenType !== 'refresh') {
      throw new Error('无效的token类型');
    }

    // 验证必需字段
    if (!decoded.userId || !decoded.telegramId || !decoded.refreshId) {
      throw new Error('token字段缺失或不完整');
    }

    // 验证refreshId格式
    if (typeof decoded.refreshId !== 'string' || decoded.refreshId.length < 8) {
      throw new Error('无效的refreshId');
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

export interface ReferralInfo {
  userId: string;
  telegramId: string;
  referralCode: string;
  referrerId?: string;
  referralLevel?: number;
}

export interface ReferralValidationResult {
  isValid: boolean;
  error?: string;
  referrerId?: string;
  riskScore?: number;
}