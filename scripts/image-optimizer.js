#!/usr/bin/env node

/**
 * LuckyMart TJ 图片优化工具
 * 用于批量优化、监控和分析图片性能
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class ImageOptimizationTool {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: process.env.API_ENDPOINT || '${API_BASE_URL}/api/image',
      imageDir: process.env.IMAGE_DIR || './public/images',
      cacheDir: process.env.CACHE_DIR || './.image-cache',
      quality: options.quality || 85,
      formats: options.formats || ['webp', 'avif'],
      ...options
    };
    
    this.stats = {
      processed: 0,
      optimized: 0,
      errors: 0,
      totalSize: 0,
      savedSize: 0
    };
  }

  /**
   * 扫描目录中的所有图片
   */
  async scanImages(dir = this.config.imageDir) {
    const images = [];
    
    const scanRecursive = async (currentDir) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scanRecursive(fullPath);
          } else if (this.isImageFile(entry.name)) {
            const stats = await fs.promises.stat(fullPath);
            images.push({
              path: fullPath,
              relativePath: path.relative(process.cwd(), fullPath),
              size: stats.size,
              mtime: stats.mtime,
              ext: path.extname(entry.name).toLowerCase()
            });
          }
        }
      } catch (error) {
        console.error(`扫描目录失败 ${currentDir}:`, error.message);
      }
    };
    
    await scanRecursive(dir);
    return images;
  }

  /**
   * 检查是否为图片文件
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * 优化单张图片
   */
  async optimizeImage(imageInfo, options = {}) {
    const { path: imagePath, relativePath } = imageInfo;
    const { format = 'webp', quality = this.config.quality } = options;
    
    try {
      const response = await fetch(`${this.config.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk-optimize',
          images: [{
            src: `/${relativePath.replace(/\\/g, '/')}`,
            quality,
            format
          }],
          outputFormat: format
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.optimizedImages.length > 0) {
        const optimized = result.data.optimizedImages[0];
        
        this.stats.optimized++;
        this.stats.savedSize += optimized.estimatedSizeReduction;
        
        return {
          original: relativePath,
          optimized: optimized.optimized,
          originalSize: imageInfo.size,
          savedSize: optimized.estimatedSizeReduction,
          compressionRatio: optimized.estimatedSizeReduction / imageInfo.size
        };
      } else {
        throw new Error(result.error || '优化失败');
      }
    } catch (error) {
      this.stats.errors++;
      console.error(`优化图片失败 ${relativePath}:`, error.message);
      return null;
    } finally {
      this.stats.processed++;
    }
  }

  /**
   * 批量优化图片
   */
  async batchOptimize(images, options = {}) {
    const { parallel = 3, formats = this.config.formats } = options;
    
    console.log(`🚀 开始批量优化 ${images.length} 张图片...`);
    console.log(`📊 并行处理: ${parallel} | 格式: ${formats.join(', ')}`);
    
    const results = [];
    const chunks = this.chunkArray(images, parallel);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\n📦 处理批次 ${i + 1}/${chunks.length} (${chunk.length} 张图片)`);
      
      const chunkPromises = chunk.map(async (image) => {
        const formatResults = [];
        
        for (const format of formats) {
          const result = await this.optimizeImage(image, { format });
          if (result) {
            formatResults.push({ ...result, format });
          }
        }
        
        return formatResults;
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.flat());
      
      // 显示进度
      const progress = ((i + 1) / chunks.length * 100).toFixed(1);
      console.log(`✅ 批次 ${i + 1} 完成 (${progress}%)`);
    }
    
    return results;
  }

  /**
   * 分析图片性能
   */
  async analyzeImages(images) {
    console.log('🔍 分析图片性能...');
    
    const analysis = {
      totalImages: images.length,
      totalSize: 0,
      formatDistribution: {},
      sizeDistribution: {
        small: 0,     // < 100KB
        medium: 0,    // 100KB - 500KB
        large: 0,     // 500KB - 1MB
        huge: 0       // > 1MB
      },
      recommendations: []
    };

    for (const image of images) {
      analysis.totalSize += image.size;
      
      // 格式统计
      const format = image.ext.slice(1);
      analysis.formatDistribution[format] = (analysis.formatDistribution[format] || 0) + 1;
      
      // 大小统计
      const sizeKB = image.size / 1024;
      if (sizeKB < 100) analysis.sizeDistribution.small++;
      else if (sizeKB < 500) analysis.sizeDistribution.medium++;
      else if (sizeKB < 1024) analysis.sizeDistribution.large++;
      else analysis.sizeDistribution.huge++;
    }

    // 生成建议
    if (analysis.formatDistribution.jpg > 0 || analysis.formatDistribution.jpeg > 0) {
      analysis.recommendations.push('建议将 JPEG 图片转换为 WebP 或 AVIF 格式');
    }
    
    if (analysis.sizeDistribution.huge > 0) {
      analysis.recommendations.push(`${analysis.sizeDistribution.huge} 张图片过大，建议压缩`);
    }
    
    if (analysis.sizeDistribution.large > 0) {
      analysis.recommendations.push(`${analysis.sizeDistribution.large} 张图片偏大，可适当压缩`);
    }

    return analysis;
  }

  /**
   * 生成优化报告
   */
  generateReport(analysis, optimizationResults) {
    const savedKB = (this.stats.savedSize / 1024).toFixed(2);
    const totalKB = (this.stats.totalSize / 1024).toFixed(2);
    const savedPercent = ((this.stats.savedSize / this.stats.totalSize) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 图片优化报告');
    console.log('='.repeat(60));
    
    console.log('\n📁 原始图片分析:');
    console.log(`   总数量: ${analysis.totalImages}`);
    console.log(`   总大小: ${totalKB}KB`);
    console.log(`   格式分布:`);
    Object.entries(analysis.formatDistribution).forEach(([format, count]) => {
      console.log(`     ${format}: ${count} 张`);
    });
    
    console.log('\n⚡ 优化结果:');
    console.log(`   处理数量: ${this.stats.processed}`);
    console.log(`   优化成功: ${this.stats.optimized}`);
    console.log(`   错误数量: ${this.stats.errors}`);
    console.log(`   节省空间: ${savedKB}KB (${savedPercent}%)`);
    
    console.log('\n💡 建议:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    if (optimizationResults.length > 0) {
      console.log('\n🎯 优化详情 (前10项):');
      optimizationResults.slice(0, 10).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.original}`);
        console.log(`      ${result.originalSize} → ${result.optimized} (节省 ${(result.savedSize/1024).toFixed(1)}KB)`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * 工具函数：数组分块
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 运行完整优化流程
   */
  async run(options = {}) {
    try {
      console.log('🎯 LuckyMart TJ 图片优化工具启动...\n');
      
      // 1. 扫描图片
      console.log('1️⃣ 扫描图片文件...');
      const images = await this.scanImages();
      this.stats.totalSize = images.reduce((sum, img) => sum + img.size, 0);
      console.log(`   发现 ${images.length} 张图片，总大小 ${(this.stats.totalSize/1024/1024).toFixed(2)}MB`);
      
      if (images.length === 0) {
        console.log('❌ 未找到图片文件');
        return;
      }
      
      // 2. 分析现状
      console.log('\n2️⃣ 分析图片现状...');
      const analysis = await this.analyzeImages(images);
      
      // 3. 批量优化
      console.log('\n3️⃣ 执行批量优化...');
      const optimizationResults = await this.batchOptimize(images, options);
      
      // 4. 生成报告
      console.log('\n4️⃣ 生成优化报告...');
      this.generateReport(analysis, optimizationResults);
      
      // 5. 保存结果
      const reportData = {
        timestamp: new Date().toISOString(),
        config: this.config,
        stats: this.stats,
        analysis,
        optimizationResults
      };
      
      const reportFile = `image-optimization-report-${Date.now()}.json`;
      await fs.promises.writeFile(reportFile, JSON.stringify(reportData, null, 2));
      console.log(`\n💾 详细报告已保存: ${reportFile}`);
      
    } catch (error) {
      console.error('❌ 优化过程中发生错误:', error);
      process.exit(1);
    }
  }
}

// CLI 接口
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // 解析命令行参数
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--quality':
        options.quality = parseInt(value);
        break;
      case '--formats':
        options.formats = value.split(',');
        break;
      case '--parallel':
        options.parallel = parseInt(value);
        break;
      case '--dir':
        options.imageDir = value;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }
  
  const tool = new ImageOptimizationTool(options);
  await tool.run(options);
}

// 帮助信息
function printHelp() {
  console.log(`
🎯 LuckyMart TJ 图片优化工具

用法:
  node image-optimizer.js [选项]

选项:
  --quality <数字>     压缩质量 (默认: 85)
  --formats <格式>     输出格式，用逗号分隔 (默认: webp,avif)
  --parallel <数字>    并行处理数量 (默认: 3)
  --dir <目录>         图片目录 (默认: ./public/images)
  --help              显示帮助信息

示例:
  node image-optimizer.js
  node image-optimizer.js --quality 80 --formats webp
  node image-optimizer.js --parallel 5 --dir ./assets/images
`);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = ImageOptimizationTool;
