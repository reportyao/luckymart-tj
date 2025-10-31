const fs = require('fs');
const path = require('path');

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const BASE_DIR = path.join(__dirname, '../src/locales');

// 补充缺失的config_history翻译模板
const CONFIG_HISTORY_TEMPLATES = {
  "zh-CN": {
    "config_history": {
      "title": "配置修改历史",
      "subtitle": "查看配置修改记录和审计日志",
      "search": "搜索",
      "reset": "重置",
      "startDate": "开始日期",
      "endDate": "结束日期",
      "updatedBy": "修改人",
      "configKey": "配置键名",
      "time": "时间",
      "modifier": "修改人",
      "beforeValue": "修改前",
      "afterValue": "修改后",
      "ipAddress": "IP地址",
      "changeType": "变更类型",
      "create": "新建",
      "delete": "删除",
      "increase": "增加",
      "decrease": "减少",
      "modify": "修改",
      "none": "无",
      "page": "页",
      "of": "共",
      "total": "总计",
      "noRecords": "暂无记录",
      "loading": "加载中...",
      "placeholder": {
        "key": "输入配置键名...",
        "modifier": "输入修改人..."
      }
    }
  },
  "en-US": {
    "config_history": {
      "title": "Configuration History",
      "subtitle": "View configuration changes and audit logs",
      "search": "Search",
      "reset": "Reset",
      "startDate": "Start Date",
      "endDate": "End Date",
      "updatedBy": "Modified By",
      "configKey": "Config Key",
      "time": "Time",
      "modifier": "Modifier",
      "beforeValue": "Before",
      "afterValue": "After",
      "ipAddress": "IP Address",
      "changeType": "Change Type",
      "create": "Create",
      "delete": "Delete",
      "increase": "Increase",
      "decrease": "Decrease",
      "modify": "Modify",
      "none": "None",
      "page": "Page",
      "of": "of",
      "total": "Total",
      "noRecords": "No Records",
      "loading": "Loading...",
      "placeholder": {
        "key": "Enter config key...",
        "modifier": "Enter modifier..."
      }
    }
  },
  "ru-RU": {
    "config_history": {
      "title": "История конфигураций",
      "subtitle": "Просмотр изменений конфигурации и журналов аудита",
      "search": "Поиск",
      "reset": "Сброс",
      "startDate": "Дата начала",
      "endDate": "Дата окончания",
      "updatedBy": "Изменил",
      "configKey": "Ключ конфигурации",
      "time": "Время",
      "modifier": "Модификатор",
      "beforeValue": "До",
      "afterValue": "После",
      "ipAddress": "IP-адрес",
      "changeType": "Тип изменения",
      "create": "Создать",
      "delete": "Удалить",
      "increase": "Увеличить",
      "decrease": "Уменьшить",
      "modify": "Изменить",
      "none": "Нет",
      "page": "Страница",
      "of": "из",
      "total": "Всего",
      "noRecords": "Нет записей",
      "loading": "Загрузка...",
      "placeholder": {
        "key": "Введите ключ конфигурации...",
        "modifier": "Введите модификатора..."
      }
    }
  },
  "tg-TJ": {
    "config_history": {
      "title": "Таърихи конфигуратсия",
      "subtitle": "Дидани тағйироти конфигуратсия ва логҳои аудит",
      "search": "Ҷустуҷӯ",
      "reset": "Аз нав танзим",
      "startDate": "Санаи оғоз",
      "endDate": "Санаи анҷом",
      "updatedBy": "Навсозӣ карда шудааст",
      "configKey": "Калиди конфигуратсия",
      "time": "Вақт",
      "modifier": "Тағйирдиҳанда",
      "beforeValue": "Пеш аз",
      "afterValue": "Баъд аз",
      "ipAddress": "Суроғаи IP",
      "changeType": "Навъи тағйирот",
      "create": "Сохтан",
      "delete": "Нест кардан",
      "increase": "Афзоиш",
      "decrease": "Кам кардан",
      "modify": "Таҳрир",
      "none": "Нест",
      "page": "Саҳифа",
      "of": "аз",
      "total": "Умумӣ",
      "noRecords": "Рекорд нест",
      "loading": "Боркунӣ...",
      "placeholder": {
        "key": "Калиди конфигуратсияро ворид кунед...",
        "modifier": "Тағйирдиҳандро ворид кунед..."
      }
    }
  }
};

// 深度合并对象
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!result[key] || typeof result[key] !== 'object' || Array.isArray(result[key])) {
        result[key] = {};
      }
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// 读取语言文件
function readLanguageFile(lang, namespace) {
  const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`无法读取文件 ${filePath}: ${error.message}`);
    return {};
  }
}

// 写入语言文件
function writeLanguageFile(lang, namespace, data) {
  const filePath = path.join(BASE_DIR, lang, `${namespace}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch (error) {
    console.error(`无法写入文件 ${filePath}: ${error.message}`);
    return false;
  }
}

// 生成缺失的翻译
function generateConfigHistoryTranslations() {
  console.log('=== 开始补充缺失的config_history翻译 ===\n');

  let totalUpdated = 0;

  LANGUAGES.forEach(lang => {
    console.log(`处理 ${lang}:`);
    
    if (!CONFIG_HISTORY_TEMPLATES[lang]) {
      console.log(`  跳过: ${lang} - 暂无模板`);
      return;
    }

    // 读取现有翻译文件
    const existingTranslations = readLanguageFile(lang, 'admin');
    
    // 合并模板内容
    const mergedTranslations = deepMerge(existingTranslations, CONFIG_HISTORY_TEMPLATES[lang]);
    
    // 计算新增的键数量
    const newKeys = [];
    function findNewKeys(obj, template, prefix = '') {
      for (const key in template) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof template[key] === 'object' && template[key] !== null) {
          if (!obj[key]) {
            obj[key] = {};
          }
          findNewKeys(obj[key], template[key], fullKey);
          newKeys.push(fullKey);
        } else {
          if (!(key in obj)) {
            newKeys.push(fullKey);
          }
        }
      }
    }
    findNewKeys(existingTranslations, CONFIG_HISTORY_TEMPLATES[lang]);
    
    console.log(`  新增键数: ${newKeys.length}`);
    
    // 写入更新后的文件
    if (newKeys.length > 0) {
      const success = writeLanguageFile(lang, 'admin', mergedTranslations);
      if (success) {
        console.log(`  ✅ 成功更新: ${newKeys.length} 个新键`);
        totalUpdated += newKeys.length;
      } else {
        console.log(`  ❌ 更新失败`);
      }
    } else {
      console.log(`  ✅ 无需更新`);
    }
    
    console.log();
  });

  console.log('=== config_history翻译补充完成! ===');
  console.log(`总共更新: ${totalUpdated} 个翻译键`);
}

// 运行生成器
if (require.main === module) {
  generateConfigHistoryTranslations();
}

module.exports = generateConfigHistoryTranslations;
