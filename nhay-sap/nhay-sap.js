/**
 * =========================================================================
 * NHẢY SẠP VÙNG CAO - TRÒ CHƠI DÂN GIAN ĐẶC SẮC TÂY BẮC
 * =========================================================================
 * Traditional Vietnamese Bamboo Dance Rhythm Game
 * Features:
 *  - 4-beat rhythmic cycle with authentic clapper and dancer animation
 *  - Authentic bamboo clack sound effects synthesized via Web Audio API
 *  - Dynamic lanes, timing rail, combo multiplier, health system
 *  - High performance canvas rendering with smooth sprite interpolation
 */

(() => {
  'use strict';

  // --- AUDIO SYNTHESIZER FOR BAMBOO DANCE ---
  class BambooAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.bgmPlaying = false;
      this.bgmTimer = null;
      this.stepCounter = 0;
      this.initContext();
    }

    initContext() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.ctx) {
        this.ctx = new AudioCtx();
      }
    }

    ensureRunning() {
      if (!this.ctx) this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
      if (muted && this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
        this.bgmPlaying = false;
      }
    }

    // Tiếng gõ sạp xuống đòn kê ("CỘP" - Trầm, rỗng, vang gỗ)
    playBambooTap(volume = 0.7) {
      if (this.isMuted) return;
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    }

    // Tiếng đập hai cây sạp vào nhau ("CHÁCH" - Đanh, dứt khoát, thanh)
    playBambooClack(volume = 0.9) {
      if (this.isMuted) return;
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High-pitched click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);

      // White noise snap burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(volume * 0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.07);
    }

    // Tiếng nhảy bật lên (Whoosh)
    playJumpSound() {
      if (this.isMuted) return;
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    }

    // Tiếng chuông thưởng trúng nhịp (Chime)
    playScoreChime(type = 'perfect') {
      if (this.isMuted) return;
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = (type === 'perfect') ? [659.25, 880, 1046.5] : [523.25, 659.25];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.2, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.3);
      });
    }

    // Tiếng vấp ngã / kẹp chân (Thump)
    playTripSound() {
      if (this.isMuted) return;
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    }

    // Giai điệu dân gian Tây Bắc (Điệu Khèn / Sáo H'Mông ngũ cung rộn rã)
    startTraditionalBGM(bpm = 103) {
      if (this.isMuted) return;
      this.ensureRunning();
      if (this.bgmPlaying) return;
      this.bgmPlaying = true;

      const beatMs = (60 / bpm) * 1000;
      // Thang âm ngũ cung Tây Bắc: C4, D4, F4, G4, A4, C5, D5
      const notes = [
        261.63, 293.66, 349.23, 392.00, 440.00,
        523.25, 587.33, 698.46, 783.99, 880.00
      ];
      // Đoạn nhạc mẫu nhịp điệu lễ hội
      const melodyPattern = [
        0, 2, 3, 4,
        2, 3, 5, 4,
        3, 2, 0, 2,
        4, 5, 4, 3,
        5, 6, 7, 5,
        4, 3, 2, 3,
        4, 2, 0, 2,
        0, -1, 2, 0
      ];

      this.bgmTimer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        const noteIdx = melodyPattern[this.stepCounter % melodyPattern.length];
        this.stepCounter++;

        if (noteIdx >= 0) {
          const freq = notes[noteIdx];
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          // Sắc thái khèn/sáo nứa mộc mạc
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now);
          filter.Q.setValueAtTime(2.0, now);

          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.75);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + (beatMs / 1000) * 0.8);
        }
      }, beatMs / 2); // 8th notes
    }

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      this.bgmPlaying = false;
    }
  }

  // --- GAME CONSTANTS & CONFIGURATION ---
  let cfg = window.NHAY_SAP_CONFIG;
  try {
    const local = localStorage.getItem('nhay_sap_editor_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed?.stage?.lanes) && parsed.stage.lanes.length >= 1 && (!cfg?.lastModified || parsed.lastModified >= cfg.lastModified)) {
        cfg = parsed;
      }
    }
  } catch (e) {}

  const CANVAS_WIDTH = cfg?.stage?.canvasWidth || 1672;
  const CANVAS_HEIGHT = cfg?.stage?.canvasHeight || 941;

  // Bamboo Lanes (positions in canvas coordinates - 4 cặp sạp cách đều 180px tạo thành 3 luống)
  let LANE_X_POSITIONS = cfg?.stage?.lanes || [
    657,  // Lane 0: Giữa cặp sạp 1 & 2
    837,  // Lane 1: Giữa cặp sạp 2 & 3 (Tâm sàn khấu)
    1017  // Lane 2: Giữa cặp sạp 3 & 4
  ];
  let SAFE_LEFT_X = cfg?.stage?.safeLeftX || 477;   // Bờ an toàn bên trái
  let SAFE_RIGHT_X = cfg?.stage?.safeRightX || 1197; // Bờ an toàn bên phải

  let FLOOR_Y = cfg?.stage?.floorY || 550;
  let JUMP_Y_OFFSET = cfg?.stage?.jumpYOffset || -90;

  // Cắt sprite chính xác từng frame (Zero bleed & Neo gót chân chuẩn xác)
  const SPRITE_FRAMES = cfg?.objects?.dancer?.frames || {
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

  // --- GAME APPLICATION ---
  class NhaySapGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new BambooAudio();

      this.bpm = 103;
      this.beatDuration = (60 / this.bpm) * 1000; // ms per beat

      // State
      this.isPlaying = false;
      this.isGameOver = false;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.hearts = 3;
      this.maxHearts = 3;
      this.highScore = parseInt(localStorage.getItem('nhaysap_highscore') || '0', 10);

      // Rhythm tracking
      this.currentBeat = 0; // 0, 1, 2 (Open), 3 (Closed)
      this.beatTimeTracker = 0;
      this.lastTimestamp = 0;

      // Dancer state
      this.currentLane = 1; // 0..2 (1 is exact center)
      this.targetX = LANE_X_POSITIONS[this.currentLane];
      this.dancerX = this.targetX;
      this.dancerY = FLOOR_Y;
      this.jumpStartX = this.dancerX;
      this.isAirborne = false;
      this.jumpProgress = 0; // 0..1
      this.isTripped = false;
      this.tripProgress = 0;
      this.invincibleTimer = 0; // ms
      this.dancerFacing = 1; // 1: forward, -1: back

      // Animation frame counters
      this.dancerAnimFrame = 0;
      this.dancerAnimTimer = 0;

      // Cues & Timing rail
      this.cues = [];
      this.nextCueTime = 0;
      this.particles = [];
      this.floatingTexts = [];

      // Asset repository
      this.assets = {};
      this.assetsLoaded = false;

      // Bind UI & Inputs
      this.initUI();
      this.initInputs();
      this.loadAssets(() => {
        this.assetsLoaded = true;
        this.resizeCanvas();
        this.startLoop();
        this.updateHUD();
      });
    }

    loadAssets(onComplete) {
      const assetList = [
        { key: 'valley', src: '../assets/nhay-sap/thung-lung.png' },
        { key: 'beams', src: '../assets/nhay-sap/sap-tre.png' },
        { key: 'clappers_mo_ha', src: '../assets/nhay-sap/clappers_mo_ha.png' },
        { key: 'clappers_mo_nang', src: '../assets/nhay-sap/clappers_mo_nang.png' },
        { key: 'clappers_dong_ha', src: '../assets/nhay-sap/clappers_dong_ha.png' },
        { key: 'clappers_dong_nang', src: '../assets/nhay-sap/clappers_dong_nang.png' },
        { key: 'dancer_forward', src: '../assets/nhay-sap/dancer_nhay_truoc.png' },
        { key: 'dancer_back', src: '../assets/nhay-sap/dancer_nhay_lui.png' },
        { key: 'dancer_trip', src: '../assets/nhay-sap/dancer_nga.png' },
        { key: 'wood_header', src: '../assets/ui/wood_header_mountains.png' }
      ];

      let loadedCount = 0;
      assetList.forEach(item => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          this.assets[item.key] = img;
          loadedCount++;
          if (loadedCount === assetList.length) {
            onComplete();
          }
        };
        img.onerror = () => {
          console.warn('Failed loading asset:', item.src);
          loadedCount++;
          if (loadedCount === assetList.length) {
            onComplete();
          }
        };
      });
    }

    resizeCanvas() {
      // Keep internal resolution at 1672x941
      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;
    }

    initUI() {
      // High score display
      document.getElementById('stat-highscore').textContent = this.highScore;

      // Audio Toggle Button
      const btnAudio = document.getElementById('btn-audio');
      const audioIcon = document.getElementById('audio-icon-img');
      btnAudio?.addEventListener('click', () => {
        const newMuted = !this.audio.isMuted;
        this.audio.setMuted(newMuted);
        if (audioIcon) {
          audioIcon.src = newMuted ? '../assets/ui/icon_sound_off.png' : '../assets/ui/icon_sound_on.png';
        }
        btnAudio.title = newMuted ? 'Bật âm thanh' : 'Tắt âm thanh';
        if (!newMuted && this.isPlaying) {
          this.audio.startTraditionalBGM(this.bpm);
        }
      });

      // Restart Button
      document.getElementById('btn-restart')?.addEventListener('click', () => {
        this.startGame();
      });

      // Modals
      const guideModal = document.getElementById('modal-guide');
      const cultureModal = document.getElementById('modal-culture');
      const gameOverModal = document.getElementById('modal-gameover');

      document.getElementById('btn-guide')?.addEventListener('click', () => {
        guideModal?.classList.add('open');
      });
      document.getElementById('btn-culture')?.addEventListener('click', () => {
        cultureModal?.classList.add('open');
      });

      document.querySelectorAll('.modal-close-btn, .btn-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
        });
      });

      document.getElementById('btn-gameover-replay')?.addEventListener('click', () => {
        gameOverModal?.classList.remove('open');
        this.startGame();
      });

      // Start Game on Canvas Click if not started
      this.canvas.addEventListener('click', () => {
        if (!this.isPlaying && !this.isGameOver) {
          this.startGame();
        }
      });
    }

    initInputs() {
      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (!this.isPlaying && !this.isGameOver) {
          this.startGame();
          return;
        }

        switch (e.code) {
          case 'ArrowLeft':
          case 'KeyA':
            this.handleStepLeft();
            this.highlightBtn('btn-key-left');
            break;
          case 'ArrowRight':
          case 'KeyD':
            this.handleStepRight();
            this.highlightBtn('btn-key-right');
            break;
          case 'ArrowUp':
          case 'KeyW':
          case 'Space':
            e.preventDefault();
            this.handleJump();
            this.highlightBtn('btn-key-jump');
            break;
          case 'ArrowDown':
          case 'KeyS':
            this.handleStepDown();
            this.highlightBtn('btn-key-down');
            break;
        }
      });

      // Touch Buttons
      document.getElementById('btn-key-left')?.addEventListener('click', () => this.handleStepLeft());
      document.getElementById('btn-key-right')?.addEventListener('click', () => this.handleStepRight());
      document.getElementById('btn-key-jump')?.addEventListener('click', () => this.handleJump());
      document.getElementById('btn-key-down')?.addEventListener('click', () => this.handleStepDown());
    }

    highlightBtn(id) {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 120);
      }
    }

    startGame() {
      this.isPlaying = true;
      this.isGameOver = false;
      this.score = 0;
      this.combo = 0;
      this.hearts = this.maxHearts;

      // Reload any customized lanes from local storage
      try {
        const local = localStorage.getItem('nhay_sap_editor_config');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed?.stage?.lanes)) {
            cfg = parsed;
          }
        }
      } catch (e) {}

      LANE_X_POSITIONS = cfg?.stage?.lanes || [657, 837, 1017];
      SAFE_LEFT_X = cfg?.stage?.safeLeftX || 477;
      SAFE_RIGHT_X = cfg?.stage?.safeRightX || 1197;
      FLOOR_Y = cfg?.stage?.floorY || 550;

      this.currentLane = Math.min(1, LANE_X_POSITIONS.length - 1);
      this.targetX = LANE_X_POSITIONS[this.currentLane] || 837;
      this.dancerX = this.targetX;
      this.dancerY = FLOOR_Y;
      this.isAirborne = false;
      this.isTripped = false;
      this.invincibleTimer = 0;
      this.currentBeat = 0;
      this.beatTimeTracker = 0;
      this.cues = [];
      this.particles = [];
      this.floatingTexts = [];

      this.audio.stopBGM();
      this.audio.startTraditionalBGM(this.bpm);

      this.updateHUD();
      this.showAnnouncement('HỘI BẮT ĐẦU!', 'safe');

      // Check collision immediately on start if standing on bamboo
      this.checkContinuousPoleCollision();
    }

    // --- STEP & LEAP ACTIONS (Nhảy dứt khoát chuẩn khoảng cách giữa các cặp sạp) ---
    performJumpTo(targetX, facing) {
      this.jumpStartX = this.dancerX;
      this.targetX = targetX;
      this.isAirborne = true;
      this.jumpProgress = 0;
      this.dancerFacing = facing;
      this.audio.playJumpSound();
    }

    handleStepLeft() {
      if (!this.isPlaying || this.isTripped) return;
      if (this.currentLane > -1) {
        this.currentLane--;
        const nextX = (this.currentLane === -1) ? SAFE_LEFT_X : LANE_X_POSITIONS[this.currentLane];
        this.performJumpTo(nextX, -1);
        this.checkRhythmHit('left');
      }
    }

    handleStepRight() {
      if (!this.isPlaying || this.isTripped) return;
      const maxLane = LANE_X_POSITIONS.length;
      if (this.currentLane < maxLane) {
        this.currentLane++;
        const nextX = (this.currentLane === maxLane) ? SAFE_RIGHT_X : LANE_X_POSITIONS[this.currentLane];
        this.performJumpTo(nextX, 1);
        this.checkRhythmHit('right');
      }
    }

    handleJump() {
      if (!this.isPlaying || this.isTripped) return;
      const jRules = cfg?.rules?.jump;
      if (jRules) {
        if (jRules.requireGrounded !== false && this.isAirborne && !jRules.allowDoubleJump) return;
        if (!jRules.allowAnytime) {
          const isAllowedBeat = jRules.allowedBeats ? jRules.allowedBeats[this.currentBeat] : true;
          const beatPct = this.beatTimeTracker / this.beatDuration;
          const isAllowedWin = beatPct >= (jRules.windowStartPercent ?? 0.0) && beatPct <= (jRules.windowEndPercent ?? 1.0);
          if (!isAllowedBeat || !isAllowedWin) {
            this.showAnnouncement('CHƯA ĐƯỢC NHẢY!', 'danger');
            this.audio.playBambooTap(0.2);
            return;
          }
        }
      } else {
        if (this.isAirborne) return;
      }

      // Nhảy vọt lên trên không tại luống hiện tại để tránh sạp kẹp nhịp 4
      this.performJumpTo(this.dancerX, this.dancerFacing);
      this.checkRhythmHit('jump');
    }

    handleStepDown() {
      if (!this.isPlaying || this.isTripped) return;
      // Step in place / dance groove
      this.dancerAnimFrame = (this.dancerAnimFrame + 1) % 6;
      this.audio.playBambooTap(0.35);
      this.checkRhythmHit('down');
    }

    checkRhythmHit(action) {
      // Find closest cue in the timing target window
      const targetX = 80; // target zone center on rail
      let bestCue = null;
      let minDistance = 9999;

      for (const cue of this.cues) {
        if (!cue.hit && cue.direction === action) {
          const dist = Math.abs(cue.x - targetX);
          if (dist < minDistance && dist < 65) {
            minDistance = dist;
            bestCue = cue;
          }
        }
      }

      if (bestCue) {
        bestCue.hit = true;
        let pts = 25;
        let rating = 'KHÉO LÉO!';
        let type = 'good';

        if (minDistance <= 18) {
          pts = 100;
          rating = 'HOÀN HẢO!';
          type = 'perfect';
          this.spawnHitStars(this.dancerX, this.dancerY - 60);
        } else if (minDistance <= 38) {
          pts = 50;
          rating = 'TUYỆT VỜI!';
          type = 'great';
        }

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const multiplier = Math.min(4, 1 + Math.floor(this.combo / 10));
        const finalPts = pts * multiplier;
        this.score += finalPts;

        this.audio.playScoreChime(type);
        this.addFloatingText(`${rating} +${finalPts}`, this.dancerX, this.dancerY - 90, type);
        this.updateHUD();
      }
    }

    // --- BEAT CYCLE & CLAPPERS ---
    onBeat(beatIdx) {
      this.currentBeat = beatIdx;

      // Update Pip UI
      const pips = document.querySelectorAll('.beat-pip');
      pips.forEach((pip, idx) => {
        if (idx === beatIdx) {
          pip.classList.add('active');
        } else {
          pip.classList.remove('active');
        }
      });

      if (beatIdx === 3) {
        // BEAT 4: SẠP ĐÓNG ("CHÁCH!" / "CỘP!")
        this.audio.playBambooClack(0.95);
        this.checkClapperDanger();
      } else {
        // BEATS 1, 2, 3: SẠP MỞ ("CỘP!")
        this.audio.playBambooTap(0.7);
        // Spawn rhythm cue
        if (this.isPlaying) {
          this.spawnCue();
        }
      }
    }

    // --- VA CHẠM SẠP LIÊN TỤC & SÁT THƯƠNG TỨC THÌ (CHỈ MẤT MÁU KHI ĐÓNG SẠP - NHỊP 4) ---
    checkContinuousPoleCollision() {
      if (!this.isPlaying || this.isAirborne || this.isTripped || this.invincibleTimer > 0) return;

      // CHỈ MẤT MÁU KHI ĐÓNG SẠP (Nhịp 4 / Beat 3): Khi sạp mở (nhịp 1, 2, 3), nhân vật đứng an toàn!
      const dmgRules = cfg?.rules?.damage;
      const isHarmfulBeat = dmgRules?.activeBeats ? dmgRules.activeBeats[this.currentBeat] : (this.currentBeat === 3);
      if (!isHarmfulBeat) return;

      const clapperScale = cfg?.objects?.clappers?.scale || 0.50;
      const clapperX = (CANVAS_WIDTH - CANVAS_WIDTH * clapperScale) / 2 + (cfg?.objects?.clappers?.offsetX || 0);
      const ratio = clapperScale / 0.50;

      // 4 cặp sạp tre khi khép chặt ở nhịp 4
      const hazardZones = [
        { min: Math.round(clapperX + 90 * ratio),  max: Math.round(clapperX + 183 * ratio), name: 'Cặp Sạp 1' },
        { min: Math.round(clapperX + 280 * ratio), max: Math.round(clapperX + 370 * ratio), name: 'Cặp Sạp 2' },
        { min: Math.round(clapperX + 470 * ratio), max: Math.round(clapperX + 559 * ratio), name: 'Cặp Sạp 3' },
        { min: Math.round(clapperX + 656 * ratio), max: Math.round(clapperX + 750 * ratio), name: 'Cặp Sạp 4' }
      ];

      const footRadius = cfg?.objects?.dancer?.footHitboxRadius || 14;
      const footLeft = this.dancerX - footRadius;
      const footRight = this.dancerX + footRadius;

      for (const hz of hazardZones) {
        if (footRight >= hz.min && footLeft <= hz.max) {
          this.triggerDamage(`SẠP ĐÓNG KẸP CHÂN TẠI ${hz.name.toUpperCase()}!`);
          break;
        }
      }
    }

    triggerDamage(reason = 'CHẠM PHẢI SẠP!') {
      if (this.invincibleTimer > 0) return;

      this.isTripped = true;
      this.tripProgress = 0;
      const dmgRules = cfg?.rules?.damage;
      const loss = dmgRules?.damageAmount || 1;
      this.hearts = Math.max(0, this.hearts - loss);
      this.combo = 0;
      this.invincibleTimer = dmgRules?.invincibilityDuration || 1800;

      this.audio.playTripSound();
      this.showAnnouncement(reason, 'danger');
      this.addFloatingText(`ÔI CHAO! -${loss} ❤️`, this.dancerX, this.dancerY - 80, 'danger');
      this.updateHUD();

      if (this.hearts <= 0) {
        this.onGameOver();
      }
    }

    checkClapperDanger() {
      const dmgRules = cfg?.rules?.damage;
      const isHarmfulBeat = dmgRules?.activeBeats ? dmgRules.activeBeats[this.currentBeat] : (this.currentBeat === 3);
      if (!isHarmfulBeat) return;

      // Nhịp 4: Sạp khép đập vào nhau
      // CHỈ KẸP CHÂN NẾU ĐANG Ở VỊ TRÍ TRÚNG CẶP SẠP TRE (Vị trí đỏ / sạp dập)!
      // Ở VỊ TRÍ XANH (giữa các cặp sạp như Luống 1, bờ an toàn) THÌ KHÔNG BỊ KẸP CHÂN!
      const clapperScale = cfg?.objects?.clappers?.scale || 0.50;
      const clapperX = (CANVAS_WIDTH - CANVAS_WIDTH * clapperScale) / 2 + (cfg?.objects?.clappers?.offsetX || 0);
      const ratio = clapperScale / 0.50;

      const hazardZones = [
        { min: Math.round(clapperX + 90 * ratio),  max: Math.round(clapperX + 183 * ratio), name: 'Cặp Sạp 1' },
        { min: Math.round(clapperX + 280 * ratio), max: Math.round(clapperX + 370 * ratio), name: 'Cặp Sạp 2' },
        { min: Math.round(clapperX + 470 * ratio), max: Math.round(clapperX + 559 * ratio), name: 'Cặp Sạp 3' },
        { min: Math.round(clapperX + 656 * ratio), max: Math.round(clapperX + 750 * ratio), name: 'Cặp Sạp 4' }
      ];

      const footRadius = cfg?.objects?.dancer?.footHitboxRadius || 14;
      const footLeft = this.dancerX - footRadius;
      const footRight = this.dancerX + footRadius;
      const isOverBamboo = hazardZones.some(hz => footRight >= hz.min && footLeft <= hz.max);

      // Nếu đang ở vị trí xanh (không chạm sạp): hoàn toàn an toàn, KHÔNG BỊ KẸP CHÂN!
      if (!isOverBamboo) {
        return;
      }

      // Nếu đang ở vị trí sạp dập vào nhau:
      if (!this.isAirborne && this.invincibleTimer <= 0) {
        this.triggerDamage('SẠP ĐÓNG KẸP CHÂN!');
      } else if (this.isAirborne && this.isPlaying) {
        // Thưởng nhảy vượt sạp thành công ở nhịp 4
        this.score += 150;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.addFloatingText('VƯỢT SẠP! +150', this.dancerX, this.dancerY - 100, 'perfect');
        this.audio.playScoreChime('perfect');
        this.updateHUD();
      }
    }

    onGameOver() {
      this.isPlaying = false;
      this.isGameOver = true;
      this.audio.stopBGM();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('nhaysap_highscore', this.highScore.toString());
      }

      document.getElementById('final-score-val').textContent = this.score;
      document.getElementById('final-max-combo').textContent = this.maxCombo;
      document.getElementById('stat-highscore').textContent = this.highScore;

      setTimeout(() => {
        document.getElementById('modal-gameover')?.classList.add('open');
      }, 800);
    }

    spawnCue() {
      const directions = ['left', 'right', 'jump', 'down'];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      this.cues.push({
        direction: dir,
        x: 660, // starts at right of rail
        hit: false,
        missed: false
      });
    }

    updateHUD() {
      document.getElementById('stat-score').textContent = this.score;
      document.getElementById('stat-combo').textContent = this.combo > 0 ? `${this.combo}x` : '0';

      // Update hearts
      const heartElements = document.querySelectorAll('.heart-icon');
      heartElements.forEach((h, idx) => {
        if (idx < this.hearts) {
          h.classList.remove('lost');
        } else {
          h.classList.add('lost');
        }
      });
    }

    showAnnouncement(text, type = 'perfect') {
      const banner = document.getElementById('beat-status-banner');
      if (!banner) return;
      banner.textContent = text;
      banner.className = `beat-status-banner show ${type}`;
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => {
        banner.classList.remove('show');
      }, 800);
    }

    addFloatingText(text, x, y, type = 'perfect') {
      this.floatingTexts.push({
        text,
        x,
        y,
        alpha: 1.0,
        type,
        vy: -1.8
      });
    }

    spawnHitStars(x, y) {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1.0,
          color: Math.random() > 0.5 ? '#edc35b' : '#fff'
        });
      }
    }

    // --- MAIN ENGINE LOOP ---
    startLoop() {
      const tick = (now) => {
        if (!this.lastTimestamp) this.lastTimestamp = now;
        const dt = Math.min(100, now - this.lastTimestamp);
        this.lastTimestamp = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    update(dt) {
      // 1. Beat cycle timing
      if (this.isPlaying) {
        this.beatTimeTracker += dt;
        if (this.beatTimeTracker >= this.beatDuration) {
          this.beatTimeTracker -= this.beatDuration;
          const nextBeat = (this.currentBeat + 1) % 4;
          this.onBeat(nextBeat);
        }
      }

      // 2 & 3. Dancer Leap & Jump Arc Physics (Vòng cung nhảy vượt qua sạp chính xác)
      if (this.isAirborne) {
        const jDur = cfg?.stage?.jumpDuration || 400;
        const jLift = cfg?.stage?.jumpYOffset || -90;
        this.jumpProgress += dt / jDur;
        if (this.jumpProgress >= 1) {
          this.isAirborne = false;
          this.jumpProgress = 0;
          this.dancerX = this.targetX;
          this.dancerY = FLOOR_Y;
          this.checkContinuousPoleCollision();
        } else {
          // Bước nhảy vòng cung: X lướt đều sang luống đích, Y đạt đỉnh cao nhất đúng ngay trên thân sạp
          const t = this.jumpProgress;
          this.dancerX = this.jumpStartX + (this.targetX - this.jumpStartX) * t;
          const arc = Math.sin(t * Math.PI);
          this.dancerY = FLOOR_Y + jLift * arc;
        }
      } else {
        // Định vị gót chân vững trên mặt sàn
        this.dancerX += (this.targetX - this.dancerX) * 0.25;
        this.dancerY = FLOOR_Y;
        this.checkContinuousPoleCollision();
      }

      // 4. Tripped recovery animation
      if (this.isTripped) {
        this.tripProgress += dt / 1400;
        if (this.tripProgress >= 1) {
          this.isTripped = false;
          this.tripProgress = 0;
        }
      }

      // 5. Invincibility blink timer
      if (this.invincibleTimer > 0) {
        this.invincibleTimer -= dt;
      }

      // 6. Dancer idle animation
      this.dancerAnimTimer += dt;
      if (this.dancerAnimTimer > 110) {
        this.dancerAnimTimer = 0;
        this.dancerAnimFrame = (this.dancerAnimFrame + 1) % 6;
      }

      // 7. Update timing rail cues
      const railSpeed = 300; // px/sec
      for (let i = this.cues.length - 1; i >= 0; i--) {
        const cue = this.cues[i];
        cue.x -= (railSpeed * dt) / 1000;

        // Missed cue
        if (cue.x < 30 && !cue.hit && !cue.missed) {
          cue.missed = true;
          this.combo = 0;
          this.updateHUD();
        }

        // Clean up out of bound cues
        if (cue.x < -20) {
          this.cues.splice(i, 1);
        }
      }

      // 8. Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / 600;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // 9. Update floating texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= dt / 900;
        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    render() {
      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Draw Valley Landscape Background
      if (this.assets.valley) {
        this.ctx.drawImage(this.assets.valley, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        this.ctx.fillStyle = '#6b8c42';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2. Draw Horizontal Cross-Beams & 3. Draw Clappers Animation (Thu nhỏ 50% toàn bộ hoạt ảnh)
      const clapperScale = cfg?.objects?.clappers?.scale || 0.50;
      const clapperW = CANVAS_WIDTH * clapperScale;
      const clapperH = CANVAS_HEIGHT * clapperScale;
      const clapperX = (CANVAS_WIDTH - clapperW) / 2 + (cfg?.objects?.clappers?.offsetX || 0);
      const clapperY = (cfg?.objects?.clappers?.offsetY !== undefined) ? cfg.objects.clappers.offsetY : 280;

      // 2. Cross-beams (cặp đòn kê thu nhỏ cùng tỉ lệ và vị trí với hoạt ảnh sạp)
      if (this.assets.beams) {
        if (clapperScale >= 0.98) {
          this.ctx.drawImage(this.assets.beams, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
          this.ctx.drawImage(this.assets.beams, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, clapperX, clapperY, clapperW, clapperH);
        }
      }

      // 3. Draw Clappers & Bamboo Poles (4 states based on rhythm) - Nguyên vẹn toàn bộ hoạt ảnh sạp thu nhỏ 50%
      let clapperImg = this.assets.clappers_mo_ha;
      if (this.currentBeat === 0) {
        clapperImg = this.assets.clappers_mo_ha;
      } else if (this.currentBeat === 1) {
        clapperImg = this.assets.clappers_mo_nang;
      } else if (this.currentBeat === 2) {
        clapperImg = this.assets.clappers_mo_ha;
      } else if (this.currentBeat === 3) {
        clapperImg = this.assets.clappers_dong_ha;
      }

      if (clapperImg) {
        if (clapperScale >= 0.98) {
          this.ctx.drawImage(clapperImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
          this.ctx.drawImage(clapperImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, clapperX, clapperY, clapperW, clapperH);
        }
      }

      // 4. Draw Dancer
      this.renderDancer();

      // 5. Draw Particles
      this.renderParticles();

      // 6. Draw Floating Texts
      this.renderFloatingTexts();

      // 7. Render Start / Instruction Overlay on Canvas if idle
      if (!this.isPlaying && !this.isGameOver) {
        this.renderStartOverlay();
      }
    }

    renderDancer() {
      // Invincibility blink
      if (this.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
        return;
      }

      let animKey = 'dancer_forward';
      let spriteSheet = this.assets.dancer_forward;
      let frameIdx = this.dancerAnimFrame;

      if (this.isTripped) {
        animKey = 'dancer_trip';
        spriteSheet = this.assets.dancer_trip;
        frameIdx = Math.min(5, Math.floor(this.tripProgress * 6));
      } else if (this.isAirborne) {
        // Hoạt ảnh nhảy uốn lượn trên không: tiến độ nhảy 0..1 tương ứng 6 frame chuẩn
        animKey = (this.dancerFacing === -1) ? 'dancer_back' : 'dancer_forward';
        spriteSheet = (this.dancerFacing === -1) ? (this.assets.dancer_back || this.assets.dancer_forward) : this.assets.dancer_forward;
        frameIdx = Math.min(5, Math.floor(this.jumpProgress * 6));
      } else if (this.dancerFacing === -1) {
        animKey = 'dancer_back';
        spriteSheet = this.assets.dancer_back || this.assets.dancer_forward;
      }

      if (!spriteSheet) return;

      const framesList = SPRITE_FRAMES[animKey] || SPRITE_FRAMES.dancer_forward;
      const fDef = framesList[frameIdx] || framesList[0];

      // Tỉ lệ scale chuẩn xác 0.20
      const scale = cfg?.objects?.dancer?.scale || 0.20;
      const dw = fDef.sw * scale;
      const dh = fDef.sh * scale;
      const dx = this.dancerX - fDef.footX * scale;
      const dy = this.dancerY - fDef.footY * scale;

      // Vẽ bóng đổ dưới sàn (bóng luôn nằm trên sàn FLOOR_Y kể cả khi nhân vật nhảy bổng lên)
      this.ctx.save();
      this.ctx.beginPath();
      const shadowW = dw * (cfg?.objects?.dancer?.shadowWidthRatio || 0.50);
      const shadowH = cfg?.objects?.dancer?.shadowHeight || 10;
      this.ctx.ellipse(this.dancerX, FLOOR_Y + 4, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(25, 15, 8, 0.45)';
      this.ctx.fill();
      this.ctx.restore();

      // Vẽ sprite frame cắt chuẩn từng pixel (Zero bleed)
      this.ctx.drawImage(
        spriteSheet,
        fDef.sx, fDef.sy, fDef.sw, fDef.sh,
        dx, dy, dw, dh
      );
    }

    renderParticles() {
      this.ctx.save();
      for (const p of this.particles) {
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    renderFloatingTexts() {
      this.ctx.save();
      for (const ft of this.floatingTexts) {
        this.ctx.globalAlpha = Math.max(0, ft.alpha);
        this.ctx.font = 'bold 24px "Be Vietnam Pro", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = ft.type === 'perfect' ? '#ffe285' : (ft.type === 'danger' ? '#f56565' : '#8cbb5c');
        this.ctx.fillText(ft.text, ft.x, ft.y);
      }
      this.ctx.restore();
    }

    renderStartOverlay() {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(20, 10, 5, 0.55)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Centered decorative announcement
      this.ctx.fillStyle = '#ffe285';
      this.ctx.font = '900 38px "Be Vietnam Pro", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText('NHẤN ĐỂ VÀO SÀN SẠP', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

      this.ctx.font = '600 20px "Be Vietnam Pro", sans-serif';
      this.ctx.fillStyle = '#fff3cf';
      this.ctx.fillText('Dùng phím Mũi Tên hoặc Nút Cảm Ứng để bước qua các luống tre', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18);
      this.ctx.fillText('Nhịp 4: Sạp khép lại — Hãy nhảy lên (Phím Cách / Phím Lên)!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 52);
      this.ctx.restore();
    }
  }

  // Initialize game on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new NhaySapGame();
  });
})();
