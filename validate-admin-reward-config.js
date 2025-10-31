#!/usr/bin/env node

/**
 * 管理员奖励配置API验证脚本
 * 验证API创建的完整性和正确性
 */

const fs = require('fs');
const path = require('path');

class AdminRewardConfigValidator {
  constructor() {
    this.results = [];
  }

  /**
   * 验证文件存在性
   */
  validateFileExists(filePath, description) {
    const exists = fs.existsSync(filePath);
    this.results.push({
      test: `文件存在性检查: ${description}`,
      status: exists ? 'passed' : 'failed',
      message: exists ? `✅ ${description} 存在` : `❌ ${description} 不存在`,
      path: filePath
    });
    return exists;
  }

  /**
   * 验证代码内容
   */
  validateCodeContent(filePath, patterns, description) {
    if (!fs.existsSync(filePath)) {
      this.results.push({
        test: `代码内容检查: ${description}`,
        status: 'failed',
        message: `❌ 文件不存在: ${filePath}`,
        path: filePath
      });
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const missingPatterns = patterns.filter(pattern => !content.includes(pattern));

    if (missingPatterns.length === 0) {
      this.results.push({
        test: `代码内容检查: ${description}`,
        status: 'passed',
        message: `✅ ${description} - 所有必需功能都存在`,
        path: filePath
      });
      return true;
    } else {
      this.results.push({
        test: `代码内容检查: ${description}`,
        status: 'failed',
        message: `❌ ${description} - 缺少功能: ${missingPatterns.join(', ')}`,
        path: filePath
      });
      return false;
    }
  }

  /**
   * 验证导入语句
   */
  validateImports(filePath) {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const requiredImports = [
      'import { getAdminFromRequest } from \'@/lib/auth\'',
      'import { prisma } from \'@/lib/prisma\'',
      'import { getLogger } from \'@/lib/logger\'',
      'import type { ApiResponse } from \'@/types\''
    ];

    const missing = requiredImports.filter(imp => !content.includes(imp));
    
    this.results.push({
      test: '导入语句检查',
      status: missing.length === 0 ? 'passed' : 'failed',
      message: missing.length === 0 
        ? '✅ 所有必需的导入语句都存在'
        : `❌ 缺少导入: ${missing.join(', ')}`,
      path: filePath
    });

    return missing.length === 0;
  }

  /**
   * 验证API功能
   */
  validateAPIFunctions(filePath) {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const requiredFunctions = [
      'export async function GET',
      'validateQueryParams',
      'getRewardConfigs',
      'requireAdmin',
      'getAdminFromRequest'
    ];

    const missing = requiredFunctions.filter(func => !content.includes(func));
    
    this.results.push({
      test: 'API功能检查',
      status: missing.length === 0 ? 'passed' : 'failed',
      message: missing.length === 0 
        ? '✅ 所有必需功能都存在'
        : `❌ 缺少功能: ${missing.join(', ')}`,
      path: filePath
    });

    return missing.length === 0;
  }

  /**
   * 验证返回数据结构
   */
  validateResponseStructure(filePath) {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const requiredFields = [
      'id',
      'config_key',
      'config_name',
      'config_description',
      'reward_amount',
      'referral_level',
      'is_active',
      'updated_at',
      'updated_by',
      'updated_by_admin',
      'pagination'
    ];

    const missing = requiredFields.filter(field => !content.includes(field));
    
    this.results.push({
      test: '返回数据结构检查',
      status: missing.length === 0 ? 'passed' : 'failed',
      message: missing.length === 0 
        ? '✅ 返回数据结构完整'
        : `❌ 缺少字段: ${missing.join(', ')}`,
      path: filePath
    });

    return missing.length === 0;
  }

  /**
   * 验证错误处理
   */
  validateErrorHandling(filePath) {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const errorHandlingFeatures = [
      'try.*catch',
      'catch.*error',
      'NextResponse.json.*error',
      'status.*403',
      'status.*400',
      'status.*500'
    ];

    const missing = errorHandlingFeatures.filter(feature => !content.includes(feature));
    
    this.results.push({
      test: '错误处理检查',
      status: missing.length === 0 ? 'passed' : 'failed',
      message: missing.length === 0 
        ? '✅ 错误处理机制完整'
        : `❌ 缺少错误处理: ${missing.join(', ')}`,
      path: filePath
    });

    return missing.length === 0;
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('📊 管理员奖励配置API验证报告');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed} ✅`);
    console.log(`失败: ${failed} ❌`);
    console.log(`成功率: ${total > 0 ? Math.round(passed / total * 100) : 0}%`);
    
    console.log('\n详细结果:');
    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.message}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 所有验证通过！API创建成功！');
      return true;
    } else {
      console.log('\n❌ 部分验证失败，请检查上述错误');
      return false;
    }
  }

  /**
   * 运行所有验证
   */
  runValidation() {
    console.log('🎯 开始验证管理员奖励配置API...\n');

    // 验证文件存在性
    this.validateFileExists(
      'app/api/admin/reward-config/route.ts',
      'API路由文件'
    );

    // 验证导入语句
    this.validateImports('app/api/admin/reward-config/route.ts');

    // 验证核心功能
    this.validateAPIFunctions('app/api/admin/reward-config/route.ts');

    // 验证返回数据结构
    this.validateResponseStructure('app/api/admin/reward-config/route.ts');

    // 验证错误处理
    this.validateErrorHandling('app/api/admin/reward-config/route.ts');

    // 验证数据库依赖
    this.validateCodeContent(
      'app/api/admin/reward-config/route.ts',
      ['prisma.rewardConfig', 'prisma.admins'],
      '数据库操作检查'
    );

    // 验证身份验证
    this.validateCodeContent(
      'app/api/admin/reward-config/route.ts',
      ['getAdminFromRequest', 'adminRecord.isActive'],
      '身份验证检查'
    );

    // 验证分页功能
    this.validateCodeContent(
      'app/api/admin/reward-config/route.ts',
      ['page.*limit', 'skip.*take', 'totalPages'],
      '分页功能检查'
    );

    // 验证过滤功能
    this.validateCodeContent(
      'app/api/admin/reward-config/route.ts',
      ['is_active.*referral_level.*search', 'where.*AND.*OR'],
      '过滤功能检查'
    );

    // 验证修改人信息
    this.validateCodeContent(
      'app/api/admin/reward-config/route.ts',
      ['updated_by_admin', 'prisma.admins.findFirst'],
      '修改人信息检查'
    );

    return this.generateReport();
  }
}

// 如果直接运行此文件，执行验证
if (require.main === module) {
  const validator = new AdminRewardConfigValidator();
  const success = validator.runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = AdminRewardConfigValidator;
