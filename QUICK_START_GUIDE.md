# 🚀 LuckyMart TJ 邀请码API快速启动指南

## ⚡ 快速开始

您的 `GET /api/referral/my-code` API已经创建完成！以下是快速启动指南。

## 📋 前置要求

确保您的环境已配置：
- [x] Next.js项目已设置
- [x] Prisma数据库已配置
- [x] JWT认证系统已配置
- [x] Telegram Bot Token已设置

## 🔧 环境变量配置

在 `.env` 文件中添加以下变量：

```bash
# JWT认证
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Telegram配置
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 应用配置
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 🧪 立即测试API

### 1. 启动开发服务器
```bash
cd luckymart-tj
npm run dev
```

### 2. 测试API端点
```bash
# 使用curl测试
curl -X GET "http://localhost:3000/api/referral/my-code" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. 预期响应
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC12345",
    "shareLinks": {
      "telegram": "https://t.me/share/url?url=...",
      "general": "https://domain.com/?ref=ABC12345"
    },
    "shareTexts": {
      "zh": "中文分享文案...",
      "ru": "俄文分享文案...",
      "tg": "塔吉克语分享文案..."
    }
  }
}
```

## 💻 前端集成示例

### React组件示例
```jsx
import { useState, useEffect } from 'react';

function ReferralCodeComponent({ userToken }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReferralCode();
  }, []);

  const getReferralCode = async () => {
    try {
      const response = await fetch('/api/referral/my-code', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setReferralData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('获取邀请码失败');
    } finally {
      setLoading(false);
    }
  };

  const shareToTelegram = () => {
    if (referralData?.shareLinks?.telegram) {
      window.open(referralData.shareLinks.telegram, '_blank');
    }
  };

  const copyShareLink = async () => {
    if (referralData?.shareLinks?.general) {
      await navigator.clipboard.writeText(referralData.shareLinks.general);
      alert('分享链接已复制到剪贴板！');
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!referralData) return <div>无数据</div>;

  return (
    <div className="referral-section">
      <h3>我的邀请码</h3>
      <div className="referral-code">
        {referralData.referralCode}
      </div>
      
      <div className="share-buttons">
        <button onClick={shareToTelegram}>
          分享到Telegram
        </button>
        <button onClick={copyShareLink}>
          复制分享链接
        </button>
      </div>

      <div className="share-text">
        <h4>分享文案:</h4>
        <textarea 
          value={referralData.shareTexts.zh} 
          readOnly 
          rows={6}
        />
      </div>
    </div>
  );
}

export default ReferralCodeComponent;
```

### JavaScript/TypeScript工具函数
```javascript
// referral-utils.js
export class ReferralManager {
  constructor(userToken) {
    this.userToken = userToken;
    this.apiBase = '/api/referral';
  }

  async getReferralCode() {
    const response = await fetch(`${this.apiBase}/my-code`, {
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取邀请码失败');
    }

    return result.data;
  }

  async shareToTelegram(referralData) {
    const telegramUrl = referralData.shareLinks.telegram;
    window.open(telegramUrl, '_blank');
  }

  async copyShareLink(referralData) {
    const shareLink = referralData.shareLinks.general;
    await navigator.clipboard.writeText(shareLink);
    return shareLink;
  }

  getShareText(referralData, language = 'zh') {
    return referralData.shareTexts[language] || referralData.shareTexts.zh;
  }

  generateQRCode(referralData) {
    // 可以集成QR码生成库
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralData.shareLinks.general)}`;
    return qrUrl;
  }
}

// 使用示例
const referralManager = new ReferralManager(userToken);

try {
  const referralData = await referralManager.getReferralCode();
  console.log('邀请码:', referralData.referralCode);
  
  // 分享到Telegram
  await referralManager.shareToTelegram(referralData);
  
  // 复制分享链接
  const shareLink = await referralManager.copyShareLink(referralData);
  console.log('分享链接已复制:', shareLink);
  
} catch (error) {
  console.error('邀请码操作失败:', error);
}
```

## 🎯 常见使用场景

### 1. 用户个人中心
```jsx
// 在用户个人资料页面显示邀请码
function UserProfile({ user }) {
  const [referralCode, setReferralCode] = useState(null);

  return (
    <div className="user-profile">
      <h2>欢迎, {user.firstName}</h2>
      {referralCode && (
        <ReferralSection referralCode={referralCode} />
      )}
    </div>
  );
}
```

### 2. 邀请页面
```jsx
// 专门的邀请页面
function InvitePage() {
  return (
    <div className="invite-page">
      <h1>邀请好友</h1>
      <ReferralCodeComponent />
      
      <div className="invite-benefits">
        <h3>邀请好友的好处:</h3>
        <ul>
          <li>好友注册后您获得奖励</li>
          <li>好友首次购买您获得佣金</li>
          <li>邀请越多，奖励越多</li>
        </ul>
      </div>
    </div>
  );
}
```

### 3. 浮动邀请按钮
```jsx
// 页面浮动邀请按钮
function FloatingInviteButton() {
  return (
    <div className="floating-invite-btn">
      <button onClick={() => showInviteModal()}>
        <span>👥</span>
        <span>邀请好友</span>
      </button>
    </div>
  );
}
```

## 🔧 故障排除

### 常见问题

**Q: API返回401错误**
A: 检查JWT token是否正确配置和有效

**Q: 用户不存在错误**
A: 确保用户已通过Telegram认证并创建

**Q: 邀请码生成失败**
A: 检查数据库连接和用户表结构

**Q: 分享链接无法访问**
A: 确认NEXT_PUBLIC_BASE_URL环境变量配置正确

### 调试技巧
```javascript
// 启用详细日志
console.log('开始获取邀请码...');
try {
  const data = await getReferralCode();
  console.log('获取成功:', data);
} catch (error) {
  console.error('获取失败:', error);
}
```

## 📚 相关文档

- [API详细文档](./API_REFERRAL_MY_CODE_REPORT.md)
- [完成状态报告](./REFERRAL_API_COMPLETION_REPORT.md)
- [Telegram Bot API文档](https://core.telegram.org/bots/api)
- [Next.js API Routes文档](https://nextjs.org/docs/api-routes/introduction)

## 🆘 获取帮助

如果遇到问题：

1. 检查控制台错误信息
2. 验证环境变量配置
3. 确认数据库连接状态
4. 查看API响应详情

---

**🎉 享受使用您的邀请码API！**

您的API现在已经准备就绪，可以为LuckyMart TJ用户提供邀请好友的功能了。