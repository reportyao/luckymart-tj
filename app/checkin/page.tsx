'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import CheckinCalendar from '@/components/checkin/CheckinCalendar';
import CheckinButton from '@/components/checkin/CheckinButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, tg } from 'date-fns/locale';

interface CheckinStatus {
  user: {
    userId: string;
    username: string | null;
    firstName: string;
    luckyCoins: number;
  };
  todayStatus: {
    date: string;
    isCheckedIn: boolean;
    canCheckIn: boolean;
    reward: number;
    rewardAmount: number;
    nextRewardDay: number;
  };
  cycleInfo: {
    currentStreak: number;
    cycleProgress: number;
    isCycleCompleted: boolean;
    rewardConfig: number[];
    totalRewardAmount: number;
  };
  calendar: Array<{
    date: string;
    day: number | null;
    reward: number | null;
    isCheckedIn: boolean;
    isToday: boolean;
  }>;
  statistics: {
    totalCheckIns: number;
    maxConsecutiveDays: number;
    totalEarned: number;
  };
}

function CheckinPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 多语言翻译
  const translations = {
    'zh-CN': {
      title: '每日签到',
      subtitle: '坚持签到，赢取丰厚奖励',
      consecutiveDays: '连续签到',
      todayReward: '今日奖励',
      totalEarned: '累计获得',
      maxStreak: '最长连续',
      checkIn: '立即签到',
      checkedIn: '已签到',
      notCheckedIn: '未签到',
      day: '第{days}天',
      coins: '{amount} 幸运币',
      cycleCompleted: '恭喜完成7天签到周期！',
      totalReward: '总奖励',
      loading: '加载中...',
      error: '加载失败',
      retry: '重试',
      luckyCoins: '幸运币余额',
      nextReward: '下次奖励',
      progress: '进度',
      calendar: '签到日历'
    },
    'tg-TJ': {
      title: 'Рӯзмарра Қайд кардан',
      subtitle: 'Қайд карданро идома диҳед, мукофотҳои зиёд гиред',
      consecutiveDays: 'Рӯзҳои пайдарпай',
      todayReward: 'Мукофоти имрӯз',
      totalEarned: 'Ҷамъ шуда',
      maxStreak: 'Дарозтарин пайдарпай',
      checkIn: 'Қайд кардан',
      checkedIn: 'Қайд шудааст',
      notCheckedIn: 'Қайд нашудааст',
      day: 'Рӯзи {days}',
      coins: '{amount} Сомон',
      cycleCompleted: 'Таҳаммул! Рӯзмарраи 7 рӯзаро анҷом додед!',
      totalReward: 'Мукофоти умумӣ',
      loading: 'Боркунӣ...',
      error: 'Хатои боркунӣ',
      retry: 'Аз нав кӯшиш кунед',
      luckyCoins: 'Монети бахт',
      nextReward: 'Мукофоти навбатӣ',
      progress: 'Пешрафт',
      calendar: 'Тақвими қайдкунӣ'
    }
  };

  const t = translations[language] || translations['zh-CN'];

  // 获取签到状态
  const fetchCheckinStatus = async () => {
    if (!token) {
      setError('未登录');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/checkin/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setCheckinStatus(data.data);
      } else {
        setError(data.error || '获取签到状态失败');
      }
    } catch (err) {
      console.error('获取签到状态失败:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 签到成功回调
  const handleCheckinSuccess = () => {
    fetchCheckinStatus(); // 重新获取状态
  };

  useEffect(() => {
    fetchCheckinStatus();
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t.error}: {error}</p>
            <button
              onClick={fetchCheckinStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!checkinStatus) {
    return null;
  }

  const { user: userInfo, todayStatus, cycleInfo, statistics } = checkinStatus;

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.subtitle}
        </p>
      </div>

      {/* 用户信息卡片 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            {t.luckyCoins}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {userInfo.luckyCoins.toFixed(2)} 
            <span className="text-sm text-gray-500 ml-2">Som</span>
          </div>
        </CardContent>
      </Card>

      {/* 签到状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今日奖励 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.todayReward}
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {todayStatus.rewardAmount} Som
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 连续签到 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.consecutiveDays}
                </p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {cycleInfo.currentStreak} {t.day.replace('{days}', '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 累计获得 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.totalEarned}
                </p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {statistics.totalEarned.toFixed(2)} Som
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最长连续 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.maxStreak}
                </p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {statistics.maxConsecutiveDays} {t.day.replace('{days}', '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 进度指示器和签到按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t.progress}</span>
            <Badge variant="secondary">
              {cycleInfo.cycleProgress}/7
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(cycleInfo.cycleProgress / 7) * 100}%` }}
            />
          </div>

          {/* 签到按钮 */}
          <CheckinButton
            canCheckIn={todayStatus.canCheckIn}
            isCheckedIn={todayStatus.isCheckedIn}
            rewardAmount={todayStatus.rewardAmount}
            nextRewardDay={todayStatus.nextRewardDay}
            cycleCompleted={cycleInfo.isCycleCompleted}
            onSuccess={handleCheckinSuccess}
            language={language}
          />

          {/* 完成周期提示 */}
          {cycleInfo.isCycleCompleted && (
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg text-center">
              <p className="font-semibold">{t.cycleCompleted}</p>
              <p className="text-sm opacity-90 mt-1">
                {t.totalReward}: {cycleInfo.totalRewardAmount} Som
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 签到日历 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.calendar}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckinCalendar
            calendar={checkinStatus.calendar}
            rewardConfig={cycleInfo.rewardConfig}
            language={language}
          />
        </CardContent>
      </Card>

      {/* 奖励配置 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.totalReward}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {cycleInfo.rewardConfig.map((reward, index) => (
              <div
                key={index}
                className={`text-center p-3 rounded-lg border-2 ${
                  index < cycleInfo.cycleProgress
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : index === cycleInfo.cycleProgress
                    ? 'bg-blue-100 border-blue-300 text-blue-800 ring-2 ring-blue-400'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {t.day.replace('{days}', (index + 1).toString())}
                </div>
                <div className="text-lg font-bold">
                  {reward}
                </div>
                <div className="text-xs opacity-75">Som</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.totalReward}: {cycleInfo.totalRewardAmount} Som
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}