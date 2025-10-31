# LuckyMart TJ UAT测试部署计划

## 概述
完成LuckyMart TJ项目的用户验收测试（User Acceptance Testing），验证所有核心功能在类生产环境中的表现。

## 测试目标

### 1. 功能验收
- 验证所有10大核心模块功能正常
- 确认关键业务流程完整
- 检查用户体验流畅度

### 2. 性能验证
- 页面加载速度 < 3秒
- API响应时间 < 500ms
- 数据库查询优化验证

### 3. 安全验证
- 权限控制正常工作
- 数据加密传输
- SQL注入防护

## 部署环境

### 选项1: Vercel部署（推荐）

#### 优势
- 自动HTTPS
- 全球CDN加速
- 零配置部署
- 免费层级支持

#### 部署步骤
```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署项目
cd /workspace/luckymart-tj
vercel

# 4. 配置环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_APP_URL

# 5. 生产部署
vercel --prod
```

### 选项2: 自托管VPS部署

#### 服务器要求
- **CPU**: 2核心+
- **内存**: 4GB+
- **系统**: Ubuntu 20.04+
- **Node.js**: 18.x+

#### 部署步骤
```bash
# 1. 安装依赖
sudo apt update
sudo apt install nodejs npm nginx

# 2. 安装PM2
npm install -g pm2

# 3. 克隆代码
git clone <repository-url> /var/www/luckymart-tj
cd /var/www/luckymart-tj

# 4. 安装项目依赖
npm install --legacy-peer-deps

# 5. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际配置

# 6. 构建应用
npm run build

# 7. 启动应用
pm2 start npm --name "luckymart-tj" -- start
pm2 save
pm2 startup

# 8. 配置Nginx反向代理
sudo nano /etc/nginx/sites-available/luckymart-tj
# （参考DEPLOYMENT_GUIDE.md中的Nginx配置）

# 9. 启用站点并重启Nginx
sudo ln -s /etc/nginx/sites-available/luckymart-tj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## UAT测试清单

### 模块1: 用户增长中心测试

#### 测试地址
`https://your-domain.com/admin/growth-center`

#### 测试用例

**TC-001: 新手任务管理**
- [ ] 访问新手任务列表
- [ ] 查看任务完成率
- [ ] 配置任务奖励
- [ ] 验证数据实时更新

**TC-002: 邀请裂变系统**
- [ ] 查看邀请统计数据
- [ ] 生成邀请码
- [ ] 验证奖励发放记录
- [ ] 测试裂变层级显示

**TC-003: 签到系统**
- [ ] 查看签到统计
- [ ] 验证连续签到计数
- [ ] 测试奖励配置
- [ ] 检查签到日历显示

**TC-004: 用户分层分析**
- [ ] 查看用户分层数据
- [ ] 测试筛选功能
- [ ] 导出用户列表
- [ ] 验证数据准确性

### 模块2: 晒单系统管理测试

#### 测试地址
`https://your-domain.com/admin/show-off`

#### 测试用例

**TC-101: 晒单审核管理**
- [ ] 访问晒单审核页面
- [ ] 查看待审核晒单列表
- [ ] 单个审核（通过/拒绝）
- [ ] 批量审核功能
- [ ] 状态筛选功能
- [ ] 审核记录查看

**TC-102: 热度管理**
- [ ] 访问热度管理Tab
- [ ] 查看热度排行榜
- [ ] 时间范围筛选（7天/30天/全部）
- [ ] 查看热度算法配置
- [ ] 测试重新计算热度功能
- [ ] 验证热度分数更新

**TC-103: 数据统计**
- [ ] 访问数据统计Tab
- [ ] 查看核心指标（总数/点赞/评论/互动率）
- [ ] 查看热门Top10列表
- [ ] 验证通过率统计
- [ ] 检查增长率分析
- [ ] 数据实时性验证

**TC-104: 内容质量检测**
- [ ] 访问内容质量Tab
- [ ] 查看质量分布统计
- [ ] 查看质量评分详情
- [ ] 测试问题标签显示
- [ ] 测试质量筛选功能
- [ ] 验证低质量内容标记

**TC-105: 推荐管理**
- [ ] 访问推荐管理Tab
- [ ] 查看推荐位列表（首页/详情页/个人页）
- [ ] 查看推荐优先级
- [ ] 测试启用/禁用开关
- [ ] 查看推荐内容预览
- [ ] 测试推荐排序

### 模块3: 商业变现管理测试

#### 测试地址
`https://your-domain.com/admin/commerce`

#### 测试用例

**TC-201: 商品管理**
- [ ] 访问商品列表
- [ ] 多语言内容显示
- [ ] 商品分类筛选
- [ ] 库存监控查看
- [ ] 价格策略配置

**TC-202: 库存监控**
- [ ] 实时库存显示
- [ ] 低库存告警
- [ ] 库存历史记录
- [ ] 补货建议

### 模块4: 数据分析中心测试

#### 测试地址
`https://your-domain.com/admin/analytics`

#### 测试用例

**TC-301: 实时数据看板**
- [ ] 访问实时数据页面
- [ ] DAU显示
- [ ] 订单统计
- [ ] 中奖数据
- [ ] 收入统计
- [ ] 数据自动刷新

**TC-302: 用户行为分析**
- [ ] 用户路径分析
- [ ] 转化漏斗显示
- [ ] 留存分析
- [ ] 行为热图

**TC-303: 财务分析**
- [ ] 收入成本统计
- [ ] 利润趋势图表
- [ ] GMV/ARPU计算
- [ ] 现金流分析

### 模块5: 权限组织管理测试

#### 测试地址
`https://your-domain.com/admin/organization`

#### 测试用例

**TC-401: 组织架构**
- [ ] 部门列表显示
- [ ] 创建新部门
- [ ] 编辑部门信息
- [ ] 删除部门
- [ ] 层级结构显示

**TC-402: 角色管理**
- [ ] 角色列表查看
- [ ] 创建新角色
- [ ] 权限分配
- [ ] 权限模板应用

**TC-403: 管理员账户**
- [ ] 管理员列表
- [ ] 账户状态管理
- [ ] 权限分配
- [ ] 操作日志查看

### 模块6: Telegram Bot管理测试

#### 测试地址
`https://your-domain.com/admin/telegram-bot`

#### 测试用例

**TC-501: 消息推送**
- [ ] 推送配置查看
- [ ] 创建推送消息
- [ ] 多语言模板选择
- [ ] 定时推送设置

**TC-502: Bot状态监控**
- [ ] 在线状态显示
- [ ] 心跳监控数据
- [ ] 错误日志查看
- [ ] 告警设置

**TC-503: 推送历史**
- [ ] 推送记录列表
- [ ] 状态统计
- [ ] 失败重试
- [ ] 详情查看

## 性能测试

### 页面加载性能

#### 测试指标
| 页面 | 目标时间 | 测试工具 |
|------|---------|---------|
| 首页 | < 2秒 | Lighthouse |
| 管理后台首页 | < 2.5秒 | Lighthouse |
| 晒单管理页面 | < 3秒 | Lighthouse |
| 数据分析页面 | < 3秒 | Lighthouse |

#### 测试方法
```bash
# 使用Lighthouse CLI
npm install -g lighthouse

# 测试页面性能
lighthouse https://your-domain.com --view
lighthouse https://your-domain.com/admin/show-off --view
lighthouse https://your-domain.com/admin/analytics --view
```

### API性能测试

#### 测试工具：Apache Bench

```bash
# 安装Apache Bench
sudo apt install apache2-utils

# 测试API性能（100请求，10并发）
ab -n 100 -c 10 https://your-domain.com/api/admin/show-off/posts

# 测试热度管理API
ab -n 100 -c 10 https://your-domain.com/api/admin/show-off/hotness

# 测试推荐管理API
ab -n 100 -c 10 https://your-domain.com/api/admin/show-off/recommendations
```

#### 性能目标
- P50响应时间 < 300ms
- P95响应时间 < 500ms
- P99响应时间 < 1000ms
- 错误率 < 0.1%

## 安全测试

### 权限测试

**测试场景**:
1. 未登录用户访问管理后台 → 应重定向到登录页
2. 普通用户访问管理后台 → 应显示权限不足
3. 无权限管理员访问特定功能 → 应显示权限不足
4. 有权限管理员访问功能 → 正常显示

### SQL注入测试

**测试用例**:
```bash
# 测试用户搜索接口
curl -X GET "https://your-domain.com/api/admin/users?search=' OR '1'='1"

# 测试应该返回错误或空结果，不应返回所有用户
```

### XSS测试

**测试用例**:
在晒单内容中输入:
```
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
```

应该被转义显示，不应执行脚本

## 兼容性测试

### 浏览器兼容性

测试浏览器:
- [ ] Chrome (最新版本)
- [ ] Firefox (最新版本)
- [ ] Safari (最新版本)
- [ ] Edge (最新版本)

### 移动端兼容性

测试设备:
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)

### 响应式设计测试

测试分辨率:
- [ ] 桌面: 1920x1080
- [ ] 笔记本: 1366x768
- [ ] 平板: 768x1024
- [ ] 手机: 375x667

## 测试数据准备

### 初始化测试数据

```sql
-- 创建测试管理员账户
INSERT INTO "adminPermissions" ("userId", role, permissions, "isActive")
VALUES ('test-admin-id', 'admin', '["USERS_READ", "USERS_WRITE", "STATS_READ"]', true);

-- 创建测试晒单数据
INSERT INTO "showOffPosts" ("userId", content, images, "productId", status, "hotnessScore")
VALUES 
  ('user-1', '测试晒单1', '["image1.jpg"]', 'product-1', 'approved', 85.5),
  ('user-2', '测试晒单2', '["image2.jpg"]', 'product-2', 'pending', 0),
  ('user-3', '测试晒单3', '["image3.jpg"]', 'product-3', 'rejected', 0);

-- 创建测试推荐数据
INSERT INTO "showOffRecommendations" ("postId", position, priority, "isActive")
VALUES 
  ('post-1', 'homepage', 100, true),
  ('post-2', 'detail', 90, true);
```

## 测试报告模板

### UAT测试报告

```markdown
# UAT测试报告 - LuckyMart TJ

## 测试信息
- 测试日期: YYYY-MM-DD
- 测试环境: Production/Staging
- 测试人员: [姓名]
- 应用版本: [版本号]

## 测试结果摘要

| 模块 | 总用例数 | 通过 | 失败 | 阻塞 | 通过率 |
|------|---------|------|------|------|-------|
| 用户增长中心 | 20 | 18 | 2 | 0 | 90% |
| 晒单系统管理 | 30 | 28 | 2 | 0 | 93% |
| 商业变现管理 | 15 | 15 | 0 | 0 | 100% |
| 数据分析中心 | 20 | 19 | 1 | 0 | 95% |
| 权限组织管理 | 18 | 18 | 0 | 0 | 100% |
| **总计** | **103** | **98** | **5** | **0** | **95%** |

## 发现的问题

### 严重问题 (P0)
无

### 重要问题 (P1)
1. [BUG-001] 晒单批量审核在选择超过50条时响应缓慢
   - 重现步骤: ...
   - 预期结果: ...
   - 实际结果: ...
   - 建议修复: 添加分页批量处理

### 一般问题 (P2)
1. [BUG-002] 热度排行榜时间筛选UI在移动端显示不全
   - 重现步骤: ...
   - 预期结果: ...
   - 实际结果: ...

## 性能测试结果

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 首页加载时间 | < 2s | 1.8s | ✓ |
| API响应时间 (P95) | < 500ms | 420ms | ✓ |
| 数据库查询时间 | < 100ms | 85ms | ✓ |

## 安全测试结果

| 测试项 | 结果 | 备注 |
|--------|------|------|
| SQL注入防护 | 通过 | 所有输入已参数化 |
| XSS防护 | 通过 | 内容已转义 |
| 权限控制 | 通过 | 所有API已保护 |
| HTTPS | 通过 | 强制HTTPS |

## 浏览器兼容性

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Chrome | 120+ | ✓ | 完全兼容 |
| Firefox | 120+ | ✓ | 完全兼容 |
| Safari | 17+ | ✓ | 完全兼容 |
| Edge | 120+ | ✓ | 完全兼容 |

## 总体评估

- **功能完整性**: 98%
- **性能表现**: 优秀
- **用户体验**: 良好
- **安全性**: 优秀

## 建议

1. 优化晒单批量操作性能
2. 改进移动端UI响应式设计
3. 添加更多数据可视化图表

## 验收结论

☑ 通过验收，可以上线  
☐ 需要修复关键问题后再验收  
☐ 不通过，需要重大改进

---

**报告人**: [姓名]  
**报告日期**: YYYY-MM-DD
```

## 测试时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 准备 | 环境部署 | 2小时 |
| 准备 | 测试数据初始化 | 1小时 |
| 执行 | 功能测试 | 4小时 |
| 执行 | 性能测试 | 2小时 |
| 执行 | 安全测试 | 2小时 |
| 执行 | 兼容性测试 | 2小时 |
| 报告 | 整理测试报告 | 2小时 |
| **总计** | | **15小时** |

## 测试完成标准

- [ ] 所有核心功能测试用例通过率 >= 95%
- [ ] 所有严重问题(P0)已修复
- [ ] 性能指标达标
- [ ] 安全测试通过
- [ ] 浏览器兼容性测试通过
- [ ] 测试报告已提交

## 下一步行动

1. 选择部署环境（Vercel或VPS）
2. 完成应用部署
3. 初始化测试数据
4. 执行测试用例
5. 记录测试结果
6. 生成测试报告
7. 修复发现的问题
8. 最终验收

---

**文档创建时间**: 2025年10月31日 23:28  
**状态**: 待执行  
**优先级**: 高
