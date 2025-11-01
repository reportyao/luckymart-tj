#!/usr/bin/env npx tsx

/**
 * 容错机制验证脚本
 * 无依赖的简单验证，检查代码结构和逻辑
 */

interface ValidationResult {
  component: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

export class FaultToleranceValidator {
  private results: ValidationResult[] = [];

  async validateAll(): Promise<void> {
    console.log('🔍 开始验证容错机制组件...\n');

    // 验证文件结构
    await this.validateFileStructure();
    
    // 验证组件接口
    await this.validateComponentInterfaces();
    
    // 验证配置结构
    await this.validateConfigurationStructure();
    
    // 输出结果
    this.printResults();
}

  private async validateFileStructure(): Promise<void> {
    console.log('📁 验证文件结构...');

    const requiredFiles = [;
      'enhanced-telegram-bot-launcher.ts',
      'utils/bot-daemon.ts',
      'utils/alert-manager.ts',
      'utils/enhanced-error-tracker.ts',
      'utils/config-manager.ts',
      'utils/performance-monitor.ts',
      'utils/daemon-types.ts',
      'test/fault-tolerance-system.test.ts'
    ];

    const fs = require('fs');
    const path = require('path');

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      
      this.results.push({
        component: `文件: ${file}`,
        status: exists ? 'OK' : 'ERROR',
        message: exists ? '文件存在' : '文件缺失'
      });
    }
  }

  private async validateComponentInterfaces(): Promise<void> {
    console.log('🔧 验证组件接口...');

    // 检查主要接口定义
    const interfaces = [;
      { name: 'BotDaemonConfig', file: 'utils/daemon-types.ts' },
      { name: 'AlertRule', file: 'utils/alert-manager.ts' },
      { name: 'HealthStatus', file: 'utils/health-monitor.ts' },
      { name: 'ComponentStatus', file: 'utils/fault-tolerance-manager.ts' }
    ];

    const fs = require('fs');
    const path = require('path');

    for (const interfaceDef of interfaces) {
      const filePath = path.join(__dirname, '..', interfaceDef.file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasInterface = content.includes(`interface ${interfaceDef.name}`);
      
      this.results.push({
        component: `接口: ${interfaceDef.name}`,
        status: hasInterface ? 'OK' : 'ERROR',
        message: hasInterface ? '接口定义完整' : '接口定义缺失'
      });
    }
  }

  private async validateConfigurationStructure(): Promise<void> {
    console.log('⚙️  验证配置结构...');

    const fs = require('fs');
    const path = require('path');

    // 检查配置文件
    const configPath = path.join(__dirname, '../config');
    if (fs.existsSync(configPath)) {
      const configFiles = fs.readdirSync(configPath).filter(f => f.endsWith('.ts'));
      
      this.results.push({
        component: '配置文件',
        status: configFiles.length > 0 ? 'OK' : 'WARNING',
        message: `找到 ${configFiles.length} 个配置文件`,
        details: configFiles
      });
    } else {
      this.results.push({
        component: '配置文件',
        status: 'WARNING',
        message: 'config 目录不存在'
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 验证结果汇总:\n');

    const statusCounts = {
      OK: 0,
      WARNING: 0,
      ERROR: 0
    };

    for (const result of this.results) {
      statusCounts[result.status]++;
      
      const icon = result.status === 'OK' ? '✅' : 
                   result.status === 'WARNING' ? '⚠️' : '❌';
      
      console.log(`${icon} ${result.component}: ${result.message}`);
      
      if (result.details) {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    console.log(`\n📈 总计: ${this.results.length} 项检查`);
    console.log(`✅ 通过: ${statusCounts.OK}`);
    console.log(`⚠️  警告: ${statusCounts.WARNING}`);
    console.log(`❌ 错误: ${statusCounts.ERROR}`);

    if (statusCounts.ERROR > 0) {
      console.log('\n🔧 需要修复的问题:');
      this.results.filter(r => r.status === 'ERROR').forEach(r => {
        console.log(`   - ${r.component}: ${r.message}`);
      });
    }

    console.log('\n🎯 建议的下一步操作:');
    console.log('1. 安装缺失的依赖包: npm install winston');
    console.log('2. 修复TypeScript配置问题');
    console.log('3. 运行完整测试套件');
    console.log('4. 部署到测试环境');
  }
}

// 运行验证
if (require.main === module) {
  const validator = new FaultToleranceValidator();
  validator.validateAll().catch(console.error);
}