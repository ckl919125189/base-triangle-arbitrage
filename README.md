# Base Triangle Arbitrage

智能合约和 Web 仪表盘，用于在 Base 链上执行三角套利交易。

## 功能特性

- 🔺 **三角套利** - 利用 DEX 间价格差异获利
- ⚡ **闪电贷支持** - 零资本启动套利策略
- 🛡️ **CEI 安全模式** - Checks-Effects-Interactions 安全模式
- 📊 **实时仪表盘** - 监控价格、机会和利润

## 快速开始

### 安装依赖

```bash
cd base-triangle-arbitrage
npm install
```

### 配置环境

1. 复制环境配置示例：
```bash
cp config/.env.example config/.env
```

2. 编辑 `config/.env` 填入配置

3. 对于测试网络，使用 `config/.env.test`

### 编译合约

```bash
npm run compile
```

### 运行测试

```bash
npm test
```

带覆盖率：
```bash
npm run test:coverage
```

### 部署

本地测试网络：
```bash
npm run node
npm run deploy:local
```

Base Sepolia 测试网：
```bash
npm run deploy:testnet
```

Base 主网：
```bash
npm run deploy:mainnet
```

### 启动仪表盘

```bash
npm run dashboard
```

访问 http://localhost:3000

## 项目结构

```
base-triangle-arbitrage/
├── contracts/          # 智能合约
│   ├── Arbitrage.sol   # 主套利合约
│   └── mocks/          # 测试用 Mock 合约
├── scripts/            # 部署脚本
│   └── deploy.js
├── src/
│   └── dashboard/      # Web 仪表盘
├── test/               # 测试文件
├── config/             # 配置文件
│   ├── config.js       # 配置加载器
│   ├── .env.example   # 环境变量示例
│   ├── .env.test      # 测试环境
│   └── .env.production # 生产环境
├── hardhat.config.js
└── package.json
```

## 配置说明

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `RPC_URL` | Base 链 RPC | http://localhost:8545 |
| `PRIVATE_KEY` | 部署钱包私钥 | - |
| `SWAP_ROUTER` | Uniswap V3 Router | Base 链地址 |
| `FEE_COLLECTOR` | 手续费收取地址 | 部署地址 |
| `MIN_PROFIT_THRESHOLD` | 最小利润阈值 | 0.001 ETH |
| `SLIPPAGE_TOLERANCE` | 滑点容忍度 | 300 (3%) |

## 安全注意事项

⚠️ **警告**: 套利交易存在风险，请确保：
1. 充分测试合约
2. 设置合理的滑点参数
3. 监控市场波动
4. 小资金先验证策略

## 许可证

MIT
