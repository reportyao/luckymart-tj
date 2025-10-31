# LuckyMart TJ 测试环境配置指南

## 📋 概述

本指南将帮助您配置LuckyMart TJ项目的测试环境，确保测试套件能够正常运行并生成准确的覆盖率报告。

## 🚀 快速开始

### 1. 克隆项目并安装依赖

```bash
# 克隆项目
git clone [项目仓库地址]
cd luckymart-tj

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 测试环境基础配置
NODE_ENV=test

# 数据库配置 - 请根据实际环境修改
DATABASE_URL="postgresql://postgres:[密码]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 认证相关 - 测试环境使用固定密钥
JWT_SECRET="test-jwt-secret-for-testing-only"

# Telegram Bot配置 - 测试环境使用
TELEGRAM_BOT_TOKEN="test-bot-token-for-testing"

# 测试特定配置
TEST_DB_CLEANUP=true
COVERAGE_THRESHOLD=90
TEST_TIMEOUT=30000
```

## 🗄️ 数据库配置选项

### 选项A: 使用Supabase测试项目

#### 1. 创建独立的测试项目

1. 登录 [Supabase控制台](https://app.supabase.com)
2. 点击"New Project"创建新项目
3. 选择合适的区域和数据库设置
4. 等待项目初始化完成

#### 2. 获取连接信息

在项目设置 > Database 页面获取：
- Database URL
- 连接字符串格式：
  ```
  postgresql://postgres:[密码]@[主机]:[端口]/[数据库名]
  ```

#### 3. 配置环境变量

```bash
# 将获取的URL添加到.env.local
DATABASE_URL="postgresql://postgres:your_password@your_host:5432/postgres"
```

#### 4. 应用数据库迁移

```bash
# 确保数据库结构是最新的
npm run prisma:migrate

# 或者强制应用架构变更
npm run prisma:push
```

### 选项B: 使用本地PostgreSQL

#### 1. 安装PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
下载并安装 [PostgreSQL官方安装包](https://www.postgresql.org/download/windows/)

#### 2. 创建测试数据库

```bash
# 登录PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE luckymart_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE luckymart_test TO test_user;
\q
```

#### 3. 配置环境变量

```bash
# 本地数据库配置
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/luckymart_test"
```

#### 4. 初始化数据库

```bash
# 应用数据库架构
npm run prisma:generate
npm run prisma:migrate

# 初始化测试数据
psql "$DATABASE_URL" -f test/init-test-data.sql
```

## 🧪 初始化测试数据

### 自动初始化

使用自动化脚本：

```bash
# 运行环境检查和初始化
./scripts/run-tests.sh --env-check

# 或者手动执行
./scripts/run-tests.sh
```

### 手动初始化

如果需要手动控制：

```bash
# 1. 确保数据库连接正常
npm run prisma:generate

# 2. 应用数据库迁移
npm run prisma:migrate

# 3. 插入测试数据
psql "$DATABASE_URL" -f test/init-test-data.sql

# 4. 验证测试数据
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users WHERE id LIKE 'test-%';"
```

## 🧪 运行测试

### 使用自动化脚本（推荐）

```bash
# 给脚本执行权限
chmod +x scripts/run-tests.sh

# 运行完整测试套件
./scripts/run-tests.sh

# 只运行特定测试类型
./scripts/run-tests.sh --unit          # 单元测试
./scripts/run-tests.sh --integration   # 集成测试
./scripts/run-tests.sh --performance   # 性能测试

# 查看帮助
./scripts/run-tests.sh --help
```

### 直接使用Jest

```bash
# 运行所有测试
npm test

# 运行带覆盖率的测试
npm run test:coverage

# 运行特定测试文件
npm test __tests__/referral-system-integration.test.ts

# 监视模式运行测试
npm run test:watch

# 运行特定类型的测试
npm run test:unit          # 单元测试
npm run test:auth          # 认证测试
npm run test:lottery       # 抽奖测试
npm run test:business      # 业务测试
npm run test:security      # 安全测试
```

## 📊 查看测试结果

### 覆盖率报告

测试完成后，查看生成的覆盖率报告：

```bash
# HTML报告（推荐）
open test-results/coverage/index.html

# 或者在浏览器中打开
firefox test-results/coverage/index.html

# LCOV报告（命令行）
cat test-results/coverage/lcov.info

# JSON报告（程序化处理）
cat test-results/coverage/coverage-final.json
```

### 测试日志

```bash
# 查看最新的测试执行日志
ls -la test-results/test-execution-*.log
tail -f test-results/test-execution-$(date +%Y%m%d)*.log
```

### 测试报告

```bash
# 查看测试总结报告
ls -la test-results/test-summary-*.md
cat test-results/test-summary-$(date +%Y%m%d)*.md
```

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接失败

**错误信息:**
```
PrismaClientInitializationError: Error querying the database: 
FATAL: Tenant or user not found
```

**解决方案:**
```bash
# 检查环境变量
echo $DATABASE_URL

# 测试数据库连接
npx prisma db pull

# 验证数据库URL格式
# 正确的格式：
# postgresql://username:password@host:port/database
```

#### 2. 依赖缺失

**错误信息:**
```
Cannot find module 'xxx'
```

**解决方案:**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 生成Prisma客户端
npm run prisma:generate
```

#### 3. 测试超时

**错误信息:**
```
Timeout - Async callback was not invoked within the 30000 ms timeout
```

**解决方案:**
调整Jest配置中的超时时间或优化测试代码。

在`jest.config.js`中增加：
```javascript
testTimeout: 60000, // 增加到60秒
```

#### 4. 覆盖率收集失败

**错误信息:**
```
Failed to collect coverage from xxx.ts
```

**解决方案:**
检查源文件是否有语法错误，修复后重新运行测试。

```bash
# 验证TypeScript语法
npm run check-types

# 检查特定文件
npx tsc --noEmit --strict file.ts
```

#### 5. 测试数据冲突

**错误信息:**
```
Unique constraint failed on the fields: (`id`)
```

**解决方案:**
清理测试数据并重新初始化：

```bash
# 使用清理函数
psql "$DATABASE_URL" -c "SELECT cleanup_test_data();"

# 重新插入测试数据
psql "$DATABASE_URL" -f test/init-test-data.sql
```

### 性能优化

#### 1. 加速测试执行

```bash
# 使用并行测试
npm test -- --maxWorkers=4

# 跳过覆盖率收集
npm test -- --coverage=false

# 只运行失败的测试
npm test -- --bail
```

#### 2. 优化数据库性能

```bash
# 创建测试索引（已在init-test-data.sql中包含）
# 确保测试数据库配置了足够的连接池大小

# 清理测试数据
psql "$DATABASE_URL" -c "SELECT cleanup_test_data();"
```

## 📈 持续集成

### GitHub Actions配置

在 `.github/workflows/test.yml` 中添加：

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run prisma:generate
    - run: npm run prisma:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    - run: ./scripts/run-tests.sh
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./test-results/coverage/lcov.info
```

### 预提交钩子

在 `package.json` 中添加：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "./scripts/run-tests.sh --unit"
    }
  }
}
```

## 📚 最佳实践

### 1. 测试数据管理

- 使用唯一前缀标识测试数据（如 `test-`）
- 及时清理测试数据
- 使用事务确保测试隔离

### 2. 测试编写原则

- 每个测试应该独立运行
- 使用描述性的测试名称
- 包含正向和负向测试用例
- 适当使用模拟和存根

### 3. 覆盖率目标

- 保持90%以上的代码覆盖率
- 特别关注业务逻辑和边界条件
- 定期审查覆盖率报告

### 4. 性能考虑

- 使用数据库连接池
- 适当使用测试数据库
- 避免在测试中执行不必要的操作

## 📞 获取帮助

如果遇到问题，请：

1. 查看测试日志文件
2. 检查环境变量配置
3. 验证数据库连接
4. 参考本故障排除部分

---

**最后更新**: 2025-10-31  
**版本**: v1.0