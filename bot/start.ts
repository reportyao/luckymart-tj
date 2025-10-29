#!/usr/bin/env ts-node
/**
 * Telegram Bot启动脚本
 * 用于PM2管理Bot进程
 */

import './index';

console.log('Telegram Bot服务已启动...');
console.log(`Bot连接到Mini App: ${process.env.MINI_APP_URL || 'http://localhost:3000'}`);

// 优雅关闭处理
process.once('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭Bot...');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭Bot...');
  process.exit(0);
});
