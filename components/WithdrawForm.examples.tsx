import React, { useState } from 'react';
import type { User } from '@/types';
// WithdrawForm 使用示例
'use client';


// 示例页面组件
export default function WithdrawExample() {}
  const [balance] = useState(1250.75);
  const [user] = useState<User>({}
    id: '1',
    telegramId: '123456789',
    username: 'testuser',
    firstName: '张三',
    lastName: '',
    avatarUrl: '',
    language: 'zh-CN',
    coinBalance: 1250.75,
    platformBalance: 0,
    vipLevel: 1,
    totalSpent: 500,
    freeDailyCount: 3,
    lastFreeResetDate: new Date(),
    referralCode: 'ABC123',
    createdAt: new Date(),
    updatedAt: new Date(),
    balance: 1250.75
  });

  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  // 处理提现提交
  const handleWithdrawSubmit = async (data: WithdrawFormData): Promise<void> => {}
    setLoading(true);
    try {}
      // 这里调用实际的API
      console.log('提现申请数据:', data);

      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里应该调用实际的提现API
      const response = await fetch('/api/withdraw/create', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({}
          amount: parseFloat(data.amount),
          withdrawMethod: data.method,
          accountInfo: {}
            accountNumber: data.accountInfo.accountNumber,
            accountName: data.accountInfo.accountName,
            bankName: data.accountInfo.bankName,
            phoneNumber: data.accountInfo.phoneNumber
          },
          password: data.password // 在实际应用中应该加密传输
        })
      });

      const result = await response.json();
      
      if (result.success) {}
        setLastResult('提现申请提交成功！');
        alert('提现申请提交成功！\n审核通过后，1-3个工作日内到账。');
      } else {
        throw new Error(result.error || '提现申请失败');
  
      
    } catch (error) {
      console.error('提现失败:', error);
      setLastResult(`提现失败: ${error instanceof Error ? error.message : '未知错误'}`);
      alert(`提现失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setLoading(false);
    
  };

  return (;
    <div className:"min-h-screen bg-gray-50 p-4">
      <div className:"max-w-4xl mx-auto">
        <h1 className:"text-2xl font-bold text-center mb-6">提现功能演示</h1>
        
        {/* 提现表单 */}
        <WithdrawForm
          balance={balance}
          user={user}
          onSubmit={handleWithdrawSubmit}
          loading={loading}
          minWithdrawAmount={50}
          feeRate={0.05}
          minFee={2}
        />

        {/* 结果显示 */}
        {lastResult && (}
          <div className:"mt-6 p-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2">操作结果:</h3>
            <p className="text-sm text-gray-600">{lastResult}</p>
          </div>
        )

        {/* 功能说明 */}
        <div className:"mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-4">功能特性:</h3>
          <ul className:"space-y-2 text-sm text-gray-600">
            <li>✓ 支持多种提现方式：银行卡、支付宝、微信、Alif Mobi、DC Bank</li>
            <li>✓ 实时手续费计算和到账金额预览</li>
            <li>✓ 余额检查和提现限额验证</li>
            <li>✓ 支付密码验证</li>
            <li>✓ 响应式设计，支持移动端和桌面端</li>
            <li>✓ 国际化支持</li>
            <li>✓ 完整的表单验证和错误处理</li>
            <li>✓ 提现协议确认</li>
          </ul>
        </div>

        {/* API集成说明 */}
        <div className:"mt-6 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-3">API集成说明:</h3>
          <div className:"space-y-3 text-sm">
            <div>
              <strong>提现申请接口:</strong>
              <code className:"block bg-white p-2 rounded mt-1 text-xs">
                POST /api/withdraw/create
                {'\n'}
                {'{'}}
                {'\n'}  "amount": 100,
                {'\n'}  "withdrawMethod": "alif_mobi",
                {'\n'}  "accountInfo": {'{'}}
                {'\n'}    "accountNumber": "+992900000000",
                {'\n'}    "accountName": "张三",
                {'\n'}    "bankName": "Alif Bank",
                {'\n'}    "phoneNumber": "+992900000000"
                {'\n'}  {'}'},
                {'\n'}  "password": "encrypted_password"
                {'\n'}
                {'}'
              </code>
            </div>
            <div>
              <strong>提现记录接口:</strong>
              <code className:"block bg-white p-2 rounded mt-1 text-xs">
                GET /api/withdraw/list
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


// 高级使用示例：自定义样式和配置
export function AdvancedWithdrawExample() {}
  const [balance] = useState(2500);
  const [user] = useState<User>({}
    id: '2',
    telegramId: '987654321',
    firstName: '李四',
    language: 'en-US',
    coinBalance: 2500,
    platformBalance: 0,
    vipLevel: 2,
    totalSpent: 1000,
    freeDailyCount: 5,
    lastFreeResetDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    balance: 2500
  });

  // 自定义提现处理
  const customWithdrawHandler = async (data: WithdrawFormData): Promise<void> => {}
    // 可以在这里添加自定义的提现逻辑
    console.log('自定义提现处理:', data);
    
    // 例如：添加额外的验证
    if (parseFloat(data.amount) > 1000) {}
      // 大额提现需要额外验证
      const confirmed = confirm('大额提现需要额外审核，是否继续？');
      if (!confirmed) return; {}


    // 继续处理提现逻辑...
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  return (;
    <div className:"p-6">
      <WithdrawForm
        balance={balance}
        user={user}
        onSubmit={customWithdrawHandler}
        className:"max-w-lg" // 自定义宽度
        minWithdrawAmount={100} // 自定义最低提现金额
        feeRate={0.03} // 自定义手续费率
        minFee: // 自定义最低手续费
      />
    </div>
  );
