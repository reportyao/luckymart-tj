# LuckyMartTJ 翻译更新和维护流程指南

## 目录
1. [概述](#概述)
2. [翻译系统架构](#翻译系统架构)
3. [翻译更新流程](#翻译更新流程)
4. [版本管理](#版本管理)
5. [质量保证](#质量保证)
6. [部署和发布](#部署和发布)
7. [监控和维护](#监控和维护)
8. [最佳实践](#最佳实践)
9. [故障排除](#故障排除)
10. [附录](#附录)

---

## 概述

### 目标
本指南旨在为LuckyMartTJ项目的多语言翻译系统提供完整的更新和维护流程，确保翻译质量、一致性和及时性。

### 适用范围
- **支持语言**: 中文 (zh-CN)、英语 (en-US)、俄语 (ru-RU)、塔吉克语 (tg-TJ)
- **命名空间**: common, auth, lottery, wallet, referral, error, admin, bot, task
- **用户角色**: 译者、审核员、审批员、项目经理、管理员

### 核心原则
1. **质量第一**: 翻译质量优于速度
2. **一致性**: 保持术语和表达的一致性
3. **可追溯性**: 所有变更都有记录和版本控制
4. **自动化**: 尽可能自动化重复性任务
5. **协作**: 支持多人协作翻译和审核

---

## 翻译系统架构

### 文件结构
```
src/locales/
├── zh-CN/
│   ├── common.json
│   ├── auth.json
│   ├── lottery.json
│   ├── wallet.json
│   ├── referral.json
│   ├── error.json
│   ├── admin.json
│   ├── bot.json
│   └── task.json
├── en-US/
├── ru-RU/
└── tg-TJ/
```

### 核心组件
1. **翻译版本管理器** (`utils/translation-version-manager.ts`)
   - 版本控制和历史管理
   - 变更跟踪和回滚
   - 冲突解决

2. **翻译更新工作流** (`workflows/translation-update-workflow.ts`)
   - 自动化工作流程
   - 多人协作支持
   - 质量检查和验收

3. **翻译同步工具** (`utils/translation-sync-tool.ts`)
   - 多环境同步
   - 批量处理
   - 回滚机制

4. **更新通知系统** (`utils/translation-update-notifier.ts`)
   - 多渠道通知
   - 状态跟踪
   - 进度监控

---

## 翻译更新流程

### 1. 翻译任务创建

#### 1.1 任务类型
- **新增翻译**: 新功能或新页面的翻译需求
- **更新翻译**: 现有翻译的修改和完善
- **紧急翻译**: 急需修复的翻译问题
- **定期审核**: 定期的翻译质量检查

#### 1.2 任务创建流程
```typescript
// 创建翻译任务
const taskId = await translationWorkflowManager.createWorkflow({
  title: "更新用户界面翻译",
  description: "更新用户中心页面的中文翻译",
  type: "update",
  priority: "medium",
  source: {
    locale: "zh-CN",
    namespace: "common",
    file: "./src/locales/zh-CN/common.json"
  },
  targets: [
    {
      locale: "en-US",
      namespace: "common",
      assignee: "translator123",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后
    },
    {
      locale: "ru-RU",
      namespace: "common",
      assignee: "translator456",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000
    }
  ],
  metadata: {
    tags: ["ui", "user-center"],
    dependencies: [],
    businessValue: "提升非中文用户体验"
  }
});
```

#### 1.3 任务优先级
- **Critical**: 影响核心功能或用户注册的关键翻译
- **High**: 主要功能页面的翻译更新
- **Medium**: 一般功能页面的翻译优化
- **Low**: 辅助功能和次要内容的翻译

### 2. 翻译执行流程

#### 2.1 工作流步骤
1. **数据验证** (Validation)
   - 检查翻译文件的完整性
   - 验证JSON格式
   - 检查必填字段

2. **翻译执行** (Translation)
   - 自动分配译者
   - 执行翻译任务
   - 创建版本记录

3. **质量审核** (Review)
   - 同行评审
   - 质量检查
   - 术语一致性验证

4. **最终批准** (Approval)
   - 项目经理批准
   - 业务方确认
   - 技术负责人审核

5. **部署发布** (Deployment)
   - 部署到测试环境
   - 验证部署结果
   - 发布到生产环境

#### 2.2 审核标准

##### 翻译质量检查清单
- [ ] **准确性**: 翻译准确传达原意
- [ ] **完整性**: 所有必需字段都已翻译
- [ ] **一致性**: 术语使用一致
- [ ] **本地化**: 符合目标语言习惯
- [ ] **格式**: JSON格式正确
- [ ] **长度**: 文本长度适合界面显示
- [ ] **占位符**: 变量占位符保持一致
- [ ] **文化适应性**: 考虑目标地区文化

##### 常见质量问题
1. **直译问题**: 过于字面的翻译，不符合目标语言习惯
2. **术语不一致**: 同一术语在不同地方翻译不同
3. **长度超限**: 翻译文本过长导致UI显示问题
4. **变量错误**: 变量占位符不一致或缺失
5. **文化不匹配**: 未考虑目标地区的文化习惯

#### 2.3 术语表使用

##### 核心业务术语
| 中文 | English | Русский | Тоҷикӣ | 备注 |
|------|---------|---------|--------|------|
| 幸运币 | Lucky Coin | Монета Удачи | Тангаҳои Бахт | 虚拟货币名称 |
| 夺宝币 | Draw Coin | Монета Розыгрыша | Тангаҳои Қисмат | 同义词 |
| 余额 | Balance | Баланс | Боқимонда | 真实货币余额 |
| 参与 | Participate | Участвовать | Иштирок Кардан | 核心动作 |

##### 系统功能术语
| 中文 | English | Русский | Тоҷикӣ | 备注 |
|------|---------|---------|--------|------|
| 个人中心 | Profile | Профиль | Профил | 用户区域 |
| 我的订单 | My Orders | Мои Заказы | Фармоишҳои Ман | 订单管理 |
| 交易记录 | Transaction History | История Транзакций | Таърихи Амалиётҳо | 财务记录 |

#### 2.4 审核流程

##### 同级审核
1. **分配审核员**: 系统自动分配或手动选择
2. **审核时间**: 一般任务3个工作日内完成
3. **审核方式**: 
   - 在线审核界面
   - 批量审核
   - 重点审核

##### 问题反馈
```typescript
// 添加审核评论
await translationWorkflowManager.addReviewComment(
  taskId,
  stepId,
  "reviewer123",
  "请将'余额'改为'账户余额'，以保持一致性",
  "suggestion",
  45, // 行号
  "wallet.balance" // 翻译键
);
```

##### 审核状态
- **通过**: 翻译质量符合标准
- **需修改**: 需要修改后重新审核
- **拒绝**: 翻译质量不达标，需要重新翻译

### 3. 质量保证

#### 3.1 自动化检查

##### 完整性检查
```typescript
// 检查翻译完整性
import { generateTranslationReport } from '../__tests__/translation-integrity.test';

const report = generateTranslationReport();
console.log('翻译完整性报告:', report);
```

##### 一致性检查
- 键名一致性检查
- 占位符一致性检查
- 术语一致性检查

##### 格式检查
- JSON格式验证
- 变量格式验证
- 长度限制检查

#### 3.2 质量标准

##### 最低质量要求
- **完整性**: ≥ 95%
- **一致性**: ≥ 90%
- **格式正确性**: 100%
- **文本长度**: 符合UI要求

##### 质量评估维度
1. **准确性** (40%): 翻译是否准确传达原意
2. **完整性** (30%): 是否包含所有必要内容
3. **一致性** (20%): 术语和表达是否一致
4. **本地化** (10%): 是否符合目标语言习惯

#### 3.3 质量改进

##### 定期审核
- 每月进行质量检查
- 季度进行深度质量评估
- 年度进行全面质量审查

##### 培训计划
- 新译者培训
- 定期质量培训
- 术语更新培训

---

## 版本管理

### 1. 版本控制

#### 1.1 版本号规范
- **主版本号**: 重大功能变更
- **次版本号**: 新功能添加
- **修订版本号**: 错误修复和小改进

示例: `1.2.3`
- 1: 主版本号
- 2: 次版本号
- 3: 修订版本号

#### 1.2 创建版本
```typescript
// 创建新版本
const version = await translationVersionManager.createVersion(
  "./src/locales/zh-CN/common.json",
  "translator123",
  "更新用户界面相关翻译",
  "main"
);

console.log('新版本ID:', version.id);
console.log('版本号:', version.version);
```

#### 1.3 版本历史
```typescript
// 获取版本历史
const history = await translationVersionManager.getVersionHistory(
  "zh-CN",
  "common",
  "main",
  50 // 最近50个版本
);

history.forEach(version => {
  console.log(`版本 ${version.version} - ${new Date(version.timestamp).toLocaleString()}`);
  console.log(`作者: ${version.author}`);
  console.log(`变更: ${version.changes.length} 个变更`);
});
```

### 2. 变更跟踪

#### 2.1 变更类型
- **add**: 新增翻译键
- **modify**: 修改现有翻译
- **delete**: 删除翻译键
- **rename**: 重命名翻译键

#### 2.2 变更记录
```typescript
// 获取差异报告
const diffReport = await translationVersionManager.getDiffReport(
  "v_1234567890_abc123",
  "v_1234567890_def456"
);

console.log('新增键:', diffReport.added);
console.log('修改键:', diffReport.modified);
console.log('删除键:', diffReport.deleted);
console.log('变更统计:', diffReport.statistics);
```

### 3. 回滚机制

#### 3.1 回滚条件
- 部署后发现重大翻译错误
- 用户反馈翻译问题严重
- 质量检查发现关键错误

#### 3.2 回滚流程
```typescript
// 回滚到指定版本
await translationVersionManager.rollbackToVersion(
  "v_1234567890_abc123",
  "./src/locales/zh-CN/common.json",
  "admin123"
);

console.log('回滚完成');
```

#### 3.3 回滚后处理
1. 通知相关团队
2. 分析回滚原因
3. 制定改进措施
4. 更新流程文档

---

## 部署和发布

### 1. 环境管理

#### 1.1 环境配置
```typescript
// 添加环境配置
translationSyncTool.addEnvironment({
  name: "development",
  type: "development",
  baseUrl: "https://dev-luckymart.example.com",
  translationPath: "./public/locales",
  deploymentPath: "./public/locales",
  features: {
    hotReload: true,
    autoBackup: false,
    rollbackEnabled: true,
    notificationEnabled: true
  }
});
```

#### 1.2 环境类型
- **Development**: 开发环境，快速迭代
- **Staging**: 预发布环境，完整测试
- **Production**: 生产环境，用户访问

### 2. 同步流程

#### 2.1 单环境同步
```typescript
// 同步到开发环境
const operationId = await translationSyncTool.syncToEnvironment(
  "development",
  {
    languages: ["zh-CN", "en-US"],
    namespaces: ["common", "auth"],
    dryRun: false,
    user: "translator123",
    description: "更新用户界面翻译"
  }
);
```

#### 2.2 批量同步
```typescript
// 同步到多个环境
const operationIds = await translationSyncTool.syncToMultipleEnvironments(
  ["staging", "production"],
  {
    languages: ["zh-CN", "en-US", "ru-RU", "tg-TJ"],
    namespaces: ["common", "auth", "lottery"],
    dryRun: true, // 干运行
    user: "translator123",
    description: "月度翻译更新"
  }
);
```

### 3. 部署发布

#### 3.1 生产部署
```typescript
// 部署到生产环境
const deploymentId = await translationSyncTool.deployToProduction({
  environment: "production",
  validateBeforeDeploy: true,
  backupBeforeDeploy: true,
  rollbackIfFailed: true,
  user: "release_manager",
  description: "2025年1月翻译更新发布",
  tags: ["monthly-update", "ui-improvement"]
});
```

#### 3.2 部署验证
- 功能测试
- 界面验证
- 性能检查
- 用户体验测试

#### 3.3 部署后监控
- 翻译加载监控
- 用户反馈跟踪
- 错误日志分析

---

## 监控和维护

### 1. 性能监控

#### 1.1 关键指标
- **加载时间**: 翻译文件加载时间
- **缓存命中率**: 缓存系统效率
- **同步成功率**: 同步操作成功率
- **错误率**: 翻译相关错误率

#### 1.2 监控配置
```typescript
// 获取翻译统计信息
const stats = translationLoader.getStats();
console.log('翻译统计:', stats);
```

### 2. 错误处理

#### 2.1 常见错误类型
1. **文件格式错误**: JSON格式不正确
2. **缺失翻译键**: 某些翻译键缺失
3. **版本冲突**: 多版本冲突
4. **网络错误**: 同步过程中网络中断

#### 2.2 错误处理流程
1. **错误检测**: 自动化检测
2. **错误分类**: 按严重程度分类
3. **错误修复**: 快速修复或回滚
4. **错误预防**: 完善检测机制

### 3. 定期维护

#### 3.1 日常维护
- 检查同步状态
- 监控错误日志
- 处理用户反馈
- 更新术语表

#### 3.2 定期审查
- 周报: 翻译进度和质量
- 月报: 整体维护状况
- 季报: 优化建议和计划

#### 3.3 优化改进
- 性能优化
- 流程改进
- 工具升级
- 培训计划

---

## 最佳实践

### 1. 翻译规范

#### 1.1 翻译质量
1. **准确性第一**: 确保翻译准确传达原意
2. **本地化**: 符合目标语言和文化的表达习惯
3. **简洁性**: 保持简洁，适合移动端显示
4. **一致性**: 术语使用保持一致

#### 1.2 技术规范
1. **JSON格式**: 严格遵守JSON格式规范
2. **键命名**: 使用小写字母和下划线
3. **占位符**: 保持变量占位符一致
4. **注释**: 添加必要的注释说明

#### 1.3 命名空间组织
- **common**: 通用词汇和短语
- **auth**: 用户认证相关
- **lottery**: 抽奖功能相关
- **wallet**: 钱包和余额相关
- **referral**: 邀请推荐相关
- **error**: 错误信息和提示
- **admin**: 管理后台相关
- **bot**: 机器人相关
- **task**: 任务相关

### 2. 工作流程最佳实践

#### 2.1 任务规划
1. **优先级排序**: 按业务价值排序
2. **时间估算**: 合理估算完成时间
3. **依赖管理**: 识别和解决依赖关系
4. **资源分配**: 合理分配人力资源

#### 2.2 协作规范
1. **沟通方式**: 使用统一沟通渠道
2. **文档记录**: 详细记录重要决策
3. **代码评审**: 多人评审确保质量
4. **知识分享**: 定期分享经验和教训

#### 2.3 质量保证
1. **自动化检查**: 充分利用自动化工具
2. **同行评审**: 多重验证确保质量
3. **用户测试**: 收集真实用户反馈
4. **持续改进**: 根据反馈不断优化

### 3. 技术最佳实践

#### 3.1 性能优化
1. **懒加载**: 按需加载翻译文件
2. **缓存策略**: 合理使用缓存机制
3. **压缩传输**: 启用gzip压缩
4. **CDN加速**: 使用CDN分发文件

#### 3.2 安全性
1. **访问控制**: 严格控制文件访问权限
2. **数据备份**: 定期备份翻译文件
3. **审计日志**: 记录所有重要操作
4. **权限管理**: 最小权限原则

#### 3.3 可维护性
1. **模块化设计**: 保持代码模块化
2. **文档完整**: 完善的技术文档
3. **测试覆盖**: 充分的测试覆盖
4. **代码复用**: 避免重复代码

---

## 故障排除

### 1. 常见问题

#### 1.1 翻译文件加载失败
**症状**: 页面显示原始键值而不是翻译文本

**原因**:
- 翻译文件路径错误
- JSON格式错误
- 网络请求失败

**解决方案**:
1. 检查文件路径是否正确
2. 验证JSON格式
3. 检查网络连接
4. 查看浏览器控制台错误

#### 1.2 同步失败
**症状**: 翻译同步操作失败

**原因**:
- 权限不足
- 网络问题
- 目标环境不可达

**解决方案**:
1. 检查用户权限
2. 检查网络连接
3. 验证目标环境配置
4. 查看详细错误日志

#### 1.3 版本冲突
**症状**: 多人同时修改同一文件导致冲突

**原因**:
- 缺少版本控制
- 并发编辑
- 沟通不足

**解决方案**:
1. 使用版本管理工具
2. 建立编辑协调机制
3. 加强团队沟通
4. 启用冲突检测

#### 1.4 质量不达标
**症状**: 翻译质量检查失败

**原因**:
- 翻译不准确
- 术语不一致
- 格式错误

**解决方案**:
1. 重新翻译问题内容
2. 更新术语表
3. 完善质量检查
4. 加强培训

### 2. 诊断工具

#### 2.1 翻译完整性检查
```typescript
// 运行翻译完整性检查
import { generateTranslationReport } from '../__tests__/translation-integrity.test';

const report = generateTranslationReport();
console.log('完整性报告:', report);
```

#### 2.2 缓存状态检查
```typescript
// 检查缓存状态
const cacheStats = await cacheManager.stats();
console.log('缓存统计:', cacheStats);
```

#### 2.3 版本历史查询
```typescript
// 查询版本历史
const history = await translationVersionManager.getVersionHistory(
  'zh-CN',
  'common',
  'main'
);
```

### 3. 应急处理

#### 3.1 紧急回滚
```typescript
// 紧急回滚到上一个版本
await translationVersionManager.rollbackToVersion(
  'v_1234567890_previous',
  './src/locales/zh-CN/common.json',
  'emergency_admin'
);
```

#### 3.2 快速修复
1. 识别问题范围
2. 评估修复时间
3. 制定修复计划
4. 实施修复方案
5. 验证修复效果

#### 3.3 用户沟通
1. 及时告知用户问题
2. 提供临时解决方案
3. 定期更新进展
4. 确认问题解决

---

## 附录

### A. 术语表

#### A.1 核心业务术语
- **Lucky Coin / 幸运币**: 虚拟货币
- **Draw Coin / 夺宝币**: 抽奖货币（与Lucky Coin同义）
- **Balance / 余额**: 账户余额
- **Market Price / 市价**: 商品市价
- **Total Shares / 总份数**: 总份额数
- **Participate / 参与**: 参与抽奖
- **Join Now / 立即参与**: 立即参与按钮

#### A.2 系统功能术语
- **Profile / 个人中心**: 用户个人资料页面
- **My Orders / 我的订单**: 用户订单管理
- **Transaction History / 交易记录**: 用户交易历史
- **Resale Market / 转售市场**: 二手交易市场
- **Team Statistics / 团队统计**: 推荐团队数据
- **Language Settings / 语言设置**: 国际化语言设置

#### A.3 界面元素术语
- **Confirm / 确认**: 确认按钮
- **Cancel / 取消**: 取消按钮
- **Back / 返回**: 返回按钮
- **Search / 搜索**: 搜索功能
- **Filter / 筛选**: 过滤功能
- **Reset / 重置**: 重置功能
- **Edit / 编辑**: 编辑功能
- **Delete / 删除**: 删除功能

### B. 工具命令

#### B.1 翻译完整性检查
```bash
npm run translation:check
```

#### B.2 生成缺失翻译
```bash
npm run translation:generate-missing
```

#### B.3 翻译质量审核
```bash
npm run translation:quality-audit
```

#### B.4 同步翻译文件
```bash
npm run translation:sync -- --env=staging
```

### C. 配置文件

#### C.1 环境配置示例
```json
{
  "environments": [
    {
      "name": "development",
      "type": "development",
      "baseUrl": "https://dev-luckymart.example.com",
      "translationPath": "./public/locales",
      "deploymentPath": "./public/locales",
      "features": {
        "hotReload": true,
        "autoBackup": false,
        "rollbackEnabled": true,
        "notificationEnabled": true
      }
    }
  ]
}
```

#### C.2 通知配置示例
```json
{
  "id": "default",
  "name": "默认通知配置",
  "type": "multi-channel",
  "enabled": true,
  "channels": [
    {
      "type": "email",
      "config": {
        "to": ["team@example.com"],
        "priority": "normal"
      }
    }
  ],
  "triggers": [
    {
      "event": "workflow:completed",
      "conditions": []
    }
  ]
}
```

### D. 性能基准

#### D.1 响应时间要求
- 翻译文件加载: < 200ms
- 同步操作完成: < 30s
- 版本创建: < 5s
- 回滚操作: < 10s

#### D.2 可靠性要求
- 同步成功率: > 99.5%
- 系统可用性: > 99.9%
- 数据一致性: 100%
- 错误恢复时间: < 5min

### E. 联系方式

#### E.1 紧急联系
- **系统管理员**: admin@luckymart.com
- **技术负责人**: tech-lead@luckymart.com
- **项目经理**: pm@luckymart.com

#### E.2 常规联系
- **翻译团队**: translation-team@luckymart.com
- **技术支持**: support@luckymart.com
- **反馈邮箱**: feedback@luckymart.com

---

**文档版本**: v1.0  
**最后更新**: 2025年10月31日  
**维护人员**: LuckyMartTJ 开发团队  
**审核状态**: 已审核