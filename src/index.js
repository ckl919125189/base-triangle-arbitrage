/**
 * Base 三角套利机器人 - 主入口
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.log('📝 请先复制 config.example.json 为 config.json 并配置');
  process.exit(1);
}

const TriangleArbitrageScanner = require('./scanner');
const FlashLoanExecutor = require('./executor');

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ⚡ Base 三角套利机器人 v1.0                           ║
║                                                               ║
║     路由: USDT → ETH → WBTC → USDT                        ║
║     目标: 0.3% - 2% 稳定收益                                 ║
║     链:   Base                                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // 初始化扫描器
  const scanner = new TriangleArbitrageScanner(config);

  // 初始化执行器
  const executor = new FlashLoanExecutor(config);
  await executor.initialize();

  // 扫描循环
  let scanCount = 0;

  async function scanLoop() {
    scanCount++;
    console.log(`\n[${scanCount}] 扫描...`);

    const opportunity = await scanner.scan();

    if (opportunity && executor.isRunning) {
      const { shouldExecute, reason } = executor.shouldExecute(opportunity);

      if (shouldExecute) {
        console.log('\n✅ 满足执行条件，执行闪电贷...');
        await executor.execute(opportunity);
      } else {
        console.log(`\n⏭️  跳过: ${reason}`);
      }
    }
  }

  // 启动扫描
  executor.start();
  await scanLoop();

  // 定期扫描
  const interval = setInterval(async () => {
    await scanLoop();
  }, config.monitor.interval);

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭...');
    executor.stop();
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch(console.error);
