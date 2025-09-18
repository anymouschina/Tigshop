# TigShop NestJS 部署指南

## 系统要求

- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- PM2 (进程管理)

## 环境配置

### 1. 安装依赖
```bash
npm install
```

### 2. 环境变量配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 3. 数据库配置
```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 如果是生产环境
npx prisma migrate deploy
```

### 4. 创建上传目录
```bash
mkdir -p uploads
chmod 755 uploads
```

## 开发环境启动

### 1. 启动开发服务器
```bash
npm run start:dev
```

### 2. 访问服务
- API服务: `http://localhost:3001`
- API文档: `http://localhost:3001/api-docs`
- 静态文件: `http://localhost:3001/uploads`

## 生产环境部署

### 1. 构建项目
```bash
npm run build
```

### 2. 使用 PM2 部署
```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tigshop-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 3. Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API 代理
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 文档
    location /api-docs {
        proxy_pass http://localhost:3001/api-docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4. SSL 配置 (Let's Encrypt)
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 数据库管理

### 1. 数据库备份
```bash
# 创建备份脚本
cat > backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database_name"
DB_USER="your_username"

# 创建备份目录
mkdir -p \$BACKUP_DIR

# 备份数据库
pg_dump -U \$DB_USER -h localhost -d \$DB_NAME > \$BACKUP_DIR/backup_\$DATE.sql

# 压缩备份
gzip \$BACKUP_DIR/backup_\$DATE.sql

# 删除7天前的备份
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 设置定时备份
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

### 2. 数据库恢复
```bash
gunzip backup_20231201_020000.gz
psql -U your_username -h localhost -d your_database_name < backup_20231201_020000.sql
```

## 监控和日志

### 1. PM2 监控
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs tigshop-api

# 监控应用
pm2 monit

# 重启应用
pm2 restart tigshop-api

# 停止应用
pm2 stop tigshop-api
```

### 2. 日志轮转
```bash
# 安装 logrotate
sudo apt install logrotate

# 创建配置文件
sudo tee /etc/logrotate.d/tigshop > /dev/null << EOF
/path/to/your/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reload tigshop-api
    endscript
}
EOF
```

## 性能优化

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 2. Redis 缓存配置
```bash
# Redis 配置优化
cat > /etc/redis/redis.conf << EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

# 重启 Redis
sudo systemctl restart redis
```

### 3. Node.js 优化
```javascript
// 在 main.ts 中添加集群支持
import { cluster } from 'cluster';
import { cpus } from 'os';

if (cluster.isMaster) {
  const cpuCount = cpus().length;

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    cluster.fork();
  });
} else {
  async function bootstrap() {
    // 现有的启动逻辑
  }
  bootstrap();
}
```

## 安全配置

### 1. 防火墙配置
```bash
# 安装 UFW
sudo apt install ufw

# 配置防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 2. 安全头设置
```javascript
// 在 main.ts 中添加安全头
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全头
  app.use(helmet());

  // CORS 配置
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}
```

## 故障排除

### 1. 常见问题
```bash
# 检查端口占用
sudo lsof -i :3001

# 检查 PostgreSQL 连接
psql -U your_username -h localhost -d your_database_name -c "SELECT version();"

# 检查 Redis 连接
redis-cli ping

# 检查 Node.js 进程
ps aux | grep node
```

### 2. 性能分析
```bash
# 安装性能分析工具
npm install -g autocannon

# 压力测试
autocannon -c 100 -d 30 http://localhost:3001/api/health
```

## 回滚策略

### 1. 版本回滚
```bash
# 回滚到上一个版本
git checkout HEAD~1

# 重新构建
npm run build

# 重启应用
pm2 restart tigshop-api
```

### 2. 数据库回滚
```bash
# 查看迁移历史
npx prisma migrate status

# 回滚到指定迁移
npx prisma migrate reset
```

## 文档和 API

- API 文档: `http://your-domain.com/api-docs`
- 集成文档: `docs/api-integration.md`
- 部署文档: `docs/deployment.md`

## 联系支持

如有问题，请查看日志文件或联系技术支持。