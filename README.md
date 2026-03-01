# ⚡ Base 三角套利机器人

> Base 链闪电贷三角套利 - 稳定复利策略

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-%3E%3D0.8.19-blue)](https://soliditylang.org/)

## 📋 项目概述

本项目实现 **Base 链** 上的 **闪电贷三角套利** 机器人。

### 核心策略

```
┌─────────────────────────────────────────────────────────────┐
│                    三角套利路径                              │
│                                                             │
│   USDT ──▶ ETH ──▶ WBTC ──▶ USDT                           │
│    ↑                                        │              │
│    └────────────────────────────────────────┘              │
│                    (闭环)                                    │
└─────────────────────────────────────────────────────────────┘

1️⃣ 用 USDT 买入 ETH
2️⃣ 用 ETH 买入 WBTC  
3️⃣ 用 WBTC 换回 USDT
4️⃣ 归还闪电贷 + 费用
5️⃣ 赚取差价利润
```

### 目标收益

| 指标 | 数值 |
|------|------|
| 最小利润 | 0.3% |
| 最大利润 | 2.0% |
| 单次Gas | ~$5-10 |
| 链 | Base |

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn
- 钱包私钥（用于部署合约和执行）
- Base RPC URL（推荐 Alchemy/Infura）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/base-triangle-arbitrage.git
cd base-triangle-arbitrage
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置

```bash
cp config.example.json config.json
```

编辑 `config.json`:

```json
{
  "name": "base",
  "chainId": 8453,
  "rpc": "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
  "explorer": "https://basescan.org",
  
  "tokens": {
    "USDT": "0x4e5aF12fE1a6f1E1a3aF1c2E3D4F5A6B7C8D9E0",
    "ETH": "0x4200000000000000000000000000000000000006",
    "WBTC": "0x47aB3bCD6f2A2E7b6cF3eD4E5F6A7B8C9D0E1F2"
  },

  "dexes": {
    "uniswap": {
      "router": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      "factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    },
    "baseswap": {
      "router": "0x327Df1E6D0585c5492a3cC8c3aB5847B9C7d9E4",
      "factory": "0x70C4726a14F85E12D29d5A73C8C1e1E0A3B7cD6"
    }
  },

  "flashLoan": {
    "provider": "aave-v3",
    "pool": "0xA238Dd80C259a72e81d7e9314Ae79880607cE185"
  },

  "arbitrage": {
    "route": ["USDT", "ETH", "WBTC", "USDT"],
    "minProfitPercent": 0.3,
    "maxProfitPercent": 2.0,
    "testAmount": 100,
    "maxAmount": 10000,
    "gasCost": 5
  },

  "monitor": {
    "interval": 3000,
    "priceCacheTime": 5000,
    "priceCheckRetry": 3
  }
}
```

### 4. 运行

```bash
# 开发/测试模式（模拟价格）
npm start

# 测试模式
npm test
```

## 📁 项目结构

```
base-triangle-arbitrage/
├── contracts/              # Solidity 智能合约
│   └── TriangleArbitrage.sol
├── src/                   # 核心逻辑
│   ├── index.js           # 主入口
│   ├── scanner.js         # 套利扫描器
│   └── executor.js        # 闪电贷执行器
├── tests/                 # 测试用例
│   └── arbitrage.test.js
├── config.example.json    # 配置示例
├── package.json
└── README.md
```

## 🔧 组件说明

### 1. Scanner (扫描器)
- `src/scanner.js`
- 职责：监控各 DEX 价格
- 计算三角套利利润
- 判断是否满足执行条件

### 2. Executor (执行器)
- `src/executor.js`
- 职责：初始化钱包连接
- 执行闪电贷交易
- 风险控制

### 3. Smart Contract (智能合约)
- `contracts/TriangleArbitrage.sol`
- 职责：处理闪电贷回调
- 执行三角兑换
- 利润结算

## 📊 收入预估

| 投入金额 | 0.5% 利润 | 1% 利润 | 2% 利润 |
|---------|----------|--------|--------|
| $100    | $0.50    | $1.00  | $2.00  |
| $1,000  | $5.00    | $10.00 | $20.00 |
| $10,000 | $50.00   | $100.00| $200.00|

**注意**: 以上为理想情况，需扣除 Gas 费用

## ⚠️ 风险提示

1. **智能合约风险** - 建议先审计合约
2. **滑点风险** - 大额交易有滑点损耗
3. **Gas 波动** - Base Gas 也会波动
4. **MEV 风险** - 可能被夹子机器人抢先
5. **价格波动** - 价格可能在交易时变动

**建议**:
- ✅ 先用小额 ($100-500) 测试
- ✅ 确认安全后再加大金额
- ✅ 监控 Gas 费用
- ✅ 设置合理的滑点

## 🛠️ 部署智能合约

### 1. 编译合约

```bash
npx hardhat compile
```

### 2. 部署到 Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
```

### 3. 验证合约

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

## 📝 开发说明

### 添加真实价格源

在 `scanner.js` 中替换 `getSimulatedPrice`:

```javascript
async getPriceFromDEX(tokenA, tokenB) {
  // 1. 使用 Uniswap V3 Quoter
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
  
  const params = {
    tokenIn: tokenA,
    tokenOut: tokenB,
    amountIn: ethers.parseEther('1'),
    fee: 3000,
    sqrtPriceLimitX96: 0
  };
  
  const quote = await quoter.quoteExactInputSingle(params);
  return parseFloat(ethers.formatEther(quote.amountOut));
}
```

### 支持更多路由

修改 `config.json`:

```json
{
  "arbitrage": {
    "route": ["USDC", "ETH", "USDC"]
  }
}
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Aave](https://aave.com/) - 闪电贷
- [Uniswap](https://uniswap.org/) - DEX 路由
- [Base](https://base.org/) - L2 网络

---

**⚡ 用爱发电，谨慎使用**
