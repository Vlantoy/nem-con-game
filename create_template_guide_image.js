const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetImgPath = 'd:\\LMHT\\Traditional game MVP\\assets\\character\\skins\\skin_template\\khung_mau_doi_chieu.png';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-guide-'));

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; background: #0f172a; color: #fff; font-family: monospace; }
    canvas { background: #1e293b; display: block; }
  </style>
</head>
<body>
  <canvas id="c" width="1024" height="1536"></canvas>
  <script>
    async function run() {
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');

      function loadImg(s) {
        return new Promise((res, rej) => {
          const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s;
        });
      }

      const body = await loadImg('assets/character/skins/skin_template/body.png');
      const upper = await loadImg('assets/character/skins/skin_template/upper_arm_unified.png');
      const fore = await loadImg('assets/character/skins/skin_template/forearm.png');
      const hand = await loadImg('assets/character/skins/skin_template/hand.png');

      // Draw faint grid
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
      for (let x = 0; x < 1024; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1536); ctx.stroke(); }
      for (let y = 0; y < 1536; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }

      // Draw Body at 50% opacity
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(body, 0, 0);
      ctx.restore();

      // Assemble Arm
      const shX = 429, shY = 360;
      const sU = 0.53, sF = 1.15, sH = 0.35;

      // Draw Upper Arm
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.translate(shX, shY);
      ctx.drawImage(upper, -206 * sU, -208 * sU, upper.width * sU, upper.height * sU);
      ctx.restore();

      // Draw Forearm
      const elbX = shX + (228 - 206) * sU;
      const elbY = shY + (603 - 208) * sU;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.translate(elbX, elbY);
      ctx.drawImage(fore, -29 * sF, -20 * sF, fore.width * sF, fore.height * sF);
      ctx.restore();

      // Draw Hand
      const wrX = elbX + (49 - 29) * sF;
      const wrY = elbY + (200 - 20) * sF;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.translate(wrX, wrY);
      ctx.drawImage(hand, -25 * sH, -180 * sH, hand.width * sH, hand.height * sH);
      ctx.restore();

      // Draw Joint Markers & Guides
      function mark(x, y, color, title, desc) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();

        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif';
        ctx.fillText(title, x + 20, y - 5);
        ctx.fillStyle = '#94a3b8'; ctx.font = '16px monospace';
        ctx.fillText(desc, x + 20, y + 20);
      }

      mark(shX, shY, '#ef4444', '1. KHỚP VAI (Shoulder: 429, 360)', 'Khoét nách áo sạch, không vẽ tay phải trên thân');
      mark(elbX, elbY, '#3b82f6', '2. KHỚP KHUỶU (Elbow: 440, 569)', 'Viền áo bồng dừng tại đây, cẳng tay bo tròn đỉnh');
      mark(wrX, wrY, '#10b981', '3. KHỚP CỔ TAY (Wrist: 463, 776)', 'Cẳng tay dừng tại đây, không dính nắm đấm');
      mark(wrX + (165 - 25) * sH, wrY + (135 - 180) * sH, '#f59e0b', '4. TÂM NẮM DÂY CÒN (Grip: 512, 760)', 'Bàn tay khum tròn nắm dây');
      mark(565, 1510, '#a855f7', '5. GÓT CHÂN (Ground Foot: 565, 1510)', 'Điểm tiếp đất của nhân vật');

      // Title header
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(40, 40, 944, 110);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, 944, 110);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('KHUNG MẪU ĐỐI CHIẾU CHUẨN TẠO SKIN (1024 x 1536 PX)', 60, 80);
      ctx.fillStyle = '#cbd5e1'; ctx.font = '16px sans-serif';
      ctx.fillText('Giữ nguyên toạ độ 5 điểm neo trên để nhân vật mới thả vào chạy ngay mà không cần sửa code!', 60, 120);

      window.RENDER_DONE = true;
    }
    window.addEventListener('load', run);
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(tempDir, 'guide.html'), htmlContent);

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9944',
    '--user-data-dir=' + tempDir,
    '--window-size=1024,1536',
    '--disable-gpu',
    'http://127.0.0.1:3000/guide_temp.html'
  ]);

  // Copy guide.html to root
  fs.copyFileSync(path.join(tempDir, 'guide.html'), 'd:\\LMHT\\Traditional game MVP\\guide_temp.html');

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9944/json', (res) => {
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
          await new Promise(r => setTimeout(r, 2500));
          const snap = await sendCommand('Page.captureScreenshot', { format: 'png' });
          if (snap.result && snap.result.data) {
            fs.writeFileSync(targetImgPath, Buffer.from(snap.result.data, 'base64'));
            // Also copy to assets/character/skin/
            fs.copyFileSync(targetImgPath, 'd:\\LMHT\\Traditional game MVP\\assets\\character\\skin\\khung_mau_doi_chieu.png');
            console.log('Saved khung_mau_doi_chieu.png successfully!');
          }
          chrome.kill();
          try { fs.unlinkSync('d:\\LMHT\\Traditional game MVP\\guide_temp.html'); } catch(e) {}
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
          process.exit(0);
        })();
      });
      client.end();
    });
  });
}

main();
