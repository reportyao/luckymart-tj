import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 从Request中获取用户信息
export function getUserFromRequest(request: Request): { userId: string; telegramId: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      telegramId: string;
    };

    return decoded;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

// 生成Token
export function generateToken(userId: string, telegramId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET环境变量未配置');
  }
  
  return jwt.sign(
    { userId, telegramId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 哈希密码
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 验证Token
export function verifyToken(token: string): { userId: string; telegramId: string; role?: string } | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      telegramId: string;
      role?: string;
    };

    return decoded;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

// 验证管理员Token
export function verifyAdminToken(token: string): { adminId: string; username: string; role: string } | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未配置');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      adminId: string;
      username: string;
      role: string;
    };

    // 验证是否为管理员角色
    if (!decoded.role || !['admin', 'super_admin'].includes(decoded.role)) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('管理员Token验证失败:', error);
    return null;
  }
}

// 从Request中验证管理员权限
export function getAdminFromRequest(request: Request): { adminId: string; username: string; role: string } | null {
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
