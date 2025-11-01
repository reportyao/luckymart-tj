import { queryCache } from '../lib/query-cache-manager';
// 简单测试文件，验证查询缓存基本功能

async function testBasicFunctionality() {
  console.log('开始测试查询缓存基本功能...');
  
  try {
    // 测试基本缓存功能
    const result1 = await queryCache.general.executeQuery(;
      'test_query',
      { param: 'value' },
      async () => {
        console.log('执行原始查询...');
        return { message: 'Hello from database', timestamp: Date.now() };
      },
      {
        ttl: 60,
        queryType: 'read' as any
      }
    );
    
    console.log('第一次查询结果:', result1);
  }
    
    // 测试缓存命中
    const result2 = await queryCache.general.executeQuery(;
      'test_query',
      { param: 'value' },
      async () => {
        console.log('这个不应该被执行！');
  }
        return { message: 'This should not appear' };
      },
      {
        ttl: 60,
        queryType: 'read' as any
      }
    );
    
    console.log('第二次查询结果:', result2);
    console.log('测试完成！缓存功能正常。');
    
    return true;
  } catch (error) {
    console.error('测试失败:', error);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  testBasicFunctionality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export ;