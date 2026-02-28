/**
 * Base 三角套利扫描器
 * 路由: USDT → ETH → WBTC → USDT
 */
const axios = require('axios');

class TriangleArbitrageScanner {
  constructor(config) {
    this.config = config;
    this.route = config.arbitrage.route; // ["USDT", "ETH", "WBTC", "USDT"]
    this.prices = {};
    this.cache = new Map();
    this.cacheTime = 5000;
  }

  /**
   * 获取代币价格（通过 Base 上的 DEX）
   */
  async getPrice(token, baseToken = 'USDT') {
    const cacheKey = `${token}-${baseToken}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTime) {
      return cached.price;
    }

    // 模拟价格（实际需要从 DEX 获取）
    const mockPrices = {
      'ETH-USDT': 1940,
      'WBTC-USDT': 66000,
      'USDT-USDT': 1
    };

    const pair = `${token}-${baseToken}`;
    const price = mockPrices[pair] || this.getSimulatedPrice(token);

    this.cache.set(cacheKey, { price, time: Date.now() });
    return price;
  }

  getSimulatedPrice(token) {
    const prices = {
      'ETH': 1940 + (Math.random() - 0.5) * 10,
      'WBTC': 66000 + (Math.random() - 0.5) * 500,
      'USDT': 1
    };
    return prices[token] || 1000;
  }

  /**
   * 扫描三角套利机会
   */
  async scan() {
    const [token0, token1, token2, token3] = this.route;
    const amount = this.config.arbitrage.testAmount;

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🔍 Base 三角套利扫描器 v1.0                         ║
╠═══════════════════════════════════════════════════════════════╣
║  路由: ${token0} → ${token1} → ${token2} → ${token0}                      ║
║  测试金额: $${amount}                                             ║
╚═══════════════════════════════════════════════════════════════╝
`);

    // 获取各交易对价格
    const price1 = await this.getPrice(token1, token0); // USDT → ETH
    const price2 = await this.getPrice(token2, token1); // ETH → WBTC
    const price3 = await this.getPrice(token0, token2); // WBTC → USDT

    this.prices = {
      [token0]: { [token1]: price1 },
      [token1]: { [token2]: price2 },
      [token2]: { [token0]: price3 }
    };

    console.log('\n📊 当前价格:');
    console.log(`   ${token0}/${token1}: $${price1.toFixed(2)}`);
    console.log(`   ${token1}/${token2}: $${price2.toFixed(2)}`);
    console.log(`   ${token2}/${token0}: $${price3.toFixed(2)}`);

    // 计算三角套利
    const result = this.calculateTriangle(amount, price1, price2, price3);

    if (result.profitable) {
      console.log(`
🎯 发现套利机会！
═══════════════════════════════════════════════════════════════
  路径: ${token0} → ${token1} → ${token2} → ${token0}
  输入: $${amount}
  输出: $${result.output.toFixed(2)}
  利润: $${result.profit.toFixed(2)} (${result.profitPercent.toFixed(2)}%)
  Gas估算: ~$${result.gasCost.toFixed(2)}
  净利润: $${result.netProfit.toFixed(2)}
═══════════════════════════════════════════════════════════════
`);
      return result;
    } else {
      console.log('\n❌ 暂无可盈利机会');
      console.log(`   预计亏损: $${Math.abs(result.netProfit).toFixed(2)}`);
      return null;
    }
  }

  /**
   * 计算三角套利利润
   */
  calculateTriangle(amount, price1, price2, price3) {
    const gasCost = 5; // 估计 Gas 成本

    // 步骤 1: USDT → ETH
    const step1 = amount / price1;

    // 步骤 2: ETH → WBTC
    const step2 = step1 * price2;

    // 步骤 3: WBTC → USDT
    const step3 = step2 * price3;

    const output = step3;
    const profit = output - amount;
    const profitPercent = (profit / amount) * 100;
    const netProfit = profit - gasCost;

    const minProfit = this.config.arbitrage.minProfitPercent;
    const maxProfit = this.config.arbitrage.maxProfitPercent;

    return {
      amount,
      output,
      profit,
      profitPercent,
      gasCost,
      netProfit,
      profitable: netProfit > 0 && profitPercent >= minProfit && profitPercent <= maxProfit,
      inRange: profitPercent >= minProfit && profitPercent <= maxProfit,
      path: this.route
    };
  }

  /**
   * 估算执行成本
   */
  estimateGas() {
    // Base 上典型交易 Gas
    return {
      swap: 0.001, // ETH
      approve: 0.001,
      flashLoan: 0.002,
      total: 0.004 // 约 $5-10
    };
  }
}

module.exports = TriangleArbitrageScanner;
