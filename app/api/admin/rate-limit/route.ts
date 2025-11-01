import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { rateLimitConfigManager, initializeRateLimitConfigs } from '@/lib/rate-limit-config';
import { rateLimitMonitor, DEFAULT_ALERT_RULES } from '@/lib/rate-limit-monitor';
import { getRateLimitStats, resetRateLimitStats, cleanupRateLimits } from '@/lib/rate-limit-middleware';
import { getSystemConfiguration, getRateLimitSystemStatus, restartRateLimitSystem } from '@/lib/rate-limit-system';
import { getLogger } from '@/lib/logger';
import { createTranslation } from '@/lib/createTranslation';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.SETTINGS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.SETTINGS_WRITE);

// 获取系统概览
export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const logger = getLogger();

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview':
        return handleSystemOverview();
      
      case 'config':
        return handleConfigList(request);
      
      case 'stats':
        return handleStats();
      
      case 'alerts':
        return handleAlerts();
      
      case 'monitoring':
        return handleMonitoring();
      
      case 'health':
        return handleHealthCheck();
      
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  })(request);
}

// 系统概览
async function handleSystemOverview() {
  const logger = getLogger();
  
  try {
    const systemConfig = getSystemConfiguration();
    const systemStatus = getRateLimitSystemStatus();
    const monitoringStatus = rateLimitMonitor.getMonitoringStatus();
    const componentAvailability = {
      redis: systemConfig.redis.connected,
      config: systemStatus.components.config,
      monitor: systemStatus.components.monitor,
      cleanup: systemStatus.components.cleanup
    };

    return NextResponse.json({
      success: true,
      data: {
        system: {
          ...systemConfig,
          uptime: Date.now() - systemStatus.initializedAt.getTime(),
          status: systemStatus.isInitialized ? 'healthy' : 'degraded'
        },
        components: componentAvailability,
        monitoring: monitoringStatus,
        cache: rateLimitConfigManager.getCacheStats()
      }
    });

  } catch (error) {
    logger.error('获取系统概览失败', error as Error);
    return NextResponse.json({ error: '获取系统概览失败' }, { status: 500 });
  }
}

// 配置列表
async function handleConfigList(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const url = new URL(request.url);
    const environment = url.searchParams.get('environment') || 'production';
    
    const configs = await rateLimitConfigManager.getAllConfigs(environment);
    
    return NextResponse.json({
      success: true,
      data: {
        configs,
        environment,
        total: configs.length
      }
    });

  } catch (error) {
    logger.error('获取配置列表失败', error as Error);
    return NextResponse.json({ error: '获取配置列表失败' }, { status: 500 });
  }
}

// 统计信息
async function handleStats() {
  const logger = getLogger();
  
  try {
    const rateLimitStats = getRateLimitStats();
    const monitoringStatus = rateLimitMonitor.getMonitoringStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        rateLimits: rateLimitStats,
        monitoring: monitoringStatus
      }
    });

  } catch (error) {
    logger.error('获取统计信息失败', error as Error);
    return NextResponse.json({ error: '获取统计信息失败' }, { status: 500 });
  }
}

// 告警信息
async function handleAlerts() {
  const logger = getLogger();
  
  try {
    const alertEvents = rateLimitMonitor.getAlertEvents(50);
    const activeAlerts = alertEvents.filter((alert : any) => alert.status === 'active');
    
    return NextResponse.json({
      success: true,
      data: {
        alerts: alertEvents,
        activeCount: activeAlerts.length,
        totalCount: alertEvents.length
      }
    });

  } catch (error) {
    logger.error('获取告警信息失败', error as Error);
    return NextResponse.json({ error: '获取告警信息失败' }, { status: 500 });
  }
}

// 监控状态
async function handleMonitoring() {
  const logger = getLogger();
  
  try {
    const status = rateLimitMonitor.getMonitoringStatus();
    const recentAlerts = rateLimitMonitor.getAlertEvents(10);
    
    return NextResponse.json({
      success: true,
      data: {
        status,
        recentAlerts,
        isCollecting: status.isActive
      }
    });

  } catch (error) {
    logger.error('获取监控状态失败', error as Error);
    return NextResponse.json({ error: '获取监控状态失败' }, { status: 500 });
  }
}

// 健康检查
async function handleHealthCheck() {
  const logger = getLogger();
  
  try {
    const status = getRateLimitSystemStatus();
    const componentAvailability = {
      redis: status.components.redis,
      config: status.components.config,
      monitor: status.components.monitor,
      cleanup: status.components.cleanup
    };
    
    const healthyComponents = Object.values(componentAvailability).filter(Boolean).length;
    const totalComponents = Object.keys(componentAvailability).length;
    const healthScore = (healthyComponents / totalComponents) * 100;
    
    const isHealthy = healthScore >= 75; // 至少75%的组件正常
    
    return NextResponse.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        healthScore,
        components: componentAvailability,
        issues: status.errors,
        uptime: Date.now() - status.initializedAt.getTime()
      }
    });

  } catch (error) {
    logger.error('健康检查失败', error as Error);
    return NextResponse.json({ 
      status: 'error',
      error: '健康检查失败'
    }, { status: 500 });
  }
}

// 更新配置
export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const logger = getLogger();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_config':
        return handleUpdateConfig(body);
      
      case 'toggle_config':
        return handleToggleConfig(body);
      
      case 'delete_config':
        return handleDeleteConfig(body);
      
      case 'reset_stats':
        return handleResetStats();
      
      case 'cleanup':
        return handleCleanup();
      
      case 'restart':
        return handleRestart();
      
      case 'acknowledge_alert':
        return handleAcknowledgeAlert(body);
      
      case 'add_alert_rule':
        return handleAddAlertRule(body);
      
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  })(request);
}

// 更新配置
async function handleUpdateConfig(data: any) {
  const { endpointPattern, config, environment = 'production' } = data;
  
  if (!endpointPattern || !config) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  const success = await rateLimitConfigManager.updateConfig(endpointPattern, config, environment);
  
  if (success) {
    return NextResponse.json({
      success: true,
      message: '配置更新成功'
    });
  } else {
    return NextResponse.json({ error: '配置更新失败' }, { status: 500 });
  }
}

// 切换配置状态
async function handleToggleConfig(data: any) {
  const { endpointPattern, isActive, environment = 'production' } = data;
  
  if (!endpointPattern || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  const success = await rateLimitConfigManager.toggleConfig(endpointPattern, isActive, environment);
  
  if (success) {
    return NextResponse.json({
      success: true,
      message: `配置已${isActive ? '启用' : '禁用'}`
    });
  } else {
    // 使用国际化错误消息
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// 删除配置
async function handleDeleteConfig(data: any) {
  const { endpointPattern, environment = 'production' } = data;
  
  if (!endpointPattern) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  const success = await rateLimitConfigManager.deleteConfig(endpointPattern, environment);
  
  if (success) {
    return NextResponse.json({
      success: true,
      message: '配置删除成功'
    });
  } else {
    return NextResponse.json({ error: '配置删除失败' }, { status: 500 });
  }
}

// 重置统计
async function handleResetStats() {
  resetRateLimitStats();
  
  return NextResponse.json({
    success: true,
    message: '统计信息已重置'
  });
}

// 清理数据
async function handleCleanup() {
  await cleanupRateLimits();
  
  return NextResponse.json({
    success: true,
    message: '清理完成'
  });
}

// 重启系统
async function handleRestart() {
  const status = await restartRateLimitSystem();
  
  return NextResponse.json({
    success: status.isInitialized,
    message: status.isInitialized ? '系统重启成功' : '系统重启失败',
    status
  });
}

// 确认告警
async function handleAcknowledgeAlert(data: any) {
  const { alertId, acknowledgedBy } = data;
  
  if (!alertId || !acknowledgedBy) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  rateLimitMonitor.acknowledgeAlert(alertId, acknowledgedBy);
  
  return NextResponse.json({
    success: true,
    message: '告警已确认'
  });
}

// 添加告警规则
async function handleAddAlertRule(data: any) {
  const { rule } = data;
  
  if (!rule) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  rateLimitMonitor.addAlertRule(rule);
  
  return NextResponse.json({
    success: true,
    message: '告警规则添加成功'
  });
}