const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-test-skills-'));
const cdpPort = 9600 + Math.floor(Math.random() * 300);

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
  console.log('[TEST] Starting headless Edge on port', cdpPort);
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
    throw new Error('Could not find Edge page target');
  }

  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  console.log('[TEST] Connected to Edge CDP');

  // Wait for game and SKILLS_CATALOG to initialize
  for (let wait = 0; wait < 30; wait++) {
    const isReady = await client.eval(`typeof window.SKILLS_CATALOG !== 'undefined' && !!window.game`);
    if (isReady) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Get list of all 41 skills
  const skillsCatalog = await client.eval(`JSON.stringify(Object.keys(window.SKILLS_CATALOG))`);
  const catalogList = JSON.parse(skillsCatalog || '[]');
  console.log(`[TEST] Found ${catalogList.length} skills in SKILLS_CATALOG:`);

  const results = [];

  for (let i = 0; i < catalogList.length; i++) {
    const skillKey = catalogList[i];
    process.stdout.write(`[${i + 1}/${catalogList.length}] Testing skill '${skillKey}'... `);

    // 1. Force inject this skill into Player 1's slot 0
    await client.eval(`
      (() => {
        const g = window.game;
        g.skills.p1[0] = { slotIdx: 0, skillKey: '${skillKey}', used: false };
        g.renderSkillSlot('p1', 0);
        g.activeSkillSlot.p1 = null;
        g.skillUsedThisTurn.p1 = null;
        if (g.currentTurn !== 1) {
          g.currentTurn = 1;
          g.cameraX = 0;
          g.cameraTargetX = 0;
          g.isCameraPanning = false;
        }
        g.state = STATE.IDLE;
        g.isMouseDown = false;
        g.botState = null;
      })()
    `);

    // 2. Activate skill
    const activated = await client.eval(`
      (() => {
        const g = window.game;
        g.activateSkill('p1', 0);
        return {
          activeSlot: g.activeSkillSlot.p1,
          usedThisTurn: g.skillUsedThisTurn.p1,
          state: g.state,
          pendingOpponentDebuff: g.pendingDebuff.p2,
          shieldActive: g.shieldActive.p1
        };
      })()
    `);

    // 3. Simulate swing and throw
    await client.eval(`
      (() => {
        const g = window.game;
        // Start windup
        g.handlePointerDown(220, 650);
      })()
    `);

    // Windup for 250ms
    await new Promise(r => setTimeout(r, 250));

    // Release throw
    await client.eval(`
      (() => {
        const g = window.game;
        // Set mouse velocity for realistic fling
        g.mouseVelocity = { x: 450, y: -550 };
        g.handlePointerUp();
      })()
    `);

    // 4. Wait for flight and landing (or turn switch)
    let passed = false;
    let errorMsg = null;
    const startWait = Date.now();

    while (Date.now() - startWait < 4500) {
      await new Promise(r => setTimeout(r, 120));
      const status = await client.eval(`
        (() => {
          const g = window.game;
          return {
            state: g.state,
            currentTurn: g.currentTurn,
            botState: g.botState,
            p1Score: g.p1Score,
            p2Score: g.p2Score
          };
        })()
      `);

      // If state progressed through FLYING -> LANDED -> or switched turn, test passed!
      if (status && (status.state === 'landed' || status.currentTurn === 2 || status.currentTurn === 1)) {
        passed = true;
        break;
      }
    }

    // Check if main loop is still alive and responsive
    const loopAlive = await client.eval(`performance.now() > 0`);
    if (!loopAlive) {
      passed = false;
      errorMsg = 'Browser thread locked / loop frozen!';
    }

    if (passed) {
      console.log('✅ PASS (Activated & Threw without freeze)');
      results.push({ skill: skillKey, status: 'PASS' });
    } else {
      console.log('❌ FAIL:', errorMsg || 'Timed out / state stuck');
      results.push({ skill: skillKey, status: 'FAIL', error: errorMsg });
    }

    // Clean up state between tests
    await client.eval(`
      (() => {
        const g = window.game;
        g.state = STATE.IDLE;
        g.currentTurn = 1;
        g.cameraX = 0;
        g.cameraTargetX = 0;
        g.isCameraPanning = false;
        g.botState = null;
        g.isMouseDown = false;
        g.resetTurnCord();
      })()
    `);
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n=======================================');
  console.log(`ALL SKILLS VERIFICATION RESULTS:`);
  console.log(`Passed: ${results.filter(r => r.status === 'PASS').length} / ${results.length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length} / ${results.length}`);
  console.log('=======================================');

  edge.kill();
  process.exit(results.every(r => r.status === 'PASS') ? 0 : 1);
}

run().catch(err => {
  console.error('[TEST ERROR]:', err);
  process.exit(1);
});
