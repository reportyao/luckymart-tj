'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

// 风险详情弹窗
const RiskEventDetail = ({ 
  event, 
  onClose, 
  onApprove, 
  onReject, 
  onManualReview 
}: { 
  event: RiskEvent | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onManualReview: (id: string) => void;
}) => {
  if (!event) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">风险事件详情</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">事件ID</label>
                <p className="text-lg font-mono text-gray-900">{event.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">用户信息</label>
                <p className="text-lg text-gray-900">{event.userName} (#{event.userId})</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">风险等级</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(event.riskLevel)}`}>
                  {event.riskLevel === 'low' && '低风险'}
                  {event.riskLevel === 'medium' && '中风险'}
                  {event.riskLevel === 'high' && '高风险'}
                  {event.riskLevel === 'critical' && '严重风险'}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">状态</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {event.status === 'pending' && '待处理'}
                  {event.status === 'approved' && '已通过'}
                  {event.status === 'rejected' && '已拒绝'}
                  {event.status === 'manual_review' && '人工审核'}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">风险评分</label>
                <p className="text-lg font-bold text-gray-900">{event.riskScore}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">事件类型</label>
              <p className="text-lg text-gray-900">{event.eventType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">事件描述</label>
              <p className="text-gray-900 mt-1">{event.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">发生时间</label>
              <p className="text-gray-900">{new Date(event.timestamp).toLocaleString('zh-CN')}</p>
            </div>
          </div>

          {event.status === 'pending' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onApprove(event.id)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                通过
              </button>
              <button
                onClick={() => onReject(event.id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                拒绝
              </button>
              <button
                onClick={() => onManualReview(event.id)}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                人工审核
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RiskEventsPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<RiskEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    eventType: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {
      router.push('/admin');
      return;
    }

    setAdminInfo(JSON.parse(info));
    loadRiskEvents();
    setLoading(false);
  }, [router]);

  // 模拟数据
  const loadRiskEvents = () => {
    const mockEvents: RiskEvent[] = [
      {
        id: 'RE001',
        userId: 'U1001',
        userName: '张三',
        eventType: '异常登录',
        riskLevel: 'high',
        status: 'pending',
        description: '用户从非常用设备登录，IP地址异常',
        timestamp: '2025-10-31T15:30:00Z',
        riskScore: 85
      },
      {
        id: 'RE002',
        userId: 'U1002',
        userName: '李四',
        eventType: '大额交易',
        riskLevel: 'medium',
        status: 'approved',
        description: '单笔交易金额超过用户历史平均值的3倍',
        timestamp: '2025-10-31T14:15:00Z',
        riskScore: 72
      },
      {
        id: 'RE003',
        userId: 'U1003',
        userName: '王五',
        eventType: '频繁操作',
        riskLevel: 'critical',
        status: 'manual_review',
        description: '短时间内进行大量账户操作，疑似机器人行为',
        timestamp: '2025-10-31T13:45:00Z',
        riskScore: 95
      },
      {
        id: 'RE004',
        userId: 'U1004',
        userName: '赵六',
        eventType: '设备指纹异常',
        riskLevel: 'medium',
        status: 'rejected',
        description: '设备指纹与之前记录不符',
        timestamp: '2025-10-31T12:20:00Z',
        riskScore: 68
      },
      {
        id: 'RE005',
        userId: 'U1005',
        userName: '钱七',
        eventType: 'IP地理位置异常',
        riskLevel: 'low',
        status: 'pending',
        description: '登录IP地理位置与用户常用地点不符',
        timestamp: '2025-10-31T11:30:00Z',
        riskScore: 45
      }
    ];
    setEvents(mockEvents);
  };

  // 筛选和排序
  useEffect(() => {
    let filtered = events.filter(event => {
      if (filters.riskLevel !== 'all' && event.riskLevel !== filters.riskLevel) return false;
      if (filters.status !== 'all' && event.status !== filters.status) return false;
      if (filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
      if (filters.search && !event.userName.toLowerCase().includes(filters.search.toLowerCase()) && 
          !event.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        default:
          aValue = a[sortBy as keyof RiskEvent];
          bValue = b[sortBy as keyof RiskEvent];
      }
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredEvents(filtered);
  }, [events, filters, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleApprove = (id: string) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, status: 'approved' as const } : event
    ));
  };

  const handleReject = (id: string) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, status: 'rejected' as const } : event
    ));
  };

  const handleManualReview = (id: string) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, status: 'manual_review' as const } : event
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">风险事件管理</h1>
              <p className="text-sm text-gray-600">查看和处理所有风险事件</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/risk-dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              返回风控面板
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <input
                type="text"
                placeholder="搜索用户或事件ID"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">全部</option>
                <option value="low">低风险</option>
                <option value="medium">中风险</option>
                <option value="high">高风险</option>
                <option value="critical">严重风险</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">全部</option>
                <option value="pending">待处理</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="manual_review">人工审核</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">事件类型</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">全部</option>
                <option value="异常登录">异常登录</option>
                <option value="大额交易">大额交易</option>
                <option value="频繁操作">频繁操作</option>
                <option value="设备指纹异常">设备指纹异常</option>
                <option value="IP地理位置异常">IP地理位置异常</option>
              </select>
            </div>
          </div>
        </div>

        {/* 事件列表 */}
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
                {filteredEvents.map((event) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
              <p className="mt-1 text-sm text-gray-500">没有找到匹配的风险事件</p>
            </div>
          )}
        </div>
      </div>

      {/* 风险事件详情弹窗 */}
      <RiskEventDetail
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onManualReview={handleManualReview}
      />
    </div>
  );
}