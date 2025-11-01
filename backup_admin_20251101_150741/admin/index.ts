/**
 * 管理员模块统一导出
 * 解决PagePermission和AdminPermissions导入问题
 */

// 导出权限管理器和权限定义
export { 
  AdminPermissionManager,
  AdminPermissions,
  type AdminUser,
  type PermissionCheckOptions
} from '@/lib/admin-permission-manager';

// 导出PagePermission组件
export { 
  PagePermission,
  default as PagePermissionDefault 
} from '@/components/admin/PagePermission';

// 便捷的类型导出
export type { PagePermissionProps } from '@/components/admin/PagePermission';
