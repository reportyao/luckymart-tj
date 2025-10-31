const fs = require('fs');
const path = require('path');

// 综合静态代码分析工具
class StaticCodeAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.results = {
      summary: {},
      issues: {
        complexity: [],
        unused: [],
        security: [],
        quality: [],
        performance: []
      },
      statistics: {
        totalFiles: 0,
        totalLines: 0,
        complexityScore: 0,
        securityScore: 0,
        qualityScore: 0
      }
    };
  }

  // 分析所有TypeScript/JavaScript文件
  analyze() {
    console.log('开始静态代码分析...');
    
    // 统计文件数量和行数
    this.countFiles();
    
    // 分析复杂度
    this.analyzeComplexity();
    
    // 检查未使用的代码
    this.findUnusedCode();
    
    // 检查安全问题
    this.scanSecurityIssues();
    
    // 检查代码质量
    this.checkCodeQuality();
    
    // 检查性能问题
    this.checkPerformance();
    
    // 生成报告
    return this.generateReport();
  }

  // 统计文件数量和行数
  countFiles() {
    const patterns = ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx', 'components/**/*.ts', 'components/**/*.tsx', 'hooks/**/*.ts', 'hooks/**/*.tsx', 'utils/**/*.ts', 'utils/**/*.tsx'];
    
    for (const pattern of patterns) {
      const files = this.findFiles(pattern);
      this.results.statistics.totalFiles += files.length;
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').length;
          this.results.statistics.totalLines += lines;
        } catch (err) {
          console.warn(`无法读取文件: ${file}`);
        }
      });
    }
  }

  // 查找文件
  findFiles(pattern) {
    // 简化的文件查找（假设文件存在）
    const dirs = ['app', 'lib', 'components', 'hooks', 'utils'];
    const files = [];
    
    dirs.forEach(dir => {
      const dirPath = path.join(this.projectPath, dir);
      if (fs.existsSync(dirPath)) {
        this.walkDirectory(dirPath, files);
      }
    });
    
    return files.filter(file => 
      file.endsWith('.ts') || file.endsWith('.tsx')
    );
  }

  // 递归遍历目录
  walkDirectory(dir, files) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir);
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.walkDirectory(fullPath, files);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    });
  }

  // 分析代码复杂度
  analyzeComplexity() {
    const files = this.findFiles('**/*.{ts,tsx}');
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const functions = this.extractFunctions(content);
        
        functions.forEach(func => {
          const complexity = this.calculateComplexity(func.body);
          if (complexity > 10) {
            this.results.issues.complexity.push({
              file,
              function: func.name,
              complexity,
              line: func.line,
              severity: 'high'
            });
          }
        });
      } catch (err) {
        console.warn(`分析复杂度失败: ${file}`);
      }
    });
  }

  // 提取函数
  extractFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const functionMatch = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=|(\w+)\s*=>)/);
      if (functionMatch) {
        functions.push({
          name: functionMatch[1] || functionMatch[2] || functionMatch[3],
          line: index + 1,
          body: line
        });
      }
    });
    
    return functions;
  }

  // 计算复杂度
  calculateComplexity(code) {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?', ':'];
    let complexity = 1;
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  // 查找未使用的代码
  findUnusedCode() {
    const files = this.findFiles('**/*.{ts,tsx}');
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查未使用的变量
        const unusedVars = this.findUnusedVariables(content);
        unusedVars.forEach(variable => {
          this.results.issues.unused.push({
            file,
            type: 'variable',
            name: variable,
            line: variable.line,
            severity: 'medium'
          });
        });
        
        // 检查未使用的导入
        const unusedImports = this.findUnusedImports(content);
        unusedImports.forEach(imp => {
          this.results.issues.unused.push({
            file,
            type: 'import',
            name: imp.name,
            line: imp.line,
            severity: 'low'
          });
        });
      } catch (err) {
        console.warn(`分析未使用代码失败: ${file}`);
      }
    });
  }

  // 查找未使用的变量
  findUnusedVariables(content) {
    const lines = content.split('\n');
    const unused = [];
    
    lines.forEach((line, index) => {
      // 检查变量声明但未使用
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        // 简单的检查：看看是否在后续代码中被使用
        const remainingCode = lines.slice(index + 1).join('\n');
        if (!remainingCode.includes(varName)) {
          unused.push({ name: varName, line: index + 1 });
        }
      }
    });
    
    return unused;
  }

  // 查找未使用的导入
  findUnusedImports(content) {
    const lines = content.split('\n');
    const imports = [];
    const importSection = lines.slice(0, 20).join('\n'); // 检查前20行
    
    const importMatches = importSection.match(/import\s+{?\s*([^}]+)\s*}?\s*from/g);
    if (importMatches) {
      importMatches.forEach((match, index) => {
        const nameMatch = match.match(/import\s*{?\s*([^}\s]+)/);
        if (nameMatch) {
          const name = nameMatch[1];
          // 检查是否在代码中被使用
          const mainContent = lines.slice(20).join('\n');
          if (!mainContent.includes(name)) {
            imports.push({ name, line: index + 1 });
          }
        }
      });
    }
    
    return imports;
  }

  // 扫描安全问题
  scanSecurityIssues() {
    const files = this.findFiles('**/*.{ts,tsx,js,jsx}');
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查常见安全问题
        const securityPatterns = [
          { pattern: /eval\s*\(/, type: 'eval', description: '使用eval可能存在安全风险' },
          { pattern: /innerHTML\s*=/, type: 'innerHTML', description: '直接设置innerHTML存在XSS风险' },
          { pattern: /document\.write/, type: 'document.write', description: '使用document.write存在安全风险' },
          { pattern: /new\s+Function\s*\(/, type: 'new Function', description: '动态创建函数存在安全风险' },
          { pattern: /JSON\.parse\s*\(\s*[^)]*user/i, type: 'JSON.parse user input', description: '直接解析用户输入的JSON存在风险' }
        ];
        
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          securityPatterns.forEach(({ pattern, type, description }) => {
            if (pattern.test(line)) {
              this.results.issues.security.push({
                file,
                type,
                description,
                line: index + 1,
                code: line.trim(),
                severity: 'high'
              });
            }
          });
        });
      } catch (err) {
        console.warn(`安全扫描失败: ${file}`);
      }
    });
  }

  // 检查代码质量
  checkCodeQuality() {
    const files = this.findFiles('**/*.{ts,tsx}');
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // 检查TODO/FIXME注释
          if (line.includes('TODO') || line.includes('FIXME')) {
            this.results.issues.quality.push({
              file,
              type: 'todo',
              description: '发现TODO/FIXME注释',
              line: index + 1,
              code: line.trim(),
              severity: 'low'
            });
          }
          
          // 检查console.log
          if (line.includes('console.log')) {
            this.results.issues.quality.push({
              file,
              type: 'console.log',
              description: '发现console.log语句',
              line: index + 1,
              code: line.trim(),
              severity: 'medium'
            });
          }
          
          // 检查any类型使用
          if (line.includes(': any') || line.includes(' any ')) {
            this.results.issues.quality.push({
              file,
              type: 'any',
              description: '使用了any类型',
              line: index + 1,
              code: line.trim(),
              severity: 'medium'
            });
          }
        });
      } catch (err) {
        console.warn(`代码质量检查失败: ${file}`);
      }
    });
  }

  // 检查性能问题
  checkPerformance() {
    const files = this.findFiles('**/*.{ts,tsx,js,jsx}');
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // 检查可能的性能问题
          if (line.includes('forEach') && !line.includes('break') && !line.includes('return')) {
            this.results.issues.performance.push({
              file,
              type: 'forEach',
              description: '使用forEach可能影响性能，考虑使用for...of循环',
              line: index + 1,
              code: line.trim(),
              severity: 'low'
            });
          }
          
          if (line.includes('JSON.stringify(')) {
            this.results.issues.performance.push({
              file,
              type: 'JSON.stringify',
              description: '使用JSON.stringify可能影响性能，注意使用频率',
              line: index + 1,
              code: line.trim(),
              severity: 'low'
            });
          }
        });
      } catch (err) {
        console.warn(`性能检查失败: ${file}`);
      }
    });
  }

  // 生成报告
  generateReport() {
    const { issues, statistics } = this.results;
    
    // 计算总体评分
    statistics.complexityScore = Math.max(0, 100 - issues.complexity.length * 5);
    statistics.securityScore = Math.max(0, 100 - issues.security.length * 10);
    statistics.qualityScore = Math.max(0, 100 - issues.quality.length * 2);
    
    // 汇总
    this.results.summary = {
      totalIssues: issues.complexity.length + issues.unused.length + 
                   issues.security.length + issues.quality.length + 
                   issues.performance.length,
      highSeverityIssues: this.countHighSeverityIssues(),
      filesAnalyzed: statistics.totalFiles,
      linesOfCode: statistics.totalLines,
      scores: {
        complexity: statistics.complexityScore,
        security: statistics.securityScore,
        quality: statistics.qualityScore,
        overall: Math.round((statistics.complexityScore + statistics.securityScore + statistics.qualityScore) / 3)
      }
    };
    
    return this.results;
  }

  // 统计高严重性问题
  countHighSeverityIssues() {
    const allIssues = [
      ...this.results.issues.complexity,
      ...this.results.issues.security,
      ...this.results.issues.unused.filter(i => i.severity === 'high'),
      ...this.results.issues.quality.filter(i => i.severity === 'high'),
      ...this.results.issues.performance.filter(i => i.severity === 'high')
    ];
    
    return allIssues.length;
  }
}

// 运行分析
const projectPath = process.argv[2] || '/workspace/luckymart-tj';
const analyzer = new StaticCodeAnalyzer(projectPath);
const results = analyzer.analyze();

// 输出JSON格式结果
console.log(JSON.stringify(results, null, 2));