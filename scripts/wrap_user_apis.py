#!/usr/bin/env python3
"""
批量更新已有imports但未包装方法的API文件
"""

import re
from pathlib import Path

def wrap_get_method(content):
    """包装GET方法并移除旧的权限验证"""
    # 找到GET方法的开始
    pattern = r'(// GET - [^\n]+\nexport async function GET\(request: NextRequest\)) \{\n  const logger = getLogger\(\);\n\n  try \{\n    // 验证管理员权限\n    const admin = getAdminFromRequest\(request\);\n    if \(!admin\) \{[^}]+\}\n\n    // 检查[^}]+\}\n'
    
    replacement = r'\1 {\n  return withReadPermission(async (request, admin) => {\n    const logger = getLogger();\n\n    try {\n'
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # 找到GET方法的结束，添加闭包
    # 查找最后一个独立的 } catch 块
    pattern2 = r'(\n  \} catch \(error: any\) \{\n    logger\.error\([^)]+\);?\n    return NextResponse\.json\(\{[^}]+\}, \{ status: 500 \}\);\n  \}\n\})'
    
    replacement2 = r'\n    } catch (error: any) {\n      logger.error(\1);\n      return NextResponse.json({\2}, { status: 500 });\n    }\n  })(request);\n}'
    
    # 这个比较复杂，我需要更精确的模式
    
    return content

def process_file(filepath):
    """处理单个文件"""
    print(f"处理: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经包装
    if 'return withReadPermission(async (request, admin) => {' in content:
        print(f"  已处理，跳过")
        return False
    
    # 检查是否有getAdminFromRequest需要替换
    if 'const admin = getAdminFromRequest(request);' not in content:
        print(f"  无需处理")
        return False
    
    original = content
    
    # 方法1：替换GET方法开头
    content = re.sub(
        r'export async function GET\(request: NextRequest\) \{\n  const logger = getLogger\(\);\n\n  try \{\n    // 验证管理员权限\n    const admin = getAdminFromRequest\(request\);\n    if \(!admin\) \{\n      return NextResponse\.json\(\{[^}]+\}, \{ status: 403 \}\);\n    \}\n\n    // 检查是否有[^:]+权限\n    const hasPermission = admin\.permissions\.includes\([^)]+\) \|\| admin\.role === \'super_admin\';\n    if \(!hasPermission\) \{\n      return NextResponse\.json\(\{[^}]+\}, \{ status: 403 \}\);\n    \}',
        'export async function GET(request: NextRequest) {\n  return withReadPermission(async (request, admin) => {\n    const logger = getLogger();\n\n    try {',
        content,
        flags=re.DOTALL
    )
    
    # 方法2：替换GET方法结尾
    # 查找最后一个 } 在文件中的位置
    lines = content.split('\n')
    
    # 找到GET方法的结束（在下一个export前或文件末尾）
    get_method_end = -1
    in_get_method = False
    brace_count = 0
    
    for i, line in enumerate(lines):
        if 'export async function GET' in line:
            in_get_method = True
            brace_count = 0
        
        if in_get_method:
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0 and i > 0:
                get_method_end = i
                break
    
    if get_method_end > 0 and content != original:
        # 在GET方法结束前添加 })(request);
        # 找到结尾的 } 并替换
        # 简单策略：在catch块的最后一个}后面添加
        content = re.sub(
            r'(\n  \} catch \(error: any\) \{\n    logger\.error\([^\n]+\n    return NextResponse\.json\(\{[^}]+\}, \{ status: 500 \}\);\n  \}\n)\}(\n\n)',
            r'\1  })(request);\n}\2',
            content
        )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ 已更新")
        return True
    else:
        print(f"  无变化")
        return False

def main():
    # 需要处理的文件列表
    files = [
        '/workspace/luckymart-tj/app/api/admin/users/retention/route.ts',
        '/workspace/luckymart-tj/app/api/admin/users/engagement/route.ts',
        '/workspace/luckymart-tj/app/api/admin/users/behavior/route.ts',
        '/workspace/luckymart-tj/app/api/admin/users/segments/route.ts',
        '/workspace/luckymart-tj/app/api/admin/users/spending/route.ts',
    ]
    
    success_count = 0
    for filepath in files:
        if process_file(filepath):
            success_count += 1
    
    print(f"\n处理完成: {success_count}/{len(files)} 个文件已更新")

if __name__ == '__main__':
    main()
