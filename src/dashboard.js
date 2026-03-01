/**
 * Web Dashboard - 实时监控界面
 */
const http = require('http');
const path = require('path');

class Dashboard {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.stats = {
      startTime: Date.now(),
      scans: 0,
      opportunities: 0,
      profitable: 0,
      totalProfit: 0
    };
  }

  start() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/api/stats') {
        res.end(JSON.stringify({
          ...this.stats,
          uptime: this.getUptime(),
          timestamp: Date.now()
        }));
      } else if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getHTML());
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`📊 Dashboard: http://localhost:${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }

  update(opportunity) {
    this.stats.scans++;
    if (opportunity) {
      this.stats.opportunities++;
      if (opportunity.profitable) {
        this.stats.profitable++;
        this.stats.totalProfit += opportunity.profit || 0;
      }
    }
  }

  getUptime() {
    const ms = Date.now() - this.stats.startTime;
    const s = Math.floor(ms / 1000);
    return s < 60 ? `${s}秒` : `${Math.floor(s/60)}分钟`;
  }

  getHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Base 三角套利监控</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff; min-height: 100vh; padding: 20px;
    }
    h1 { text-align: center; color: #00ff88; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
    .card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; backdrop-filter: blur(10px); }
    .card h3 { color: #888; font-size: 14px; margin-bottom: 10px; }
    .card .value { font-size: 32px; font-weight: bold; color: #00ff88; }
    .status { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
    .status-item { background: rgba(0,255,136,0.2); padding: 10px 20px; border-radius: 20px; }
    .status-item.active { background: #00ff88; color: #000; }
    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .live { animation: pulse 2s infinite; color: #00ff88; }
  </style>
</head>
<body>
  <h1>⚡ Base 三角套利监控 <span class="live">● LIVE</span></h1>
  <div class="grid">
    <div class="card"><h3>运行时间</h3><div class="value" id="uptime">-</div></div>
    <div class="card"><h3>扫描次数</h3><div class="value" id="scans">0</div></div>
    <div class="card"><h3>发现机会</h3><div class="value" id="opps">0</div></div>
    <div class="card"><h3>盈利次数</h3><div class="value" id="profit">0</div></div>
    <div class="card"><h3>总利润</h3><div class="value" id="total">$0</div></div>
  </div>
  <div class="status">
    <div class="status-item active">🔴 监控中</div>
  </div>
  <div class="footer">更新于 <span id="time">-</span></div>
  <script>
    async function update() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('uptime').textContent = data.uptime;
        document.getElementById('scans').textContent = data.scans;
        document.getElementById('opps').textContent = data.opportunities;
        document.getElementById('profit').textContent = data.profitable;
        document.getElementById('total').textContent = '$' + data.totalProfit.toFixed(2);
        document.getElementById('time').textContent = new Date(data.timestamp).toLocaleTimeString();
      } catch(e) { console.error(e); }
    }
    update();
    setInterval(update, 3000);
  </script>
</body>
</html>`;
  }
}

module.exports = Dashboard;
