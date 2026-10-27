const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Arrow keys do not move lane; Space jumps to adjacent random lane; position does not reset across rounds; sprites match editor', () => {
  const base = path.join(__dirname, '..');
  const js = fs.readFileSync(path.join(base, 'game.js'), 'utf8');
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

  // Verify SPRITE_FRAMES bounds
  const framesMatch = js.match(/const SPRITE_FRAMES = ({[\s\S]*?\n  })/);
  assert.ok(framesMatch, 'SPRITE_FRAMES defined in game.js');
  const framesObj = eval('(' + framesMatch[1] + ')');

  assert.equal(framesObj.dancer_forward.length, 6);
  assert.equal(framesObj.dancer_trip.length, 6);

  // Check dancer_trip zero-bleed and texture containment
  assert.equal(framesObj.dancer_trip[0].sx, 14);
  assert.equal(framesObj.dancer_trip[0].sw, 338);
  assert.equal(framesObj.dancer_trip[5].sx, 1824);
  assert.equal(framesObj.dancer_trip[5].sw, 332);
  for (const f of framesObj.dancer_trip) {
    assert.ok(f.sx + f.sw <= 2172, `Frame exceeds texture width: ${f.sx + f.sw} > 2172`);
    assert.ok(f.sy + f.sh <= 724, `Frame exceeds texture height: ${f.sy + f.sh} > 724`);
  }

  // Check dancer_forward zero-bleed
  assert.equal(framesObj.dancer_forward[0].sx, 0);
  assert.equal(framesObj.dancer_forward[0].sw, 292);
  assert.equal(framesObj.dancer_forward[3].sx, 1026);
  assert.equal(framesObj.dancer_forward[3].sw, 409);
  for (const f of framesObj.dancer_forward) {
    assert.ok(f.sx + f.sw <= 2172);
    assert.ok(f.sy + f.sh <= 724);
  }

  // Test runtime behavior in VM
  const noop = () => {};
  const ctx = new Proxy({}, { get: () => noop, set: () => true });
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  const els = {};
  for (const id of ids) {
    els[id] = { value: '0', style: {}, classList: { toggle: noop }, addEventListener: noop, setAttribute: noop };
  }
  els.scene.getContext = () => ctx;

  let render;
  let keydownHandler;
  let currentTime = 1000;
  const c = {
    window: {
      addEventListener: (evt, h) => { if (evt === 'keydown') keydownHandler = h; },
    },
    document: {
      getElementById: id => els[id],
      querySelectorAll: () => [],
      addEventListener: noop,
      createElement: () => ({ getContext: () => ctx })
    },
    Image: class { constructor() { this.complete = true; this.naturalWidth = 1672; this.naturalHeight = 941; } },
    matchMedia: () => ({ matches: false }),
    localStorage: { getItem: () => null, setItem: noop },
    performance: { now: () => currentTime },
    requestAnimationFrame: f => { render = f; },
    Audio: class { constructor() { this.play = () => Promise.resolve(); this.pause = noop; } }
  };

  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(base, 'rhythm.js'), 'utf8'), c);
  vm.runInContext(fs.readFileSync(path.join(base, 'endless.js'), 'utf8'), c);
  vm.runInContext(js, c);

  // Start game
  els.start.onclick();
  currentTime = 5000;
  render(); // countdown finishes -> newRound(0)

  // Verify step does NOT change dancerLane
  const stepFn = js.slice(js.indexOf('function step(kind)'), js.indexOf('function commit()'));
  assert.doesNotMatch(stepFn, /dancerLane\s*=/);

  // Verify newRound doesn't reset dancerLane
  const newRoundFn = js.slice(js.indexOf('function newRound(t)'), js.indexOf('async function start()'));
  assert.doesNotMatch(newRoundFn, /dancerLane\s*=/);

  // Verify commit does pick adjacent lane
  assert.ok(js.includes('dancerLane = targetLane'));

  // Verify green vs red hazard classification
  assert.equal(c.window.checkHitsBamboo(837), false, '837px center green lane must be safe');
  assert.equal(c.window.checkHitsBamboo(643), false, '643px left green bank must be safe');
  assert.equal(c.window.checkHitsBamboo(1019), false, '1019px right green bank must be safe');
  assert.equal(c.window.checkHitsBamboo(742), true, '742px red bamboo lane 1 must be hazard');
  assert.equal(c.window.checkHitsBamboo(932), true, '932px red bamboo lane 2 must be hazard');
});
