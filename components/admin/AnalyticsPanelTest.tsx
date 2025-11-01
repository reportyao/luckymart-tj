import { AnalyticsPanel } from '@/components/admin';

/**
 * AnalyticsPanel 组件测试
 * 验证组件是否可以正常导入和渲染
 */

export default function TestAnalyticsPanel() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <AnalyticsPanel />
    </div>
  );
}