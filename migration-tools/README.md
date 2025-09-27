# PHP到NestJS接口迁移工具集

这个工具集帮助从PHP项目迁移到NestJS项目时，快速识别和修复接口映射问题。

## 工具说明

### 1. php-to-nestjs-mapper.js

**功能**：分析PHP路由和NestJS控制器之间的映射关系

**用途**：
- 识别PHP和NestJS之间的路径差异
- 自动发现缺失的接口
- 提供迁移建议

**使用方法**：
```bash
node php-to-nestjs-mapper.js <php目录> <nestjs目录>
```

**示例**：
```bash
node php-to-nestjs-mapper.js /Users/libiqiang/Documents/workspace/Tigshop/php /Users/libiqiang/Documents/workspace/Tigshop/nest/src
```

### 2. interface-scanner.js

**功能**：扫描实际运行的API接口，检测404错误

**用途**：
- 快速检测缺失的接口
- 验证接口健康状态
- 生成迁移状态报告

**使用方法**：
```bash
node interface-scanner.js <baseUrl> [nestjs目录]
```

**示例**：
```bash
node interface-scanner.js http://localhost:3000 ./src
```

## 使用场景

### 场景1：修复404接口

当遇到接口404错误时：

1. 使用interface-scanner快速确认问题：
```bash
node interface-scanner.js http://localhost:3000
```

2. 使用php-to-nestjs-mapper分析映射关系：
```bash
node php-to-nestjs-mapper.js ./php ./src
```

3. 根据分析结果修复路径问题

### 场景2：批量迁移评估

在进行大规模迁移前：

1. 运行完整分析：
```bash
node php-to-nestjs-mapper.js ./php ./src > migration-analysis.txt
```

2. 查看报告了解迁移范围

### 场景3：持续监控

迁移过程中定期检查：

```bash
# 每天运行一次健康检查
node interface-scanner.js http://localhost:3000 | mail -s "API Health Report" admin@example.com
```

## 输出报告

### 迁移分析报告 (migration-report.json)

包含以下信息：
- PHP路由统计
- NestJS路由统计
- 映射问题列表
- 修复建议
- 优先级排序

### 接口扫描报告 (interface-scan-report.json)

包含以下信息：
- 接口健康状态
- 404错误列表
- 实现的接口清单
- 建议和警告

## 最佳实践

1. **先分析后修复**：使用mapper了解整体情况
2. **分模块迁移**：按功能模块逐步迁移
3. **定期验证**：迁移完成后定期运行scanner验证
4. **版本控制**：保存报告用于追踪进度

## 故障排除

### 常见问题

1. **路径权限错误**：确保工具对目标目录有读取权限
2. **网络连接失败**：检查baseUrl是否可访问
3. **解析错误**：检查PHP和NestJS文件格式是否正确

### 调试技巧

1. 使用 `-v` 参数查看详细日志
2. 检查生成的JSON报告文件
3. 对比单个文件的手动分析结果

## 扩展功能

### 自定义接口列表

在interface-scanner.js中修改`expectedInterfaces`数组来添加自定义接口：

```javascript
this.expectedInterfaces = [
  {
    path: '/api/custom/path',
    method: 'POST',
    description: '自定义接口',
    category: 'custom'
  }
];
```

### 集成到CI/CD

可以在构建流程中集成这些工具：

```yaml
# GitHub Actions示例
- name: API Health Check
  run: |
    node migration-tools/interface-scanner.js ${{ vars.API_URL }}
    node migration-tools/php-to-nestjs-mapper.js php src
```

## 贡献

欢迎提交Issue和Pull Request来改进这些工具。