/**
 * 配置管理 - 环境变量加载
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

// 环境配置
const configs = {
  development: {
    rpc: process.env.BASE_RPC || 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
    testMode: true,
    executeEnabled: false,
    testAmount: parseInt(process.env.ARBITRAGE_TEST_AMOUNT) || 100,
    maxAmount: parseInt(process.env.ARBITRAGE_MAX_AMOUNT) || 1000,
  },
  test: {
    rpc: process.env.BASE_RPC_TEST || 'https://base-sepolia.g.alchemy.com/v2/YOUR_KEY',
    testMode: true,
    executeEnabled: false,
    testAmount: 100,
    maxAmount: 1000,
  },
  production: {
    rpc: process.env.BASE_RPC || 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
    testMode: false,
    executeEnabled: process.env.ENABLE_EXECUTE === 'true',
    testAmount: parseInt(process.env.ARBITRAGE_TEST_AMOUNT) || 1000,
    maxAmount: parseInt(process.env.ARBITRAGE_MAX_AMOUNT) || 50000,
  }
};

const config = configs[env] || configs.development;

// 加载 JSON 配置
const jsonConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8')
);

module.exports = {
  ...jsonConfig,
  ...config,
  env,
  isTest: config.testMode,
  isProduction: env === 'production',
  wallet: {
    privateKey: process.env.WALLET_PRIVATE_KEY || ''
  }
};
