require('dotenv').config();
const config = require('./config');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    hardhat: {
      chainId: 31337
    },
    
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337
    },
    
    baseSepolia: {
      url: process.env.RPC_URL || 'https://sepolia.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 'auto'
    },
    
    base: {
      url: process.env.RPC_URL || 'https://mainnet.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 'auto'
    }
  },
  
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || '',
      baseSepolia: process.env.BASESCAN_API_KEY || ''
    }
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};
