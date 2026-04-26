# PM2 部署与管理指南

## 快速开始

### 1. 首次部署

```bash
# 进入项目目录
cd /www/wwwroot/api.yumanyi.top

# 安装依赖
npm install

# 首次启动（使用配置文件）
npm run pm2:start
```

### 2. 重启服务

```bash
# 重启服务（推荐）
npm run pm2:restart

# 或重载服务（零停机）
npm run pm2:reload
```

## PM2 命令说明

### 启动相关

```bash
# 启动应用
npm run pm2:start
# 等同于: pm2 start ecosystem.config.js --env production

# 重启应用（代码更新后）
npm run pm2:restart
# 等同于: pm2 restart ecosystem.config.js --env production --update-env

# 重载应用（零停机重启）
npm run pm2:reload
# 等同于: pm2 reload ecosystem.config.js --env production --update-env
```

### 管理相关

```bash
# 停止应用
npm run pm2:stop

# 删除应用（从PM2列表中移除）
npm run pm2:delete

# 查看所有进程状态
npm run pm2:status
# 等同于: pm2 list

# 查看日志
npm run pm2:logs
# 等同于: pm2 logs ai-api

# 监控面板
npm run pm2:monit
# 等同于: pm2 monit
```

### 常用 PM2 命令

```bash
# 查看所有进程
pm2 list

# 查看特定应用信息
pm2 show ai-api

# 查看实时日志
pm2 logs ai-api

# 查看最近的日志
pm2 logs ai-api --lines 100

# 清空日志
pm2 flush

# 监控资源使用
pm2 monit

# 生成启动脚本（开机自启）
pm2 startup

# 保存当前进程列表
pm2 save
```

## 配置文件说明

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'ai-api',                    // 应用名称
      script: './src/app.js',            // 启动脚本
      cwd: '/www/wwwroot/api.yumanyi.top', // 工作目录
      
      // 开发环境配置
      env: {
        NODE_ENV: 'development',
      },
      
      // 生产环境配置
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',                 // 监听所有IP
      },
    },
  ],
}
```

### 重要参数说明

- **`name`**: 应用名称，用于 `pm2 stop/start/restart` 等命令
- **`script`**: 启动脚本路径
- **`cwd`**: 工作目录（生产环境必须正确配置）
- **`env`**: 开发环境变量
- **`env_production`**: 生产环境变量

## 更新代码后的部署流程

### 标准流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖（如果有）
npm install

# 3. 重启服务（加载新代码和环境变量）
npm run pm2:restart

# 4. 查看日志确认启动成功
npm run pm2:logs
```

### 零停机部署（推荐）

```bash
# 使用 reload 实现零停机重启
npm run pm2:reload
```

**注意：** `reload` 会在旧进程处理完当前请求后再停止，实现无缝切换。

## 环境变量管理

### 方式一：通过 ecosystem.config.js

```javascript
env_production: {
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  PORT: '3000',
  API_KEY: 'your-api-key',
}
```

### 方式二：通过 .env 文件

```bash
# .env.production
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
API_KEY=your-api-key
```

### 更新环境变量后

```bash
# 必须使用 --update-env 参数
npm run pm2:restart
# 或
pm2 restart ai-api --update-env
```

**重要：** 如果只修改了 `.env` 文件而没有重启，或者重启时没有 `--update-env`，环境变量不会更新！

## 日志管理

### 查看日志

```bash
# 实时查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs ai-api

# 查看最近100行日志
pm2 logs ai-api --lines 100

# 查看错误日志
pm2 logs ai-api --err

# 查看输出日志
pm2 logs ai-api --out
```

### 日志配置

在 `ecosystem.config.js` 中配置日志：

```javascript
{
  name: 'ai-api',
  script: './src/app.js',
  
  // 日志配置
  error_file: './logs/error.log',      // 错误日志路径
  out_file: './logs/out.log',          // 输出日志路径
  log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志时间格式
  merge_logs: true,                    // 合并日志
  max_size: '10M',                     // 单个日志文件最大大小
}
```

### 日志轮转

```bash
# 安装日志轮转模块
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 开机自启动

### 配置开机自启

```bash
# 生成启动脚本
pm2 startup

# 根据提示执行命令（通常是）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 保存当前进程列表
pm2 save
```

### 取消开机自启

```bash
pm2 unstartup
```

## 故障排查

### 1. 进程启动失败

```bash
# 查看详细日志
pm2 logs ai-api --err

# 查看应用信息
pm2 show ai-api

# 检查配置文件
cat ecosystem.config.js
```

### 2. 环境变量未生效

```bash
# 查看进程的环境变量
pm2 env <id>

# 重启并强制更新环境变量
pm2 restart ai-api --update-env
```

### 3. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 3000

# 杀死占用端口的进程
kill -9 <PID>

# 或直接修改配置中的端口
```

### 4. 内存溢出

```bash
# 监控内存使用
pm2 monit

# 增加最大内存重启
pm2 restart ai-api --max-memory-restart 500M
```

### 5. 进程自动重启

```bash
# 查看重启次数
pm2 list

# 查看日志找出重启原因
pm2 logs ai-api --lines 200

# 常见原因：
# - 代码错误导致崩溃
# - 内存溢出
# - 数据库连接失败
# - 端口冲突
```

## 性能优化

### 集群模式（多进程）

```javascript
// ecosystem.config.js
{
  name: 'ai-api',
  script: './src/app.js',
  instances: 4,              // 进程数（或使用 'max' 使用所有CPU核心）
  exec_mode: 'cluster',      // 集群模式
}
```

**注意：** 使用集群模式时，需要确保应用支持多进程（如端口监听只能在一个进程中）。

### 资源限制

```javascript
{
  name: 'ai-api',
  script: './src/app.js',
  max_memory_restart: '500M',  // 内存超过500M自动重启
  min_uptime: '10s',          // 最小运行时间（判断是否正常启动）
  max_restarts: 10,           // 最大重启次数
  restart_delay: 4000,        // 重启延迟（毫秒）
}
```

## 监控与告警

### 使用 PM2 Plus（官方监控服务）

```bash
# 安装 PM2 Plus
pm2 plus

# 链接应用到 PM2 Plus
pm2 link <secret_key> <public_key> [app-name]
```

### 自定义监控脚本

```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
# 检查进程是否运行
if ! pm2 list | grep -q "ai-api.*online"; then
  echo "AI API is down! Restarting..."
  pm2 restart ai-api
  # 发送告警（邮件、钉钉、企业微信等）
fi
EOF

chmod +x monitor.sh

# 添加到 crontab（每5分钟检查一次）
crontab -e
# 添加: */5 * * * * /path/to/monitor.sh
```

## 安全建议

1. **使用非 root 用户运行**
   ```bash
   # 创建专用用户
   useradd -m -s /bin/bash ai-api
   su - ai-api
   ```

2. **限制文件权限**
   ```bash
   chmod 750 /www/wwwroot/api.yumanyi.top
   chown -R ai-api:ai-api /www/wwwroot/api.yumanyi.top
   ```

3. **使用防火墙限制访问**
   ```bash
   # 只允许 Nginx 反向代理访问
   iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
   iptables -A INPUT -p tcp --dport 3000 -j DROP
   ```

4. **定期更新依赖**
   ```bash
   npm audit          # 检查安全漏洞
   npm update         # 更新依赖
   ```

## 最佳实践总结

1. ✅ 始终使用 `ecosystem.config.js` 配置文件
2. ✅ 使用 `--env production` 指定生产环境
3. ✅ 更新代码后使用 `--update-env` 重启
4. ✅ 定期查看日志排查问题
5. ✅ 配置开机自启确保服务可用性
6. ✅ 使用 Nginx 反向代理（不要直接暴露端口）
7. ✅ 配置日志轮转避免磁盘爆满
8. ✅ 监控内存使用，设置自动重启阈值
9. ✅ 使用 HTTPS 加密通信
10. ✅ 定期备份数据库

## 快速参考

```bash
# 启动
npm run pm2:start

# 重启（代码更新后）
npm run pm2:restart

# 查看状态
npm run pm2:status

# 查看日志
npm run pm2:logs

# 停止
npm run pm2:stop

# 删除
npm run pm2:delete
```

---

**常见问题？** 查看日志找出原因：`npm run pm2:logs` 🚀
