#!/usr/bin/env python3
"""
SQL注入漏洞自动检测和修复脚本

检测所有使用 $queryRawUnsafe 的代码，并分类：
1. 安全用法（参数化查询）
2. 危险用法（字符串插值）
"""

import re
import os
from pathlib import Path
from typing import List, Tuple

# 工作目录
WORK_DIR = Path("/workspace/luckymart-tj")

def find_queryRawUnsafe_files() -> List[Path]:
    """查找所有使用$queryRawUnsafe的文件"""
    files = []
    for root, _, filenames in os.walk(WORK_DIR / "app"):
        for filename in filenames:
            if filename.endswith(('.ts', '.tsx')):
                filepath = Path(root) / filename
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if '$queryRawUnsafe' in content:
                            files.append(filepath)
                except Exception as e:
                    print(f"读取文件失败 {filepath}: {e}")
    return files

def analyze_file(filepath: Path) -> dict:
    """分析文件中的SQL注入风险"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.splitlines()
        
        result = {
            'path': str(filepath.relative_to(WORK_DIR)),
            'total_usages': 0,
            'safe_usages': [],  # 使用参数数组的安全用法
            'unsafe_usages': [],  # 使用字符串插值的危险用法
            'needs_manual_check': []  # 需要人工检查的复杂情况
        }
        
        # 查找所有$queryRawUnsafe的使用
        for i, line in enumerate(lines, 1):
            if '$queryRawUnsafe' in line:
                result['total_usages'] += 1
                
                # 检查后续几行，提取SQL查询
                sql_context = '\n'.join(lines[max(0, i-1):min(len(lines), i+20)])
                
                # 检测是否是安全的参数化用法
                # 形如: $queryRawUnsafe(query, ...params) 或 $queryRawUnsafe(query, param1, param2)
                if re.search(r'\$queryRawUnsafe\s*\(\s*[\'"`]?[\w\s]+[\'"`]?\s*,', sql_context):
                    result['safe_usages'].append({
                        'line': i,
                        'context': sql_context[:200]
                    })
                # 检测危险的字符串插值
                elif re.search(r'\$queryRawUnsafe\s*\(\s*[`]', sql_context):
                    # 检查模板字符串中是否有 ${...}
                    if re.search(r'\$\{[^}]+\}', sql_context):
                        result['unsafe_usages'].append({
                            'line': i,
                            'context': sql_context[:400]
                        })
                    else:
                        # 使用反引号但没有插值，安全
                        result['safe_usages'].append({
                            'line': i,
                            'context': sql_context[:200]
                        })
                else:
                    result['needs_manual_check'].append({
                        'line': i,
                        'context': sql_context[:200]
                    })
        
        return result
    
    except Exception as e:
        print(f"分析文件失败 {filepath}: {e}")
        return None

def generate_report(results: List[dict]):
    """生成检测报告"""
    report = []
    report.append("=" * 80)
    report.append("SQL注入漏洞自动检测报告")
    report.append("=" * 80)
    report.append("")
    
    total_files = len(results)
    total_usages = sum(r['total_usages'] for r in results)
    total_unsafe = sum(len(r['unsafe_usages']) for r in results)
    total_safe = sum(len(r['safe_usages']) for r in results)
    total_manual = sum(len(r['needs_manual_check']) for r in results)
    
    report.append(f"扫描文件总数: {total_files}")
    report.append(f"$queryRawUnsafe使用总数: {total_usages}")
    report.append(f"  - 安全用法: {total_safe}")
    report.append(f"  - 危险用法（需修复）: {total_unsafe}")
    report.append(f"  - 需人工检查: {total_manual}")
    report.append("")
    
    # 危险用法详情
    if total_unsafe > 0:
        report.append("=" * 80)
        report.append("⚠️  发现危险的SQL注入漏洞（需立即修复）")
        report.append("=" * 80)
        report.append("")
        
        for r in results:
            if r['unsafe_usages']:
                report.append(f"文件: {r['path']}")
                for usage in r['unsafe_usages']:
                    report.append(f"  行号: {usage['line']}")
                    report.append(f"  代码片段:")
                    for line in usage['context'].split('\n')[:10]:
                        report.append(f"    {line}")
                    report.append("")
    
    # 需人工检查的情况
    if total_manual > 0:
        report.append("=" * 80)
        report.append("🔍 需要人工检查的用法")
        report.append("=" * 80)
        report.append("")
        
        for r in results:
            if r['needs_manual_check']:
                report.append(f"文件: {r['path']}")
                for usage in r['needs_manual_check']:
                    report.append(f"  行号: {usage['line']}")
                    report.append(f"  代码片段:")
                    for line in usage['context'].split('\n')[:5]:
                        report.append(f"    {line}")
                    report.append("")
    
    return '\n'.join(report)

def main():
    print("开始扫描SQL注入漏洞...")
    
    # 查找所有使用$queryRawUnsafe的文件
    files = find_queryRawUnsafe_files()
    print(f"找到 {len(files)} 个使用$queryRawUnsafe的文件")
    
    # 分析每个文件
    results = []
    for filepath in files:
        print(f"分析: {filepath.relative_to(WORK_DIR)}")
        result = analyze_file(filepath)
        if result:
            results.append(result)
    
    # 生成报告
    report = generate_report(results)
    
    # 保存报告
    report_path = WORK_DIR / "docs" / "SQL_INJECTION_SCAN_REPORT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n报告已保存到: {report_path}")
    print("\n" + "=" * 80)
    print(report)

if __name__ == "__main__":
    main()
