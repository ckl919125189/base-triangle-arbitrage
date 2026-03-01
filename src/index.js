/**
 * Base 三角套利机器人 - 主入口
 */
const config = require('./config');
const TriangleArbitrageScanner = require('./scanner');
const FlashLoanExecutor = require('./executor');
const Dashboard = require('./dashboard');

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ⚡ Base 三角套利机器人 v1.1                           ║
║                                                               ║
║     环境: ${config.env.padEnd(50)}║
║     路由: USDT → ETH → WBTC → USDT                    ║
║     目标: 0.3% - 2% 稳定收益                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // 初始化组件
  const scanner = new TriangleArbitrageScanner(config);
  const executor = new FlashLoanExecutor(config);
  const dashboard = new Dashboard(config.dashboard?.port || 3000);

  // 初始化执行器
  const initialized = await executor.initialize();
  if (!initialized) {
    console.log('⚠️ 执行器未初始化（无私钥）');
  }

  // 启动
  if (config.isProduction) {
    console.log('🔴 生产模式 - 启用真实交易');
  } else {
    console.log('🟢 测试模式 - 仅监控');
  }

  executor.start();
  dashboard.start();

  // 扫描循环
  let scanCount = 0;
  async function scan() {
    scanCount++;
    console.log(`\n[${scanCount}] 扫描...`);
    const opp = await scanner.scan();
    dashboard.update(opp);

    if (opp && executor.isRunning && config.isProduction && initialized) {
      const { shouldExecute, reason } = executor.shouldExecute(opp);
      if (shouldExecute) {
        console.log('\n✅ 执行套利...');
        await executor.execute(opp);
      }
    }
  }

  // 启动扫描
  await scan();
  const interval = setInterval(scan, config.monitor.interval);

  process.on('SIGINT', () => {
    console.log('\n🛑 关闭...');
    executor.stop();
    dashboard.stop();
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch(console.error);
