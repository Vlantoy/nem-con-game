const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9788',
    '--window-size=1280,720',
    '--disable-gpu',
    'http://127.0.0.1:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9788/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const targets = JSON.parse(data);
      const page = targets.find(t => t.type === 'page');
      if (!page) { chrome.kill(); return; }

      const wsUrl = new URL(page.webSocketDebuggerUrl);
      const wsKey = Buffer.from('test' + Date.now()).toString('base64');
      
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
        function sendCommand(method, params = {}) {
          return new Promise((resolve) => {
            const id = reqId++;
            callbacks[id] = resolve;
            const msg = JSON.stringify({ id, method, params });
            const length = Buffer.byteLength(msg);
            const frame = Buffer.alloc(length + 6);
            frame[0] = 0x81;
            frame[1] = 0x80 | length;
            frame.writeUInt32BE(0x12345678, 2);
            for (let i = 0; i < length; i++) {
              frame[6 + i] = msg.charCodeAt(i) ^ (frame[2 + (i % 4)]);
            }
            socket.write(frame);
          });
        }

        let buffer = Buffer.alloc(0);
        socket.on('data', (chunk) => {
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
              const resObj = JSON.parse(payload);
              if (resObj.id && callbacks[resObj.id]) {
                callbacks[resObj.id](resObj);
                delete callbacks[resObj.id];
              }
            } catch (e) {}
          }
        });

        (async () => {
          await new Promise(r => setTimeout(r, 2000));
          // Start game
          await sendCommand('Runtime.evaluate', {
            expression: `
              const btn = document.getElementById('startBtn') || document.querySelector('.btn-primary');
              if (btn) btn.click();
            `
          });
          await new Promise(r => setTimeout(r, 2000));
          const snap = await sendCommand('Page.captureScreenshot', { format: 'png' });
          if (snap.result && snap.result.data) {
            const outPath = path.join(artifactDir, 'male_character_gameplay_fixed.png');
            fs.writeFileSync(outPath, Buffer.from(snap.result.data, 'base64'));
            console.log('Saved male_character_gameplay_fixed.png');
          }
          chrome.kill();
          process.exit(0);
        })();
      });
      client.end();
    });
  });
}

run();
