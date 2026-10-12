const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-test-live-'));
const cdpPort = 9880 + Math.floor(Math.random() * 50);

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
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return null;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = new URL(wsUrl);
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const wsKey = Buffer.from('cdp_' + Date.now()).toString('base64');
      const req = http.request({
        hostname: this.wsUrl.hostname,
        port: this.wsUrl.port,
        path: this.wsUrl.pathname,
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
          'Sec-WebSocket-Key': wsKey,
          'Sec-WebSocket-Version': '13'
        }
      });
      req.on('upgrade', (res, socket) => {
        this.socket = socket;
        this.setupSocket();
        resolve();
      });
      req.on('error', reject);
      req.end();
    });
  }

  setupSocket() {
    let buffer = Buffer.alloc(0);
    this.socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 2) {
        const lenByte = buffer[1] & 0x7f;
        let offset = 2;
        let payloadLen = lenByte;
        if (lenByte === 126) {
          if (buffer.length < 4) break;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (lenByte === 127) {
          if (buffer.length < 10) break;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }
        if (buffer.length < offset + payloadLen) break;
        const payload = buffer.slice(offset, offset + payloadLen);
        buffer = buffer.slice(offset + payloadLen);
        try {
          const msg = JSON.parse(payload.toString('utf8'));
          if (msg.id && this.callbacks.has(msg.id)) {
            const cb = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            cb(msg);
          }
        } catch (e) {}
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, res => {
        if (res.error) reject(new Error(JSON.stringify(res.error)));
        else resolve(res.result);
      });
      const payload = JSON.stringify({ id, method, params });
      const payloadBuf = Buffer.from(payload, 'utf8');
      const len = payloadBuf.length;
      let header;
      if (len < 126) {
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
      const maskedPayload = Buffer.alloc(len);
      for (let i = 0; i < len; i++) {
        maskedPayload[i] = payloadBuf[i] ^ mask[i % 4];
      }
      this.socket.write(Buffer.concat([header, mask, maskedPayload]));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res && res.result ? res.result.value : null;
  }
}

async function run() {
  const browserProc = spawn(edgePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--window-size=1400,900',
    'http://127.0.0.1:8080/'
  ], { stdio: 'ignore' });

  try {
    const page = await getPage(cdpPort);
    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await new Promise(r => setTimeout(r, 1000));

    // Close mode modal and enter bot mode
    await client.eval(`(() => {
      const g = window.gameInstance;
      g.closeModeModal();
      g.setGameMode('bot');
      // Force P1 turn for clear view
      g.currentTurn = 1;
      g.cameraX = 0;
      g.cameraTargetX = 0;
      g.isCameraPanning = false;
      g.updateVersusUI();
    })()`);

    await new Promise(r => setTimeout(r, 800));

    const shotRes = await client.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0\\gameplay_live_verified.png';
    fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
    console.log('Saved gameplay screenshot to gameplay_live_verified.png');

    // Also trigger Ảo Ảnh to capture 3 identical poles
    await client.eval(`(() => {
      const g = window.gameInstance;
      g.activeDebuff.p1 = 'ao_anh';
      g.initAoAnhPoles();
      g.cameraX = 500; // Look at poles
    })()`);

    await new Promise(r => setTimeout(r, 400));
    const shotPoles = await client.send('Page.captureScreenshot', { format: 'png' });
    const shotPolesPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0\\ao_anh_identical_poles_verified.png';
    fs.writeFileSync(shotPolesPath, Buffer.from(shotPoles.data, 'base64'));
    console.log('Saved ao_anh poles screenshot to ao_anh_identical_poles_verified.png');

  } catch (err) {
    console.error(err);
  } finally {
    browserProc.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    process.exit(0);
  }
}

run();
