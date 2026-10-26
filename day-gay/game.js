(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const E = window.StickEngine;

  // 1. TẢI TÀI NGUYÊN HOẠT ẢNH & BỐI CẢNH ĐẨY GẬY (CHỈ DÙNG ASSET CỦA ĐẨY GẬY)
  const loadImg = src => {
    const im = (window.GameLoader?.track ? window.GameLoader.track(new Image()) : new Image());
    im.src = src;
    return im;
  };

  const bg = loadImg('assets/arena.png');
  const sheets = {
    atk_def: loadImg('assets/attack_defense_sheet.png'),
    def_atk: loadImg('assets/defense_attack_sheet.png'),
    clash:   loadImg('assets/attack_attack_sheet.png'),
    stance:  loadImg('assets/defense_defense_sheet.png')
  };

  // Kích thước canvas responsive giữ tỷ lệ chuẩn
  const resize = () => {
    canvas.width = 960;
    canvas.height = Math.round(canvas.clientHeight / canvas.clientWidth * 960) || 540;
  };
  new ResizeObserver(resize).observe(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. TRẠNG THÁI GAME LOGIC CỦA SSG105
  let mode = 'bot';          // 'bot' | 'versus'
  let level = 'normal';      // 'easy' | 'normal' | 'hard'
  let state = E.create();
  let phase = 'menu';        // 'menu' | 'countdown' | 'play' | 'paused' | 'result'
  let score = [0, 0];        // Thắng 2 hiệp để thắng trận
  let round = 1;
  let countdown = 0;
  let last = 0;
  let held = [false, false];
  let pausedFrom = 'play';
  let sound = false;
  let audio = null;
  let particles = [];
  let flash = 0;
  let visualTime = 0;
  let burstActive = -1;
  let burstTimer = 0;
  let dustParticles = [];

  const inputSources = [new Set(), new Set()];

  const tones = (frequency = 220, duration = 0.08) => {
    if (!sound) return;
    try {
      audio ??= new AudioContext();
      audio.resume();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(0.055, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + duration);
    } catch (_) {}
  };

  function clearInput() {
    inputSources.forEach(s => s.clear());
    held = [false, false];
    $('hold1').classList.remove('active');
    $('hold2').classList.remove('active');
  }

  function setInput(i, key, on) {
    if (on && phase !== 'play') return;
    if (on) inputSources[i].add(key);
    else inputSources[i].delete(key);
    held[i] = inputSources[i].size > 0;
    $('hold' + (i + 1)).classList.toggle('active', held[i]);
  }

  function configure() {
    const vs = mode === 'versus';
    $('control2').hidden = !vs;
    $('difficulty').hidden = vs;
    $('name1').textContent = vs ? 'NGƯỜI CHƠI 1' : 'BẠN';
    $('name2').textContent = vs ? 'NGƯỜI CHƠI 2' : 'ĐỐI THỦ';
    $('label1').textContent = vs ? 'NGƯỜI CHƠI 1' : 'LỰC CỦA BẠN';
    $('hold1').querySelector('kbd').textContent = vs ? 'A' : 'SPACE';
  }

  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    configure();
  });

  document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => {
    level = b.dataset.level;
    document.querySelectorAll('[data-level]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });

  function begin() {
    clearInput();
    state = E.create(mode === 'versus' ? 'normal' : level);
    phase = 'countdown';
    countdown = 3.1;
    particles = [];
    dustParticles = [];
    burstActive = -1;
    burstTimer = 0;
    $('overlay').hidden = true;
    $('pause').disabled = false;
    $('pause').textContent = 'Tạm dừng';
    $('round').textContent = 'HIỆP ' + round;
    $('callout').textContent = '';
    configure();
    updateHud();
  }

  function scoreboard() {
    score.forEach((v, i) => {
      $('score' + (i + 1)).textContent = Array.from({ length: 2 }, (_, j) => j < v ? '●' : '○').join(' ');
    });
  }

  function panel(title, copy, label) {
    $('panel-title').innerHTML = title;
    $('panel-copy').textContent = copy;
    $('start').textContent = label;
    $('setup').hidden = true;
    $('menu').hidden = false;
    $('overlay').hidden = false;
  }

  function finish() {
    clearInput();
    phase = 'result';
    $('pause').disabled = true;
    const w = state.winner;
    if (w < 2) score[w]++;
    scoreboard();
    const match = score.some(v => v === 2);
    const name = w === 0 ? (mode === 'bot' ? 'Bạn' : 'Người chơi 1') : 'Người chơi 2';
    const winnerName = w === 1 && mode === 'bot' ? 'Đối thủ' : name;

    const explanation = state.reason === 'ring' ? 'Đối phương đã bước khỏi vòng.' : 'Hết giờ: bên đẩy xa hơn giành hiệp thắng.';
    panel(
      w === 2 ? 'Bất phân<br>thắng bại.' : winnerName + (match ? ' thắng trận!' : ' thắng hiệp!'),
      w === 2 ? 'Hai bên ngang sức. Cùng đấu lại hiệp này!' : explanation + ' Tỉ số ' + score[0] + ' – ' + score[1] + '.',
      match ? 'Đấu lại →' : 'Hiệp tiếp theo →'
    );

    tones(w === 0 ? 660 : 180, 0.28);
    if (w === 0) {
      for (let i = 0; i < 65; i++) {
        particles.push({
          x: 480,
          y: 160,
          vx: (Math.random() - 0.5) * 330,
          vy: -Math.random() * 230,
          life: 3,
          color: ['#f6cf70', '#74c4b4', '#d97156'][i % 3]
        });
      }
    }
  }

  $('start').onclick = () => {
    if (phase === 'paused') { resume(); return; }
    if (phase === 'result') {
      if (score.some(v => v === 2)) {
        score = [0, 0];
        round = 1;
      } else if (state.winner !== 2) {
        round++;
      }
    } else {
      score = [0, 0];
      round = 1;
    }
    scoreboard();
    begin();
  };

  $('menu').onclick = () => {
    phase = 'menu';
    clearInput();
    $('setup').hidden = false;
    $('panel-title').innerHTML = 'Giữ thế.<br>Chớp thời cơ.';
    $('panel-copy').textContent = 'Bám vùng vàng để đẩy đối thủ khỏi vòng. Thắng 2 hiệp để thắng trận.';
    $('start').textContent = 'Vào sân →';
    $('menu').hidden = true;
    $('pause').disabled = true;
  };

  function pause() {
    if (!['play', 'countdown'].includes(phase)) return;
    pausedFrom = phase;
    phase = 'paused';
    clearInput();
    panel('Tạm nghỉ.', 'Trận đấu đang chờ bạn.', 'Tiếp tục →');
    $('pause').textContent = 'Tiếp tục';
  }

  function resume() {
    phase = pausedFrom;
    clearInput();
    $('overlay').hidden = true;
    $('pause').textContent = 'Tạm dừng';
  }

  $('pause').onclick = () => phase === 'paused' ? resume() : pause();

  $('sound').onclick = () => {
    sound = !sound;
    $('sound').textContent = sound ? '♫' : '♪';
    $('sound').title = sound ? 'Tắt âm thanh' : 'Bật âm thanh';
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', sound ? 'Tắt âm thanh' : 'Bật âm thanh');
    tones(440);
  };

  $('help').onclick = () => { pause(); $('guide').showModal(); };
  $('close-guide').onclick = () => $('guide').close();

  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);

  function keyIndex(code) {
    if (code === 'Space' && mode === 'bot') return 0;
    if (code === 'KeyA') return 0;
    if (code === 'ArrowUp' && mode === 'versus') return 1;
    return -1;
  }

  window.addEventListener('keydown', e => {
    if ($('guide').open) return;
    if (e.code === 'Escape') {
      if (phase === 'paused') resume();
      else pause();
      return;
    }
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const i = keyIndex(e.code);
    if (i >= 0) {
      e.preventDefault();
      setInput(i, e.code, true);
    }
  });

  window.addEventListener('keyup', e => {
    const i = keyIndex(e.code);
    if (i >= 0) {
      e.preventDefault();
      setInput(i, e.code, false);
    }
  });

  [0, 1].forEach(i => {
    const b = $('hold' + (i + 1));
    b.onpointerdown = e => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      setInput(i, 'p' + e.pointerId, true);
    };
    const release = e => setInput(i, 'p' + e.pointerId, false);
    b.onpointerup = release;
    b.onpointercancel = release;
    b.onlostpointercapture = release;
    b.onkeydown = e => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setInput(i, 'button', true);
      }
    };
    b.onkeyup = e => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setInput(i, 'button', false);
      }
    };
    b.onblur = () => setInput(i, 'button', false);
  });

  // 3. HỆ THỐNG VẼ HOẠT ẢNH & SÂN ĐẤU ĐẨY GẬY (ANIMATION + BACKGROUND)
  function resolveAnimation() {
    if (phase === 'countdown') {
      return { sheet: sheets.stance, fps: 6 };
    }
    // Ưu tiên 1: Đang có dồn lực bộc phát (Burst)
    if (burstActive === 0 || state.velocity > 0.08 || (state.players[0].quality > 0.85 && state.players[1].quality < 0.6)) {
      return { sheet: sheets.atk_def, fps: 8 };
    }
    if (burstActive === 1 || state.velocity < -0.08 || (state.players[1].quality > 0.85 && state.players[0].quality < 0.6)) {
      return { sheet: sheets.def_atk, fps: 8 };
    }
    // Ưu tiên 2: Cả 2 cùng bám tốt vùng vàng (Giằng co quyết liệt)
    if (state.players[0].quality > 0.65 && state.players[1].quality > 0.65) {
      return { sheet: sheets.clash, fps: 10 };
    }
    // Mặc định: Giữ thế thủ trung tính & hồi sức
    return { sheet: sheets.stance, fps: 6 };
  }

  function addDust(x, y, count = 3, vxScale = 1) {
    for (let i = 0; i < count; i++) {
      dustParticles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 25 * vxScale,
        vy: -Math.random() * 15 - 5,
        r: Math.random() * 3 + 2,
        alpha: 0.55,
        decay: Math.random() * 1.6 + 1.2,
        color: '#bfa477'
      });
    }
  }

  function draw() {
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Vẽ bối cảnh sân đấu Đẩy Gậy (arena.png)
    const scale = H / 616;
    const arenaW = Math.round(1447 * scale);
    const arenaH = H;
    const arenaX = Math.round((W - arenaW) / 2);
    const arenaY = 0;

    if (bg.complete && bg.naturalWidth) {
      ctx.drawImage(bg, arenaX, arenaY, arenaW, arenaH);
    } else {
      ctx.fillStyle = '#102e2b';
      ctx.fillRect(0, 0, W, H);
    }

    // Tâm sân đấu và cao độ tiếp đất trên vòng tròn phấn
    const canvas_cx = W / 2;
    const canvas_gy = arenaY + 478 * scale;
    const charScale = 0.52 * scale;

    // Chuyển vị vật lý từ engine SSG105 (-1 đến +1)
    const duelCenter = canvas_cx + state.position * 145 * (scale / (540 / 616));

    // 2. Vẽ bụi ma sát tiếp đất
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const d = dustParticles[i];
      d.x += d.vx * 0.016;
      d.y += d.vy * 0.016;
      d.vy += 100 * 0.016;
      d.alpha -= d.decay * 0.016;
      d.r += 0.016 * 4;
      if (d.alpha <= 0) { dustParticles.splice(i, 1); continue; }
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Phân định hoạt cảnh và tính frame từ Sprite Sheet (16 frames)
    const anim = resolveAnimation();
    const sheet = anim.sheet;

    const frameIndex = Math.floor(visualTime * anim.fps) % 16;
    const col = frameIndex % 4;
    const row = Math.floor(frameIndex / 4);
    const sx = col * 1024;
    const sy = row * 512;

    const drawW = Math.round(1024 * charScale);
    const drawH = Math.round(512 * charScale);
    const drawX = Math.round(duelCenter - 511.5 * charScale);
    const drawY = Math.round(canvas_gy - 476.0 * charScale);

    // Bụi chân khi trượt sàn
    if (Math.abs(state.velocity) > 0.15 && Math.random() < 0.25) {
      if (state.velocity > 0) {
        addDust(drawX + 850 * charScale, canvas_gy, 2, -1);
      } else {
        addDust(drawX + 170 * charScale, canvas_gy, 2, 1);
      }
    }

    // 4. Vẽ 2 võ sĩ đấu gậy (100% Solid frame sắc nét)
    if (sheet && sheet.complete && sheet.naturalWidth) {
      ctx.save();
      ctx.drawImage(sheet, sx, sy, 1024, 512, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // 5. Tên võ sĩ thanh thoát phía trên đầu (Chuẩn màu SSG105: Vàng P1 & Xanh P2)
    ctx.save();
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#102e2b';

    const p1Name = mode === 'versus' ? 'P1' : 'BẠN';
    const p2Name = mode === 'versus' ? 'P2' : 'ĐỐI THỦ';

    ctx.strokeText(p1Name, drawX + 240 * charScale, drawY + 25 * charScale);
    ctx.fillStyle = '#f6cf70';
    ctx.fillText(p1Name, drawX + 240 * charScale, drawY + 25 * charScale);

    ctx.strokeText(p2Name, drawX + 780 * charScale, drawY + 25 * charScale);
    ctx.fillStyle = '#74c4b4';
    ctx.fillText(p2Name, drawX + 780 * charScale, drawY + 25 * charScale);
    ctx.restore();

    // 6. Hạt hoa giấy pháo mừng chiến thắng
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y / 540 * H), 4, 4);
    }

    // 7. Đếm ngược vào trận
    if (phase === 'countdown') {
      ctx.fillStyle = '#fff0bd';
      ctx.font = 'bold 54px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#254036';
      ctx.lineWidth = 5;
      const text = countdown > 0.6 ? String(Math.ceil(countdown - 0.6)) : 'VÀO TRẬN!';
      ctx.strokeText(text, W / 2, H * 0.35);
      ctx.fillText(text, W / 2, H * 0.35);
    }
  }

  // 4. CẬP NHẬT GIAO DIỆN SSG105 (HUD, FORCE METERS, CLOCK)
  function updateHud() {
    state.players.forEach((p, i) => {
      const n = i + 1;
      const w = E.levels[state.level].width;
      $('needle' + n).style.left = (p.force * 100) + '%';
      $('target' + n).style.left = ((p.target - w / 2) * 100) + '%';
      $('target' + n).style.width = (w * 100) + '%';
      $('quality' + n).textContent = p.cooldown > 0
        ? 'Hồi thế ' + Math.ceil(p.cooldown) + 's'
        : p.quality > 0.95
          ? 'Dồn lực ' + Math.min(100, Math.round(p.focus / 0.85 * 100)) + '%'
          : p.quality > 0.5
            ? 'Đang giữ thế'
            : 'Lệch lực!';
    });
    $('clock').textContent = Math.ceil(state.time);
  }

  // 5. GAME LOOP ĐỒNG BỘ ENGINE SSG105 VÀ ANIMATION ĐẨY GẬY
  function loop(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    visualTime += dt;
    flash = Math.max(0, flash - dt * 2);

    if (burstTimer > 0) {
      burstTimer -= dt;
      if (burstTimer <= 0) burstActive = -1;
    }

    if (phase === 'countdown') {
      const previous = Math.ceil(countdown);
      countdown -= dt;
      if (Math.ceil(countdown) !== previous) tones(330, 0.06);
      if (countdown <= 0) {
        phase = 'play';
        $('callout').textContent = '';
      }
    }

    if (phase === 'play') {
      const bursts = E.step(state, dt, held, mode === 'bot');
      if (bursts.length) {
        flash = 1;
        burstActive = bursts[0];
        burstTimer = 1.2; // Giữ hoạt cảnh tấn công trọn vẹn chu trình bước chân
        $('callout').textContent = bursts.includes(0) ? 'DỒN LỰC!' : 'ĐỐI THỦ DỒN LỰC!';
        tones(bursts.includes(0) ? 520 : 220, 0.15);
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: 480 + state.position * 180,
            y: 440,
            vx: (Math.random() - 0.5) * 120,
            vy: -Math.random() * 85,
            life: 0.6,
            color: '#efd292'
          });
        }
      } else if (flash === 0) {
        $('callout').textContent = Math.abs(state.position) > 0.7 ? 'SÁT MÉP VÒNG!' : '';
      }
      updateHud();
      if (state.winner !== null) finish();
    }

    if (phase !== 'paused') {
      particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.life -= dt;
      });
      particles = particles.filter(p => p.life > 0);
    }

    draw();
    requestAnimationFrame(loop);
  }

  configure();
  resize();
  updateHud();
  if (new URLSearchParams(location.search).get('autoplay') === '1') {
    setTimeout(() => { $('start').click(); }, 300);
  }
  requestAnimationFrame(loop);
})();