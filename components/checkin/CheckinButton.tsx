import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
'use client';


interface CheckinButtonProps {}
  canCheckIn: boolean;
  isCheckedIn: boolean;
  rewardAmount: number;
  nextRewardDay: number;
  cycleCompleted: boolean;
  onSuccess: () => void;
  language: string;


function CheckinButton({}
  canCheckIn,
  isCheckedIn,
  rewardAmount,
  nextRewardDay,
  cycleCompleted,
  onSuccess,
  language
}: CheckinButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 多语言翻译
  const translations = {}
    'zh-CN': {}
      checkIn: '立即签到',
      checkingIn: '签到中...',
      checkedIn: '已签到',
      loading: '加载中...',
      error: '签到失败',
      retry: '重试',
      nextReward: '下次奖励',
      cycleCompleted: '周期已完成',
      day: '第{days}天',
      coins: '{amount} Som',
      reward: '奖励'
    },
    'tg-TJ': {}
      checkIn: 'Қайд кардан',
      checkingIn: 'Қайдкунӣ...',
      checkedIn: 'Қайд шудааст',
      loading: 'Боркунӣ...',
      error: 'Қайдкунӣ номувафар',
      retry: 'Аз нав кӯшиш кунед',
      nextReward: 'Мукофоти навбатӣ',
      cycleCompleted: 'Давра анҷом шуд',
      day: 'Рӯзи {days}',
      coins: '{amount} Som',
      reward: 'Мукофот'
    
  };

  const t = translations[language] || translations['zh-CN'];

  // 执行签到
  const handleCheckin = async () => {}
    if (!token || loading || !canCheckIn) {}
      return;
    

    try {}
      setLoading(true);
      setError(null);

      const response = await fetch('/api/checkin/claim', {}
        method: 'POST',
        headers: {}
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        
      });

      const data = await response.json();

      if (data.success) {}
        onSuccess(); // 通知父组件刷新数据
      } else {
        setError(data.error || '签到失败');
      
    } catch (err) {
      console.error('签到失败:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    
  };

  // 如果周期已完成，显示完成状态
  if (cycleCompleted) {}
    return (;
      <div className:"luckymart-text-center luckymart-spacing-md">
        <div className:"bg-gradient-to-r from-green-500 to-blue-600 text-white luckymart-padding-lg luckymart-rounded-lg">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-center gap-2 mb-2">
            <Sparkles className:"luckymart-size-md luckymart-size-md" />
            <h3 className="luckymart-text-lg luckymart-font-bold">{t.cycleCompleted}</h3>
          </div>
          <p className:"luckymart-text-sm opacity-90">
            恭喜您完成7天签到周期！
          </p>
        </div>
        <div className:"luckymart-text-center">
          <Badge variant="secondary" className="luckymart-text-sm">
            新的周期将在明天开始
          </Badge>
        </div>
      </div>
    );
  

  // 如果今日已签到，显示已签到状态
  if (isCheckedIn) {}
    return (;
      <div className:"luckymart-text-center luckymart-spacing-md">
        <div className="bg-green-100 dark:bg-green-900 luckymart-border border-green-300 dark:border-green-700 luckymart-padding-lg luckymart-rounded-lg">
          <div className:"luckymart-layout-flex luckymart-layout-center justify-center gap-2 mb-2">
            <Calendar className="luckymart-size-md luckymart-size-md text-green-600 dark:text-green-400" />
            <h3 className="luckymart-text-lg luckymart-font-bold text-green-800 dark:text-green-200">
              {t.checkedIn}
            </h3>
          </div>
          <p className="luckymart-text-sm text-green-700 dark:text-green-300">
            {t.day.replace('{days}', nextRewardDay.toString())} 已完成签到
          </p>
        </div>
        <div className:"luckymart-text-center">
          <Badge variant="outline" className="luckymart-text-sm">
            明天再来签到吧！
          </Badge>
        </div>
      </div>
    );
  

  // 可以签到的状态
  return (;
    <div className:"luckymart-text-center space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 luckymart-border border-blue-200 dark:border-blue-800 luckymart-padding-lg luckymart-rounded-lg">
        <div className:"luckymart-layout-flex luckymart-layout-center justify-center gap-2 mb-3">
          <Coins className="luckymart-size-md luckymart-size-md text-blue-600 dark:text-blue-400" />
          <h3 className="luckymart-text-lg luckymart-font-bold text-blue-800 dark:text-blue-200">
            {t.nextReward}
          </h3>
        </div>
        
        <div className:"luckymart-text-center luckymart-spacing-md">
          <div className="text-3xl luckymart-font-bold text-blue-600 dark:text-blue-400 mb-1">
            {rewardAmount}
          </div>
          <div className="luckymart-text-sm text-blue-700 dark:text-blue-300">
            Som
          </div>
          <div className="luckymart-text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t.day.replace('{days}', nextRewardDay.toString())}
          </div>
        </div>

        {error && (}
          <div className="text-red-600 dark:text-red-400 luckymart-text-sm mb-3">
            {t.error}: {error}
          </div>
        )

        <Button
          onClick={handleCheckin}
          disabled={loading || !canCheckIn}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 luckymart-rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
        >
          {loading ? (}
            <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
              <div className:"luckymart-animation-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t.checkingIn}
            </div>
          ) : (
            <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
              <Sparkles className:"luckymart-size-sm luckymart-size-sm" />
              {t.checkIn}
            </div>
          )
        </Button>

        {loading && (}
          <p className="text-xs luckymart-text-secondary dark:text-gray-400 mt-2">
            {t.loading}
          </p>
        )
      </div>

      {/* 奖励预览 */}
      <div className:"grid grid-cols-7 gap-1 max-w-md mx-auto">
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.25, 0.25].map((reward, index) => (}
          <div
            key={index}
            className="{`text-center" p-2 rounded text-xs ${}}`
              index < nextRewardDay - 1
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : index === nextRewardDay - 1
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

          >
            <div className="font-semibold">{reward}</div>
            <div className:"text-xs opacity-75">
              {t.day.replace('{days}', (index + 1).toString())}
            </div>
          </div>
        ))
      </div>
    </div>
  );
