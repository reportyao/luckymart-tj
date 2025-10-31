// 风控面板组件库
// 提供完整的风控管理功能组件

// 图表组件
export { 
  SimpleBarChart, 
  SimplePieChart, 
  ProgressBar, 
  StatCard, 
  RiskLevelBadge, 
  StatusBadge 
} from './RiskCharts';

// 表格组件
export { 
  RiskEventTable, 
  RiskUserCard 
} from './RiskTables';

// 表单组件
export { 
  RiskRuleForm, 
  RiskRuleItem 
} from './RiskRuleForm';

// 类型定义
export interface RiskEvent {
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

export interface RiskUser {
  id: string;
  userName: string;
  email: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  accountStatus: 'active' | 'frozen' | 'limited' | 'banned';
  registrationDate: string;
  lastLoginDate: string;
  riskHistory: Array<{
    date: string;
    event: string;
    score: number;
  }>;
  totalEvents: number;
  recentActivity: string;
}

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  category: string;
  riskType: string;
  condition: string;
  threshold: number;
  action: string;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
  executionCount: number;
  successRate: number;
}

export interface RiskDashboardData {
  todayRiskEvents: number;
  riskEventsTrend: number[];
  riskLevelDistribution: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  rulesExecuted: number;
  autoProcessingSuccess: number;
  totalRules: number;
  activeRules: number;
}