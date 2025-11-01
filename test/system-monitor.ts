import { spawn } from 'child_process';
#!/usr/bin/env node
/**
 * 系统资源监控脚本
 * 监控CPU、内存、网络、磁盘等系统资源
 */


interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    processes: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesSent: number;
    bytesReceived: number;
    packetsSent: number;
    packetsReceived: number;
  };
  process: {
    cpu: number;
    memory: number;
    threads: number;
    handles: number;
  };
}

class SystemMonitor {
  private metrics: SystemMetrics[] = [];
  private monitoring = false;
  private interval: NodeJS.Timeout | null = null;

  async startMonitoring(intervalMs: number = 1000): Promise<void> {
    console.log('📊 开始系统资源监控...');
    this.monitoring = true;

    this.interval = setInterval(async () => {
      if (this.monitoring) {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        this.printCurrentMetrics(metrics);
      }
    }, intervalMs);
  }

  stopMonitoring(): SystemMetrics[] {
    console.log('🛑 停止系统资源监控...');
    this.monitoring = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    return this.metrics;
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    try {
      const [cpu, memory, disk, network, process] = await Promise.all([;
        this.getCpuMetrics(),
        this.getMemoryMetrics(),
        this.getDiskMetrics(),
        this.getNetworkMetrics(),
        this.getProcessMetrics()
      ]);

      return {
        timestamp,
        cpu,
        memory,
        disk,
        network,
        process
      };
    } catch (error) {
      console.warn('⚠️ 收集系统指标时出现错误:', error.message);
      return this.getDefaultMetrics(timestamp);
    }
  }

  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
    try {
      const result = await this.runCommand('top', ['-bn1']);
      const lines = result.stdout.split('\n');
      
      // 解析CPU使用率
      const cpuLine = lines.find(line => line.includes('Cpu(s)'));
      let usage = 0;
      
      if (cpuLine) {
        const match = cpuLine.match(/(\d+\.?\d*)%us/);
        if (match) {
          usage = parseFloat(match[1]);
        }
      }

      // 获取负载平均值
      const loadAvg = await this.runCommand('uptime').then(res => {
        const match = res.stdout.match(/load average:\s*([\d.,\s]+)/);
        return match ? match[1].split(',').map(s => parseFloat(s.trim())) : [0, 0, 0];
      });

      // 获取进程数
      const psResult = await this.runCommand('ps', ['-eo', 'pid']);
      const processes = psResult.stdout.split('\n').length - 1;

      return {
        usage,
        loadAverage: loadAvg,
        processes
      };
    } catch (error) {
      return {
  }
        usage: 0,
        loadAverage: [0, 0, 0],
        processes: 0
      };
    }
  }

  private async getMemoryMetrics(): Promise<SystemMetrics['memory']> {
    try {
      const result = await this.runCommand('free', ['-m']);
      const lines = result.stdout.split('\n');
      const memLine = lines[1]; // 跳过头部;
      
      const parts = memLine.split(/\s+/);
      const total = parseInt(parts[1]);
      const used = parseInt(parts[2]);
      const free = parseInt(parts[3]);
      const usage = (used / total) * 100;

      return {
  }
        total,
        used,
        free,
        usage
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    }
  }

  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    try {
      const result = await this.runCommand('df', ['-h', '/']);
      const lines = result.stdout.split('\n');
      const diskLine = lines[1];
      
      const parts = diskLine.split(/\s+/);
      const total = this.parseSize((parts?.1 ?? null));
      const used = this.parseSize((parts?.2 ?? null));
      const free = this.parseSize((parts?.3 ?? null));
      const usage = (used / total) * 100;

      return {
        total,
        used,
        free,
        usage
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    }
  }

  private async getNetworkMetrics(): Promise<SystemMetrics['network']> {
    try {
      const result = await this.runCommand('cat', ['/proc/net/dev']);
      const lines = result.stdout.split('\n');
      
      let bytesSent = 0;
      let bytesReceived = 0;
      let packetsSent = 0;
      let packetsReceived = 0;

      for (const line of lines) {
        if (line.includes('eth0') || line.includes('en0') || line.includes('lo')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 9) {
            bytesReceived += parseInt(parts[1]) || 0;
            bytesSent += parseInt(parts[9]) || 0;
            packetsReceived += parseInt(parts[2]) || 0;
            packetsSent += parseInt(parts[10]) || 0;
          }
        }
      }

      return {
        bytesSent,
        bytesReceived,
        packetsSent,
        packetsReceived
      };
    } catch (error) {
      return {
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0
      };
    }
  }

  private async getProcessMetrics(): Promise<SystemMetrics['process']> {
    try {
      const currentProcess = process;
      
      // 获取进程CPU和内存使用情况
      const cpuUsage = await this.getProcessCpuUsage();
      const memoryUsage = process.memoryUsage();
      
      return {
        cpu: cpuUsage,
        memory: memoryUsage.heapUsed,
        threads: (process as any).getMaxListeners?.() || 0,
        handles: 0 // Windows-specific
      };
    } catch (error) {
      return {
        cpu: 0,
        memory: 0,
        threads: 0,
        handles: 0
      };
    }
  }

  private async getProcessCpuUsage(): Promise<number> {
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage();
    
    const totalUsage = (endUsage.user + endUsage.system - startUsage.user - startUsage.system) / 1000;
    return totalUsage;
  }

  private async runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/(\d+\.?\d*)([KMGT]?)/);
    if (!match) return 0; {

    const value = parseFloat(match[1]);
    const unit = match[2] || 'B';
    return value * (units[unit] || 1);
  }

  private getDefaultMetrics(timestamp: number): SystemMetrics {
    return {
      timestamp,
      cpu: { usage: 0, loadAverage: [0, 0, 0], processes: 0 },
      memory: { total: 0, used: 0, free: 0, usage: 0 },
      disk: { total: 0, used: 0, free: 0, usage: 0 },
      network: { bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 },
      process: { cpu: 0, memory: 0, threads: 0, handles: 0 }
    };
  }

  private printCurrentMetrics(metrics: SystemMetrics): void {
    const time = new Date(metrics.timestamp).toLocaleTimeString();
    
    console.log(`\r📊 [${time}] CPU: ${metrics.cpu.usage.toFixed(1)}% | ` +
                `内存: ${metrics.memory.usage.toFixed(1)}% | ` +
                `磁盘: ${metrics.disk.usage.toFixed(1)}% | ` +
                `进程CPU: ${metrics.process.cpu.toFixed(1)}ms | ` +
                `进程内存: ${(metrics.process.memory / 1024 / 1024).toFixed(1)}MB`, { end: '' });
  }

  generateMetricsReport(): string {
    if (this.metrics.length === 0) {
      return '无监控数据可分析';
    }

    // 计算统计数据
    const cpuUsage = this.metrics.map(m => m.cpu.usage);
    const memoryUsage = this.metrics.map(m => m.memory.usage);
    const diskUsage = this.metrics.map(m => m.disk.usage);
    const processCpu = this.metrics.map(m => m.process.cpu);
    const processMemory = this.metrics.map(m => m.process.memory);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr: number[]) => Math.max(...arr);
    const min = (arr: number[]) => Math.min(...arr);

    const duration = this.metrics[this.metrics.length - 1].timestamp - this.(metrics?.0 ?? null).timestamp;

    let report = `;
# 系统资源监控报告

## 📊 监控概览

- **监控时长**: ${(duration / 1000).toFixed(1)} 秒
- **数据点数量**: ${this.metrics.length} 个
- **监控间隔**: 1 秒

## 🖥️ CPU 指标

| 指标 | 当前 | 平均 | 最大 | 最小 |
|------|------|------|------|------|
| CPU使用率 | ${cpuUsage[cpuUsage.length - 1]?.toFixed(1) || 0}% | ${avg(cpuUsage).toFixed(1)}% | ${max(cpuUsage).toFixed(1)}% | ${min(cpuUsage).toFixed(1)}% |
| 进程数 | ${this.metrics[this.metrics.length - 1]?.cpu.processes || 0} | - | - | - |
| 1分钟负载 | ${this.metrics[this.metrics.length - 1]?.cpu.loadAverage[0]?.toFixed(2) || 0} | - | - | - |
| 5分钟负载 | ${this.metrics[this.metrics.length - 1]?.cpu.loadAverage[1]?.toFixed(2) || 0} | - | - | - |
| 15分钟负载 | ${this.metrics[this.metrics.length - 1]?.cpu.loadAverage[2]?.toFixed(2) || 0} | - | - | - |

## 💾 内存指标

| 指标 | 数值 |
|------|------|
| 总内存 | ${(this.metrics[this.metrics.length - 1]?.memory.total / 1024).toFixed(1)} MB |
| 已用内存 | ${(this.metrics[this.metrics.length - 1]?.memory.used / 1024).toFixed(1)} MB |
| 剩余内存 | ${(this.metrics[this.metrics.length - 1]?.memory.free / 1024).toFixed(1)} MB |
| 内存使用率 | ${memoryUsage[memoryUsage.length - 1]?.toFixed(1) || 0}% |

**内存使用统计**:
- 平均使用率: ${avg(memoryUsage).toFixed(1)}%
- 峰值使用率: ${max(memoryUsage).toFixed(1)}%
- 最低使用率: ${min(memoryUsage).toFixed(1)}%

## 💿 磁盘指标

| 指标 | 数值 |
|------|------|
| 总容量 | ${(this.metrics[this.metrics.length - 1]?.disk.total / 1024 / 1024).toFixed(1)} GB |
| 已用容量 | ${(this.metrics[this.metrics.length - 1]?.disk.used / 1024 / 1024).toFixed(1)} GB |
| 剩余容量 | ${(this.metrics[this.metrics.length - 1]?.disk.free / 1024 / 1024).toFixed(1)} GB |
| 磁盘使用率 | ${diskUsage[diskUsage.length - 1]?.toFixed(1) || 0}% |

## 🌐 网络指标

| 指标 | 数值 |
|------|------|
| 发送字节 | ${(this.metrics[this.metrics.length - 1]?.network.bytesSent / 1024 / 1024).toFixed(2)} MB |
| 接收字节 | ${(this.metrics[this.metrics.length - 1]?.network.bytesReceived / 1024 / 1024).toFixed(2)} MB |
| 发送包数 | ${this.metrics[this.metrics.length - 1]?.network.packetsSent || 0} |
| 接收包数 | ${this.metrics[this.metrics.length - 1]?.network.packetsReceived || 0} |

## 🔧 Node.js 进程指标

| 指标 | 当前 | 平均 | 最大 |
|------|------|------|------|
| CPU时间 | ${processCpu[processCpu.length - 1]?.toFixed(2) || 0}ms | ${avg(processCpu).toFixed(2)}ms | ${max(processCpu).toFixed(2)}ms |
| 堆内存 | ${(processMemory[processMemory.length - 1] / 1024 / 1024).toFixed(1) || 0}MB | ${(avg(processMemory) / 1024 / 1024).toFixed(1)}MB | ${(max(processMemory) / 1024 / 1024).toFixed(1)}MB |
| RSS内存 | ${(this.metrics[this.metrics.length - 1]?.process.memory / 1024 / 1024).toFixed(1) || 0}MB | - | - |

## 📈 性能评估

### CPU 性能
- 正常范围 (✅): ${cpuUsage.filter(u => u < 50).length}/${this.metrics.length} 次测量
- 警告范围 (⚠️): ${cpuUsage.filter(u => u >= 50 && u < 80).length}/${this.metrics.length} 次测量
- 危险范围 (🔴): ${cpuUsage.filter(u => u >= 80).length}/${this.metrics.length} 次测量

### 内存性能
- 正常范围 (✅): ${memoryUsage.filter(u => u < 70).length}/${this.metrics.length} 次测量
- 警告范围 (⚠️): ${memoryUsage.filter(u => u >= 70 && u < 90).length}/${this.metrics.length} 次测量
- 危险范围 (🔴): ${memoryUsage.filter(u => u >= 90).length}/${this.metrics.length} 次测量

### 磁盘性能
- 正常范围 (✅): ${diskUsage.filter(u => u < 80).length}/${this.metrics.length} 次测量
- 警告范围 (⚠️): ${diskUsage.filter(u => u >= 80 && u < 95).length}/${this.metrics.length} 次测量
- 危险范围 (🔴): ${diskUsage.filter(u => u >= 95).length}/${this.metrics.length} 次测量

## 💡 系统优化建议

1. **CPU优化**:
   ${cpuUsage.filter(u => u >= 80).length > 0 ? '- 检测到高CPU使用率，建议优化代码或增加CPU资源' : '- CPU使用正常，无需优化'}

2. **内存优化**:
   ${memoryUsage.filter(u => u >= 90).length > 0 ? '- 检测到内存使用率过高，建议检查内存泄漏或增加内存' : '- 内存使用正常'}

3. **磁盘优化**:
   ${diskUsage.filter(u => u >= 95).length > 0 ? '- 检测到磁盘空间不足，建议清理数据或增加存储' : '- 磁盘空间充足'}

4. **进程优化**:
   - Node.js进程内存峰值: ${(max(processMemory) / 1024 / 1024).toFixed(1)}MB
   - 建议监控堆内存增长趋势，预防内存泄漏

---
*系统监控报告生成时间: ${new Date().toISOString()}*
`;

    return report;
  }
}

async function main() {
  console.log('🚀 系统资源监控开始');
  console.log('📅 开始时间:', new Date().toISOString());

  const monitor = new SystemMonitor();

  try {
    // 开始监控
    await monitor.startMonitoring(1000);

    console.log('✅ 系统监控已启动，按 Ctrl+C 停止监控...');

    // 等待用户停止（示例中设置为60秒）
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ 系统监控失败:', error);
  } finally {
    // 停止监控并生成报告
    const metrics = monitor.stopMonitoring();
    const report = monitor.generateMetricsReport();
    
    // 保存报告
    const fs = await import('fs');
    const reportPath = '/workspace/luckymart-tj/test-reports/system-monitoring-report.md';
    
    const reportsDir = '/workspace/luckymart-tj/test-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 系统监控报告已保存到: ${reportPath}`);
    console.log('\n🎉 系统监控完成!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export ;