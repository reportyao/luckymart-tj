#!/usr/bin/env python3
"""
批量更新管理员API权限中间件
将所有使用getAdminFromRequest的API统一使用AdminPermissionManager
"""

import os
import re
from pathlib import Path

# API文件路径及其对应的权限配置
API_PERMISSION_CONFIG = {
    # Batch 2: 财务相关 (stats:read)
    'app/api/admin/financial/costs/route.ts': {'read': 'stats', 'write': 'stats'},
    'app/api/admin/financial/reports/route.ts': {'read': 'stats', 'write': 'stats'},
    'app/api/admin/financial/withdrawals/route.ts': {'read': 'stats', 'write': 'stats'},
    'app/api/admin/financial/profits/route.ts': {'read': 'stats', 'write': 'stats'},
    'app/api/admin/financial/revenue/route.ts': {'read': 'stats', 'write': 'stats'},
    
    # Batch 3: 成本监控 (stats:read)
    'app/api/admin/costs/breakdown/route.ts': {'read': 'stats'},
    'app/api/admin/costs/trends/route.ts': {'read': 'stats'},
    'app/api/admin/costs/roi/route.ts': {'read': 'stats'},
    'app/api/admin/costs/daily/route.ts': {'read': 'stats'},
    
    # Batch 4: 用户管理 (users:read/users:write)
    'app/api/admin/users/route.ts': {'read': 'users', 'write': 'users'},
    'app/api/admin/users/[id]/route.ts': {'read': 'users', 'write': 'users'},
    'app/api/admin/users/segments/route.ts': {'read': 'users'},
    'app/api/admin/users/spending/route.ts': {'read': 'users'},
    'app/api/admin/users/retention/route.ts': {'read': 'users'},
    'app/api/admin/users/engagement/route.ts': {'read': 'users'},
    'app/api/admin/users/behavior/route.ts': {'read': 'users'},
    
    # Batch 5: 产品和订单
    'app/api/admin/products/route.ts': {'read': 'products', 'write': 'products'},
    'app/api/admin/products/[id]/route.ts': {'read': 'products', 'write': 'products'},
    'app/api/admin/products/trending/route.ts': {'read': 'products'},
    'app/api/admin/products/profit/route.ts': {'read': 'products'},
    'app/api/admin/products/conversion/route.ts': {'read': 'products'},
    'app/api/admin/products/performance/route.ts': {'read': 'products'},
    'app/api/admin/orders/route.ts': {'read': 'orders', 'write': 'orders'},
    
    # Batch 6: 抽奖管理
    'app/api/admin/lottery/draw/route.ts': {'read': 'lottery', 'write': 'lottery'},
    'app/api/admin/lottery/rounds/route.ts': {'read': 'lottery', 'write': 'lottery'},
    'app/api/admin/lottery/data-fix/route.ts': {'write': 'lottery'},
    
    # Batch 7: 提现管理
    'app/api/admin/withdrawals/route.ts': {'read': 'withdrawals', 'write': 'withdrawals'},
    
    # Batch 8: 晒单管理
    'app/api/admin/show-off/posts/route.ts': {'read': 'users', 'write': 'users'},
    
    # Batch 9: 风险控制
    'app/api/admin/risk-stats/route.ts': {'read': 'system'},
    'app/api/admin/risk-rules/route.ts': {'read': 'system', 'write': 'system'},
    'app/api/admin/risk-users/route.ts': {'read': 'system', 'write': 'system'},
    'app/api/admin/risk-events/route.ts': {'read': 'system', 'write': 'system'},
    
    # Batch 10: 其他
    'app/api/admin/stats/route.ts': {'read': 'stats'},
    'app/api/admin/rate-limit/route.ts': {'read': 'system', 'write': 'system'},
}

def get_import_section(permissions):
    """生成import语句"""
    imports = [
        "import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';",
        "import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';"
    ]
    return '\n'.join(imports)

def get_middleware_declarations(permissions):
    """生成权限中间件声明"""
    declarations = []
    
    if 'read' in permissions:
        declarations.append(f"""
const withReadPermission = AdminPermissionManager.createPermissionMiddleware({{
  customPermissions: AdminPermissions.{permissions['read']}.read()
}});""")
    
    if 'write' in permissions:
        declarations.append(f"""
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({{
  customPermissions: AdminPermissions.{permissions['write']}.write()
}});""")
    
    return '\n'.join(declarations)

def process_api_file(file_path, permissions, base_dir):
    """处理单个API文件"""
    full_path = os.path.join(base_dir, file_path)
    
    if not os.path.exists(full_path):
        print(f"⚠️  文件不存在: {file_path}")
        return False
    
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否已经有AdminPermissionManager
        if 'AdminPermissionManager' in content:
            print(f"✓  已处理: {file_path}")
            return True
        
        # 检查是否使用getAdminFromRequest或没有权限验证
        if 'getAdminFromRequest' not in content and '@supabase/supabase-js' not in content:
            print(f"⊘  无需处理: {file_path}")
            return True
        
        # 添加imports
        import_section = get_import_section(permissions)
        
        # 查找第一个import语句后插入
        import_pattern = r'(import .+?;\n)'
        last_import_match = None
        for match in re.finditer(import_pattern, content):
            last_import_match = match
        
        if last_import_match:
            insert_pos = last_import_match.end()
            content = content[:insert_pos] + '\n' + import_section + '\n' + content[insert_pos:]
        
        # 添加中间件声明
        middleware_declarations = get_middleware_declarations(permissions)
        
        # 在第一个export function之前插入
        export_pattern = r'(//[^\n]*\nexport async function (GET|POST|PUT|DELETE|PATCH))'
        match = re.search(export_pattern, content)
        if match:
            insert_pos = match.start()
            content = content[:insert_pos] + middleware_declarations + '\n\n' + content[insert_pos:]
        
        # 保存文件
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓  已更新imports和middleware: {file_path}")
        return True
        
    except Exception as e:
        print(f"✗  处理失败: {file_path} - {str(e)}")
        return False

def main():
    base_dir = '/workspace/luckymart-tj'
    
    print("=" * 60)
    print("开始批量更新API权限中间件")
    print("=" * 60)
    print()
    
    success_count = 0
    fail_count = 0
    skip_count = 0
    
    for file_path, permissions in API_PERMISSION_CONFIG.items():
        result = process_api_file(file_path, permissions, base_dir)
        if result:
            success_count += 1
        else:
            fail_count += 1
    
    print()
    print("=" * 60)
    print(f"处理完成:")
    print(f"  成功: {success_count} 个")
    print(f"  失败: {fail_count} 个")
    print("=" * 60)
    print()
    print("⚠️  注意: 此脚本只添加了imports和middleware声明")
    print("   仍需手动修改每个HTTP方法函数以使用权限中间件")
    print("=" * 60)

if __name__ == '__main__':
    main()
