const fs = require('fs');
const path = require('path');

const LANGUAGES = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];
const BASE_DIR = path.join(__dirname, '../src/locales');

// 补充缺失的reward_config翻译模板
const REWARD_CONFIG_TEMPLATES = {
  "zh-CN": {
    "reward_config": {
      "current_page": "当前页",
      "no_configs": "暂无配置",
      "no_configs_description": "点击新增按钮创建第一个奖励配置",
      "no_level": "无级别",
      "all_levels": "所有级别",
      "all_status": "所有状态",
      "add_config": "新增配置",
      "edit_config": "编辑配置",
      "select_template": "选择预设模板",
      "config_key_placeholder": "例如：register_referrer",
      "config_name_placeholder": "例如：推荐人注册奖励",
      "config_description_placeholder": "可选的配置描述...",
      "referral_level_description": "设置奖励对应的推荐级别",
      "enable_config": "启用此配置",
      "update": "更新",
      "create": "创建",
      "updating": "更新中...",
      "creating": "创建中...",
      "select": "选择",
      "deselect": "取消选择",
      "confirm": "确认",
      "confirm_execute": "确认执行",
      "close": "关闭"
    }
  },
  "en-US": {
    "reward_config": {
      "current_page": "Current Page",
      "no_configs": "No Configs",
      "no_configs_description": "Click add button to create your first reward config",
      "no_level": "No Level",
      "all_levels": "All Levels",
      "all_status": "All Status",
      "add_config": "Add Config",
      "edit_config": "Edit Config",
      "select_template": "Select Preset Template",
      "config_key_placeholder": "e.g. register_referrer",
      "config_name_placeholder": "e.g. Referrer Registration Reward",
      "config_description_placeholder": "Optional config description...",
      "referral_level_description": "Set the referral level for this reward",
      "enable_config": "Enable this config",
      "update": "Update",
      "create": "Create",
      "updating": "Updating...",
      "creating": "Creating...",
      "select": "Select",
      "deselect": "Deselect",
      "confirm": "Confirm",
      "confirm_execute": "Confirm Execute",
      "close": "Close"
    }
  },
  "ru-RU": {
    "reward_config": {
      "current_page": "Текущая страница",
      "no_configs": "Нет конфигураций",
      "no_configs_description": "Нажмите кнопку добавления, чтобы создать первую конфигурацию награды",
      "no_level": "Без уровня",
      "all_levels": "Все уровни",
      "all_status": "Все статусы",
      "add_config": "Добавить конфигурацию",
      "edit_config": "Редактировать конфигурацию",
      "select_template": "Выбрать предустановленный шаблон",
      "config_key_placeholder": "например: register_referrer",
      "config_name_placeholder": "например: Награда за регистрацию реферера",
      "config_description_placeholder": "Необязательное описание конфигурации...",
      "referral_level_description": "Установите уровень реферала для этой награды",
      "enable_config": "Включить эту конфигурацию",
      "update": "Обновить",
      "create": "Создать",
      "updating": "Обновление...",
      "creating": "Создание...",
      "select": "Выбрать",
      "deselect": "Отменить выбор",
      "confirm": "Подтвердить",
      "confirm_execute": "Подтвердить выполнение",
      "close": "Закрыть"
    }
  },
  "tg-TJ": {
    "reward_config": {
      "current_page": "Саҳифаи ҷорӣ",
      "no_configs": "Конфигуратсия нест",
      "no_configs_description": "Тугмаи иловаро пахш кунед то конфигуратсияи аввалини мукофотро созед",
      "no_level": "Сатҳ нест",
      "all_levels": "Ҳамаи сатҳҳо",
      "all_status": "Ҳамаи ҳолатҳо",
      "add_config": "Конфигуратсия илова кардан",
      "edit_config": "Конфигуратсия таҳрир кардан",
      "select_template": "Интихоби намунаи пешакӣ",
      "config_key_placeholder": "масалан: register_referrer",
      "config_name_placeholder": "масалан: Мукофоти сабти номи даъваткунанда",
      "config_description_placeholder": "Тавсифи интихобии конфигуратсия...",
      "referral_level_description": "Сатҳи даъват барои ин мукофотро муқаррар кунед",
      "enable_config": "Ин конфигуратсияро фаъол кунед",
      "update": "Навсозӣ",
      "create": "Сохтан",
      "updating": "Навсозӣ истодааст...",
      "creating": "Сохта истодааст...",
      "select": "Интихоб",
      "deselect": "Интихобро бекор кунед",
      "confirm": "Тасдиқ",
      "confirm_execute": "Тасдиқи иҷро",
      "close": "Пӯшидан"
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
function generateMissingTranslations() {
  console.log('=== 开始补充缺失的reward_config翻译 ===\n');

  let totalUpdated = 0;

  LANGUAGES.forEach(lang => {
    console.log(`处理 ${lang}:`);
    
    if (!REWARD_CONFIG_TEMPLATES[lang]) {
      console.log(`  跳过: ${lang} - 暂无模板`);
      return;
    }

    // 读取现有翻译文件
    const existingTranslations = readLanguageFile(lang, 'admin');
    
    // 合并模板内容
    const mergedTranslations = deepMerge(existingTranslations, REWARD_CONFIG_TEMPLATES[lang]);
    
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
    findNewKeys(existingTranslations, REWARD_CONFIG_TEMPLATES[lang]);
    
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

  console.log('=== 翻译补充完成! ===');
  console.log(`总共更新: ${totalUpdated} 个翻译键`);
}

// 运行生成器
if (require.main === module) {
  generateMissingTranslations();
}

module.exports = generateMissingTranslations;
