const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-snap-'));
const cdpPort = 9500 + Math.floor(Math.random() * 400);

async function getPage(port) {
  for (let i = 0; i < 20; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json`, res => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => resolve(b));
        });
        req.on('error', reject);
      });
      const targets = JSON.parse(data);
      const page = targets.find(t => t.type === 'page');
      if (page) return page;
    } catch (e) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return null;
}

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--user-data-dir=' + tempDir,
    '--window-size=1280,720',
    '--disable-gpu',
    'http://127.0.0.1:8080/?skin=nam_tay_khoe_khoan'
  ]);

  const page = await getPage(cdpPort);
  if (!page) {
    chrome.kill();
    console.error('Could not find Chrome page');
    process.exit(1);
  }

  const wsUrl = new URL(page.webSocketDebuggerUrl);
  const wsKey = Buffer.from('snap' + Date.now()).toString('base64');

  const client = http.request({
    hostname: wsUrl.hostname,
    port: wsUrl.port,
    path: wsUrl.pathname,
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket',
      'Sec-WebSocket-Key': wsKey,
      'Sec-WebSocket-Version': 13
    }
  });

      let reqId = 1;
      const callbacks = {};

      client.on('upgrade', (response, socket) => {
        function send(method, params = {}) {
          return new Promise(resolve => {
            const id = reqId++;
            callbacks[id] = resolve;
            const msg = JSON.stringify({ id, method, params });
            const length = Buffer.byteLength(msg);
            const frame = Buffer.alloc(length + 6);
            frame[0] = 0x81;
            frame[1] = 0x80 | length;
            frame.writeUInt32BE(0x12345678, 2);
            for (let i = 0; i < length; i++) {
              frame[6 + i] = msg.charCodeAt(i) ^ frame[2 + (i % 4)];
            }
            socket.write(frame);
          });
        }

        let buffer = Buffer.alloc(0);
        socket.on('data', chunk => {
          buffer = Buffer.concat([buffer, chunk]);
          while (buffer.length >= 2) {
            let offset = 2;
            let len = buffer[1] & 0x7F;
            if (len === 126) {
              if (buffer.length < 4) break;
              len = buffer.readUInt16BE(2);
              offset = 4;
            } else if (len === 127) {
              if (buffer.length < 10) break;
              len = Number(buffer.readBigUInt64BE(2));
              offset = 10;
            }
            if (buffer.length < offset + len) break;
            const payload = buffer.slice(offset, offset + len).toString('utf8');
            buffer = buffer.slice(offset + len);
            try {
              const res = JSON.parse(payload);
              if (res.id && callbacks[res.id]) {
                callbacks[res.id](res);
                delete callbacks[res.id];
              }
            } catch (e) {}
          }
        });

        (async () => {
          await new Promise(r => setTimeout(r, 1000));
          await send('Runtime.evaluate', {
            expression: `
              const btn = document.getElementById('btn-start-game');
              if (btn) btn.click();
            `
          });
          // Wait 2 seconds for gameplay canvas to be visible
          await new Promise(r => setTimeout(r, 2000));
          const snap = await send('Page.captureScreenshot', { format: 'png' });
          if (snap && snap.result && snap.result.data) {
            const outPath = path.join(artifactDir, 'male_idle_hang_verified.png');
            fs.writeFileSync(outPath, Buffer.from(snap.result.data, 'base64'));
            console.log('SUCCESS: male_idle_hang_verified.png saved!');
          }
          chrome.kill();
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
          process.exit(0);
        })();
      });

      client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
