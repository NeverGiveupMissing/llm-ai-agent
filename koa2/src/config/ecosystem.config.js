/**
 * PM2 生态系统配置文件
 * 用于生产环境部署和管理 Koa2 应用
 * 路径：koa2/src/config/ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'ai-api',
      
      // 入口文件（相对于项目根目录）
      script: './src/app.js',
      
      // 实例数量（cluster 模式）
      // 'max' 表示使用所有 CPU 核心
      // 也可以设置为具体数字，如 2、4 等
      instances: 1,
      
      // 执行模式：cluster（集群）或 fork（单进程）
      exec_mode: 'fork',
      
      // 环境变量配置
      env: {
        NODE_ENV: 'development',
        PORT: 65432,
        HOST: '0.0.0.0',
      },
      
      // 生产环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 65432,
        HOST: '0.0.0.0',
      },
      
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      
      // 自动重启配置
      watch: false, // 生产环境不启用文件监听
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // 最大内存限制（超过则自动重启）
      max_memory_restart: '500M',
      
      // 最小运行时间（防止快速重启循环）
      min_uptime: '10s',
      
      // 最大重启次数
      max_restarts: 10,
      
      // 重启延迟
      restart_delay: 4000,
      
      // 优雅关闭超时时间
      kill_timeout: 5000,
      
      // 等待就绪状态的时间
      wait_ready: true,
      
      // 监听端口（可选，用于健康检查）
      listen_timeout: 3000,
    },
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'root',
      host: '8.153.193.2',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/ai-api',
      'post-deploy': 'npm install && pm2 reload src/config/ecosystem.config.js --env production',
    },
  },
}
