import {
/**
 * QR Code Generator Tests
 * 二维码生成器测试
 */

  QRCodeGenerator,
  QRCodeError,
  generateReferralQR,
  generateInviteCodeQR,
  generatePosterQR,
  validateQRContent
} from '../lib/qr-code/qr-generator';

describe('QRCodeGenerator', () => {
  describe('基本功能测试', () => {
    test('应该能生成简单的文本二维码', async () => {
      const result = await QRCodeGenerator.generate('Hello World');
      expect(result.dataUrl).toBeDefined();
      expect(result.filename).toMatch(/qr-code-.+\.png$/);
    });

    test('应该能生成PNG格式的二维码', async () => {
      const options = { type: 'png' as const };
      const result = await QRCodeGenerator.generate('Test QR Code', options);
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    test('应该能生成SVG格式的二维码', async () => {
      const options = { type: 'svg' as const };
      const result = await QRCodeGenerator.generate('SVG Test', options);
      expect(result.svg).toMatch(/^<svg/);
      expect(result.svg).toMatch(/<\/svg>$/);
      expect(result.dataUrl).toMatch(/^data:image\/svg\+xml/);
    });

    test('应该能生成Canvas格式的二维码', async () => {
      const options = { type: 'canvas' as const };
      const result = await QRCodeGenerator.generate('Canvas Test', options);
      expect(result.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(result.dataUrl).toBeDefined();
    });
  });

  describe('选项配置测试', () => {
    test('应该能设置二维码大小', async () => {
      const options = { size: 300 };
      const result = await QRCodeGenerator.generate('Size Test', options);
      if (result.canvas) {
        expect(result.canvas.width).toBeGreaterThanOrEqual(300);
      }
    });

    test('应该能设置颜色', async () => {
      const options = {
        color: {
          dark: '#FF0000',
          light: '#00FF00'
        }
      };
      const result = await QRCodeGenerator.generate('Color Test', options);
      expect(result.dataUrl).toBeDefined();
    });

    test('应该能设置错误修正级别', async () => {
      const options = {
        errorCorrectionLevel: 'H' as const
      };
      const result = await QRCodeGenerator.generate('ECC Test', options);
      expect(result.dataUrl).toBeDefined();
    });

    test('应该能设置边距', async () => {
      const options = { margin: 10 };
      const result = await QRCodeGenerator.generate('Margin Test', options);
      expect(result.dataUrl).toBeDefined();
    });
  });

  describe('内容配置测试', () => {
    test('应该能处理邀请链接', async () => {
      const content = {
        referral: {
          baseUrl: 'https://example.com/register',
          referralCode: 'USER123',
          campaign: 'summer2024'
        }
      };
      
      const result = await QRCodeGenerator.generate(content);
      expect(result.dataUrl).toBeDefined();
    });

    test('应该能处理邀请码', async () => {
      const content = {
        invitationCode: {
          code: 'INVITE456',
          type: 'user' as const,
          expiryDate: new Date('2024-12-31')
        }
      };
      
      const result = await QRCodeGenerator.generate(content);
      expect(result.dataUrl).toBeDefined();
    });

    test('应该能处理自定义内容', async () => {
      const content = {
        custom: {
          text: '自定义内容测试',
          type: 'text' as const
        }
      };
      
      const result = await QRCodeGenerator.generate(content);
      expect(result.dataUrl).toBeDefined();
    });
  });

  describe('海报生成测试', () => {
    test('应该能生成海报式二维码', async () => {
      const posterOptions = {
        title: '邀请好友注册',
        subtitle: '扫码立即参与',
        backgroundColor: '#F0F8FF',
        textColor: '#2C3E50',
        qrOptions: {
          size: 180,
          color: {
            dark: '#34495E',
            light: '#ECF0F1'
          }
        }
      };
      
      const result = await generatePosterQR('Poster Test', posterOptions);
      expect(result.dataUrl).toBeDefined();
      expect(result.canvas).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe('快捷方法测试', () => {
    test('generateReferralQR 快捷方法', async () => {
      const result = await generateReferralQR(;
        'https://example.com',
        'REF123',
        { campaign: 'test', source: 'test_source' }
      );
      expect(result.dataUrl).toBeDefined();
    });

    test('generateInviteCodeQR 快捷方法', async () => {
      const result = await generateInviteCodeQR('CODE123', 'event');
      expect(result.dataUrl).toBeDefined();
    });
  });

  describe('错误处理测试', () => {
    test('应该处理空内容错误', async () => {
      await expect(
        QRCodeGenerator.generate('')
      ).rejects.toThrow(QRCodeError);
    });

    test('应该处理超长内容错误', async () => {
      const longContent = 'A'.repeat(5000); // 很长的内容;
      await expect(
        QRCodeGenerator.generate(longContent)
      ).rejects.toThrow(QRCodeError);
    });

    test('QRCodeError 应该包含正确信息', async () => {
      try {
        await QRCodeGenerator.generate('');
      } catch (error) {
        expect(error).toBeInstanceOf(QRCodeError);
        expect(error.message).toContain('二维码生成失败');
      }
    });
  });

  describe('内容验证测试', () => {
    test('应该验证URL格式', () => {
      const result = validateQRContent('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('url');
    });

    test('应该验证邮箱格式', () => {
      const result = validateQRContent('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('email');
    });

    test('应该验证电话号码格式', () => {
      const result = validateQRContent('+1234567890');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('phone');
    });

    test('应该验证普通文本', () => {
      const result = validateQRContent('Hello World');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('text');
    });

    test('应该验证无效内容', () => {
      const result = validateQRContent('');
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('unknown');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('性能测试', () => {
    test('应该在合理时间内生成二维码', async () => {
      const start = Date.now();
      await QRCodeGenerator.generate('Performance Test');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    test('应该能处理批量生成', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>;
        QRCodeGenerator.generate(`Batch Test ${i}`)
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.dataUrl).toBeDefined();
      });
    });
  });
});