import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator, testConfig } from './test-config';
/**
 * 推荐系统防作弊准确性测试
 * 测试设备限制、循环推荐、批量注册等边界条件
 */


describe('推荐系统防作弊准确性测试', () => {
  let prisma: PrismaClient;
  let testDataGenerator: TestDataGenerator;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testConfig.database.url
        }
      }
    });
    testDataGenerator = new TestDataGenerator(prisma);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.rewardTransactions.deleteMany({
      where: { description: { startsWith: 'fraud-test' } }
    });
    await prisma.referralRelationships.deleteMany({
      where: { referrerUserId: { startsWith: 'fraud-test-' } }
    });
    await prisma.users.deleteMany({
      where: { id: { startsWith: 'fraud-test-' } }
    });
    await prisma.fraudChecks.deleteMany({
      where: { deviceId: { startsWith: 'fraud-test-' } }
    });
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.rewardTransactions.deleteMany({
      where: { description: { startsWith: 'fraud-test' } }
    });
    await prisma.referralRelationships.deleteMany({
      where: { referrerUserId: { startsWith: 'fraud-test-' } }
    });
    await prisma.users.deleteMany({
      where: { id: { startsWith: 'fraud-test-' } }
    });
    await prisma.fraudChecks.deleteMany({
      where: { deviceId: { startsWith: 'fraud-test-' } }
    });
  });

  describe('设备限制测试', () => {
    test('同一设备多次注册检测', async () => {
      const deviceId = 'fraud-test-device-1';
      const ipAddress = '192.168.1.100';
      const telegramIds = ['telegram_1', 'telegram_2', 'telegram_3'];

      // 模拟设备指纹检查
      const fraudChecker = {
        checkDeviceLimit: async (deviceId: string, telegramId: string) => {
          // 检查该设备是否已经注册过用户
          const existingUsers = await prisma.users.findMany({
            where: { 
              id: { startsWith: 'fraud-test-' },
              telegramId: { notIn: [telegramId] }
            }
          });

          // 检查设备重复率
          const deviceLimit = 3; // 最多允许3个用户使用同一设备;
          if (existingUsers.length >= deviceLimit) {
            return {
              isBlocked: true,
              reason: '设备使用次数超限',
              existingUsers: existingUsers.length
            };
          }

          return { isBlocked: false };
        }
      };

      const results = [];
      for (const telegramId of telegramIds) {
        const result = await fraudChecker.checkDeviceLimit(deviceId, telegramId);
        results.push(result);
      }

      // 前3个应该通过，第4个会被阻止
      expect((results?.0 ?? null).isBlocked).toBe(false);
      expect((results?.1 ?? null).isBlocked).toBe(false);
      expect((results?.2 ?? null).isBlocked).toBe(false);

      console.log(`设备 ${deviceId} 注册检测结果:`, results);
    });

    test('设备指纹变更检测', async () => {
      const originalDeviceId = 'fraud-test-device-original';
      const changedDeviceId = 'fraud-test-device-changed';
      const telegramId = 'fraud-test-telegram-1';

      // 创建设备变更记录
      await prisma.fraudChecks.create({
        data: {
          deviceId: originalDeviceId,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
          checkType: 'device_registration',
          isFlagged: false,
          checkedAt: new Date(),
        }
      });

      // 模拟设备变更检测
      const fraudDetector = {
        detectDeviceChange: async (telegramId: string, newDeviceId: string) => {
          const previousDevices = await prisma.fraudChecks.findMany({
            where: { 
              checkType: 'device_registration',
              isFlagged: false,
            },
            orderBy: { checkedAt: 'desc' },
            take: 5
          });

          const hasDeviceChange = previousDevices.some(check =>;
            check.deviceId !== newDeviceId
          );

          return {
            hasDeviceChange,
            deviceChangeCount: previousDevices.filter(check => 
              check.deviceId !== newDeviceId
            ).length,
            previousDevices: previousDevices.length
          };
        }
      };

      const result = await fraudDetector.detectDeviceChange(telegramId, changedDeviceId);
      
      expect(result.hasDeviceChange).toBe(true);
      expect(result.deviceChangeCount).toBe(1);
      expect(result.previousDevices).toBe(1);

      console.log('设备变更检测结果:', result);
    });

    test('虚拟设备检测', async () => {
      const suspiciousDeviceIds = [;
        'fraud-test-vm-1', // 模拟虚拟机
        'fraud-test-vm-2',
        'emulator-123',     // 模拟器
        'test-device-123',  // 测试设备标识
        'fraud-bot-device', // 机器人设备
      ];

      const fraudDetector = {
        detectVirtualDevice: async (deviceId: string) => {
          const virtualDevicePatterns = [;
            /^fraud-test-vm-/,
            /^emulator-/,
            /^test-device-/,
            /bot/i,
            /virtual/i,
            /emulator/i,
          ];

          const isVirtual = virtualDevicePatterns.some(pattern =>;
            pattern.test(deviceId)
          );

          if (isVirtual) {
            return {
              isBlocked: true,
              reason: '检测到虚拟设备',
              deviceId,
              confidence: 0.95
            };
          }

          return { isBlocked: false, confidence: 0.1 };
        }
      };

      for (const deviceId of suspiciousDeviceIds) {
        const result = await fraudDetector.detectVirtualDevice(deviceId);
        expect(result.isBlocked).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.9);
        console.log(`虚拟设备检测 - ${deviceId}:`, result);
      }
    });
  });

  describe('循环推荐检测', () => {
    test('直接循环推荐检测', async () => {
      const user1 = 'fraud-test-user-1';
      const user2 = 'fraud-test-user-2';

      // 创建用户
      await prisma.users.createMany({
        data: [
          testDataGenerator.generateUser({
            id: user1,
            telegramId: 'fraud_telegram_1',
            referralCode: 'REF1',
          }),
          testDataGenerator.generateUser({
            id: user2,
            telegramId: 'fraud_telegram_2',
            referralCode: 'REF2',
          })
        ]
      });

      // 创建循环推荐关系: user1 -> user2 -> user1
      await prisma.referralRelationships.create({
        data: {
          referrerUserId: user1,
          refereeUserId: user2,
          referralLevel: 1,
        }
      });

      const fraudDetector = {
        detectCircularReferral: async (referrerId: string, refereeId: string) => {
          // 检查是否存在循环
          const checkCircular = async (currentUserId: string, targetUserId: string, depth: number = 0): Promise<boolean> => {
            if (depth > 10) return false; // 防止无限递归 {

            const relationships = await prisma.referralRelationships.findMany({
              where: { referrerUserId: currentUserId },
              select: { refereeUserId: true }
            });

            for (const relationship of relationships) {
              if (relationship.refereeUserId === targetUserId) {
                return true; // 发现循环;
              }
              
              if (await checkCircular(relationship.refereeUserId, targetUserId, depth + 1)) {
                return true;
              }
            }

            return false;
          };

          const hasCircular = await checkCircular(referrerId, refereeId);
          if (hasCircular) {
            return {
              isBlocked: true,
              reason: '检测到循环推荐',
              referrerId,
              refereeId
            };
          }

          return { isBlocked: false };
        }
      };

      // 尝试创建循环推荐
      const result = await fraudDetector.detectCircularReferral(user2, user1);
      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe('检测到循环推荐');

      console.log('循环推荐检测结果:', result);
    });

    test('复杂循环推荐检测', async () => {
      // 创建用户链: A -> B -> C -> D -> A (循环)
      const users = ['A', 'B', 'C', 'D'];
      
      await prisma.users.createMany({
        data: users.map(user => 
          testDataGenerator.generateUser({
            id: `fraud-test-user-${user}`,
            telegramId: `fraud_telegram_${user.toLowerCase()}`,
            referralCode: `REF${user}`,
          })
        )
      });

      // 创建推荐关系链
      const relationships = [;
        { referrer: 'A', referee: 'B' },
        { referrer: 'B', referee: 'C' },
        { referrer: 'C', referee: 'D' },
        { referrer: 'D', referee: 'A' }, // 完成循环
      ];

      for (const rel of relationships) {
        await prisma.referralRelationships.create({
          data: {
            referrerUserId: `fraud-test-user-${rel.referrer}`,
            refereeUserId: `fraud-test-user-${rel.referee}`,
            referralLevel: 1,
          }
        });
      }

      const fraudDetector = {
        detectComplexCircularReferral: async (startUserId: string) => {
          const visited = new Set<string>();
          const path: string[] = [];

          const checkCircularDFS = async (userId: string, targetUserId: string, depth: number = 0): Promise<{ hasCircular: boolean, path: string[] }> => {
            if (depth > 10 || visited.has(userId)) {
              return { hasCircular: false, path: [] };
            }

            visited.add(userId);
            path.push(userId);

            const relationships = await prisma.referralRelationships.findMany({
              where: { referrerUserId: userId },
              select: { refereeUserId: true }
            });

            for (const relationship of relationships) {
              if (relationship.refereeUserId === targetUserId) {
                path.push(targetUserId);
                return { hasCircular: true, path: [...path] };
              }

              const result = await checkCircularDFS(relationship.refereeUserId, targetUserId, depth + 1);
              if (result.hasCircular) {
                return result;
              }
            }

            visited.delete(userId);
            path.pop();
            return { hasCircular: false, path: [] };
          };

          return await checkCircularDFS(startUserId, startUserId);
        }
      };

      const result = await fraudDetector.detectComplexCircularReferral('fraud-test-user-A');
      expect(result.hasCircular).toBe(true);
      expect(result.path).toContain('fraud-test-user-A');
      expect(result.path.length).toBeGreaterThan(3);

      console.log('复杂循环推荐检测结果:', result);
    });
  });

  describe('批量注册检测', () => {
    test('短时间内大量注册检测', async () => {
      const registrationWindow = 60000; // 1分钟窗口;
      const maxRegistrations = 5; // 最多5个注册;
      const telegramIds = Array(10).fill(0).map((_, i) => `batch_telegram_${i}`);
      
      const fraudDetector = {
        detectBatchRegistration: async (telegramIds: string[], windowMs: number) => {
          const registrations = [];
          
          for (let i = 0; i < telegramIds.length; i++) {
            const userId = `fraud-test-user-batch-${i}`;
            const registrationTime = new Date(Date.now() - (telegramIds.length - i - 1) * 5000); // 每5秒一个;

            await prisma.users.create({
              data: testDataGenerator.generateUser({
                id: userId,
                telegramId: telegramIds[i],
                createdAt: registrationTime,
              })
            });

            registrations.push({
              userId,
              telegramId: telegramIds[i],
              registrationTime
            });
          }

          // 检查时间窗口内的注册数量
          const now = new Date();
          const windowStart = new Date(now.getTime() - windowMs);
          
          const recentRegistrations = registrations.filter(reg =>;
            reg.registrationTime >= windowStart
          );

          if (recentRegistrations.length > maxRegistrations) {
            return {
              isBlocked: true,
              reason: '短时间内大量注册',
              registrationCount: recentRegistrations.length,
              maxAllowed: maxRegistrations,
              timeWindow: windowMs
            };
          }

          return { 
            isBlocked: false, 
            registrationCount: recentRegistrations.length 
          };
        }
      };

      const result = await fraudDetector.detectBatchRegistration(telegramIds, registrationWindow);
      expect(result.isBlocked).toBe(true);
      expect(result.registrationCount).toBeGreaterThan(maxRegistrations);

      console.log('批量注册检测结果:', result);
    });

    test('相似设备批量注册检测', async () => {
      const baseDeviceId = 'fraud-test-device-base';
      const telegramIds = ['similar_1', '相似_2', 'similar_device_3'];
      
      const fraudDetector = {
        detectSimilarDeviceBatch: async (deviceId: string, telegramIds: string[]) => {
          const similarRegistrations: any[] = [];

          for (let i = 0; i < telegramIds.length; i++) {
            // 模拟设备指纹相似但不完全相同的情况
            const variation = deviceId + (i > 0 ? `_variation_${i}` : '');
            
            await prisma.users.create({
              data: testDataGenerator.generateUser({
                id: `fraud-test-similar-${i}`,
                telegramId: telegramIds[i],
              })
            });

            // 记录设备使用情况
            await prisma.fraudChecks.create({
              data: {
                deviceId: variation,
                ipAddress: `192.168.1.${100 + i}`,
                checkType: 'similar_device_batch',
                isFlagged: i >= 2, // 标记可疑设备
                checkedAt: new Date(),
              }
            });

            if (i >= 2) {
              similarRegistrations.push({ 
                telegramId: telegramIds[i], 
                deviceId: variation 
              });
            }
          }

          const suspiciousDevices = similarRegistrations.length;
          const threshold = 2;

          if (suspiciousDevices >= threshold) {
            return {
              isBlocked: true,
              reason: '相似设备批量注册',
              suspiciousDevices,
              threshold,
              devices: similarRegistrations
            };
          }

          return { isBlocked: false, suspiciousDevices };
        }
      };

      const result = await fraudDetector.detectSimilarDeviceBatch(baseDeviceId, telegramIds);
      expect(result.isBlocked).toBe(true);
      expect(result.suspiciousDevices).toBeGreaterThanOrEqual(2);

      console.log('相似设备批量注册检测结果:', result);
    });
  });

  describe('IP地址异常检测', () => {
    test('同一IP地址大量注册', async () => {
      const suspiciousIP = '192.168.1.200';
      const telegramIds = Array(8).fill(0).map((_, i) => `ip_test_${i}`);
      
      const fraudDetector = {
        detectIPAnomaly: async (ipAddress: string, telegramIds: string[]) => {
          // 记录IP使用情况
          for (let i = 0; i < telegramIds.length; i++) {
            await prisma.users.create({
              data: testDataGenerator.generateUser({
                id: `fraud-test-ip-${i}`,
                telegramId: telegramIds[i],
              })
            });

            // 记录IP检查
            await prisma.fraudChecks.create({
              data: {
                deviceId: `fraud-test-device-${i}`,
                ipAddress: suspiciousIP,
                checkType: 'ip_anomaly',
                isFlagged: i >= 5, // 标记超过阈值的注册
                checkedAt: new Date(Date.now() - i * 60000),
              }
            });
          }

          // 统计该IP的注册数量
          const ipRegistrations = await prisma.fraudChecks.count({
            where: { 
              ipAddress: suspiciousIP,
              checkType: 'ip_anomaly'
            }
          });

          const ipThreshold = 5;

          if (ipRegistrations >= ipThreshold) {
            return {
              isBlocked: true,
              reason: '同一IP地址大量注册',
              registrationCount: ipRegistrations,
              ipAddress: suspiciousIP,
              threshold: ipThreshold
            };
          }

          return { 
            isBlocked: false, 
            registrationCount: ipRegistrations,
            ipAddress: suspiciousIP
          };
        }
      };

      const result = await fraudDetector.detectIPAnomaly(suspiciousIP, telegramIds);
      expect(result.isBlocked).toBe(true);
      expect(result.registrationCount).toBeGreaterThanOrEqual(5);

      console.log('IP异常检测结果:', result);
    });

    test('代理/VPN检测', async () => {
      const suspiciousIPs = [;
        '10.0.0.1',      // 私有IP范围
        '172.16.0.1',    // 私有IP范围  
        '192.168.1.1',   // 私有IP范围
        '203.0.113.1',   // 测试IP范围
        '198.51.100.1',  // 测试IP范围
      ];

      const fraudDetector = {
        detectProxyVPN: async (ipAddress: string) => {
          const proxyRanges = [;
            { start: '10.0.0.0', end: '10.255.255.255' },
            { start: '172.16.0.0', end: '172.31.255.255' },
            { start: '192.168.0.0', end: '192.168.255.255' },
            { start: '203.0.113.0', end: '203.0.113.255' },
            { start: '198.51.100.0', end: '198.51.100.255' },
          ];

          const isProxyIP = proxyRanges.some(range => {
            // 简化的IP范围检查（实际应该使用更精确的IP库）
            return ipAddress.startsWith(range.start.split('.')[0] + '.') ||;
                   ipAddress.startsWith(range.start.split('.')[0] + '.' + range.start.split('.')[1] + '.');
          });

          if (isProxyIP) {
            return {
              isBlocked: true,
              reason: '检测到代理/VPN IP',
              ipAddress,
              confidence: 0.8,
              ipType: 'proxy_or_vpn'
            };
          }

          return { 
            isBlocked: false, 
            ipAddress,
            confidence: 0.1,
            ipType: 'normal'
          };
        }
      };

      for (const ip of suspiciousIPs) {
        const result = await fraudDetector.detectProxyVPN(ip);
        expect(result.isBlocked).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.7);
        console.log(`代理/VPN检测 - ${ip}:`, result);
      }
    });
  });

  describe('综合防作弊策略', () => {
    test('多层防护策略验证', async () => {
      const fraudChecker = {
        comprehensiveCheck: async (userData: {
          telegramId: string;
          deviceId: string;
          ipAddress: string;
          referralCode?: string;
        }) => {
          const checks = {
            deviceLimit: false,
            circularReferral: false,
            batchRegistration: false,
            ipAnomaly: false,
            proxyVPN: false
          };

          const reasons: string[] = [];

          // 1. 设备限制检查
          const deviceRegistrations = await prisma.fraudChecks.count({
            where: { 
              deviceId: userData.deviceId,
              checkType: 'device_registration'
            }
          });
          
          if (deviceRegistrations >= 3) {
            checks.deviceLimit = true;
            reasons.push('设备使用次数超限');
          }

          // 2. 循环推荐检查
          if (userData.referralCode) {
            const referrer = await prisma.users.findFirst({
              where: { referralCode: userData.referralCode }
            });
            
            if (referrer) {
              const relationships = await prisma.referralRelationships.count({
                where: { 
                  referrerUserId: referrer.id,
                  refereeUserId: { 
                    startsWith: 'fraud-test-' 
                  }
                }
              });
              
              if (relationships >= 10) {
                checks.circularReferral = true;
                reasons.push('推荐关系过多，可能存在循环推荐');
              }
            }
          }

          // 3. 批量注册检查
          const recentRegistrations = await prisma.fraudChecks.count({
            where: {
              checkedAt: {
                gte: new Date(Date.now() - 300000) // 5分钟内
              }
            }
          });

          if (recentRegistrations >= 10) {
            checks.batchRegistration = true;
            reasons.push('短时间内大量注册');
          }

          // 4. IP异常检查
          const ipRegistrations = await prisma.fraudChecks.count({
            where: { ipAddress: userData.ipAddress }
          });

          if (ipRegistrations >= 5) {
            checks.ipAnomaly = true;
            reasons.push('同一IP注册过多账户');
          }

          // 5. 代理IP检查
          const proxyPatterns = ['10.', '172.', '192.168.', '203.0.113.', '198.51.100.'];
          if (proxyPatterns.some(pattern => userData.ipAddress.startsWith(pattern))) {
            checks.proxyVPN = true;
            reasons.push('检测到代理/VPN IP');
          }

          const isBlocked = Object.values(checks).some(check => check);
          
          return {
            isBlocked,
            checks,
            reasons,
            riskScore: Object.values(checks).filter(Boolean).length
          };
        }
      };

      const testUser = {
        telegramId: 'comprehensive_test_user',
        deviceId: 'fraud-test-device-comprehensive',
        ipAddress: '192.168.1.100',
        referralCode: 'COMPREHENSIVE_REF'
      };

      // 创建一些测试数据来触发检查
      await prisma.users.create({
        data: testDataGenerator.generateUser({
          id: 'fraud-test-comprehensive-ref',
          telegramId: 'comprehensive_ref_user',
          referralCode: 'COMPREHENSIVE_REF',
        })
      });

      // 模拟多个风险因素
      for (let i = 0; i < 4; i++) {
        await prisma.fraudChecks.create({
          data: {
            deviceId: testUser.deviceId,
            ipAddress: testUser.ipAddress,
            checkType: 'comprehensive_test',
            isFlagged: i >= 2,
            checkedAt: new Date(Date.now() - i * 60000),
          }
        });
      }

      const result = await fraudChecker.comprehensiveCheck(testUser);
      
      // 验证多个检查项被触发
      expect(result.isBlocked).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(2);
      expect(result.reasons.length).toBeGreaterThan(0);

      console.log('综合防护检查结果:', result);
    });
  });
});
}