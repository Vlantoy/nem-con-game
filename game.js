/**
 * LỄ HỘI NÉM CÒN - Traditional Vietnamese Con Throwing Game
 * High-performance HTML5 Canvas physics game with authentic frame-by-frame aligned animations.
 */

(() => {
  'use strict';

  // ==========================================
  // CONFIGURATION & CONSTANTS
  // ==========================================
  const CANVAS_WIDTH = 1672;
  const CANVAS_HEIGHT = 941;
  const GROUND_Y = 830;

  // Character scale and world standing position on the field
  const CHAR_SCALE = 0.42;
  const CHAR_ANCHOR_X = 220; // Standing back-heel anchor position

  // Exact per-frame plant-foot (back heel & ground contact) coordinates
  // Measured from individual sprite pixel analysis to eliminate frame jitter
  const FRAME_ANCHORS = {
    'idle':     { x: 647, y: 1067 }, // Throw (3) - Ready idle stance
    'throw_2':  { x: 668, y: 1069 }, // Throw (2) - Follow-through
    'throw_3':  { x: 647, y: 1067 }, // Throw (3) - Ready
    'throw_4':  { x: 693, y: 1062 }, // Throw (4) - Wind down back
    'throw_5':  { x: 682, y: 1053 }, // Throw (5) - Swing up back
    'throw_7':  { x: 660, y: 1061 }, // Throw (7) - Cock back
    'throw_8':  { x: 503, y: 1067 }, // Throw (8) - Whip forward (corrected +144px offset)
    'throw_10': { x: 457, y: 1059 }, // Throw (10) - Release con (corrected +190px offset)
    'spin_1':   { x: 639, y: 1056 },
    'spin_2':   { x: 623, y: 1046 },
    'spin_3':   { x: 678, y: 1052 },
    'spin_4':   { x: 661, y: 1056 },
    'spin_5':   { x: 724, y: 1046 }, // Corrected -77px offset
    'spin_6':   { x: 646, y: 1062 },
    'spin_7':   { x: 643, y: 1060 },
    'spin_8':   { x: 630, y: 1068 },
    'spin_9':   { x: 636, y: 1046 }
  };

  // Exact per-frame right-hand (force launch center) coordinates
  // Measured from sprite pixel analysis to anchor ball release directly at the character's hand
  const HAND_COORDS = {
    'idle':     { x: 858, y: 441 },
    'throw_2':  { x: 902, y: 486 },
    'throw_3':  { x: 858, y: 441 },
    'throw_4':  { x: 707, y: 391 },
    'throw_5':  { x: 564, y: 423 },
    'throw_7':  { x: 498, y: 104 },
    'throw_8':  { x: 922, y: 213 },
    'throw_10': { x: 805, y: 411 },
    'spin_1':   { x: 876, y: 340 },
    'spin_2':   { x: 854, y: 348 },
    'spin_3':   { x: 503, y: 241 },
    'spin_4':   { x: 707, y: 391 },
    'spin_5':   { x: 564, y: 423 },
    'spin_6':   { x: 766, y: 475 },
    'spin_7':   { x: 869, y: 388 },
    'spin_8':   { x: 855, y: 375 },
    'spin_9':   { x: 852, y: 356 }
  };

  // Pole anchor and dimensions
  const POLE_SCALE = 760 / 2172; // ≈ 0.3499
  const POLE_BASE_OFFSET_X = 360;
  const POLE_BASE_OFFSET_Y = 2067;
  const POLE_ANCHOR_X = 1476;

  // Target Ring (on top of pole)
  const RING_CENTER_X = POLE_ANCHOR_X; // 1476
  const RING_CENTER_Y = GROUND_Y - (2067 - 233.5) * POLE_SCALE; // ≈ 188.8px
  const RING_INNER_RX = 22;
  const RING_INNER_RY = 50;
  const RING_OUTER_RX = 38;
  const RING_OUTER_RY = 66;

  // Physics constants
  const GRAVITY = 920;      // px/s^2
  const AIR_DRAG = 0.00025; // aerodynamic drag

  // Ordered spin frames for smooth counter-clockwise whirl:
  const SPIN_FRAMES = [3, 5, 4, 6, 7, 8, 9, 1, 2];

  // Exact tangential release angles for each frame in the whirl cycle
  const FRAME_TANGENTS = {
    3: { deg: -135, sweet: false, hint: 'Bay ngược (Quá muộn)' },
    5: { deg: 120,  sweet: false, hint: 'Cắm đất phía sau' },
    4: { deg: 65,   sweet: false, hint: 'Cắm xuống đất' },
    6: { deg: 15,   sweet: false, hint: 'Bắn thấp phía trước' },
    7: { deg: -25,  sweet: false, hint: 'Góc thấp' },
    8: { deg: -47,  sweet: true,  hint: 'GÓC TỐT (Nâng cao)!' },
    9: { deg: -50,  sweet: true,  hint: '⭐ GÓC HOÀN HẢO - THẢ NGAY! ⭐' },
    1: { deg: -53,  sweet: true,  hint: 'GÓC VỒNG CAO!' },
    2: { deg: -82,  sweet: false, hint: 'Quá bổng (Gần thẳng đứng)' }
  };

  // Game States
  const STATE = {
    LOADING: 0,
    IDLE: 1,
    SPINNING: 2,
    THROWING: 3,
    FLYING: 4,
    LANDED: 5
  };

  // ==========================================
  // WEB AUDIO SOUND SYNTHESIZER
  // ==========================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playWhoosh(pitch = 1.0) {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320 * pitch, now);
        filter.Q.setValueAtTime(3, now);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(170 * pitch, now + 0.08);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }

    playThrow() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) {}
    }

    playRimClack() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    }

    playGroundThud() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
      } catch (e) {}
    }

    playScoreCelebration() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // 1. Traditional Festival Drum (Trống Hội)
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(180, now);
        drumOsc.frequency.exponentialRampToValueAtTime(50, now + 0.45);
        drumGain.gain.setValueAtTime(0.55, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        drumOsc.connect(drumGain);
        drumGain.connect(this.ctx.destination);
        drumOsc.start(now);
        drumOsc.stop(now + 0.5);

        // 2. Victorious chime arpeggio: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const t = now + 0.08 * idx;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      } catch (e) {}
    }
  }

  // ==========================================
  // PARTICLE SYSTEM
  // ==========================================
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.ribbonTrail = [];
    }

    addConfetti(x, y, count = 75) {
      const colors = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#e67e22', '#fd79a8', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 140 + Math.random() * 340;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 120,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 6,
          life: 1.0,
          decay: 0.4 + Math.random() * 0.4,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 10
        });
      }
    }

    addDust(x, y, count = 14) {
      for (let i = 0; i < count; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 40 + Math.random() * 90;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.4 - 20,
          color: 'rgba(210, 180, 140, 0.7)',
          size: 3 + Math.random() * 5,
          life: 1.0,
          decay: 1.5,
          rotation: 0,
          vRot: 0
        });
      }
    }

    addTrailPoint(x, y, angle) {
      this.ribbonTrail.unshift({ x, y, angle, age: 0 });
      if (this.ribbonTrail.length > 25) {
        this.ribbonTrail.pop();
      }
    }

    clearTrail() {
      this.ribbonTrail = [];
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 450 * dt;
        p.rotation += p.vRot * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.ribbonTrail.length - 1; i >= 0; i--) {
        this.ribbonTrail[i].age += dt;
        if (this.ribbonTrail[i].age > 0.45) {
          this.ribbonTrail.splice(i, 1);
        }
      }
    }

    drawTrail(ctx) {
      if (this.ribbonTrail.length > 1) {
        ctx.save();
        const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#fd79a8'];
        colors.forEach((color, idx) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          const offset = (idx - 1.5) * 3.5;
          for (let i = 0; i < this.ribbonTrail.length; i++) {
            const pt = this.ribbonTrail[i];
            const perpX = -Math.sin(pt.angle) * offset;
            const perpY = Math.cos(pt.angle) * offset;
            const px = pt.x + perpX;
            const py = pt.y + perpY;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.globalAlpha = 0.60;
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    drawParticles(ctx) {
      ctx.save();
      for (const p of this.particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.restore();
    }

    draw(ctx) {
      this.drawTrail(ctx);
      this.drawParticles(ctx);
    }
  }

  // ==========================================
  // MAIN GAME CLASS
  // ==========================================
  class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.sound = new SoundManager();
      this.particles = new ParticleSystem();

      // UI Elements
      this.ui = {
        score: document.getElementById('score-val'),
        highscore: document.getElementById('highscore-val'),
        streak: document.getElementById('streak-val'),
        throws: document.getElementById('throws-count'),
        accuracy: document.getElementById('accuracy-val'),
        btnAudio: document.getElementById('btn-audio'),
        audioIcon: document.getElementById('audio-icon'),
        btnHelp: document.getElementById('btn-help'),
        btnReset: document.getElementById('btn-reset'),
        modalHelp: document.getElementById('modal-help'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        btnModalOk: document.getElementById('btn-modal-ok'),
        banner: document.getElementById('announcement-banner'),
        announceTitle: document.getElementById('announce-title'),
        announceScore: document.getElementById('announce-score')
      };

      // State variables
      this.state = STATE.LOADING;
      this.score = 0;
      this.highscore = parseInt(localStorage.getItem('nemcon_highscore') || '0', 10);
      this.streak = 0;
      this.totalThrows = 0;
      this.successfulThrows = 0;

      // Spinning & Throwing variables
      this.isActionActive = false;
      this.spinTimer = 0;
      this.spinPower = 0; // 0.0 to 1.0
      this.spinFrameTimer = 0;
      this.spinFrameIdx = 0;

      // Current active sprite key for drawing
      this.currentFrameKey = 'idle';

      // Throw animation
      this.throwAnimTimer = 0;

      // Projectile state
      this.projectile = {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        scale: 1.0,
        scored: false,
        hitPole: false,
        restTimer: 0
      };

      // Ring scoring celebration
      this.ringGlowTimer = 0;

      // Assets dictionary
      this.assets = {};
      this.assetsLoaded = 0;
      this.totalAssets = 0;

      this.initUI();
      this.loadAssets();
    }

    initUI() {
      this.ui.highscore.textContent = this.highscore;

      // Audio toggle
      this.ui.btnAudio.addEventListener('click', () => {
        this.sound.init();
        this.sound.enabled = !this.sound.enabled;
        this.ui.audioIcon.innerHTML = this.sound.enabled ? '🔊' : '🔇';
      });

      // Reset button
      this.ui.btnReset.addEventListener('click', () => {
        this.resetGame();
      });

      // Help Modal
      const openModal = () => this.ui.modalHelp.classList.remove('hidden');
      const closeModal = () => this.ui.modalHelp.classList.add('hidden');
      this.ui.btnHelp.addEventListener('click', openModal);
      this.ui.btnCloseModal.addEventListener('click', closeModal);
      this.ui.btnModalOk.addEventListener('click', closeModal);

      // Input Actions (Mouse, Touch, Spacebar)
      const startAction = (e) => {
        if (e) e.preventDefault();
        this.sound.init();
        if (this.state === STATE.IDLE) {
          this.isActionActive = true;
          this.state = STATE.SPINNING;
          this.spinTimer = 0;
          this.spinPower = 0;
          this.spinFrameTimer = 0;
          this.spinFrameIdx = 0;
        }
      };

      const endAction = (e) => {
        if (e) e.preventDefault();
        if (this.state === STATE.SPINNING && this.isActionActive) {
          this.isActionActive = false;
          this.performThrow();
        }
      };

      // Mouse events
      const wrapper = document.getElementById('canvas-wrapper');
      wrapper.addEventListener('mousedown', startAction);
      window.addEventListener('mouseup', endAction);

      // Touch events
      wrapper.addEventListener('touchstart', startAction, { passive: false });
      window.addEventListener('touchend', endAction, { passive: false });

      // Keyboard (Spacebar)
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat && this.state === STATE.IDLE) {
          startAction(e);
        }
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && this.state === STATE.SPINNING) {
          endAction(e);
        }
      });
    }

    resetGame() {
      this.score = 0;
      this.streak = 0;
      this.totalThrows = 0;
      this.successfulThrows = 0;
      this.updateStatsUI();
      this.state = STATE.IDLE;
      this.currentFrameKey = 'idle';
      this.particles.clearTrail();
    }

    updateStatsUI() {
      this.ui.score.textContent = this.score;
      this.ui.streak.textContent = this.streak;
      this.ui.throws.textContent = this.totalThrows;
      const acc = this.totalThrows > 0 ? Math.round((this.successfulThrows / this.totalThrows) * 100) : 0;
      this.ui.accuracy.textContent = `${acc}%`;

      if (this.score > this.highscore) {
        this.highscore = this.score;
        this.ui.highscore.textContent = this.highscore;
        localStorage.setItem('nemcon_highscore', this.highscore);
      }
    }

    showAnnouncement(title, scoreText) {
      this.ui.announceTitle.textContent = title;
      this.ui.announceScore.textContent = scoreText;
      this.ui.banner.classList.add('show');
      setTimeout(() => {
        this.ui.banner.classList.remove('show');
      }, 1600);
    }

    loadAssets() {
      const assetList = [
        { key: 'bg', src: 'Background.png' },
        { key: 'pole', src: 'Pole_transparent.png' },
        { key: 'quacon', src: 'quacon.png' },
        { key: 'quacon_fly', src: 'quacon_flying.png' },
        { key: 'idle', src: 'Throw (3).png' },
        // Spin frames 1..9
        ...Array.from({ length: 9 }, (_, i) => ({ key: `spin_${i + 1}`, src: `Spin (${i + 1}).png` })),
        // Throw frames
        { key: 'throw_2', src: 'Throw (2).png' },
        { key: 'throw_3', src: 'Throw (3).png' },
        { key: 'throw_4', src: 'Throw (4).png' },
        { key: 'throw_5', src: 'Throw (5).png' },
        { key: 'throw_7', src: 'Throw (7).png' },
        { key: 'throw_8', src: 'Throw (8).png' },
        { key: 'throw_10', src: 'Throw (10).png' }
      ];

      this.totalAssets = assetList.length;

      assetList.forEach(item => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          this.assets[item.key] = img;
          this.assetsLoaded++;
          if (this.assetsLoaded === this.totalAssets) {
            this.state = STATE.IDLE;
            this.currentFrameKey = 'idle';
            this.startLoop();
          }
        };
        img.onerror = () => {
          console.error('Failed loading asset:', item.src);
        };
      });

      this.drawLoading();
    }

    drawLoading() {
      if (this.state !== STATE.LOADING) return;
      this.ctx.fillStyle = '#1a0e0a';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const percent = this.totalAssets > 0 ? Math.round((this.assetsLoaded / this.totalAssets) * 100) : 0;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ĐANG TẢI LỄ HỘI NÉM CÒN...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      // Loading bar
      const barW = 400;
      const barH = 20;
      const barX = (CANVAS_WIDTH - barW) / 2;
      const barY = CANVAS_HEIGHT / 2 + 30;

      this.ctx.strokeStyle = '#c8963e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barW, barH);

      this.ctx.fillStyle = '#e67e22';
      this.ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (percent / 100), barH - 4);

      if (this.state === STATE.LOADING) {
        requestAnimationFrame(() => this.drawLoading());
      }
    }

    startLoop() {
      let lastTime = performance.now();
      const loop = (currentTime) => {
        const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
        lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    // ==========================================
    // GAME LOGIC & UPDATE
    // ==========================================
    update(dt) {
      this.particles.update(dt);

      if (this.ringGlowTimer > 0) {
        this.ringGlowTimer -= dt;
      }

      // STATE MACHINE
      switch (this.state) {
        case STATE.IDLE:
          this.updateIdle(dt);
          break;
        case STATE.SPINNING:
          this.updateSpinning(dt);
          break;
        case STATE.THROWING:
          this.updateThrowing(dt);
          break;
        case STATE.FLYING:
          this.updateFlying(dt);
          break;
        case STATE.LANDED:
          this.updateLanded(dt);
          break;
      }
    }

    updateIdle(dt) {
      this.currentFrameKey = 'idle';
    }

    updateSpinning(dt) {
      this.spinTimer += dt;

      // Charge power: from 20% to 100% over 2.20 seconds
      // 1st rotation (~0.6s): ~42% power -> Undershoots
      // 2nd rotation (~1.25s): 60% - 70% power -> Sweet spot (enters ring hole!)
      // 3rd rotation (~1.7s+): >80% power -> Overshoots past pole
      this.spinPower = Math.min(0.20 + 0.80 * (this.spinTimer / 2.20), 1.0);

      // Spin animation accelerates with power (110ms down to 42ms per frame)
      const frameDuration = 0.11 - this.spinPower * 0.068;
      this.spinFrameTimer += dt;
      if (this.spinFrameTimer >= frameDuration) {
        this.spinFrameTimer = 0;
        this.spinFrameIdx = (this.spinFrameIdx + 1) % SPIN_FRAMES.length;

        // Whistling whoosh sound at bottom and top swings
        if (this.spinFrameIdx === 0 || this.spinFrameIdx === 4) {
          this.sound.playWhoosh(0.75 + this.spinPower * 0.70);
        }
      }

      // Update current active sprite key
      const currentFrameNum = SPIN_FRAMES[this.spinFrameIdx];
      this.currentFrameKey = `spin_${currentFrameNum}`;
    }

    performThrow() {
      // Determine release frame and exact hand coordinate in this frame
      const currentFrameNum = SPIN_FRAMES[this.spinFrameIdx];
      const activeKey = `spin_${currentFrameNum}`;
      const frameInfo = FRAME_TANGENTS[currentFrameNum];
      const anchor = FRAME_ANCHORS[activeKey] || { x: 647, y: 1067 };
      const hand = HAND_COORDS[activeKey] || { x: 852, y: 356 };

      // Exact force launch origin: placed directly at the character's hand in this specific frame!
      const startX = CHAR_ANCHOR_X + (hand.x - anchor.x) * CHAR_SCALE;
      const startY = GROUND_Y + (hand.y - anchor.y) * CHAR_SCALE;

      this.releasePower = this.spinPower;
      this.releaseAngleRad = frameInfo.deg * (Math.PI / 180);

      // Calibrated launch speed:
      // Power in [0.60, 0.70] (60-70%) enters the ring hole!
      // Power > 0.75 (too strong) overshoots past/above the pole!
      // Power < 0.58 (too weak) falls short/hits lower pole!
      const launchSpeed = 1055 + this.releasePower * 500;

      const vx = Math.cos(this.releaseAngleRad) * launchSpeed;
      const vy = Math.sin(this.releaseAngleRad) * launchSpeed;

      this.totalThrows++;
      this.updateStatsUI();

      this.projectile = {
        x: startX,
        y: startY,
        prevX: startX,
        prevY: startY,
        vx: vx,
        vy: vy,
        angle: Math.atan2(vy, vx),
        scale: 1.0,
        scored: false,
        hitPole: false,
        restTimer: 0
      };

      this.sound.playThrow();
      this.particles.clearTrail();

      // Immediately transition to follow-through stance with empty hands
      this.currentFrameKey = 'throw_2';
      this.state = STATE.FLYING;
    }

    updateThrowing(dt) {
      this.state = STATE.FLYING;
    }

    updateFlying(dt) {
      const p = this.projectile;
      p.prevX = p.x;
      p.prevY = p.y;

      // Projectile motion with gravity and air drag
      const speed = Math.hypot(p.vx, p.vy);
      const drag = AIR_DRAG * speed * speed;
      const dragX = speed > 0 ? (p.vx / speed) * drag : 0;
      const dragY = speed > 0 ? (p.vy / speed) * drag : 0;

      p.vx -= dragX * dt;
      p.vy += (GRAVITY - dragY) * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Orientation aligns with flight velocity (ball sphere leads, ribbons stream behind)
      p.angle = Math.atan2(p.vy, p.vx);

      // Fixed scale throughout flight - strictly matching in-hand ball size without perspective distortion
      p.scale = 1.0;

      // Add ribbon trail point emitted from behind the ball
      const trailX = p.x - Math.cos(p.angle) * 18;
      const trailY = p.y - Math.sin(p.angle) * 18;
      this.particles.addTrailPoint(trailX, trailY, p.angle);

      // Check collision with Ring & Pole
      this.checkCollisions(p);

      // Ground collision
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y;
        this.sound.playGroundThud();
        this.particles.addDust(p.x, p.y, 14);

        // Bouncing
        p.vy = -p.vy * 0.38;
        p.vx *= 0.65;

        // If kinetic energy is low, transition to LANDED
        if (Math.hypot(p.vx, p.vy) < 60) {
          p.vx = 0;
          p.vy = 0;
          this.state = STATE.LANDED;
          p.restTimer = 0;
        }
      }

      // Out of screen bounds
      if (p.x > CANVAS_WIDTH + 100 || p.x < -100) {
        this.state = STATE.LANDED;
        p.restTimer = 0;
      }
    }

    checkCollisions(p) {
      if (p.scored) return;

      // 1. Continuous segment collision with the Ring Hole (Oval)
      const dx = p.x - p.prevX;
      if (dx !== 0 && ((p.prevX <= RING_CENTER_X && p.x >= RING_CENTER_X) || (p.prevX >= RING_CENTER_X && p.x <= RING_CENTER_X))) {
        // Calculate Y intersection at X = RING_CENTER_X
        const t = (RING_CENTER_X - p.prevX) / dx;
        const intersectY = p.prevY + t * (p.y - p.prevY);

        const dyHole = Math.abs(intersectY - RING_CENTER_Y);

        // Inner Hole Pass-Through (GOAL!)
        if (dyHole <= RING_INNER_RY) {
          p.scored = true;
          this.ringGlowTimer = 0.9;
          this.successfulThrows++;
          this.score += 100;
          this.streak++;
          this.updateStatsUI();

          this.sound.playScoreCelebration();
          this.particles.addConfetti(RING_CENTER_X, RING_CENTER_Y, 75);

          let msg = 'XUYÊN TÂM VÒNG CÒN!';
          if (this.streak >= 3) msg = `CHUỖI ${this.streak} LẦN TRÚNG!`;
          this.showAnnouncement(msg, '+100 ĐIỂM');
          return;
        }

        // Rim Collision (Bamboo hoop impact)
        if (dyHole <= RING_OUTER_RY + 8) {
          this.sound.playRimClack();
          this.particles.addDust(RING_CENTER_X, intersectY, 8);
          p.vx = -p.vx * 0.45;
          p.vy = p.vy * 0.4 + (Math.random() - 0.5) * 80;
          p.x = RING_CENTER_X - 10;
          this.streak = 0;
          this.updateStatsUI();
          return;
        }
      }

      // 2. Bamboo Pole Shaft Collision (below the ring)
      const poleTopY = RING_CENTER_Y + RING_OUTER_RY;
      if (p.y > poleTopY && p.y < GROUND_Y) {
        if (p.x >= RING_CENTER_X - 14 && p.x <= RING_CENTER_X + 14) {
          this.sound.playRimClack();
          p.vx = -Math.abs(p.vx) * 0.5;
          p.x = RING_CENTER_X - 16;
          this.streak = 0;
          this.updateStatsUI();
        }
      }
    }

    updateLanded(dt) {
      this.projectile.restTimer += dt;
      if (this.projectile.restTimer > 1.1) {
        if (!this.projectile.scored && this.streak > 0) {
          this.streak = 0;
          this.updateStatsUI();
        }
        this.state = STATE.IDLE;
        this.currentFrameKey = 'idle';
        this.particles.clearTrail();
      }
    }

    // ==========================================
    // RENDERING
    // ==========================================
    render() {
      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Draw Background
      if (this.assets.bg) {
        this.ctx.drawImage(this.assets.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2. Draw Pole & Ring
      this.drawPole();

      // 3. Draw Character Animation (with per-frame absolute alignment)
      this.drawCharacter();

      // 4. Draw Ribbon Trail (behind projectile)
      this.particles.drawTrail(this.ctx);

      // 5. Draw Flying/Landed Quả Còn Projectile (calibrated 1:1 scale matching in-hand size)
      if (this.state === STATE.FLYING || this.state === STATE.LANDED) {
        this.drawProjectile();
      }

      // 6. Draw Particles & Confetti (on top)
      this.particles.drawParticles(this.ctx);
    }

    drawPole() {
      if (!this.assets.pole) return;

      const drawX = POLE_ANCHOR_X - POLE_BASE_OFFSET_X * POLE_SCALE;
      const drawY = GROUND_Y - POLE_BASE_OFFSET_Y * POLE_SCALE;
      const drawW = this.assets.pole.width * POLE_SCALE;
      const drawH = this.assets.pole.height * POLE_SCALE;

      // Draw pole sprite
      this.ctx.drawImage(this.assets.pole, drawX, drawY, drawW, drawH);

      // If scored, draw celebratory golden ring glow
      if (this.ringGlowTimer > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(RING_CENTER_X, RING_CENTER_Y, RING_INNER_RX + 8, RING_INNER_RY + 8, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${Math.min(1.0, this.ringGlowTimer * 2)})`;
        this.ctx.lineWidth = 6;
        this.ctx.shadowColor = '#ffde59';
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    drawCharacter() {
      const sprite = this.assets[this.currentFrameKey];
      if (!sprite) return;

      // Look up exact plant-foot anchor for this specific frame
      const anchor = FRAME_ANCHORS[this.currentFrameKey] || { x: 647, y: 1067 };

      const drawW = sprite.width * CHAR_SCALE;
      const drawH = sprite.height * CHAR_SCALE;

      // Align character so that her standing foot is exactly at (CHAR_ANCHOR_X, GROUND_Y)
      const drawX = CHAR_ANCHOR_X - anchor.x * CHAR_SCALE;
      const drawY = GROUND_Y - anchor.y * CHAR_SCALE;

      this.ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    }

    drawProjectile() {
      const p = this.projectile;
      const img = this.assets.quacon_fly || this.assets.quacon;
      if (!img) return;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);

      if (this.assets.quacon_fly) {
        // Authentic flying quả còn extracted from Throw (10).png
        // Ball sphere center is at (230, 135)
        // Scaled at CHAR_SCALE (0.42) so both the ball diameter (~39px) and total length (~115px)
        // match the in-hand quả còn (42px ball, ~125px length) with 100% pixel fidelity
        const FLY_SCALE = CHAR_SCALE;
        const PIVOT_X = 230;
        const PIVOT_Y = 135;

        const drawW = img.width * FLY_SCALE;
        const drawH = img.height * FLY_SCALE;

        this.ctx.drawImage(
          img,
          -PIVOT_X * FLY_SCALE,
          -PIVOT_Y * FLY_SCALE,
          drawW,
          drawH
        );
      } else {
        // Fallback for quacon.png: calibrated to match in-hand total con height
        const QUACON_SCALE = 0.095;
        const pivotX = 562;
        const pivotY = 883;

        const drawW = img.width * QUACON_SCALE;
        const drawH = img.height * QUACON_SCALE;

        this.ctx.drawImage(
          img,
          -pivotX * QUACON_SCALE,
          -pivotY * QUACON_SCALE,
          drawW,
          drawH
        );
      }

      this.ctx.restore();
    }
  }

  // Launch game when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
