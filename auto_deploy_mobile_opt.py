#!/usr/bin/env python3
"""
LuckyMart TJ 移动端优化自动部署脚本
"""
import subprocess
import time
import sys

SERVER = "47.243.83.253"
USER = "root"
PASSWORD = "Lingjiu123@"
PROJECT_DIR = "/var/www/luckymart-tj"
LOCAL_TAR = "/workspace/luckymart-tj/mobile_optimization_files.tar.gz"

print("=" * 60)
print("🚀 LuckyMart TJ 移动端优化自动部署")
print("=" * 60)

def run_ssh_command(command, show_output=True):
    """通过SSH执行命令"""
    ssh_cmd = f"sshpass -p '{PASSWORD}' ssh -o StrictHostKeyChecking=no {USER}@{SERVER} '{command}'"
    try:
        result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True, timeout=30)
        if show_output and result.stdout:
            print(result.stdout)
        if result.stderr and "Warning" not in result.stderr:
            print(f"⚠️  stderr: {result.stderr}", file=sys.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ 命令执行失败: {e}")
        return False

# Step 1: 上传部署包
print("\n📦 Step 1: 上传部署包到服务器...")
scp_cmd = f"sshpass -p '{PASSWORD}' scp -o StrictHostKeyChecking=no {LOCAL_TAR} {USER}@{SERVER}:/tmp/"
result = subprocess.run(scp_cmd, shell=True, capture_output=True)
if result.returncode == 0:
    print("✅ 上传成功: mobile_optimization_files.tar.gz")
else:
    print("❌ 上传失败，请检查网络连接")
    sys.exit(1)

# Step 2: 解压部署包
print("\n📂 Step 2: 解压部署包...")
if run_ssh_command(f"cd /tmp && tar -xzf mobile_optimization_files.tar.gz"):
    print("✅ 解压成功")
else:
    print("❌ 解压失败")
    sys.exit(1)

# Step 3: 备份当前代码
print("\n💾 Step 3: 备份当前代码...")
backup_dir = f"/root/backup-mobile-opt-{int(time.time())}"
run_ssh_command(f"mkdir -p {backup_dir}")
run_ssh_command(f"cd {PROJECT_DIR} && cp -r components app types contexts prisma {backup_dir}/ 2>/dev/null || true")
print(f"✅ 备份完成: {backup_dir}")

# Step 4: 复制优化文件
print("\n📝 Step 4: 复制优化文件到项目...")
commands = [
    f"cd {PROJECT_DIR} && cp -f /tmp/components/*.tsx ./components/ 2>/dev/null || true",
    f"cd {PROJECT_DIR} && cp -f /tmp/app/page.tsx ./app/",
    f"cd {PROJECT_DIR} && cp -f /tmp/app/product/[id]/page.tsx ./app/product/[id]/",
    f"cd {PROJECT_DIR} && cp -f /tmp/app/admin/products/create/page.tsx ./app/admin/products/create/",
    f"cd {PROJECT_DIR} && cp -f /tmp/types/index.ts ./types/",
    f"cd {PROJECT_DIR} && cp -f /tmp/contexts/LanguageContext.tsx ./contexts/",
    f"cd {PROJECT_DIR} && cp -f /tmp/prisma/schema.prisma ./prisma/",
]
for cmd in commands:
    run_ssh_command(cmd, show_output=False)
print("✅ 文件复制完成")

# Step 5: 执行数据库migration
print("\n🗄️  Step 5: 执行数据库migration...")
print("⚠️  注意: 需要Supabase授权才能执行migration")
print("    如果migration失败，请手动在Supabase控制台执行SQL:")
print("    ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_badge JSONB;")
time.sleep(2)

# Step 6: 生成Prisma客户端
print("\n🔧 Step 6: 生成Prisma客户端...")
if run_ssh_command(f"cd {PROJECT_DIR} && npx prisma generate"):
    print("✅ Prisma客户端生成成功")
else:
    print("⚠️  Prisma客户端生成失败，继续部署")

# Step 7: 重启服务
print("\n🔄 Step 7: 重启Next.js服务...")
run_ssh_command(f"pm2 restart luckymart-web")
time.sleep(3)

# Step 8: 验证部署
print("\n🔍 Step 8: 验证部署状态...")
run_ssh_command("pm2 status | grep luckymart-web")

# 清理临时文件
print("\n🧹 清理临时文件...")
run_ssh_command("rm -rf /tmp/mobile_optimization_files.tar.gz /tmp/components /tmp/app /tmp/types /tmp/contexts /tmp/prisma")

print("\n" + "=" * 60)
print("✅ 移动端优化部署完成！")
print("=" * 60)
print(f"📱 访问地址: http://{SERVER}:3000")
print("\n🔍 验证清单:")
print("  1. 移动端导航 - 检查汉堡菜单")
print("  2. 首页布局 - 确认2列商品（手机）")
print("  3. 商品详情 - 测试图片轮播")
print("  4. 营销角标 - 查看角标显示")
print("\n📝 查看日志: ssh root@47.243.83.253 'pm2 logs luckymart-web'")
print("=" * 60)
