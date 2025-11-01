#!/usr/bin/env node

/**
 * LuckyMartTJ 自动翻译生成脚本
 * 基于现有翻译文件，自动补充缺失的翻译内容
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const NAMESPACES = ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'];
const BASE_DIR = path.join(__dirname, '../src/locales');

// 翻译模板 - 完整定义所有缺失的翻译项
const TRANSLATION_TEMPLATES = {
  // referral命名空间模板（完整补充）
  referral: {
    "zh-CN": {
      "title": "我的邀请",
      "description": "邀请好友加入，获得丰厚奖励",
      "my_referrals": "我的邀请",
      "invite_code": "邀请码",
      "my_code": "我的邀请码",
      "copy_code": "复制邀请码",
      "share_invite": "分享邀请",
      "invite_friends": "邀请好友",
      "referral_link": "邀请链接",
      "copy_link": "复制链接",
      "rewards": "奖励",
      "commission_rate": "佣金比例",
      "total_earnings": "总收益",
      "pending_rewards": "待确认奖励",
      "confirmed_rewards": "已确认奖励",
      "monthly_earnings": "月度收益",
      "referral_stats": "邀请统计",
      "direct_referrals": "直接邀请",
      "indirect_referrals": "间接邀请",
      "total_members": "团队总人数",
      "active_members": "活跃成员",
      "level_structure": "层级结构",
      "referral_tree": "邀请树",
      "team_performance": "团队表现",
      "rank": "排名",
      "level": "等级",
      "performance_bonus": "业绩奖励",
      "rank_benefits": "等级权益",
      "invitation_rules": "邀请规则",
      "bonus_details": "奖励详情",
      "commission_structure": "佣金结构",
      "tier_1_rate": "一级佣金率",
      "tier_2_rate": "二级佣金率",
      "tier_3_rate": "三级佣金率",
      "milestone_rewards": "里程碑奖励",
      "special_bonuses": "特殊奖励",
      "seasonal_events": "季节活动",
      "leaderboard": "排行榜",
      "top_referrers": "顶级邀请者",
      "monthly_competition": "月度竞赛",
      "team_challenges": "团队挑战",
      "referral_tips": "邀请技巧",
      "success_stories": "成功案例",
      "referral_history": "邀请历史",
      "earnings_history": "收益历史",
      "withdrawal_history": "提现历史",
      "pending_earnings": "待提现收益",
      "tax_info": "税务信息",
      "referral_support": "邀请支持",
      "faq": "常见问题",
      "contact_referral_support": "联系邀请支持"
    },
    "en-US": {
      "title": "My Referrals",
      "description": "Invite friends to join and earn generous rewards",
      "my_referrals": "My Referrals",
      "invite_code": "Invite Code",
      "my_code": "My Invite Code",
      "copy_code": "Copy Code",
      "share_invite": "Share Invitation",
      "invite_friends": "Invite Friends",
      "referral_link": "Referral Link",
      "copy_link": "Copy Link",
      "rewards": "Rewards",
      "commission_rate": "Commission Rate",
      "total_earnings": "Total Earnings",
      "pending_rewards": "Pending Rewards",
      "confirmed_rewards": "Confirmed Rewards",
      "monthly_earnings": "Monthly Earnings",
      "referral_stats": "Referral Statistics",
      "direct_referrals": "Direct Referrals",
      "indirect_referrals": "Indirect Referrals",
      "total_members": "Total Team Members",
      "active_members": "Active Members",
      "level_structure": "Level Structure",
      "referral_tree": "Referral Tree",
      "team_performance": "Team Performance",
      "rank": "Rank",
      "level": "Level",
      "performance_bonus": "Performance Bonus",
      "rank_benefits": "Rank Benefits",
      "invitation_rules": "Invitation Rules",
      "bonus_details": "Bonus Details",
      "commission_structure": "Commission Structure",
      "tier_1_rate": "Tier 1 Commission",
      "tier_2_rate": "Tier 2 Commission",
      "tier_3_rate": "Tier 3 Commission",
      "milestone_rewards": "Milestone Rewards",
      "special_bonuses": "Special Bonuses",
      "seasonal_events": "Seasonal Events",
      "leaderboard": "Leaderboard",
      "top_referrers": "Top Referrers",
      "monthly_competition": "Monthly Competition",
      "team_challenges": "Team Challenges",
      "referral_tips": "Referral Tips",
      "success_stories": "Success Stories",
      "referral_history": "Referral History",
      "earnings_history": "Earnings History",
      "withdrawal_history": "Withdrawal History",
      "pending_earnings": "Pending Earnings",
      "tax_info": "Tax Information",
      "referral_support": "Referral Support",
      "faq": "FAQ",
      "contact_referral_support": "Contact Referral Support"
    },
    "ru-RU": {
      "title": "Мои приглашения",
      "description": "Приглашайте друзей и получайте щедрые награды",
      "my_referrals": "Мои приглашения",
      "invite_code": "Код приглашения",
      "my_code": "Мой код приглашения",
      "copy_code": "Копировать код",
      "share_invite": "Поделиться приглашением",
      "invite_friends": "Пригласить друзей",
      "referral_link": "Ссылка приглашения",
      "copy_link": "Копировать ссылку",
      "rewards": "Награды",
      "commission_rate": "Комиссионная ставка",
      "total_earnings": "Общий заработок",
      "pending_rewards": "Ожидающие награды",
      "confirmed_rewards": "Подтвержденные награды",
      "monthly_earnings": "Месячный заработок",
      "referral_stats": "Статистика приглашений",
      "direct_referrals": "Прямые приглашения",
      "indirect_referrals": "Косвенные приглашения",
      "total_members": "Всего членов команды",
      "active_members": "Активные участники",
      "level_structure": "Структура уровней",
      "referral_tree": "Дерево приглашений",
      "team_performance": "Командированность команды",
      "rank": "Ранг",
      "level": "Уровень",
      "performance_bonus": "Бонус за результат",
      "rank_benefits": "Преимущества ранга",
      "invitation_rules": "Правила приглашения",
      "bonus_details": "Детали бонусов",
      "commission_structure": "Структура комиссий",
      "tier_1_rate": "Комиссия 1 уровня",
      "tier_2_rate": "Комиссия 2 уровня",
      "tier_3_rate": "Комиссия 3 уровня",
      "milestone_rewards": "Награды за этапы",
      "special_bonuses": "Специальные бонусы",
      "seasonal_events": "Сезонные события",
      "leaderboard": "Рейтинг",
      "top_referrers": "Лучшие рефереры",
      "monthly_competition": "Месячное соревнование",
      "team_challenges": "Командные вызовы",
      "referral_tips": "Советы по приглашениям",
      "success_stories": "Истории успеха",
      "referral_history": "История приглашений",
      "earnings_history": "История заработка",
      "withdrawal_history": "История вывода",
      "pending_earnings": "Ожидающий заработок",
      "tax_info": "Налоговая информация",
      "referral_support": "Поддержка приглашений",
      "faq": "Часто задаваемые вопросы",
      "contact_referral_support": "Связаться с поддержкой приглашений"
    },
    "tg-TJ": {
      "title": "Даъватҳои ман",
      "description": "Дӯстонро даъват кунед ва мукофотҳои зиёд гиред",
      "my_referrals": "Даъватҳои ман",
      "invite_code": "Коди даъват",
      "my_code": "Коди даъвати ман",
      "copy_code": "Нусхакунии код",
      "share_invite": "Мубодилаи даъват",
      "invite_friends": "Дӯстонро даъват кунед",
      "referral_link": "Истиноди даъват",
      "copy_link": "Нусхакунии истинод",
      "rewards": "Мукофотҳо",
      "commission_rate": "Фоизи комиссия",
      "total_earnings": "Фоизи умумии даромад",
      "pending_rewards": "Мукофотҳои интизор",
      "confirmed_rewards": "Мукофотҳои тасдиқшуда",
      "monthly_earnings": "Даромади моҳона",
      "referral_stats": "Омори даъват",
      "direct_referrals": "Даъватҳои мустақим",
      "indirect_referrals": "Даъватҳои ғайримустақим",
      "total_members": "Аъзои умумии гурӯҳ",
      "active_members": "Аъзои фаъол",
      "level_structure": "Сохтори сатҳ",
      "referral_tree": "Дарахти даъват",
      "team_performance": "Коркунии гурӯҳ",
      "rank": "Ранг",
      "level": "Сатҳ",
      "performance_bonus": "Бонуси коркунӣ",
      "rank_benefits": "Истифодаи ранги",
      "invitation_rules": "Қоидаҳои даъват",
      "bonus_details": "Маълумоти бонус",
      "commission_structure": "Сохтори комиссия",
      "tier_1_rate": "Комиссияи сатҳи 1",
      "tier_2_rate": "Комиссияи сатҳи 2",
      "tier_3_rate": "Комиссияи сатҳи 3",
      "milestone_rewards": "Мукофотҳои марҳилавӣ",
      "special_bonuses": "Бонусҳои махсус",
      "seasonal_events": "Танзимоти мавсимӣ",
      "leaderboard": "Рейтинги",
      "top_referrers": "Реферерҳои беҳтарин",
      "monthly_competition": "Мусиқакатии моҳона",
      "team_challenges": "Мудиротии гурӯҳ",
      "referral_tips": "Маслиҳатҳои даъват",
      "success_stories": "Ҳикояҳои муваффақият",
      "referral_history": "Таърихи даъват",
      "earnings_history": "Таърихи даромад",
      "withdrawal_history": "Таърихи пардохт",
      "pending_earnings": "Даромади интизор",
      "tax_info": "Маълумоти андоз",
      "referral_support": "Дастгирии даъват",
      "faq": "Саволҳои маъмул",
      "contact_referral_support": "Ба дастгирии даъват муроҷиат кунед"
    }
  },

  // admin命名空间模板（补充缺失项目）
  admin: {
    "zh-CN": {
      "dashboard": "管理面板",
      "overview": "概览",
      "analytics": "分析",
      "reports": "报告",
      "users": "用户管理",
      "products": "产品管理",
      "orders": "订单管理",
      "transactions": "交易管理",
      "settings": "系统设置",
      "system_status": "系统状态",
      "server_info": "服务器信息",
      "database_status": "数据库状态",
      "api_status": "API状态",
      "logs": "日志",
      "error_logs": "错误日志",
      "access_logs": "访问日志",
      "system_logs": "系统日志",
      "monitoring": "监控",
      "performance": "性能",
      "alerts": "警报",
      "notifications": "通知",
      "backup": "备份",
      "maintenance": "维护",
      "updates": "更新",
      "security": "安全",
      "permissions": "权限管理",
      "roles": "角色管理",
      "audit_trail": "审计跟踪",
      "compliance": "合规性",
      "data_protection": "数据保护",
      "privacy": "隐私设置",
      "gdpr": "GDPR合规",
      "content_management": "内容管理",
      "media_library": "媒体库",
      "seo": "SEO设置",
      "localization": "本地化",
      "themes": "主题管理",
      "customization": "自定义",
      "integrations": "集成管理",
      "third_party": "第三方服务",
      "webhooks": "Webhook管理",
      "api_keys": "API密钥管理",
      "billing": "计费管理",
      "subscriptions": "订阅管理",
      "pricing": "定价策略",
      "discounts": "折扣管理",
      "promotions": "促销活动",
      "coupons": "优惠券",
      "financial_reports": "财务报告",
      "revenue_analytics": "收入分析",
      "user_analytics": "用户分析",
      "conversion_rates": "转化率",
      "retention_metrics": "留存指标",
      "engagement_metrics": "参与度指标",
      "growth_metrics": "增长指标",
      "ab_testing": "A/B测试",
      "feature_flags": "功能标记",
      "experiments": "实验管理",
      "variants": "变体管理",
      "results": "结果分析",
      "recommendations": "建议",
      "optimization": "优化",
      "automations": "自动化",
      "workflows": "工作流程",
      "triggers": "触发器",
      "conditions": "条件",
      "actions": "操作",
      "scheduled_tasks": "定时任务"
    },
    "en-US": {
      "dashboard": "Dashboard",
      "overview": "Overview",
      "analytics": "Analytics",
      "reports": "Reports",
      "users": "User Management",
      "products": "Product Management",
      "orders": "Order Management",
      "transactions": "Transaction Management",
      "settings": "System Settings",
      "system_status": "System Status",
      "server_info": "Server Information",
      "database_status": "Database Status",
      "api_status": "API Status",
      "logs": "Logs",
      "error_logs": "Error Logs",
      "access_logs": "Access Logs",
      "system_logs": "System Logs",
      "monitoring": "Monitoring",
      "performance": "Performance",
      "alerts": "Alerts",
      "notifications": "Notifications",
      "backup": "Backup",
      "maintenance": "Maintenance",
      "updates": "Updates",
      "security": "Security",
      "permissions": "Permission Management",
      "roles": "Role Management",
      "audit_trail": "Audit Trail",
      "compliance": "Compliance",
      "data_protection": "Data Protection",
      "privacy": "Privacy Settings",
      "gdpr": "GDPR Compliance",
      "content_management": "Content Management",
      "media_library": "Media Library",
      "seo": "SEO Settings",
      "localization": "Localization",
      "themes": "Theme Management",
      "customization": "Customization",
      "integrations": "Integration Management",
      "third_party": "Third-party Services",
      "webhooks": "Webhook Management",
      "api_keys": "API Key Management",
      "billing": "Billing Management",
      "subscriptions": "Subscription Management",
      "pricing": "Pricing Strategy",
      "discounts": "Discount Management",
      "promotions": "Promotional Campaigns",
      "coupons": "Coupons",
      "financial_reports": "Financial Reports",
      "revenue_analytics": "Revenue Analytics",
      "user_analytics": "User Analytics",
      "conversion_rates": "Conversion Rates",
      "retention_metrics": "Retention Metrics",
      "engagement_metrics": "Engagement Metrics",
      "growth_metrics": "Growth Metrics",
      "ab_testing": "A/B Testing",
      "feature_flags": "Feature Flags",
      "experiments": "Experiment Management",
      "variants": "Variant Management",
      "results": "Results Analysis",
      "recommendations": "Recommendations",
      "optimization": "Optimization",
      "automations": "Automations",
      "workflows": "Workflows",
      "triggers": "Triggers",
      "conditions": "Conditions",
      "actions": "Actions",
      "scheduled_tasks": "Scheduled Tasks"
    },
    "ru-RU": {
      "dashboard": "Панель управления",
      "overview": "Обзор",
      "analytics": "Аналитика",
      "reports": "Отчеты",
      "users": "Управление пользователями",
      "products": "Управление товарами",
      "orders": "Управление заказами",
      "transactions": "Управление транзакциями",
      "settings": "Системные настройки",
      "system_status": "Состояние системы",
      "server_info": "Информация о сервере",
      "database_status": "Состояние базы данных",
      "api_status": "Состояние API",
      "logs": "Логи",
      "error_logs": "Логи ошибок",
      "access_logs": "Логи доступа",
      "system_logs": "Системные логи",
      "monitoring": "Мониторинг",
      "performance": "Производительность",
      "alerts": "Оповещения",
      "notifications": "Уведомления",
      "backup": "Резервное копирование",
      "maintenance": "Обслуживание",
      "updates": "Обновления",
      "security": "Безопасность",
      "permissions": "Управление правами",
      "roles": "Управление ролями",
      "audit_trail": "Аудиторский след",
      "compliance": "Соответствие",
      "data_protection": "Защита данных",
      "privacy": "Настройки конфиденциальности",
      "gdpr": "Соответствие GDPR",
      "content_management": "Управление контентом",
      "media_library": "Медиа-библиотека",
      "seo": "Настройки SEO",
      "localization": "Локализация",
      "themes": "Управление темами",
      "customization": "Настройка",
      "integrations": "Управление интеграциями",
      "third_party": "Сторонние сервисы",
      "webhooks": "Управление вебхуками",
      "api_keys": "Управление ключами API",
      "billing": "Управление биллингом",
      "subscriptions": "Управление подписками",
      "pricing": "Ценовая стратегия",
      "discounts": "Управление скидками",
      "promotions": "Рекламные кампании",
      "coupons": "Купоны",
      "financial_reports": "Финансовые отчеты",
      "revenue_analytics": "Анализ доходов",
      "user_analytics": "Анализ пользователей",
      "conversion_rates": "Коэффициенты конверсии",
      "retention_metrics": "Метрики удержания",
      "engagement_metrics": "Метрики вовлеченности",
      "growth_metrics": "Метрики роста",
      "ab_testing": "A/B тестирование",
      "feature_flags": "Функциональные флаги",
      "experiments": "Управление экспериментами",
      "variants": "Управление вариантами",
      "results": "Анализ результатов",
      "recommendations": "Рекомендации",
      "optimization": "Оптимизация",
      "automations": "Автоматизация",
      "workflows": "Рабочие процессы",
      "triggers": "Триггеры",
      "conditions": "Условия",
      "actions": "Действия",
      "scheduled_tasks": "Запланированные задачи"
    },
    "tg-TJ": {
      "dashboard": "Панели идоракунӣ",
      "overview": "Намоиш",
      "analytics": "Таҳлил",
      "reports": "Гузоришҳо",
      "users": "Идоракунии корбарони",
      "products": "Идоракунии маҳсулот",
      "orders": "Идоракунии фармоишҳо",
      "transactions": "Идоракунии амалиётҳо",
      "settings": "Танзимоти система",
      "system_status": "Ҳолати система",
      "server_info": "Маълумоти сервер",
      "database_status": "Ҳолати пойгоҳи дода",
      "api_status": "Ҳолати API",
      "logs": "Логҳо",
      "error_logs": "Логҳои хатогӣ",
      "access_logs": "Логҳои дастрасӣ",
      "system_logs": "Логҳои система",
      "monitoring": "Мониторинг",
      "performance": "Коркунӣ",
      "alerts": "Огоҳиҳо",
      "notifications": "Огоҳиномаҳо",
      "backup": "Нусхаи эҳтиёт",
      "maintenance": "Нигоҳдорӣ",
      "updates": "Навсозӣ",
      "security": "Амният",
      "permissions": "Идоракунии ҳуқуқҳо",
      "roles": "Идоракунии нақшҳо",
      "audit_trail": "Пайвастагии аудит",
      "compliance": "Мутобиқат",
      "data_protection": "Ҳифзи дода",
      "privacy": "Танзимоти махфият",
      "gdpr": "Мутобиқати GDPR",
      "content_management": "Идоракунии мӯҳтаво",
      "media_library": "Китобхонаи медиа",
      "seo": "Танзимоти SEO",
      "localization": "Мавҳалкунӣ",
      "themes": "Идоракунии мавзӯъҳо",
      "customization": "Фардкунӣ",
      "integrations": "Идоракунии интегратсияҳо",
      "third_party": "Хидматҳои сеюмдараҷа",
      "webhooks": "Идоракунии вебҳукҳо",
      "api_keys": "Идоракунии калидҳои API",
      "billing": "Идоракунии билинг",
      "subscriptions": "Идоракунии обунаҳо",
      "pricing": "Стратегияи нархгузорӣ",
      "discounts": "Идоракунии тахфифҳо",
      "promotions": "Тадбирҳои таблиғот",
      "coupons": "Купонҳо",
      "financial_reports": "Гузоришҳои молиявӣ",
      "revenue_analytics": "Таҳлили даромад",
      "user_analytics": "Таҳлили корбар",
      "conversion_rates": "Қиматҳои табдилдиҳӣ",
      "retention_metrics": "Ченакҳои нигоҳдоштан",
      "engagement_metrics": "Ченакҳои иштирок",
      "growth_metrics": "Ченакҳои рушд",
      "ab_testing": "Санҷиши A/B",
      "feature_flags": "Байрақҳои хусусият",
      "experiments": "Идоракунии таҷрибаҳо",
      "variants": "Идоракунии вариантҳо",
      "results": "Таҳлили натиҷаҳо",
      "recommendations": "Тавсияҳо",
      "optimization": "Оптимизация",
      "automations": "Автоматикунӣ",
      "workflows": "Равандҳои кор",
      "triggers": "Муқарраркунанда",
      "conditions": "Шартҳо",
      "actions": "Амалҳо",
      "scheduled_tasks": "Вазифаҳои вақтгузошташуда"
    }
  }
};

class TranslationGenerator {
  constructor() {
    this.stats = {
      processed: 0,
      updated: 0,
      created: 0,
      errors: 0
    };
  }

  // 提取嵌套对象的所有键
  extractKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  // 深度合并对象
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if ((source?.key ?? null) && typeof (source?.key ?? null) === 'object' && !Array.isArray((source?.key ?? null))) {
        if (!(result?.key ?? null) || typeof (result?.key ?? null) !== 'object' || Array.isArray((result?.key ?? null))) {
          result[key] = {};
        }
        (result?.key ?? null) = this.deepMerge((result?.key ?? null), (source?.key ?? null));
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // 读取语言文件
  readLanguageFile(lang, namespace) {
    const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`    创建新文件: ${filePath}`);
        return {};
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
  }
    } catch (error) {
      console.error(`    错误: 无法读取文件 ${filePath} - ${error.message}`);
      return {};
    }
  }

  // 写入语言文件
  writeLanguageFile(lang, namespace, data) {
    const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      this.stats.updated++;
      return true;
    } catch (error) {
      console.error(`    错误: 无法写入文件 ${filePath} - ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  // 生成缺失的翻译
  generateMissingTranslations() {
    console.log('=== 开始生成缺失的翻译内容 ===\n');

    NAMESPACES.forEach(namespace => {
      console.log(`[命名空间: ${namespace}]`);
      
      // 检查是否有模板定义
      if (!TRANSLATION_TEMPLATES[namespace]) {
        console.log(`  跳过: ${namespace} - 暂无模板定义`);
        return;
      }

      const template = TRANSLATION_TEMPLATES[namespace];
      
      LANGUAGES.forEach(lang => {
        console.log(`  处理 ${lang}:`);
        
        // 检查语言是否有模板
        if (!template[lang]) {
          console.log(`    跳过: ${lang} - 暂无模板`);
  }
          return;
        }

        // 读取现有翻译文件
        const existingTranslations = this.readLanguageFile(lang, namespace);
        
        // 合并模板内容
        const mergedTranslations = this.deepMerge(existingTranslations, (template?.lang ?? null));
        
        // 计算新增的键数量
        const existingKeys = this.extractKeys(existingTranslations);
        const templateKeys = this.extractKeys((template?.lang ?? null));
        const newKeysCount = templateKeys.filter(key => !existingKeys.includes(key)).length;
        
        console.log(`    现有键数: ${existingKeys.length}`);
        console.log(`    模板键数: ${templateKeys.length}`);
        console.log(`    新增键数: ${newKeysCount}`);
        
        // 写入更新后的文件
        if (newKeysCount > 0) {
          const success = this.writeLanguageFile(lang, namespace, mergedTranslations);
          if (success) {
            console.log(`    ✅ 成功更新: ${newKeysCount} 个新键`);
  }
          } else {
            console.log(`    ❌ 更新失败`);
          }
        } else {
          console.log(`    ✅ 无需更新`);
        }
        
        this.stats.processed++;
      });
      
      console.log();
    });
  }

  // 生成报告
  generateReport() {
    console.log('=== 翻译生成报告 ===\n');
    console.log(`处理的命名空间数量: ${Object.keys(TRANSLATION_TEMPLATES).length}`);
    console.log(`处理的语言数量: ${LANGUAGES.length}`);
    console.log(`总处理文件数: ${this.stats.processed}`);
    console.log(`成功更新文件数: ${this.stats.updated}`);
    console.log(`创建新文件数: ${this.stats.created}`);
    console.log(`错误数量: ${this.stats.errors}`);
    console.log(`\n=== 生成完成! ===`);
  }

  // 运行生成器
  run() {
    try {
      this.generateMissingTranslations();
      this.generateReport();
      
      if (this.stats.errors > 0) {
        console.log(`\n警告: 存在 ${this.stats.errors} 个错误`);
        process.exit(1);
      } else {
        console.log('\n所有翻译生成成功！');
        process.exit(0);
      }
    } catch (error) {
      console.error('生成过程中发生错误:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// 运行生成器
if (require.main === module) {
  const generator = new TranslationGenerator();
  generator.run();
}

module.exports = TranslationGenerator;