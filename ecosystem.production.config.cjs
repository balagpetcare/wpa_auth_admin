// PM2 production process manager config for WPA Central Auth Admin.
//
// This file intentionally contains NO secrets. Environment variables must be
// supplied by the deployment process (real .env file, systemd EnvironmentFile,
// secrets manager, or PM2 env injection). Do not hardcode populated values.
//
// Usage:
//   pm2 start ecosystem.production.config.cjs --env production
//   pm2 status
//   pm2 logs wpa-auth-admin
//   pm2 reload wpa-auth-admin
//
// Build first:
//   npm run build

module.exports = {
  apps: [
    {
      name: 'wpa-auth-admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5012',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      out_file: './logs/wpa-auth-admin.out.log',
      error_file: './logs/wpa-auth-admin.error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
