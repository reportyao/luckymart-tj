'use client';

import React, { useState } from 'react';

// 风险事件表格组件
interface RiskEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'manual_review';
  description: string;
  timestamp: string;
  riskScore: number;
}

interface RiskEventTableProps {
  events: RiskEvent[];
  onEventSelect?: (event: RiskEvent) => void;
  onEventAction?: (eventId: string, action: 'approve' | 'reject' | 'review') => void;
  loading?: boolean;
}

// 导出风险事件表格组件
export const RiskEventTable: React.FC<RiskEventTableProps> = ({
  events,
  onEventSelect,
  onEventAction,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'manual_review': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                事件ID {sortBy === 'id' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                事件类型
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('riskLevel')}
              >
                风险等级 {sortBy === 'riskLevel' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('riskScore')}
              >
                风险评分 {sortBy === 'riskScore' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('timestamp')}
              >
                时间 {sortBy === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {event.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{event.userName}</div>
                    <div className="text-gray-500">{event.userId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.eventType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(event.riskLevel)}`}>
                    {event.riskLevel === 'low' && '低风险'}
                    {event.riskLevel === 'medium' && '中风险'}
                    {event.riskLevel === 'high' && '高风险'}
                    {event.riskLevel === 'critical' && '严重风险'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                    {event.status === 'pending' && '待处理'}
                    {event.status === 'approved' && '已通过'}
                    {event.status === 'rejected' && '已拒绝'}
                    {event.status === 'manual_review' && '人工审核'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${event.riskScore}%` }}
                      />
                    </div>
                    <span className="font-medium">{event.riskScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(event.timestamp).toLocaleString('zh-CN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <button
                    onClick={() => onEventSelect?.(event)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    查看
                  </button>
                  {event.status === 'pending' && onEventAction && (
                    <>
                      <button
                        onClick={() => onEventAction(event.id, 'approve')}
                        className="text-green-600 hover:text-green-900"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => onEventAction(event.id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => onEventAction(event.id, 'review')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        审核
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {events.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
          <p className="mt-1 text-sm text-gray-500">没有找到匹配的风险事件</p>
        </div>
      )}
    </div>
  );
};

// 风险用户卡片组件
interface RiskUser {
  id: string;
  userName: string;
  email: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  accountStatus: 'active' | 'frozen' | 'limited' | 'banned';
  registrationDate: string;
  lastLoginDate: string;
  totalEvents: number;
  recentActivity: string;
}

interface RiskUserCardProps {
  user: RiskUser;
  onUserSelect?: (user: RiskUser) => void;
  onAccountAction?: (userId: string, action: 'freeze' | 'unfreeze' | 'limit' | 'ban') => void;
  className?: string;
}

// 导出风险用户卡片组件
export const RiskUserCard: React.FC<RiskUserCardProps> = ({
  user,
  onUserSelect,
  onAccountAction,
  className = ''
}) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'frozen': return 'text-blue-600 bg-blue-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusActionText = (status: string) => {
    switch (status) {
      case 'active': return { action: 'freeze', text: '冻结' };
      case 'frozen': return { action: 'unfreeze', text: '解冻' };
      case 'limited': return { action: 'unfreeze', text: '解除限制' };
      default: return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.userName}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 font-mono">{user.id}</p>
        </div>
        <button
          onClick={() => onUserSelect?.(user)}
          className="text-orange-600 hover:text-orange-900 text-sm font-medium"
        >
          详情
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">风险等级</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(user.riskLevel)}`}>
            {user.riskLevel === 'low' && '低风险'}
            {user.riskLevel === 'medium' && '中风险'}
            {user.riskLevel === 'high' && '高风险'}
            {user.riskLevel === 'critical' && '严重风险'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">账户状态</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.accountStatus)}`}>
            {user.accountStatus === 'active' && '正常'}
            {user.accountStatus === 'frozen' && '已冻结'}
            {user.accountStatus === 'limited' && '已限制'}
            {user.accountStatus === 'banned' && '已封禁'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">风险评分</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${user.totalScore}%` }}
              />
            </div>
            <span className="font-medium text-gray-900">{user.totalScore}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">风险事件</span>
          <span className="text-sm text-gray-900">{user.totalEvents}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">最近登录</span>
          <span className="text-sm text-gray-900">
            {new Date(user.lastLoginDate).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {getStatusActionText(user.accountStatus) && onAccountAction && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onAccountAction(user.id, getStatusActionText(user.accountStatus)!.action as any)}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              user.accountStatus === 'active'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {getStatusActionText(user.accountStatus)!.text}
          </button>
        </div>
      )}
    </div>
  );
};