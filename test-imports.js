// test-imports.js - 快速测试模块导入
console.log('🧪 开始模块导入测试...');

// 测试 Node.js 路径解析
console.log('📋 测试路径解析：');
try {
    const path = require('path');
    console.log('✅ Node.js 路径模块可用');
    console.log('当前目录:', path.resolve('.'));
    console.log('lib 路径:', path.resolve('./lib'));
    console.log('lib/api-client.ts 路径:', path.resolve('./lib/api-client.ts'));
} catch (e) {
    console.log('❌ Node.js 路径模块错误:', e.message);
}

// 测试文件系统
console.log('');
console.log('📋 测试文件系统：');
try {
    const fs = require('fs');
    const files = [
        './lib/api-client.ts',
        './lib/middleware.ts', 
        './lib/request-tracker.ts',
        './lib/logger.ts',
        './hooks/useApi.ts'
    ];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - 存在`);
        } else {
            console.log(`❌ ${file} - 不存在`);
        }
    });
} catch (e) {
    console.log('❌ 文件系统测试错误:', e.message);
}

// 测试配置文件
console.log('');
console.log('📋 测试配置文件：');
try {
    const fs = require('fs');
    if (fs.existsSync('./jsconfig.json')) {
        const jsconfig = JSON.parse(fs.readFileSync('./jsconfig.json', 'utf8'));
        console.log('✅ jsconfig.json 解析成功');
        console.log('paths 配置:', jsconfig.compilerOptions?.paths || '未配置');
    } else {
        console.log('❌ jsconfig.json 不存在');
    }
} catch (e) {
    console.log('❌ jsconfig.json 解析错误:', e.message);
}

try {
    if (fs.existsSync('./next.config.js')) {
        console.log('✅ next.config.js 存在');
    } else {
        console.log('❌ next.config.js 不存在');
    }
} catch (e) {
    console.log('❌ next.config.js 检查错误:', e.message);
}

console.log('');
console.log('🧪 测试完成！');