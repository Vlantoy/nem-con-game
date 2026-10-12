const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-snap-'));
const cdpPort = 9700 + Math.floor(Math.random() * 200);

async function getPage(port) {
  for (let i = 0; i < 25; i++) {
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
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return null;
}

async function main() {
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--user-data-dir=' + tempDir,
    '--window-size=1280,720',
    '--disable-gpu',
    'http://127.0.0.1:8080/'
  ]);

  const page = await getPage(cdpPort);
  if (!page) {
    edge.kill();
    process.exit(1);
  }

  const wsUrl = new URL(page.webSocketDebuggerUrl);
  const wsKey = Buffer.from('snap' + Date.now()).toString('base64');

  const req = http.request({
    hostname: wsUrl.hostname,
    port: wsUrl.port,
    path: wsUrl.pathname,
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket',
      'Sec-WebSocket-Key': wsKey,
      'Sec-WebSocket-Version': '13'
    }
  });

  req.on('upgrade', (res, socket) => {
    let msgId = 1;
    function send(method, params = {}) {
      const id = msgId++;
      const json = JSON.stringify({ id, method, params });
      const payloadBuf = Buffer.from(json);
      const len = payloadBuf.length;
      let header;
      if (len <= 125) {
        header = Buffer.from([0x81, 0x80 | len]);
      } else if (len <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 0x80 | 126;
        header.writeUInt16BE(len, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(len), 2);
      }
      const mask = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      const masked = Buffer.alloc(len);
      for (let i = 0; i < len; i++) masked[i] = payloadBuf[i] ^ mask[i % 4];
      socket.write(Buffer.concat([header, mask, masked]));
      return id;
    }

    let buffer = Buffer.alloc(0);
    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 2) {
        const secondByte = buffer[1];
        let payloadLen = secondByte & 0x7f;
        let offset = 2;
        if (payloadLen === 126) {
          if (buffer.length < 4) break;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) break;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }
        if (buffer.length < offset + payloadLen) break;
        const payload = buffer.slice(offset, offset + payloadLen);
        buffer = buffer.slice(offset + payloadLen);
        try {
          const msg = JSON.parse(payload.toString('utf8'));
          if (msg.result && msg.result.data) {
            const imgBuffer = Buffer.from(msg.result.data, 'base64');
            const destPath = path.join(artifactDir, 'all_skills_smooth_verified.png');
            fs.writeFileSync(destPath, imgBuffer);
            console.log('Saved screenshot to:', destPath);
            edge.kill();
            process.exit(0);
          }
        } catch (e) {}
      }
    });

    // Poll until game is fully loaded and ready
    const checkInterval = setInterval(() => {
      send('Runtime.evaluate', {
        expression: `
          (() => {
            if (window.game && window.game.state !== 'loading' && window.game.skills) {
              window.game.setGameMode('bot');
              window.game.closeModeModal();
              window.game.activateSkill('p1', 0);
              return true;
            }
            return false;
          })()
        `,
        returnByValue: true
      });
    }, 400);

    setTimeout(() => {
      clearInterval(checkInterval);
      send('Page.captureScreenshot', { format: 'png' });
    }, 3800);
  });

  req.end();
}

main().catch(console.error);
