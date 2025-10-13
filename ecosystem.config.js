const commonEnv = {
  NODE_ENV: 'development',
  DATABASE_URL:
    'postgresql://postgres:123456@localhost:5432/reseller_new?schema=public',
  FTP_BASE_URL: 'https://media.shopbdresellerjob.com/ftp_dev',
  FTP_HOST: 'ftp.shopbdresellerjob.com',
  FTP_USER: 'ftp_dev@media.shopbdresellerjob.com',
  FTP_PASSWORD: 'xkhb2pv6bpl0d08z',
  JWT_SECRET:
    '062680b800891db0fea8ab06c00629f0fe5ed58fe8ca04c7da92793809c51d7dcd86d24326a7b72f0ba07d3456840628ae84a9827a6e9143b835ca131a94cbd2',
  SALT_ROUNDS: 12,
  SMS: 'true',
  FRAUD_CHECKER_TOKEN: 'c5a6642db13652a9e0d0087f1fb26081',
  WELCOME_BONUS_AMOUNT: 20,
  ACTIVATE_WELCOME_BONUS_FOR_NEW_SELLER: 'true',
  FTP_BLOOM_PATH: '/data/bloom-filters/production-filter.json',
  ZINIPAY_KEY: 'da611317523059c38dbe6f3edb49284a21f647d555cfa9a8',
  ZINIPAY_AUTH_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNDI3NDIwZS1kMjU4LTRmMmYtOGExYi05YTU1NDA1YTE5YzYiLCJlbWFpbCI6Im1vc2FycmZiaW5zaXJhekBnbWFpbC5jb20iLCJpYXQiOjE3NTI0MTM3MjIsImV4cCI6MTc1NTAwNTcyMn0.qiEfMw-bcid7np8BsXTNhQDXnG9Omf357tG52GB030c',
}

module.exports = {
  apps: [
    3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011,
  ].map(port => ({
    name: `reseller-server-${port}`,
    script: './dist/server.js',
    instances: 1,
    env: {
      PORT: port,
      ...commonEnv,
    },
    error_file: `./logs/err-${port}.log`,
    out_file: `./logs/out-${port}.log`,
    log_file: `./logs/combined-${port}.log`,
    time: true,
  })),
}
