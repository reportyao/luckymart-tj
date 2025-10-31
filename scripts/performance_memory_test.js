/**
 * LuckyMart-TJ 性能内存测试脚本
 * 测试基本的内存使用和性能指标
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始LuckyMart-TJ性能内存测试...\n');

// 1. 项目基本信息测试
console.log('📊 项目基本信息:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   项目名称: ${packageJson.name}`);
  console.log(`   版本: ${packageJson.version}`);
  console.log(`   依赖数量: ${Object.keys(packageJson.dependencies || {}).length}`);
  console.log(`   开发依赖: ${Object.keys(packageJson.devDependencies || {}).length}`);
} catch (error) {
  console.log('   ❌ 无法读取package.json:', error.message);
}

// 2. 内存使用测试
console.log('\n💾 内存使用测试:');
try {
  const memUsage = process.memoryUsage();
  console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.log('   ❌ 内存检查失败:', error.message);
}

// 3. 文件系统性能测试
console.log('\n📁 文件系统性能测试:');
try {
  const startTime = Date.now();
  
  // 扫描TypeScript文件
  const tsFiles = execSync('find . -name "*.ts" -o -name "*.tsx" | wc -l', { encoding: 'utf8' }).trim();
  const scanTime = Date.now() - startTime;
  
  console.log(`   TypeScript文件数量: ${tsFiles}`);
  console.log(`   扫描耗时: ${scanTime}ms`);
  
  // 检查大文件
  const largeFiles = execSync('find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -nr | head -5', { encoding: 'utf8' });
  console.log('   最大的5个文件:');
  largeFiles.split('\n').slice(0, 5).forEach(line => {
    if (line.trim()) {
      console.log(`     ${line}`);
    }
  });
} catch (error) {
  console.log('   ❌ 文件系统测试失败:', error.message);
}

// 4. 依赖分析
console.log('\n📦 依赖分析:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  // 检查可能影响性能的大依赖
  const heavyDeps = ['react', 'next', 'prisma', 'framer-motion', 'recharts'];
  console.log('   关键依赖版本:');
  heavyDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`     ${dep}: ${dependencies[dep]}`);
    }
  });
  
  // 检查总依赖大小
  try {
    const nodeModulesSize = execSync('du -sh node_modules 2>/dev/null || echo "0M"', { encoding: 'utf8' }).trim();
    console.log(`   node_modules大小: ${nodeModulesSize}`);
  } catch (error) {
    console.log('   node_modules大小: 无法检测');
  }
} catch (error) {
  console.log('   ❌ 依赖分析失败:', error.message);
}

// 5. 潜在内存泄漏点检测
console.log('\n🔍 潜在内存泄漏点检测:');

// 检测定时器使用
try {
  const timerPattern = /setTimeout|setInterval/g;
  const timerFiles = execSync('grep -r "setTimeout\\|setInterval" --include="*.ts" --include="*.tsx" . | wc -l', { encoding: 'utf8' }).trim();
  console.log(`   定时器使用数量: ${timerFiles}`);
} catch (error) {
  console.log('   定时器检测: 无法执行');
}

// 检测事件监听器
try {
  const eventPattern = /addEventListener/g;
  const eventFiles = execSync('grep -r "addEventListener" --include="*.ts" --include="*.tsx" . | wc -l', { encoding: 'utf8' }).trim();
  console.log(`   事件监听器使用: ${eventFiles}`);
} catch (error) {
  console.log('   事件监听器检测: 无法执行');
}

// 检测Promise使用
try {
  const promisePattern = /new Promise|Promise\./g;
  const promiseFiles = execSync('grep -r "new Promise\\|Promise\\." --include="*.ts" --include="*.tsx" . | wc -l', { encoding: 'utf8' }).trim();
  console.log(`   Promise使用: ${promiseFiles}`);
} catch (error) {
  console.log('   Promise检测: 无法执行');
}

// 6. 性能监控代码检查
console.log('\n📈 性能监控代码检查:');

const performanceFiles = [
  'lib/performance.ts',
  'lib/cache-manager.ts', 
  'lib/memory-cache.ts',
  'hooks/useEventManager.ts',
  'components/performance/CodeSplitOptimizer.tsx'
];

performanceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      console.log(`   ✅ ${file}: ${lines} 行`);
    } catch (error) {
      console.log(`   ❌ ${file}: 读取失败`);
    }
  } else {
    console.log(`   ⚠️  ${file}: 文件不存在`);
  }
});

// 7. 测试建议
console.log('\n💡 测试建议:');
console.log('   1. 运行长期内存监控 (24小时+)');
console.log('   2. 执行页面加载性能测试');
console.log('   3. 进行并发用户测试');
console.log('   4. 检查缓存命中率');
console.log('   5. 分析bundle大小优化机会');

console.log('\n✅ 性能内存测试完成!');