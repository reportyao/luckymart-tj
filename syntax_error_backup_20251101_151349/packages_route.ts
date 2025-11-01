import { NextRequest, NextResponse } from 'next/server';
import {
import { withAuth } from '@/lib/auth';
import { getLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
/**
 * 充值包API路由 - 多语言版本
 * 
 * 支持根据用户语言偏好返回翻译后的充值包数据
 * 集成首充奖励系统，显示各档位对应的首充奖励
 */

  RechargePackageMultilingualService,
  type SupportedLanguage,
} from '@/lib/services/multilingual-query';

// 首充奖励配置
const FIRST_RECHARGE_REWARDS = {
  10: { reward: 2, rate: 0.20 },    // 充值10 Som → 奖励2 Som (20%)
  20: { reward: 5, rate: 0.25 },    // 充值20 Som → 奖励5 Som (25%)
  50: { reward: 15, rate: 0.30 },   // 充值50 Som → 奖励15 Som (30%)
  100: { reward: 35, rate: 0.35 },  // 充值100 Som → 奖励35 Som (35%)
} as const;

type RechargeAmount = keyof typeof FIRST_RECHARGE_REWARDS;

/**
 * 检查用户是否满足首充奖励条件
 */
async function checkFirstRechargeEligibility(userId: string): Promise<{
  isEligible: boolean;
  hasFirstRecharge: boolean;
}> {
  try {
    // 检查用户是否已有完成的首充记录
    const existingRecharge = await prisma.orders.findFirst({
      where: {
        userId,
        type: 'recharge',
        paymentStatus: 'paid',
        fulfillmentStatus: 'completed'
      }
    });

    return {
      isEligible: !existingRecharge,
      hasFirstRecharge: !!existingRecharge
    };
  } catch (error) {
    console.error('检查首充资格失败:', error);
    return {
  }
      isEligible: false,
      hasFirstRecharge: false
    };
  }
}

/**
 * 获取包的首充奖励信息
 */
function getFirstRechargeInfo(packageAmount: number, isEligible: boolean) {
  const rewardConfig = FIRST_RECHARGE_REWARDS[packageAmount as RechargeAmount];
  
  if (!rewardConfig) {
    return null;
  }

  return {
    isAvailable: isEligible,
    amount: rewardConfig.reward,
    rate: rewardConfig.rate,
    description: `首充奖励${rewardConfig.reward} Som (${Math.round(rewardConfig.rate * 100)}%)`,
    type: 'bonus_coins' as const,
    conditions: isEligible ? '首次充值即可获得' : '仅限首次充值',
    highlight: isEligible,
    savings: rewardConfig.reward
  };
}

/**
 * GET /api/recharge/packages
 * 
 * 查询参数:
 * - language: 用户首选语言 (zh-CN, en-US, ru-RU, tg-TJ)
 * - includeFirstRecharge: 是否包含首充奖励信息 (默认true)
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  const logger = getLogger();
  const requestId = `recharge_packages_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('查询充值包列表', {
      requestId,
      userId: user.userId
    });

    const { searchParams } = new URL(request.url);
    const languageParam = searchParams.get('language') || 'tg-TJ';
    const includeFirstRecharge = searchParams.get('includeFirstRecharge') !== 'false';
    
    // 映射旧语言代码到新格式
    const languageMap: Record<string, SupportedLanguage> = {
      'zh': 'zh-CN',
      'en': 'en-US',
      'ru': 'ru-RU',
      'tg': 'tg-TJ',
      'zh-CN': 'zh-CN',
      'en-US': 'en-US',
      'ru-RU': 'ru-RU',
      'tg-TJ': 'tg-TJ',
    };
    
    const language = languageMap[languageParam] || 'tg-TJ';

    // 验证语言参数
    const validLanguages: SupportedLanguage[] = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(;
}
        {
          success: false,
          error: {
            code: 'INVALID_LANGUAGE',
            message: `不支持的语言代码: ${language}。支持的语言: ${validLanguages.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // 检查用户首充资格
    const eligibility = await checkFirstRechargeEligibility(user.userId);

    // 使用多语言服务查询充值包
    const packages = await RechargePackageMultilingualService.getPackagesByLanguage(language);

    // 为每个充值包添加首充奖励信息
    const enhancedPackages = packages.map((pkg: any) => {
      const packageAmount = Number(pkg.price);
      
      // 克隆包数据避免修改原始数据
      const enhancedPackage = { ...pkg };

      // 添加首充奖励信息
      if (includeFirstRecharge) {
        const firstRechargeInfo = getFirstRechargeInfo(packageAmount, eligibility.isEligible);
        if (firstRechargeInfo) {
          enhancedPackage.firstRecharge = firstRechargeInfo;
          
          // 添加推荐标签
          if (firstRechargeInfo.isAvailable && firstRechargeInfo.rate >= 0.30) {
            enhancedPackage.recommended = true;
            enhancedPackage.recommendedReason = '首充奖励比例最高';
          }
          
          // 计算实际获得金额（原价 + 首充奖励）
          if (firstRechargeInfo.isAvailable) {
            const actualCoins = pkg.coins + pkg.bonusCoins;
            const totalReward = firstRechargeInfo.amount + actualCoins;
            enhancedPackage.totalReward = {
              coins: totalReward,
              bonus: firstRechargeInfo.amount,
              description: `总计${totalReward}夺宝币（基础${actualCoins} + 首充奖励${firstRechargeInfo.amount}）`
            };
          }
        }
      }

      return enhancedPackage;
    });

    // 按推荐度和价格排序
    enhancedPackages.sort((a, b) => {
      // 推荐项目优先
      if (a.recommended && !b.recommended) return -1; {
      if (!a.recommended && b.recommended) return 1; {
      
      // 同级别按价格排序
      return Number(a.price) - Number(b.price);
    });

    logger.info('充值包查询成功', {
      requestId,
      userId: user.userId,
      packageCount: enhancedPackages.length,
      isFirstRechargeEligible: eligibility.isEligible
    });

    return NextResponse.json({
      success: true,
      data: enhancedPackages,
      meta: {
        language,
        total: enhancedPackages.length,
        user: {
          isFirstRechargeEligible: eligibility.isEligible,
          hasFirstRecharge: eligibility.hasFirstRecharge
        }
      },
    });
  } catch (error: any) {
    logger.error('充值包查询错误', error, {
      requestId,
      userId: user.userId,
      error: error.message
    });
    
    return NextResponse.json(;
      {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error.message || '查询充值包失败',
        },
      },
      { status: 500 }
    );
  }
});
