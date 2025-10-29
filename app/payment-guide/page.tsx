// Alif Mobi 转账指引页面
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PaymentGuideProps {
  orderId: string;
  amount: number;
  paymentMethod: 'alif_mobi' | 'dc_bank';
}

interface PaymentStep {
  title: string;
  description: string;
  icon: string;
  image?: string;
}

export default function PaymentGuide({ orderId, amount, paymentMethod }: PaymentGuideProps) {
  const router = useRouter();
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15分钟倒计时
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // 生成订单号
    setOrderNumber(`LM${Date.now().toString().slice(-6)}`);
    
    // 倒计时
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('订单已超时，请重新下单');
          router.push('/recharge');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPaymentInfo = () => {
    if (paymentMethod === 'alif_mobi') {
      return {
        title: 'Alif Mobi 转账',
        logo: '/images/alif-mobi-logo.png',
        account: '+992 98 123 45 67',
        recipientName: 'LuckyMart TJ',
        instructions: [
          '打开Alif Mobi应用',
          '点击"转账"功能',
          '输入收款账户和金额',
          '在备注中填写订单号',
          '完成转账后点击确认'
        ],
        steps: [
          {
            title: '打开Alif Mobi',
            description: '在手机上打开Alif Mobi应用',
            icon: '📱',
            image: '/images/step1-alif.png'
          },
          {
            title: '选择转账',
            description: '点击主界面的"转账"按钮',
            icon: '💸',
            image: '/images/step2-transfer.png'
          },
          {
            title: '输入信息',
            description: `输入收款账户：${'+992 98 123 45 67'}，金额：${amount} TJS`,
            icon: '✏️',
            image: '/images/step3-input.png'
          },
          {
            title: '填写备注',
            description: `在备注中填写：${orderNumber}（必填！）`,
            icon: '📝',
            image: '/images/step4-comment.png'
          },
          {
            title: '确认转账',
            description: '检查信息无误后确认转账',
            icon: '✅',
            image: '/images/step5-confirm.png'
          }
        ]
      };
    } else {
      return {
        title: 'DC Bank 转账',
        logo: '/images/dc-bank-logo.png',
        account: '2020 2018 0000 1234 5678',
        recipientName: 'LuckyMart TJ LLC',
        instructions: [
          '打开DC Bank应用或访问网银',
          '选择"转账汇款"功能',
          '输入收款银行和账户信息',
          '在备注中填写订单号',
          '完成转账后点击确认'
        ],
        steps: [
          {
            title: '打开DC Bank',
            description: '在手机上打开DC Bank应用或访问网银',
            icon: '🏦',
            image: '/images/step1-dc.png'
          },
          {
            title: '选择转账',
            description: '点击"转账汇款"功能',
            icon: '💰',
            image: '/images/step2-transfer-dc.png'
          },
          {
            title: '输入银行信息',
            description: '收款银行：Dushanbe City Bank，账号：2020 2018 0000 1234 5678',
            icon: '🏛️',
            image: '/images/step3-bank-info.png'
          },
          {
            title: '填写订单号',
            description: `在备注中填写：${orderNumber}（必填！）`,
            icon: '📋',
            image: '/images/step4-order-number.png'
          },
          {
            title: '确认转账',
            description: '检查信息无误后确认转账',
            icon: '✅',
            image: '/images/step5-confirm-dc.png'
          }
        ]
      };
    }
  };

  const paymentInfo = getPaymentInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-900">转账指引</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 倒计时横幅 */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl mb-8">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">请在 {formatTime(timeLeft)} 内完成转账</h2>
            <p className="text-red-100">超时后订单将自动取消，请尽快操作</p>
          </div>
        </div>

        {/* 支付信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Image
                src={paymentInfo.logo}
                alt={paymentInfo.title}
                width={60}
                height={60}
                className="rounded-lg mr-4"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{paymentInfo.title}</h2>
                <p className="text-gray-600">订单号: {orderNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">充值金额</p>
              <p className="text-2xl font-bold text-blue-600">{amount} TJS</p>
            </div>
          </div>

          {/* 收款信息 */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">收款信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">收款账户</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-lg">{paymentInfo.account}</p>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.account, 'account')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {copySuccess === 'account' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">收款人姓名</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-semibold">{paymentInfo.recipientName}</p>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.recipientName, 'name')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {copySuccess === 'name' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">转账金额</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-xl text-green-600">{amount} TJS</p>
                </div>
              </div>
            </div>
          </div>

          {/* 订单号（最重要） */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ 重要：请填写转账备注</h3>
            <p className="text-yellow-700 mb-3">这是我们识别您转账的唯一凭证，必须填写！</p>
            <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xl font-bold text-red-600">{orderNumber}</p>
                <button
                  onClick={() => copyToClipboard(orderNumber, 'order')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  {copySuccess === 'order' ? '已复制！' : '一键复制'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                在转账备注或说明栏中粘贴此订单号
              </p>
            </div>
          </div>
        </div>

        {/* 操作步骤 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">转账操作步骤</h2>
          <div className="space-y-6">
            {paymentInfo.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  {step.image && (
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="text-sm text-gray-500 text-center">操作示意图</p>
                      {/* 这里可以显示步骤图片 */}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 确认按钮 */}
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('确认您已完成转账操作？')) {
                // 这里可以调用确认API
                alert('转账确认已提交，我们将在1-3分钟内确认收款并到账！');
                router.push('/profile');
              }
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl"
          >
            我已完成转账
          </button>
          <p className="text-sm text-gray-600 mt-4">
            点击确认后，我们将立即开始确认您的转账
          </p>
        </div>

        {/* 帮助信息 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">需要帮助？</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-blue-800">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              客服热线: +992 44 600 00 00
            </div>
            <div className="flex items-center text-blue-800">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Telegram: @luckymart_support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}