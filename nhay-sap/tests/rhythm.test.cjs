const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const R = require('../rhythm.js');

for (const level of Object.keys(R.levels)) {
  const chart = R.chart(level);
  assert.equal(chart.length, 42);
  assert.equal(chart[0].time, 4 * 60 / R.levels[level].bpm);
  assert.equal(R.judge(0, level), 'perfect');
  assert.equal(R.judge(-R.levels[level].perfect, level), 'perfect');
  assert.equal(R.judge(R.levels[level].good, level), 'good');
  assert.equal(R.judge(R.levels[level].good + .001, level), 'miss');
}
assert.equal(R.points('miss', 10), 0);
assert.equal(R.points('perfect', 30), 200);
assert.equal(R.points('perfect', 50), 200);

function setup() {
  let now = 0, frame;
  const els = new Map(), events = {};
  const context2d = new Proxy({}, { get: () => () => {} });
  const elements = id => {
    if (!els.has(id)) {
      els.set(id, {
        textContent: '',
        style: {},
        value: '0',
        disabled: false,
        classList: { toggle() {} },
        setAttribute() {},
        matches() { return false; },
        getContext: () => context2d,
        addEventListener(k, f) { this[k] = f; }
      });
    }
    return els.get(id);
  };
  const levels = ['easy', 'normal', 'hard'].map(v => ({ ...elements(v), dataset: { level: v } }));
  const document = {
    getElementById: elements,
    querySelectorAll: () => levels,
    createElement: () => ({ getContext: () => context2d }),
    addEventListener() {}
  };
  const window = {
    SapEndless: { ...require('../endless.js'), create: (r, t) => require('../endless.js').create(r, t, () => 0) },
    Rhythm: R,
    addEventListener: (k, f) => events[k] = f
  };
  const sandbox = {
    window,
    document,
    localStorage: { getItem: () => null, setItem() {} },
    matchMedia: () => ({ matches: false }),
    Image: class {},
    performance: { now: () => now * 1000 },
    requestAnimationFrame: f => frame = f,
    console,
    Math: Object.assign(Object.create(Math), { random: () => 0 })
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../game.js'), 'utf8'), sandbox);
  return {
    el: elements,
    levels,
    sandbox,
    time(t) { now = t; frame(); },
    async start() { await elements('start').onclick(); },
    async key(k) { events.keydown({ key: k, target: { matches: () => false }, preventDefault() {} }); }
  };
}

(async () => {
  const s = setup();
  await s.start();
  assert.equal(s.el('in').disabled, true);
  s.time(1);
  assert.equal(s.el('feedback').textContent, '2');
  s.time(3);
  assert.equal(s.el('in').disabled, false);
  s.time(3.1);
  for (let i = 0; i < 3; i++) s.el('in').pointerdown({ preventDefault() {} });
  s.time(3 + require('../endless.js').config(1).duration);
  s.el('commit').pointerdown({ preventDefault() {} });
  assert.equal(s.el('combo').textContent, '×1');
  assert.equal(Number(s.el('score').textContent), 113);
  s.time(5.7);
  assert.match(s.el('phase').textContent, /LƯỢT 2/);
  s.el('pause').onclick();
  s.time(100);
  assert.equal(s.el('in').disabled, true);
  await s.el('resume').onclick();
  s.time(100.1);
  assert.equal(s.el('commit').disabled, false);

  const failed = setup();
  await failed.start();
  failed.time(3);
  failed.time(6);
  // Kiểm tra quy tắc: Ở VỊ TRÍ XANH (Lane 2 - Tâm sàn) lỡ nhịp HOÀN TOÀN KHÔNG MẤT MÁU!
  assert.match(failed.el('phase').textContent, /♥♥♥/);
  assert.match(failed.el('feedback').textContent, /VỊ TRÍ XANH/);

  // Khi đứng ở VỊ TRÍ ĐỎ (Lane 1 - Sạp đóng dập vào nhau), sạp khép kẹp chân mất máu liên tiếp!
  failed.sandbox.window.setDancerLane(1);
  failed.time(7);
  failed.time(10);
  failed.time(11);
  failed.time(14);
  failed.time(15);
  failed.time(18);
  assert.match(failed.el('summary').textContent, /Đạt lượt/);
  assert.equal(failed.el('commit').disabled, true);

  console.log('PASS: perfect endless phrase, progression, pause/resume, green safe zone & red damage rule.');
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
