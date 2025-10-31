/**
 * 新手任务系统API使用示例
 * 
 * 本文件提供了完整的任务系统API调用示例，
 * 包括请求格式、响应处理和错误处理。
 */

// 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ACCESS_TOKEN = 'your_access_token_here'; // 需要替换为有效的访问令牌

// 请求头配置
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Accept': 'application/json'
};

/**
 * API响应处理工具函数
 */
function handleApiResponse(response) {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }
  return response.json();
}

/**
 * 错误处理工具函数
 */
function handleApiError(error, context = '') {
  console.error(`API Error ${context}:`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      success: false,
      error: '网络连接失败，请检查网络连接',
      code: 'NETWORK_ERROR'
    };
  }
  
  return {
    success: false,
    error: error.message || '未知错误',
    code: 'UNKNOWN_ERROR'
  };
}

// ========================================
// 1. 获取任务列表和用户进度
// ========================================

/**
 * 获取任务列表和用户进度
 * @returns {Promise<Object>} 任务列表数据
 */
async function getTaskList() {
  try {
    console.log('🔍 开始获取任务列表...');
    
    const response = await fetch(`${API_BASE_URL}/api/tasks/list`, {
      method: 'GET',
      headers: defaultHeaders
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ 任务列表获取成功:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || '获取任务列表失败');
    }
  } catch (error) {
    console.error('❌ 获取任务列表失败:', error);
    throw handleApiError(error, '获取任务列表');
  }
}

// ========================================
// 2. 领取任务奖励
// ========================================

/**
 * 领取任务奖励
 * @param {string} taskType - 任务类型 (register, first_recharge, first_lottery)
 * @returns {Promise<Object>} 领取结果
 */
async function claimTaskReward(taskType) {
  try {
    if (!taskType) {
      throw new Error('任务类型不能为空');
    }

    console.log(`🎁 开始领取任务奖励: ${taskType}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/tasks/claim`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        taskType: taskType
      })
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ 奖励领取成功:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || '领取奖励失败');
    }
  } catch (error) {
    console.error(`❌ 领取任务奖励失败 (${taskType}):`, error);
    
    // 处理特定错误类型
    if (error.message.includes('409')) {
      throw new Error('奖励已领取，不能重复领取');
    } else if (error.message.includes('429')) {
      throw new Error('领取过于频繁，请稍后再试');
    } else if (error.message.includes('400')) {
      throw new Error('任务尚未完成，无法领取奖励');
    }
    
    throw handleApiError(error, '领取任务奖励');
  }
}

// ========================================
// 3. 查询用户任务完成情况
// ========================================

/**
 * 查询用户任务完成情况
 * @param {Object} filters - 过滤参数
 * @param {string} filters.status - 状态过滤 (pending|completed|rewarded)
 * @param {string} filters.taskType - 任务类型过滤
 * @returns {Promise<Object>} 任务进度数据
 */
async function getTaskProgress(filters = {}) {
  try {
    console.log('📊 开始查询任务进度...', filters);
    
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.taskType) queryParams.append('taskType', filters.taskType);
    
    const url = `${API_BASE_URL}/api/tasks/progress${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ 任务进度查询成功:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || '查询任务进度失败');
    }
  } catch (error) {
    console.error('❌ 查询任务进度失败:', error);
    throw handleApiError(error, '查询任务进度');
  }
}

// ========================================
// 4. 检查任务完成状态
// ========================================

/**
 * 检查任务完成状态
 * @param {string} taskType - 任务类型 (register, first_recharge, first_lottery, all)
 * @returns {Promise<Object>} 检查结果
 */
async function checkTaskCompletion(taskType) {
  try {
    if (!taskType) {
      throw new Error('任务类型不能为空');
    }

    console.log(`🔍 开始检查任务完成状态: ${taskType}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/tasks/check-complete`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        taskType: taskType
      })
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ 任务状态检查成功:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || '检查任务状态失败');
    }
  } catch (error) {
    console.error(`❌ 检查任务完成状态失败 (${taskType}):`, error);
    throw handleApiError(error, '检查任务完成状态');
  }
}

// ========================================
// 完整业务流程示例
// ========================================

/**
 * 完整的新手任务业务流程示例
 */
async function completeNewUserTaskFlow() {
  try {
    console.log('\n🚀 开始新手任务完整流程...');
    
    // 1. 获取任务列表
    console.log('\n步骤 1: 获取任务列表');
    const taskList = await getTaskList();
    
    // 2. 查找可领取奖励的任务
    const claimableTasks = taskList.tasks.filter(task => task.canClaim);
    console.log(`📋 发现 ${claimableTasks.length} 个可领取奖励的任务`);
    
    // 3. 逐个领取奖励
    for (const task of claimableTasks) {
      try {
        console.log(`\n正在领取: ${task.name}`);
        const claimResult = await claimTaskReward(task.taskType);
        console.log(`✅ ${task.name} 奖励领取成功，获得 ${task.reward.formatted}`);
        
        // 更新用户界面显示
        console.log(`💰 当前幸运币余额: ${claimResult.user.luckyCoins}`);
      } catch (error) {
        console.error(`❌ 领取 ${task.name} 失败:`, error.message);
      }
    }
    
    // 4. 刷新任务状态
    console.log('\n步骤 4: 刷新任务状态');
    const updatedProgress = await getTaskProgress();
    console.log(`📊 更新后完成率: ${updatedProgress.stats.completionRate}%`);
    
    // 5. 检查是否还有未完成的自动检测任务
    console.log('\n步骤 5: 检查所有任务状态');
    const checkResult = await checkTaskCompletion('all');
    console.log(`🔍 检查结果: 更新了 ${checkResult.stats.updated} 个任务状态`);
    
    console.log('\n🎉 新手任务流程完成！');
    return {
      success: true,
      message: '新手任务流程执行完成',
      finalStats: updatedProgress.stats
    };
    
  } catch (error) {
    console.error('\n❌ 新手任务流程执行失败:', error);
    throw error;
  }
}

// ========================================
// 前端组件使用示例
// ========================================

/**
 * React组件中的任务系统使用示例
 */
class TaskSystemComponent {
  constructor() {
    this.tasks = [];
    this.loading = false;
    this.error = null;
  }

  /**
   * 初始化任务数据
   */
  async initializeTasks() {
    this.setLoading(true);
    try {
      const taskData = await getTaskList();
      this.tasks = taskData.tasks;
      this.setError(null);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 领取单个任务奖励
   */
  async claimTask(taskType) {
    try {
      this.setLoading(true);
      const result = await claimTaskReward(taskType);
      
      // 更新本地任务状态
      const taskIndex = this.tasks.findIndex(t => t.taskType === taskType);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'rewarded';
        this.tasks[taskIndex].rewardClaimed = true;
        this.tasks[taskIndex].canClaim = false;
      }
      
      // 更新用户余额
      this.updateUserBalance(result.user);
      
      return result;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 批量领取所有可用奖励
   */
  async claimAllRewards() {
    const claimableTasks = this.tasks.filter(task => task.canClaim);
    const results = [];
    
    for (const task of claimableTasks) {
      try {
        const result = await this.claimTask(task.taskType);
        results.push({
          taskType: task.taskType,
          success: true,
          reward: result.claim.reward
        });
      } catch (error) {
        results.push({
          taskType: task.taskType,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 刷新任务状态
   */
  async refreshTasks() {
    try {
      this.setLoading(true);
      const progressData = await getTaskProgress();
      this.tasks = progressData.tasks;
      this.setError(null);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 手动检查任务完成状态
   */
  async checkAllTasks() {
    try {
      this.setLoading(true);
      const checkResult = await checkTaskCompletion('all');
      
      // 更新任务状态
      if (checkResult.stats.updated > 0) {
        // 重新获取最新状态
        await this.refreshTasks();
      }
      
      return checkResult;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 获取任务统计信息
   */
  getTaskStats() {
    const stats = {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      rewarded: this.tasks.filter(t => t.status === 'rewarded').length,
      claimable: this.tasks.filter(t => t.canClaim).length,
      totalReward: this.tasks.reduce((sum, t) => sum + (t.rewardClaimed ? t.reward.amount : 0), 0),
      potentialReward: this.tasks.reduce((sum, t) => sum + t.reward.amount, 0)
    };
    
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    stats.rewardClaimedRate = stats.total > 0 ? Math.round((stats.rewarded / stats.total) * 100) : 0;
    
    return stats;
  }

  setLoading(loading) {
    this.loading = loading;
  }

  setError(error) {
    this.error = error;
  }

  updateUserBalance(userData) {
    // 更新用户余额显示
    console.log('用户余额更新:', userData);
  }
}

// ========================================
// 错误处理和重试机制
// ========================================

/**
 * 带重试机制的API调用
 * @param {Function} apiCall - API调用函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试间隔（毫秒）
 */
async function apiCallWithRetry(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`API调用失败，尝试 ${attempt}/${maxRetries}:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// ========================================
// 缓存策略示例
// ========================================

/**
 * 任务数据缓存管理
 */
class TaskCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 生成缓存键
   */
  getCacheKey(operation, params = '') {
    return `task_${operation}_${params}`;
  }

  /**
   * 获取缓存数据
   */
  get(operation, params = '') {
    const key = this.getCacheKey(operation, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存数据
   */
  set(operation, data, params = '') {
    const key = this.getCacheKey(operation, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 带缓存的任务列表获取
   */
  async getTaskListCached() {
    const cached = this.get('list');
    if (cached) {
      console.log('📋 使用缓存的任务列表');
      return cached;
    }

    const data = await getTaskList();
    this.set('list', data);
    return data;
  }

  /**
   * 带缓存的任务进度获取
   */
  async getTaskProgressCached(filters = {}) {
    const cacheKey = JSON.stringify(filters);
    const cached = this.get('progress', cacheKey);
    if (cached) {
      console.log('📊 使用缓存的任务进度');
      return cached;
    }

    const data = await getTaskProgress(filters);
    this.set('progress', data, cacheKey);
    return data;
  }
}

// ========================================
// 导出示例使用
// ========================================

// 使用示例
async function exampleUsage() {
  try {
    // 1. 获取任务列表
    const taskList = await getTaskList();
    console.log('任务列表:', taskList);

    // 2. 获取特定状态的任务
    const completedTasks = await getTaskProgress({ status: 'completed' });
    console.log('已完成任务:', completedTasks);

    // 3. 领取注册任务奖励
    if (taskList.tasks.find(t => t.taskType === 'register' && t.canClaim)) {
      const claimResult = await claimTaskReward('register');
      console.log('注册奖励领取结果:', claimResult);
    }

    // 4. 检查所有任务状态
    const checkResult = await checkTaskCompletion('all');
    console.log('任务状态检查结果:', checkResult);

  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  exampleUsage().catch(console.error);
}

// 导出工具类和函数
module.exports = {
  // API函数
  getTaskList,
  claimTaskReward,
  getTaskProgress,
  checkTaskCompletion,
  completeNewUserTaskFlow,
  
  // 工具类
  TaskSystemComponent,
  TaskCache,
  
  // 工具函数
  apiCallWithRetry,
  handleApiResponse,
  handleApiError,
  
  // 示例
  exampleUsage
};