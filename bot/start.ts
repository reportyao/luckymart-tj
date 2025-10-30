#!/usr/bin/env node

/**
 * 增强的Telegram Bot启动脚本
 * 集成完整容错机制的Bot启动器
 */

async function main() {
  try {
    // 导入增强启动器
    const { default: BotLauncher } = require('./enhanced-launcher');
    
    console.log('🚀 启动增强版Telegram Bot...');
    console.log('📊 环境:', process.env.NODE_ENV || 'development');
    console.log('💻 平台:', process.platform, process.arch);
    console.log('🔧 Node版本:', process.version);
    console.log('');
    
    // 创建启动器实例并启动
    const launcher = new BotLauncher();
    await launcher.start();
    
  } catch (error) {
    console.error('❌ Bot启动失败:', error);
    console.error('堆栈信息:', error.stack);
    process.exit(1);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('💥 致命错误:', error);
  process.exit(1);
});
