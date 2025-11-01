================================================================================
SQL注入漏洞自动检测报告
================================================================================

扫描文件总数: 14
$queryRawUnsafe使用总数: 34
  - 安全用法: 16
  - 危险用法（需修复）: 11
  - 需人工检查: 7

================================================================================
⚠️  发现危险的SQL注入漏洞（需立即修复）
================================================================================

文件: app/api/tasks/claim/route.ts
  行号: 83
  代码片段:
        const result = await prisma.$queryRawUnsafe(`
          SELECT claim_task_reward('${userId}', '${taskType}') as result
        `);
    
        if (!result || result.length === 0 || !result[0].result) {
          const errorResult = result?.[0]?.result;
          
          if (errorResult && !errorResult.success) {
            let errorCode = 'CLAIM_FAILED';
            let statusCode = 400;

  行号: 145
  代码片段:
        const taskInfo = await prisma.$queryRawUnsafe(`
          SELECT 
            t.name_multilingual,
            t.description_multilingual,
            t.reward_amount,
            t.reward_type
          FROM new_user_tasks t
          WHERE t.task_type = '${taskType}' AND t.is_active = true
        `);
    

文件: app/api/tasks/complete/route.ts
  行号: 75
  代码片段:
          const taskStatus = await prisma.$queryRawUnsafe(`
            SELECT * FROM user_new_user_task_status 
            WHERE user_id = '${userId}' AND task_type = '${taskType}'
          `);
    
          if (!taskStatus || taskStatus.length === 0) {
            logger.warn('任务配置不存在', { userId, taskType }, {
              endpoint: '/api/tasks/complete'
            });
    

  行号: 139
  代码片段:
          const rewardResult = await prisma.$queryRawUnsafe(`
            SELECT claim_task_reward('${userId}'::uuid, '${taskType}') as result
          `);
    
          const rewardData = rewardResult[0];
    
          if (!rewardData || !rewardData.result.success) {
            logger.error('自动发放奖励失败', { 
              userId, 
              taskType, 

文件: app/api/tasks/list/route.ts
  行号: 85
  代码片段:
            const completionCheck = await prisma.$queryRawUnsafe(`
              SELECT update_user_task_progress('${userId}', '${task.task_type}') as result
            `);
            
            // 重新获取更新后的状态
            const updatedStatus = await prisma.$queryRawUnsafe(`
              SELECT status FROM user_task_progress 
              WHERE user_id = '${userId}' 
              AND task_id = '${task.task_id}'
            `);

  行号: 90
  代码片段:
            const updatedStatus = await prisma.$queryRawUnsafe(`
              SELECT status FROM user_task_progress 
              WHERE user_id = '${userId}' 
              AND task_id = '${task.task_id}'
            `);
            
            if (updatedStatus.length > 0) {
              currentStatus = updatedStatus[0].status;
            }
          }

文件: app/api/tasks/progress/route.ts
  行号: 130
  代码片段:
                const rechargeCheck = await prisma.$queryRawUnsafe(`
                  SELECT EXISTS (
                    SELECT 1 FROM orders 
                    WHERE user_id = '${userId}'
                      AND type = 'recharge'
                      AND status = 'completed'
                      AND payment_status = 'completed'
                  ) as has_recharge
                `);
                shouldUpdate = rechargeCheck[

  行号: 143
  代码片段:
                const lotteryCheck = await prisma.$queryRawUnsafe(`
                  SELECT EXISTS (
                    SELECT 1 FROM participations 
                    WHERE user_id = '${userId}'
                  ) as has_lottery
                `);
                shouldUpdate = lotteryCheck[0]?.has_lottery === true;
                break;
            }
    

  行号: 155
  代码片段:
              await prisma.$queryRawUnsafe(`
                INSERT INTO user_task_progress (user_id, task_id, status, completed_at, progress_data)
                VALUES ('${userId}', '${task.task_id}', 'completed', CURRENT_TIMESTAMP, 
                        '{"checked_at": "' || CURRENT_TIMESTAMP || '", "auto_updated": true}')
                ON CONFLICT (user_id, task_id) 
                DO UPDATE SET 
                 

文件: app/api/wallet/balance/route.ts
  行号: 38
  代码片段:
        const walletBalanceInfo = await prisma.$queryRawUnsafe(`
          SELECT * FROM get_user_wallet_balance('${user.userId}'::uuid)
        `);
    
        // 如果用户不存在，返回错误
        if (!walletBalanceInfo || walletBalanceInfo.length === 0) {
          requestLogger.warn('获取钱包余额失败：用户不存在', { userId: user.userId }, {
            endpoint: '/api/wallet/balance',
            method: 'GET'
          });

文件: app/api/wallet/transactions/route.ts
  行号: 107
  代码片段:
        const transactionQueryResult = await prisma.$queryRawUnsafe(`
          SELECT * FROM get_user_transactions_paginated(
            '${user.userId}'::uuid,
            ${page},
            ${limit},
            ${params.balanceType ? `'${params.balanceType}'` : 'NULL'},
            ${params.type ? `'${params.type}'` : 'NULL'},
            ${params.startDate ? `'${params.startDate}'` : 'NULL'},
            ${params.endDate ? `

================================================================================
🔍 需要人工检查的用法
================================================================================

文件: app/api/check-in/history/route.ts
  行号: 121
  代码片段:
          checkInRecords = await prisma.$queryRawUnsafe(checkInRecordsQuery);
    
          // 获取总记录数
          const countQuery = `
            SELECT COUNT(*) as total

  行号: 130
  代码片段:
          const countResult = await prisma.$queryRawUnsafe(countQuery);
          totalCheckInRecords = parseInt(countResult[0]?.total?.toString() || '0');
        }
    
        // 获取签到周期

  行号: 167
  代码片段:
          cycles = await prisma.$queryRawUnsafe(cyclesQuery);
    
          // 获取总周期数
          const cycleCountQuery = `
            SELECT COUNT(*) as total

  行号: 176
  代码片段:
          const cycleCountResult = await prisma.$queryRawUnsafe(cycleCountQuery);
          totalCycles = parseInt(cycleCountResult[0]?.total?.toString() || '0');
        }
    
        // 统计信息

  行号: 212
  代码片段:
        const statsResult = await prisma.$queryRawUnsafe(statsQuery);
        const stats = statsResult[0] || {};
    
        // 构建响应数据
        const responseData = {

文件: app/api/resale/list/route.ts
  行号: 52
  代码片段:
          prisma.$queryRawUnsafe(query),
          prisma.$queryRawUnsafe(countQuery)
        ]);
    
        const total = Number(countResult[0]?.total || 0);

  行号: 53
  代码片段:
          prisma.$queryRawUnsafe(countQuery)
        ]);
    
        const total = Number(countResult[0]?.total || 0);
    
