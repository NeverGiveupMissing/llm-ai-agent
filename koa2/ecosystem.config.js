module.exports = {
  apps: [
    {
      name: 'ai-api',
      script: './src/app.js',
      cwd: '/www/wwwroot/api.yumanyi.top',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
      },
    },
  ],
}
