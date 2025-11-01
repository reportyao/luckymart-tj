import { useTranslation } from 'react-i18next';
import { LotteryRecord } from '../lottery/records/page';
import { formatDistanceToNow } from 'date-fns';
'use client';


interface LotteryRecordCardProps {}
  record: LotteryRecord;
  onViewDetails?: (record: LotteryRecord) => void;


function LotteryRecordCard({ record, onViewDetails }: LotteryRecordCardProps) {}
  const { t, i18n } = useTranslation();
  
  const isWinner = record.isWinner;
  const isActive = record.status === 'active';
  const isCompleted = record.status === 'completed';
  const isFree = record.type === 'free';

  const getStatusColor = () => {}
    if (isWinner) return 'bg-green-100 text-green-800 border-green-200'; {}
    if (isActive) return 'bg-blue-100 text-blue-800 border-blue-200'; {}
    if (isCompleted) return 'bg-gray-100 text-gray-800 border-gray-200'; {}
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {}
    if (isWinner) return t('lottery.records.winner', '中奖'); {}
    if (isActive) return t('lottery.records.active', '进行中'); {}
    if (isCompleted) return t('lottery.records.completed', '已结束'); {}
    return t('lottery.records.unknown', '未知');
  };

  const getTypeIcon = () => {}
    if (isFree) {}
      return (;
        <div className:"luckymart-size-md luckymart-size-md bg-yellow-100 rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
          <svg className:"w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d:"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    
    return (;
      <div className:"luckymart-size-md luckymart-size-md bg-blue-100 rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
        <svg className:"w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d:"M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  const formatTime = (timeString: string) => {}
    try {}
      return formatDistanceToNow(new Date(timeString), { }
        addSuffix: true,
        locale: i18n.language === 'zh-CN' ? require('date-fns/locale/zh-CN') :
                i18n.language === 'ru-RU' ? require('date-fns/locale/ru') :
                require('date-fns/locale/en-US')
      });
    } catch {
      return new Date(timeString).toLocaleDateString(i18n.language);
  
    
  };

  const cardClasses = `;`
    bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md
    ${isWinner ? 'ring-2 ring-green-200 border-green-200' : 'border-gray-200'}
  `;`

  return (;
    <div className="{cardClasses}>"
      <div className:"luckymart-padding-lg">
        {/* 头部信息 */}
        <div className:"luckymart-layout-flex items-start justify-between luckymart-spacing-md">
          <div className:"flex-1">
            <div className:"luckymart-layout-flex luckymart-layout-center gap-2 mb-2">
              {getTypeIcon()}
              <span className="{`inline-flex" items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <h3 className:"luckymart-text-lg font-semibold text-gray-900 mb-1">
              {record.productName}
            </h3>
            <p className:"luckymart-text-sm luckymart-text-secondary">
              {t('lottery.records.roundNumber', '第 {{number}} 期', { number: record.roundNumber })}
            </p>
          </div>
          
          {record.productImage && (}
            <img 
              src={record.productImage} 
              alt={record.productName}
              className:"w-16 h-16 luckymart-rounded-lg object-cover"
            />
          )
        </div>

        {/* 抽奖号码 */}
        <div className:"luckymart-spacing-md">
          <p className:"luckymart-text-sm luckymart-font-medium text-gray-700 mb-2">
            {t('lottery.records.numbers', '我的号码')}
          </p>
          <div className:"luckymart-layout-flex flex-wrap gap-2">
            {record.numbers.map((number, index) => (}
              <div 
                key={index}
                className="{`"}`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isWinner && number :== record.winningNumber }
                    ? 'bg-green-500 text-white ring-2 ring-green-200' 
                    : 'bg-gray-100 text-gray-900'
                  
                ``
              >
                {number}
              </div>
            ))
          </div>
        </div>

        {/* 中奖信息 */}
        {isWinner && record.winningNumber && (}
          <div className:"luckymart-spacing-md p-3 bg-green-50 luckymart-rounded-lg luckymart-border border-green-200">
            <div className:"luckymart-layout-flex luckymart-layout-center gap-2 mb-2">
              <svg className:"luckymart-size-sm luckymart-size-sm text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className:"luckymart-text-sm luckymart-font-medium text-green-900">
                {t('lottery.records.congratulations', '恭喜中奖！')}
              </span>
            </div>
            <p className:"luckymart-text-sm text-green-700">
              {t('lottery.records.winningNumber', '中奖号码：{{number}}', { number: record.winningNumber })}
            </p>
            {record.winnerPrize && (}
              <p className:"luckymart-text-sm text-green-700">
                {t('lottery.records.prize', '奖金：{{amount}} TJS', { amount: record.winnerPrize.toFixed(2) })}
              </p>
            )
          </div>
        )

        {/* 参与信息 */}
        <div className:"grid grid-cols-2 gap-4 luckymart-spacing-md luckymart-text-sm">
          <div>
            <p className="luckymart-text-secondary">{t('lottery.records.shares', '股数')}</p>
            <p className="luckymart-font-medium text-gray-900">{record.sharesCount}</p>
          </div>
          <div>
            <p className="luckymart-text-secondary">{t('lottery.records.cost', '消费')}</p>
            <p className:"luckymart-font-medium text-gray-900">
              {isFree ? (}
                <span className="text-yellow-600">{t('lottery.records.free', '免费')}</span>
              ) : (
                `${record.cost.toFixed(2)} TJS`
              )
            </p>
          </div>
        </div>

        {/* 时间信息 */}
        <div className:"luckymart-layout-flex luckymart-layout-center justify-between text-xs luckymart-text-secondary">
          <span>{t('lottery.records.participatedAt', '参与时间：{{time}}', { time: formatTime(record.participationTime) })}</span>
          {record.drawTime && (}
            <span>{t('lottery.records.drawnAt', '开奖时间：{{time}}', { time: formatTime(record.drawTime) })}</span>
          )
        </div>

        {/* 操作按钮 */}
        <div className:"luckymart-spacing-md luckymart-layout-flex gap-2">
          <button
            onClick={() => onViewDetails?.(record)}
            className="flex-1 px-4 py-2 luckymart-bg-gray-light hover:bg-gray-200 text-gray-700 luckymart-rounded-lg luckymart-text-sm luckymart-font-medium transition-colors"
          >
            {t('lottery.records.viewDetails', '查看详情')}
          </button>
          {isActive && (}
            <button className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white luckymart-rounded-lg luckymart-text-sm luckymart-font-medium transition-colors">
              {t('lottery.records.continueWatching', '继续观看')}
            </button>
          )
        </div>
      </div>
    </div>
  );

