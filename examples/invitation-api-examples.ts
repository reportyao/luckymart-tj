/**
 * 邀请裂变系统 API 使用示例
 * 
 * 本文件展示了如何在客户端代码中使用邀请系统API的完整示例
 * 包括认证、错误处理、数据处理等最佳实践
 */

// ================================
// 基础设置和工具函数
// ================================

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.luckymart-tj.com';

// HTTP请求工具函数
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // 从localStorage或安全存储中获取token
    this.accessToken = this.getStoredToken();
  }

  // 获取存储的认证令牌
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  // 设置认证令牌
  public setAccessToken(token: string): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  // 清除认证令牌
  public clearAccessToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // 通用请求方法
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; response: Response }> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 设置默认请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    // 添加认证头
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // 处理响应
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.error || '请求失败', errorData);
      }

      const data = await response.json();
      return { data, response };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 网络错误或其他错误
      throw new ApiError(0, '网络连接失败', { originalError: error });
    }
  }

  // GET请求
  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const { data } = await this.request<T>(url, { method: 'GET' });
    return data;
  }

  // POST请求
  public async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const { data } = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
    return data;
  }
}

// API错误类
class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.code = details?.code;
    this.details = details;
  }
}

// ================================
// 邀请系统 API 客户端
// ================================

class InvitationApiClient {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * 1. 生成个人邀请码
   */
  async generateReferralCode(): Promise<{
    referralCode: string;
    shareLinks: {
      telegram: string;
      general: string;
    };
    shareTexts: {
      zh: string;
      ru: string;
      tg: string;
    };
    qrCodeUrl?: string;
  }> {
    try {
      const response = await this.client.post('/api/invitation/generate-code');
      
      if (!response.success) {
        throw new Error(response.error || '生成邀请码失败');
      }

      return response.data;
    } catch (error) {
      console.error('生成邀请码失败:', error);
      throw error;
    }
  }

  /**
   * 2. 获取我的邀请码和统计
   */
  async getMyReferralInfo(): Promise<{
    referralCode: string;
    shareLinks: {
      telegram: string;
      general: string;
    };
    shareTexts: {
      zh: string;
      ru: string;
      tg: string;
    };
    stats: ReferralStats;
  }> {
    try {
      const response = await this.client.get('/api/invitation/my-code');
      
      if (!response.success) {
        throw new Error(response.error || '获取邀请信息失败');
      }

      return response.data;
    } catch (error) {
      console.error('获取邀请信息失败:', error);
      throw error;
    }
  }

  /**
   * 3. 绑定邀请关系
   */
  async bindReferral(referralCode: string): Promise<{
    success: boolean;
    referrerUserId?: string;
    referrerName?: string;
    message: string;
  }> {
    try {
      // 验证邀请码格式
      if (!this.validateReferralCodeFormat(referralCode)) {
        throw new Error('邀请码格式无效');
      }

      const response = await this.client.post('/api/invitation/bind', {
        referralCode: referralCode.toUpperCase().trim()
      });

      if (!response.success) {
        throw new Error(response.error || '绑定邀请关系失败');
      }

      return response.data;
    } catch (error) {
      console.error('绑定邀请关系失败:', error);
      throw error;
    }
  }

  /**
   * 4. 查询邀请奖励记录
   */
  async getInvitationRewards(options: {
    page?: number;
    limit?: number;
    rewardType?: 'first_recharge' | 'commission';
    status?: 'available' | 'claimed' | 'expired';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    rewards: InvitationReward[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalAvailable: number;
      totalClaimed: number;
      totalAmount: number;
    };
  }> {
    try {
      const response = await this.client.get('/api/invitation/rewards', options);
      
      if (!response.success) {
        throw new Error(response.error || '获取奖励记录失败');
      }

      return response.data;
    } catch (error) {
      console.error('获取奖励记录失败:', error);
      throw error;
    }
  }

  /**
   * 5. 查询消费返利记录
   */
  async getCommissionRecords(options: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    commissions: InvitationReward[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalCommissions: number;
      claimedCommissions: number;
      unclaimedCommissions: number;
    };
  }> {
    try {
      const response = await this.client.get('/api/invitation/commission', options);
      
      if (!response.success) {
        throw new Error(response.error || '获取返利记录失败');
      }

      return response.data;
    } catch (error) {
      console.error('获取返利记录失败:', error);
      throw error;
    }
  }

  /**
   * 6. 领取邀请奖励
   */
  async claimRewards(rewardIds: string[]): Promise<{
    success: boolean;
    claimedRewards: string[];
    failedRewards: Array<{ rewardId: string; reason: string }>;
    totalClaimedAmount: number;
  }> {
    try {
      if (!rewardIds || rewardIds.length === 0) {
        throw new Error('请选择要领取的奖励');
      }

      if (rewardIds.length > 50) {
        throw new Error('单次最多只能领取50个奖励');
      }

      const response = await this.client.post('/api/invitation/claim-reward', {
        rewardIds
      });

      if (!response.success) {
        throw new Error(response.error || '领取奖励失败');
      }

      return response.data;
    } catch (error) {
      console.error('领取奖励失败:', error);
      throw error;
    }
  }

  /**
   * 验证邀请码格式
   */
  private validateReferralCodeFormat(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // 格式：LM + 6位字母数字组合
    const pattern = /^LM[A-Z0-9]{6}$/;
    return pattern.test(code.toUpperCase().trim());
  }
}

// ================================
// React Hook 示例
// ================================

import { useState, useEffect, useCallback } from 'react';

// 邀请信息 Hook
export function useReferralInfo() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = new ApiClient(API_BASE_URL);
  const invitationApi = new InvitationApiClient(apiClient);

  const fetchReferralInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invitationApi.getMyReferralInfo();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取邀请信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReferralCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invitationApi.generateReferralCode();
      setData(prev => ({ ...prev, ...result }));
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成邀请码失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralInfo();
  }, [fetchReferralInfo]);

  return {
    data,
    loading,
    error,
    refetch: fetchReferralInfo,
    generateReferralCode
  };
}

// 奖励记录 Hook
export function useInvitationRewards() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = new ApiClient(API_BASE_URL);
  const invitationApi = new InvitationApiClient(apiClient);

  const fetchRewards = useCallback(async (options?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invitationApi.getInvitationRewards(options);
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取奖励记录失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const claimRewards = useCallback(async (rewardIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invitationApi.claimRewards(rewardIds);
      
      // 刷新数据
      await fetchRewards();
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '领取奖励失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchRewards]);

  return {
    data,
    loading,
    error,
    refetch: fetchRewards,
    claimRewards
  };
}

// ================================
// React 组件示例
// ================================

// 邀请码展示组件
export function ReferralCodeDisplay() {
  const { data, loading, error, generateReferralCode } = useReferralInfo();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  if (!data) {
    return <div>暂无数据</div>;
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.referralCode);
      alert('邀请码已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="referral-display">
      <h3>我的邀请码</h3>
      <div className="referral-code">
        <span className="code">{data.referralCode}</span>
        <button onClick={handleCopyCode}>复制</button>
        <button onClick={generateReferralCode}>重新生成</button>
      </div>
      
      <div className="share-links">
        <h4>分享链接</h4>
        <p>Telegram: {data.shareLinks.telegram}</p>
        <p>通用链接: {data.shareLinks.general}</p>
      </div>

      <div className="stats">
        <h4>邀请统计</h4>
        <p>总邀请人数: {data.stats.totalInvites}</p>
        <p>成功邀请: {data.stats.successfulInvites}</p>
        <p>未领取奖励: {data.stats.unclaimedRewards}</p>
        <p>未领取佣金: {data.stats.unclaimedCommission} TJS</p>
      </div>
    </div>
  );
}

// 邀请绑定组件
export function ReferralBindForm() {
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const apiClient = new ApiClient(API_BASE_URL);
  const invitationApi = new InvitationApiClient(apiClient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referralCode.trim()) {
      alert('请输入邀请码');
      return;
    }

    try {
      setLoading(true);
      const bindResult = await invitationApi.bindReferral(referralCode.trim());
      setResult(bindResult);
      
      if (bindResult.success) {
        alert(`绑定成功！邀请人：${bindResult.referrerName}`);
        setReferralCode('');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '绑定失败';
      alert(errorMsg);
      console.error('绑定邀请关系失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="referral-bind-form">
      <h3>绑定邀请关系</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="请输入邀请码（格式：LMxxxxxx）"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          maxLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? '绑定中...' : '绑定邀请'}
        </button>
      </form>
      
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}

// 奖励列表组件
export function RewardsList() {
  const { data, loading, error, claimRewards } = useInvitationRewards();

  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);

  if (loading && !data) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  if (!data) {
    return <div>暂无奖励记录</div>;
  }

  const handleSelectReward = (rewardId: string) => {
    setSelectedRewards(prev => 
      prev.includes(rewardId) 
        ? prev.filter(id => id !== rewardId)
        : [...prev, rewardId]
    );
  };

  const handleClaimSelected = async () => {
    if (selectedRewards.length === 0) {
      alert('请选择要领取的奖励');
      return;
    }

    try {
      const result = await claimRewards(selectedRewards);
      
      if (result.success) {
        alert(`成功领取 ${result.claimedRewards.length} 个奖励，总金额 ${result.totalClaimedAmount} TJS`);
        setSelectedRewards([]);
      }

      if (result.failedRewards.length > 0) {
        console.warn('部分奖励领取失败:', result.failedRewards);
      }
    } catch (err) {
      console.error('领取奖励失败:', err);
    }
  };

  const handleClaimAll = async () => {
    const availableRewards = data.rewards.filter((reward: any) => 
      !reward.isClaimed && new Date(reward.expiresAt) > new Date()
    );
    
    const rewardIds = availableRewards.map((reward: any) => reward.id);
    
    if (rewardIds.length === 0) {
      alert('没有可领取的奖励');
      return;
    }

    try {
      const result = await claimRewards(rewardIds);
      alert(`成功领取 ${result.claimedRewards.length} 个奖励`);
      setSelectedRewards([]);
    } catch (err) {
      console.error('批量领取失败:', err);
    }
  };

  return (
    <div className="rewards-list">
      <div className="rewards-header">
        <h3>我的奖励</h3>
        <div className="summary">
          <span>可领取: {data.summary.totalAvailable}</span>
          <span>已领取: {data.summary.totalClaimed}</span>
          <span>总金额: {data.summary.totalAmount} TJS</span>
        </div>
      </div>

      <div className="actions">
        <button 
          onClick={handleClaimSelected}
          disabled={selectedRewards.length === 0}
        >
          领取选中 ({selectedRewards.length})
        </button>
        <button onClick={handleClaimAll}>
          全部领取
        </button>
      </div>

      <div className="rewards-grid">
        {data.rewards.map((reward: any) => (
          <div key={reward.id} className={`reward-card ${reward.isClaimed ? 'claimed' : ''}`}>
            <div className="reward-header">
              <input
                type="checkbox"
                checked={selectedRewards.includes(reward.id)}
                onChange={() => handleSelectReward(reward.id)}
                disabled={reward.isClaimed || new Date(reward.expiresAt) <= new Date()}
              />
              <span className="reward-type">
                {reward.rewardType === 'first_recharge' ? '首充奖励' : '消费返利'}
              </span>
              <span className="reward-amount">{reward.rewardAmount} {reward.currency}</span>
            </div>
            
            <div className="reward-details">
              <p>描述: {reward.description}</p>
              <p>创建时间: {new Date(reward.createdAt).toLocaleString()}</p>
              <p>过期时间: {new Date(reward.expiresAt).toLocaleString()}</p>
              <p>状态: {
                reward.isClaimed ? '已领取' : 
                new Date(reward.expiresAt) <= new Date() ? '已过期' : '可领取'
              }</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <span>第 {data.pagination.page} 页，共 {data.pagination.totalPages} 页</span>
      </div>
    </div>
  );
}

// ================================
// 类型定义
// ================================

interface ReferralStats {
  userId: string;
  referralCode: string;
  firstName: string;
  username?: string;
  totalInvites: number;
  successfulInvites: number;
  totalRewards: number;
  claimedRewards: number;
  unclaimedRewards: number;
  totalCommission: number;
  claimedCommission: number;
  unclaimedCommission: number;
  lastInviteDate?: string;
  lastRewardDate?: string;
}

interface InvitationReward {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralRelationshipId?: string;
  rewardType: 'first_recharge' | 'commission';
  rewardAmount: number;
  currency: string;
  relatedOrderId?: string;
  description?: string;
  isClaimed: boolean;
  claimedAt?: string;
  expiresAt?: string;
  status: 'available' | 'claimed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// ================================
// 使用示例
// ================================

// 在页面或组件中使用
export function InvitationPage() {
  return (
    <div className="invitation-page">
      <h2>邀请中心</h2>
      
      {/* 邀请码展示 */}
      <ReferralCodeDisplay />
      
      {/* 邀请绑定 */}
      <ReferralBindForm />
      
      {/* 奖励列表 */}
      <RewardsList />
    </div>
  );
}

// 独立使用API客户端的示例
export async function standaloneUsageExample() {
  // 1. 初始化客户端
  const apiClient = new ApiClient(API_BASE_URL);
  
  // 2. 设置认证令牌（通常在登录后设置）
  // apiClient.setAccessToken('your-jwt-token-here');
  
  // 3. 创建邀请API客户端
  const invitationApi = new InvitationApiClient(apiClient);
  
  try {
    // 示例1: 生成邀请码
    const referralCode = await invitationApi.generateReferralCode();
    console.log('邀请码:', referralCode);
    
    // 示例2: 获取邀请信息
    const referralInfo = await invitationApi.getMyReferralInfo();
    console.log('邀请信息:', referralInfo);
    
    // 示例3: 绑定邀请关系
    const bindResult = await invitationApi.bindReferral('LM123456');
    console.log('绑定结果:', bindResult);
    
    // 示例4: 获取奖励记录
    const rewards = await invitationApi.getInvitationRewards({
      page: 1,
      limit: 10,
      status: 'available'
    });
    console.log('奖励记录:', rewards);
    
    // 示例5: 领取奖励
    const claimResult = await invitationApi.claimRewards(['reward-id-1', 'reward-id-2']);
    console.log('领取结果:', claimResult);
    
  } catch (error) {
    console.error('API调用失败:', error);
    
    // 错误处理
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          console.log('未授权，需要重新登录');
          // 跳转到登录页
          break;
        case 400:
          console.log('请求参数错误:', error.message);
          break;
        case 404:
          console.log('资源不存在');
          break;
        default:
          console.log('其他错误:', error.message);
      }
    }
  }
}

// 导出默认实例
export const defaultInvitationApi = new InvitationApiClient(new ApiClient(API_BASE_URL));