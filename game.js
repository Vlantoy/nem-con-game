/**
 * LỄ HỘI NÉM CÒN - Traditional Vietnamese Con Throwing Game
 * Getting Over It Physics Controls • Modular Rigged Character • Procedural Braided Cord • 5 Dynamic Streamers
 */

(() => {
  'use strict';

  // ==========================================
  // CONFIGURATION & CONSTANTS
  // ==========================================
  const CANVAS_WIDTH = 1672;
  const CANVAS_HEIGHT = 941;
  const GROUND_Y = 830;

  // Extended World Constants for 2-Player Versus Mode
  const WORLD_WIDTH_EXTEND = 2732; // Scaled to height 941 (2137 * 941 / 736 ≈ 2732px)
  const MAX_CAMERA_X = WORLD_WIDTH_EXTEND - CANVAS_WIDTH; // 1060px maximum pan offset
  const P1_ANCHOR_X = 220;  // Player 1 (Male: Chàng trai Mường) standing back-heel position on the left
  const P2_ANCHOR_X = 2580; // Player 2 (Female: Cô gái Thái) standing back-heel position on the right (mirrored)

  // Character scale and world standing position on the field
  const CHAR_SCALE = 0.21; // Halved to 1/2 scale per user request
  const CHAR_ANCHOR_X = 220; // Standing back-heel anchor position

  // Pole anchor and dimensions
  const POLE_SCALE = 760 / 2172; // ≈ 0.3499
  const POLE_BASE_OFFSET_X = 360;
  const POLE_BASE_OFFSET_Y = 2067;
  const POLE_ANCHOR_X = 1476;

  // Target Ring (on top of pole)
  const RING_CENTER_X = POLE_ANCHOR_X; // 1476
  const RING_CENTER_Y = GROUND_Y - (2067 - 250) * POLE_SCALE; // ≈ 194.2px
  const RING_INNER_RX = 9;  // Exact authentic inner hole semi-minor axis (width)
  const RING_INNER_RY = 38; // Exact authentic inner hole semi-major axis (height)
  const RING_OUTER_RX = 22; // Outer bamboo hoop rim
  const RING_OUTER_RY = 64; // Outer bamboo hoop rim

  // Physics constants
  const GRAVITY = 580;      // px/s^2 (calibrated for high, floaty ceremonial silk arcs)
  const AIR_DRAG = 0.00008; // aerodynamic drag
  const CORD_LENGTH = 68;   // px (proportionate to 1/2 character arm reach)
  const CORD_SEGMENTS = 8;
  const BALL_DIAMETER = 26; // px (proportionate to 1/2 character hand)

  // Cord Grip Configurations (Vị trí cầm dây còn: Đuôi dây, Giữa dây, Gần quả)
  const GRIP_CONFIGS = {
    long:  { length: 68, label: 'Đuôi Dây', icon: '🎋', fullLabel: 'Đuôi Dây (Sải Dài)' },
    mid:   { length: 48, label: 'Giữa Dây', icon: '🌾', fullLabel: 'Giữa Dây (Sải Vừa)' },
    short: { length: 30, label: 'Gần Quả',  icon: '✨', fullLabel: 'Gần Quả Còn (Sải Ngắn)' }
  };

  // Game States
  const STATE = {
    LOADING: 0,
    IDLE: 1,
    SWINGING: 2,
    FLYING: 3,
    LANDED: 4
  };

  // Helper for smooth shortest-path angular interpolation
  function lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * Math.min(Math.max(t, 0), 1);
  }

  // ==========================================
  // WEB AUDIO SOUND SYNTHESIZER
  // ==========================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.lastWhooshTime = 0;
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
      const now = this.ctx.currentTime;
      if (now - this.lastWhooshTime < 0.12) return;
      this.lastWhooshTime = now;

      try {
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
        // 1. Traditional Festival Drum Beat (Tiếng Trống Hội: Tùng - Cắc!)
        [0, 0.15].forEach((offset, idx) => {
          const t = now + offset;
          const drumOsc = this.ctx.createOscillator();
          const drumGain = this.ctx.createGain();
          drumOsc.type = 'sine';
          drumOsc.frequency.setValueAtTime(idx === 0 ? 190 : 150, t);
          drumOsc.frequency.exponentialRampToValueAtTime(45, t + 0.35);
          drumGain.gain.setValueAtTime(idx === 0 ? 0.65 : 0.50, t);
          drumGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          drumOsc.connect(drumGain);
          drumGain.connect(this.ctx.destination);
          drumOsc.start(t);
          drumOsc.stop(t + 0.4);
        });

        // 2. Victorious Highland Pentatonic Chime (Âm điệu Ngũ Cung Tây Bắc: G4, A4, C5, D5, E5, G5)
        const notes = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const t = now + 0.07 * idx;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
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
    }

    drawParticles(ctx) {
      this.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
    }
  }

  // ==========================================
  // PROCEDURAL VERLET CORD (DÂY CÒN TRUYỀN THỐNG)
  // ==========================================
  class VerletCord {
    constructor(numNodes = CORD_SEGMENTS, totalLength = CORD_LENGTH) {
      this.numNodes = numNodes;
      this.totalLength = totalLength;
      this.segmentLength = totalLength / (numNodes - 1);
      this.nodes = [];
      this.isPinned = true;

      for (let i = 0; i < numNodes; i++) {
        this.nodes.push({
          x: 0,
          y: 0,
          oldX: 0,
          oldY: 0
        });
      }
      this.flutterTimer = 0;
    }

    setLength(newLength) {
      this.totalLength = newLength;
      this.segmentLength = newLength / (this.numNodes - 1);
    }

    reset(startX, startY, angle = Math.PI / 2) {
      for (let i = 0; i < this.numNodes; i++) {
        const dist = i * this.segmentLength;
        const nx = startX + Math.cos(angle) * dist;
        const ny = startY + Math.sin(angle) * dist;
        this.nodes[i].x = nx;
        this.nodes[i].y = ny;
        this.nodes[i].oldX = nx;
        this.nodes[i].oldY = ny;
      }
    }

    // Initialize cord trailing behind the ball at release
    initFlight(attachX, attachY, vx, vy) {
      const speed = Math.hypot(vx, vy);
      const trailAngle = speed > 30 ? Math.atan2(-vy, -vx) : Math.PI;

      for (let i = 0; i < this.numNodes; i++) {
        // Node numNodes - 1 is pinned to ball attachment (distance = 0)
        // Node 0 is free tail end (distance = totalLength)
        const distFromAttach = (this.numNodes - 1 - i) * this.segmentLength;
        const nx = attachX + Math.cos(trailAngle) * distFromAttach;
        const ny = attachY + Math.sin(trailAngle) * distFromAttach;

        this.nodes[i].x = nx;
        this.nodes[i].y = ny;
        this.nodes[i].oldX = nx - vx * 0.016;
        this.nodes[i].oldY = ny - vy * 0.016;
      }
    }

    // Aerodynamic flight simulation: cord trails behind the projectile in the slipstream
    updateFlight(attachX, attachY, vx, vy, dt) {
      this.isPinned = false;
      this.lastDt = dt;
      this.flutterTimer += dt;

      const speed = Math.hypot(vx, vy);
      const trailAngle = speed > 40 ? Math.atan2(-vy, -vx) : Math.PI;
      const effectiveDt = Math.min(dt, 0.025);
      const damping = 0.95;

      // 1. Verlet step for free trailing nodes (0 to numNodes - 2)
      for (let i = 0; i < this.numNodes - 1; i++) {
        const n = this.nodes[i];
        let curVx = (n.x - n.oldX) * damping;
        let curVy = (n.y - n.oldY) * damping;

        n.oldX = n.x;
        n.oldY = n.y;

        // Aerodynamic trailing alignment: slipstream pulls cord along trailAngle
        const distRatio = (this.numNodes - 1 - i) / (this.numNodes - 1);
        const trailPull = Math.min(speed * 0.65, 550) * distRatio;
        const flutter = Math.sin(this.flutterTimer * 26 + i * 1.2) * 2.2 * Math.min(speed / 300, 1.0);

        const perpAngle = trailAngle + Math.PI / 2;
        const ax = Math.cos(trailAngle) * trailPull + Math.cos(perpAngle) * flutter;
        const ay = Math.sin(trailAngle) * trailPull + Math.sin(perpAngle) * flutter;

        n.x += curVx + (ax + GRAVITY * 0.25) * effectiveDt * effectiveDt;
        n.y += curVy + (ay + GRAVITY * 0.25) * effectiveDt * effectiveDt;
      }

      // Pin the attached end (numNodes - 1) strictly to the ball attachment point
      const last = this.nodes[this.numNodes - 1];
      last.x = attachX;
      last.y = attachY;
      last.oldX = attachX;
      last.oldY = attachY;

      // 2. Relaxation constraints with attached end firmly locked
      const iterations = 8;
      for (let iter = 0; iter < iterations; iter++) {
        last.x = attachX;
        last.y = attachY;

        for (let i = this.numNodes - 2; i >= 0; i--) {
          const n1 = this.nodes[i];
          const n2 = this.nodes[i + 1];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 1e-4) {
            const diff = (dist - this.segmentLength) / dist;
            if (i + 1 === this.numNodes - 1) {
              // Attached node is locked; only adjust n1
              n1.x -= dx * diff;
              n1.y -= dy * diff;
            } else {
              n1.x -= dx * diff * 0.5;
              n1.y -= dy * diff * 0.5;
              n2.x += dx * diff * 0.5;
              n2.y += dy * diff * 0.5;
            }
          }
        }
      }
    }

    getFreeEnd() {
      return this.nodes[0];
    }

    update(pinX, pinY, dt, pinned = true) {
      this.isPinned = pinned;
      this.lastDt = dt;
      const damping = 0.991;
      const effectiveDt = Math.min(dt, 0.025);

      // Verlet step for all free nodes
      const startIdx = pinned ? 1 : 0;
      for (let i = startIdx; i < this.numNodes; i++) {
        const n = this.nodes[i];
        const vx = (n.x - n.oldX) * damping;
        const vy = (n.y - n.oldY) * damping;
        n.oldX = n.x;
        n.oldY = n.y;
        n.x += vx;
        n.y += vy + GRAVITY * effectiveDt * effectiveDt;
      }

      if (pinned) {
        this.nodes[0].x = pinX;
        this.nodes[0].y = pinY;
        this.nodes[0].oldX = pinX;
        this.nodes[0].oldY = pinY;
      }

      // Relaxation constraints (8 iterations for tight, responsive cord)
      const iterations = 8;
      for (let iter = 0; iter < iterations; iter++) {
        if (pinned) {
          this.nodes[0].x = pinX;
          this.nodes[0].y = pinY;
        }

        for (let i = 0; i < this.numNodes - 1; i++) {
          const n1 = this.nodes[i];
          const n2 = this.nodes[i + 1];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 1e-4) {
            const diff = (dist - this.segmentLength) / dist;
            if (i === 0 && pinned) {
              n2.x -= dx * diff;
              n2.y -= dy * diff;
            } else {
              n1.x += dx * diff * 0.5;
              n1.y += dy * diff * 0.5;
              n2.x -= dx * diff * 0.5;
              n2.y -= dy * diff * 0.5;
            }
          }
        }
      }
    }

    // Attach end node to a specific position (e.g. projectile in flight)
    attachEnd(endX, endY) {
      const last = this.nodes[this.numNodes - 1];
      last.x = endX;
      last.y = endY;
      last.oldX = endX;
      last.oldY = endY;
    }

    getEndVelocity(customDt) {
      const last = this.nodes[this.numNodes - 1];
      const safeDt = Math.max(customDt || this.lastDt || 0.016, 0.001);
      return {
        vx: (last.x - last.oldX) / safeDt,
        vy: (last.y - last.oldY) / safeDt
      };
    }

    getEndPosition() {
      return this.nodes[this.numNodes - 1];
    }

    // High quality procedural silk cord rendering
    draw(ctx) {
      if (this.nodes.length < 2) return;

      ctx.save();

      // Outer braided red cord
      ctx.beginPath();
      ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
      for (let i = 1; i < this.numNodes - 1; i++) {
        const xc = (this.nodes[i].x + this.nodes[i + 1].x) / 2;
        const yc = (this.nodes[i].y + this.nodes[i + 1].y) / 2;
        ctx.quadraticCurveTo(this.nodes[i].x, this.nodes[i].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        this.nodes[this.numNodes - 2].x,
        this.nodes[this.numNodes - 2].y,
        this.nodes[this.numNodes - 1].x,
        this.nodes[this.numNodes - 1].y
      );

      ctx.strokeStyle = '#b32415'; // Traditional vermilion red silk
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner golden twist thread (xe sợi chỉ vàng óng)
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#f1c40f'; // Bright festival gold
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.setLineDash([]);

      // Top brass attachment ring at quả còn connection
      const end = this.nodes[this.numNodes - 1];
      ctx.beginPath();
      ctx.arc(end.x, end.y, 2.0, 0, Math.PI * 2);
      ctx.fillStyle = '#f39c12';
      ctx.fill();
      ctx.strokeStyle = '#7f4f06';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ==========================================
  // QUẢ CÒN ASSEMBLY & DYNAMIC STREAMERS
  // ==========================================
  class QuaconAssembly {
    constructor() {
      // 5 Streamers configuration
      this.streamerConfigs = [
        { key: 'streamer_pink',        spreadDeg: -22, pivX: 36, pivY: 31, baseRot: 45 },
        { key: 'streamer_green_up',    spreadDeg: -11, pivX: 29, pivY: 26, baseRot: 45 },
        { key: 'streamer_yellow_1',    spreadDeg:   0, pivX: 31, pivY: 27, baseRot: 45 },
        { key: 'streamer_yellow_2',    spreadDeg:  11, pivX: 33, pivY: 26, baseRot: 45 },
        { key: 'streamer_green_down',  spreadDeg:  22, pivX: 31, pivY: 24, baseRot: 45 }
      ];

      // Dynamic streamer angles
      this.streamerAngles = [0, 0, 0, 0, 0];
      this.flutterTimer = 0;

      // Ball geometry
      this.ballScale = BALL_DIAMETER / 308;
      this.topAttachOffset = { x: -7 * this.ballScale, y: -171 * this.ballScale };
      this.botAttachOffset = { x:  4 * this.ballScale, y:  168 * this.ballScale };
    }

    update(dt, vx, vy) {
      this.flutterTimer += dt;
      const speed = Math.hypot(vx, vy);
      const isFast = speed > 50;

      // Desired flight trailing angle
      const trailAngle = isFast ? Math.atan2(-vy, -vx) : Math.PI / 2;
      const blend = Math.min(speed / 400, 1.0);

      for (let i = 0; i < this.streamerConfigs.length; i++) {
        const cfg = this.streamerConfigs[i];
        const spreadRad = (cfg.spreadDeg * Math.PI) / 180;

        // Idle rest angle: hangs downward with spread
        const restAngle = Math.PI / 2 + spreadRad;

        // Target angle blends from rest to trailing angle
        let targetAngle = restAngle * (1 - blend) + (trailAngle + spreadRad * 0.4) * blend;

        // Aerodynamic silk flutter wave
        const flutter = Math.sin(this.flutterTimer * 22 + i * 1.3) * 0.14 * blend;
        targetAngle += flutter;

        // Smooth angular spring towards target (safe non-blocking normalization)
        let diff = targetAngle - this.streamerAngles[i];
        if (!isFinite(diff)) {
          diff = 0;
        } else {
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        }

        this.streamerAngles[i] += diff * Math.min(dt * 15, 1.0);
      }
    }

    draw(ctx, x, y, assets) {
      if (!assets.quacon_ball) return;

      const s = this.ballScale;
      const botX = x + this.botAttachOffset.x;
      const botY = y + this.botAttachOffset.y;

      // 1. Draw 5 Streamers first (anchored to bottom cap)
      for (let i = 0; i < this.streamerConfigs.length; i++) {
        const cfg = this.streamerConfigs[i];
        const img = assets[cfg.key];
        if (!img) continue;

        ctx.save();
        ctx.translate(botX, botY);
        // Rotate along simulated physical angle
        // Subtract baseRot (45 deg) because streamer sprites are originally angled at ~45 deg
        ctx.rotate(this.streamerAngles[i] - (cfg.baseRot * Math.PI) / 180);

        const sw = img.width * s;
        const sh = img.height * s;
        const spivX = cfg.pivX * s;
        const spivY = cfg.pivY * s;

        ctx.drawImage(img, -spivX, -spivY, sw, sh);
        ctx.restore();
      }

      // 2. Draw Ball on top so red bottom collar covers the streamer joints cleanly!
      const ballImg = assets.quacon_ball;
      const bw = ballImg.width * s;
      const bh = ballImg.height * s;

      ctx.save();
      ctx.translate(x, y);
      ctx.drawImage(ballImg, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }
  }

  // ==========================================
  // CHARACTER RIG & ARTICULATED IK SYSTEM (MODULAR SKIN-DRIVEN)
  // ==========================================
  class CharacterRig {
    constructor(skinId = null, overrideStandingX = null) {
      this.overrideStandingX = overrideStandingX;
      this.initKinematics(skinId);
    }

    setSkin(skinConfigOrId) {
      this.initKinematics(skinConfigOrId);
    }

    initKinematics(skinConfigOrId = null) {
      // Load active character skin configuration from character-config.js
      if (typeof skinConfigOrId === 'object' && skinConfigOrId !== null) {
        this.skinConfig = skinConfigOrId;
      } else if (typeof CHARACTER_CONFIG !== 'undefined') {
        this.skinConfig = CHARACTER_CONFIG.getSkinConfig(skinConfigOrId);
      } else {
        this.skinConfig = null;
      }

      // Fallback defaults if CHARACTER_CONFIG is missing
      const cfg = this.skinConfig || {
        scale: CHAR_SCALE,
        standingAnchorX: CHAR_ANCHOR_X,
        anchors: {
          footAnchor: { x: 565, y: 1510 },
          shoulderJoint: { x: 429, y: 360 }
        },
        kinematics: {
          scaleUpper: 0.53,
          scaleFore: 1.15,
          scaleHand: 0.35,
          upperArm: { shoulderPivot: { x: 206, y: 208 }, elbowJoint: { x: 228, y: 603 } },
          forearm: { elbowPivot: { x: 29, y: 20 }, wristJoint: { x: 49, y: 200 } },
          hand: { wristPivot: { x: 25, y: 180 }, gripTunnel: { x: 255, y: 68 } }
        },
        animation: {
          breathSpeed: 2.2,
          breathAmplitude: 1.5,
          swingKneeFlexMultiplier: 4.0,
          throwFollowThroughVelocity: -14,
          wristFlexionLimit: 1.05
        }
      };

      this.cfg = cfg;

      // Body foot anchor and circular shoulder socket joint
      this.footAnchor = cfg.anchors.footAnchor;
      this.shoulderJoint = cfg.anchors.shoulderJoint;

      // Scaled kinematics parameters
      this.sBody = cfg.scale || CHAR_SCALE;
      this.standingAnchorX = (this.overrideStandingX !== null)
        ? this.overrideStandingX
        : (cfg.standingAnchorX || CHAR_ANCHOR_X);
      this.sUpper = (cfg.kinematics.scaleUpper || 0.53) * this.sBody;
      this.sFore = (cfg.kinematics.scaleFore || 1.15) * this.sBody;
      this.sHand = (cfg.kinematics.scaleHand || 0.35) * this.sBody;

      // Upper arm pivots & vectors
      const uP = cfg.kinematics.upperArm.shoulderPivot;
      const uE = cfg.kinematics.upperArm.elbowJoint;
      this.uPiv = { x: uP.x * this.sUpper, y: uP.y * this.sUpper };
      this.uElb = { x: uE.x * this.sUpper, y: uE.y * this.sUpper };
      const uVec = { x: this.uElb.x - this.uPiv.x, y: this.uElb.y - this.uPiv.y };
      this.L1 = Math.hypot(uVec.x, uVec.y);
      this.uBaseAng = Math.atan2(uVec.y, uVec.x);

      // Forearm pivots & vectors
      const fP = cfg.kinematics.forearm.elbowPivot;
      const fW = cfg.kinematics.forearm.wristJoint;
      this.fPiv = { x: fP.x * this.sFore, y: fP.y * this.sFore };
      this.fWri = { x: fW.x * this.sFore, y: fW.y * this.sFore };
      const fVec = { x: this.fWri.x - this.fPiv.x, y: this.fWri.y - this.fPiv.y };
      this.L2 = Math.hypot(fVec.x, fVec.y);
      this.fBaseAng = Math.atan2(fVec.y, fVec.x);

      // Hand pivots & vectors
      const hP = cfg.kinematics.hand.wristPivot;
      const hG = cfg.kinematics.hand.gripTunnel;
      this.hPiv = { x: hP.x * this.sHand, y: hP.y * this.sHand };
      this.hGrip = { x: hG.x * this.sHand, y: hG.y * this.sHand };
      const hVec = { x: this.hGrip.x - this.hPiv.x, y: this.hGrip.y - this.hPiv.y };
      this.hDist = Math.hypot(hVec.x, hVec.y);
      this.hBaseAng = Math.atan2(hVec.y, hVec.x);

      // World positions
      this.bodyDrawX = this.standingAnchorX - this.footAnchor.x * this.sBody;
      this.bodyDrawY = GROUND_Y - this.footAnchor.y * this.sBody;

      // Dynamic body bobbing & knee flexion (nhún nhẹ tự nhiên)
      this.animTimer = 0;
      this.bodyDip = 0;
      this.throwBounce = 0;
      this.throwVel = 0;

      this.shoulderX = this.bodyDrawX + this.shoulderJoint.x * this.sBody;
      this.shoulderY = this.bodyDrawY + this.shoulderJoint.y * this.sBody;

      // Current joint angles
      this.th1 = Math.PI / 2;
      this.th2 = Math.PI / 2;
      this.wristAngle = Math.PI / 2;

      // Current joint positions
      this.elbowX = this.shoulderX + this.L1 * Math.cos(this.th1);
      this.elbowY = this.shoulderY + this.L1 * Math.sin(this.th1);
      this.wristX = this.elbowX + this.L2 * Math.cos(this.th2);
      this.wristY = this.elbowY + this.L2 * Math.sin(this.th2);

      this.handGripX = this.wristX + Math.cos(this.wristAngle) * this.hDist;
      this.handGripY = this.wristY + Math.sin(this.wristAngle) * this.hDist;

      // Target hand position (smoothly driven by mouse or idle)
      const idleOff = (cfg.kinematics && cfg.kinematics.idleHandOffset) || { x: 1, y: 86 };
      this.targetHandX = this.shoulderX + idleOff.x;
      this.targetHandY = this.shoulderY + idleOff.y;
    }

    triggerThrowBounce() {
      // Dynamic upward spring follow-through when releasing the con
      const bounceVel = (this.cfg.animation && this.cfg.animation.throwFollowThroughVelocity) || -14;
      this.throwVel = bounceVel;
    }

    solveIK(targetX, targetY) {
      const dx = targetX - this.shoulderX;
      const dy = targetY - this.shoulderY;
      let d = Math.hypot(dx, dy);

      // Clamp distance within physical reach
      const minD = Math.abs(this.L1 - this.L2) + 2;
      const maxD = this.L1 + this.L2 - 1.5;
      d = Math.max(minD, Math.min(maxD, d));

      const cosA = Math.max(-1, Math.min(1, (this.L1 * this.L1 + d * d - this.L2 * this.L2) / (2 * this.L1 * d)));
      const alpha = Math.acos(cosA);

      const cosB = Math.max(-1, Math.min(1, (this.L1 * this.L1 + this.L2 * this.L2 - d * d) / (2 * this.L1 * this.L2)));
      const beta = Math.acos(cosB);

      const theta = Math.atan2(dy, dx);

      // Continuous, smooth 2-bone IK (no discontinuous angle flipping / zero snapping!)
      const targetTh1 = theta + alpha;
      const targetTh2 = targetTh1 - (Math.PI - beta);

      // Angular interpolation for fluid organic feel
      this.th1 = lerpAngle(this.th1, targetTh1, 0.45);
      this.th2 = lerpAngle(this.th2, targetTh2, 0.45);

      // Elbow in world
      this.elbowX = this.shoulderX + this.L1 * Math.cos(this.th1);
      this.elbowY = this.shoulderY + this.L1 * Math.sin(this.th1);

      // Wrist in world
      this.wristX = this.elbowX + this.L2 * Math.cos(this.th2);
      this.wristY = this.elbowY + this.L2 * Math.sin(this.th2);
    }

    update(dt, isInteracting, mouseWorldX, mouseWorldY, pullTargetX, pullTargetY) {
      this.animTimer += dt;

      const breathSpeed = (this.cfg.animation && this.cfg.animation.breathSpeed) || 2.2;
      const breathAmp = (this.cfg.animation && this.cfg.animation.breathAmplitude) || 1.5;
      const kneeFlexMult = (this.cfg.animation && this.cfg.animation.swingKneeFlexMultiplier) || 4.0;
      const wristLimit = (this.cfg.animation && this.cfg.animation.wristFlexionLimit) || 1.05;

      // 1. Dynamic knee flexion & breathing bob ("nhún nhẹ để cảm giác chuyển động")
      let targetDip = 0;
      const breathDip = Math.sin(this.animTimer * breathSpeed) * breathAmp;

      if (isInteracting) {
        // Direct responsive tracking of mouse position
        this.targetHandX = mouseWorldX;
        this.targetHandY = mouseWorldY;

        // Knee flex follows arm swing momentum:
        // When arm pulls down/back, knees flex and body crouches slightly (down by 3-5px)
        // When arm swings up, body extends/springs up
        const armPhase = (this.wristY - this.shoulderY) / (this.L1 + this.L2);
        const swingDip = Math.max(-2.5, Math.min(5.5, armPhase * kneeFlexMult));
        targetDip = swingDip + Math.sin(this.animTimer * 4.0) * 0.8;
      } else {
        // Relaxed standing ready stance
        const idleOff = (this.cfg.kinematics && this.cfg.kinematics.idleHandOffset) || { x: 1, y: 86 };
        const defaultX = this.shoulderX + idleOff.x;
        const defaultY = this.shoulderY + idleOff.y;
        this.targetHandX += (defaultX - this.targetHandX) * Math.min(dt * 8, 1.0);
        this.targetHandY += (defaultY - this.targetHandY) * Math.min(dt * 8, 1.0);
        targetDip = breathDip;
      }

      // Throw follow-through spring bounce
      this.throwBounce += this.throwVel * dt;
      this.throwVel += (-this.throwBounce * 40 - this.throwVel * 10) * dt;
      targetDip += this.throwBounce;

      // Smoothly update bodyDip
      this.bodyDip += (targetDip - this.bodyDip) * Math.min(dt * 14, 1.0);

      // Update world shoulder with dynamic body dip (exact foot-anchored squash ratio)
      const shoulderDip = this.bodyDip * (this.footAnchor.y - this.shoulderJoint.y) / 1536;
      this.shoulderX = this.bodyDrawX + this.shoulderJoint.x * this.sBody;
      this.shoulderY = this.bodyDrawY + shoulderDip + this.shoulderJoint.y * this.sBody;

      this.solveIK(this.targetHandX, this.targetHandY);

      // Dynamic wrist articulation: rotate wrist towards cord tension within anatomical limits
      let targetWristAngle = this.th2;
      if (pullTargetX !== undefined && pullTargetY !== undefined) {
        const pullAngle = Math.atan2(pullTargetY - this.wristY, pullTargetX - this.wristX);
        let diff = (pullAngle - this.th2) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        const clampedFlex = Math.max(-wristLimit, Math.min(wristLimit, diff));
        // Rotate hand with cord pull while keeping strong forearm connection
        targetWristAngle = this.th2 + clampedFlex * 0.75;
      } else {
        targetWristAngle = this.th2 + 0.15;
      }

      this.wristAngle = lerpAngle(this.wristAngle, targetWristAngle, Math.min(dt * 20, 1.0));

      // Hand grip point in world: exactly at the curled fingers tunnel
      this.handGripX = this.wristX + Math.cos(this.wristAngle) * this.hDist;
      this.handGripY = this.wristY + Math.sin(this.wristAngle) * this.hDist;
    }

    draw(ctx, assets) {
      if (!assets.body) return;

      // 1. Draw Body with knee-flex squash anchored at feet on the ground
      const bw = assets.body.width * this.sBody;
      const bh = assets.body.height * this.sBody;

      ctx.save();
      ctx.translate(this.standingAnchorX, GROUND_Y);
      const squashY = Math.max(0.92, (bh - this.bodyDip) / bh);
      ctx.scale(1.0, squashY);
      ctx.drawImage(
        assets.body,
        -this.footAnchor.x * this.sBody,
        -this.footAnchor.y * this.sBody,
        bw,
        bh
      );
      ctx.restore();

      // 2. Draw Arm Components (Upper arm và Forearm theo thứ tự cấu hình skin)
      const drawUpperArm = () => {
        if (assets.upper_arm) {
          const img = assets.upper_arm;
          ctx.save();
          ctx.translate(this.shoulderX, this.shoulderY);
          ctx.rotate(this.th1 - this.uBaseAng);
          ctx.drawImage(img, -this.uPiv.x, -this.uPiv.y, img.width * this.sUpper, img.height * this.sUpper);
          ctx.restore();
        }
      };

      const drawForearm = () => {
        if (assets.forearm) {
          const img = assets.forearm;
          ctx.save();
          ctx.translate(this.elbowX, this.elbowY);
          ctx.rotate(this.th2 - this.fBaseAng);
          ctx.drawImage(img, -this.fPiv.x, -this.fPiv.y, img.width * this.sFore, img.height * this.sFore);
          ctx.restore();
        }
      };

      const drawHand = () => {
        if (assets.hand) {
          const img = assets.hand;
          ctx.save();
          ctx.translate(this.wristX, this.wristY);
          ctx.rotate(this.wristAngle - this.hBaseAng);
          ctx.drawImage(img, -this.hPiv.x, -this.hPiv.y, img.width * this.sHand, img.height * this.sHand);
          ctx.restore();
        }
      };

      if (this.cfg && this.cfg.drawHandUnderForearm) {
        if (this.cfg.drawForearmFirst) {
          drawForearm();
          drawUpperArm();
          drawHand();
        } else {
          drawUpperArm();
          drawHand();
          drawForearm();
        }
      } else {
        if (this.cfg && this.cfg.drawForearmFirst) {
          drawForearm();
          drawUpperArm();
        } else {
          drawUpperArm();
          drawForearm();
        }
        drawHand();
      }
    }
  }

  // ==========================================
  // SKILLS CATALOG (FULL 41 DÂN TỘC & LỄ HỘI SKILLS)
  // Tiers: Common (~70% drop), Rare (~24% drop), Epic Chí Mạng (~5% drop)
  // ==========================================
  const SKILLS_CATALOG = {
    // --- 1. NHÓM HỖ TRỢ (SUPPORT) ---
    tam_nham: {
      id: 'tam_nham',
      name: 'Tâm Nhắm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'tam_nham.png',
      desc: 'Hiển thị tia hồng tâm dẫn đường chuẩn xác hướng thẳng vào tâm vòng còn.',
      hint: 'Dùng ngay trong lượt • Tăng chuẩn xác'
    },
    vat_ly_an_do: {
      id: 'vat_ly_an_do',
      name: 'Vật Lý Ấn Định',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'vat_ly_an_do.png',
      desc: 'Vật lý thần sầu: Tự động điều chỉnh lực ném và góc phóng chuẩn xác 80% xuyên tâm vòng còn!',
      hint: 'Dùng ngay trong lượt • Tỉ lệ trúng 80%'
    },
    tang_diem: {
      id: 'tang_diem',
      name: 'Tăng Điểm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'tang_diem.png',
      desc: 'Cộng thêm +1 điểm chiến thắng (hoặc +50 điểm) nếu ném trúng vòng lượt này.',
      hint: 'Dùng ngay trong lượt • Tăng điểm thưởng'
    },
    nhan_doi: {
      id: 'nhan_doi',
      name: 'Nhân Đôi',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'nhan_doi.png',
      desc: 'Nhân đôi (x2) toàn bộ điểm số ghi được nếu ném xuyên tâm vòng ở lượt này.',
      hint: 'Dùng ngay trong lượt • x2 Điểm số'
    },
    lam_cham: {
      id: 'lam_cham',
      name: 'Làm Chậm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'lam_cham.png',
      desc: 'Làm chậm thời gian xoay đà, giúp bạn dễ dàng căn chỉnh góc và lực nhả còn.',
      hint: 'Dùng ngay trong lượt • Dễ căn buông còn'
    },
    song_nem: {
      id: 'song_nem',
      name: 'Song Ném',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'song_nem.png',
      desc: 'Được phép thực hiện liên tiếp 2 lần ném trong cùng một lượt chơi.',
      hint: 'Dùng ngay trong lượt • 2 Lần ném liên tiếp'
    },
    nem_bu: {
      id: 'nem_bu',
      name: 'Ném Bù',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'nem_bu.png',
      desc: 'Nếu ném hụt ở lượt này, bạn sẽ nhận được thêm 1 cơ hội ném cứu nguy.',
      hint: 'Dùng ngay trong lượt • Ném lại nếu hụt'
    },
    tich_diem: {
      id: 'tich_diem',
      name: 'Tích Điểm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'tich_diem.png',
      desc: 'Tích tụ linh khí qua từng vòng quay đà, tăng điểm thưởng khi còn xuyên tâm.',
      hint: 'Dùng ngay trong lượt • Tích lũy đà quay'
    },
    cuoc_diem: {
      id: 'cuoc_diem',
      name: 'Cược Điểm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'cuoc_diem.png',
      desc: 'Cược điểm số vào lượt ném: Ném trúng nhận thưởng lớn, tự tin bứt phá!',
      hint: 'Dùng ngay trong lượt • Thắng lớn bứt phá'
    },
    cuop_co_hoi: {
      id: 'cuop_co_hoi',
      name: 'Cướp Cơ Hội',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'cuop_co_hoi.png',
      desc: 'Nếu đối thủ ném hụt ở lượt tiếp theo, bạn sẽ giành quyền ném 2 lượt liên tiếp!',
      hint: 'Tác dụng lượt đối thủ • Ném hụt nhận 2 lượt liên tiếp'
    },
    doi_diem: {
      id: 'doi_diem',
      name: 'Đổi Điểm',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'epic',
      tierLabel: 'Sử thi',
      weight: 4,
      img: 'doi_luot.png',
      desc: 'Nếu ném trúng đích ở lượt này, bạn sẽ hoán đổi toàn bộ điểm số với đối phương!',
      hint: 'Dùng trong lượt • Ném trúng để đổi điểm'
    },
    chiem_nhip: {
      id: 'chiem_nhip',
      name: 'Chiếm Nhịp',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'chiem_nhip.png',
      desc: 'Làm chủ nhịp thở và đà quay cổ tay, tăng tốc độ tích lực lên 1.5x.',
      hint: 'Dùng ngay trong lượt • Cổ tay chuẩn xác'
    },
    la_bai_bi_an: {
      id: 'la_bai_bi_an',
      name: 'Lá Bài Bí Ẩn',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'la_bai_bi_an.png',
      desc: 'Rút ngẫu nhiên 1 kỹ năng bất kỳ trong toàn bộ kho tàng 41 chiêu thức và tự động kích hoạt ngay lập tức!',
      hint: 'Dùng ngay trong lượt • Vận may bất ngờ'
    },
    luat_nguoc_doi: {
      id: 'luat_nguoc_doi',
      name: 'Luật Ngược Đời',
      type: 'support',
      typeLabel: 'Hỗ trợ',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'luat_nguoc_doi.png',
      desc: 'Đảo ngược quy tắc 1 lượt: Ném trúng vòng không có điểm, ném chệch ra ngoài chạm đất gần cột lại được +1 điểm!',
      hint: 'Dùng ngay trong lượt • Ném ra ngoài ăn điểm'
    },

    // --- 2. NHÓM PHÁ HOẠI / GÂY NHIỄU (DEBUFF) ---
    gio_manh: {
      id: 'gio_manh',
      name: 'Gió Mạnh',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'gio_manh.png',
      desc: 'Gió bão cuồng nộ thổi giật theo chiều thuận hoặc nghịch, đảo chiều ngẫu nhiên làm chệch hướng ném.',
      hint: 'Gây nhiễu lượt đối thủ • Gió giật đổi chiều'
    },
    be_cong: {
      id: 'be_cong',
      name: 'Bẻ Cong',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'be_cong.png',
      desc: 'Lực trường bẻ cong không gian làm quả còn đối phương lệch khỏi tâm ngắm.',
      hint: 'Tác động lượt sau của đối thủ'
    },
    hoa_mat: {
      id: 'hoa_mat',
      name: 'Hoa Mắt',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'hoa_mat.png',
      desc: 'Màn hình rung chấn và chao đảo, khiến đối thủ khó định hình tâm ném.',
      hint: 'Tác động lượt sau của đối thủ'
    },
    bong_dem: {
      id: 'bong_dem',
      name: 'Bóng Đêm',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'bong_dem.png',
      desc: 'Sương mù đêm tối che khuất tầm nhìn cột còn, ép đối thủ ném bằng cảm giác.',
      hint: 'Tác động lượt sau của đối thủ'
    },
    mua_nang_hat: {
      id: 'mua_nang_hat',
      name: 'Mưa Nặng Hạt',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'mua_nang_hat.png',
      desc: 'Mưa rào nặng trĩu làm quả còn ướt sũng, tăng ma sát và khó xoay lấy đà.',
      hint: 'Tác động lượt sau của đối thủ'
    },
    ao_anh: {
      id: 'ao_anh',
      name: 'Ảo Ảnh',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'ao_anh.png',
      desc: 'Tung 3 quả còn và dựng 3 cột tre cùng lúc với vật lý giống hệt nhau, nhưng chỉ 1 quả và 1 cột là thật!',
      hint: 'Gây nhiễu lượt đối thủ • 3 quả còn & 3 cột thật giả'
    },
    cuop_luot: {
      id: 'cuop_luot',
      name: 'Cướp Lượt',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'cuop_luot.png',
      desc: 'Phong tỏa đối thủ, tước đoạt cơ hội ném ở lượt tiếp theo của họ.',
      hint: 'Tác động lượt sau của đối thủ • Mất lượt'
    },
    dat_cuoc: {
      id: 'dat_cuoc',
      name: 'Đặt Cược',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'dat_cuoc.png',
      desc: 'Cược vào cú ném của đối thủ: Nếu đối thủ ném trượt, bạn được nhận điểm!',
      hint: 'Tác động lượt sau của đối thủ'
    },
    phat_kep: {
      id: 'phat_kep',
      name: 'Phạt Kép',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'phat_kep.png',
      desc: 'Gây đồng thời hai hiệu ứng bất lợi (gió lốc + mưa nặng) lên đối thủ.',
      hint: 'Tác động lượt sau của đối thủ • 2 Hiệu ứng cùng lúc'
    },
    cong_don: {
      id: 'cong_don',
      name: 'Cộng Dồn',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'cong_don.png',
      desc: 'Khuếch đại gấp đôi cường độ của các hiệu ứng quấy nhiễu lên đối phương.',
      hint: 'Tác động lượt sau của đối thủ'
    },
    dao_nguoc: {
      id: 'dao_nguoc',
      name: 'Đảo Ngược Điều Khiển',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'dao_nguoc.png',
      desc: 'Đảo ngược hướng di chuyển chuột của đối thủ (kéo sang phải tay đi sang trái, kéo lên tay đi xuống).',
      hint: 'Tác động lượt sau của đối thủ • Đảo hướng chuột'
    },
    la_ban_noi_doi: {
      id: 'la_ban_noi_doi',
      name: 'La Bàn Nói Dối',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'la_ban_noi_doi.png',
      desc: 'Hiển thị tia dự đoán quỹ đạo giả lệch hướng 45 độ, đánh lừa giác quan đối thủ.',
      hint: 'Tác động lượt sau của đối thủ • Đường ngắm giả'
    },
    ap_luc_thoi_gian: {
      id: 'ap_luc_thoi_gian',
      name: 'Áp Lực Thời Gian',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'ap_luc_thoi_gian.png',
      desc: 'Rút ngắn thời gian chuẩn bị xuống 3.5 giây! Hết giờ quả còn tự động tuột tay rơi đất.',
      hint: 'Tác động lượt sau của đối thủ • Đếm ngược 3.5s'
    },
    bang_tron: {
      id: 'bang_tron',
      name: 'Băng Trơn',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'bang_tron.png',
      desc: 'Tạo quán tính trơn trượt cho thao tác chuột, tay nhân vật bị trôi trượt tiếp tục sau khi dừng lia.',
      hint: 'Tác động lượt sau của đối thủ • Trơn trượt chuột'
    },
    phan_than: {
      id: 'phan_than',
      name: 'Phân Thân',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'phan_than.png',
      desc: 'Khi quả còn phóng lên trời, tách thành 3 bóng ma quả còn bay song song gây hoa mắt đối thủ.',
      hint: 'Tác động lượt sau của đối thủ • 3 Bóng ma quả còn'
    },
    hoan_doi: {
      id: 'hoan_doi',
      name: 'Hoán Đổi Bài',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'hoan_doi.png',
      desc: 'Tráo đổi toàn bộ 3 lá bài kỹ năng trên tay của bạn với 3 lá bài của đối phương!',
      hint: 'Dùng ngay trong lượt • Tráo bài 2 bên'
    },
    thach_dau: {
      id: 'thach_dau',
      name: 'Thách Đấu',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'thach_dau.png',
      desc: 'Thách thức đối thủ: Nếu đối thủ ném trúng được +2 điểm, nhưng nếu ném hụt bạn nhận ngay +1 điểm!',
      hint: 'Tác động lượt sau của đối thủ'
    },
    bay_ngam: {
      id: 'bay_ngam',
      name: 'Bẫy Ngầm',
      type: 'debuff',
      typeLabel: 'Gây nhiễu',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'bay_ngam.png',
      desc: 'Cài bẫy vô hình dưới chân đối thủ: Khi vung tay lấy đà, bẫy giật khiến thanh lực ném bị tụt 50%!',
      hint: 'Tác động lượt sau của đối thủ • Giật tụt lực'
    },

    // --- 3. NHÓM PHÒNG THỦ / BẢO VỆ (SHIELD) ---
    khien_chan: {
      id: 'khien_chan',
      name: 'Khiên Chắn',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'khien_chan.png',
      desc: 'Dựng khiên hoàng kim bảo hộ. Tự động kích hoạt khi đối thủ tung chiêu gây nhiễu để chặn đứng hoàn toàn.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    bao_toan: {
      id: 'bao_toan',
      name: 'Bảo Toàn',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'bao_toan.png',
      desc: 'Tự động kích hoạt khi đối thủ gây nhiễu để triệt tiêu và duy trì miễn nhiễm trong 2 lượt ném.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    thanh_tay: {
      id: 'thanh_tay',
      name: 'Thanh Tẩy',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'thanh_tay.png',
      desc: 'Tự kích hoạt khi đối thủ gây nhiễu, hoặc dùng để xóa sạch ngay lập tức mọi hiệu ứng xấu đang chịu phải.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    giai_tru: {
      id: 'giai_tru',
      name: 'Giải Trừ',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 15,
      img: 'giai_tru.png',
      desc: 'Tự kích hoạt khi đối thủ gây nhiễu, hoặc dùng để giải trừ mọi tác động tiêu cực lên quả còn.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    phan_chieu: {
      id: 'phan_chieu',
      name: 'Phản Chiếu',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'phan_chieu.png',
      desc: 'Tự động kích hoạt khi đối thủ gây nhiễu, dội ngược kỹ năng phá hoại trở lại đối thủ.',
      hint: 'Tự kích hoạt dội ngược chiêu đối thủ'
    },
    huy_bai: {
      id: 'huy_bai',
      name: 'Hủy Bài',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'huy_bai.png',
      desc: 'Tự động kích hoạt khi đối thủ gây nhiễu để vô hiệu hóa và phá hủy chiêu thức bất lợi.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    bat_khuat: {
      id: 'bat_khuat',
      name: 'Bất Khuất',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'rare',
      tierLabel: 'Hiếm',
      weight: 5,
      img: 'bat_khuat.png',
      desc: 'Tự động kích hoạt bảo toàn điểm số, miễn nhiễm trước mọi chiêu phạt cược / thách đấu.',
      hint: 'Tự kích hoạt khi đối thủ gây nhiễu'
    },
    bay_nguoc: {
      id: 'bay_nguoc',
      name: 'Bẫy Ngược',
      type: 'shield',
      typeLabel: 'Phản đòn',
      tier: 'common',
      tierLabel: 'Cơ bản',
      weight: 14,
      img: 'bay_nguoc.png',
      desc: 'Chiêu điều kiện: Tự động kích hoạt khi đối thủ tung chiêu gây nhiễu, phản gió bão ngược lại đối thủ.',
      hint: 'Phản đòn khi bị gây nhiễu'
    },
    hap_thu: {
      id: 'hap_thu',
      name: 'Hấp Thu',
      type: 'shield',
      typeLabel: 'Bảo vệ',
      tier: 'epic',
      tierLabel: 'Chí Mạng',
      weight: 2,
      img: 'hap_thu.png',
      desc: 'Tự động kích hoạt khi đối thủ gây nhiễu, chuyển hóa năng lượng quấy phá thành +1 điểm cho bạn.',
      hint: 'Tự kích hoạt chuyển hóa thành +1 điểm'
    }
  };

  // ==========================================
  // MAIN GAME CLASS
  // ==========================================
  class Game {
    constructor() {
      window.gameInstance = this;
      window.GAME_STATE = STATE;
      this.STATE = STATE;
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.sound = new SoundManager();
      this.particles = new ParticleSystem();
      this.cord = new VerletCord();
      this.quacon = new QuaconAssembly();

      // Dual Character Rigs:
      // - Single-player rig (customizable via skin modal)
      // - Player 1 Rig: Chàng trai Mường (left side, anchor X = 220)
      // - Player 2 Rig: Cô gái Thái (right side, anchor X = 2580, mirrored)
      this.rig = new CharacterRig();
      this.rigP1 = new CharacterRig('nam_tay_khoe_khoan', P1_ANCHOR_X);
      this.rigP2 = new CharacterRig('nu_tay_truyen_thong', P2_ANCHOR_X);

      // UI Elements
      this.ui = {
        score: document.getElementById('score-val'),
        highscore: document.getElementById('highscore-val'),
        streak: document.getElementById('streak-val'),
        throws: document.getElementById('throws-count'),
        accuracy: document.getElementById('accuracy-val'),
        btnAudio: document.getElementById('btn-audio'),
        audioIcon: document.getElementById('audio-icon'),
        btnMode: document.getElementById('btn-mode-select') || document.getElementById('btn-mode'),
        modeLabel: document.getElementById('mode-label'),
        modeIcon: document.getElementById('mode-icon'),
        btnGrip: document.getElementById('btn-grip'),
        gripLabel: document.getElementById('grip-label'),
        modalMode: document.getElementById('modal-mode'),
        btnCloseMode: document.getElementById('btn-close-mode'),
        btnStartGame: document.getElementById('btn-start-game'),
        btnStartHelp: document.getElementById('btn-start-help'),
        btnStartSkin: document.getElementById('btn-start-skin'),
        cardModeSingle: document.getElementById('card-mode-single'),
        cardModeVersus: document.getElementById('card-mode-versus'),
        gripOptions: document.querySelectorAll('.btn-grip-opt'),
        btnCulture: document.getElementById('btn-culture'),
        btnHelp: document.getElementById('btn-help'),
        btnReset: document.getElementById('btn-reset'),
        modalHelp: document.getElementById('modal-help'),
        tabBtnCulture: document.getElementById('tab-btn-culture'),
        tabBtnGameplay: document.getElementById('tab-btn-gameplay'),
        tabContentCulture: document.getElementById('tab-content-culture'),
        tabContentGameplay: document.getElementById('tab-content-gameplay'),
        cultureTicker: document.getElementById('culture-ticker'),
        tickerBadge: document.getElementById('ticker-badge'),
        tickerText: document.getElementById('ticker-text'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        btnModalOk: document.getElementById('btn-modal-ok'),
        banner: document.getElementById('announcement-banner'),
        announceTitle: document.getElementById('announce-title'),
        announceScore: document.getElementById('announce-score'),
        btnSkin: document.getElementById('btn-skin'),
        skinLabel: document.getElementById('skin-label'),
        modalSkin: document.getElementById('modal-skin'),
        btnCloseSkin: document.getElementById('btn-close-skin'),
        btnSkinDone: document.getElementById('btn-skin-done'),
        skinGridContainer: document.getElementById('skin-grid-container'),
        // 2-Player Versus UI elements
        btnVersus: document.getElementById('btn-versus'),
        versusLabel: document.getElementById('versus-label'),
        singleHudGroup: document.getElementById('single-hud-group'),
        versusHudGroup: document.getElementById('versus-hud-group'),
        p1HudCard: document.getElementById('p1-hud-card'),
        p2HudCard: document.getElementById('p2-hud-card'),
        p1ScoreDisplay: document.getElementById('p1-score-display'),
        p2ScoreDisplay: document.getElementById('p2-score-display'),
        turnBadge: document.getElementById('hud-turn-badge'),
        modalVictory: document.getElementById('modal-match-victory'),
        btnRematch: document.getElementById('btn-rematch'),
        btnExitVersus: document.getElementById('btn-exit-versus'),
        // Bot AI & Skills Trays
        btnBot: document.getElementById('btn-bot'),
        botLabel: document.getElementById('bot-label'),
        cardModeBot: document.getElementById('card-mode-bot'),
        p1SkillsTray: document.getElementById('p1-skills-tray'),
        p2SkillsTray: document.getElementById('p2-skills-tray'),
        p1SkillsSlots: document.getElementById('p1-skills-slots'),
        p2SkillsSlots: document.getElementById('p2-skills-slots'),
        p1TrayDot: document.getElementById('p1-tray-dot'),
        p2TrayDot: document.getElementById('p2-tray-dot'),
        p2TrayTitle: document.getElementById('p2-tray-title'),
        p1TrayStatus: document.getElementById('p1-tray-status'),
        p2TrayStatus: document.getElementById('p2-tray-status'),
        btnBotDiff: document.getElementById('btn-bot-diff'),
        botDiffLabel: document.getElementById('bot-diff-label'),
        btnMenuToggle: document.getElementById('btn-menu-toggle'),
        hudMenuDropdown: document.getElementById('hud-menu-dropdown'),
        btnModeSingle: document.getElementById('btn-mode-single')
      };

      // Game Mode State: 'bot' (default), 'versus', or 'single'
      this.gameMode = 'bot';
      this.botDifficulty = 'medium'; // 'easy' (35%) | 'medium' (60%) | 'hard' (85%)
      try {
        const savedDiff = localStorage.getItem('nemcon_bot_diff');
        if (savedDiff && ['easy', 'medium', 'hard'].includes(savedDiff)) {
          this.botDifficulty = savedDiff;
        }
      } catch (e) {}

      this.p1Score = 0;
      this.p2Score = 0;
      this.matchTargetScore = 10; // Đua 10 điểm chiến thắng
      this.currentTurn = 1;       // 1 = Player 1 (Nam), 2 = Player 2 (Nữ / Bot)
      this.cameraX = 0;           // Current camera scroll offset (0 to 1060px)
      this.cameraTargetX = 0;     // Target camera scroll offset
      this.isCameraPanning = false;
      this.panNotificationTimer = 0;
      this.assetsP1 = null;
      this.assetsP2 = null;

      // Fully Random 3-Slot Skill System (3 selectable cards with slot replacement upon use)
      this.skills = { p1: [], p2: [] };
      this.activeSkillSlot = { p1: null, p2: null };
      this.skillUsedThisTurn = { p1: null, p2: null };
      this.pendingDebuff = { p1: null, p2: null };
      this.activeDebuff = { p1: null, p2: null };
      this.debuffCaster = { p1: null, p2: null };
      this.debuffDetected = { p1: false, p2: false };
      this.shieldQueued = { p1: null, p2: null };
      this.shieldType = { p1: null, p2: null };
      this.shieldActive = { p1: false, p2: false };
      this.shieldDuration = { p1: 0, p2: 0 };
      this.shieldFlashTimer = { p1: 0, p2: 0 }; // 3.2s full-body barrier display on defensive counter
      this.batKhuatActive = { p1: false, p2: false };
      this.reverseTrapActive = { p1: false, p2: false };
      this.timePressureTimer = 0;
      this.slipperyVelocityX = 0;
      this.slipperyX = 0;
      this.accumulatedRotations = 0;
      this.trapTriggeredThisTurn = false;
      this.activeChallenge = null;
      this.opportunityStealActive = { p1: false, p2: false };
      this.extraThrowPending = null; // 'p1' | 'p2' | null (from cuop_co_hoi)
      this.extraThrowReason = null; // 'cuop_co_hoi' | 'song_nem' | null
      this.isWagerModalOpen = false;
      this.inverseRulesActive = false;
      this.debuffMultiplier = 1.0;
      this.wagerPoints = { p1: 0, p2: 0 };
      this.debuffVisualTriggered = { p1: false, p2: false };
      this.playerProfile = this.loadPlayerProfile();
      this.lastThrowData = null;
      this.aoAnhPoles = null;
      this.throwDifficulty = localStorage.getItem('nemcon_throw_difficulty') || 'medium';
      this.windDirectionMultiplier = 1; // 1: thuận, -1: nghịch
      this.windShiftTimer = 0;
      this.throwSpinCharge = 0;
      this.mirageProjectiles = null;

      // Bot AI State (Dynamic hit rate based on difficulty & personalized player adaptation)
      this.botState = null; // 'thinking' | 'swinging' | null
      this.botTimer = 0;
      this.botThinkingDuration = 0.5;
      this.botSwingDuration = 1.4;
      this.botAngle = Math.PI / 2;
      this.botSkillEvaluated = false;

      // State variables
      this.state = STATE.LOADING;
      this.score = 0;
      this.highscore = parseInt(localStorage.getItem('nemcon_highscore') || '0', 10);
      this.streak = 0;
      this.totalThrows = 0;
      this.successfulThrows = 0;

      // Physics mode: Manual whirl 1:1 circular whirl physics (Getting Over It)
      this.controlMode = 'manual';
      this.gripMode = localStorage.getItem('nemcon_grip_mode') || 'long';
      this.autoSpinTime = 0;
      this.autoSpinAngle = Math.PI / 2; // Starts pointing downward naturally

      // Mouse & Swing interaction
      this.isMouseDown = false;
      this.mouseWorldX = this.rig.shoulderX + 1;
      this.mouseWorldY = this.rig.shoulderY + 86;
      this.prevMouseX = this.mouseWorldX;
      this.prevMouseY = this.mouseWorldY;
      this.mouseVelocity = { x: 0, y: 0 };

      // Accumulated Kinetic Energy from continuous spinning (Động năng tích luỹ khi xoay)
      this.spinCharge = 0; // 0.0 to 1.0 (charges up with active circular revolutions)
      this.recentSpinCharge = 0;
      this.continuousRotation = 0;
      this.prevBallAngle = 0;
      this.totalRotations = 0;
      this.lastSpinDirection = 0;
      this.whooshCooldown = 0;

      // Projectile state (when in flight or landed)
      this.projectile = {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vx: 0,
        vy: 0,
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

    // ==========================================
    // PERSONALIZED PLAYER PROFILE & ANALYTICS
    // ==========================================
    loadPlayerProfile() {
      const defaultProfile = {
        totalThrows: 0,
        totalHits: 0,
        overallHitRate: 0.50,
        debuffStats: {
          none: { throws: 0, hits: 0, hitRate: 0.50 }
        },
        angleStats: {
          low: { throws: 0, hits: 0, hitRate: 0.40 },    // < 42 deg
          sweet: { throws: 0, hits: 0, hitRate: 0.60 },  // 42 - 54 deg
          high: { throws: 0, hits: 0, hitRate: 0.45 }    // > 54 deg
        },
        recentThrows: []
      };

      try {
        const saved = localStorage.getItem('nemcon_player_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultProfile,
            ...parsed,
            debuffStats: { ...defaultProfile.debuffStats, ...(parsed.debuffStats || {}) },
            angleStats: { ...defaultProfile.angleStats, ...(parsed.angleStats || {}) }
          };
        }
      } catch (e) {
        console.warn('Could not load player profile:', e);
      }
      return defaultProfile;
    }

    savePlayerProfile() {
      try {
        localStorage.setItem('nemcon_player_profile', JSON.stringify(this.playerProfile));
      } catch (e) {
        console.warn('Could not save player profile:', e);
      }
    }

    recordPlayerThrow(vx, vy, currentThrower) {
      if (currentThrower !== 'p1') {
        this.lastThrowData = null;
        return;
      }
      const fwd = Math.abs(vx);
      const up = -vy; // in canvas: upward speed is negative vy
      const angleDeg = (Math.atan2(up, fwd) * 180) / Math.PI;

      let bucket = 'sweet';
      if (angleDeg < 42) bucket = 'low';
      else if (angleDeg > 54) bucket = 'high';

      const debuffKey = this.activeDebuff.p1 || 'none';
      this.lastThrowData = {
        player: 'p1',
        angleDeg: Math.round(angleDeg),
        bucket: bucket,
        debuff: debuffKey
      };
    }

    resolvePlayerThrow(isHit) {
      if (!this.lastThrowData || this.lastThrowData.player !== 'p1') {
        this.lastThrowData = null;
        return;
      }
      const { bucket, debuff } = this.lastThrowData;
      const p = this.playerProfile;

      p.totalThrows = (p.totalThrows || 0) + 1;
      if (isHit) p.totalHits = (p.totalHits || 0) + 1;
      p.overallHitRate = p.totalThrows > 0 ? (p.totalHits / p.totalThrows) : 0.50;

      if (!p.debuffStats) p.debuffStats = {};
      if (!p.debuffStats[debuff]) {
        p.debuffStats[debuff] = { throws: 0, hits: 0, hitRate: 0 };
      }
      p.debuffStats[debuff].throws++;
      if (isHit) p.debuffStats[debuff].hits++;
      p.debuffStats[debuff].hitRate = p.debuffStats[debuff].hits / p.debuffStats[debuff].throws;

      if (!p.angleStats) {
        p.angleStats = {
          low: { throws: 0, hits: 0, hitRate: 0.40 },
          sweet: { throws: 0, hits: 0, hitRate: 0.60 },
          high: { throws: 0, hits: 0, hitRate: 0.45 }
        };
      }
      if (!p.angleStats[bucket]) {
        p.angleStats[bucket] = { throws: 0, hits: 0, hitRate: 0 };
      }
      p.angleStats[bucket].throws++;
      if (isHit) p.angleStats[bucket].hits++;
      p.angleStats[bucket].hitRate = p.angleStats[bucket].hits / p.angleStats[bucket].throws;

      if (!p.recentThrows) p.recentThrows = [];
      p.recentThrows.push(isHit ? 1 : 0);
      if (p.recentThrows.length > 20) p.recentThrows.shift();

      this.savePlayerProfile();
      this.lastThrowData = null;
    }

    // ==========================================
    // VISUAL SKILL CARD POPUP SYSTEM
    // ==========================================
    triggerSkillCardVisual(skillKey, player = 'p1', extraBadge = null) {
      if (!skillKey) return;
      const def = SKILLS_CATALOG[skillKey];
      if (!def) return;

      const container = document.getElementById('skill-card-popups');
      if (!container) return;

      // Characteristic audio
      if (def.type === 'shield') {
        this.sound.playScoreCelebration();
      } else if (def.type === 'debuff') {
        this.sound.playWhoosh(1.4);
      } else {
        this.sound.playScoreCelebration();
      }

      // Confetti / particle flare
      const rig = (player === 'p1') ? this.rigP1 : this.rigP2;
      if (rig && this.particles) {
        this.particles.addConfetti(rig.shoulderX, rig.shoulderY - 40, 22);
      }

      const popup = document.createElement('div');
      popup.className = `skill-card-popup tier-${def.tier || 'common'} player-${player}`;

      const badgeHtml = extraBadge ? `<div class="card-popup-badge">${extraBadge}</div>` : '';

      popup.innerHTML = `
        <div class="card-popup-glow"></div>
        <div class="card-popup-frame">
          <img src="assets/Skill/cards/${def.img}" alt="${def.name}" class="card-popup-img" />
        </div>
        ${badgeHtml}
      `;

      container.appendChild(popup);

      setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 1800);
    }

    // ==========================================
    // INTERACTIVE WAGER MODAL (CƯỢC ĐIỂM - MINIMALIST SLIDER)
    // ==========================================
    openWagerModal(player, slotIdx, curScore) {
      const modal = document.getElementById('wager-modal');
      const slider = document.getElementById('wager-slider');
      const valDisplay = document.getElementById('wager-val-display');
      const maxDisplay = document.getElementById('wager-slider-max');
      const balanceVal = document.getElementById('wager-balance-val');
      const confirmBtn = document.getElementById('wager-btn-confirm');
      const cancelBtn = document.getElementById('wager-btn-cancel');
      const helpBtn = document.getElementById('wager-help-btn');
      const helpTooltip = document.getElementById('wager-help-tooltip');
      if (!modal || !slider) return;

      this.isWagerModalOpen = true;

      const maxWager = Math.max(1, curScore);
      slider.min = '1';
      slider.max = maxWager.toString();
      slider.value = '1';
      slider.disabled = (maxWager <= 1);
      if (maxDisplay) maxDisplay.textContent = maxWager.toString();
      if (balanceVal) balanceVal.textContent = curScore.toString();

      const updateDisplay = () => {
        const val = parseInt(slider.value, 10) || 1;
        if (valDisplay) valDisplay.textContent = val.toString();
        if (confirmBtn) confirmBtn.textContent = `CƯỢC ${val} ĐIỂM`;
      };
      updateDisplay();

      slider.oninput = (e) => {
        if (e) e.stopPropagation();
        updateDisplay();
        this.sound.playWhoosh(1.8);
      };

      const closeModal = () => {
        modal.classList.add('hidden');
        this.isWagerModalOpen = false;
        if (helpTooltip) helpTooltip.classList.remove('active');
      };

      if (helpBtn && helpTooltip) {
        helpBtn.onclick = (e) => {
          e.stopPropagation();
          helpTooltip.classList.toggle('active');
        };
      }

      if (confirmBtn) {
        confirmBtn.onclick = (e) => {
          e.stopPropagation();
          const val = parseInt(slider.value, 10) || 1;
          closeModal();
          this.executeWager(player, slotIdx, val);
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          closeModal();
        };
      }

      // Backdrop click cancels and closes modal cleanly
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModal();
        }
      };

      const modalBox = modal.querySelector('.wager-modal-box');
      if (modalBox) {
        modalBox.onclick = (e) => e.stopPropagation();
      }

      modal.onpointerdown = (e) => e.stopPropagation();
      modal.onmousedown = (e) => e.stopPropagation();
      modal.ontouchstart = (e) => e.stopPropagation();

      modal.classList.remove('hidden');
    }

    executeWager(player, slotIdx, wager) {
      const modal = document.getElementById('wager-modal');
      if (modal) modal.classList.add('hidden');
      this.isWagerModalOpen = false;

      if (this.isMultiplayerMode) {
        if (player === 'p1') this.p1Score -= wager;
        else this.p2Score -= wager;
        this.updateVersusUI();
      } else {
        this.score -= wager * 100;
        this.updateStatsUI();
      }

      this.wagerPoints[player] = wager;
      this.skillUsedThisTurn[player] = 'cuoc_diem';
      this.activeSkillSlot[player] = slotIdx;
      this.updateSkillsUI();

      this.triggerSkillCardVisual('cuoc_diem', player, `CƯỢC -${wager} ĐIỂM`);
      this.sound.playWhoosh(1.4);
    }

    // ==========================================
    // ẢO ẢNH: 3 CỘT CÒN 3 CHIỀU CAO KHÁC NHAU
    // ==========================================
    initAoAnhPoles() {
      // 3 Cột Tre có chiều cao thuận theo đà rơi của quả còn (cột xa hơn thấp dần để bóng rơi vẫn ăn điểm!)
      const isP1Throw = (!this.isMultiplayerMode || this.currentTurn === 1);
      const xPositions = [1360, 1476, 1590];
      const scales = isP1Throw ? [0.38, 0.35, 0.31] : [0.31, 0.35, 0.38];

      const realIndex = Math.floor(Math.random() * 3);

      this.aoAnhPoles = xPositions.map((x, idx) => ({
        x: x,
        scale: scales[idx],
        ringY: GROUND_Y - (2067 - 250) * scales[idx],
        isReal: (idx === realIndex),
        dissolved: false
      }));
    }

    get isMultiplayerMode() {
      return this.gameMode === 'versus' || this.gameMode === 'bot';
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

      // Modal tab switching
      const switchTab = (tab) => {
        if (tab === 'culture') {
          if (this.ui.tabBtnCulture) this.ui.tabBtnCulture.classList.add('active');
          if (this.ui.tabBtnGameplay) this.ui.tabBtnGameplay.classList.remove('active');
          if (this.ui.tabContentCulture) this.ui.tabContentCulture.classList.add('active');
          if (this.ui.tabContentGameplay) this.ui.tabContentGameplay.classList.remove('active');
        } else {
          if (this.ui.tabBtnGameplay) this.ui.tabBtnGameplay.classList.add('active');
          if (this.ui.tabBtnCulture) this.ui.tabBtnCulture.classList.remove('active');
          if (this.ui.tabContentGameplay) this.ui.tabContentGameplay.classList.add('active');
          if (this.ui.tabContentCulture) this.ui.tabContentCulture.classList.remove('active');
        }
      };

      if (this.ui.tabBtnCulture) {
        this.ui.tabBtnCulture.addEventListener('click', () => switchTab('culture'));
      }
      if (this.ui.tabBtnGameplay) {
        this.ui.tabBtnGameplay.addEventListener('click', () => switchTab('gameplay'));
      }

      const openModalWithTab = (tab) => {
        switchTab(tab);
        this.ui.modalHelp.classList.remove('hidden');
      };
      const closeModal = () => this.ui.modalHelp.classList.add('hidden');

      if (this.ui.btnCulture) {
        this.ui.btnCulture.addEventListener('click', () => openModalWithTab('culture'));
      }
      if (this.ui.btnHelp) {
        this.ui.btnHelp.addEventListener('click', () => openModalWithTab('gameplay'));
      }
      if (this.ui.cultureTicker) {
        this.ui.cultureTicker.addEventListener('click', () => openModalWithTab('culture'));
      }
      if (this.ui.btnCloseModal) this.ui.btnCloseModal.addEventListener('click', closeModal);
      if (this.ui.btnModalOk) this.ui.btnModalOk.addEventListener('click', closeModal);

      // Cultural Article Multi-page & Chapter Switcher
      let currentCulturePage = 1;
      const totalCulturePages = 5;
      const chapterBtns = document.querySelectorAll('.chapter-nav-btn');
      const culturePages = document.querySelectorAll('.culture-page');
      const pageDots = document.querySelectorAll('.page-dots-indicator .dot');
      const btnPagePrev = document.getElementById('btn-page-prev');
      const btnPageNext = document.getElementById('btn-page-next');

      const setCulturePage = (pageNum) => {
        if (pageNum < 1) pageNum = 1;
        if (pageNum > totalCulturePages) pageNum = totalCulturePages;
        currentCulturePage = pageNum;

        culturePages.forEach((p, idx) => {
          if (idx + 1 === currentCulturePage) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        chapterBtns.forEach(btn => {
          const chap = parseInt(btn.getAttribute('data-chapter'), 10);
          if (chap === currentCulturePage) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        pageDots.forEach(dot => {
          const page = parseInt(dot.getAttribute('data-page'), 10);
          if (page === currentCulturePage) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });

        if (btnPagePrev) btnPagePrev.disabled = (currentCulturePage === 1);
        if (btnPageNext) btnPageNext.disabled = (currentCulturePage === totalCulturePages);

        if (this.ui.tabContentCulture) {
          this.ui.tabContentCulture.scrollTop = 0;
        }
      };

      chapterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const chap = parseInt(btn.getAttribute('data-chapter'), 10);
          setCulturePage(chap);
        });
      });

      pageDots.forEach(dot => {
        dot.addEventListener('click', () => {
          const page = parseInt(dot.getAttribute('data-page'), 10);
          setCulturePage(page);
        });
      });

      if (btnPagePrev) {
        btnPagePrev.addEventListener('click', () => {
          setCulturePage(currentCulturePage - 1);
        });
      }
      if (btnPageNext) {
        btnPageNext.addEventListener('click', () => {
          setCulturePage(currentCulturePage + 1);
        });
      }

      // Rotating Cultural Knowledge Ticker
      const CULTURAL_FACTS = [
        { badge: '🌾 GÓC VĂN HÓA:', text: 'Cột còn cao 15 - 30m bằng thân tre già vươn thẳng, tượng trưng cho trục vũ trụ nối Đất với Trời.' },
        { badge: '🌞 NHẬT NGUYỆT:', text: 'Vòng còn dán giấy 2 mặt biểu trưng cho Mặt Trời (Dương) & Mặt Trăng (Âm) soi sáng vạn vật.' },
        { badge: '🎁 TÚI HẠT MẦM:', text: 'Ruột quả còn nhồi hạt thóc nương, ngô, vừng, bông vải... gửi gắm ước vọng sinh sôi, ấm no.' },
        { badge: '✨ KHAI CỔNG TRỜI:', text: 'Khoảnh khắc quả còn phóng thủng tâm giấy là lúc âm dương hòa hợp, bản làng đón phúc lộc đầu năm.' },
        { badge: '🌸 TƠ DUYÊN VÙNG CAO:', text: 'Ném còn là dịp giao duyên của các chàng trai cô gái dân tộc trong trang phục thổ cẩm rực rỡ.' },
        { badge: '🎉 HỘI LỒNG TỒNG:', text: 'Lễ hội Xuống Đồng của người Tày, Nùng, Thái mở đầu bằng nghi thức ném quả còn đầu tiên của các bậc bô lão.' },
        { badge: '👉 ĐIỀU KHIỂN:', text: 'Giữ chuột xoay vòng lấy đà như Getting Over It; buông chuột đúng hướng phóng để bay vào vòng!' }
      ];

      let factIdx = 0;
      setInterval(() => {
        if (!this.ui.tickerText || !this.ui.tickerBadge) return;
        this.ui.tickerText.style.opacity = '0';
        setTimeout(() => {
          factIdx = (factIdx + 1) % CULTURAL_FACTS.length;
          const fact = CULTURAL_FACTS[factIdx];
          this.ui.tickerBadge.textContent = fact.badge;
          this.ui.tickerText.textContent = fact.text;
          this.ui.tickerText.style.opacity = '1';
        }, 300);
      }, 7000);

      // Helper to convert screen coordinates to canvas world coordinates
      const getCanvasPos = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
          y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
      };

      // Apply initial control mode and grip configuration
      this.applyControlMode(this.controlMode);
      this.applyGripMode(this.gripMode, false);

      // Mode Selection Modal Buttons & Cards
      if (this.ui.btnMode) {
        this.ui.btnMode.addEventListener('click', () => {
          this.openModeModal();
        });
      }

      if (this.ui.btnGrip) {
        this.ui.btnGrip.addEventListener('click', () => {
          this.cycleGripMode();
        });
      }

      // Start Modal Mode Cards (Bot AI vs 2 Người vs Chơi Đơn)
      const selectModalCard = (mode) => {
        if (this.ui.cardModeBot) this.ui.cardModeBot.classList.toggle('active', mode === 'bot');
        if (this.ui.cardModeVersus) this.ui.cardModeVersus.classList.toggle('active', mode === 'versus');
        if (this.ui.cardModeSingle) this.ui.cardModeSingle.classList.toggle('active', mode === 'single');
      };

      if (this.ui.cardModeBot) {
        this.ui.cardModeBot.addEventListener('click', () => {
          selectModalCard('bot');
          this.setGameMode('bot');
          this.closeModeModal();
          this.sound.init();
          this.sound.playWhoosh(1.1);
        });
      }

      if (this.ui.cardModeVersus) {
        this.ui.cardModeVersus.addEventListener('click', () => {
          selectModalCard('versus');
          this.setGameMode('versus');
          this.closeModeModal();
          this.sound.init();
          this.sound.playWhoosh(1.2);
        });
      }

      if (this.ui.cardModeSingle) {
        this.ui.cardModeSingle.addEventListener('click', () => {
          selectModalCard('single');
          this.setGameMode('single');
          this.closeModeModal();
          this.sound.init();
          this.sound.playWhoosh(1.0);
        });
      }

      // Unified Menu Dropdown Toggle
      if (this.ui.btnMenuToggle && this.ui.hudMenuDropdown) {
        this.ui.btnMenuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.init();
          this.sound.playWhoosh(0.9);
          this.ui.hudMenuDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
          if (!this.ui.hudMenuDropdown.contains(e.target) && !this.ui.btnMenuToggle.contains(e.target)) {
            this.ui.hudMenuDropdown.classList.add('hidden');
          }
        });
      }

      // Top Menu Bot Mode Button
      if (this.ui.btnBot) {
        this.ui.btnBot.addEventListener('click', () => {
          this.sound.init();
          this.sound.playWhoosh(1.1);
          this.setGameMode('bot');
          if (this.ui.hudMenuDropdown) this.ui.hudMenuDropdown.classList.add('hidden');
        });
      }

      // Top Menu Single Mode (Luyện tập) Button
      if (this.ui.btnModeSingle) {
        this.ui.btnModeSingle.addEventListener('click', () => {
          this.sound.init();
          this.sound.playWhoosh(1.0);
          this.setGameMode('single');
          if (this.ui.hudMenuDropdown) this.ui.hudMenuDropdown.classList.add('hidden');
        });
      }

      // Top Menu Difficulty Pills
      // Diff Pills in Header Dropdown Menu (Độ khó khi ném)
      const diffPills = document.querySelectorAll('.diff-pill');
      diffPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          const d = pill.getAttribute('data-diff');
          if (d) {
            this.sound.init();
            this.setThrowDifficulty(d);
          }
        });
      });

      // Top HUD Throw Difficulty Cycle Button (if present)
      if (this.ui.btnBotDiff) {
        this.ui.btnBotDiff.addEventListener('click', () => {
          this.sound.init();
          this.cycleThrowDifficulty();
        });
      }

      // Modal Throw Difficulty Selector Buttons
      const modalDiffBtns = document.querySelectorAll('.bot-diff-selector .btn-diff');
      modalDiffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const d = btn.getAttribute('data-diff');
          if (d) this.setThrowDifficulty(d);
        });
      });

      // Separate Guide Button on Start Modal
      if (this.ui.btnStartHelp) {
        this.ui.btnStartHelp.addEventListener('click', () => {
          this.closeModeModal();
          openModalWithTab('gameplay');
          this.sound.init();
          this.sound.playWhoosh(0.9);
        });
      }

      // Quick Character Selection on Start Modal
      if (this.ui.btnStartSkin) {
        this.ui.btnStartSkin.addEventListener('click', () => {
          this.openSkinModal();
          this.sound.init();
          this.sound.playWhoosh(1.0);
        });
      }

      // Top HUD Versus Mode Toggle Button
      if (this.ui.btnVersus) {
        this.ui.btnVersus.addEventListener('click', () => {
          this.sound.init();
          this.sound.playWhoosh(1.1);
          this.setGameMode(this.gameMode === 'versus' ? 'bot' : 'versus');
          if (this.ui.hudMenuDropdown) this.ui.hudMenuDropdown.classList.add('hidden');
        });
      }

      // Close menu dropdown on other menu action clicks
      [this.ui.btnSkin, this.ui.btnGrip, this.ui.btnHelp, this.ui.btnCulture, this.ui.btnReset].forEach(btn => {
        if (btn) {
          btn.addEventListener('click', () => {
            if (this.ui.hudMenuDropdown) this.ui.hudMenuDropdown.classList.add('hidden');
          });
        }
      });

      // Skills Tray Click Listeners via Event Delegation
      if (this.ui.p1SkillsSlots) {
        this.ui.p1SkillsSlots.addEventListener('click', (e) => {
          const btn = e.target.closest('.skill-card-btn');
          if (!btn) return;
          e.stopPropagation();
          const slotAttr = btn.getAttribute('data-slot');
          const slotIdx = slotAttr !== null ? parseInt(slotAttr, 10) : NaN;
          this.activateSkill('p1', !isNaN(slotIdx) ? slotIdx : btn.getAttribute('data-skill'));
        });
      }

      if (this.ui.p2SkillsSlots) {
        this.ui.p2SkillsSlots.addEventListener('click', (e) => {
          const btn = e.target.closest('.skill-card-btn');
          if (!btn) return;
          e.stopPropagation();
          if (this.gameMode === 'bot') return; // Bot uses skills autonomously
          const slotAttr = btn.getAttribute('data-slot');
          const slotIdx = slotAttr !== null ? parseInt(slotAttr, 10) : NaN;
          this.activateSkill('p2', !isNaN(slotIdx) ? slotIdx : btn.getAttribute('data-skill'));
        });
      }

      // Victory Modal Rematch & Exit Buttons
      if (this.ui.btnRematch) {
        this.ui.btnRematch.addEventListener('click', () => {
          if (this.ui.modalVictory) this.ui.modalVictory.classList.add('hidden');
          this.setGameMode(this.gameMode);
          this.sound.init();
          this.sound.playWhoosh(1.2);
        });
      }
      if (this.ui.btnExitVersus) {
        this.ui.btnExitVersus.addEventListener('click', () => {
          if (this.ui.modalVictory) this.ui.modalVictory.classList.add('hidden');
          this.setGameMode('single');
          this.sound.init();
          this.sound.playWhoosh(1.0);
        });
      }

      if (this.ui.gripOptions) {
        this.ui.gripOptions.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const g = btn.getAttribute('data-grip');
            this.applyGripMode(g, true);
            this.sound.init();
            this.sound.playWhoosh(1.3);
          });
        });
      }

      if (this.ui.btnCloseMode) {
        this.ui.btnCloseMode.addEventListener('click', () => {
          this.closeModeModal();
        });
      }

      if (this.ui.btnStartGame) {
        this.ui.btnStartGame.addEventListener('click', () => {
          let chosen = 'bot';
          if (this.ui.cardModeVersus && this.ui.cardModeVersus.classList.contains('active')) chosen = 'versus';
          else if (this.ui.cardModeSingle && this.ui.cardModeSingle.classList.contains('active')) chosen = 'single';
          this.setGameMode(chosen);
          this.closeModeModal();
          this.sound.init();
          this.sound.playWhoosh(1.0);
        });
      }

      // Skin & Character Selection Modal
      const btnQuickSkin = document.getElementById('btn-quick-skin');
      if (btnQuickSkin) {
        btnQuickSkin.addEventListener('click', () => {
          this.openSkinModal();
        });
      }
      if (this.ui.btnSkin) {
        this.ui.btnSkin.addEventListener('click', () => {
          this.openSkinModal();
        });
      }
      if (this.ui.btnCloseSkin) {
        this.ui.btnCloseSkin.addEventListener('click', () => {
          this.closeSkinModal();
        });
      }
      if (this.ui.btnSkinDone) {
        this.ui.btnSkinDone.addEventListener('click', () => {
          this.closeSkinModal();
        });
      }

      this.updateSkinUI();
      this.updateBotDifficultyUI();

      // Open Mode Modal on start: "mỗi khi vào sẽ được chọn 2 chế độ..."
      this.openModeModal();

      // Request landscape orientation lock if supported by mobile browser
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (e) {}

      // Helper to convert screen coordinates to canvas world coordinates (handles object-fit: cover + mobile 90° forced landscape)
      this.getCanvasPos = (clientX, clientY) => {
        const isPortraitRotated = (window.innerHeight > window.innerWidth) && (window.innerWidth <= 900);
        const rect = this.canvas.getBoundingClientRect();
        
        let localX, localY, elemW, elemH;

        if (isPortraitRotated) {
          // Canvas is rotated 90deg clockwise in CSS: element width is rect.height (100vh), height is rect.width (100vw)
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dxScreen = clientX - cx;
          const dyScreen = clientY - cy;

          elemW = this.canvas.clientWidth || rect.height;
          elemH = this.canvas.clientHeight || rect.width;

          localX = elemW / 2 + dyScreen;
          localY = elemH / 2 - dxScreen;
        } else {
          elemW = rect.width;
          elemH = rect.height;
          localX = clientX - rect.left;
          localY = clientY - rect.top;
        }

        const scale = Math.max(elemW / CANVAS_WIDTH, elemH / CANVAS_HEIGHT);
        const renderedW = CANVAS_WIDTH * scale;
        const renderedH = CANVAS_HEIGHT * scale;
        const offsetX = (elemW - renderedW) / 2;
        const offsetY = (elemH - renderedH) / 2;

        const screenX = (localX - offsetX) / scale;
        const screenY = (localY - offsetY) / scale;

        return {
          x: (this.isMultiplayerMode) ? screenX + this.cameraX : screenX,
          y: screenY,
          screenX: screenX,
          screenY: screenY
        };
      };

      this.handlePointerDown = (clientX, clientY, pointerId = null) => {
        if (this.isWagerModalOpen) return; // Strictly lock input while wager modal is open
        if (this.isCameraPanning) return; // Lock input while camera is sliding
        if (this.gameMode === 'bot' && this.currentTurn === 2) return; // Lock input during Bot's turn
        this.sound.init();
        if (this.state === STATE.IDLE) {
          this.isMouseDown = true;
          this.state = STATE.SWINGING;
          const wrapper = document.getElementById('canvas-wrapper');
          if (wrapper) wrapper.classList.add('grabbing');
          const pos = this.getCanvasPos(clientX, clientY);

          if (this.isMultiplayerMode && this.currentTurn === 2) {
            // Player 2 is mirrored horizontally around P2_ANCHOR_X
            const localX = 2 * P2_ANCHOR_X - pos.x;
            this.mouseWorldX = localX;
            this.mouseWorldY = pos.y;
            this.prevMouseX = localX;
            this.prevMouseY = pos.y;
          } else {
            this.mouseWorldX = pos.x;
            this.mouseWorldY = pos.y;
            this.prevMouseX = pos.x;
            this.prevMouseY = pos.y;
          }

          // Reset spin momentum tracking for the new wind-up
          this.spinCharge = 0;
          this.recentSpinCharge = 0;
          this.continuousRotation = 0;
          this.totalRotations = 0;
          this.lastSpinDirection = 0;
          this.whooshCooldown = 0.25;

          this.autoSpinTime = 0;
          this.autoSpinAngle = Math.PI / 2; // Hanging down initially

          const activeRig = (this.isMultiplayerMode)
            ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
            : this.rig;
          const ballPos = this.cord.getEndPosition();
          this.prevBallAngle = Math.atan2(ballPos.y - activeRig.shoulderY, ballPos.x - activeRig.shoulderX);
        }
      };

      this.handlePointerMove = (clientX, clientY) => {
        if (!this.isMouseDown) return;
        if (this.isCameraPanning) return;
        if (this.gameMode === 'bot' && this.currentTurn === 2) return;
        const pos = this.getCanvasPos(clientX, clientY);
        // In manual mode, mouse or touch position directly controls the hand target
        if (this.controlMode === 'manual') {
          const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
          const isDaoNguoc = (this.activeDebuff[curThrower] === 'dao_nguoc');

          let targetX = pos.x;
          let targetY = pos.y;

          if (isDaoNguoc) {
            const activeRig = (this.isMultiplayerMode)
              ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
              : this.rig;
            const sx = activeRig ? activeRig.shoulderX : 220;
            const sy = activeRig ? activeRig.shoulderY : 650;
            targetX = sx - (pos.x - sx);
            targetY = sy - (pos.y - sy);
          }

          if (this.isMultiplayerMode && this.currentTurn === 2) {
            this.mouseWorldX = 2 * P2_ANCHOR_X - targetX;
            this.mouseWorldY = targetY;
          } else {
            this.mouseWorldX = targetX;
            this.mouseWorldY = targetY;
          }
        }
      };

      this.handlePointerUp = () => {
        if (this.gameMode === 'bot' && this.currentTurn === 2) return;
        if (this.state === STATE.SWINGING && this.isMouseDown) {
          const wrapper = document.getElementById('canvas-wrapper');
          if (wrapper) wrapper.classList.remove('grabbing');
          this.isMouseDown = false;
          this.performThrow();
        }
      };

      // Universal Input Events (Pointer, Touch, Mouse)
      const wrapper = document.getElementById('canvas-wrapper');

      // 1. Pointer Events
      const onPointerUp = (e) => {
        if (e && e.pointerId !== undefined) {
          try { wrapper.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        this.handlePointerUp();
      };

      const isInteractiveUI = (target) => {
        if (this.isWagerModalOpen) return true;
        return !!(target && (
          target.closest('.skills-tray') ||
          target.closest('.modal-overlay') ||
          target.closest('.wager-modal-overlay') ||
          target.closest('#wager-modal') ||
          target.closest('#announcement-banner') ||
          target.closest('#hud-top') ||
          target.closest('#hud-bottom')
        ));
      };

      wrapper.addEventListener('pointerdown', (e) => {
        if (isInteractiveUI(e.target)) return;
        e.preventDefault();
        try { wrapper.setPointerCapture(e.pointerId); } catch (err) {}
        this.handlePointerDown(e.clientX, e.clientY, e.pointerId);
      });

      wrapper.addEventListener('pointermove', (e) => {
        if (this.isMouseDown) this.handlePointerMove(e.clientX, e.clientY);
      });
      window.addEventListener('pointermove', (e) => {
        if (this.isMouseDown) this.handlePointerMove(e.clientX, e.clientY);
      });

      wrapper.addEventListener('pointerup', onPointerUp);
      wrapper.addEventListener('pointercancel', onPointerUp);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // 2. Mouse Events (Desktop & Testing Framework Fallback)
      wrapper.addEventListener('mousedown', (e) => {
        if (isInteractiveUI(e.target)) return;
        e.preventDefault();
        this.handlePointerDown(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', (e) => {
        if (this.isMouseDown) this.handlePointerMove(e.clientX, e.clientY);
      });
      wrapper.addEventListener('mouseup', () => this.handlePointerUp());
      window.addEventListener('mouseup', () => this.handlePointerUp());

      // 3. Touch Events (Mobile Safari / Chrome Gestures Fallback)
      wrapper.addEventListener('touchstart', (e) => {
        if (isInteractiveUI(e.target)) return;
        if (e.touches.length > 0) {
          e.preventDefault();
          this.handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (this.isMouseDown && e.touches.length > 0) {
          e.preventDefault();
          this.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      wrapper.addEventListener('touchend', () => this.handlePointerUp());
      window.addEventListener('touchend', () => this.handlePointerUp());
      window.addEventListener('touchcancel', () => this.handlePointerUp());

    }

    applyControlMode(mode = 'manual') {
      this.controlMode = 'manual';
      localStorage.setItem('nemcon_control_mode', 'manual');
    }

    applyGripMode(gripKey, resetCord = true) {
      if (!GRIP_CONFIGS[gripKey]) gripKey = 'long';
      this.gripMode = gripKey;
      localStorage.setItem('nemcon_grip_mode', gripKey);

      const conf = GRIP_CONFIGS[gripKey];
      this.cord.setLength(conf.length);

      if (this.ui.gripLabel) {
        this.ui.gripLabel.textContent = conf.label;
      }
      if (this.ui.gripOptions) {
        this.ui.gripOptions.forEach(btn => {
          if (btn.getAttribute('data-grip') === gripKey) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
      if (resetCord && (this.state === STATE.IDLE || this.state === STATE.LOADING)) {
        this.cord.reset(this.rig.handGripX, this.rig.handGripY);
      }
    }

    cycleGripMode() {
      const keys = ['long', 'mid', 'short'];
      const nextIdx = (keys.indexOf(this.gripMode) + 1) % keys.length;
      this.applyGripMode(keys[nextIdx], true);
      this.sound.init();
      this.sound.playWhoosh(1.2);
    }

    openModeModal() {
      if (this.ui.modalMode) {
        this.ui.modalMode.classList.remove('hidden');
      }
    }

    closeModeModal() {
      if (this.ui.modalMode) {
        this.ui.modalMode.classList.add('hidden');
      }
    }

    openSkinModal() {
      this.renderSkinGrid();
      if (this.ui.modalSkin) {
        this.ui.modalSkin.classList.remove('hidden');
      }
    }

    closeSkinModal() {
      if (this.ui.modalSkin) {
        this.ui.modalSkin.classList.add('hidden');
      }
    }

    renderSkinGrid() {
      if (!this.ui.skinGridContainer || typeof CHARACTER_CONFIG === 'undefined') return;
      const allSkins = CHARACTER_CONFIG.getAllSkins();
      const activeId = CHARACTER_CONFIG.getActiveSkinId();

      this.ui.skinGridContainer.innerHTML = '';

      allSkins.forEach(skin => {
        const isCurrent = (skin.id === activeId);
        const card = document.createElement('div');
        card.className = `skin-card ${isCurrent ? 'active' : ''}`;
        card.setAttribute('data-skin-id', skin.id);

        const previewSrc = skin.preview || skin.sprites.body;

        card.innerHTML = `
          <div class="skin-card-badge">ĐANG SỬ DỤNG</div>
          <div class="skin-preview-wrap">
            <img src="${previewSrc}" alt="${skin.name}" class="skin-preview-img" onerror="this.src='${skin.sprites.body}'">
          </div>
          <div class="skin-info">
            <h3>${skin.name}</h3>
            <p class="skin-ethnicity">${skin.ethnicity || ''}</p>
            <p class="skin-desc">${skin.description || ''}</p>
          </div>
          <button class="btn-select-skin">${isCurrent ? '✔ ĐANG CHỌN' : 'CHỌN NHÂN VẬT NÀY'}</button>
        `;

        card.addEventListener('click', async () => {
          if (skin.id === CHARACTER_CONFIG.getActiveSkinId()) return;
          await this.changeSkin(skin.id);
          this.renderSkinGrid();
          this.sound.init();
          this.sound.playWhoosh(1.2);
        });

        this.ui.skinGridContainer.appendChild(card);
      });
    }

    async changeSkin(skinId) {
      if (typeof CHARACTER_CONFIG === 'undefined') return;
      const cfg = CHARACTER_CONFIG.getSkinConfig(skinId);
      if (!cfg) return;

      CHARACTER_CONFIG.setActiveSkinId(skinId);

      // Load new skin assets
      const charAssets = CHARACTER_CONFIG.getCharacterAssetEntries(skinId);
      await Promise.all(charAssets.map(item => {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            this.assets[item.key] = img;
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          img.src = item.src;
        });
      }));

      // Update Character Rig
      this.rig.setSkin(cfg);
      if (this.state === STATE.IDLE || this.state === STATE.LOADING) {
        this.cord.reset(this.rig.handGripX, this.rig.handGripY);
      }
      this.updateSkinUI();
    }

    updateSkinUI() {
      if (typeof CHARACTER_CONFIG === 'undefined') return;
      const cfg = CHARACTER_CONFIG.getSkinConfig();
      if (this.ui.skinLabel && cfg) {
        this.ui.skinLabel.textContent = cfg.name ? cfg.name.split(' ')[0] : 'Nhân Vật';
      }
    }

    resetGame() {
      if (this.isMultiplayerMode) {
        this.setGameMode(this.gameMode);
        return;
      }
      this.isWagerModalOpen = false;
      const wagerModal = document.getElementById('wager-modal');
      if (wagerModal) wagerModal.classList.add('hidden');
      this.opportunityStealActive = { p1: false, p2: false };
      this.extraThrowPending = null;
      this.extraThrowThisTurn = false;
      this.extraThrowReason = null;

      this.score = 0;
      this.streak = 0;
      this.totalThrows = 0;
      this.successfulThrows = 0;
      this.spinCharge = 0;
      this.recentSpinCharge = 0;
      this.continuousRotation = 0;
      this.totalRotations = 0;
      this.autoSpinTime = 0;
      this.updateStatsUI();
      this.state = STATE.IDLE;
      this.cord.reset(this.rig.handGripX, this.rig.handGripY);
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
      }, 2200);
    }

    loadAssets() {
      // Dynamic character sprite loading from character-config.js
      const charAssets = (typeof CHARACTER_CONFIG !== 'undefined')
        ? CHARACTER_CONFIG.getCharacterAssetEntries()
        : [
            { key: 'body',      src: 'assets/character/attempt/clean/body.png' },
            { key: 'upper_arm', src: 'assets/character/attempt/clean/upper_arm_unified.png' },
            { key: 'forearm',   src: 'assets/character/attempt/clean/forearm.png' },
            { key: 'hand',      src: 'assets/character/attempt/clean/hand.png' }
          ];

      const assetList = [
        { key: 'bg',                  src: 'assets/background/Background.png' },
        { key: 'bg_extend',           src: 'assets/background/Background-extend.png' },
        { key: 'pole',                src: 'assets/items/Pole_transparent.png' },
        ...charAssets,
        // Player 1 Sprites: Chàng Trai Mường (nam_tay_khoe_khoan)
        { key: 'p1_body',             src: 'assets/character/skins/nam_tay_moi/body.png' },
        { key: 'p1_upper_arm',        src: 'assets/character/skins/nam_tay_moi/upper_arm_unified.png' },
        { key: 'p1_forearm',          src: 'assets/character/skins/nam_tay_moi/forearm.png' },
        { key: 'p1_hand',             src: 'assets/character/skins/nam_tay_moi/hand.png' },
        // Player 2 Sprites: Cô Gái Thái (nu_tay_truyen_thong)
        { key: 'p2_body',             src: 'assets/character/skin/body.png' },
        { key: 'p2_upper_arm',        src: 'assets/character/skin/upper_arm_unified.png' },
        { key: 'p2_forearm',          src: 'assets/character/skin/forearm.png' },
        { key: 'p2_hand',             src: 'assets/character/skin/hand.png' },
        // Quả Còn & Streamers
        { key: 'quacon_ball',         src: 'assets/character/attempt/clean/quacon_ball.png' },
        { key: 'streamer_pink',       src: 'assets/character/attempt/clean/streamer_pink.png' },
        { key: 'streamer_green_up',   src: 'assets/character/attempt/clean/streamer_green_up.png' },
        { key: 'streamer_yellow_1',   src: 'assets/character/attempt/clean/streamer_yellow_1.png' },
        { key: 'streamer_yellow_2',   src: 'assets/character/attempt/clean/streamer_yellow_2.png' },
        { key: 'streamer_green_down', src: 'assets/character/attempt/clean/streamer_green_down.png' }
      ];

      this.totalAssets = assetList.length;

      assetList.forEach(item => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          this.assets[item.key] = img;
          this.assetsLoaded++;
          if (this.assetsLoaded === this.totalAssets) {
            this.assetsP1 = {
              body: this.assets.p1_body,
              upper_arm: this.assets.p1_upper_arm,
              forearm: this.assets.p1_forearm,
              hand: this.assets.p1_hand
            };
            this.assetsP2 = {
              body: this.assets.p2_body,
              upper_arm: this.assets.p2_upper_arm,
              forearm: this.assets.p2_forearm,
              hand: this.assets.p2_hand
            };
            this.state = STATE.IDLE;
            this.cord.reset(this.rig.handGripX, this.rig.handGripY);
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
      this.ctx.font = 'bold 36px "Be Vietnam Pro", -apple-system, sans-serif';
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
        try {
          const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
          lastTime = currentTime;

          this.update(dt);
          this.render();
        } catch (err) {
          console.error('[ANIMATION LOOP ERROR]:', err);
        } finally {
          requestAnimationFrame(loop);
        }
      };
      requestAnimationFrame(loop);
    }

    // ==========================================
    // UPDATE CYCLE
    // ==========================================
    update(dt) {
      this.particles.update(dt);

      if (this.shieldFlashTimer.p1 > 0) this.shieldFlashTimer.p1 -= dt;
      if (this.shieldFlashTimer.p2 > 0) this.shieldFlashTimer.p2 -= dt;

      if (this.ringGlowTimer > 0) {
        this.ringGlowTimer -= dt;
      }

      // Gió Mạnh: Ngẫu nhiên đảo chiều thuận/nghịch theo thời gian
      const curThrowerForWind = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      if (this.activeDebuff[curThrowerForWind] === 'gio_manh' || this.activeDebuff[curThrowerForWind] === 'phat_kep') {
        this.windShiftTimer += dt;
        if (this.windShiftTimer >= 2.0 + Math.random() * 0.8) {
          this.windShiftTimer = 0;
          const oldDir = this.windDirectionMultiplier;
          this.windDirectionMultiplier = (Math.random() < 0.5 ? 1 : -1);
          if (oldDir !== this.windDirectionMultiplier && (this.state === STATE.SWINGING || this.state === STATE.FLYING)) {
            const dirLabel = this.windDirectionMultiplier === 1 ? 'THUẬN CHIỀU (HỖ TRỢ)' : 'NGHỊCH CHIỀU (CẢN TRỞ)';
            this.showAnnouncement('💨 GIÓ ĐỔI CHIỀU!', `Gió giật chuyển sang: ${dirLabel}!`);
          }
        }
      }

      // Smooth cinematic camera pan interpolation in 2-Player Versus Mode & Bot AI Mode
      if (this.isMultiplayerMode) {
        if (Math.abs(this.cameraX - this.cameraTargetX) > 0.5) {
          const panSpeed = 3.6;
          this.cameraX += (this.cameraTargetX - this.cameraX) * Math.min(1.0, dt * panSpeed);
          this.isCameraPanning = true;
        } else {
          this.cameraX = this.cameraTargetX;
          if (this.isCameraPanning) {
            this.isCameraPanning = false;
            this.resetTurnCord();
            if (this.gameMode === 'bot' && this.currentTurn === 2) {
              this.startBotTurn();
            }
          }
        }
      }

      // Áp Lực Thời Gian (Countdown debuff): Bắt đầu bấm giờ ngay từ lúc đổi lượt!
      // Đếm ngược liên tục cả khi đang đứng chuẩn bị (STATE.IDLE) hoặc đang lấy đà (STATE.SWINGING)
      const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      if (!this.isWagerModalOpen && this.activeDebuff[curThrower] === 'ap_luc_thoi_gian' && (this.state === STATE.IDLE || this.state === STATE.SWINGING)) {
        this.timePressureTimer -= dt;
        if (this.timePressureTimer <= 0) {
          this.timePressureTimer = 0;
          this.activeDebuff[curThrower] = null;
          this.showAnnouncement('⏰ HẾT THỜI GIAN!', 'Áp lực thời gian bí mật khiến quả còn tuột tay rơi đất!');
          this.isMouseDown = false;
          const wrapper = document.getElementById('canvas-wrapper');
          if (wrapper) wrapper.classList.remove('grabbing');
          if (this.gameMode === 'bot' && this.currentTurn === 2) {
            this.botState = null;
          }
          this.sound.playGroundThud();
          this.performDropAtFeet();
          return;
        }
      }

      const activeRig = (this.isMultiplayerMode)
        ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
        : this.rig;

      // Auto-spin circular kinematics when holding in auto mode (Clockwise forward windup)
      if (this.state === STATE.SWINGING && this.isMouseDown && this.controlMode === 'auto') {
        this.autoSpinTime += dt;
        // Accelerate smoothly from 5.0 rad/s up to 15.5 rad/s
        const omega = Math.min(15.5, 5.0 + this.autoSpinTime * 5.8);
        this.autoSpinAngle += omega * dt; // CLOCKWISE rotation: Back -> Up -> Forward -> Down

        // Hand stays in athletic forward-chest windup posture, making a tight rhythmic circular pump
        const handCenterX = activeRig.shoulderX + 24;
        const handCenterY = activeRig.shoulderY + 20;
        const handRadius = 14 + Math.min(this.autoSpinTime * 3, 5); // 14 to 19px tight natural radius

        this.mouseWorldX = handCenterX + Math.cos(this.autoSpinAngle) * handRadius;
        this.mouseWorldY = handCenterY + Math.sin(this.autoSpinAngle) * handRadius;
      }

      // Track mouse velocity
      this.mouseVelocity = {
        x: (this.mouseWorldX - this.prevMouseX) / Math.max(dt, 0.001),
        y: (this.mouseWorldY - this.prevMouseY) / Math.max(dt, 0.001)
      };
      this.prevMouseX = this.mouseWorldX;
      this.prevMouseY = this.mouseWorldY;

      // Update Active Character Rig IK & Dynamic Wrist Articulation (Only for human players)
      if (!(this.gameMode === 'bot' && this.currentTurn === 2)) {
        const isInteracting = (this.state === STATE.SWINGING && this.isMouseDown);
        let pullX, pullY;
        if (this.state === STATE.SWINGING || this.state === STATE.IDLE) {
          const ballPos = this.cord.getEndPosition();
          pullX = ballPos.x;
          pullY = ballPos.y;
        }

        let targetHandX = this.mouseWorldX;
        let targetHandY = this.mouseWorldY;
        const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
        if (this.activeDebuff[curThrower] === 'bang_tron' && isInteracting) {
          this.slipperyVelocityX = (this.slipperyVelocityX || 0) + (this.mouseWorldX - (this.slipperyX || this.mouseWorldX)) * 0.12;
          this.slipperyX = (this.slipperyX || this.mouseWorldX) + this.slipperyVelocityX;
          this.slipperyVelocityX *= 0.88;
          targetHandX = this.slipperyX;
        } else {
          this.slipperyX = this.mouseWorldX;
          this.slipperyVelocityX = 0;
        }

        activeRig.update(dt, isInteracting, targetHandX, targetHandY, pullX, pullY);
      }

      // In versus or bot mode, keep the waiting character naturally idling with breathing motion
      if (this.isMultiplayerMode) {
        const inactiveRig = (this.currentTurn === 1) ? this.rigP2 : this.rigP1;
        inactiveRig.update(dt, false, inactiveRig.shoulderX + 1, inactiveRig.shoulderY + 80);
      }

      // Update Bot AI in bot mode when it is P2's turn
      if (this.gameMode === 'bot' && this.currentTurn === 2) {
        this.updateBotAI(dt);
      }

      // State machine logic
      switch (this.state) {
        case STATE.IDLE:
          this.updateIdle(dt);
          break;
        case STATE.SWINGING:
          this.updateSwinging(dt);
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
      if (this.gameMode === 'bot' && this.currentTurn === 2) return;
      const activeRig = (this.isMultiplayerMode)
        ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
        : this.rig;
      // Cord hangs gently from hand
      this.cord.update(activeRig.handGripX, activeRig.handGripY, dt, true);
      const ballPos = this.cord.getEndPosition();
      const ballVel = this.cord.getEndVelocity(dt);
      this.quacon.update(dt, ballVel.vx, ballVel.vy);
    }

    updateSwinging(dt) {
      if (this.gameMode === 'bot' && this.currentTurn === 2) return;
      const activeRig = (this.isMultiplayerMode)
        ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
        : this.rig;

      if (this.controlMode === 'auto') {
        // MODE 1: AUTO-SPIN (Hold to whirl smoothly & accelerate)
        // Full momentum reached in ~1.7 seconds of holding
        this.spinCharge = Math.min(1.0, this.autoSpinTime / 1.7);
        this.recentSpinCharge = this.spinCharge;
        this.continuousRotation = this.autoSpinTime * 12.0;

        // Dynamic whistling / whoosh sound rhythmically triggered by accumulated momentum!
        this.whooshCooldown -= dt;
        if (this.spinCharge > 0.12 && this.whooshCooldown <= 0) {
          const pitch = 0.85 + this.spinCharge * 0.85;
          this.sound.playWhoosh(pitch);
          this.whooshCooldown = Math.max(0.16, 0.38 - this.spinCharge * 0.20);
        }

        // Taut centrifugal sling kinematics: cord extends outward naturally under centrifugal force
        const omega = Math.min(15.5, 5.0 + this.autoSpinTime * 5.8);
        const lag = Math.min(0.35, 0.12 + (omega / 15.5) * 0.18);
        const ballAngle = this.autoSpinAngle - lag;

        const hx = activeRig.handGripX;
        const hy = activeRig.handGripY;
        const totalLen = this.cord.totalLength;

        // Place each node along the taut centrifugal arc with subtle catenary curve
        for (let i = 0; i < this.cord.numNodes; i++) {
          const ratio = i / (this.cord.numNodes - 1);
          const dist = ratio * totalLen;
          const nodeLag = lag * Math.pow(ratio, 1.3);
          const nodeAngle = this.autoSpinAngle - nodeLag;

          const nx = hx + Math.cos(nodeAngle) * dist;
          const ny = hy + Math.sin(nodeAngle) * dist;

          const n = this.cord.nodes[i];
          n.oldX = n.x;
          n.oldY = n.y;
          n.x = nx;
          n.y = ny;
        }

        // Tangential velocity of the ball at the end of the cord:
        // Clockwise rotation: V = omega * R along tangent (-sin(a), cos(a))
        const effectiveR = totalLen + 16;
        const tangVx = -Math.sin(ballAngle) * omega * effectiveR;
        const tangVy = Math.cos(ballAngle) * omega * effectiveR;

        // Set last node oldX/oldY so getEndVelocity() reflects the true physical velocity
        const lastNode = this.cord.nodes[this.cord.numNodes - 1];
        lastNode.oldX = lastNode.x - tangVx * dt;
        lastNode.oldY = lastNode.y - tangVy * dt;

        // Update quả còn streamers orientation and flutter
        this.quacon.update(dt, tangVx, tangVy);
      } else {
        // MODE 2: MANUAL WHIRL (Getting Over It 1:1 Physics)
        const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
        const isLamCham = (this.skillUsedThisTurn[curThrower] === 'lam_cham');
        const effectiveDt = isLamCham ? dt * 0.45 : dt; // Bullet Time Slow-Motion for easy aiming

        this.cord.update(activeRig.handGripX, activeRig.handGripY, effectiveDt, true);
        const ballPos = this.cord.getEndPosition();
        const ballVel = this.cord.getEndVelocity(effectiveDt);
        const rawSpeed = Math.hypot(ballVel.vx, ballVel.vy);

        // Track angular momentum around active character shoulder
        const curAngle = Math.atan2(ballPos.y - activeRig.shoulderY, ballPos.x - activeRig.shoulderX);
        let dAngle = curAngle - this.prevBallAngle;
        if (!isFinite(dAngle)) {
          dAngle = 0;
        } else {
          dAngle = Math.atan2(Math.sin(dAngle), Math.cos(dAngle));
        }
        this.prevBallAngle = curAngle;

        const angularVelocity = effectiveDt > 0.001 ? Math.abs(dAngle) / effectiveDt : 0; // rad/s
        const direction = dAngle >= 0 ? 1 : -1;

        const isHeavyRain = (this.activeDebuff[curThrower] === 'mua_nang_hat' || this.activeDebuff[curThrower] === 'phat_kep');
        let spinChargeGainMult = isHeavyRain ? 0.65 : 1.0; // Waterlogged quả còn charges slower
        if (this.skillUsedThisTurn[curThrower] === 'chiem_nhip') {
          spinChargeGainMult *= 1.5; // Chiếm Nhịp 1.5x wrist spin charging speed!
        }
        if (isLamCham) {
          // Làm Chậm: Xoay chậm rãi trong Bullet Time nhưng momentum tích tụ cực nhanh!
          spinChargeGainMult *= 2.4;
        }

        // Tích Điểm: Accumulate rotational kinetic energy
        if (this.skillUsedThisTurn[curThrower] === 'tich_diem') {
          this.accumulatedRotations = (this.accumulatedRotations || 0) + Math.abs(dAngle) / (Math.PI * 2);
        }

        // Bẫy Ngầm Debuff: Traps the player when swinging reaches > 0.40 spin charge, cutting power by 50%!
        if (this.activeDebuff[curThrower] === 'bay_ngam' && this.spinCharge > 0.40 && !this.trapTriggeredThisTurn) {
          this.trapTriggeredThisTurn = true;
          this.spinCharge *= 0.50;
          this.sound.playRimClack();
          this.particles.addDust(activeRig.shoulderX, GROUND_Y, 16);
          this.showAnnouncement('💥 BẪY NGẦM KÍCH HOẠT!', 'Bẫy giật khiến đà quay bị tụt 50%!');
          this.activeDebuff[curThrower] = null;
        }


        // KÍCH HOẠT HIỆU ỨNG GÂY NHIỄU: Chỉ khi người chơi đã thực sự xoay đà (continuousRotation >= PI / 3) mới lộ diện chiêu gây nhiễu!
        if (this.activeDebuff[curThrower] && !this.debuffVisualTriggered[curThrower] && this.continuousRotation >= Math.PI / 3) {
          this.debuffVisualTriggered[curThrower] = true;
          this.triggerSkillCardVisual(this.activeDebuff[curThrower], curThrower);
          if (this.activeDebuff[curThrower] === 'ao_anh' && !this.aoAnhPoles) {
            this.initAoAnhPoles();
          }
        }

        // QUY TẮC TÍCH LŨY LỰC XOAY (HUMAN LIMIT):
        // 1. Tốc độ cực hạn (angularVelocity >= 50 rad/s ~ dưới 0.1s/vòng, đỉnh điểm 100+ rad/s ~ dưới 0.01s/vòng) mới đạt mốc tối đa 5 điểm.
        // 2. Xoay bình thường / trung bình (angularVelocity < 12 rad/s): chỉ đạt 1 - 2 điểm, không tích lũy đủ lực.
        // 3. Khi dừng lại đột ngột (angularVelocity < 3.0 rad/s), toàn bộ lực tích lũy triệt tiêu hoàn toàn trong 0.1s!
        if (angularVelocity >= 12.0 && Math.abs(dAngle) > 0.04) {
          if (this.lastSpinDirection !== 0 && this.lastSpinDirection !== direction && Math.abs(dAngle) > 0.25) {
            this.continuousRotation = 0;
            this.spinCharge = Math.max(0, this.spinCharge - 0.45);
          }
          this.lastSpinDirection = direction;
          this.continuousRotation += Math.abs(dAngle);

          if (this.continuousRotation >= Math.PI) {
            const effectiveAngle = Math.abs(dAngle);
            // speedFactor: tốc độ càng vượt trội (hướng tới human limit 80 - 150 rad/s) thì mới sạc đầy lên 1.0 (5 điểm)
            const speedFactor = Math.max(0, (angularVelocity - 10.0) / 75.0);
            this.spinCharge = Math.min(1.0, this.spinCharge + effectiveAngle * 0.08 * speedFactor * spinChargeGainMult);
          }
          this.recentSpinCharge = Math.max(this.spinCharge, this.recentSpinCharge - effectiveDt * 1.5);
        } else if (angularVelocity < 3.0) {
          // DỪNG LẠI ĐỘT NGỘT: Triệt tiêu toàn bộ lực tích luỹ trong 0.1s (1.0 / 0.1s = 10.0 * dt)
          this.continuousRotation = 0;
          this.spinCharge = Math.max(0, this.spinCharge - effectiveDt * 10.0);
          this.recentSpinCharge = Math.max(0, this.recentSpinCharge - effectiveDt * 10.0);
        } else {
          // Xoay bình thường / chậm (3.0 <= angularVelocity < 12.0): Không thể tích lũy lực cao, chỉ duy trì tối thiểu 1 - 2 điểm
          this.continuousRotation = Math.max(0, this.continuousRotation - effectiveDt * 4.0);
          this.spinCharge = Math.max(0, this.spinCharge - effectiveDt * (isHeavyRain ? 3.0 : 2.0));
          this.recentSpinCharge = Math.max(this.spinCharge, this.recentSpinCharge - effectiveDt * 2.0);
        }

        this.whooshCooldown -= effectiveDt;
        if (this.spinCharge > 0.15 && this.whooshCooldown <= 0) {
          const pitch = (isLamCham ? 0.65 : 1.0) * (0.8 + this.spinCharge * 0.8);
          this.sound.playWhoosh(pitch);
          this.whooshCooldown = Math.max(0.18, 0.40 - this.spinCharge * 0.20);
        }

        this.quacon.update(effectiveDt, ballVel.vx, ballVel.vy);
      }
    }

    performDropAtFeet() {
      const ballPos = this.cord.getEndPosition();
      const startX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - ballPos.x) : ballPos.x;
      const startY = ballPos.y;
      const dropVx = (this.isMultiplayerMode && this.currentTurn === 2) ? -45 : 45;
      const dropVy = 85;

      this.projectile = {
        x: startX,
        y: startY,
        prevX: startX,
        prevY: startY,
        vx: dropVx,
        vy: dropVy,
        scored: false,
        hitPole: false,
        restTimer: 0
      };

      const topX = this.projectile.x + this.quacon.topAttachOffset.x;
      const topY = this.projectile.y + this.quacon.topAttachOffset.y;
      this.cord.initFlight(topX, topY, dropVx, dropVy);

      this.spinCharge = 0;
      this.recentSpinCharge = 0;
      this.continuousRotation = 0;
      this.totalRotations = 0;
      this.autoSpinTime = 0;
      this.totalThrows++;
      this.state = STATE.FLYING;
      this.sound.playGroundThud();
    }

    performThrow() {
      const currentThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      // Compute instantaneous position of the ball at release
      const ballPos = this.cord.getEndPosition();
      let vx, vy;
      let isDrop = false;

      const activeRig = (this.gameMode === 'versus')
        ? (this.currentTurn === 1 ? this.rigP1 : this.rigP2)
        : this.rig;

      if (this.controlMode === 'auto') {
        const omega = Math.min(15.5, 5.0 + this.autoSpinTime * 5.8);
        const lag = Math.min(0.35, 0.12 + (omega / 15.5) * 0.18);
        const ballAngle = this.autoSpinAngle - lag;

        // Instantaneous tangential launch direction of the whirling ball
        // Clockwise rotation: tangent is (-sin(a), cos(a))
        let dirX = -Math.sin(ballAngle);
        let dirY = Math.cos(ballAngle);

        const charge = Math.min(1.0, Math.max(0, this.spinCharge, this.recentSpinCharge));

        if (charge <= 0.08) {
          // Barely held: drops naturally at feet
          isDrop = true;
          vx = dirX * 120;
          vy = Math.max(dirY * 120, 50);
        } else {
          // Forward launch optimization:
          // Ưu tiên góc có tỉ lệ trúng cao hơn, luôn hướng về phía cột còn lễ hội
          dirX = Math.max(0.48, Math.min(0.80, Math.abs(dirX)));
          // Softly bias release angle towards sweet spot elevation (~50 deg, cos ~0.65)
          dirX = dirX * 0.50 + 0.65 * 0.50;
          dirY = -Math.sqrt(Math.max(0.1, 1.0 - dirX * dirX));

          const len = Math.hypot(dirX, dirY) || 1;
          dirX /= len;
          dirY /= len;

          // Speed scaled by accumulated spin energy:
          // Boosted forward base momentum so the con effortlessly carries to the festival pole
          const baseSpeed = 460 + charge * 670;
          const mappedSpeed = Math.min(1140, baseSpeed);

          vx = dirX * mappedSpeed;
          vy = dirY * mappedSpeed;
        }
      } else {
        // MODE 2: MANUAL WHIRL
        let ballVel = this.cord.getEndVelocity();
        vx = ballVel.vx;
        vy = ballVel.vy;
        let rawSpeed = Math.hypot(vx, vy);

        const isHandInFront = (activeRig.wristX >= activeRig.shoulderX - 10);
        const isIntentionalBackThrow = (this.mouseVelocity && this.mouseVelocity.x < -200) || (!isHandInFront && vx < -50);

        if (rawSpeed < 75 && Math.max(this.spinCharge, this.recentSpinCharge) < 0.05) {
          isDrop = true;
          vx = vx * 0.35;
          vy = Math.max(vy * 0.35, 30);
        } else {
          let dirX = vx / (rawSpeed || 1);
          let dirY = vy / (rawSpeed || 1);

          if (isIntentionalBackThrow) {
            dirX = -Math.abs(dirX);
          } else if (isHandInFront) {
            dirX = Math.max(0.45, Math.abs(dirX));
            // Softly bias towards sweet spot elevation (~50 deg, cos ~0.65)
            dirX = dirX * 0.50 + 0.65 * 0.50;
            if (dirY > -0.20) {
              dirY = -Math.sqrt(Math.max(0.1, 1.0 - dirX * dirX));
            }
          }

          const len = Math.hypot(dirX, dirY) || 1;
          dirX /= len;
          dirY /= len;

          const charge = Math.min(1.0, Math.max(0, this.spinCharge, this.recentSpinCharge));
          let mappedSpeed;

          if (charge <= 0.05) {
            mappedSpeed = Math.min(320, 80 + rawSpeed * 0.26);
          } else {
            const baseSpinSpeed = 430 + charge * 700;
            const flickBonus = Math.min(35, (rawSpeed / 800) * 35);
            mappedSpeed = Math.min(1140, baseSpinSpeed + flickBonus);
            if (this.skillUsedThisTurn[currentThrower] === 'lam_cham') {
              // Làm Chậm: Nhả tay thư thái nhưng quả còn vẫn phóng đi với momentum dũng mãnh
              mappedSpeed = Math.max(860, mappedSpeed);
            }
          }

          vx = dirX * mappedSpeed;
          vy = dirY * mappedSpeed;
        }
      }

      this.totalThrows++;
      if (this.isMultiplayerMode) {
        this.updateVersusUI();
      } else {
        this.updateStatsUI();
      }

      if (!isDrop) {
        // Trigger dynamic follow-through knee-flex / body spring bounce!
        activeRig.triggerThrowBounce();
        this.sound.playThrow();
      } else {
        this.sound.playGroundThud();
      }

      // SKILL EFFECT: Vật Lý Ấn Định (Tự động cân chỉnh lực và góc bay hoàn hảo qua tâm vòng!)
      if (this.skillUsedThisTurn[currentThrower] === 'vat_ly_an_do') {
        const startX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - ballPos.x) : ballPos.x;
        const startY = ballPos.y;
        const dx = RING_CENTER_X - startX;
        const dy = RING_CENTER_Y - startY;
        const T = 1.94;
        const perfectVx = dx / T;
        const perfectVy = (dy - 0.5 * GRAVITY * T * T) / T;

        if (this.isMultiplayerMode && this.currentTurn === 2) {
          vx = -perfectVx;
          vy = perfectVy;
        } else {
          vx = perfectVx;
          vy = perfectVy;
        }
        isDrop = false;
        this.sound.playScoreCelebration();
        this.particles.addConfetti(activeRig.shoulderX, activeRig.shoulderY - 30, 25);
        this.triggerSkillCardVisual('vat_ly_an_do', currentThrower);
      } else if (this.skillUsedThisTurn[currentThrower] === 'tam_nham' && !isDrop) {
        // Tâm Nhắm: Hỗ trợ nắn chỉnh góc bay về tâm vòng nếu đã vung đà hợp lý
        const startX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - ballPos.x) : ballPos.x;
        const targetPole = this.aoAnhPoles ? this.aoAnhPoles.find(p => p.isReal) : null;
        const targetX = targetPole ? targetPole.x : RING_CENTER_X;
        const targetY = targetPole ? targetPole.ringY : RING_CENTER_Y;
        const dx = targetX - startX;
        const dy = targetY - ballPos.y;
        const idealVx = dx / 1.94;
        const idealVy = (dy - 0.5 * GRAVITY * 1.94 * 1.94) / 1.94;
        vx = vx * 0.35 + (this.currentTurn === 2 ? -idealVx : idealVx) * 0.65;
        vy = vy * 0.35 + idealVy * 0.65;
        this.triggerSkillCardVisual('tam_nham', currentThrower);
      } else if (!isDrop && Math.abs(vx) > 180) {
        // CÂN CHỈNH VẬT LÝ NÉM CHUẨN XÁC:
        // Quỹ đạo tuân theo góc và lực vung thực tế của người chơi.
        // Ném quá cao, quá thấp hoặc quá yếu sẽ bay trượt tự nhiên; chỉ khi vung chuẩn góc và đủ lực mới ăn điểm.
        const isHumanThrow = (!this.isMultiplayerMode) || (this.gameMode === 'versus') || (this.currentTurn === 1);
        if (isHumanThrow) {
          const debuff = this.activeDebuff[currentThrower];
          if (debuff === 'mua_nang_hat') {
            // Mưa Nặng Hạt: Quả còn nặng trĩu. Nếu ném góc bay xa nhất (~42 - 52 độ) và lực vung mạnh thì vẫn có thể tới đích!
            const launchAngleDeg = Math.atan2(-vy, Math.abs(vx)) * (180 / Math.PI);
            if (launchAngleDeg < 38 || launchAngleDeg > 56) {
              // Ngoài góc lý tưởng, trọng lượng nước kéo quả còn chúc xuống nhanh hơn
              vy += 65;
            }
          }
          // Chế độ ném Dễ: Hỗ trợ nhẹ hướng bay nếu người chơi chọn chế độ Dễ
          if (this.throwDifficulty === 'easy') {
            const startX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - ballPos.x) : ballPos.x;
            const startY = ballPos.y;
            const targetPole = this.aoAnhPoles ? this.aoAnhPoles.find(p => p.isReal) : null;
            const poleX = targetPole ? targetPole.x : RING_CENTER_X;
            const poleY = targetPole ? targetPole.ringY : RING_CENTER_Y;
            const dx = (this.isMultiplayerMode && this.currentTurn === 2) ? (startX - poleX) : (poleX - startX);
            const dy = poleY - startY;
            const forwardSpeed = Math.abs(vx);
            if (forwardSpeed >= 420) {
              const T = dx / forwardSpeed;
              if (T >= 1.2 && T <= 2.8) {
                const idealVy = (dy - 0.5 * GRAVITY * T * T) / T;
                vy = vy * 0.40 + idealVy * 0.60;
              }
            }
          }
        }
      }

      // Record throw analytics for personalized Bot adaptation
      this.recordPlayerThrow(vx, vy, currentThrower);

      // Convert local coordinates & launch velocities to world space for Player 2
      if (this.isMultiplayerMode && this.currentTurn === 2) {
        const worldBallX = 2 * P2_ANCHOR_X - ballPos.x;
        const worldBallY = ballPos.y;
        const worldVx = -vx; // Launches leftwards toward the pole at 1476px!
        const worldVy = vy;

        this.projectile = {
          x: worldBallX,
          y: worldBallY,
          prevX: worldBallX,
          prevY: worldBallY,
          vx: worldVx,
          vy: worldVy,
          scored: false,
          hitPole: false,
          restTimer: 0
        };

        const topX = this.projectile.x + this.quacon.topAttachOffset.x;
        const topY = this.projectile.y + this.quacon.topAttachOffset.y;
        this.cord.initFlight(topX, topY, worldVx, worldVy);
      } else {
        this.projectile = {
          x: ballPos.x,
          y: ballPos.y,
          prevX: ballPos.x,
          prevY: ballPos.y,
          vx: vx,
          vy: vy,
          scored: false,
          hitPole: false,
          restTimer: 0
        };

        const topX = this.projectile.x + this.quacon.topAttachOffset.x;
        const topY = this.projectile.y + this.quacon.topAttachOffset.y;
        this.cord.initFlight(topX, topY, vx, vy);
      }

      // Lưu lại lực tích luỹ tại thời điểm phóng để tính điểm thưởng khi ném trúng!
      this.throwSpinCharge = Math.min(1.0, Math.max(0, this.spinCharge, this.recentSpinCharge));

      // Ảo Ảnh: Tạo 3 quả còn giống hệt nhau, cùng bay theo vật lý nhưng chỉ có 1 quả là thật!
      if (this.activeDebuff[currentThrower] === 'ao_anh') {
        const pReal = this.projectile;
        this.mirageProjectiles = [
          {
            x: pReal.x,
            y: pReal.y - 28,
            vx: pReal.vx * 1.03,
            vy: pReal.vy * 0.95,
            cord: new VerletCord()
          },
          {
            x: pReal.x,
            y: pReal.y + 28,
            vx: pReal.vx * 0.97,
            vy: pReal.vy * 1.05,
            cord: new VerletCord()
          }
        ];
        this.mirageProjectiles.forEach(mp => {
          const topX = mp.x + this.quacon.topAttachOffset.x;
          const topY = mp.y + this.quacon.topAttachOffset.y;
          mp.cord.initFlight(topX, topY, mp.vx, mp.vy);
        });
      } else {
        this.mirageProjectiles = null;
      }

      // Reset spin charge upon release
      this.spinCharge = 0;
      this.recentSpinCharge = 0;
      this.continuousRotation = 0;
      this.totalRotations = 0;
      this.autoSpinTime = 0;

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

      // Debuff aerodynamic forces and environmental anomalies
      let windAccX = 0;
      let effectiveGravity = GRAVITY;
      const currentThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      const debuff = this.activeDebuff[currentThrower];

      // Gió Mạnh & Phạt Kép: Heavy wind gust resistance / assistance (thuận hoặc nghịch, ngẫu nhiên đảo chiều)
      const isLamChamNegateWind = (this.skillUsedThisTurn[currentThrower] === 'lam_cham');
      if (!isLamChamNegateWind && (debuff === 'gio_manh' || debuff === 'phat_kep')) {
        const forwardSign = (this.isMultiplayerMode && this.currentTurn === 2) ? -1 : 1;
        const gust = 460 + Math.sin(performance.now() * 0.005) * 140;
        windAccX = forwardSign * (this.windDirectionMultiplier || 1) * gust;
      }

      // Mưa Nặng Hạt & Phạt Kép: Waterlogged drag & heavy downward weight (vẫn có thể ăn điểm nếu ném đúng góc 45° xa nhất)
      if (debuff === 'mua_nang_hat' || debuff === 'phat_kep') {
        effectiveGravity = GRAVITY * 1.15;
        p.vx *= (1.0 - dt * 0.005);
      }

      // Bẻ Cong: Spatial gravitational curvature bending projectile away from the ring
      if (debuff === 'be_cong') {
        const distToRing = Math.abs(p.x - RING_CENTER_X);
        if (distToRing < 500) {
          const bendDirY = (p.y < RING_CENTER_Y) ? -440 : 440;
          const bendDirX = (p.vx > 0) ? -260 : 260;
          p.vy += bendDirY * dt;
          p.vx += bendDirX * dt;
        }
      }

      // Trailing Stardust Sparkles when Vật Lý Ấn Định or Tâm Nhắm is active
      const activeSkill = this.skillUsedThisTurn[currentThrower];
      if (activeSkill === 'vat_ly_an_do') {
        if (Math.random() < 0.45) {
          this.particles.addConfetti(p.x, p.y, 2);
        }
      }

      p.vx += (-dragX + windAccX) * dt;
      p.vy += (effectiveGravity - dragY) * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Trợ lực ném Chế Độ Dễ: Hút từ tính vào vành khi bay gần cột
      if (this.throwDifficulty === 'easy' && !p.scored) {
        const targetPole = (this.aoAnhPoles && this.aoAnhPoles.length > 0)
          ? this.aoAnhPoles.find(pol => pol.isReal)
          : { x: RING_CENTER_X, ringY: RING_CENTER_Y };
        if (targetPole) {
          const distPoleX = targetPole.x - p.x;
          if (Math.abs(distPoleX) < 280 && Math.abs(distPoleX) > 8) {
            const dyToRing = targetPole.ringY - p.y;
            p.vy += dyToRing * dt * 4.5;
            const fwdSign = (this.isMultiplayerMode && this.currentTurn === 2) ? -1 : 1;
            if (p.vx * fwdSign > 80) {
              p.vx = p.vx * 0.96 + (fwdSign * 580) * 0.04;
            }
          }
        }
      }

      // Ảo Ảnh: Cập nhật vật lý cho 2 quả còn ảo bay cùng lúc
      if (this.mirageProjectiles) {
        this.mirageProjectiles.forEach(mp => {
          mp.vx += (-dragX + windAccX) * dt;
          mp.vy += (effectiveGravity - dragY) * dt;
          mp.x += mp.vx * dt;
          mp.y += mp.vy * dt;
          if (mp.y >= GROUND_Y - BALL_DIAMETER / 2) {
            mp.y = GROUND_Y - BALL_DIAMETER / 2;
            mp.vx *= 0.6;
            mp.vy = -mp.vy * 0.25;
          }
          const mTopX = mp.x + this.quacon.topAttachOffset.x;
          const mTopY = mp.y + this.quacon.topAttachOffset.y;
          mp.cord.updateFlight(mTopX, mTopY, mp.vx, mp.vy, dt);
        });
      }

      // Update quả còn streamers orientation and flutter
      this.quacon.update(dt, p.vx, p.vy);

      // Cord attaches to ball top cap and trails freely behind in the slipstream
      const topX = p.x + this.quacon.topAttachOffset.x;
      const topY = p.y + this.quacon.topAttachOffset.y;
      this.cord.updateFlight(topX, topY, p.vx, p.vy, dt);

      // Check collisions with ring and pole
      this.checkCollisions(p);

      // Ground collision
      if (p.y >= GROUND_Y - BALL_DIAMETER / 2) {
        p.y = GROUND_Y - BALL_DIAMETER / 2;

        // Downward impact handling
        if (p.vy > 0) {
          if (p.vy > 40) {
            this.sound.playGroundThud();
            this.particles.addDust(p.x, p.y + BALL_DIAMETER / 2, 10);
          }

          // Luật Ngược Đời: Ném chệch ra ngoài chạm đất gần cột được +1 điểm!
          if (this.inverseRulesActive && !p.scored) {
            if (Math.abs(p.x - POLE_ANCHOR_X) < 450) {
              p.scored = true;
              const curP = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
              if (curP === 'p1') this.p1Score += 1; else this.p2Score += 1;
              this.updateVersusUI();
              this.sound.playScoreCelebration();
              this.particles.addConfetti(p.x, p.y, 75);
              this.showAnnouncement('🙃 LUẬT NGƯỢC ĐỜI THÀNH CÔNG!', 'Ném ra ngoài gần cột: +1 ĐIỂM CHIẾN THẮNG!');
            }
            this.inverseRulesActive = false;
          }

          // Bouncing (damped)
          p.vy = -p.vy * 0.35;
          p.vx *= 0.65;
        }

        // Settle when kinetic energy or vertical speed is low to prevent infinite ground bouncing
        if (Math.abs(p.vy) < 45 || Math.hypot(p.vx, p.vy) < 60) {
          p.vx = 0;
          p.vy = 0;
          this.state = STATE.LANDED;
          p.restTimer = 0;
        }
      }

      // Out of bounds
      const maxBoundX = (this.isMultiplayerMode) ? WORLD_WIDTH_EXTEND + 150 : CANVAS_WIDTH + 150;
      if (p.x > maxBoundX || p.x < -150) {
        this.state = STATE.LANDED;
        p.restTimer = 0;
      }
    }

    checkCollisions(p) {
      if (p.scored) return;

      const curP = (this.currentTurn === 1) ? 'p1' : 'p2';
      const targetPoles = (this.aoAnhPoles && this.aoAnhPoles.length > 0)
        ? this.aoAnhPoles
        : [{ x: RING_CENTER_X, ringY: RING_CENTER_Y, scale: POLE_SCALE, isReal: true, dissolved: false }];

      for (let i = 0; i < targetPoles.length; i++) {
        const pole = targetPoles[i];
        if (pole.dissolved && !pole.isReal) continue;

        // Continuous line-segment crossing of the pole plane
        const crossingX = (p.prevX < pole.x && p.x >= pole.x) || 
                          (p.prevX > pole.x && p.x <= pole.x);
        if (!crossingX) continue;

        const dx = p.x - p.prevX;
        const t = dx !== 0 ? Math.max(0, Math.min(1, (pole.x - p.prevX) / dx)) : 0.5;
        const intersectY = p.prevY + t * (p.y - p.prevY);
        const dyHole = Math.abs(intersectY - pole.ringY);

        // A. INNER HOLE PASS-THROUGH
        const diff = this.throwDifficulty || 'medium';
        let toleranceMultiplier = 1.15;
        if (diff === 'easy') toleranceMultiplier = 1.85; // Dễ: Vành rộng trợ lực, gần như thả là trúng
        else if (diff === 'hard') toleranceMultiplier = 0.88; // Khó: Cực kỳ chính xác

        const hitMarginY = Math.round(RING_INNER_RY * (pole.scale / POLE_SCALE) * toleranceMultiplier);

        if (dyHole <= hitMarginY) {
          if (!pole.isReal) {
            // Trúng vòng ảo: Ảo ảnh tan biến!
            pole.dissolved = true;
            this.sound.playWhoosh(1.5);
            this.particles.addDust(pole.x, pole.ringY, 20);
            this.triggerSkillCardVisual('ao_anh', curP, 'ẢO ẢNH TAN BIẾN!');
            continue;
          }

          // TRÚNG VÒNG THẬT!
          p.scored = true;
          this.ringGlowTimer = 1.0;
          this.successfulThrows++;
          this.resolvePlayerThrow(true);

          // Tự nhiên hóa đường bay khi chui qua vòng: nắn nhẹ cao độ về tâm vòng
          p.y = pole.ringY + (intersectY - pole.ringY) * 0.35;

          // Luật Ngược Đời: Trúng vòng thì 0 điểm!
          if (this.inverseRulesActive) {
            this.showAnnouncement('🙃 LUẬT NGƯỢC ĐỜI!', 'Ném trúng vòng nhưng theo luật đảo ngược: 0 ĐIỂM!');
            this.sound.playRimClack();
            this.inverseRulesActive = false;
            return;
          }

          if (this.isMultiplayerMode) {
            const usedSkill = this.skillUsedThisTurn[curP];

            // Nếu người chơi dùng chiêu ĐỔI ĐIỂM (doi_diem) và ném trúng: Hoán đổi toàn bộ điểm số!
            if (usedSkill === 'doi_diem') {
              const temp = this.p1Score;
              this.p1Score = this.p2Score;
              this.p2Score = temp;
              this.updateVersusUI();
              this.sound.playScoreCelebration();
              this.particles.addConfetti(pole.x, pole.ringY, 120);
              this.showAnnouncement('🔄 HOÁN ĐỔI ĐIỂM SỐ!', `Ném trúng đích thành công! Điểm số đôi bên đã hoán đổi: P1: ${this.p1Score} - P2: ${this.p2Score}`);
              this.triggerSkillCardVisual('doi_diem', curP, 'HOÁN ĐỔI ĐIỂM SỐ!');
              return;
            }

            // Chế độ tích luỹ: tốc độ tay càng nhanh thì điểm càng cao (max là 5 điểm nếu tay quay đủ nhanh)
            let spinPts = 1;
            const charge = this.throwSpinCharge || 0;
            if (charge >= 0.90) spinPts = 5;       // Tốc độ tay cực nhanh: 5 điểm!
            else if (charge >= 0.70) spinPts = 4;  // Rất nhanh: 4 điểm
            else if (charge >= 0.45) spinPts = 3;  // Nhanh: 3 điểm
            else if (charge >= 0.22) spinPts = 2;  // Vừa: 2 điểm
            else spinPts = 1;                      // Bình thường: 1 điểm

            let pts = spinPts;
            if (usedSkill === 'tang_diem') pts = Math.max(pts, 2);
            else if (usedSkill === 'nhan_doi') pts = pts * 2;
            else if (usedSkill === 'cuoc_diem') {
              const wager = this.wagerPoints[curP] || 1;
              pts = wager * 2; // Thắng: nhận lại vốn + được số điểm đã cược!
              this.wagerPoints[curP] = 0;
              this.triggerSkillCardVisual('cuoc_diem', curP, `+${pts} ĐIỂM THẮNG CƯỢC!`);
            }
            else if (usedSkill === 'tich_diem' && (this.accumulatedRotations || 0) >= 2.0) pts += 1;

            if (this.activeChallenge && this.activeChallenge.target === curP) {
              pts = Math.max(pts, 2); // Vượt qua thách đấu thành công
              this.activeChallenge = null;
            }

            if (this.currentTurn === 1) {
              this.p1Score += pts;
            } else {
              this.p2Score += pts;
            }
            this.updateVersusUI();
            this.sound.playScoreCelebration();
            this.particles.addConfetti(pole.x, pole.ringY, 90);

            const pName = (this.currentTurn === 1) ? 'P1' : (this.gameMode === 'bot' ? 'Bot' : 'P2');
            this.showAnnouncement(`+${pts} ĐIỂM`, `${pName} • ${this.p1Score} - ${this.p2Score}`);
            return;
          }

          // Single player mode
          let singlePts = 100;
          const chargeSingle = this.throwSpinCharge || 0;
          if (chargeSingle >= 0.90) singlePts = 500;
          else if (chargeSingle >= 0.70) singlePts = 400;
          else if (chargeSingle >= 0.45) singlePts = 300;
          else if (chargeSingle >= 0.22) singlePts = 200;
          else singlePts = 100;

          if (this.skillUsedThisTurn.p1 === 'cuoc_diem') {
            const wager = this.wagerPoints.p1 || 1;
            singlePts = (wager * 2) * 100;
            this.wagerPoints.p1 = 0;
            this.triggerSkillCardVisual('cuoc_diem', 'p1', `+${singlePts} ĐIỂM THẮNG CƯỢC!`);
          }
          this.score += singlePts;
          this.streak++;
          this.updateStatsUI();

          this.sound.playScoreCelebration();
          this.particles.addConfetti(pole.x, pole.ringY, 80);

          // Traditional Festive Blessings
          const BLESSINGS = [
            'MƯA THUẬN GIÓ HÒA!',
            'MÙA MÀNG BỘI THU!',
            'ÂM DƯƠNG GIAO HÒA!',
            'BẢN LÀNG NO ẤM!',
            'KHAI MỞ CỔNG TRỜI!',
            'PHÚC LỘC ĐẦY NHÀ!',
            'DUYÊN THẮM ĐẦU XUÂN!'
          ];

          let msg = 'XUYÊN TÂM VÒNG CÒN!';
          if (this.streak === 1) msg = 'TÂN THỦ KHAI HỘI!';
          else if (this.streak === 2) msg = 'XUYÊN TÂM VÒNG CÒN!';
          else if (this.streak === 3) msg = 'TAY NÉM BẢN LÀNG!';
          else if (this.streak === 5) msg = 'KHAI MỞ CỔNG TRỜI!';
          else if (this.streak >= 8) msg = `CHUỖI ${this.streak} LẦN TRÚNG!`;

          const blessing = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
          this.showAnnouncement(msg, `+${singlePts} ĐIỂM • ${blessing}`);
          return;
        }

        // B. Cột ảo không cản trở vật lý: chỉ cột thật mới va đập vành và thân!
        if (!pole.isReal) continue;

        const bounceDir = Math.sign(p.prevX - pole.x) || (this.currentTurn === 2 ? 1 : -1);
        const rimOuterMargin = 68 * (pole.scale / POLE_SCALE);

        // B. RIM IMPACT (Đập vành tre)
        if (dyHole <= rimOuterMargin) {
          this.resolvePlayerThrow(false);
          this.sound.playRimClack();
          this.particles.addDust(pole.x, intersectY, 10);
          p.vx = Math.abs(p.vx) * 0.42 * bounceDir;
          p.vy = p.vy * 0.35 + (intersectY < pole.ringY ? -70 : 70);
          p.x = pole.x + bounceDir * 10;
          this.streak = 0;
          if (!this.isMultiplayerMode) this.updateStatsUI();
          return;
        }

        // C. BAMBOO POLE SHAFT IMPACT (Đập thân cột tre)
        if (intersectY > pole.ringY + rimOuterMargin && intersectY < GROUND_Y) {
          this.resolvePlayerThrow(false);
          this.sound.playRimClack();
          this.particles.addDust(pole.x, intersectY, 8);
          p.vx = Math.abs(p.vx) * 0.45 * bounceDir;
          p.x = pole.x + bounceDir * 14;
          this.streak = 0;
          if (!this.isMultiplayerMode) this.updateStatsUI();
          return;
        }
      }
    }

    updateLanded(dt) {
      this.projectile.restTimer += dt;
      if (this.projectile.restTimer > 1.1) {
        if (!this.projectile.scored) {
          this.resolvePlayerThrow(false);
        }

        if (this.isMultiplayerMode) {
          const curP = (this.currentTurn === 1) ? 'p1' : 'p2';
          const oppP = (this.currentTurn === 1) ? 'p2' : 'p1';

          // Cược điểm thất bại: điểm đã bị trừ vĩnh viễn, xóa số điểm cược
          if (!this.projectile.scored && this.wagerPoints[curP] > 0) {
            this.wagerPoints[curP] = 0;
          }

          // Check match victory first
          if (this.p1Score >= this.matchTargetScore) {
            this.triggerMatchVictory(1);
            return;
          }
          if (this.p2Score >= this.matchTargetScore) {
            this.triggerMatchVictory(2);
            return;
          }

          // Skill Ném Bù: If thrower missed, grant an immediate second chance!
          if (!this.projectile.scored && this.skillUsedThisTurn[curP] === 'nem_bu' && !this.nemBuUsed) {
            this.nemBuUsed = true;
            this.state = STATE.IDLE;
            this.resetTurnCord();
            const curName = (curP === 'p1') ? 'Người chơi 1' : (this.gameMode === 'bot' ? 'Bot AI' : 'Người chơi 2');
            this.showAnnouncement('🎯 NÉM BÙ CỨU NGUY!', `${curName} được ném thêm 1 lần do kích hoạt Ném Bù!`);
            this.sound.playScoreCelebration();
            this.updateSkillsUI();
            return;
          }
          this.nemBuUsed = false;

          // Skill Đặt Cược: If current thrower missed, opponent receives +1 point!
          if (!this.projectile.scored && this.skillUsedThisTurn[oppP] === 'dat_cuoc') {
            if (oppP === 'p1') this.p1Score += 1;
            else this.p2Score += 1;
            this.updateVersusUI();
            const oppName = (oppP === 'p1') ? 'P1 (Bạn)' : (this.gameMode === 'bot' ? 'Bot AI' : 'P2');
            this.showAnnouncement('🎲 ĐẶT CƯỢC THÀNH CÔNG!', `${oppName} nhận +1 điểm do đối phương ném trượt!`);
            this.sound.playScoreCelebration();

            if (this.p1Score >= this.matchTargetScore) {
              this.triggerMatchVictory(1);
              return;
            }
            if (this.p2Score >= this.matchTargetScore) {
              this.triggerMatchVictory(2);
              return;
            }
          }

          // Skill Thách Đấu: If challenged player missed, challenger receives +1 point!
          if (!this.projectile.scored && this.activeChallenge && this.activeChallenge.target === curP) {
            const ch = this.activeChallenge.challenger;
            if (!this.batKhuatActive[curP]) {
              if (ch === 'p1') this.p1Score += 1; else this.p2Score += 1;
              this.updateVersusUI();
              this.sound.playScoreCelebration();
              const chName = (ch === 'p1') ? 'P1' : (this.gameMode === 'bot' ? 'Bot AI' : 'P2');
              this.showAnnouncement('⚔️ THUA THÁCH ĐẤU!', `${chName} nhận +1 điểm do đối phương ném trượt!`);
            } else {
              this.showAnnouncement('🦁 BẤT KHUẤT!', 'Bảo vệ điểm số, không bị phạt bởi thách đấu!');
            }
            this.activeChallenge = null;
            if (this.p1Score >= this.matchTargetScore) { this.triggerMatchVictory(1); return; }
            if (this.p2Score >= this.matchTargetScore) { this.triggerMatchVictory(2); return; }
          }

          // Skill Cướp Cơ Hội: Nếu đối thủ ném hụt, người dùng chiêu giành quyền ném 2 lượt liên tiếp!
          if (this.opportunityStealActive[oppP]) {
            if (!this.projectile.scored) {
              this.opportunityStealActive[oppP] = false;
              this.extraThrowPending = oppP;
              this.triggerSkillCardVisual('cuop_co_hoi', oppP, '2 LƯỢT NÉM LIÊN TIẾP!');
              const oppName = (oppP === 'p1') ? 'P1' : (this.gameMode === 'bot' ? 'Bot AI' : 'P2');
              this.showAnnouncement('⚡ CƯỚP CƠ HỘI THÀNH CÔNG!', `Đối phương ném hụt! ${oppName} giành quyền ném 2 lượt liên tiếp!`);
              this.sound.playScoreCelebration();
            } else {
              this.opportunityStealActive[oppP] = false;
            }
          }

          // Switch turn and pan camera to the other player
          this.switchTurn();
          return;
        }

        // Single player mode: refill used slot with fresh card
        if (this.activeSkillSlot.p1 !== null) {
          this.replaceUsedSkill('p1');
        }
        this.skillUsedThisTurn.p1 = null;
        this.updateSkillsUI();

        if (!this.projectile.scored && this.streak > 0) {
          this.streak = 0;
          this.updateStatsUI();
        }
        this.state = STATE.IDLE;
        this.cord.reset(this.rig.handGripX, this.rig.handGripY);
      }
    }

    // ==========================================
    // GAME MODES & MULTIPLAYER FLOW
    // ==========================================
    setGameMode(mode) {
      this.isWagerModalOpen = false;
      const wagerModal = document.getElementById('wager-modal');
      if (wagerModal) wagerModal.classList.add('hidden');
      this.opportunityStealActive = { p1: false, p2: false };
      this.extraThrowPending = null;
      this.extraThrowThisTurn = false;
      this.extraThrowReason = null;

      if (mode === 'bot') {
        this.gameMode = 'bot';
        this.p1Score = 0;
        this.p2Score = 0;
        const firstTurn = Math.random() < 0.5 ? 1 : 2;
        this.currentTurn = firstTurn;
        this.cameraX = (firstTurn === 1) ? 0 : MAX_CAMERA_X;
        this.cameraTargetX = this.cameraX;
        this.isCameraPanning = false;

        if (this.ui.singleHudGroup) this.ui.singleHudGroup.style.display = 'none';
        if (this.ui.versusHudGroup) this.ui.versusHudGroup.style.display = 'flex';

        if (this.ui.btnBot) this.ui.btnBot.classList.add('active');
        if (this.ui.btnVersus) this.ui.btnVersus.classList.remove('active');
        if (this.ui.modeLabel) this.ui.modeLabel.textContent = 'Đấu Bot';

        const p2Name = document.querySelector('.p2-hud-card .p-name');
        const p2Avatar = document.querySelector('.p2-hud-card .p-avatar');
        if (p2Name) p2Name.textContent = 'MÁY (BOT AI - THÍCH ỨNG)';
        if (p2Avatar) p2Avatar.textContent = '🤖';
        if (this.ui.p2TrayTitle) this.ui.p2TrayTitle.textContent = 'BOT';

        this.resetSkills();
        if (this.ui.p1SkillsTray) this.ui.p1SkillsTray.style.display = 'flex';
        if (this.ui.p2SkillsTray) this.ui.p2SkillsTray.style.display = 'flex';

        this.updateVersusUI();
        this.updateThrowDifficultyUI();
        this.state = STATE.IDLE;
        const activeRig = (firstTurn === 1) ? this.rigP1 : this.rigP2;
        if (activeRig) {
          this.cord.reset(activeRig.handGripX, activeRig.handGripY);
        }

        if (firstTurn === 1) {
          this.showAnnouncement('CHẾ ĐỘ ĐẤU VỚI MÁY (BOT AI)!', 'Đua 10 điểm • Bạn được quyền ném trước!');
        } else {
          this.showAnnouncement('CHẾ ĐỘ ĐẤU VỚI MÁY (BOT AI)!', 'Đua 10 điểm • Máy (Bot AI) được quyền ném trước!');
          this.botState = 'thinking';
          this.botTimer = 0;
        }
      } else if (mode === 'versus') {
        this.gameMode = 'versus';
        this.p1Score = 0;
        this.p2Score = 0;
        const firstTurn = Math.random() < 0.5 ? 1 : 2;
        this.currentTurn = firstTurn;
        this.cameraX = (firstTurn === 1) ? 0 : MAX_CAMERA_X;
        this.cameraTargetX = this.cameraX;
        this.isCameraPanning = false;

        if (this.ui.singleHudGroup) this.ui.singleHudGroup.style.display = 'none';
        if (this.ui.versusHudGroup) this.ui.versusHudGroup.style.display = 'flex';

        if (this.ui.btnVersus) this.ui.btnVersus.classList.add('active');
        if (this.ui.btnBot) this.ui.btnBot.classList.remove('active');
        if (this.ui.modeLabel) this.ui.modeLabel.textContent = 'Đấu 2 Người';

        const p2Name = document.querySelector('.p2-hud-card .p-name');
        const p2Avatar = document.querySelector('.p2-hud-card .p-avatar');
        if (p2Name) p2Name.textContent = 'NGƯỜI CHƠI 2 (NỮ)';
        if (p2Avatar) p2Avatar.textContent = '👧';
        if (this.ui.p2TrayTitle) this.ui.p2TrayTitle.textContent = 'P2';

        this.resetSkills();
        if (this.ui.p1SkillsTray) this.ui.p1SkillsTray.style.display = 'flex';
        if (this.ui.p2SkillsTray) this.ui.p2SkillsTray.style.display = 'flex';

        this.updateVersusUI();
        this.state = STATE.IDLE;
        const activeRig = (firstTurn === 1) ? this.rigP1 : this.rigP2;
        if (activeRig) {
          this.cord.reset(activeRig.handGripX, activeRig.handGripY);
        }
        const firstPlayerName = (firstTurn === 1) ? 'Người Chơi 1 (Nam)' : 'Người Chơi 2 (Nữ)';
        this.showAnnouncement('CHẾ ĐỘ ĐẤU 2 NGƯỜI!', `Đua 10 điểm • ${firstPlayerName} được quyền ném trước!`);
      } else {
        this.gameMode = 'single';
        this.cameraX = 0;
        this.cameraTargetX = 0;
        this.isCameraPanning = false;

        if (this.ui.singleHudGroup) this.ui.singleHudGroup.style.display = 'flex';
        if (this.ui.versusHudGroup) this.ui.versusHudGroup.style.display = 'none';

        if (this.ui.btnBot) this.ui.btnBot.classList.remove('active');
        if (this.ui.btnVersus) this.ui.btnVersus.classList.remove('active');
        if (this.ui.modeLabel) this.ui.modeLabel.textContent = 'Chơi Đơn';

        this.resetSkills();
        if (this.ui.p1SkillsTray) this.ui.p1SkillsTray.style.display = 'flex';
        if (this.ui.p2SkillsTray) this.ui.p2SkillsTray.style.display = 'none';

        this.updateStatsUI();
        this.state = STATE.IDLE;
        if (this.rig) {
          this.cord.reset(this.rig.handGripX, this.rig.handGripY);
        }
        this.showAnnouncement('CHẾ ĐỘ CHƠI ĐƠN!', 'Luyện tập ném còn & thử nghiệm kỹ năng');
      }

      this.updateModeCardsActive();
      this.updateSkillsUI();
    }

    updateModeCardsActive() {
      if (this.ui.cardModeBot) this.ui.cardModeBot.classList.toggle('active', this.gameMode === 'bot');
      if (this.ui.cardModeVersus) this.ui.cardModeVersus.classList.toggle('active', this.gameMode === 'versus');
      if (this.ui.cardModeSingle) this.ui.cardModeSingle.classList.toggle('active', this.gameMode === 'single');

      if (this.ui.btnBot) this.ui.btnBot.classList.toggle('active', this.gameMode === 'bot');
      if (this.ui.btnVersus) this.ui.btnVersus.classList.toggle('active', this.gameMode === 'versus');
      if (this.ui.btnModeSingle) this.ui.btnModeSingle.classList.toggle('active', this.gameMode === 'single');
    }

    setThrowDifficulty(diff) {
      if (!['easy', 'medium', 'hard'].includes(diff)) diff = 'medium';
      this.throwDifficulty = diff;
      try { localStorage.setItem('nemcon_throw_difficulty', diff); } catch (e) {}

      this.updateThrowDifficultyUI();

      const titles = {
        easy: '🎯 ĐỘ KHÓ NÉM: DỄ (TRỢ LỰC)',
        medium: '🎯 ĐỘ KHÓ NÉM: VỪA (CHUẨN)',
        hard: '🎯 ĐỘ KHÓ NÉM: KHÓ (CHÍNH XÁC)'
      };
      const descs = {
        easy: 'Trợ lực từ tính & vành rộng, gần như cứ vung về phía cột là trúng!',
        medium: 'Chuẩn vật lý thực tế, cảm giác tay tự nhiên!',
        hard: 'Vành khắt khe, đòi hỏi căn góc và lực cực kỳ điêu luyện!'
      };

      this.showAnnouncement(titles[diff], descs[diff]);
      this.sound.playWhoosh(1.2);
    }

    setBotDifficulty(diff) {
      this.setThrowDifficulty(diff);
    }

    cycleThrowDifficulty() {
      const order = ['easy', 'medium', 'hard'];
      const nextIdx = (order.indexOf(this.throwDifficulty) + 1) % order.length;
      this.setThrowDifficulty(order[nextIdx]);
    }

    cycleBotDifficulty() {
      this.cycleThrowDifficulty();
    }

    updateThrowDifficultyUI() {
      const diff = this.throwDifficulty || 'medium';

      // 1. Update Modal Buttons & Menu Pills
      const modalBtns = document.querySelectorAll('.bot-diff-selector .btn-diff');
      modalBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-diff') === diff);
      });

      const diffPills = document.querySelectorAll('.diff-pill');
      diffPills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-diff') === diff);
      });

      // 2. Update Top HUD Button Label & Style
      if (this.ui.btnBotDiff) {
        this.ui.btnBotDiff.className = `btn-tool btn-bot-diff diff-${diff}`;
      }
      if (this.ui.botDiffLabel) {
        const labels = {
          easy: 'Ném: Dễ',
          medium: 'Ném: Vừa',
          hard: 'Ném: Khó'
        };
        this.ui.botDiffLabel.textContent = labels[diff] || 'Ném: Vừa';
      }

      // 3. Update P2 HUD Card Name in Bot mode
      if (this.gameMode === 'bot') {
        const p2Name = document.querySelector('.p2-hud-card .p-name');
        if (p2Name) {
          p2Name.textContent = 'MÁY (BOT AI - THÍCH ỨNG)';
        }
      }
    }

    updateBotDifficultyUI() {
      this.updateThrowDifficultyUI();
    }

    // ==========================================
    // 3-SLOT SKILLS SYSTEM (41 DÂN TỘC & LỄ HỘI SKILLS)
    // Weighted RNG: Common ~74%, Rare ~21%, Epic Chí Mạng ~4.5%
    // Slot replacement upon card usage
    // ==========================================
    drawWeightedSkill(excludeKeys = []) {
      const allKeys = Object.keys(SKILLS_CATALOG);
      const pool = allKeys.filter(k => !excludeKeys.includes(k));
      if (pool.length === 0) return allKeys[0];
      const totalWeight = pool.reduce((sum, k) => sum + (SKILLS_CATALOG[k].weight || 10), 0);
      let r = Math.random() * totalWeight;
      for (const k of pool) {
        const w = SKILLS_CATALOG[k].weight || 10;
        if (r <= w) return k;
        r -= w;
      }
      return pool[pool.length - 1];
    }

    pickRandomSkills(count = 3) {
      const slots = [];
      const pickedKeys = [];
      for (let i = 0; i < count; i++) {
        const key = this.drawWeightedSkill(pickedKeys);
        pickedKeys.push(key);
        slots.push({ slotIdx: i, skillKey: key, used: false, justRefilled: false });
      }
      return slots;
    }

    isOpponentHand(player) {
      if (this.gameMode === 'bot') {
        return player === 'p2';
      }
      if (this.gameMode === 'versus') {
        const activeViewer = (this.currentTurn === 1) ? 'p1' : 'p2';
        return player !== activeViewer;
      }
      return false;
    }

    createSlotButton(player, slotIdx, slot) {
      const def = SKILLS_CATALOG[slot.skillKey];
      if (!def) return null;

      const isHidden = this.isOpponentHand(player);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `skill-card-btn ${isHidden ? 'card-hidden tier-hidden' : 'tier-' + (def.tier || 'common')} ${slot.justRefilled ? 'card-refill-anim' : ''}`;
      btn.setAttribute('data-player', player);
      btn.setAttribute('data-slot', slotIdx);
      btn.setAttribute('data-skill', isHidden ? 'hidden' : slot.skillKey);
      btn.setAttribute('aria-label', isHidden ? 'Kỹ năng bí mật của đối thủ' : `${def.name} - ${def.typeLabel}`);

      if (isHidden) {
        btn.innerHTML = `
          <div class="skill-img-wrap card-back-wrap">
            <div class="card-back-pattern">
              <span class="card-back-emblem">◈</span>
              <span class="card-back-label">BÍ ẨN</span>
            </div>
          </div>
          <span class="skill-badge-dot mystery"></span>
          <div class="skill-used-overlay">✕</div>
          <div class="skill-tooltip" role="tooltip">
            <div class="tooltip-header">
              <span class="tooltip-title">Kỹ Năng Bí Ẩn 🔮</span>
              <div class="tooltip-tags-group">
                <span class="tooltip-type-tag tag-hidden">Mặt Úp</span>
              </div>
            </div>
            <p class="tooltip-desc">Kỹ năng của đối thủ được giấu kín. Bạn sẽ không biết đối phương dùng chiêu gì cho đến khi hiệu ứng bí mật tác động!</p>
            <div class="tooltip-footer">
              <span class="tooltip-hint">Chiến thuật bí mật vùng cao</span>
            </div>
          </div>
        `;
      } else {
        btn.innerHTML = `
          <div class="skill-img-wrap">
            <img src="assets/Skill/cards/${def.img}" alt="${def.name}" class="skill-img" loading="lazy" />
          </div>
          <span class="skill-badge-dot ${def.type}"></span>
          <div class="skill-used-overlay">✕</div>
          <div class="skill-tooltip" role="tooltip">
            <div class="tooltip-header">
              <span class="tooltip-title">${def.name}</span>
              <div class="tooltip-tags-group">
                <span class="tooltip-tier-tag tier-tag-${def.tier || 'common'}">${def.tierLabel || 'Cơ bản'}</span>
                <span class="tooltip-type-tag tag-${def.type}">${def.typeLabel}</span>
              </div>
            </div>
            <p class="tooltip-desc">${def.desc}</p>
            <div class="tooltip-footer">
              <span class="tooltip-hint">${def.hint}</span>
            </div>
          </div>
        `;
      }

      // Click & Touch to activate skill directly
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      btn.addEventListener('mousedown', (e) => e.stopPropagation());
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameMode === 'bot' && player === 'p2') return;
        this.activateSkill(player, slotIdx);
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.gameMode === 'bot' && player === 'p2') return;
        this.activateSkill(player, slotIdx);
      });

      // Hover & Mobile Touch-Hold Tooltip Support
      btn.addEventListener('mouseenter', () => btn.classList.add('show-tooltip'));
      btn.addEventListener('mouseleave', () => btn.classList.remove('show-tooltip'));
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        const wasShown = btn.classList.contains('show-tooltip');
        document.querySelectorAll('.skill-card-btn.show-tooltip').forEach(b => b.classList.remove('show-tooltip'));
        if (!wasShown) btn.classList.add('show-tooltip');
      }, { passive: true });

      return btn;
    }

    renderSkillTrays() {
      ['p1', 'p2'].forEach(player => {
        const container = document.getElementById(`${player}-skills-slots`);
        if (!container) return;
        container.innerHTML = '';

        const playerSlots = this.skills[player] || [];
        playerSlots.forEach((slot, slotIdx) => {
          const btn = this.createSlotButton(player, slotIdx, slot);
          if (btn) container.appendChild(btn);
        });
      });
    }

    renderSkillSlot(player, slotIdx) {
      const container = document.getElementById(`${player}-skills-slots`);
      if (!container) return;
      const existingBtn = container.querySelector(`.skill-card-btn[data-slot="${slotIdx}"]`);
      const slot = this.skills[player] && this.skills[player][slotIdx];
      if (!slot) return;

      const newBtn = this.createSlotButton(player, slotIdx, slot);
      if (!newBtn) return;

      if (existingBtn) {
        container.replaceChild(newBtn, existingBtn);
      } else {
        container.appendChild(newBtn);
      }

      // Remove refill animation flag after animation completes
      setTimeout(() => {
        if (slot) slot.justRefilled = false;
        newBtn.classList.remove('card-refill-anim');
      }, 550);
    }

    replaceSlotSkill(player, slotIdx) {
      if (slotIdx === null || slotIdx === undefined) return;
      const playerSlots = this.skills[player];
      if (!playerSlots || !playerSlots[slotIdx]) return;

      // Avoid duplicates with the remaining cards in hand
      const heldKeys = playerSlots
        .map((s, idx) => (idx !== slotIdx && s ? s.skillKey : null))
        .filter(Boolean);

      const newKey = this.drawWeightedSkill(heldKeys);
      playerSlots[slotIdx] = {
        slotIdx: slotIdx,
        skillKey: newKey,
        used: false,
        justRefilled: true
      };
      if (this.activeSkillSlot[player] === slotIdx) {
        this.activeSkillSlot[player] = null;
      }

      this.renderSkillSlot(player, slotIdx);
      this.updateSkillsUI();
    }

    replaceUsedSkill(player) {
      const slotIdx = this.activeSkillSlot[player];
      if (slotIdx !== null && slotIdx !== undefined) {
        this.replaceSlotSkill(player, slotIdx);
      }
    }

    resetSkills() {
      this.skills = {
        p1: this.pickRandomSkills(3),
        p2: this.pickRandomSkills(3)
      };
      this.activeSkillSlot = { p1: null, p2: null };
      this.skillUsedThisTurn = { p1: null, p2: null };
      this.pendingDebuff = { p1: null, p2: null };
      this.activeDebuff = { p1: null, p2: null };
      this.debuffCaster = { p1: null, p2: null };
      this.debuffDetected = { p1: false, p2: false };
      this.shieldQueued = { p1: null, p2: null };
      this.shieldType = { p1: null, p2: null };
      this.shieldActive = { p1: false, p2: false };
      this.shieldDuration = { p1: 0, p2: 0 };
      this.batKhuatActive = { p1: false, p2: false };
      this.reverseTrapActive = { p1: false, p2: false };
      this.extraThrowThisTurn = false;
      this.accumulatedRotations = 0;
      this.trapTriggeredThisTurn = false;
      this.activeChallenge = null;
      this.opportunityStealActive = { p1: false, p2: false };
      this.inverseRulesActive = false;
      this.debuffMultiplier = 1.0;

      this.renderSkillTrays();
      this.updateSkillsUI();
    }

    activateSkill(player, target) {
      let slotIdx = -1;
      if (typeof target === 'number') {
        slotIdx = target;
      } else if (typeof target === 'string') {
        slotIdx = (this.skills[player] || []).findIndex(s => s && s.skillKey === target && !s.used);
      }
      if (slotIdx < 0 || !this.skills[player] || !this.skills[player][slotIdx]) return;
      const slot = this.skills[player][slotIdx];
      if (slot.used) {
        this.showAnnouncement('KỸ NĂNG ĐÃ DÙNG!', 'Kỹ năng này đã được dùng và sẽ được thay thế sau lượt.');
        return;
      }

      const isCurrentPlayerTurn = (this.isMultiplayerMode)
        ? ((player === 'p1' && this.currentTurn === 1) || (player === 'p2' && this.currentTurn === 2))
        : (player === 'p1');

      if (!isCurrentPlayerTurn) {
        this.showAnnouncement('CHƯA TỚI LƯỢT!', 'Bạn chỉ có thể kích hoạt kỹ năng trong lượt của mình.');
        return;
      }

      if (this.state !== STATE.IDLE && this.state !== STATE.SWINGING) {
        this.showAnnouncement('CHƯA THỂ DÙNG CHIÊU!', 'Chỉ có thể dùng chiêu khi chuẩn bị hoặc đang lấy đà ném.');
        return;
      }

      if (this.skillUsedThisTurn[player]) {
        this.showAnnouncement('MỖI LƯỢT DÙNG 1 SKILL!', 'Mỗi lượt ném chỉ được kích hoạt tối đa 1 kỹ năng.');
        return;
      }

      const skillKey = slot.skillKey;
      const def = SKILLS_CATALOG[skillKey];
      if (!def) return;

      // KỸ NĂNG CƯỢC ĐIỂM: Cho phép chọn số điểm cược, trừ điểm ngay lập tức!
      if (skillKey === 'cuoc_diem') {
        const curScore = (this.isMultiplayerMode)
          ? (player === 'p1' ? this.p1Score : this.p2Score)
          : Math.floor(this.score / 100);

        if (curScore < 1) {
          const container = (player === 'p1') ? this.ui.p1SkillsSlots : this.ui.p2SkillsSlots;
          if (container) {
            const btn = container.querySelector(`.skill-card-btn[data-slot="${slotIdx}"]`);
            if (btn) {
              btn.classList.add('card-defense-idle-shake');
              setTimeout(() => btn.classList.remove('card-defense-idle-shake'), 400);
            }
          }
          this.showAnnouncement('⚠️ CHƯA CÓ ĐIỂM CƯỢC!', 'Bạn cần ít nhất 1 điểm để sử dụng chiêu Cược Điểm!');
          return;
        }

        const isHuman = (player === 'p1') || (this.gameMode === 'versus' && player === 'p2');
        if (isHuman) {
          this.openWagerModal(player, slotIdx, curScore);
          return;
        } else {
          const wager = (curScore >= 3 && Math.random() < 0.45) ? 2 : 1;
          this.executeWager(player, slotIdx, wager);
          return;
        }
      }

      const opponent = (player === 'p1') ? 'p2' : 'p1';
      this.activeSkillSlot[player] = slotIdx;
      this.skillUsedThisTurn[player] = skillKey;

      const pName = (player === 'p1') ? 'Người chơi 1' : (this.gameMode === 'bot' ? 'Bot AI' : 'Người chơi 2');
      const targetName = (opponent === 'p1') ? 'Người chơi 1' : (this.gameMode === 'bot' ? 'Bot AI' : 'Người chơi 2');
      const rig = (player === 'p1') ? this.rigP1 : this.rigP2;

      // Fog of War: If opponent uses a skill, completely mysterious with ZERO hint
      const isSecretAction = this.isOpponentHand(player);

      const isDisturbed = !!(this.activeDebuff[player] || this.pendingDebuff[player]);
      const currentDebuff = this.activeDebuff[player] || this.pendingDebuff[player];

      // 1. NHÓM HỖ TRỢ (SUPPORT) - Kích hoạt ngay trong lượt
      if (def.type === 'support') {
        // Sử dụng chiêu thì mới biết đối phương đang dùng chiêu nào với mình -> Hiện thẻ hình ảnh debuff!
        if (isDisturbed) {
          this.debuffDetected[player] = true;
          this.triggerSkillCardVisual(currentDebuff, player);
        }

        // Kỹ năng Làm Chậm khắc chế gió bão
        if (skillKey === 'lam_cham') {
          if (currentDebuff === 'gio_manh') {
            this.activeDebuff[player] = null;
            this.pendingDebuff[player] = null;
          }
          this.triggerSkillCardVisual('lam_cham', player);
        } else if (skillKey === 'song_nem') {
          this.extraThrowThisTurn = true;
          this.triggerSkillCardVisual('song_nem', player);
        } else if (skillKey === 'doi_luot' || skillKey === 'doi_diem') {
          this.triggerSkillCardVisual('doi_diem', player);
          this.sound.playWhoosh(1.2);
        } else if (skillKey === 'chiem_nhip') {
          this.triggerSkillCardVisual('chiem_nhip', player);
        } else if (skillKey === 'tich_diem') {
          this.accumulatedRotations = 0;
          this.triggerSkillCardVisual('tich_diem', player);
        } else if (skillKey === 'cuop_co_hoi') {
          this.opportunityStealActive[player] = true;
          this.triggerSkillCardVisual('cuop_co_hoi', player);
        } else if (skillKey === 'luat_nguoc_doi') {
          this.inverseRulesActive = true;
          this.triggerSkillCardVisual('luat_nguoc_doi', player);
        } else if (skillKey === 'la_bai_bi_an') {
          const mysteryPool = Object.keys(SKILLS_CATALOG).filter(k => k !== 'la_bai_bi_an' && k !== 'doi_diem');
          const mysteryKey = mysteryPool[Math.floor(Math.random() * mysteryPool.length)];
          const mDef = SKILLS_CATALOG[mysteryKey];
          this.triggerSkillCardVisual(mysteryKey, player);
          this.sound.playScoreCelebration();
          this.skillUsedThisTurn[player] = mysteryKey;
          if (mDef.type === 'debuff') {
            this.pendingDebuff[opponent] = mysteryKey;
            this.debuffCaster[opponent] = player;
          } else if (mDef.type === 'shield') {
            this.shieldActive[player] = true;
            this.shieldType[player] = mysteryKey;
          }
        } else {
          this.triggerSkillCardVisual(skillKey, player);
        }
        this.sound.playScoreCelebration();
        if (rig) this.particles.addConfetti(rig.shoulderX, rig.shoulderY - 30, 25);
      }
      // 2. NHÓM PHÒNG THỦ / BẢO VỆ (SHIELD)
      // Phòng ngự CHỈ có thể dùng TRƯỚC khi đối phương gây nhiễu, nếu đã bị gây nhiễu thì không dùng được!
      else if (def.type === 'shield') {
        if (isDisturbed) {
          this.debuffDetected[player] = true;
          this.activeSkillSlot[player] = null;
          this.skillUsedThisTurn[player] = null;
          this.triggerSkillCardVisual(currentDebuff, player);
          const container = (player === 'p1') ? this.ui.p1SkillsSlots : this.ui.p2SkillsSlots;
          if (container) {
            const btn = container.querySelector(`.skill-card-btn[data-slot="${slotIdx}"]`);
            if (btn) {
              btn.classList.add('card-defense-idle-shake');
              setTimeout(() => btn.classList.remove('card-defense-idle-shake'), 400);
            }
          }
          return;
        }

        // Bấm dùng luôn được -> Lưu vào hàng đợi phòng thủ ngầm (chỉ kích hoạt khi đối phương gây nhiễu)
        this.shieldQueued[player] = skillKey;
        this.shieldType[player] = skillKey;
        this.shieldActive[player] = false;
        this.shieldFlashTimer[player] = 0; // Chưa hiện vòng bảo vệ ngay để giữ bí mật tuyệt đối
        if (skillKey === 'bao_toan') {
          this.shieldDuration[player] = 2;
        }

        this.sound.playWhoosh(1.2);
        this.updateSkillsUI();
        this.renderSkillTrays();
        return;
      }
      // 3. NHÓM PHÁ HOẠI / GÂY NHIỄU (DEBUFF)
      else if (def.type === 'debuff') {
        // Sử dụng chiêu thì mới biết đối phương đang dùng chiêu nào với mình
        if (isDisturbed) {
          this.debuffDetected[player] = true;
          this.triggerSkillCardVisual(currentDebuff, player);
        }

        // Kiểm tra đối phương có bật sẵn miễn nhiễm hay khiên đón đầu không:
        if (this.shieldDuration[opponent] > 0) {
          this.triggerSkillCardVisual('bao_toan', opponent);
          this.sound.playScoreCelebration();
          this.updateSkillsUI();
          return;
        }

        // Kiểm tra đối phương có gài sẵn chiêu phòng ngự (shieldQueued) không -> KÍCH HOẠT HÌNH ẢNH NGAY!
        if (this.shieldQueued[opponent] || this.shieldActive[opponent]) {
          const oppShield = this.shieldQueued[opponent] || this.shieldType[opponent] || 'khien_chan';
          this.shieldQueued[opponent] = null;
          this.shieldActive[opponent] = false;
          this.shieldFlashTimer[opponent] = 2.5; // Bung vòng hào quang bảo vệ toàn thân
          this.sound.playScoreCelebration();

          const oppRig = (opponent === 'p1') ? this.rigP1 : this.rigP2;
          if (oppRig) this.particles.addConfetti(oppRig.shoulderX, oppRig.shoulderY - 30, 25);

          if (oppShield === 'phan_chieu') {
            this.pendingDebuff[player] = skillKey;
            this.debuffCaster[player] = opponent;
            this.triggerSkillCardVisual('phan_chieu', opponent, 'PHẢN CHIẾU!');
          } else if (oppShield === 'hap_thu') {
            if (opponent === 'p1') this.p1Score += 1; else this.p2Score += 1;
            this.updateVersusUI();
            this.triggerSkillCardVisual('hap_thu', opponent, '+1 ĐIỂM!');
            if (this.p1Score >= this.matchTargetScore) { this.triggerMatchVictory(1); return; }
            if (this.p2Score >= this.matchTargetScore) { this.triggerMatchVictory(2); return; }
          } else if (oppShield === 'bay_nguoc') {
            this.pendingDebuff[player] = 'gio_manh';
            this.debuffCaster[player] = opponent;
            this.triggerSkillCardVisual('bay_nguoc', opponent, 'BẪY NGƯỢC!');
          } else if (oppShield === 'bao_toan') {
            this.shieldDuration[opponent] = 2;
            this.triggerSkillCardVisual('bao_toan', opponent);
          } else {
            this.triggerSkillCardVisual(oppShield, opponent);
          }
          this.updateSkillsUI();
          this.renderSkillTrays();
          return;
        }

        // Nếu đối phương không có khiên chủ động, gài chiêu vào pendingDebuff âm thầm (hoàn toàn mù bí mật)
        if (skillKey === 'hoan_doi') {
          this.replaceUsedSkill(player);
          const temp = this.skills.p1;
          this.skills.p1 = this.skills.p2;
          this.skills.p2 = temp;
          this.renderSkillTrays();
          this.sound.playScoreCelebration();
        } else if (skillKey === 'thach_dau') {
          this.activeChallenge = { challenger: player, target: opponent };
          this.pendingDebuff[opponent] = 'thach_dau';
          this.debuffCaster[opponent] = player;
          this.sound.playWhoosh(1.4);
        } else if (skillKey === 'bay_ngam') {
          this.pendingDebuff[opponent] = 'bay_ngam';
          this.debuffCaster[opponent] = player;
          this.trapTriggeredThisTurn = false;
          this.sound.playWhoosh(1.4);
        } else if (skillKey === 'cong_don') {
          this.debuffMultiplier = 2.0;
          this.pendingDebuff[opponent] = 'cong_don';
          this.debuffCaster[opponent] = player;
          this.sound.playWhoosh(1.4);
        } else if (skillKey === 'ap_luc_thoi_gian') {
          this.pendingDebuff[opponent] = 'ap_luc_thoi_gian';
          this.debuffCaster[opponent] = player;
          this.sound.playWhoosh(1.4);
        } else {
          this.pendingDebuff[opponent] = skillKey;
          this.debuffCaster[opponent] = player;
          this.sound.playWhoosh(1.4);
        }
      }

      this.updateSkillsUI();
    }

    updateSkillsUI() {
      const p1Turn = (this.isMultiplayerMode) ? (this.currentTurn === 1) : true;
      const p2Turn = (this.isMultiplayerMode) ? (this.currentTurn === 2) : false;

      // Update Tray Status Dots
      if (this.ui.p1TrayDot) {
        this.ui.p1TrayDot.classList.toggle('turn-active', p1Turn);
        this.ui.p1TrayDot.title = p1Turn ? 'Lượt ném của P1' : 'Chờ đối thủ ném';
      }
      if (this.ui.p2TrayDot) {
        this.ui.p2TrayDot.classList.toggle('turn-active', p2Turn);
        this.ui.p2TrayDot.title = p2Turn ? 'Lượt ném của P2/Bot' : 'Chờ đối thủ ném';
      }

      // Update P1 Cards
      const p1Slots = this.skills.p1 || [];
      p1Slots.forEach((slot, slotIdx) => {
        const btn = document.querySelector(`.skill-card-btn[data-player="p1"][data-slot="${slotIdx}"]`);
        if (!btn) return;
        const isActive = (this.activeSkillSlot.p1 === slotIdx);
        const isUsed = slot.used;
        btn.classList.toggle('used', isUsed && !isActive);
        btn.classList.toggle('active', isActive);
        btn.disabled = isUsed || !p1Turn || (this.activeSkillSlot.p1 !== null && !isActive);
      });

      // Update P2 Cards
      const p2Slots = this.skills.p2 || [];
      p2Slots.forEach((slot, slotIdx) => {
        const btn = document.querySelector(`.skill-card-btn[data-player="p2"][data-slot="${slotIdx}"]`);
        if (!btn) return;
        const isActive = (this.activeSkillSlot.p2 === slotIdx);
        const isUsed = slot.used;
        btn.classList.toggle('used', isUsed && !isActive);
        btn.classList.toggle('active', isActive);
        if (this.gameMode === 'bot') {
          btn.disabled = true; // Bot manages its own skills
        } else {
          btn.disabled = isUsed || !p2Turn || (this.activeSkillSlot.p2 !== null && !isActive);
        }
      });

      // Update Tray Status Badges (Tối giản hoàn toàn, không lộ bài đối thủ)
      if (this.ui.p1TrayStatus) {
        const isSecretP1 = this.isOpponentHand('p1');
        if (this.skillUsedThisTurn.p1 && !isSecretP1) {
          const sName = SKILLS_CATALOG[this.skillUsedThisTurn.p1]?.name || '';
          this.ui.p1TrayStatus.className = 'tray-status-badge active-support';
          this.ui.p1TrayStatus.textContent = '⚡ ' + sName;
        } else if (this.activeDebuff.p1 && this.debuffVisualTriggered.p1 && !isSecretP1) {
          const dName = SKILLS_CATALOG[this.activeDebuff.p1]?.name || '';
          this.ui.p1TrayStatus.className = 'tray-status-badge active-debuff';
          this.ui.p1TrayStatus.textContent = '⚠️ ' + dName;
        } else if (this.shieldActive.p1 && !isSecretP1) {
          this.ui.p1TrayStatus.className = 'tray-status-badge active-shield';
          this.ui.p1TrayStatus.textContent = '🛡️ Khiên';
        } else {
          this.ui.p1TrayStatus.className = 'tray-status-badge';
          this.ui.p1TrayStatus.textContent = '';
        }
      }

      if (this.ui.p2TrayStatus) {
        const isSecretP2 = this.isOpponentHand('p2');
        if (this.skillUsedThisTurn.p2 && !isSecretP2) {
          const sName = SKILLS_CATALOG[this.skillUsedThisTurn.p2]?.name || '';
          this.ui.p2TrayStatus.className = 'tray-status-badge active-support';
          this.ui.p2TrayStatus.textContent = '⚡ ' + sName;
        } else if (this.activeDebuff.p2 && this.debuffVisualTriggered.p2 && !isSecretP2) {
          const dName = SKILLS_CATALOG[this.activeDebuff.p2]?.name || '';
          this.ui.p2TrayStatus.className = 'tray-status-badge active-debuff';
          this.ui.p2TrayStatus.textContent = '⚠️ ' + dName;
        } else if (this.shieldActive.p2 && !isSecretP2) {
          this.ui.p2TrayStatus.className = 'tray-status-badge active-shield';
          this.ui.p2TrayStatus.textContent = '🛡️ Khiên';
        } else {
          this.ui.p2TrayStatus.className = 'tray-status-badge';
          this.ui.p2TrayStatus.textContent = '';
        }
      }
    }

    switchTurn() {
      // Close wager modal if open
      if (this.isWagerModalOpen) {
        const modal = document.getElementById('wager-modal');
        if (modal) modal.classList.add('hidden');
        this.isWagerModalOpen = false;
      }

      // 1. Refill the used card slot of the player who completed their turn!
      const completedPlayer = (this.currentTurn === 1) ? 'p1' : 'p2';
      if (this.activeSkillSlot[completedPlayer] !== null) {
        this.replaceUsedSkill(completedPlayer);
      }

      // Handle extra throw from Song Ném or Cướp Cơ Hội (Lượt 2)
      // Gây nhiễu chỉ gây nhiễu 1 lần: lượt 2 hoàn toàn sạch bóng debuff!
      if (this.extraThrowThisTurn) {
        this.extraThrowThisTurn = false;
        this.botState = null;
        this.botTimer = 0;
        this.botSkillEvaluated = false;
        this.skillUsedThisTurn.p1 = null;
        this.skillUsedThisTurn.p2 = null;
        const curP = (this.currentTurn === 1) ? 'p1' : 'p2';
        this.activeDebuff[curP] = null;
        this.aoAnhPoles = null;
        this.mirageProjectiles = null;
        this.state = STATE.IDLE;
        this.resetTurnCord();
        const pName = (this.currentTurn === 1) ? 'P1' : (this.gameMode === 'bot' ? 'Bot' : 'P2');
        this.showAnnouncement('LƯỢT 2/2', `${pName} ném tiếp`);
        this.extraThrowReason = null;
        this.updateSkillsUI();
        return;
      }

      // Check Shield Duration (Bảo Toàn)
      if (this.shieldDuration[completedPlayer] > 0) {
        this.shieldDuration[completedPlayer]--;
        if (this.shieldDuration[completedPlayer] <= 0) {
          this.shieldActive[completedPlayer] = false;
        }
      }

      this.currentTurn = (this.currentTurn === 1) ? 2 : 1;
      let currentP = (this.currentTurn === 1) ? 'p1' : 'p2';

      // Check if current incoming player was granted 2 consecutive throws via Cướp Cơ Hội
      if (this.extraThrowPending === currentP) {
        this.extraThrowPending = null;
        this.extraThrowThisTurn = true;
        this.extraThrowReason = 'cuop_co_hoi';
      }

      // Reset turn skill limiters
      this.skillUsedThisTurn.p1 = null;
      this.skillUsedThisTurn.p2 = null;

      // Handle Cướp Lượt (Opponent loses their turn - cleanly switch back synchronously)
      if (this.pendingDebuff[currentP] === 'cuop_luot') {
        this.pendingDebuff[currentP] = null;
        if (this.shieldQueued[currentP] || this.shieldActive[currentP]) {
          this.shieldQueued[currentP] = null;
          this.shieldActive[currentP] = false;
          this.shieldFlashTimer[currentP] = 2.5;
          this.showAnnouncement('🛡️ KHIÊN CHẮN ĐỠ ĐÒN!', 'Đã chặn đứng hoàn toàn chiêu Cướp Lượt!');
          this.sound.playScoreCelebration();
        } else {
          const skipName = (currentP === 'p1') ? 'P1' : (this.gameMode === 'bot' ? 'Bot AI' : 'P2');
          this.showAnnouncement('⛔ BỊ CƯỚP LƯỢT!', `${skipName} bị tước đoạt lượt ném! Đổi lượt ngay!`);
          this.sound.playWhoosh(1.6);
          // Directly transfer turn back to the other player without asynchronous setTimeout race condition
          this.currentTurn = (this.currentTurn === 1) ? 2 : 1;
          currentP = (this.currentTurn === 1) ? 'p1' : 'p2';
        }
      }

      // Reset input, bot state, and time pressure
      this.botState = null;
      this.botTimer = 0;
      this.botSkillEvaluated = false;
      this.isMouseDown = false;
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) wrapper.classList.remove('grabbing');

      this.debuffDetected = { p1: false, p2: false };
      this.debuffVisualTriggered = { p1: false, p2: false };

      // Handle pending debuff for incoming player quietly (hoàn toàn bí ẩn)
      if (this.pendingDebuff[currentP]) {
        const debuff = this.pendingDebuff[currentP];
        this.pendingDebuff[currentP] = null;
        if (this.shieldQueued[currentP] || this.shieldActive[currentP]) {
          this.shieldQueued[currentP] = null;
          this.shieldActive[currentP] = false;
          this.shieldFlashTimer[currentP] = 2.5;
          this.sound.playScoreCelebration();
          // Vòng bảo vệ bung ra chặn đứng chiêu gây nhiễu
        } else {
          this.activeDebuff[currentP] = debuff;
          if (debuff === 'ap_luc_thoi_gian') {
            this.timePressureTimer = 4.0; // Bắt đầu bấm giờ ngay từ lúc đổi lượt! (~3.5s thực tế sau khi camera pan)
          }
          if (debuff === 'ao_anh') {
            this.initAoAnhPoles();
          } else {
            this.aoAnhPoles = null;
          }
          // Hoàn toàn bí ẩn: Đối phương không hề biết mình bị gài chiêu countdown!
        }
      } else {
        this.activeDebuff[currentP] = null;
        this.aoAnhPoles = null;
      }

      this.renderSkillTrays();
      this.updateVersusUI();
      this.updateSkillsUI();

      this.cameraTargetX = (this.currentTurn === 1) ? 0 : MAX_CAMERA_X;
      this.isCameraPanning = true;
      this.state = STATE.IDLE;

      const nextName = (this.currentTurn === 1)
        ? 'NGƯỜI CHƠI 1 (NAM)'
        : (this.gameMode === 'bot' ? 'MÁY (BOT AI)' : 'NGƯỜI CHƠI 2 (NỮ)');
      this.showAnnouncement('ĐỔI LƯỢT NÉM!', `Đến lượt ${nextName}`);
      this.sound.playWhoosh(1.1);
    }

    resetTurnCord() {
      if (this.isMultiplayerMode) {
        const activeRig = (this.currentTurn === 1) ? this.rigP1 : this.rigP2;
        this.cord.reset(activeRig.handGripX, activeRig.handGripY);
      } else {
        this.cord.reset(this.rig.handGripX, this.rig.handGripY);
      }
    }

    updateVersusUI() {
      if (this.ui.p1ScoreDisplay) this.ui.p1ScoreDisplay.textContent = `${this.p1Score} / ${this.matchTargetScore}`;
      if (this.ui.p2ScoreDisplay) this.ui.p2ScoreDisplay.textContent = `${this.p2Score} / ${this.matchTargetScore}`;

      if (this.currentTurn === 1) {
        if (this.ui.p1HudCard) this.ui.p1HudCard.classList.add('active');
        if (this.ui.p2HudCard) this.ui.p2HudCard.classList.remove('active');
        if (this.ui.turnBadge) {
          this.ui.turnBadge.textContent = 'LƯỢT P1 (NAM)';
          this.ui.turnBadge.style.color = '#60a5fa';
        }
      } else {
        if (this.ui.p1HudCard) this.ui.p1HudCard.classList.remove('active');
        if (this.ui.p2HudCard) this.ui.p2HudCard.classList.add('active');
        if (this.ui.turnBadge) {
          this.ui.turnBadge.textContent = (this.gameMode === 'bot') ? 'LƯỢT BOT (AI)' : 'LƯỢT P2 (NỮ)';
          this.ui.turnBadge.style.color = (this.gameMode === 'bot') ? '#38bdf8' : '#f472b6';
        }
      }
    }

    triggerMatchVictory(winner) {
      const vP1 = document.getElementById('v-p1-score');
      const vP2 = document.getElementById('v-p2-score');
      const vTitle = document.getElementById('victory-title');
      const vSubtitle = document.getElementById('victory-subtitle');

      if (vP1) vP1.textContent = this.p1Score;
      if (vP2) vP2.textContent = this.p2Score;

      if (this.gameMode === 'bot') {
        if (winner === 1) {
          if (vTitle) vTitle.textContent = '👦 BẠN ĐÃ CHIẾN THẮNG BOT AI!';
          if (vSubtitle) vSubtitle.textContent = 'Xuất sắc ném trúng 10 điểm trước cỗ máy thông minh!';
        } else {
          if (vTitle) vTitle.textContent = '🤖 MÁY (BOT AI) CHIẾN THẮNG!';
          if (vSubtitle) vSubtitle.textContent = 'Bot AI đã đạt 10 điểm trước! Thử lại để phục thù nào!';
        }
      } else {
        if (winner === 1) {
          if (vTitle) vTitle.textContent = '👦 NGƯỜI CHƠI 1 CHIẾN THẮNG!';
          if (vSubtitle) vSubtitle.textContent = 'Chàng trai Mường đã xuất sắc bắn trúng 10 điểm trước!';
        } else {
          if (vTitle) vTitle.textContent = '👧 NGƯỜI CHƠI 2 CHIẾN THẮNG!';
          if (vSubtitle) vSubtitle.textContent = 'Cô gái Thái đã xuất sắc bắn trúng 10 điểm trước!';
        }
      }

      if (this.ui.modalVictory) {
        this.ui.modalVictory.classList.remove('hidden');
      }

      this.sound.playScoreCelebration();
      this.particles.addConfetti(CANVAS_WIDTH / 2 + this.cameraX, CANVAS_HEIGHT / 2, 160);
    }

    // ==========================================
    // ==========================================
    // BOT AI SIMULATION (EASY / MEDIUM / HARD DIFFICULTY MODES)
    // ==========================================
    startBotTurn() {
      this.botState = 'thinking';
      this.botTimer = 0;
      if (this.botDifficulty === 'hard') {
        this.botThinkingDuration = 0.25 + Math.random() * 0.15; // Snappy 0.25 - 0.40s
        this.botSwingDuration = 1.2 + Math.random() * 0.2;
      } else if (this.botDifficulty === 'easy') {
        this.botThinkingDuration = 0.70 + Math.random() * 0.30; // Relaxed 0.70 - 1.00s
        this.botSwingDuration = 1.6 + Math.random() * 0.3;
      } else {
        this.botThinkingDuration = 0.40 + Math.random() * 0.20; // Balanced 0.40 - 0.60s
        this.botSwingDuration = 1.4 + Math.random() * 0.2;
      }
      this.botSkillEvaluated = false;
      this.botAngle = Math.PI / 2;
      this.resetTurnCord();
    }

    updateBotAI(dt) {
      if (this.isWagerModalOpen || this.gameMode !== 'bot' || this.currentTurn !== 2 || this.isCameraPanning) return;

      if (!this.botState && this.state === STATE.IDLE) {
        this.startBotTurn();
        return;
      }

      if (this.botState === 'thinking') {
        this.botTimer += dt;
        if (!this.botSkillEvaluated && this.botTimer >= 0.12) {
          this.botSkillEvaluated = true;
          // Bot evaluates its 3 random skills:
          const p2Slots = this.skills.p2 || [];
          const availableSlots = p2Slots.map((s, idx) => ({ ...s, slotIdx: idx })).filter(s => !s.used);

          // Eagerness scales with difficulty: Easy ~55%, Medium ~85%, Hard ~96%
          let skillWillingness = (this.botDifficulty === 'hard') ? 0.96 : (this.botDifficulty === 'easy' ? 0.55 : 0.85);

          if (availableSlots.length > 0 && Math.random() < skillWillingness) {
            let chosenSlot = null;

            // Priority 1: High-accuracy / extra throw skills
            const highAccSlot = availableSlots.find(s =>
              ['vat_ly_an_do', 'tam_nham', 'lam_cham', 'song_nem', 'nem_bu'].includes(s.skillKey)
            );
            if (highAccSlot && Math.random() < (this.botDifficulty === 'hard' ? 0.95 : 0.85)) {
              chosenSlot = highAccSlot;
            }

            // Priority 2: Proactive shield defense (Chỉ dùng trước khi bị gây nhiễu)
            if (!chosenSlot && !this.activeDebuff.p2 && !this.pendingDebuff.p2 && !this.shieldActive.p2) {
              const shieldSlot = availableSlots.find(s => SKILLS_CATALOG[s.skillKey]?.type === 'shield');
              if (shieldSlot && Math.random() < (this.botDifficulty === 'hard' ? 0.70 : 0.45)) {
                chosenSlot = shieldSlot;
              }
            }

            // Priority 3: Debuff / sabotage Player 1
            if (!chosenSlot) {
              const debuffSlot = availableSlots.find(s => SKILLS_CATALOG[s.skillKey]?.type === 'debuff');
              if (debuffSlot && (!this.shieldActive.p1 || Math.random() < 0.40)) {
                chosenSlot = debuffSlot;
              }
            }

            // Priority 4: Score boost / tempo support skills
            if (!chosenSlot) {
              const supportSlot = availableSlots.find(s => SKILLS_CATALOG[s.skillKey]?.type === 'support');
              if (supportSlot && Math.random() < 0.80) {
                chosenSlot = supportSlot;
              }
            }

            // Fallback: Pick any remaining non-shield skill (defense skills NEVER activate here to prevent revealing skill to opponent!)
            if (!chosenSlot && availableSlots.length > 0 && Math.random() < 0.75) {
              const nonShieldSlots = availableSlots.filter(s => {
                if (SKILLS_CATALOG[s.skillKey]?.type === 'shield') return false;
                if (s.skillKey === 'cuoc_diem' && this.p2Score < 1) return false;
                return true;
              });
              if (nonShieldSlots.length > 0) {
                chosenSlot = nonShieldSlots[Math.floor(Math.random() * nonShieldSlots.length)];
              }
            }

            if (chosenSlot) {
              this.activateSkill('p2', chosenSlot.slotIdx);
            }
          }
        }

        if (this.botTimer >= this.botThinkingDuration) {
          this.botState = 'swinging';
          this.botTimer = 0;
          this.state = STATE.SWINGING;

          // Phát tác hình ảnh kỹ năng gây nhiễu khi Bot bắt đầu lấy đà ném
          if (this.activeDebuff.p2 && !this.debuffVisualTriggered.p2) {
            this.debuffVisualTriggered.p2 = true;
            this.triggerSkillCardVisual(this.activeDebuff.p2, 'p2');
            if (this.activeDebuff.p2 === 'ao_anh' && !this.aoAnhPoles) {
              this.initAoAnhPoles();
            }
          }
        }
      } else if (this.botState === 'swinging') {
        this.botTimer += dt;
        this.state = STATE.SWINGING;

        if (this.activeDebuff.p2 && !this.debuffVisualTriggered.p2) {
          this.debuffVisualTriggered.p2 = true;
          this.triggerSkillCardVisual(this.activeDebuff.p2, 'p2');
          if (this.activeDebuff.p2 === 'ao_anh' && !this.aoAnhPoles) {
            this.initAoAnhPoles();
          }
        }

        const omega = 8.8;
        this.botAngle += omega * dt;
        const swingRadius = 78;
        const targetHandX = this.rigP2.shoulderX + Math.cos(this.botAngle) * swingRadius;
        const targetHandY = this.rigP2.shoulderY + Math.sin(this.botAngle) * swingRadius;

        this.rigP2.update(dt, true, targetHandX, targetHandY);
        this.cord.update(this.rigP2.handGripX, this.rigP2.handGripY, dt, true);
        this.spinCharge = Math.min(1.0, this.botTimer / this.botSwingDuration);

        // Sound effect
        if (Math.sin(this.botAngle) > 0.95 && !this.botWhistleCooldown) {
          this.sound.playWhoosh(1.0 + this.spinCharge * 0.4);
          this.botWhistleCooldown = true;
          setTimeout(() => { this.botWhistleCooldown = false; }, 300);
        }

        if (this.botTimer >= this.botSwingDuration) {
          this.botPerformThrow();
          this.botState = null;
        }
      }
    }

    botPerformThrow() {
      const ballPos = this.cord.getEndPosition();
      const worldBallX = 2 * P2_ANCHOR_X - ballPos.x;
      const worldBallY = ballPos.y;

      const profile = this.playerProfile || { overallHitRate: 0.50, debuffStats: {}, angleStats: {} };
      const botDebuff = this.activeDebuff.p2 || 'none';
      const botUsed = this.skillUsedThisTurn.p2;

      // 1. CÁ NHÂN HÓA THEO TỈ LỆ NÉM CỦA NGƯỜI CHƠI (PLAYER PROFILE BASELINE)
      const playerOverall = (profile.totalThrows >= 3) ? profile.overallHitRate : 0.50;

      // 2. THEO TỈ LỆ NÉM TRÚNG KHI BỊ TỪNG LOẠI GÂY NHIỄU (DEBUFF ADAPTATION)
      let contextHitRate = playerOverall;
      if (botDebuff !== 'none') {
        const pDeb = profile.debuffStats && profile.debuffStats[botDebuff];
        if (pDeb && pDeb.throws >= 2) {
          contextHitRate = pDeb.hitRate;
        } else {
          contextHitRate = Math.max(0.06, playerOverall * 0.40);
        }
      } else {
        const pClean = profile.debuffStats && profile.debuffStats['none'];
        if (pClean && pClean.throws >= 2) {
          contextHitRate = pClean.hitRate;
        }
      }

      // 3. MÁY CHỈ CÓ 1 ĐỘ KHÓ DUY NHẤT: BÁM SÁT & THÍCH ỨNG THEO TRÌNH ĐỘ NGƯỜI CHƠI
      // Tự động đo xác xuất người chơi ném trúng trong từng điều kiện (sạch hoặc bị từng loại gây nhiễu)
      let hitChance = Math.min(0.92, Math.max(0.08, contextHitRate + (Math.random() * 0.06 - 0.03)));

      // 4. BUFF KỸ NĂNG HỖ TRỢ CỦA BOT:
      if (botUsed === 'vat_ly_an_do') {
        hitChance = 0.98;
      } else if (botUsed === 'tam_nham') {
        hitChance = Math.min(0.94, hitChance + 0.32);
      } else if (botUsed === 'lam_cham') {
        hitChance = Math.min(0.90, hitChance + 0.22);
      } else if (botUsed === 'tang_diem' || botUsed === 'nhan_doi' || botUsed === 'cuoc_diem') {
        hitChance = Math.min(0.92, hitChance + 0.16);
      } else if (botUsed && SKILLS_CATALOG[botUsed]?.type === 'support') {
        hitChance = Math.min(0.90, hitChance + 0.14);
      }

      // Kẹp trần khi bị debuff nếu không có khiên và không dùng vật lý ấn định
      if (botDebuff !== 'none' && !this.shieldActive.p2 && botUsed !== 'vat_ly_an_do') {
        hitChance = Math.min(contextHitRate, hitChance);
      }

      const willHit = (Math.random() < hitChance);

      // 5. CÁ NHÂN HÓA THEO GÓC NÉM (Mirroring player's angle distribution):
      const lowT = (profile.angleStats && profile.angleStats.low && profile.angleStats.low.throws) || 1;
      const sweetT = (profile.angleStats && profile.angleStats.sweet && profile.angleStats.sweet.throws) || 3;
      const highT = (profile.angleStats && profile.angleStats.high && profile.angleStats.high.throws) || 1;
      const totalAngles = lowT + sweetT + highT;
      const angleRoll = Math.random() * totalAngles;

      let chosenBucket = 'sweet';
      if (angleRoll < lowT) chosenBucket = 'low';
      else if (angleRoll > lowT + sweetT) chosenBucket = 'high';

      let T = 1.94;
      if (chosenBucket === 'low') {
        T = 1.68 + Math.random() * 0.14; // Góc thấp
      } else if (chosenBucket === 'high') {
        T = 2.14 + Math.random() * 0.16; // Góc cao
      } else {
        T = 1.88 + Math.random() * 0.12; // Góc chuẩn
      }

      // Target selection: If ao_anh is active, target real pole on hit, or illusion/miss on fail
      let targetX = RING_CENTER_X;
      let targetY = RING_CENTER_Y;

      if (this.aoAnhPoles && this.aoAnhPoles.length > 0) {
        const realPole = this.aoAnhPoles.find(p => p.isReal);
        const fakePoles = this.aoAnhPoles.filter(p => !p.isReal);

        if (willHit && realPole) {
          targetX = realPole.x;
          targetY = realPole.ringY;
        } else if (!willHit && fakePoles.length > 0 && Math.random() < 0.65) {
          // Bot bị lừa nhắm vào cột ảo!
          const chosenFake = fakePoles[Math.floor(Math.random() * fakePoles.length)];
          targetX = chosenFake.x;
          targetY = chosenFake.ringY;
        } else if (realPole) {
          targetX = realPole.x;
          targetY = realPole.ringY;
        }
      }

      const dx = targetX - worldBallX;
      const dy = targetY - worldBallY;

      let targetVx = dx / T;
      let targetVy = (dy - 0.5 * GRAVITY * T * T) / T;

      // 6. CHÂN THỰC HÓA ĐƯỜNG NÉM ("sao cho trông nó chân thực nhất có thể")
      if (willHit) {
        // Dao động vi mô tự nhiên ±5px
        targetVy += (Math.random() - 0.5) * 10;
        if (botUsed === 'vat_ly_an_do') {
          this.triggerSkillCardVisual('vat_ly_an_do', 'p2');
        }
      } else {
        const missType = Math.random();
        if (missType < 0.48) {
          // Va đập vành tre (Rim clack)
          const rimDir = Math.random() < 0.5 ? 1 : -1;
          targetVy += rimDir * (52 + Math.random() * 12);
          targetVx *= (1 + (Math.random() - 0.5) * 0.03);
        } else if (missType < 0.78 && botDebuff !== 'none') {
          // Chệch do tác động debuff
          if (botDebuff === 'gio_manh') {
            targetVx *= 0.94;
            targetVy += (Math.random() - 0.5) * 35;
          } else if (botDebuff === 'mua_nang_hat' || botDebuff === 'trong_luc_nang') {
            targetVy += 58 + Math.random() * 15;
          } else {
            targetVy += (Math.random() > 0.5 ? 56 : -56);
          }
        } else {
          // Non lực hoặc quá tay nhẹ
          if (Math.random() < 0.5) {
            targetVx *= 0.95;
            targetVy += 54 + Math.random() * 10;
          } else {
            targetVx *= 1.04;
            targetVy -= 54 + Math.random() * 10;
          }
        }
      }

      this.projectile = {
        x: worldBallX,
        y: worldBallY,
        prevX: worldBallX,
        prevY: worldBallY,
        vx: targetVx,
        vy: targetVy,
        scored: false,
        hitPole: false,
        restTimer: 0
      };

      const topX = this.projectile.x + this.quacon.topAttachOffset.x;
      const topY = this.projectile.y + this.quacon.topAttachOffset.y;
      this.cord.initFlight(topX, topY, targetVx, targetVy);

      this.throwSpinCharge = Math.min(1.0, this.spinCharge);

      // Ảo Ảnh: Tạo 3 quả còn giống hệt nhau khi bot ném
      if (this.activeDebuff.p2 === 'ao_anh') {
        const pReal = this.projectile;
        this.mirageProjectiles = [
          {
            x: pReal.x,
            y: pReal.y - 28,
            vx: pReal.vx * 1.03,
            vy: pReal.vy * 0.95,
            cord: new VerletCord()
          },
          {
            x: pReal.x,
            y: pReal.y + 28,
            vx: pReal.vx * 0.97,
            vy: pReal.vy * 1.05,
            cord: new VerletCord()
          }
        ];
        this.mirageProjectiles.forEach(mp => {
          const topX = mp.x + this.quacon.topAttachOffset.x;
          const topY = mp.y + this.quacon.topAttachOffset.y;
          mp.cord.initFlight(topX, topY, mp.vx, mp.vy);
        });
      } else {
        this.mirageProjectiles = null;
      }

      this.spinCharge = 0;
      this.totalThrows++;
      this.updateVersusUI();
      this.rigP2.triggerThrowBounce();
      this.state = STATE.FLYING;
      this.sound.playThrow();
    }

    drawCameraPanningOverlay() {
      const w = 580;
      const h = 76;
      const x = (CANVAS_WIDTH - w) / 2;
      const y = CANVAS_HEIGHT / 2 - 40;

      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      this.ctx.shadowBlur = 18;

      // Rounded banner background
      this.ctx.fillStyle = 'rgba(18, 10, 6, 0.88)';
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, w, h, 14);
      this.ctx.fill();

      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      let turnText = '👦 ĐANG CHUYỂN SANG LƯỢT: NGƯỜI CHƠI 1 (NAM)';
      if (this.currentTurn === 2) {
        turnText = (this.gameMode === 'bot')
          ? '🤖 ĐANG CHUYỂN SANG LƯỢT: MÁY (BOT AI)'
          : '👧 ĐANG CHUYỂN SANG LƯỢT: NGƯỜI CHƠI 2 (NỮ)';
      }

      this.ctx.font = 'bold 22px "Be Vietnam Pro", -apple-system, sans-serif';
      this.ctx.fillStyle = '#fef08a';
      this.ctx.fillText(turnText, CANVAS_WIDTH / 2, y + 28);

      this.ctx.font = '14px "Be Vietnam Pro", -apple-system, sans-serif';
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillText('Camera đang di chuyển đến vạch ném...', CANVAS_WIDTH / 2, y + 54);

      this.ctx.restore();
    }

    drawShieldAura(rig, isMirrored = false) {
      if (!rig || isNaN(rig.shoulderX) || isNaN(rig.shoulderY)) return;
      this.ctx.save();

      // Form-fitting personal protective cocoon: centered exactly on character spine & torso
      const bodyDipOffset = (rig && typeof rig.bodyDip === 'number') ? rig.bodyDip * 0.5 : 0;
      const localBodyCenterX = (rig.bodyDrawX !== undefined)
        ? (rig.bodyDrawX + (1024 * rig.sBody) * 0.5)
        : (rig.standingAnchorX + 8);
      const cx = isMirrored ? (2 * P2_ANCHOR_X - localBodyCenterX) : localBodyCenterX;
      const cy = GROUND_Y - 160 + bodyDipOffset; // Vertical midpoint between head apex (y~510) and ground (y~830)
      const baseRx = 105; // Width = 210px (wraps full character body ~150px with clean aura padding)
      const baseRy = 168; // Height = 336px (wraps character from above head ~502px down to ground at 838px)

      const now = performance.now();
      const pulse = 1.0 + Math.sin(now * 0.004) * 0.035;
      const curRx = baseRx * pulse;
      const curRy = baseRy * pulse;

      // 1. Ground Contact Energy Ring (Vòng tiếp đất hộ thể bám vững trên mặt cỏ)
      const groundY = GROUND_Y - 2;
      const groundRx = curRx * 0.90;
      const groundRy = 16 * pulse;
      const groundGrad = this.ctx.createRadialGradient(cx, groundY, 10, cx, groundY, groundRx);
      groundGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      groundGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.20)');
      groundGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      this.ctx.fillStyle = groundGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, groundY, groundRx, groundRy, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      this.ctx.lineWidth = 2.0;
      this.ctx.setLineDash([10, 6]);
      this.ctx.lineDashOffset = -now * 0.02;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // 2. Full-Body Radial Gradient Energy Shell (Bao bọc vừa vặn toàn bộ cơ thể)
      const grad = this.ctx.createRadialGradient(cx, cy, 20, cx, cy, curRy);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
      grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.18)');
      grad.addColorStop(0.85, 'rgba(245, 158, 11, 0.08)');
      grad.addColorStop(1, 'rgba(217, 119, 6, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, curRx, curRy, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // 3. Shimmering Dual Elliptical Boundary Lines
      // Outer border
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, curRx, curRy, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(254, 240, 138, 0.90)';
      this.ctx.lineWidth = 2.6;
      this.ctx.setLineDash([14, 8]);
      this.ctx.lineDashOffset = now * 0.03;
      this.ctx.stroke();

      // Inner border
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, Math.max(10, curRx - 10), Math.max(10, curRy - 10), 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.60)';
      this.ctx.lineWidth = 1.6;
      this.ctx.setLineDash([8, 8]);
      this.ctx.lineDashOffset = -now * 0.02;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // 4. Orbiting Sacred Diamond Runes (Hoa văn hộ mệnh Tây Bắc xung quanh vành khiên)
      const numRunes = 8;
      const runeAngleBase = now * 0.0012;
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#fef08a';

      for (let i = 0; i < numRunes; i++) {
        const ang = runeAngleBase + (i * (Math.PI * 2 / numRunes));
        const rx_pos = cx + Math.cos(ang) * (curRx - 5);
        const ry_pos = cy + Math.sin(ang) * (curRy - 5);
        this.ctx.fillText('◈', rx_pos, ry_pos);
      }

      // 5. Crown Protective Focus at Shield Apex (Không hiện chữ theo yêu cầu)
      const apexY = cy - curRy - 8;
      this.ctx.beginPath();
      this.ctx.arc(cx, apexY, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fef08a';
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      this.ctx.restore();
    }

    drawAimAssist() {
      const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      const activeRig = (this.isMultiplayerMode && this.currentTurn === 2) ? this.rigP2 : (this.isMultiplayerMode ? this.rigP1 : this.rig);
      const ballPos = this.cord.getEndPosition();
      if (!ballPos || isNaN(ballPos.x) || isNaN(ballPos.y) || !activeRig) return;

      // 1. Xác định vận tốc phóng thời gian thực nếu người chơi bấm THẢ NGAY TẠI THỜI ĐIỂM NÀY
      let vx = 0, vy = 0;
      const effectiveDt = (this.skillUsedThisTurn[curThrower] === 'lam_cham') ? (1/60 * 0.45) : (1/60);
      const ballVel = this.cord.getEndVelocity(effectiveDt);

      if (this.controlMode === 'auto') {
        const omega = Math.min(15.5, 5.0 + this.autoSpinTime * 5.8);
        const lag = Math.min(0.35, 0.12 + (omega / 15.5) * 0.18);
        const ballAngle = this.autoSpinAngle - lag;
        const effectiveR = this.cord.totalLength + 16;
        vx = -Math.sin(ballAngle) * omega * effectiveR;
        vy = Math.cos(ballAngle) * omega * effectiveR;
      } else {
        vx = ballVel.vx;
        vy = ballVel.vy;
      }

      const rawSpeed = Math.hypot(vx, vy);
      let isDrop = false;
      const isHandInFront = (activeRig.wristX >= activeRig.shoulderX - 10);
      const isIntentionalBackThrow = (this.mouseVelocity && this.mouseVelocity.x < -200) || (!isHandInFront && vx < -50);

      let simLaunchVx = 0, simLaunchVy = 0;
      if (rawSpeed < 75 && Math.max(this.spinCharge, this.recentSpinCharge) < 0.05) {
        isDrop = true;
        simLaunchVx = vx * 0.35;
        simLaunchVy = Math.max(vy * 0.35, 30);
      } else {
        let dirX = vx / (rawSpeed || 1);
        let dirY = vy / (rawSpeed || 1);

        if (isIntentionalBackThrow) {
          dirX = -Math.abs(dirX);
        } else if (isHandInFront) {
          dirX = Math.max(0.45, Math.abs(dirX));
          dirX = dirX * 0.50 + 0.65 * 0.50;
          if (dirY > -0.20) {
            dirY = -Math.sqrt(Math.max(0.1, 1.0 - dirX * dirX));
          }
        }
        const len = Math.hypot(dirX, dirY) || 1;
        dirX /= len;
        dirY /= len;

        const charge = Math.min(1.0, Math.max(0, this.spinCharge, this.recentSpinCharge));
        let mappedSpeed;
        if (charge <= 0.05) {
          mappedSpeed = Math.min(320, 80 + rawSpeed * 0.26);
        } else {
          const baseSpinSpeed = 430 + charge * 700;
          const flickBonus = Math.min(35, (rawSpeed / 800) * 35);
          mappedSpeed = Math.min(1140, baseSpinSpeed + flickBonus);
          if (this.skillUsedThisTurn[curThrower] === 'lam_cham') {
            mappedSpeed = Math.max(860, mappedSpeed);
          }
        }
        simLaunchVx = dirX * mappedSpeed;
        simLaunchVy = dirY * mappedSpeed;
      }

      const startX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - ballPos.x) : ballPos.x;
      const startY = ballPos.y;

      if (!isDrop) {
        const dx = RING_CENTER_X - startX;
        const dy = RING_CENTER_Y - startY;
        const idealVx = dx / 1.94;
        const idealVy = (dy - 0.5 * GRAVITY * 1.94 * 1.94) / 1.94;
        simLaunchVx = simLaunchVx * 0.35 + (this.currentTurn === 2 ? -idealVx : idealVx) * 0.65;
        simLaunchVy = simLaunchVy * 0.35 + idealVy * 0.65;

        const forwardSpeed = Math.abs(simLaunchVx);
        if (forwardSpeed >= 480) {
          const adjustedVx = Math.max(580, forwardSpeed);
          const T = Math.abs(dx) / adjustedVx;
          if (T >= 1.2 && T <= 2.8) {
            const idealAssistVy = (dy - 0.5 * (GRAVITY * 1.05) * T * T) / T - 32;
            simLaunchVy = simLaunchVy * 0.22 + idealAssistVy * 0.78;
            simLaunchVx = (forwardSpeed < 580) ? (simLaunchVx * 0.35 + adjustedVx * 0.65) : simLaunchVx;
          }
        }
      }

      let worldVx = (this.isMultiplayerMode && this.currentTurn === 2) ? -Math.abs(simLaunchVx) : Math.abs(simLaunchVx);
      let worldVy = simLaunchVy;

      const isLyingCompass = (this.activeDebuff[curThrower] === 'la_ban_noi_doi');
      if (isLyingCompass) {
        const distortAng = (this.currentTurn === 2 ? -1 : 1) * 0.72;
        const fVx = worldVx * Math.cos(distortAng) - worldVy * Math.sin(distortAng);
        const fVy = worldVx * Math.sin(distortAng) + worldVy * Math.cos(distortAng);
        worldVx = fVx;
        worldVy = fVy;
      }

      // 2. Mô phỏng vật lý quỹ đạo bay tương lai
      let simX = startX;
      let simY = startY;
      let prevSimX = simX;
      let prevSimY = simY;
      const simDt = 0.025;
      const points = [{ x: simX, y: simY }];
      let predictedCrossingY = null;
      let predictedLandingX = null;

      for (let i = 0; i < 90; i++) {
        prevSimX = simX;
        prevSimY = simY;

        const curSpd = Math.hypot(worldVx, worldVy);
        const drag = AIR_DRAG * curSpd * curSpd;
        const dragX = curSpd > 0 ? (worldVx / curSpd) * drag : 0;
        const dragY = curSpd > 0 ? (worldVy / curSpd) * drag : 0;

        worldVx -= dragX * simDt;
        worldVy += (GRAVITY - dragY) * simDt;
        simX += worldVx * simDt;
        simY += worldVy * simDt;

        points.push({ x: simX, y: simY });

        if (predictedCrossingY === null) {
          if ((prevSimX <= RING_CENTER_X && simX >= RING_CENTER_X) || (prevSimX >= RING_CENTER_X && simX <= RING_CENTER_X)) {
            const stepDx = simX - prevSimX;
            const frac = stepDx !== 0 ? (RING_CENTER_X - prevSimX) / stepDx : 0.5;
            predictedCrossingY = prevSimY + frac * (simY - prevSimY);
          }
        }

        if (simY >= GROUND_Y) {
          predictedLandingX = simX;
          break;
        }
      }

      // 3. Vẽ đường quỹ đạo dự đoán tương lai
      this.ctx.save();
      this.ctx.beginPath();
      if (points.length > 0) {
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          this.ctx.lineTo(points[i].x, points[i].y);
        }
      }

      const hitMarginY = 52;
      const willScore = (predictedCrossingY !== null && Math.abs(predictedCrossingY - RING_CENTER_Y) <= hitMarginY);
      const isRimClack = (predictedCrossingY !== null && !willScore && Math.abs(predictedCrossingY - RING_CENTER_Y) <= 74);

      let themeColor = '#38bdf8';
      if (isLyingCompass) themeColor = '#f43f5e';
      else if (willScore) themeColor = '#22c55e';
      else if (isRimClack) themeColor = '#f59e0b';
      else themeColor = '#94a3b8';

      this.ctx.strokeStyle = themeColor;
      this.ctx.lineWidth = willScore ? 3.5 : 2.2;
      this.ctx.setLineDash([8, 6]);
      this.ctx.lineDashOffset = -performance.now() * 0.04;
      this.ctx.shadowColor = themeColor;
      this.ctx.shadowBlur = willScore ? 14 : 6;
      this.ctx.stroke();

      // 4. Vẽ tâm nhắm tương lai di chuyển theo thời gian thực (Future Reticle)
      if (predictedCrossingY !== null) {
        const reticleX = RING_CENTER_X;
        const reticleY = predictedCrossingY;
        const pulse = Math.sin(performance.now() * 0.01) * 3;

        this.ctx.beginPath();
        this.ctx.arc(reticleX, reticleY, 22 + pulse, 0, Math.PI * 2);
        this.ctx.strokeStyle = themeColor;
        this.ctx.lineWidth = willScore ? 3.0 : 2.0;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.moveTo(reticleX - 14, reticleY);
        this.ctx.lineTo(reticleX + 14, reticleY);
        this.ctx.moveTo(reticleX, reticleY - 14);
        this.ctx.lineTo(reticleX, reticleY + 14);
        this.ctx.stroke();

        this.ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = themeColor;
        this.ctx.shadowBlur = 8;
        if (willScore) {
          this.ctx.fillText('🎯 THẢ NGAY! (VÀO TÂM VÒNG)', reticleX, reticleY - 30);
        } else if (isRimClack) {
          this.ctx.fillText('⚠️ CHẠM VÀNH MÂY', reticleX, reticleY - 30);
        } else if (predictedCrossingY < RING_CENTER_Y) {
          this.ctx.fillText('⬆️ QUÁ CAO', reticleX, reticleY - 30);
        } else {
          this.ctx.fillText('⬇️ QUÁ THẤP', reticleX, reticleY - 30);
        }
      } else {
        const landX = predictedLandingX || (startX + 300);
        this.ctx.beginPath();
        this.ctx.ellipse(landX, GROUND_Y, 24, 7, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText('⚠️ THIẾU LỰC (RƠI ĐẤT)', landX, GROUND_Y - 14);
      }

      this.ctx.restore();
    }

    drawWindDebuffEffect() {
      this.ctx.save();
      const fwdSign = (this.isMultiplayerMode && this.currentTurn === 2) ? -1 : 1;
      const windDir = fwdSign * (this.windDirectionMultiplier || 1);
      const now = performance.now() * 0.001;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([25, 35]);

      for (let i = 0; i < 6; i++) {
        const y = 200 + i * 110 + Math.sin(now * 3 + i) * 20;
        const offset = ((now * 700 * windDir) % 800);
        const startX = (this.cameraX + 400 + offset + i * 150) % (CANVAS_WIDTH + 400) + this.cameraX - 200;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, y);
        this.ctx.quadraticCurveTo(startX + windDir * 120, y - 15, startX + windDir * 240, y + 10);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    drawMirageGhostRings() {
      // Giữ kín bí mật ảo ảnh: Không vẽ viền phân biệt để 3 cây cột hoàn toàn giống hệt nhau!
      return;
    }

    drawBendingAnomalyEffect() {
      this.ctx.save();
      const now = performance.now() * 0.0025;
      this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      this.ctx.lineWidth = 2.5;
      this.ctx.setLineDash([12, 10]);
      for (let r = 50; r <= 220; r += 45) {
        const waveR = r + (Math.sin(now * 2.5 + r * 0.05) * 12);
        this.ctx.beginPath();
        this.ctx.ellipse(RING_CENTER_X - 100, RING_CENTER_Y, waveR * 0.55, waveR, 0.2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    drawRainDebuffEffect() {
      this.ctx.save();
      const now = performance.now();
      const maxW = (this.isMultiplayerMode) ? WORLD_WIDTH_EXTEND : CANVAS_WIDTH;

      // 1. Storm Sky Overcast Dimming
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
      this.ctx.fillRect(this.cameraX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Heavy Torrential Raindrops (Batched draws for 60 FPS)
      this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      this.ctx.lineWidth = 1.6;
      this.ctx.beginPath();
      for (let i = 0; i < 110; i++) {
        const rx = ((i * 41 + (now * 1.05)) % (maxW + 200)) - 100;
        const ry = ((i * 31 + (now * 2.2)) % (CANVAS_HEIGHT + 100)) - 50;
        const len = 28 + (i % 6) * 5;
        this.ctx.moveTo(rx, ry);
        this.ctx.lineTo(rx - 8, ry + len);
      }
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
      this.ctx.lineWidth = 3.0;
      this.ctx.beginPath();
      for (let i = 0; i < 75; i++) {
        const rx = ((i * 67 + (now * 1.35)) % (maxW + 200)) - 100;
        const ry = ((i * 47 + (now * 2.8)) % (CANVAS_HEIGHT + 100)) - 50;
        const len = 38 + (i % 5) * 7;
        this.ctx.moveTo(rx, ry);
        this.ctx.lineTo(rx - 10, ry + len);
      }
      this.ctx.stroke();

      // 3. Batched Ground Splash Ripples (High performance single-pass)
      this.ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      this.ctx.lineWidth = 1.6;
      this.ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const splashX = ((i * 127 + (now * 0.4)) % (maxW + 100)) - 50;
        const splashAge = ((now * 0.005 + i * 0.65) % 1.0);
        const splashR = 4 + splashAge * 14;
        this.ctx.moveTo(splashX + splashR, GROUND_Y);
        this.ctx.ellipse(splashX, GROUND_Y, splashR, splashR * 0.35, 0, 0, Math.PI * 2);
      }
      this.ctx.stroke();

      // Droplets flying up
      this.ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
      this.ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const splashX = ((i * 127 + (now * 0.4)) % (maxW + 100)) - 50;
        const splashAge = ((now * 0.005 + i * 0.65) % 1.0);
        const dropHeight = Math.sin(splashAge * Math.PI) * 14;
        this.ctx.moveTo(splashX - 4 + 2, GROUND_Y - dropHeight);
        this.ctx.arc(splashX - 4, GROUND_Y - dropHeight, 2.0, 0, Math.PI * 2);
      }
      this.ctx.fill();

      // 4. Low Grass Water Mist
      if (!this._cachedMistGrad) {
        this._cachedMistGrad = this.ctx.createLinearGradient(0, GROUND_Y - 55, 0, GROUND_Y);
        this._cachedMistGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
        this._cachedMistGrad.addColorStop(1, 'rgba(186, 230, 253, 0.20)');
      }
      this.ctx.fillStyle = this._cachedMistGrad;
      this.ctx.fillRect(this.cameraX, GROUND_Y - 55, CANVAS_WIDTH, 55);

      this.ctx.restore();
    }

    drawDarknessDebuffEffect(throwerX, throwerY) {
      if (isNaN(throwerX) || isNaN(throwerY)) return;
      this.ctx.save();
      const maxW = (this.isMultiplayerMode) ? WORLD_WIDTH_EXTEND : CANVAS_WIDTH;
      const grad = this.ctx.createRadialGradient(throwerX, throwerY, 60, throwerX, throwerY, 560);
      grad.addColorStop(0, 'rgba(8, 4, 3, 0.15)');
      grad.addColorStop(0.45, 'rgba(8, 4, 3, 0.82)');
      grad.addColorStop(1, 'rgba(5, 2, 1, 0.97)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(-100, -100, maxW + 200, CANVAS_HEIGHT + 200);
      this.ctx.restore();
    }

    drawSlowMotionVignette() {
      const cx = (isNaN(this.cameraX) ? 0 : this.cameraX) + CANVAS_WIDTH / 2;
      this.ctx.save();
      const grad = this.ctx.createRadialGradient(
        cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.35,
        cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
      );
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0.38)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(this.cameraX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clock slow motion badge at top
      this.ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
      this.ctx.fillStyle = '#7dd3fc';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#0ea5e9';
      this.ctx.shadowBlur = 8;
      this.ctx.fillText('⏳ LÀM CHẬM (BULLET TIME): DỄ CĂN LỰC VÀ GÓC BUÔNG', cx, 85);
      this.ctx.restore();
    }

    // ==========================================
    // RENDERING
    // ==========================================
    render() {
      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.ctx.save();

      // Screen Shake / Disorientation for Hoa Mắt debuff (Chỉ phát tác khi đã bắt đầu xoay/ném)
      const curThrower = (this.isMultiplayerMode) ? (this.currentTurn === 1 ? 'p1' : 'p2') : 'p1';
      const isThrowingPhase = (this.state === STATE.SWINGING || this.state === STATE.FLYING);
      const isLamChamCur = (this.skillUsedThisTurn[curThrower] === 'lam_cham');

      if (isThrowingPhase && this.activeDebuff[curThrower] === 'hoa_mat') {
        const t = performance.now() * 0.007;
        const shakeX = Math.sin(t * 3.5) * 8 + Math.cos(t * 5.2) * 5;
        const shakeY = Math.cos(t * 4.1) * 6 + Math.sin(t * 6.3) * 4;
        const shakeAngle = Math.sin(t * 2.2) * 0.018;
        this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.ctx.rotate(shakeAngle);
        this.ctx.translate(-CANVAS_WIDTH / 2 + shakeX, -CANVAS_HEIGHT / 2 + shakeY);
      }

      if (this.isMultiplayerMode) {
        this.ctx.translate(-this.cameraX, 0);
      }

      // 1. Draw Background
      if (this.isMultiplayerMode && this.assets.bg_extend) {
        this.ctx.drawImage(this.assets.bg_extend, 0, 0, WORLD_WIDTH_EXTEND, CANVAS_HEIGHT);
      } else if (this.assets.bg) {
        this.ctx.drawImage(this.assets.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2. Draw Pole & Ring (Fixed world coordinate at X = 1476px)
      this.drawPole();

      // 2b. Draw Debuff Visual Overlays around Target Arena (Chỉ phát tác khi đã bắt đầu xoay/ném)
      if (isThrowingPhase) {
        if (this.activeDebuff[curThrower] === 'ao_anh') {
          this.drawMirageGhostRings();
        }
        // Gió Mạnh: bị Làm Chậm ngăn chặn hoàn toàn!
        if (!isLamChamCur && (this.activeDebuff[curThrower] === 'gio_manh' || this.activeDebuff[curThrower] === 'phat_kep')) {
          this.drawWindDebuffEffect();
        }
        if (this.activeDebuff[curThrower] === 'be_cong') {
          this.drawBendingAnomalyEffect();
        }
        if (this.activeDebuff[curThrower] === 'mua_nang_hat' || this.activeDebuff[curThrower] === 'phat_kep') {
          this.drawRainDebuffEffect();
        }
      }

      // 3. Draw Character Rig(s)
      if (this.isMultiplayerMode) {
        // Player 1 (Male: Chàng trai Mường) on the left
        if (this.assetsP1) {
          this.rigP1.draw(this.ctx, this.assetsP1);
          if (this.shieldFlashTimer.p1 > 0 || this.shieldDuration.p1 > 0) this.drawShieldAura(this.rigP1, false);
        }
        // Player 2 (Female: Cô gái Thái) on the right (Mirrored)
        if (this.assetsP2) {
          this.ctx.save();
          this.ctx.translate(P2_ANCHOR_X, 0);
          this.ctx.scale(-1, 1);
          this.ctx.translate(-P2_ANCHOR_X, 0);
          this.rigP2.draw(this.ctx, this.assetsP2);
          this.ctx.restore();
          if (this.shieldFlashTimer.p2 > 0 || this.shieldDuration.p2 > 0) this.drawShieldAura(this.rigP2, true);
        }
      } else {
        this.rig.draw(this.ctx, this.assets);
        if (this.shieldFlashTimer.p1 > 0 || this.shieldDuration.p1 > 0) this.drawShieldAura(this.rig, false);
      }

      // 4 & 5. Draw Procedural Braided Cord & Quả Còn
      if (this.state === STATE.FLYING || this.state === STATE.LANDED) {
        this.cord.draw(this.ctx);
        this.quacon.draw(this.ctx, this.projectile.x, this.projectile.y, this.assets);

        // Ảo Ảnh: 3 quả còn giống hệt nhau cùng bay theo nguyên lý vật lý (100% rõ nét, không mờ)
        if (this.mirageProjectiles) {
          this.mirageProjectiles.forEach(mp => {
            mp.cord.draw(this.ctx);
            this.quacon.draw(this.ctx, mp.x, mp.y, this.assets);
          });
        }

        // Phân Thân: 2 Ghost Clones flying alongside quả còn
        if (this.activeDebuff[curThrower] === 'phan_than' && this.state === STATE.FLYING) {
          this.ctx.save();
          this.ctx.globalAlpha = 0.55;
          this.quacon.draw(this.ctx, this.projectile.x - 20, this.projectile.y - 60, this.assets);
          this.quacon.draw(this.ctx, this.projectile.x + 20, this.projectile.y + 60, this.assets);
          this.ctx.restore();
        }
      } else {
        if (this.isMultiplayerMode && this.currentTurn === 2) {
          this.ctx.save();
          this.ctx.translate(P2_ANCHOR_X, 0);
          this.ctx.scale(-1, 1);
          this.ctx.translate(-P2_ANCHOR_X, 0);
          this.cord.draw(this.ctx);
          const ballPos = this.cord.getEndPosition();
          this.quacon.draw(this.ctx, ballPos.x, ballPos.y, this.assets);
          if (this.activeDebuff.p2 === 'ao_anh') {
            this.quacon.draw(this.ctx, ballPos.x - 20, ballPos.y - 12, this.assets);
            this.quacon.draw(this.ctx, ballPos.x + 20, ballPos.y + 12, this.assets);
          }
          if (this.state === STATE.SWINGING && this.spinCharge > 0.05) {
            this.drawSpinChargeIndicator(this.rigP2);
          }
          this.ctx.restore();
          if (this.state === STATE.SWINGING && (this.skillUsedThisTurn.p2 === 'tam_nham' || this.skillUsedThisTurn.p2 === 'vat_ly_an_do')) {
            this.drawAimAssist();
          }
        } else {
          this.cord.draw(this.ctx);
          const ballPos = this.cord.getEndPosition();
          this.quacon.draw(this.ctx, ballPos.x, ballPos.y, this.assets);
          if (this.activeDebuff[curThrower] === 'ao_anh') {
            this.quacon.draw(this.ctx, ballPos.x - 20, ballPos.y - 12, this.assets);
            this.quacon.draw(this.ctx, ballPos.x + 20, ballPos.y + 12, this.assets);
          }
          if (this.state === STATE.SWINGING && this.spinCharge > 0.05) {
            this.drawSpinChargeIndicator(this.isMultiplayerMode ? this.rigP1 : this.rig);
          }
          if (this.state === STATE.SWINGING && (this.skillUsedThisTurn.p1 === 'tam_nham' || this.skillUsedThisTurn.p1 === 'vat_ly_an_do')) {
            this.drawAimAssist();
          }
        }
      }

      // Darkness Debuff shroud overlay (Chỉ hiện khi đã bắt đầu xoay/ném)
      if (isThrowingPhase && this.activeDebuff[curThrower] === 'bong_dem') {
        const charAnchorX = (this.isMultiplayerMode && this.currentTurn === 2) ? P2_ANCHOR_X : P1_ANCHOR_X;
        this.drawDarknessDebuffEffect(charAnchorX, GROUND_Y - 140);
      }

      // Bullet Time Slow Motion cyan vignette
      if (this.skillUsedThisTurn[curThrower] === 'lam_cham') {
        this.drawSlowMotionVignette();
      }

      // Áp Lực Thời Gian: Floating countdown clock
      // Chỉ hiện khi:
      // 1) Người chơi là người tung chiêu (ví dụ P1 cài lên Bot, P1 nhìn thấy đếm ngược trên đầu Bot)
      // 2) HOẶC nạn nhân đã phát hiện chiêu (thông qua việc kích hoạt kỹ năng trong lượt)
      if ((this.state === STATE.IDLE || this.state === STATE.SWINGING) && this.activeDebuff[curThrower] === 'ap_luc_thoi_gian') {
        const isCasterLooking = (this.gameMode === 'bot' && curThrower === 'p2' && this.debuffCaster.p2 === 'p1');
        const isDetectedByVictim = !!this.debuffDetected[curThrower];

        if (isCasterLooking || isDetectedByVictim) {
          this.ctx.save();
          const activeRig = (this.isMultiplayerMode && this.currentTurn === 2) ? this.rigP2 : (this.isMultiplayerMode ? this.rigP1 : this.rig);
          const clockX = (this.isMultiplayerMode && this.currentTurn === 2) ? (2 * P2_ANCHOR_X - activeRig.shoulderX) : (activeRig ? activeRig.shoulderX : CANVAS_WIDTH / 2);
          const clockY = activeRig ? (activeRig.shoulderY - 95) : 120;
          this.ctx.font = 'bold 22px "Be Vietnam Pro", sans-serif';
          this.ctx.fillStyle = '#ef4444';
          this.ctx.textAlign = 'center';
          this.ctx.shadowColor = '#dc2626';
          this.ctx.shadowBlur = 12;
          const clockLabel = isCasterLooking ? `⏳ ${Math.max(0, this.timePressureTimer).toFixed(1)}s (ĐẾM NGƯỢC BOT)` : `⏰ ${Math.max(0, this.timePressureTimer).toFixed(1)}s`;
          this.ctx.fillText(clockLabel, clockX, clockY);
          this.ctx.restore();
        }
      }

      // 6. Draw Particles & Confetti (in world space)
      this.particles.drawParticles(this.ctx);

      this.ctx.restore(); // Restore back to screen space

      // 7. Screen-Space HUD Overlays
      if (this.isMultiplayerMode && this.isCameraPanning) {
        this.drawCameraPanningOverlay();
      }
    }

    drawSpinChargeIndicator(rig = this.rig) {
      const hx = rig.handGripX;
      const hy = rig.handGripY;
      const charge = Math.min(1.0, this.spinCharge);
      const r = 26;

      this.ctx.save();
      // Faint background guideline ring
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Active charging gold arc
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, r, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
      this.ctx.strokeStyle = charge >= 0.92 ? '#ffeb3b' : '#f39c12';
      this.ctx.lineWidth = charge >= 0.92 ? 4 : 3;
      this.ctx.lineCap = 'round';
      if (charge >= 0.92) {
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 12;
      }
      this.ctx.stroke();

      // Subtle indicator pearl dot at current charge angle
      const endAng = -Math.PI / 2 + charge * Math.PI * 2;
      const dotX = hx + Math.cos(endAng) * r;
      const dotY = hy + Math.sin(endAng) * r;
      this.ctx.beginPath();
      this.ctx.arc(dotX, dotY, charge >= 0.92 ? 4.5 : 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      this.ctx.restore();
    }

    drawPole() {
      if (!this.assets.pole) return;

      // KHI CHIÊU ẢO ẢNH CÓ HIỆU LỰC: Vẽ 3 cây cột còn với 3 chiều cao khác nhau!
      if (this.aoAnhPoles && this.aoAnhPoles.length > 0) {
        this.aoAnhPoles.forEach((pole, idx) => {
          if (pole.dissolved && !pole.isReal) return;

          this.ctx.save();
          this.ctx.globalAlpha = 1.0;

          const drawX = pole.x - POLE_BASE_OFFSET_X * pole.scale;
          const drawY = GROUND_Y - POLE_BASE_OFFSET_Y * pole.scale;
          const drawW = this.assets.pole.width * pole.scale;
          const drawH = this.assets.pole.height * pole.scale;

          this.ctx.drawImage(this.assets.pole, drawX, drawY, drawW, drawH);

          // Vành đích trên đỉnh từng cây cột
          const rx = RING_INNER_RX * (pole.scale / POLE_SCALE);
          const ry = RING_INNER_RY * (pole.scale / POLE_SCALE);


          if (pole.isReal && this.ringGlowTimer > 0) {
            this.ctx.beginPath();
            this.ctx.ellipse(pole.x, pole.ringY, rx + 8, ry + 8, 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${Math.min(1.0, this.ringGlowTimer * 2)})`;
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = '#ffde59';
            this.ctx.shadowBlur = 20;
            this.ctx.stroke();
          }

          this.ctx.restore();
        });
        return;
      }

      // Cột chuẩn bình thường:
      const drawX = POLE_ANCHOR_X - POLE_BASE_OFFSET_X * POLE_SCALE;
      const drawY = GROUND_Y - POLE_BASE_OFFSET_Y * POLE_SCALE;
      const drawW = this.assets.pole.width * POLE_SCALE;
      const drawH = this.assets.pole.height * POLE_SCALE;

      this.ctx.drawImage(this.assets.pole, drawX, drawY, drawW, drawH);

      // Golden ring glow when scored
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
  }

  // Export Game class and constants to global window
  window.Game = Game;
  window.SKILLS_CATALOG = SKILLS_CATALOG;
  window.STATE = STATE;

  // Launch game when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.gameInstance && !window.NO_AUTO_GAME_INIT) {
      window.game = new Game();
    }
  });
})();
