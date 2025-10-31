// Instagram海报生成API测试脚本
// 测试 /api/referral/generate-instagram-poster 端点

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '${API_BASE_URL}';

interface GeneratePosterRequest {
  prize_name: string;
  prize_image_url: string;
  language: 'ru' | 'tg';
}

interface GeneratePosterResponse {
  poster_url: string;
  qr_code_url: string;
  expires_at: string;
  referral_code: string;
  referral_link: string;
}

// 测试数据
const testUserId = '123456789'; // 模拟用户ID
const testRequest: GeneratePosterRequest = {
  prize_name: 'iPhone 15 Pro Max',
  prize_image_url: 'https://example.com/iphone-15-pro-max.jpg',
  language: 'ru'
};

// 测试海报生成API
async function testPosterGeneration() {
  console.log('🚀 开始测试Instagram海报生成API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/referral/generate-instagram-poster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId // 模拟认证头
      },
      body: JSON.stringify(testRequest)
    });

    console.log('📡 响应状态:', response.status, response.statusText);
    console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API错误响应:', errorText);
      return;
    }

    const result: GeneratePosterResponse = await response.json();
    
    console.log('✅ 海报生成成功!');
    console.log('📊 结果详情:');
    console.log(`   - 海报URL: ${result.poster_url}`);
    console.log(`   - QR码URL: ${result.qr_code_url}`);
    console.log(`   - 邀请码: ${result.referral_code}`);
    console.log(`   - 邀请链接: ${result.referral_link}`);
    console.log(`   - 过期时间: ${result.expires_at}`);
    
    // 测试海报访问统计API
    await testPosterStats(result.poster_url.split('/').pop() || '', testUserId);
    
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

// 测试海报统计API
async function testPosterStats(posterId: string, userId: string) {
  console.log('\n📈 测试海报访问统计API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/referral/poster-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        poster_id: posterId,
        viewer_telegram_id: userId,
        referer: 'https://instagram.com'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 统计记录成功:', result);
    } else {
      console.error('❌ 统计记录失败:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ 统计请求失败:', error);
  }
}

// 测试获取海报列表API
async function testGetPosters() {
  console.log('\n📋 测试获取海报列表API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/referral/generate-instagram-poster?user_id=${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 获取海报列表成功:', result);
    } else {
      console.error('❌ 获取海报列表失败:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ 获取海报列表请求失败:', error);
  }
}

// 执行所有测试
async function runAllTests() {
  console.log('🧪 Instagram海报API测试套件');
  console.log('=====================================\n');
  
  // 生成海报测试
  await testPosterGeneration();
  
  // 获取海报列表测试
  await testGetPosters();
  
  console.log('\n✨ 测试完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testPosterGeneration, testPosterStats, testGetPosters };