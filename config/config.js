/**
 * Configuration loader
 * Reads environment variables and provides config object
 */

const fs = require('fs');
const path = require('path');

// Load environment file based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, `.env.${env}`);

// Default to .env if .env.{env} doesn't exist
let envFilePath = envFile;
if (!fs.existsSync(envFilePath)) {
  envFilePath = path.join(__dirname, '.env');
}

require('dotenv').config({ path: envFilePath });

const config = {
  // Network
  network: env || 'development',
  
  // RPC URLs
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  
  // Private key (without 0x prefix)
  privateKey: process.env.PRIVATE_KEY || '',
  
  // Contract addresses
  swapRouter: process.env.SWAP_ROUTER || '0x1FEd653d9b6679d0a85d1d7A42C4FA214f29C608',
  feeCollector: process.env.FEE_COLLECTOR || '',
  
  // Flash loan provider (optional)
  aavePool: process.env.AAVE_POOL || '0xA238Dd80C259a72e5d7f8a4d06FC6285dD7B1E66',
  
  // Trading params
  minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.001'),
  slippageTolerance: parseInt(process.env.SLIPPAGE_TOLERANCE || '300', 10),
  
  // Gas settings
  gasPrice: process.env.GAS_PRICE || 'auto',
  gasLimit: parseInt(process.env.GAS_LIMIT || '500000', 10),
  
  // Dashboard
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || '3000', 10),
  dashboardHost: process.env.DASHBOARD_HOST || 'localhost',
  
  // Monitoring
  priceUpdateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL || '5000', 10),
  maxSlippage: parseInt(process.env.MAX_SLIPPAGE || '500', 10),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // API keys (optional)
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  basescanApiKey: process.env.BASESCAN_API_KEY || '',
};

module.exports = config;
