#!/usr/bin/env python3
import os
import re
import glob

# 要修复的目录
directories = [
    'app/api',
    'components',
    'lib',
    'types',
    'hooks',
    'utils',
    'constants',
    'contexts',
    'config'
]

# 修复模式
patterns = [
    {
        'pattern': re.compile(r'(\(\s*\w+:\s*\w+)\s*:\s*any\s*\)'),
        'replacement': r'\1)',
        'description': '修复箭头函数参数类型注解错误'
    },
    {
        'pattern': re.compile(r'(\w+\s*:\s*\w+)\s*:\s*any(\)|,)'),
        'replacement': r'\1\2',
        'description': '修复函数参数类型注解错误'
    }
]

def has_syntax_errors(content):
    return ':' in content and ': any' in content

def fix_file_syntax(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if not has_syntax_errors(content):
            return False
        
        fixed_content = content
        changes = []
        
        for pattern_info in patterns:
            before = fixed_content
            fixed_content = pattern_info['pattern'].sub(pattern_info['replacement'], fixed_content)
            
            if fixed_content != before:
                changes.append(pattern_info['description'])
        
        if fixed_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ 修复文件: {file_path}")
            for change in changes:
                print(f"   - {change}")
            return True
        
        return False
    except Exception as e:
        print(f"❌ 修复文件失败 {file_path}: {e}")
        return False

def fix_directory(dir_path):
    if not os.path.exists(dir_path):
        return 0
    
    fixed_count = 0
    
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                if fix_file_syntax(file_path):
                    fixed_count += 1
    
    return fixed_count

def main():
    print("🔧 开始修复TypeScript语法错误...\n")
    
    total_fixed = 0
    
    for dir_name in directories:
        print(f"检查目录: {dir_name}")
        fixed_count = fix_directory(dir_name)
        if fixed_count > 0:
            total_fixed += fixed_count
            print(f"  修复了 {fixed_count} 个文件\n")
        else:
            print("  没有发现需要修复的文件\n")
    
    print(f"🎉 修复完成！总共修复了 {total_fixed} 个文件")

if __name__ == "__main__":
    main()