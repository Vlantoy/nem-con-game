(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const R = window.Rhythm;
  const E = window.SapEndless;

  // Native HD 16:9 Canvas Dimensions
  const W = 1672, H = 941;
  const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // Sprite Cache for test assertions & rendering
  const spriteCache = new Map();

  // --- ASSET LOADER ---
  const ASSETS = {
    valley: '../assets/nhay-sap/thung-lung.png',
    clappers_mo_ha: '../assets/nhay-sap/clappers_mo_ha.png',
    clappers_mo_nang: '../assets/nhay-sap/clappers_mo_nang.png',
    clappers_dong_ha: '../assets/nhay-sap/clappers_dong_ha.png',
    clappers_dong_nang: '../assets/nhay-sap/clappers_dong_nang.png',
    dancer_forward: '../assets/nhay-sap/dancer_nhay_truoc.png',
    dancer_back: '../assets/nhay-sap/dancer_nhay_lui.png',
    dancer_trip: '../assets/nhay-sap/dancer_nga.png'
  };

  const images = {};
  for (const [key, src] of Object.entries(ASSETS)) {
    try {
      const img = new Image();
      img.src = src;
      images[key] = img;
    } catch (_) {}
  }

  // --- SPRITE FRAME DEFINITIONS (6 Frames per Sheet - Chuẩn Zero-Bleed Bounding Box từ Editor) ---
  const SPRITE_FRAMES = {
    dancer_forward: [
      { sx: 0, sy: 4, sw: 292, sh: 690, footX: 156.1, footY: 690.0 },
      { sx: 305, sy: 19, sw: 371, sh: 674, footX: 203.5, footY: 674.0 },
      { sx: 676, sy: 23, sw: 350, sh: 680, footX: 175.0, footY: 680.0 },
      { sx: 1026, sy: 51, sw: 409, sh: 642, footX: 195.1, footY: 642.0 },
      { sx: 1435, sy: 43, sw: 330, sh: 650, footX: 178.6, footY: 650.0 },
      { sx: 1765, sy: 41, sw: 375, sh: 653, footX: 246.3, footY: 653.0 }
    ],
    dancer_back: [
      { sx: 0, sy: 55, sw: 284, sh: 634, footX: 157.2, footY: 634.0 },
      { sx: 341, sy: 55, sw: 324, sh: 634, footX: 196.7, footY: 634.0 },
      { sx: 714, sy: 43, sw: 341, sh: 631, footX: 197.4, footY: 631.0 },
      { sx: 1075, sy: 42, sw: 346, sh: 603, footX: 202.8, footY: 603.0 },
      { sx: 1453, sy: 55, sw: 340, sh: 634, footX: 212.9, footY: 634.0 },
      { sx: 1843, sy: 55, sw: 287, sh: 634, footX: 163.8, footY: 634.0 }
    ],
    dancer_trip: [
      { sx: 14, sy: 21, sw: 338, sh: 657, footX: 124.1, footY: 657.0 },
      { sx: 352, sy: 25, sw: 372, sh: 673, footX: 186.0, footY: 673.0 },
      { sx: 724, sy: 39, sw: 349, sh: 659, footX: 174.5, footY: 659.0 },
      { sx: 1073, sy: 39, sw: 372, sh: 624, footX: 112.6, footY: 624.0 },
      { sx: 1445, sy: 126, sw: 379, sh: 536, footX: 180.0, footY: 536.0 },
      { sx: 1824, sy: 126, sw: 332, sh: 536, footX: 174.8, footY: 536.0 }
    ]
  };

  // State
  let roundState = null, round = 1, lives = 3, roundWait = 0, countdownAt = 0;
  let state = 'menu', notes = [], score = 0, combo = 0, maxCombo = 0, counts = {};
  let origin = 0, frozen = 0, nextBeat = 0, muted = false, feedbackUntil = 0;
  let pose = 1, hopAt = -10, now = 0, particles = [];
  let isTripped = false, tripUntil = 0;
  let isAirborne = false;
  let facing = 1; // 1 = right, -1 = left

  // Number of arrows correctly hit in the current round
  let arrowHits = 0;

  // Jump leap interpolation
  let jumpStartX = 837, jumpTargetX = 837;
  let jumpDuration = 0.45;
  let stepBounceUntil = 0;

  // Stage Coordinates on Native 1672x941 Canvas
  const FLOOR_Y = 550;
  const LANES_X = [643, 742, 837, 932, 1019]; // Bờ trái, Luống 0, Tâm sàn (837px xanh), Luống 2, Bờ phải
  let dancerLane = 2; // Default starting at Lane 1 (837px - Tâm sàn Xanh)
  let dancerVisualX = 837, dancerVisualY = 550;

  const storage = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  // --- AUDIO SYNTHESIZER & BAMBOO SOUND TRACK ---
  let ac = null, master = null, voices = new Set();
  let bambooAudioEl = null;

  try {
    if (typeof Audio !== 'undefined') {
      bambooAudioEl = new Audio('bamboo_rhythm.mp3');
      bambooAudioEl.preload = 'auto';
    }
  } catch (_) {}

  function clock() {
    return ac ? ac.currentTime : performance.now() / 1000;
  }

  function ensureAudio() {
    if (!ac && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ac.destination);
      } catch (_) {}
    }
  }

  function playUserBambooRhythm() {
    if (muted || !bambooAudioEl) return;
    try {
      bambooAudioEl.currentTime = 0;
      bambooAudioEl.play().catch(() => {});
    } catch (_) {}
  }

  // Tiếng gõ sạp trầm vang "Cộp"
  function playBambooTap(vol = 0.6) {
    if (muted || !ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
    g.gain.setValueAtTime(vol * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Tiếng sạp khép dập đanh "Chách!"
  function playBambooClack(vol = 0.85) {
    if (muted || !ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Tiếng vấp ngã khi kẹp chân
  function playTrip() {
    if (muted || !ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.35);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Tiếng chuông thưởng
  function playChime() {
    if (muted || !ac) return;
    const t = ac.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      g.gain.setValueAtTime(0.2, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
      osc.connect(g);
      g.connect(master);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.25);
    });
  }

  function tone(freq, time, duration = 0.09, type = 'triangle', volume = 0.08) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(volume, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    o.connect(g);
    g.connect(master);
    o.start(time);
    o.stop(time + duration);
    voices.add(o);
    o.onended = () => { voices.delete(o); g.disconnect(); };
  }

  function silence() {
    for (const o of voices) { try { o.stop(); } catch {} }
    voices.clear();
    if (bambooAudioEl) {
      try { bambooAudioEl.pause(); } catch (_) {}
    }
  }

  async function unlock() {
    ensureAudio();
    if (ac && ac.resume) {
      try { await ac.resume(); } catch {}
    }
  }

  function beatLength() {
    return 60 / (E?.config(round)?.bpm || 90);
  }

  function elapsed() {
    return state === 'playing' ? clock() - origin : frozen;
  }

  function panels(id) {
    for (const name of ['menu', 'paused', 'result']) {
      const el = $(name);
      if (el) el.classList.toggle('hidden', name !== id);
    }
  }

  function controls(enabled) {
    for (const id of ['in', 'out', 'up', 'down', 'commit']) {
      const el = $(id);
      if (el) el.disabled = !enabled;
    }
    const pauseBtn = $('pause');
    if (pauseBtn) pauseBtn.disabled = !enabled;
  }

  function best() {
    return Number(storage.get('sap_endless_best', '0')) || 0;
  }

  function hud() {
    const scEl = $('score'), cbEl = $('combo'), bEl = $('best');
    if (scEl) scEl.textContent = String(score).padStart(5, '0');
    if (cbEl) cbEl.textContent = '×' + combo;
    if (bEl) bEl.textContent = String(best()).padStart(5, '0');
  }

  function newRound(t) {
    roundState = E.create(round, t);
    notes = [{ time: roundState.target, kind: round % 2 }];
    roundWait = 0;
    nextBeat = 0;
    isTripped = false;
    isAirborne = false;
    arrowHits = 0;
    // GIỮ NGUYÊN dancerLane (không reset lại vị trí sau mỗi lượt)!
    dancerVisualX = LANES_X[dancerLane] || 837;
    dancerVisualY = FLOOR_Y;
    playUserBambooRhythm();
  }

  async function start() {
    if (state === 'starting') return;
    state = 'starting';
    await unlock();
    score = combo = maxCombo = 0;
    lives = 3;
    round = 1;
    counts = { perfect: 0, good: 0, miss: 0 };
    particles = [];
    pose = 1;
    frozen = 0;
    hopAt = -10;
    isTripped = false;
    isAirborne = false;
    arrowHits = 0;
    dancerLane = 2; // Khởi đầu ván chơi mới tại tâm sàn
    dancerVisualX = LANES_X[2];
    dancerVisualY = FLOOR_Y;
    facing = 1;
    origin = clock();
    countdownAt = clock() + 3;
    roundState = null;
    state = 'countdown';
    panels(null);
    controls(false);
    hud();
    const fb = $('feedback');
    if (fb) {
      fb.classList.toggle('countdown', true);
      fb.textContent = '3';
    }
  }

  function pause() {
    if (state !== 'playing') return;
    frozen = elapsed();
    silence();
    state = 'paused';
    panels('paused');
    controls(false);
    const ann = $('announcement');
    if (ann) ann.textContent = 'Đã tạm dừng.';
  }

  async function resume() {
    if (state !== 'paused') return;
    state = 'resuming';
    await unlock();
    origin = clock() - frozen;
    nextBeat = Math.ceil((frozen - (roundState ? roundState.start : 0) + 0.025) / beatLength());
    state = 'playing';
    panels(null);
    controls(true);
  }

  function menu() {
    silence();
    state = 'ready';
    roundState = null;
    frozen = 0;
    notes = [];
    particles = [];
    pose = 1;
    isTripped = false;
    isAirborne = false;
    arrowHits = 0;
    panels('menu');
    controls(false);
    const pBtn = $('pause');
    if (pBtn) pBtn.disabled = true;
    const fb = $('feedback');
    if (fb) {
      fb.textContent = '';
      fb.classList.toggle('countdown', false);
    }
    const ph = $('phase');
    if (ph) ph.textContent = 'LƯỢT 1 · ♥♥♥';
    hud();
  }

  function finish() {
    frozen = elapsed();
    state = 'result';
    silence();
    controls(false);
    if (score > best()) storage.set('sap_endless_best', score);
    hud();
    const rankEl = $('rank'), finEl = $('final-score'), sumEl = $('summary');
    if (rankEl) rankEl.textContent = 'Hẹn một điệu múa nữa!';
    if (finEl) finEl.textContent = score.toLocaleString('vi-VN');
    if (sumEl) sumEl.textContent = 'Đạt lượt ' + round + ' · Chuỗi tốt nhất ×' + maxCombo;
    panels('result');
  }

  function feedback(text, color) {
    const fb = $('feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.style.color = color;
    feedbackUntil = performance.now() / 1000 + 0.75;
  }

  // Kiểm tra xem vị trí X có nằm trong vùng sạp tre dập vào nhau (vị trí đỏ) hay không
  function checkHitsBamboo(x) {
    const clapperScale = 0.50;
    const clapperX = (W - W * clapperScale) / 2; // 418px
    const hazardZones = [
      { min: 418 + 90,  max: 418 + 183 }, // Cặp Sạp 1: [508, 601]
      { min: 418 + 280, max: 418 + 370 }, // Cặp Sạp 2: [698, 788]
      { min: 418 + 470, max: 418 + 559 }, // Cặp Sạp 3: [888, 977]
      { min: 418 + 656, max: 418 + 750 }  // Cặp Sạp 4: [1074, 1168]
    ];
    const footRadius = 14;
    const footLeft = x - footRadius;
    const footRight = x + footRadius;
    return hazardZones.some(hz => footRight >= hz.min && footLeft <= hz.max);
  }

  // --- RESOLVE LOGIC: TÍNH ĐIỂM DỰA TRÊN ĐỘ CHUẨN CỦA CÁC NÚT MŨI TÊN + CÚ NHẢY SPACE ---
  function resolve(quality) {
    counts[quality] = (counts[quality] || 0) + 1;
    roundWait = elapsed() + 0.45;
    if (roundState) {
      roundState.resolved = true;
      roundState.result = quality;
    }

    if (quality === 'miss') {
      combo = 0;
      // QUY TẮC SÁT THƯƠNG:
      // CHỈ MẤT MÁU KHI ĐỨNG Ở VỊ TRÍ ĐỎ (CẶP SẠP TRE DẬP VÀO NHAU)!
      // Ở VỊ TRÍ XANH (TÂM SÀN HOẶC BỜ AN TOÀN) THÌ HOÀN TOÀN KHÔNG BỊ KẸP CHÂN, KHÔNG MẤT MÁU!
      const isRedHazard = checkHitsBamboo(dancerVisualX);

      if (isRedHazard) {
        lives--;
        isTripped = true;
        isAirborne = false;
        tripUntil = elapsed() + 0.8;
        playTrip();
        feedback('LỠ NHỊP · ĐỨNG TRÚNG SẠP ĐÓNG! (-1 ❤️)', '#ffad8c');
        pose = 1;
      } else {
        isTripped = false;
        feedback('LỠ NHỊP · Ở VỊ TRÍ XANH AN TOÀN! (0 ❤️)', '#a7f3d0');
      }
    } else {
      combo++;
      maxCombo = Math.max(combo, maxCombo);

      // Điểm số tỉ lệ với số nút mũi tên bấm chuẩn:
      // Bấm đủ 3 nút: 100% điểm tối đa (113 ở lượt 1)!
      // Bấm 2 nút: ~70% điểm
      // Bấm 1 nút: ~40% điểm
      const seqLen = roundState ? roundState.sequence.length : 3;
      const hitRatio = Math.max(0.40, Math.min(1.0, arrowHits / Math.max(1, seqLen)));
      const basePoints = R ? R.points(quality, combo) : 100;
      const earned = Math.round(basePoints * hitRatio) + round * 10;
      score += earned;

      let msg = '✦ CHUẨN! VƯỢT SẠP! (+' + earned + ')';
      if (arrowHits === seqLen) {
        msg = '✦ XUẤT SẮC! ĐỦ ' + seqLen + ' NHỊP + NHẢY CHUẨN! (+' + earned + ')';
      } else if (arrowHits > 0) {
        msg = '✦ ĐẠT! ' + arrowHits + '/' + seqLen + ' NHỊP + VƯỢT SẠP! (+' + earned + ')';
      }

      feedback(msg, quality === 'perfect' ? '#ffe69a' : '#a7f3d0');
      pose = round % 2;
      playChime();

      for (let i = 0; i < 24; i++) {
        particles.push({
          x: dancerVisualX,
          y: dancerVisualY - 35,
          vx: (Math.random() - 0.5) * 200,
          vy: -60 - Math.random() * 110,
          life: 0.8,
          color: quality === 'perfect' ? '#fde047' : '#34d399'
        });
      }
    }
    hud();
    if (lives === 0) finish();
  }

  // --- CÁC NÚT MŨI TÊN: BẤM THEO NHỊP GÕ (KHÔNG THAY ĐỔI VỊ TRÍ, KHÔNG NHẢY) ---
  function step(kind) {
    if (state === 'ready') return;
    if (state !== 'playing' || !roundState || roundState.resolved) return;

    // Check key correctness via SSG 105 endless logic
    const result = E.input(roundState, kind);

    if (result === 'wrong') {
      feedback('SAI HƯỚNG · NHẬP LẠI TỪ ĐẦU!', '#ffad8c');
      playBambooTap(0.25);
      arrowHits = 0;
    } else if (result === 'correct') {
      // Bấm đúng 1 nút theo nhịp: nhân vật nhún chân tại chỗ theo nhịp (KHÔNG DI CHUYỂN, KHÔNG NHẢY!)
      arrowHits++;
      playBambooTap(0.5);
      stepBounceUntil = elapsed() + 0.12;
      feedback(`NHỊP ${roundState.index}/${roundState.sequence.length} ✓`, '#a7f3d0');
    } else if (result === 'ready') {
      // Đã bấm xong hết các nút mũi tên: sẵn sàng chờ Space chốt đúng nhịp!
      arrowHits++;
      playBambooTap(0.65);
      stepBounceUntil = elapsed() + 0.12;
      feedback('✦ ĐÃ XONG CÁC NÚT · BẤM SPACE ĐỂ BẮT ĐẦU NHẢY! ✦', '#fde047');
    }
  }

  // --- BẤM SPACE: BẮT ĐẦU NHẢY VÀ DI CHUYỂN RANDOM SANG 2 BÊN! ---
  function commit() {
    if (state === 'ready') return;
    if (state !== 'playing' || !roundState || roundState.resolved) return;

    const t = elapsed();
    const delta = Math.abs(t - roundState.target);

    // Check timing using SSG 105 Endless commit
    let quality = E.commit(roundState, t);

    // Nếu bấm Space chuẩn trong cửa sổ timing (nhịp 4):
    // Cho phép nhảy thành công ngay cả khi chỉ bấm 1 hoặc 2 nút mũi tên,
    // với điểm số tỉ lệ theo số nút đã bấm!
    if (delta <= roundState.good) {
      if (arrowHits > 0 || roundState.index > 0) {
        quality = (delta <= roundState.perfect) ? 'perfect' : 'good';
      }
    }

    if (quality !== 'miss') {
      // NHẢY SANG 2 BÊN RANDOM KHI BẤM SPACE:
      const choices = [];
      if (dancerLane > 0) choices.push(dancerLane - 1);
      if (dancerLane < LANES_X.length - 1) choices.push(dancerLane + 1);
      const targetLane = choices[Math.floor(Math.random() * choices.length)];

      isAirborne = true;
      hopAt = t;
      jumpDuration = 0.45;
      jumpStartX = dancerVisualX;
      jumpTargetX = LANES_X[targetLane];
      dancerLane = targetLane;
      facing = (jumpTargetX >= jumpStartX) ? 1 : -1;
    } else {
      isAirborne = false;
    }

    resolve(quality);
  }

  function schedule(t) {
    if (!roundState) return;
    const beat = beatLength(), relative = t - roundState.start;
    while (nextBeat * beat <= relative + 0.1) {
      const b = nextBeat++, at = origin + roundState.start + b * beat;
      if (at >= clock() - 0.05) {
        const beatInMeasure = b % 4;
        if (beatInMeasure === 3) {
          playBambooClack(0.95);
          tone(280, at, 0.07, 'triangle', 0.12);
        } else {
          playBambooTap(0.6);
          tone(180, at, 0.05, 'triangle', 0.06);
        }
      }
    }
  }

  // --- RENDERING PIPELINE (1672x941 UNCOMPRESSED NATIVE CANVAS) ---
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function text(str, x, y, size = 16, color = '#fff1cb', align = 'center') {
    ctx.font = `bold ${size}px Trebuchet MS, Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(str, x + 1, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function scene(t, dt) {
    ctx.imageSmoothingEnabled = false;

    // 1. Full High-Res Background
    const bgImg = images.valley;
    if (bgImg && bgImg.complete && bgImg.naturalWidth) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      rect(0, 0, W, H, '#1e293b');
      rect(0, 550, W, 391, '#0f172a');
    }

    // 2. Rhythm beat progress
    const running = ['playing', 'paused', 'result'].includes(state);
    const bt = running ? Math.max(0, t) / beatLength() : now * 0.7;
    const currentBeat = Math.floor(bt) % 4;

    // 3. Clappers & Bamboo Poles (4-State authentic animation, 50% scale chuẩn)
    let clapperImg = images.clappers_mo_ha;
    if (currentBeat === 0) clapperImg = images.clappers_mo_ha;
    else if (currentBeat === 1) clapperImg = images.clappers_mo_nang;
    else if (currentBeat === 2) clapperImg = images.clappers_mo_ha;
    else if (currentBeat === 3) clapperImg = images.clappers_dong_ha;

    const clapperScale = 0.50; // Chuẩn 50% nguyên khối như Editor
    const cw = 1672 * clapperScale; // 836px
    const ch = 941 * clapperScale;  // 470px
    const cx = (W - cw) / 2;        // 418px (căn giữa hoàn hảo)
    const cy = 280;                 // Khớp sàn tre 550px

    if (clapperImg && clapperImg.complete && clapperImg.naturalWidth) {
      ctx.drawImage(clapperImg, cx, cy, cw, ch);
    } else {
      rect(cx + 90, cy + 220, 660, 20, '#15803d');
    }

    // 4. Dancer Shadow & Movement (Chỉ di chuyển & nhảy khi bấm Space, random sang 2 bên)
    let jumpHeight = 0;
    if (isAirborne && hopAt > 0) {
      const p = Math.min(1, Math.max(0, (t - hopAt) / jumpDuration));
      dancerVisualX = jumpStartX + (jumpTargetX - jumpStartX) * p;
      jumpHeight = reduced ? 0 : Math.sin(p * Math.PI) * 115;
      dancerVisualY = FLOOR_Y - jumpHeight;
      if (p >= 1) {
        isAirborne = false;
        dancerVisualX = jumpTargetX;
        dancerVisualY = FLOOR_Y;
      }
    } else {
      dancerVisualX = LANES_X[dancerLane] || 837;
      dancerVisualY = FLOOR_Y;
    }

    // Determine Sprite animation
    let animKey = 'dancer_forward';
    let spriteSheet = images.dancer_forward;
    let fIndex = 0;

    if (isTripped && elapsed() < tripUntil) {
      animKey = 'dancer_trip';
      spriteSheet = images.dancer_trip;
      const tripProgress = Math.min(1, Math.max(0, (elapsed() - (tripUntil - 0.8)) / 0.8));
      fIndex = Math.min(5, Math.floor(tripProgress * 6));
    } else {
      isTripped = false;
      if (isAirborne && hopAt > 0) {
        const p = Math.min(1, Math.max(0, (t - hopAt) / jumpDuration));
        fIndex = Math.min(5, Math.floor(p * 6));
      } else if (t < stepBounceUntil) {
        // Nhún nhịp chân tại chỗ khi bấm mũi tên theo nhịp gõ (không nhảy)
        fIndex = 1;
      } else {
        // Đứng thẳng bình thường trên sàn
        fIndex = 0;
      }
    }

    // Draw shadow
    ctx.save();
    ctx.beginPath();
    const shadowW = Math.max(12, 44 * (1 - jumpHeight / 160));
    const shadowH = Math.max(4, 12 * (1 - jumpHeight / 160));
    ctx.ellipse(dancerVisualX, FLOOR_Y + 4, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fill();
    ctx.restore();

    // Draw Dancer Sprite (Scale 0.20 chuẩn Zero-Bleed, lật chuẩn tâm không lệch trục)
    const frames = SPRITE_FRAMES[animKey] || SPRITE_FRAMES.dancer_forward;
    const fDef = frames[fIndex] || frames[0];
    const dancerScale = 0.20;

    if (spriteSheet && spriteSheet.complete && spriteSheet.naturalWidth) {
      const dw = fDef.sw * dancerScale;
      const dh = fDef.sh * dancerScale;

      ctx.save();
      // Hiệu ứng phát sáng đỏ khi dính sạp / vấp ngã
      if (isTripped) {
        ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
        ctx.shadowBlur = 24;
      }

      ctx.translate(dancerVisualX, dancerVisualY);
      // Chỉ lật mặt khi đang múa bình thường, không lật sprite ngã để giữ hướng ngã tự nhiên
      if (facing === -1 && animKey !== 'dancer_trip') {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        spriteSheet,
        fDef.sx, fDef.sy, fDef.sw, fDef.sh,
        -fDef.footX * dancerScale, -fDef.footY * dancerScale,
        dw, dh
      );
      ctx.restore();
    } else {
      rect(dancerVisualX - 25, dancerVisualY - 90, 50, 90, '#e2e8f0');
    }

    // 5. Particles
    for (const p of particles) {
      if (state === 'playing') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 110 * dt;
        p.life -= dt;
      }
      rect(p.x, p.y, 5, 5, p.color);
    }
    particles = particles.filter(p => p.life > 0);

    // 6. Timing Rail & Arrow Phrase (Giao diện chuẩn SSG 105, thoáng rộng ở đáy màn hình)
    if (!roundState || state === 'countdown') return;

    const railW = 1040, railH = 92;
    const railX = (W - railW) / 2;
    const railY = H - railH - 24;

    // Background container
    rect(railX, railY, railW, railH, 'rgba(23, 46, 40, 0.94)');
    rect(railX, railY, railW, 3, '#c39648');

    const seq = roundState.sequence || [];
    const index = roundState.index || 0;
    const symbols = ['←', '→', '↑', '↓'];
    const size = Math.min(48, 420 / Math.max(1, seq.length));
    const left = W / 2 - seq.length * (size + 12) / 2;

    seq.forEach((k, i) => {
      const x = left + i * (size + 12);
      const isDone = i < index;
      rect(x, railY + 10, size, size, isDone ? '#10b981' : '#334155');
      rect(x + 2, railY + 12, size - 4, size - 4, isDone ? '#047857' : '#1e293b');
      text(symbols[k], x + size / 2, railY + 10 + size * 0.72, Math.min(28, size * 0.75), isDone ? '#ecfdf5' : '#fcd34d');
    });

    // Timing Rail
    const x0 = railX + 160, width = railW - 320, target = 0.84;
    rect(x0, railY + 68, width, 6, '#475569');

    const duration = roundState.duration || 6;
    const good = roundState.good || 0.24;
    const windowWidth = width * good / (duration / target);

    // Golden Target Zone
    rect(x0 + width * target - windowWidth, railY + 59, windowWidth * 2, 24, '#b45309');
    rect(x0 + width * target - 2, railY + 56, 4, 30, '#fef08a');

    // Needle Indicator
    const fraction = Math.min(1, Math.max(0, (t - roundState.start) / (duration / target)));
    rect(x0 + width * fraction - 3, railY + 62, 6, 18, '#ffffff');

    // Hint text
    const isPhraseDone = (index >= seq.length);
    text(isPhraseDone ? '✦ BẤM SPACE ĐÚNG VÙNG VÀNG ĐỂ NHẢY! ✦' : `Nhập 3 nút theo nhịp: ${seq.map(s => symbols[s]).join(' ')}`, W / 2, railY + railH - 6, 12, isPhraseDone ? '#fef08a' : '#cbd5e1');
  }

  // --- MAIN LOOP ---
  let previous = performance.now() / 1000;

  function frame() {
    now = performance.now() / 1000;
    const dt = Math.min(0.05, now - previous);
    previous = now;

    if (state === 'countdown') {
      const remaining = countdownAt - clock();
      if (remaining > 0) {
        const fb = $('feedback');
        if (fb) {
          fb.textContent = String(Math.ceil(remaining));
          fb.style.color = '#ffe69a';
        }
      } else {
        origin = clock();
        newRound(0);
        state = 'playing';
        const fb = $('feedback');
        if (fb) {
          fb.classList.toggle('countdown', false);
          fb.textContent = '';
        }
        feedbackUntil = 0;
        controls(true);
      }
    }

    const t = elapsed();

    if (state === 'playing') {
      schedule(t);
      if (!roundState.resolved && t > roundState.target + roundState.good) {
        resolve('miss');
      }
      if (state === 'playing' && roundState.resolved && t >= roundWait) {
        round++;
        newRound(t);
      }
      const ph = $('phase');
      if (ph) {
        ph.textContent = 'LƯỢT ' + round + ' · ' + '♥'.repeat(Math.max(0, lives));
      }
    }

    if (state !== 'countdown' && now > feedbackUntil) {
      const fb = $('feedback');
      if (fb) fb.textContent = '';
    }

    scene(t, dt);
    requestAnimationFrame(frame);
  }

  // --- INPUT BINDINGS ---
  const startBtn = $('start');
  if (startBtn) startBtn.onclick = start;
  const retryBtn = $('retry');
  if (retryBtn) retryBtn.onclick = start;
  const chooseBtn = $('choose');
  if (chooseBtn) chooseBtn.onclick = menu;
  const backBtn = $('back');
  if (backBtn) backBtn.onclick = menu;
  const pauseBtn = $('pause');
  if (pauseBtn) pauseBtn.onclick = pause;
  const resumeBtn = $('resume');
  if (resumeBtn) resumeBtn.onclick = resume;

  for (const [id, kind] of [['in', 0], ['out', 1], ['up', 2], ['down', 3]]) {
    const el = $(id);
    if (el) {
      el.addEventListener('pointerdown', e => { e.preventDefault(); step(kind); });
      el.onclick = e => { if (e.detail === 0) step(kind); };
    }
  }

  const commitBtn = $('commit');
  if (commitBtn) {
    commitBtn.addEventListener('pointerdown', e => { e.preventDefault(); commit(); });
    commitBtn.onclick = e => { if (e.detail === 0) commit(); };
  }

  window.addEventListener('keydown', e => {
    if (e.target.matches && e.target.matches('input,select,textarea')) return;
    const helpDlg = $('help-dialog');
    if (helpDlg && helpDlg.open) return;

    if (e.key === 'Escape') {
      if (state === 'playing') pause();
      else if (state === 'paused') resume();
      return;
    }

    const keys = {
      ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3,
      a: 0, d: 1, w: 2, s: 3,
      A: 0, D: 1, W: 2, S: 3
    };

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (!e.repeat) commit();
    } else if (keys[e.key] !== undefined) {
      e.preventDefault();
      if (!e.repeat) step(keys[e.key]);
    }
  });

  const soundBtn = $('sound');
  if (soundBtn) {
    soundBtn.onclick = () => {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 1;
      soundBtn.textContent = muted ? 'Âm: Tắt' : 'Âm: Bật';
      soundBtn.setAttribute('aria-pressed', String(muted));
      soundBtn.setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh');
    };
  }

  const helpBtn = $('help');
  if (helpBtn) {
    helpBtn.onclick = () => {
      pause();
      const dlg = $('help-dialog');
      if (dlg && dlg.showModal) dlg.showModal();
    };
  }

  const closeHelpBtn = $('close-help');
  if (closeHelpBtn) {
    closeHelpBtn.onclick = () => {
      const dlg = $('help-dialog');
      if (dlg && dlg.close) dlg.close();
    };
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (state === 'countdown') menu();
        else pause();
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('blur', () => {
      if (state === 'countdown') menu();
      else pause();
    });
  }

  // Initialize
  menu();
  requestAnimationFrame(frame);

  // Debug & Testing Hooks
  if (typeof window !== 'undefined') {
    window.setDancerLane = l => { dancerLane = l; dancerVisualX = LANES_X[l] || 837; };
    window.checkHitsBamboo = checkHitsBamboo;
    window.getDancerLane = () => dancerLane;
  }
})();
