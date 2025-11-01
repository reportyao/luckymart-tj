'use client';

import { Badge } from '@/components/ui/badge';
import { Check, Coins, Calendar, Circle } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { zhCN, tg } from 'date-fns/locale';

interface CalendarDay {
  date: string;
  day: number | null;
  reward: number | null;
  isCheckedIn: boolean;
  isToday: boolean;
}

interface CheckinCalendarProps {
  calendar: CalendarDay[];
  rewardConfig: number[];
  language: string;
}

function CheckinCalendar({ 
  calendar, 
  rewardConfig,
  language 
}: CheckinCalendarProps) {
  // 多语言日期格式化
  const locale = language === 'tg-TJ' ? tg : zhCN;

  // 星期标题
  const weekDays = {
    'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
    'tg-TJ': ['Як', 'Ду', 'Се', 'Чо', 'Пн', 'Ҷм', 'Шн']
  };

  const weekdays = weekDays[language] || weekDays['zh-CN'];

  // 获取月份和年份用于显示
  const firstDate = parseISO(calendar[0]?.date);
  const monthYear = format(firstDate, 'yyyy年MM月', { locale });

  // 获取某一天的奖励
  const getDayReward = (day: number | null): number | null => {
    if (day === null) return null;
    return rewardConfig[day - 1] || null;
  };

  // 获取日期状态样式
  const getDayStyle = (calendarDay: CalendarDay) => {
    const baseStyle = "relative p-3 rounded-lg border-2 transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center";
    
    if (calendarDay.isToday && calendarDay.isCheckedIn) {
      return `${baseStyle} bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400 text-white shadow-lg`;
    } else if (calendarDay.isToday && !calendarDay.isCheckedIn) {
      return `${baseStyle} bg-gradient-to-br from-blue-50 to-purple-50 border-blue-400 text-blue-800 ring-2 ring-blue-300`;
    } else if (calendarDay.isCheckedIn) {
      return `${baseStyle} bg-green-50 border-green-300 text-green-800 hover:bg-green-100`;
    } else if (calendarDay.isToday) {
      return `${baseStyle} bg-blue-50 border-blue-300 text-blue-800`;
    } else {
      return `${baseStyle} bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100`;
    }
  };

  // 获取奖励显示样式
  const getRewardStyle = (calendarDay: CalendarDay) => {
    if (calendarDay.isCheckedIn) {
      return "text-green-600 dark:text-green-400";
    } else if (calendarDay.isToday) {
      return "text-blue-600 dark:text-blue-400";
    } else {
      return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* 月份标题 */}
      <div className="luckymart-text-center">
        <h3 className="luckymart-text-lg font-semibold text-gray-800 dark:text-gray-200">
          {monthYear}
        </h3>
        <p className="luckymart-text-sm luckymart-text-secondary dark:text-gray-400">
          7天签到周期日历
        </p>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="luckymart-text-center luckymart-text-sm luckymart-font-medium luckymart-text-secondary dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-2">
        {calendar.map((calendarDay) => {
          const date = parseISO(calendarDay.date);
          const reward = getDayReward(calendarDay.day);
          const dayNumber = format(date, 'd');
          const dayOfWeek = format(date, 'EEEE', { locale });

          return (
            <div
              key={calendarDay.date}
              className={getDayStyle(calendarDay)}
              title={`${format(date, 'yyyy年MM月dd日 EEEE', { locale })}`}
            >
              {/* 日期数字 */}
              <div className="luckymart-text-lg luckymart-font-bold mb-1">
                {dayNumber}
              </div>

              {/* 签到状态指示器 */}
              <div className="mb-2">
                {calendarDay.isCheckedIn ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : calendarDay.isToday ? (
                  <Circle className="h-4 w-4 text-blue-600" />
                ) : (
                  <Calendar className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* 签到天数 */}
              {calendarDay.isCheckedIn && calendarDay.day && (
                <div className="text-xs mb-1">
                  {language === 'tg-TJ' ? 'Рӯзи' : '第'}{calendarDay.day}
                  {language !== 'tg-TJ' && '天'}
                </div>
              )}

              {/* 奖励金额 */}
              <div className="text-xs luckymart-font-medium">
                {reward !== null ? (
                  <div className="luckymart-layout-flex luckymart-layout-center gap-1">
                    <Coins className={`h-3 w-3 ${getRewardStyle(calendarDay)}`} />
                    <span className={getRewardStyle(calendarDay)}>
                      {reward}
                    </span>
                  </div>
                ) : calendarDay.isToday ? (
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    {language === 'tg-TJ' ? 'Имрӯз' : '今天'}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">
                    -
                  </span>
                )}
              </div>

              {/* 今日高亮标识 */}
              {calendarDay.isToday && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 text-xs px-1 py-0"
                >
                  {language === 'tg-TJ' ? 'Имрӯз' : '今日'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例说明 */}
      <div className="luckymart-layout-flex flex-wrap luckymart-layout-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-4 border-t">
        <div className="luckymart-layout-flex luckymart-layout-center gap-1">
          <Check className="h-4 w-4 text-green-600" />
          <span>已签到</span>
        </div>
        <div className="luckymart-layout-flex luckymart-layout-center gap-1">
          <Circle className="h-4 w-4 text-blue-600" />
          <span>今日</span>
        </div>
        <div className="luckymart-layout-flex luckymart-layout-center gap-1">
          <Coins className="h-4 w-4 text-gray-400" />
          <span>奖励金额</span>
        </div>
        <div className="luckymart-layout-flex luckymart-layout-center gap-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>未签到</span>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 luckymart-rounded-lg luckymart-padding-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 luckymart-text-center">
          <div>
            <div className="text-2xl luckymart-font-bold text-green-600 dark:text-green-400">
              {calendar.filter(day => day.isCheckedIn).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              已签到天数
            </div>
          </div>
          <div>
            <div className="text-2xl luckymart-font-bold text-blue-600 dark:text-blue-400">
              {calendar.filter(day => day.isToday && !day.isCheckedIn).length > 0 ? 
                (calendar.find(day => day.isToday)?.day || 0) : 
                (calendar.filter(day => day.isCheckedIn).length > 0 ? 
                  Math.max(...calendar.filter(day => day.isCheckedIn).map(day => day.day || 0)) : 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              当前天数
            </div>
          </div>
          <div>
            <div className="text-2xl luckymart-font-bold text-purple-600 dark:text-purple-400">
              {calendar
                .filter(day => day.isCheckedIn && day.reward !== null)
                .reduce((sum, day) => sum + (day.reward || 0), 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              已获得 (Som)
            </div>
          </div>
          <div>
            <div className="text-2xl luckymart-font-bold text-orange-600 dark:text-orange-400">
              {rewardConfig
                .slice(0, calendar.filter(day => day.isToday).length > 0 ? 
                  (calendar.find(day => day.isToday)?.day || 0) : 
                  calendar.filter(day => day.isCheckedIn).length)
                .reduce((sum, reward) => sum + reward, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              理论获得 (Som)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}