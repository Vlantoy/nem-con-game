const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-hidden-'));
const cdpPort = 9800 + Math.floor(Math.random() * 150);

async function getPage(port) {
  for (let i = 0; i < 50; i++) {
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
          if (msg.id && this.callbacks.has(msg.id)) {
            const cb = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
          }
        } catch (e) {}
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
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
      for (let i = 0; i < len; i++) {
        masked[i] = payloadBuf[i] ^ mask[i % 4];
      }

      this.socket.write(Buffer.concat([header, mask, masked]));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res && res.result ? res.result.value : null;
  }
}

async function run() {
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
    throw new Error('No page found');
  }

  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();

  // Wait for game initialization and asset loading
  for (let wait = 0; wait < 60; wait++) {
    const isReady = await client.eval(`typeof window.game !== 'undefined' && window.game.assetsLoaded >= window.game.totalAssets && window.game.totalAssets > 0 && !!window.game.skills`);
    if (isReady) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Set game mode to bot, close modal, switch to bot's turn, and activate Bot's secret skill
  const evalResult = await client.eval(`
    (() => {
      try {
        window.game.setGameMode('bot');
        window.game.closeModeModal();
        const modal = document.getElementById('modal-mode');
        if (modal) {
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }

        // Switch to Bot's turn
        window.game.currentTurn = 2;
        window.game.state = 1; // STATE.IDLE
        window.game.cameraX = 1060;
        window.game.cameraTargetX = 1060;
        window.game.updateSkillsUI();

        // Activate Bot's first secret skill
        window.game.activateSkill('p2', 0);

        // Also show secret tooltip on Bot's slot 1
        const botSlot1 = document.querySelector('#p2-skills-slots .skill-card-btn');
        if (botSlot1) {
          botSlot1.classList.add('show-tooltip');
        }

        return {
          currentTurn: window.game.currentTurn,
          p2SkillUsed: window.game.skillUsedThisTurn.p2,
          p2TrayStatus: window.game.ui.p2TrayStatus ? window.game.ui.p2TrayStatus.textContent : null,
          announcementTitle: window.game.ui.announcementTitle ? window.game.ui.announcementTitle.textContent : null,
          announcementDesc: window.game.ui.announcementDesc ? window.game.ui.announcementDesc.textContent : null
        };
      } catch (err) {
        return { error: err.stack || err.message };
      }
    })()
  `);
  console.log('Eval result:', evalResult);

  await new Promise(r => setTimeout(r, 800));

  // Take screenshot
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    const imgBuffer = Buffer.from(screenshot.data, 'base64');
    const destPath = path.join(artifactDir, 'bot_hidden_skills_verified.png');
    fs.writeFileSync(destPath, imgBuffer);
    console.log('Saved screenshot to:', destPath);
  }

  try {
    client.socket.destroy();
  } catch (e) {}
  edge.kill();
}

run().catch(console.error);
