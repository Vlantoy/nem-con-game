const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  'http://127.0.0.1:8080/align_and_export_skin.html'
]);

console.log('Chrome started on port 9222, waiting for aligner to finish...');

setTimeout(() => {
  try { chrome.kill(); } catch (e) {}
  console.log('Done waiting.');
  process.exit(0);
}, 6000);
