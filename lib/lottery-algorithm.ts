import crypto from 'crypto';

/**
 * 开奖算法：公平透明可验证
 * 
 * 公式：(A + B) % 总份数 + 10000001
 * 
 * A = 所有参与记录ID的哈希值(SHA256)转十进制
 * B = 商品ID + 开奖时间的哈希值(SHA256)转十进制
 * 
 * 特点：
 * 1. A由所有参与者共同决定，任何人无法单独控制
 * 2. B由系统时间决定，不可预测
 * 3. 结果完全随机且可验证
 */

export interface DrawResult {
  winningNumber: number;
  A: number;
  B: number;
  hashA: string;
  hashB: string;
  totalShares: number;
  timestamp: string;
}

export function calculateWinningNumber(
  participationIds: string[],
  productId: string,
  totalShares: number
): DrawResult {
  // 1. 计算A：所有参与记录ID的哈希
  const idsString = participationIds.sort().join('');
  const hashA = crypto.createHash('sha256').update(idsString).digest('hex');
  const A = parseInt(hashA.substring(0, 8), 16); // 取前8位转十进制

  // 2. 计算B：商品ID + 当前时间戳的哈希
  const timestamp = new Date().toISOString();
  const hashB = crypto.createHash('sha256').update(`${productId}${timestamp}`).digest('hex');
  const B = parseInt(hashB.substring(0, 8), 16); // 取前8位转十进制

  // 3. 计算中奖号码
  const winningNumber = ((A + B) % totalShares) + 10000001;

  return {
    winningNumber,
    A,
    B,
    hashA,
    hashB,
    totalShares,
    timestamp
  };
}

// 验证开奖结果
export function verifyDrawResult(
  participationIds: string[],
  productId: string,
  totalShares: number,
  timestamp: string,
  expectedWinningNumber: number
): boolean {
  // 重新计算A
  const idsString = participationIds.sort().join('');
  const hashA = crypto.createHash('sha256').update(idsString).digest('hex');
  const A = parseInt(hashA.substring(0, 8), 16);

  // 重新计算B(使用记录的时间戳)
  const hashB = crypto.createHash('sha256').update(`${productId}${timestamp}`).digest('hex');
  const B = parseInt(hashB.substring(0, 8), 16);

  // 重新计算中奖号码
  const calculatedWinningNumber = ((A + B) % totalShares) + 10000001;

  return calculatedWinningNumber === expectedWinningNumber;
}

// 生成开奖证明(供用户验证)
export function generateDrawProof(result: DrawResult): string {
  return JSON.stringify({
    winningNumber: result.winningNumber,
    algorithm: '(A + B) % totalShares + 10000001',
    inputs: {
      A: result.A,
      B: result.B,
      totalShares: result.totalShares
    },
    hashes: {
      hashA: result.hashA,
      hashB: result.hashB
    },
    timestamp: result.timestamp,
    verification: 'All participants can verify this result using the participation IDs and timestamp'
  }, null, 2);
}

// 查找中奖用户
export function findWinner(
  participations: Array<{ userId: string; numbers: number[] }>,
  winningNumber: number
): string | null {
  for (const participation of participations) {
    if (participation.numbers.includes(winningNumber)) {
      return participation.userId;
    }
  }
  return null;
}
