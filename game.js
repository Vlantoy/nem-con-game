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

        // Smooth angular spring towards target
        let diff = targetAngle - this.streamerAngles[i];
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

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
    constructor(skinId = null) {
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
          hand: { wristPivot: { x: 25, y: 180 }, gripTunnel: { x: 165, y: 135 } }
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
      this.standingAnchorX = cfg.standingAnchorX || CHAR_ANCHOR_X;
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
      this.targetHandX = this.shoulderX + 1;
      this.targetHandY = this.shoulderY + 86;
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
        const defaultX = this.shoulderX + 1;
        const defaultY = this.shoulderY + 86;
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

      // 2. Draw Upper Arm with Unified Puffed Sleeve (vai áo gắn liền cánh tay, xoay tự nhiên tại khớp vai)
      if (assets.upper_arm) {
        const img = assets.upper_arm;
        ctx.save();
        ctx.translate(this.shoulderX, this.shoulderY);
        ctx.rotate(this.th1 - this.uBaseAng);
        ctx.drawImage(img, -this.uPiv.x, -this.uPiv.y, img.width * this.sUpper, img.height * this.sUpper);
        ctx.restore();
      }

      // 3. Draw Forearm (pivoting at elbow)
      if (assets.forearm) {
        const img = assets.forearm;
        ctx.save();
        ctx.translate(this.elbowX, this.elbowY);
        ctx.rotate(this.th2 - this.fBaseAng);
        ctx.drawImage(img, -this.fPiv.x, -this.fPiv.y, img.width * this.sFore, img.height * this.sFore);
        ctx.restore();
      }

      // 4. Draw Hand (pivoting at wrist, rotating with dynamic wrist angle)
      if (assets.hand) {
        const img = assets.hand;
        ctx.save();
        ctx.translate(this.wristX, this.wristY);
        ctx.rotate(this.wristAngle - this.hBaseAng);
        ctx.drawImage(img, -this.hPiv.x, -this.hPiv.y, img.width * this.sHand, img.height * this.sHand);
        ctx.restore();
      }
    }
  }

  // ==========================================
  // MAIN GAME CLASS
  // ==========================================
  class Game {
    constructor() {
      window.gameInstance = this;
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.sound = new SoundManager();
      this.particles = new ParticleSystem();
      this.cord = new VerletCord();
      this.quacon = new QuaconAssembly();
      this.rig = new CharacterRig();

      // UI Elements
      this.ui = {
        score: document.getElementById('score-val'),
        highscore: document.getElementById('highscore-val'),
        streak: document.getElementById('streak-val'),
        throws: document.getElementById('throws-count'),
        accuracy: document.getElementById('accuracy-val'),
        btnAudio: document.getElementById('btn-audio'),
        audioIcon: document.getElementById('audio-icon'),
        btnMode: document.getElementById('btn-mode'),
        modeLabel: document.getElementById('mode-label'),
        modeIcon: document.getElementById('mode-icon'),
        btnGrip: document.getElementById('btn-grip'),
        gripLabel: document.getElementById('grip-label'),
        modalMode: document.getElementById('modal-mode'),
        btnCloseMode: document.getElementById('btn-close-mode'),
        btnStartGame: document.getElementById('btn-start-game'),
        cardModeAuto: document.getElementById('card-mode-auto'),
        cardModeManual: document.getElementById('card-mode-manual'),
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
        skinGridContainer: document.getElementById('skin-grid-container')
      };

      // State variables
      this.state = STATE.LOADING;
      this.score = 0;
      this.highscore = parseInt(localStorage.getItem('nemcon_highscore') || '0', 10);
      this.streak = 0;
      this.totalThrows = 0;
      this.successfulThrows = 0;

      // Control & Grip Modes
      // 'auto' (Mode 1: Hold mouse/touch to whirl smoothly, accelerates, release to throw)
      // 'manual' (Mode 2: Getting Over It 1:1 circular whirl physics)
      this.controlMode = localStorage.getItem('nemcon_control_mode') || 'auto';
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
      this.ui.btnCloseModal.addEventListener('click', closeModal);
      this.ui.btnModalOk.addEventListener('click', closeModal);

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

      if (this.ui.cardModeAuto) {
        this.ui.cardModeAuto.addEventListener('click', () => {
          this.applyControlMode('auto');
          this.sound.init();
          this.sound.playWhoosh(1.1);
        });
      }

      if (this.ui.cardModeManual) {
        this.ui.cardModeManual.addEventListener('click', () => {
          this.applyControlMode('manual');
          this.sound.init();
          this.sound.playWhoosh(0.9);
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

        return {
          x: (localX - offsetX) / scale,
          y: (localY - offsetY) / scale
        };
      };

      this.handlePointerDown = (clientX, clientY, pointerId = null) => {
        this.sound.init();
        if (this.state === STATE.IDLE) {
          this.isMouseDown = true;
          this.state = STATE.SWINGING;
          const wrapper = document.getElementById('canvas-wrapper');
          if (wrapper) wrapper.classList.add('grabbing');
          const pos = this.getCanvasPos(clientX, clientY);
          this.mouseWorldX = pos.x;
          this.mouseWorldY = pos.y;
          this.prevMouseX = pos.x;
          this.prevMouseY = pos.y;

          // Reset spin momentum tracking for the new wind-up
          this.spinCharge = 0;
          this.recentSpinCharge = 0;
          this.continuousRotation = 0;
          this.totalRotations = 0;
          this.lastSpinDirection = 0;
          this.whooshCooldown = 0.25;

          this.autoSpinTime = 0;
          this.autoSpinAngle = Math.PI / 2; // Hanging down initially

          const ballPos = this.cord.getEndPosition();
          this.prevBallAngle = Math.atan2(ballPos.y - this.rig.shoulderY, ballPos.x - this.rig.shoulderX);
        }
      };

      this.handlePointerMove = (clientX, clientY) => {
        if (!this.isMouseDown) return;
        const pos = this.getCanvasPos(clientX, clientY);
        // In manual mode, mouse or touch position directly controls the hand target
        if (this.controlMode === 'manual') {
          this.mouseWorldX = pos.x;
          this.mouseWorldY = pos.y;
        }
      };

      this.handlePointerUp = () => {
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

      wrapper.addEventListener('pointerdown', (e) => {
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

    applyControlMode(mode) {
      if (mode !== 'auto' && mode !== 'manual') mode = 'auto';
      this.controlMode = mode;
      localStorage.setItem('nemcon_control_mode', mode);

      if (this.ui.modeLabel) {
        this.ui.modeLabel.textContent = mode === 'auto' ? 'Tự Xoay' : 'Thủ Công';
      }
      if (this.ui.modeIcon) {
        this.ui.modeIcon.textContent = mode === 'auto' ? '⚡' : '🔄';
      }

      // Update modal cards
      if (this.ui.cardModeAuto && this.ui.cardModeManual) {
        if (mode === 'auto') {
          this.ui.cardModeAuto.classList.add('active');
          this.ui.cardModeManual.classList.remove('active');
          const bAuto = this.ui.cardModeAuto.querySelector('.btn-mode-choice');
          const bMan = this.ui.cardModeManual.querySelector('.btn-mode-choice');
          if (bAuto) bAuto.textContent = 'ĐANG CHỌN';
          if (bMan) bMan.textContent = 'CHỌN CHẾ ĐỘ NÀY';
        } else {
          this.ui.cardModeManual.classList.add('active');
          this.ui.cardModeAuto.classList.remove('active');
          const bAuto = this.ui.cardModeAuto.querySelector('.btn-mode-choice');
          const bMan = this.ui.cardModeManual.querySelector('.btn-mode-choice');
          if (bAuto) bAuto.textContent = 'CHỌN CHẾ ĐỘ NÀY';
          if (bMan) bMan.textContent = 'ĐANG CHỌN';
        }
      }
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
        { key: 'pole',                src: 'assets/items/Pole_transparent.png' },
        ...charAssets,
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
    // UPDATE CYCLE
    // ==========================================
    update(dt) {
      this.particles.update(dt);

      if (this.ringGlowTimer > 0) {
        this.ringGlowTimer -= dt;
      }

      // Auto-spin circular kinematics when holding in auto mode (Clockwise forward windup)
      if (this.state === STATE.SWINGING && this.isMouseDown && this.controlMode === 'auto') {
        this.autoSpinTime += dt;
        // Accelerate smoothly from 5.0 rad/s up to 15.5 rad/s
        const omega = Math.min(15.5, 5.0 + this.autoSpinTime * 5.8);
        this.autoSpinAngle += omega * dt; // CLOCKWISE rotation: Back -> Up -> Forward -> Down

        // Hand stays in athletic forward-chest windup posture, making a tight rhythmic circular pump
        const handCenterX = this.rig.shoulderX + 24;
        const handCenterY = this.rig.shoulderY + 20;
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

      // Update Character Rig IK & Dynamic Wrist Articulation
      const isInteracting = (this.state === STATE.SWINGING && this.isMouseDown);
      let pullX, pullY;
      if (this.state === STATE.SWINGING || this.state === STATE.IDLE) {
        const ballPos = this.cord.getEndPosition();
        pullX = ballPos.x;
        pullY = ballPos.y;
      }
      this.rig.update(dt, isInteracting, this.mouseWorldX, this.mouseWorldY, pullX, pullY);

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
      // Cord hangs gently from hand
      this.cord.update(this.rig.handGripX, this.rig.handGripY, dt, true);
      const ballPos = this.cord.getEndPosition();
      const ballVel = this.cord.getEndVelocity(dt);
      this.quacon.update(dt, ballVel.vx, ballVel.vy);
    }

    updateSwinging(dt) {
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

        const hx = this.rig.handGripX;
        const hy = this.rig.handGripY;
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
        this.cord.update(this.rig.handGripX, this.rig.handGripY, dt, true);
        const ballPos = this.cord.getEndPosition();
        const ballVel = this.cord.getEndVelocity(dt);
        const rawSpeed = Math.hypot(ballVel.vx, ballVel.vy);

        // Track angular momentum around shoulder
        const curAngle = Math.atan2(ballPos.y - this.rig.shoulderY, ballPos.x - this.rig.shoulderX);
        let dAngle = curAngle - this.prevBallAngle;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        this.prevBallAngle = curAngle;

        const angularVelocity = dt > 0.001 ? Math.abs(dAngle) / dt : 0; // rad/s
        const direction = dAngle >= 0 ? 1 : -1;

        if (angularVelocity > 3.0 && Math.abs(dAngle) > 0.03) {
          if (this.lastSpinDirection !== 0 && this.lastSpinDirection !== direction && Math.abs(dAngle) > 0.25) {
            this.continuousRotation = 0;
            this.spinCharge = Math.max(0, this.spinCharge - 0.25);
          }
          this.lastSpinDirection = direction;
          this.continuousRotation += Math.abs(dAngle);

          if (this.continuousRotation >= Math.PI) {
            const effectiveAngle = Math.abs(dAngle);
            const speedFactor = Math.min(1.4, Math.max(0.7, angularVelocity / 7.5));
            this.spinCharge = Math.min(1.0, this.spinCharge + effectiveAngle * 0.09 * speedFactor);
          }
        } else {
          this.continuousRotation = Math.max(0, this.continuousRotation - dt * 3.5);
          this.spinCharge = Math.max(0, this.spinCharge - dt * 0.65);
        }

        this.recentSpinCharge = Math.max(this.spinCharge, this.recentSpinCharge - dt * 1.5);

        this.whooshCooldown -= dt;
        if (this.spinCharge > 0.15 && this.whooshCooldown <= 0) {
          const pitch = 0.8 + this.spinCharge * 0.8;
          this.sound.playWhoosh(pitch);
          this.whooshCooldown = Math.max(0.18, 0.40 - this.spinCharge * 0.20);
        }

        this.quacon.update(dt, ballVel.vx, ballVel.vy);
      }
    }

    performThrow() {
      // Compute instantaneous position of the ball at release
      const ballPos = this.cord.getEndPosition();
      let vx, vy;
      let isDrop = false;

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
          // Forward upswing launch detection:
          // In clockwise motion, dirX = -sin(ballAngle) > 0 when ball is moving forward (top half).
          if (dirX > 0) {
            // Forward launch towards the festival arena!
            // Shape into a soaring ceremonial trajectory (elevation angle ~40 - 65 deg up-right)
            dirX = Math.max(0.45, Math.min(0.85, dirX));
            if (dirY > -0.25) {
              dirY = -Math.sqrt(Math.max(0.1, 1.0 - dirX * dirX));
            }
          } else {
            // Released while swinging backward
            if (dirY < -0.35) {
              // High near the top of the arc: guide forward gracefully
              dirX = Math.abs(dirX);
            }
          }

          const len = Math.hypot(dirX, dirY) || 1;
          dirX /= len;
          dirY /= len;

          // Speed scaled by accumulated spin energy:
          // 420 px/s (quick tap) up to 1120 px/s (full power soaring ceremonial arc)
          const baseSpeed = 420 + charge * 690;
          const mappedSpeed = Math.min(1130, baseSpeed);

          vx = dirX * mappedSpeed;
          vy = dirY * mappedSpeed;
        }
      } else {
        // MODE 2: MANUAL WHIRL
        let ballVel = this.cord.getEndVelocity();
        vx = ballVel.vx;
        vy = ballVel.vy;
        let rawSpeed = Math.hypot(vx, vy);

        const isHandInFront = (this.rig.wristX >= this.rig.shoulderX - 10);
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
            dirX = Math.max(0.40, Math.abs(dirX));
            if (dirY > -0.15) {
              dirY = -0.40;
            }
          }

          const len = Math.hypot(dirX, dirY) || 1;
          dirX /= len;
          dirY /= len;

          const charge = Math.min(1.0, Math.max(0, this.spinCharge, this.recentSpinCharge));
          let mappedSpeed;

          if (charge <= 0.05) {
            mappedSpeed = Math.min(280, 60 + rawSpeed * 0.22);
          } else {
            const baseSpinSpeed = 380 + charge * 720;
            const flickBonus = Math.min(30, (rawSpeed / 800) * 30);
            mappedSpeed = Math.min(1130, baseSpinSpeed + flickBonus);
          }

          vx = dirX * mappedSpeed;
          vy = dirY * mappedSpeed;
        }
      }

      this.totalThrows++;
      this.updateStatsUI();

      if (!isDrop) {
        // Trigger dynamic follow-through knee-flex / body spring bounce!
        this.rig.triggerThrowBounce();
        this.sound.playThrow();
      } else {
        this.sound.playGroundThud();
      }

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

      // Reset spin charge upon release
      this.spinCharge = 0;
      this.recentSpinCharge = 0;
      this.continuousRotation = 0;
      this.totalRotations = 0;
      this.autoSpinTime = 0;

      // Initialize cord trailing behind the ball in the slipstream
      const topX = this.projectile.x + this.quacon.topAttachOffset.x;
      const topY = this.projectile.y + this.quacon.topAttachOffset.y;
      this.cord.initFlight(topX, topY, vx, vy);

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
        this.sound.playGroundThud();
        this.particles.addDust(p.x, p.y + BALL_DIAMETER / 2, 14);

        // Bouncing
        p.vy = -p.vy * 0.35;
        p.vx *= 0.65;

        // Settle when kinetic energy is low
        if (Math.hypot(p.vx, p.vy) < 60) {
          p.vx = 0;
          p.vy = 0;
          this.state = STATE.LANDED;
          p.restTimer = 0;
        }
      }

      // Out of bounds
      if (p.x > CANVAS_WIDTH + 150 || p.x < -150) {
        this.state = STATE.LANDED;
        p.restTimer = 0;
      }
    }

    checkCollisions(p) {
      if (p.scored) return;

      // 1. Precise continuous line-segment crossing of the Ring plane at X = RING_CENTER_X
      const crossingX = (p.prevX < RING_CENTER_X && p.x >= RING_CENTER_X) || 
                        (p.prevX > RING_CENTER_X && p.x <= RING_CENTER_X);

      if (crossingX) {
        const dx = p.x - p.prevX;
        const t = dx !== 0 ? Math.max(0, Math.min(1, (RING_CENTER_X - p.prevX) / dx)) : 0.5;
        const intersectY = p.prevY + t * (p.y - p.prevY);
        const dyHole = Math.abs(intersectY - RING_CENTER_Y);

        // A. INNER HOLE PASS-THROUGH (True "Xuyên Tâm Vòng Còn" GOAL!)
        // Only scores when the projectile trajectory cleanly threads through the authentic inner hole aperture
        if (dyHole <= RING_INNER_RY) {
          p.scored = true;
          this.ringGlowTimer = 1.0;
          this.successfulThrows++;
          this.score += 100;
          this.streak++;
          this.updateStatsUI();

          this.sound.playScoreCelebration();
          this.particles.addConfetti(RING_CENTER_X, RING_CENTER_Y, 80);

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
          this.showAnnouncement(msg, `+100 ĐIỂM • ${blessing}`);
          return;
        }

        // B. RIM IMPACT (Hits the circular bamboo hoop rim outside the hole)
        if (dyHole <= RING_OUTER_RY) {
          this.sound.playRimClack();
          this.particles.addDust(RING_CENTER_X, intersectY, 10);
          p.vx = -Math.abs(p.vx) * 0.42;
          p.vy = p.vy * 0.35 + (intersectY < RING_CENTER_Y ? -70 : 70);
          p.x = RING_CENTER_X - 10;
          this.streak = 0;
          this.updateStatsUI();
          return;
        }

        // C. BAMBOO POLE SHAFT IMPACT (Below the hoop down to the ground)
        if (intersectY > RING_CENTER_Y + RING_OUTER_RY && intersectY < GROUND_Y) {
          this.sound.playRimClack();
          this.particles.addDust(RING_CENTER_X, intersectY, 8);
          p.vx = -Math.abs(p.vx) * 0.45;
          p.x = RING_CENTER_X - 14;
          this.streak = 0;
          this.updateStatsUI();
          return;
        }
      }
    }

    updateLanded(dt) {
      this.projectile.restTimer += dt;
      if (this.projectile.restTimer > 1.2) {
        if (!this.projectile.scored && this.streak > 0) {
          this.streak = 0;
          this.updateStatsUI();
        }
        this.state = STATE.IDLE;
        this.cord.reset(this.rig.handGripX, this.rig.handGripY);
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

      // 3. Draw Character Rig (Body + Articulated Arm IK)
      this.rig.draw(this.ctx, this.assets);

      // 4. Draw Procedural Braided Cord (Connecting hand to quả còn or trailing in flight)
      this.cord.draw(this.ctx);

      // 5. Draw Quả Còn (Sphere + 5 Dynamic Physics Streamers)
      if (this.state === STATE.FLYING || this.state === STATE.LANDED) {
        this.quacon.draw(this.ctx, this.projectile.x, this.projectile.y, this.assets);
      } else {
        const ballPos = this.cord.getEndPosition();
        this.quacon.draw(this.ctx, ballPos.x, ballPos.y, this.assets);
      }

      // 6. Draw Subtle Festival Momentum Charge Ring while swinging
      if (this.state === STATE.SWINGING && this.spinCharge > 0.05) {
        this.drawSpinChargeIndicator();
      }

      // 7. Draw Particles & Confetti (on top)
      this.particles.drawParticles(this.ctx);
    }

    drawSpinChargeIndicator() {
      const hx = this.rig.handGripX;
      const hy = this.rig.handGripY;
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

  // Launch game when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
