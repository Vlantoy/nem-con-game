const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\6ee9ab35-23d3-46e9-a881-123f67a091a0';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--window-size=1280,720',
    '--disable-gpu',
    'http://127.0.0.1:3000/'
  ]);

  console.log('Started Chrome for capture...');

  // Wait for remote debugging to be ready
  await new Promise(r => setTimeout(r, 2000));

  // Connect to Chrome DevTools Protocol
  http.get('http://127.0.0.1:9333/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const targets = JSON.parse(data);
      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.error('No page target found');
        chrome.kill();
        return;
      }

      console.log('Connecting to page ws:', page.webSocketDebuggerUrl);
      const wsUrl = new URL(page.webSocketDebuggerUrl);

      // Simple WebSocket client using Node
      const WebSocket = require('net');
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

      client.on('upgrade', (response, socket, head) => {
        console.log('WS upgraded!');

        function sendCommand(method, params = {}) {
          return new Promise((resolve) => {
            const id = reqId++;
            callbacks[id] = resolve;
            const msg = JSON.stringify({ id, method, params });
            const length = Buffer.byteLength(msg);
            const frame = Buffer.alloc(length + 6);
            frame[0] = 0x81; // text frame, fin
            frame[1] = 0x80 | length; // masked, 7-bit length
            frame.writeUInt32BE(0x12345678, 2); // mask key
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

        // Sequence of screenshots
        (async () => {
          // 1. Dismiss modal mode to see gameplay
          await sendCommand('Runtime.evaluate', {
            expression: `document.getElementById('btn-start-game').click();`
          });
          await new Promise(r => setTimeout(r, 600));

          // Capture idle new skin gameplay
          const snap1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
          if (snap1.result && snap1.result.data) {
            fs.writeFileSync(path.join(artifactDir, 'new_skin_in_game_idle.png'), Buffer.from(snap1.result.data, 'base64'));
            console.log('Saved new_skin_in_game_idle.png');
          }

          // 2. Open Skin Selection Modal
          await sendCommand('Runtime.evaluate', {
            expression: `document.getElementById('btn-skin').click();`
          });
          await new Promise(r => setTimeout(r, 600));

          const snap2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
          if (snap2.result && snap2.result.data) {
            fs.writeFileSync(path.join(artifactDir, 'character_selection_modal.png'), Buffer.from(snap2.result.data, 'base64'));
            console.log('Saved character_selection_modal.png');
          }

          // 3. Close skin modal & simulate swinging / whirling
          await sendCommand('Runtime.evaluate', {
            expression: `
              document.getElementById('btn-close-skin').click();
              if (window.gameInstance) {
                window.gameInstance.rig.th1 = 0.2;
                window.gameInstance.rig.th2 = -0.5;
                window.gameInstance.rig.wristAngle = -0.8;
                window.gameInstance.cord.nodes.forEach((n, i) => {
                  n.x = window.gameInstance.rig.wristX + i * 20;
                  n.y = window.gameInstance.rig.wristY - i * 15;
                });
              }
            `
          });
          await new Promise(r => setTimeout(r, 500));

          const snap3 = await sendCommand('Page.captureScreenshot', { format: 'png' });
          if (snap3.result && snap3.result.data) {
            fs.writeFileSync(path.join(artifactDir, 'new_skin_swing_pose.png'), Buffer.from(snap3.result.data, 'base64'));
            console.log('Saved new_skin_swing_pose.png');
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
