# ⚡ Base 三角套利机器人

> Base 链闪电贷三角套利 - 稳定复利策略

## 策略说明

### 为什么选择这个策略？

| 特点 | 说明 |
|------|------|
| 🔄 三角套利 | USDT → ETH → WBTC → USDT 闭环 |
| ⚡ 闪电贷 | 无需自有资金，借用即还 |
| ⛓️ Base | 低 Gas 费用，快速确认 |
| 💰 稳定 | 0.3%-2% 小额复利 |

### 策略优势

1. **风险低** - 三角套利是中性策略，价格会自动回归
2. **不需要资金** - 闪电贷，借用资金执行套利
3. **Gas 低** - Base 链 Gas 极低
4. **稳定复利** - 小额多次，积少成多

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ckl919125189/base-triangle-arbitrage.git
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
  "rpc": "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
  "wallet": {
    "privateKey": "0xyour_private_key"
  },
  "arbitrage": {
    "testAmount": 100,
    "minProfitPercent": 0.3,
    "maxProfitPercent": 2.0
  }
}
```

### 4. 运行

```bash
# 测试模式
npm start
```

## 配置说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| testAmount | 测试金额 | 100 USDT |
| minProfitPercent | 最小利润 | 0.3% |
| maxProfitPercent | 最大利润 | 2.0% |
| interval | 扫描间隔 | 3000ms |

## 路由说明

```
USDT → ETH → WBTC → USDT

1. 用 USDT 买入 ETH
2. 用 ETH 买入 WBTC
3. 用 WBTC 换回 USDT
4. 归还闪电贷 + 费用
5. 赚取差价
```

## 收入预估

| 金额 | 利润0.5% | 利润1% | 利润2% |
|------|----------|--------|--------|
| $100 | $0.5 | $1 | $2 |
| $1,000 | $5 | $10 | $20 |
| $10,000 | $50 | $100 | $200 |

## 重要提醒

⚠️ **风险提示**：

1. **智能合约风险** - 需要部署合约，建议先审计
2. **滑点风险** - 大额交易会有滑点
3. **Gas 波动** - Base Gas 也会波动
4. **MEV** - 可能被夹子机器人抢先

**建议**：
- 先用小额测试
- 确认安全后再加大金额
- 关注 Gas 费用

## 项目结构

```
base-triangle-arbitrage/
├── src/
│   ├── index.js      # 主入口
│   ├── scanner.js    # 套利扫描
│   └── executor.js   # 执行器
├── tests/
│   └── arbitrage.test.js
├── config.example.json
└── README.md
```

## 技术栈

- Node.js
- Ethers.js
- Aave V3 (闪电贷)

## 后续计划

- [ ] 部署智能合约
- [ ] 添加更多路由
- [ ] 支持多链
- [ ] 添加 Web 仪表盘

## 许可证

MIT
