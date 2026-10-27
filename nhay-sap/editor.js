/**
 * =========================================================================
 * SẠP STUDIO EDITOR ENGINE · NHAY SAP ADVANCED FRAME & SPIKE WORKSHOP
 * =========================================================================
 * - Quản lý cấu hình Spike, Sạp tre, kích thước vật thể và vùng va chạm
 * - Hỗ trợ chỉnh sửa Vị Trí Người Cầm Sạp (Bên Trái & Bên Phải độc lập)
 * - Tùy biến Quy Tắc Sát Thương (Lúc nào mất damage, cửa sổ nhịp, loại va chạm)
 * - Tùy biến Quy Tắc Bật Nhảy (Lúc nào được nhảy, nhịp nào cho phép, hồi chiêu)
 * - Hỗ trợ chỉnh sửa Vùng Nhảy Được (Safe) & Vùng Không Nhảy Được (Spike Hazard) CỦA TỪNG FRAME
 * - Tương tác trực tiếp trên Canvas với Bounding Box Gizmo (Move / Resize 8 handles)
 * - Chế độ Playtest thời gian thực với Web Audio Synthesizer tích hợp
 * - Đồng bộ hóa với server qua REST API /api/save-nhay-sap-config
 */

(() => {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  class EditorAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.bgmTimer = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playBambooTap(volume = 0.5) {
      if (this.isMuted) return;
      this.init();
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
      osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.16);
    }
    playBambooClack(volume = 0.8) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
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
      osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.11);
    }
    playJump() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.19);
    }
    playChime() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [659.25, 880, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04); osc.stop(now + idx * 0.04 + 0.28);
      });
    }
    playTrip() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.32);
    }
  }

  // --- EDITOR STATE & MANAGER ---
  // Cắt sprite chính xác từng frame (Zero bleed & Neo gót chân chuẩn xác)
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

  class SapStudioEditor {
    constructor() {
      this.canvas = document.getElementById('editor-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new EditorAudio();

      // Deep clone base config or restore from localStorage
      const baseCfg = window.NHAY_SAP_CONFIG ? JSON.parse(JSON.stringify(window.NHAY_SAP_CONFIG)) : this.createFallbackConfig();
      const cached = localStorage.getItem('nhay_sap_editor_config');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.stage?.lanes) && parsed.stage.lanes.length >= 1 && (!baseCfg?.lastModified || parsed.lastModified >= baseCfg.lastModified)) {
            this.config = parsed;
          } else {
            localStorage.removeItem('nhay_sap_editor_config');
            this.config = baseCfg;
          }
        } catch (e) {
          this.config = baseCfg;
        }
      } else {
        this.config = baseCfg;
      }

      // Ensure clappers & rules sub-objects exist
      this.ensureSchemaIntegrity();
      this.originalConfig = JSON.parse(JSON.stringify(this.config));

      // Active Selection & Animation State
      this.activeAnimationId = 'dancer_forward';
      this.currentFrameIndex = 0;
      this.selectedObject = 'dancer'; // 'dancer' | 'clappers' | 'beams' | 'background' | 'stage'
      this.selectedClapperSide = 'left'; // 'left' | 'right'
      this.selectedZone = null;       // { type: 'jumpable' | 'danger', index: number }
      this.activeTool = 'select';     // 'select' | 'draw-jumpable' | 'draw-danger' | 'pan' | 'pick-foot'

      // Viewport Transform
      this.zoom = 0.65;
      this.panX = 0;
      this.panY = 0;
      this.isPanning = false;
      this.panStart = { x: 0, y: 0 };

      // Interactive Gizmo / Dragging
      this.isDraggingObject = false;
      this.isDraggingZone = false;
      this.isResizingZone = false;
      this.isDraggingClapper = false;
      this.activeResizeHandle = null; // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
      this.dragStart = { x: 0, y: 0 };
      this.dragInitialRect = null;
      this.isDrawingZone = false;
      this.drawStart = { x: 0, y: 0 };
      this.drawCurrent = { x: 0, y: 0 };

      // Playback
      this.isPlaying = false;
      this.playbackTimer = null;
      this.fps = this.config.animations[this.activeAnimationId]?.frameRate || 9;
      this.isLooping = true;

      // Playtest Simulation State
      this.isPlaytestActive = false;
      this.ptLane = 1; // 0..lanes.length-1
      this.ptTargetX = (this.config.stage.lanes && this.config.stage.lanes[1]) ? this.config.stage.lanes[1] : 837;
      this.ptDancerX = this.ptTargetX;
      this.ptDancerY = this.config.stage.floorY;
      this.ptIsAirborne = false;
      this.ptJumpProgress = 0;
      this.ptJumpCooldownTimer = 0;
      this.ptIsTripped = false;
      this.ptTripTimer = 0;
      this.ptTripDuration = 1200;
      this.ptHearts = 3;
      this.ptBeat = 0;
      this.ptBeatTracker = 0;

      // Interactive Landing Markers Dragging
      this.isDraggingLandingMarker = null; // null | { type: 'safeLeft' | 'safeRight' | 'lane', index?: number }

      // View Toggles
      this.viewToggles = {
        jumpable: true,
        danger: true,
        foot: true,
        lanes: true,
        landing: true,
        grid: false
      };

      // Assets
      this.assets = {};
      this.assetsLoaded = false;

      this.initDOM();
      this.loadAssets(() => {
        this.assetsLoaded = true;
        this.fitToScreen();
        this.updateAllUI();
        this.render();
      });
    }

    ensureSchemaIntegrity() {
      if (!this.config.objects) this.config.objects = {};
      if (!this.config.objects.clappers) {
        this.config.objects.clappers = {
          name: 'Đội Gõ Sạp 2 Đầu',
          splitMode: true,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          left: { x: 0, y: 0, offsetX: 0, offsetY: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, width: 836, height: 941, sourceX: 0, sourceY: 0, sourceW: 836, sourceH: 941, visible: true },
          right: { x: 836, y: 0, offsetX: 0, offsetY: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, width: 836, height: 941, sourceX: 836, sourceY: 0, sourceW: 836, sourceH: 941, visible: true }
        };
      }
      if (!this.config.rules) {
        this.config.rules = {
          damage: { activeBeats: [false, false, false, true], windowStartPercent: 0.65, windowEndPercent: 1.00, triggerOnSpikeTouch: true, triggerOnClosedSạpGrounded: true, triggerOnWrongLane: false, damageAmount: 1, invincibilityDuration: 1800, tripFallDuration: 1200 },
          jump: { allowAnytime: true, allowedBeats: [true, true, true, true], windowStartPercent: 0.0, windowEndPercent: 1.0, jumpHeight: -110, jumpDuration: 450, jumpCooldown: 0, coyoteBufferTime: 140, allowDoubleJump: false, requireGrounded: true }
        };
      }
    }

    createFallbackConfig() {
      return {
        stage: { canvasWidth: 1672, canvasHeight: 941, floorY: 550, safeLeftX: 477, safeRightX: 1197, lanes: [657, 837, 1017], bpm: 103, jumpYOffset: -90, jumpDuration: 400 },
        spikes: { poleWidth: 22, poleHeight: 220, openGap: 160, closedGap: 24, dangerWidth: 50, hazardColor: '#ef4444', safeColor: '#10b981', showSpikeTeeth: false, poles: [] },
        objects: {
          dancer: { scale: 0.20, width: 362, height: 724, offsetX: 0, offsetY: 0, footAnchor: { x: 181, y: 710 }, footHitboxRadius: 14 },
          clappers: {
            name: 'Đội Gõ Sạp 2 Đầu',
            splitMode: false,
            scale: 0.50,
            offsetX: 0,
            offsetY: 280,
            left: { x: 0, y: 0, offsetX: 0, offsetY: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, width: 836, height: 941, sourceX: 0, sourceY: 0, sourceW: 836, sourceH: 941, visible: true },
            right: { x: 836, y: 0, offsetX: 0, offsetY: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, width: 836, height: 941, sourceX: 836, sourceY: 0, sourceW: 836, sourceH: 941, visible: true }
          }
        },
        rules: {
          damage: { activeBeats: [false, false, false, true], windowStartPercent: 0.65, windowEndPercent: 1.00, triggerOnSpikeTouch: true, triggerOnClosedSạpGrounded: true, triggerOnWrongLane: false, damageAmount: 1, invincibilityDuration: 1800, tripFallDuration: 1200 },
          jump: { allowAnytime: true, allowedBeats: [true, true, true, true], windowStartPercent: 0.0, windowEndPercent: 1.0, jumpHeight: -110, jumpDuration: 450, jumpCooldown: 0, coyoteBufferTime: 140, allowDoubleJump: false, requireGrounded: true }
        },
        animations: {}
      };
    }

    loadAssets(callback) {
      const list = [
        { key: 'valley', src: '../assets/nhay-sap/thung-lung.png' },
        { key: 'beams', src: '../assets/nhay-sap/sap-tre.png' },
        { key: 'clappers_mo_ha', src: '../assets/nhay-sap/clappers_mo_ha.png' },
        { key: 'clappers_mo_nang', src: '../assets/nhay-sap/clappers_mo_nang.png' },
        { key: 'clappers_dong_ha', src: '../assets/nhay-sap/clappers_dong_ha.png' },
        { key: 'dancer_forward', src: '../assets/nhay-sap/dancer_nhay_truoc.png' },
        { key: 'dancer_back', src: '../assets/nhay-sap/dancer_nhay_lui.png' },
        { key: 'dancer_trip', src: '../assets/nhay-sap/dancer_nga.png' }
      ];
      let loaded = 0;
      list.forEach(item => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          this.assets[item.key] = img;
          loaded++;
          if (loaded === list.length) callback();
        };
        img.onerror = () => {
          console.warn('Asset not found:', item.src);
          loaded++;
          if (loaded === list.length) callback();
        };
      });
    }

    // --- UI EVENT BINDING ---
    initDOM() {
      // Sidebar Tabs
      document.querySelectorAll('.s-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.s-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const target = document.getElementById(tab.dataset.tab);
          if (target) target.classList.add('active');

          if (tab.dataset.tab === 'tab-clappers') {
            this.selectedObject = 'clappers';
          }
          this.render();
        });
      });

      // Target Object Select
      const selObj = document.getElementById('sel-target-object');
      selObj?.addEventListener('change', (e) => {
        this.selectedObject = e.target.value;
        this.updateObjectSubpanels();
        this.render();
      });

      // Spikes Inputs
      this.bindSliderAndNumber('rng-pole-width', 'num-pole-width', 'lbl-pole-width', 'px', val => {
        this.config.spikes.poleWidth = val;
        this.render();
      });
      this.bindSliderAndNumber('rng-pole-height', 'num-pole-height', 'lbl-pole-height', 'px', val => {
        this.config.spikes.poleHeight = val;
        this.render();
      });
      this.bindSliderAndNumber('rng-open-gap', 'num-open-gap', 'lbl-open-gap', 'px', val => {
        this.config.spikes.openGap = val;
        this.render();
      });
      this.bindSliderAndNumber('rng-closed-gap', 'num-closed-gap', 'lbl-closed-gap', 'px', val => {
        this.config.spikes.closedGap = val;
        this.render();
      });
      this.bindSliderAndNumber('rng-danger-width', 'num-danger-width', 'lbl-danger-width', 'px', val => {
        this.config.spikes.dangerWidth = val;
        this.render();
      });

      document.getElementById('chk-show-spiketeeth')?.addEventListener('change', e => {
        this.config.spikes.showSpikeTeeth = e.target.checked;
        this.render();
      });
      document.getElementById('col-hazard')?.addEventListener('input', e => {
        this.config.spikes.hazardColor = e.target.value;
        this.render();
      });
      document.getElementById('col-safe')?.addEventListener('input', e => {
        this.config.spikes.safeColor = e.target.value;
        this.render();
      });
      document.getElementById('btn-realign-poles')?.addEventListener('click', () => this.realignPolesEvenly());

      // CLAPPERS INSPECTOR CONTROLS
      document.getElementById('btn-side-left')?.addEventListener('click', () => {
        this.selectedClapperSide = 'left';
        document.getElementById('btn-side-left').className = 'btn-primary';
        document.getElementById('btn-side-right').className = '';
        document.getElementById('lbl-clapper-side-title').innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right"></i> Tọa Độ & Vị Trí Bên Trái';
        this.updateClappersUI();
        this.render();
      });
      document.getElementById('btn-side-right')?.addEventListener('click', () => {
        this.selectedClapperSide = 'right';
        document.getElementById('btn-side-right').className = 'btn-primary';
        document.getElementById('btn-side-left').className = '';
        document.getElementById('lbl-clapper-side-title').innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right"></i> Tọa Độ & Vị Trí Bên Phải';
        this.updateClappersUI();
        this.render();
      });

      const getCurClapper = () => this.config.objects.clappers[this.selectedClapperSide];

      document.getElementById('chk-clapper-visible')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.visible = e.target.checked; this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-x')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.x = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-y')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.y = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-ox')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.offsetX = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-oy')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.offsetY = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });

      this.bindSliderAndNumber('rng-clapper-scale', 'num-clapper-scale', 'lbl-clapper-scale', '', val => {
        const c = getCurClapper();
        if (c) { c.scale = parseFloat(val.toFixed(3)); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-scalex')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.scaleX = parseFloat(e.target.value); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-scaley')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.scaleY = parseFloat(e.target.value); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-w')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.width = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });
      document.getElementById('num-clapper-h')?.addEventListener('change', e => {
        const c = getCurClapper();
        if (c) { c.height = parseInt(e.target.value, 10); this.render(); this.saveDraftToStorage(); }
      });

      document.getElementById('btn-reset-clappers-pos')?.addEventListener('click', () => {
        const cl = this.config.objects.clappers;
        cl.left.x = 0; cl.left.y = 0; cl.left.offsetX = 0; cl.left.offsetY = 0; cl.left.scale = 1.0; cl.left.scaleX = 1.0; cl.left.scaleY = 1.0;
        cl.right.x = 836; cl.right.y = 0; cl.right.offsetX = 0; cl.right.offsetY = 0; cl.right.scale = 1.0; cl.right.scaleX = 1.0; cl.right.scaleY = 1.0;
        this.updateClappersUI();
        this.render();
        this.saveDraftToStorage();
        this.showToast('Đã đặt lại vị trí chuẩn của Người Cầm Sạp');
      });

      document.getElementById('btn-mirror-clapper')?.addEventListener('click', () => {
        const cl = this.config.objects.clappers;
        if (this.selectedClapperSide === 'left') {
          // Mirror Left to Right
          cl.right.y = cl.left.y;
          cl.right.offsetY = cl.left.offsetY;
          cl.right.scale = cl.left.scale;
          cl.right.scaleY = cl.left.scaleY;
          this.showToast('Đã sao chép thông số từ Bên Trái sang Bên Phải');
        } else {
          // Mirror Right to Left
          cl.left.y = cl.right.y;
          cl.left.offsetY = cl.right.offsetY;
          cl.left.scale = cl.right.scale;
          cl.left.scaleY = cl.right.scaleY;
          this.showToast('Đã sao chép thông số từ Bên Phải sang Bên Trái');
        }
        this.updateClappersUI();
        this.render();
        this.saveDraftToStorage();
      });

      // DAMAGE RULES CONTROLS
      [0, 1, 2, 3].forEach(bIdx => {
        document.getElementById(`chk-dmg-beat-${bIdx}`)?.addEventListener('change', e => {
          this.config.rules.damage.activeBeats[bIdx] = e.target.checked;
          this.saveDraftToStorage();
        });
      });

      this.bindSliderAndNumber('rng-dmg-win-start', 'num-dmg-win-start', 'lbl-dmg-win-start', '% nhịp', val => {
        this.config.rules.damage.windowStartPercent = val / 100;
        this.saveDraftToStorage();
      });
      this.bindSliderAndNumber('rng-dmg-win-end', 'num-dmg-win-end', 'lbl-dmg-win-end', '% nhịp', val => {
        this.config.rules.damage.windowEndPercent = val / 100;
        this.saveDraftToStorage();
      });

      document.getElementById('chk-dmg-on-spike')?.addEventListener('change', e => {
        this.config.rules.damage.triggerOnSpikeTouch = e.target.checked;
        this.saveDraftToStorage();
      });
      document.getElementById('chk-dmg-on-grounded')?.addEventListener('change', e => {
        this.config.rules.damage.triggerOnClosedSạpGrounded = e.target.checked;
        this.saveDraftToStorage();
      });
      document.getElementById('chk-dmg-on-wrong-lane')?.addEventListener('change', e => {
        this.config.rules.damage.triggerOnWrongLane = e.target.checked;
        this.saveDraftToStorage();
      });

      document.getElementById('sel-dmg-amount')?.addEventListener('change', e => {
        this.config.rules.damage.damageAmount = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });
      document.getElementById('num-dmg-invincible')?.addEventListener('change', e => {
        this.config.rules.damage.invincibilityDuration = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });
      document.getElementById('num-dmg-trip')?.addEventListener('change', e => {
        this.config.rules.damage.tripFallDuration = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });

      // Per-frame damage flags
      document.getElementById('chk-frame-dmg-spike')?.addEventListener('change', e => {
        const frame = this.getCurrentFrame();
        if (frame) { frame.causesDamageOnSpike = e.target.checked; this.saveDraftToStorage(); }
      });
      document.getElementById('chk-frame-dmg-ground')?.addEventListener('change', e => {
        const frame = this.getCurrentFrame();
        if (frame) { frame.causesDamageOnGround = e.target.checked; this.saveDraftToStorage(); }
      });

      // JUMP RULES CONTROLS
      const chkAnytime = document.getElementById('chk-jump-anytime');
      const panelRestricted = document.getElementById('panel-restricted-jump');

      const updateJumpRestrictedPanel = () => {
        const isFree = chkAnytime?.checked;
        this.config.rules.jump.allowAnytime = isFree;
        if (panelRestricted) {
          panelRestricted.style.opacity = isFree ? '0.45' : '1.0';
          panelRestricted.style.pointerEvents = isFree ? 'none' : 'auto';
        }
        this.saveDraftToStorage();
      };
      chkAnytime?.addEventListener('change', updateJumpRestrictedPanel);

      [0, 1, 2, 3].forEach(bIdx => {
        document.getElementById(`chk-jump-beat-${bIdx}`)?.addEventListener('change', e => {
          this.config.rules.jump.allowedBeats[bIdx] = e.target.checked;
          this.saveDraftToStorage();
        });
      });

      document.getElementById('num-jump-win-start')?.addEventListener('change', e => {
        this.config.rules.jump.windowStartPercent = parseInt(e.target.value, 10) / 100;
        this.saveDraftToStorage();
      });
      document.getElementById('num-jump-win-end')?.addEventListener('change', e => {
        this.config.rules.jump.windowEndPercent = parseInt(e.target.value, 10) / 100;
        this.saveDraftToStorage();
      });

      document.getElementById('num-rule-jump-height')?.addEventListener('change', e => {
        const val = parseInt(e.target.value, 10);
        this.config.rules.jump.jumpHeight = val;
        this.config.stage.jumpYOffset = val;
        this.saveDraftToStorage();
      });
      document.getElementById('num-rule-jump-duration')?.addEventListener('change', e => {
        this.config.rules.jump.jumpDuration = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });
      document.getElementById('num-jump-cooldown')?.addEventListener('change', e => {
        this.config.rules.jump.jumpCooldown = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });
      document.getElementById('num-jump-coyote')?.addEventListener('change', e => {
        this.config.rules.jump.coyoteBufferTime = parseInt(e.target.value, 10);
        this.saveDraftToStorage();
      });
      document.getElementById('chk-jump-require-ground')?.addEventListener('change', e => {
        this.config.rules.jump.requireGrounded = e.target.checked;
        this.saveDraftToStorage();
      });
      document.getElementById('chk-jump-double')?.addEventListener('change', e => {
        this.config.rules.jump.allowDoubleJump = e.target.checked;
        this.saveDraftToStorage();
      });

      document.getElementById('chk-frame-can-jump')?.addEventListener('change', e => {
        const frame = this.getCurrentFrame();
        if (frame) { frame.canJump = e.target.checked; this.saveDraftToStorage(); }
      });

      // Dancer Inputs
      this.bindSliderAndNumber('rng-dancer-scale', 'num-dancer-scale', 'lbl-dancer-scale', '', val => {
        this.config.objects.dancer.scale = parseFloat(val.toFixed(3));
        const frame = this.getCurrentFrame();
        if (frame) frame.scale = this.config.objects.dancer.scale;
        this.render();
      });
      document.getElementById('num-dancer-w')?.addEventListener('change', e => {
        this.config.objects.dancer.width = parseInt(e.target.value, 10);
        this.render();
      });
      document.getElementById('num-dancer-h')?.addEventListener('change', e => {
        this.config.objects.dancer.height = parseInt(e.target.value, 10);
        this.render();
      });
      document.getElementById('num-dancer-ox')?.addEventListener('change', e => {
        this.config.objects.dancer.offsetX = parseInt(e.target.value, 10);
        const frame = this.getCurrentFrame();
        if (frame) frame.offsetX = this.config.objects.dancer.offsetX;
        this.render();
      });
      document.getElementById('num-dancer-oy')?.addEventListener('change', e => {
        this.config.objects.dancer.offsetY = parseInt(e.target.value, 10);
        const frame = this.getCurrentFrame();
        if (frame) frame.offsetY = this.config.objects.dancer.offsetY;
        this.render();
      });
      this.bindSliderAndNumber('rng-jump-lift', 'num-jump-lift', 'lbl-jump-lift', 'px', val => {
        this.config.stage.jumpYOffset = val;
        this.config.rules.jump.jumpHeight = val;
      });

      // Foot Anchor
      document.getElementById('num-foot-x')?.addEventListener('change', e => {
        const val = parseInt(e.target.value, 10);
        this.config.objects.dancer.footAnchor.x = val;
        const frame = this.getCurrentFrame();
        if (frame) frame.footAnchor = { ...frame.footAnchor, x: val };
        this.render();
      });
      document.getElementById('num-foot-y')?.addEventListener('change', e => {
        const val = parseInt(e.target.value, 10);
        this.config.objects.dancer.footAnchor.y = val;
        const frame = this.getCurrentFrame();
        if (frame) frame.footAnchor = { ...frame.footAnchor, y: val };
        this.render();
      });
      this.bindSliderAndNumber('rng-foot-radius', 'num-foot-radius', 'lbl-foot-radius', 'px', val => {
        this.config.objects.dancer.footHitboxRadius = val;
        this.render();
      });
      document.getElementById('btn-pick-foot-anchor')?.addEventListener('click', () => {
        this.setTool('pick-foot');
        this.showToast('Click vào nhân vật trên canvas để đặt vị trí chân tiếp đất');
      });

      // Tab Landing Inputs
      this.bindSliderAndNumber('rng-landing-safe-l', 'num-landing-safe-l', 'lbl-landing-safe-l', 'px', val => {
        this.config.stage.safeLeftX = val;
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      this.bindSliderAndNumber('rng-landing-safe-r', 'num-landing-safe-r', 'lbl-landing-safe-r', 'px', val => {
        this.config.stage.safeRightX = val;
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      this.bindSliderAndNumber('rng-landing-floor-y', 'num-landing-floor-y', 'lbl-landing-floor-y', 'px', val => {
        this.config.stage.floorY = val;
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      this.bindSliderAndNumber('rng-landing-jump-lift', 'num-landing-jump-lift', 'lbl-landing-jump-lift', 'px', val => {
        this.config.stage.jumpYOffset = val;
        if (this.config.rules?.jump) this.config.rules.jump.jumpHeight = val;
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      this.bindSliderAndNumber('rng-landing-jump-dur', 'num-landing-jump-dur', 'lbl-landing-jump-dur', 'ms', val => {
        this.config.stage.jumpDuration = val;
        if (this.config.rules?.jump) this.config.rules.jump.jumpDuration = val;
        this.saveDraftToStorage();
      });

      document.getElementById('btn-realign-lanes')?.addEventListener('click', () => this.realignLanesEvenly());
      document.getElementById('btn-add-landing-lane')?.addEventListener('click', () => this.addLandingLane());

      // Stage / Lanes Inputs
      this.bindSliderAndNumber('rng-floor-y', 'num-floor-y', 'lbl-floor-y', 'px', val => {
        this.config.stage.floorY = val;
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      document.getElementById('num-safe-l')?.addEventListener('change', e => {
        this.config.stage.safeLeftX = parseInt(e.target.value, 10);
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      document.getElementById('num-safe-r')?.addEventListener('change', e => {
        this.config.stage.safeRightX = parseInt(e.target.value, 10);
        this.render();
        this.updateLandingUI();
        this.saveDraftToStorage();
      });
      [0, 1, 2, 3].forEach(laneIdx => {
        document.getElementById(`num-lane-${laneIdx}`)?.addEventListener('change', e => {
          this.config.stage.lanes[laneIdx] = parseInt(e.target.value, 10);
          this.render();
          this.updateLandingUI();
          this.saveDraftToStorage();
        });
      });

      // General Object Scale / Offset
      this.bindSliderAndNumber('rng-gen-scale', 'num-gen-scale', 'lbl-gen-scale', '', val => {
        const obj = this.config.objects[this.selectedObject];
        if (obj) { obj.scale = val; this.render(); }
      });
      document.getElementById('num-gen-ox')?.addEventListener('change', e => {
        const obj = this.config.objects[this.selectedObject];
        if (obj) { obj.offsetX = parseInt(e.target.value, 10); this.render(); }
      });
      document.getElementById('num-gen-oy')?.addEventListener('change', e => {
        const obj = this.config.objects[this.selectedObject];
        if (obj) { obj.offsetY = parseInt(e.target.value, 10); this.render(); }
      });

      // Frame Airborne Toggle
      document.getElementById('chk-frame-airborne')?.addEventListener('change', e => {
        const frame = this.getCurrentFrame();
        if (frame) {
          frame.isAirborne = e.target.checked;
          this.updateTimelineStrip();
          this.render();
        }
      });

      // Selected Zone Inspector
      document.getElementById('inp-zone-label')?.addEventListener('input', e => {
        const zone = this.getSelectedZoneObj();
        if (zone) { zone.label = e.target.value; this.renderZonesList(); this.render(); }
      });
      ['x', 'y', 'w', 'h'].forEach(prop => {
        document.getElementById(`inp-zone-${prop}`)?.addEventListener('change', e => {
          const zone = this.getSelectedZoneObj();
          if (zone) {
            const key = (prop === 'w') ? 'width' : (prop === 'h') ? 'height' : prop;
            zone[key] = parseInt(e.target.value, 10);
            this.render();
          }
        });
      });

      // Zone Buttons
      document.getElementById('btn-add-jumpable-zone')?.addEventListener('click', () => this.addNewZone('jumpable'));
      document.getElementById('btn-add-danger-zone')?.addEventListener('click', () => this.addNewZone('danger'));
      document.getElementById('btn-duplicate-zone')?.addEventListener('click', () => this.duplicateSelectedZone());
      document.getElementById('btn-delete-zone')?.addEventListener('click', () => this.deleteSelectedZone());
      document.getElementById('btn-auto-gen-zones')?.addEventListener('click', () => this.autoGenerateZonesFromPoles());
      document.getElementById('btn-copy-zones-next')?.addEventListener('click', () => this.copyZonesToNextFrame());
      document.getElementById('btn-apply-zones-all')?.addEventListener('click', () => this.applyZonesToAllFrames());

      // Toolbar Tools
      document.getElementById('tool-select')?.addEventListener('click', () => this.setTool('select'));
      document.getElementById('tool-draw-jumpable')?.addEventListener('click', () => this.setTool('draw-jumpable'));
      document.getElementById('tool-draw-danger')?.addEventListener('click', () => this.setTool('draw-danger'));
      document.getElementById('tool-pan')?.addEventListener('click', () => this.setTool('pan'));

      // Zoom Controls
      document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.setZoom(this.zoom * 1.15));
      document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.setZoom(this.zoom / 1.15));
      document.getElementById('btn-zoom-fit')?.addEventListener('click', () => this.fitToScreen());
      document.getElementById('btn-zoom-100')?.addEventListener('click', () => this.setZoom(1.0));

      // View Toggles
      document.getElementById('chk-view-jumpable')?.addEventListener('change', e => { this.viewToggles.jumpable = e.target.checked; this.render(); });
      document.getElementById('chk-view-danger')?.addEventListener('change', e => { this.viewToggles.danger = e.target.checked; this.render(); });
      document.getElementById('chk-view-foot')?.addEventListener('change', e => { this.viewToggles.foot = e.target.checked; this.render(); });
      document.getElementById('chk-view-lanes')?.addEventListener('change', e => { this.viewToggles.lanes = e.target.checked; this.render(); });
      document.getElementById('chk-view-landing')?.addEventListener('change', e => { this.viewToggles.landing = e.target.checked; this.render(); });
      document.getElementById('chk-view-grid')?.addEventListener('change', e => { this.viewToggles.grid = e.target.checked; this.render(); });

      // Canvas Mouse & Interaction
      const stage = document.getElementById('canvas-stage');
      stage.addEventListener('wheel', e => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        this.setZoom(this.zoom * factor);
      });
      stage.addEventListener('mousedown', e => this.handleCanvasMouseDown(e));
      window.addEventListener('mousemove', e => this.handleCanvasMouseMove(e));
      window.addEventListener('mouseup', e => this.handleCanvasMouseUp(e));

      // Animation Selection
      document.getElementById('sel-animation-clip')?.addEventListener('change', e => {
        this.activeAnimationId = e.target.value;
        this.currentFrameIndex = 0;
        this.fps = this.config.animations[this.activeAnimationId]?.frameRate || 9;
        document.getElementById('rng-fps').value = Math.max(1, Math.round(this.fps));
        document.getElementById('lbl-fps-val').textContent = `${Math.round(this.fps)} FPS`;
        this.updateAllUI();
        this.render();
      });

      // Timeline Playback
      document.getElementById('btn-play-pause')?.addEventListener('click', () => this.togglePlayPause());
      document.getElementById('btn-frame-first')?.addEventListener('click', () => this.gotoFrame(0));
      document.getElementById('btn-frame-last')?.addEventListener('click', () => {
        const anim = this.config.animations[this.activeAnimationId];
        if (anim) this.gotoFrame(anim.frames.length - 1);
      });
      document.getElementById('btn-frame-prev')?.addEventListener('click', () => this.prevFrame());
      document.getElementById('btn-frame-next')?.addEventListener('click', () => this.nextFrame());
      document.getElementById('rng-fps')?.addEventListener('input', e => {
        this.fps = parseInt(e.target.value, 10);
        document.getElementById('lbl-fps-val').textContent = `${this.fps} FPS`;
        if (this.config.animations[this.activeAnimationId]) {
          this.config.animations[this.activeAnimationId].frameRate = this.fps;
        }
        if (this.isPlaying) {
          this.stopPlayback();
          this.startPlayback();
        }
      });
      document.getElementById('chk-anim-loop')?.addEventListener('change', e => {
        this.isLooping = e.target.checked;
      });

      // Frame Management
      document.getElementById('btn-add-frame')?.addEventListener('click', () => this.addNewFrame());
      document.getElementById('btn-duplicate-frame')?.addEventListener('click', () => this.duplicateCurrentFrame());
      document.getElementById('btn-delete-frame')?.addEventListener('click', () => this.deleteCurrentFrame());

      // Header Actions
      document.getElementById('btn-toggle-playtest')?.addEventListener('click', () => this.togglePlaytestMode());
      document.getElementById('btn-save-server')?.addEventListener('click', () => this.saveConfigToServer());
      document.getElementById('btn-export-json')?.addEventListener('click', () => this.openExportModal());
      document.getElementById('btn-import-json')?.addEventListener('click', () => this.openImportModal());
      document.getElementById('btn-reset-default')?.addEventListener('click', () => this.resetToDefaults());

      // Presets
      document.getElementById('preset-select')?.addEventListener('change', e => this.loadPreset(e.target.value));

      // Modal Controls
      document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        document.getElementById('json-modal')?.classList.remove('open');
      });
      document.getElementById('btn-copy-json')?.addEventListener('click', () => {
        const txt = document.getElementById('modal-json-text').value;
        navigator.clipboard.writeText(txt).then(() => this.showToast('Đã sao chép JSON vào Clipboard!'));
      });
      document.getElementById('btn-apply-json')?.addEventListener('click', () => this.applyJsonFromModal());

      // Playtest Virtual Buttons
      document.getElementById('pt-key-left')?.addEventListener('click', () => this.handlePlaytestStep(-1));
      document.getElementById('pt-key-right')?.addEventListener('click', () => this.handlePlaytestStep(1));
      document.getElementById('pt-key-jump')?.addEventListener('click', () => this.handlePlaytestJump());
      document.getElementById('pt-key-down')?.addEventListener('click', () => this.handlePlaytestDown());

      // Keyboard Shortcuts
      window.addEventListener('keydown', e => this.handleGlobalKeydown(e));
    }

    bindSliderAndNumber(sliderId, numId, lblId, unit, callback) {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      const lbl = document.getElementById(lblId);

      const update = val => {
        val = parseFloat(val);
        if (slider) slider.value = val;
        if (num) num.value = val;
        if (lbl) lbl.textContent = unit ? `${val}${unit}` : val.toFixed(3);
        callback(val);
        this.saveDraftToStorage();
      };

      slider?.addEventListener('input', e => update(e.target.value));
      num?.addEventListener('change', e => update(e.target.value));
    }

    // --- TOOL & ZOOM MANAGEMENT ---
    setTool(tool) {
      this.activeTool = tool;
      document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(`tool-${tool}`);
      if (activeBtn) activeBtn.classList.add('active');

      const stage = document.getElementById('canvas-stage');
      stage.classList.remove('panning', 'drawing');
      if (tool === 'pan') stage.classList.add('panning');
      if (tool.startsWith('draw')) stage.classList.add('drawing');
    }

    setZoom(val) {
      this.zoom = Math.max(0.2, Math.min(2.5, val));
      const lbl = document.getElementById('lbl-zoom-val');
      if (lbl) lbl.textContent = `${Math.round(this.zoom * 100)}%`;
      this.updateCanvasTransform();
    }

    fitToScreen() {
      const stage = document.getElementById('canvas-stage');
      const availW = stage.clientWidth - 40;
      const availH = stage.clientHeight - 40;
      const scaleX = availW / this.canvas.width;
      const scaleY = availH / this.canvas.height;
      this.zoom = Math.min(scaleX, scaleY, 0.95);
      this.panX = 0;
      this.panY = 0;
      this.setZoom(this.zoom);
    }

    updateCanvasTransform() {
      this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    // --- CANVAS COORD CONVERSIONS ---
    clientToCanvasCoords(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / this.zoom;
      const y = (clientY - rect.top) / this.zoom;
      return { x: Math.round(x), y: Math.round(y) };
    }

    getCurrentFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim || !anim.frames) return null;
      return anim.frames[this.currentFrameIndex] || null;
    }

    getSelectedZoneObj() {
      if (!this.selectedZone) return null;
      const frame = this.getCurrentFrame();
      if (!frame) return null;
      const list = (this.selectedZone.type === 'jumpable') ? frame.jumpableZones : frame.nonJumpableZones;
      return list ? list[this.selectedZone.index] : null;
    }

    selectZone(type, index) {
      this.selectedZone = { type, index };
      const zone = this.getSelectedZoneObj();
      const inspector = document.getElementById('selected-zone-inspector');
      if (zone && inspector) {
        inspector.style.display = 'block';
        document.getElementById('inp-zone-label').value = zone.label || '';
        document.getElementById('inp-zone-x').value = zone.x;
        document.getElementById('inp-zone-y').value = zone.y;
        document.getElementById('inp-zone-w').value = zone.width;
        document.getElementById('inp-zone-h').value = zone.height;
      }
      this.renderZonesList();
      this.render();
    }

    clearZoneSelection() {
      this.selectedZone = null;
      const inspector = document.getElementById('selected-zone-inspector');
      if (inspector) inspector.style.display = 'none';
      this.renderZonesList();
      this.render();
    }

    // --- CRUD ZONES ---
    addNewZone(type, rect = null) {
      const frame = this.getCurrentFrame();
      if (!frame) return;
      if (!frame.jumpableZones) frame.jumpableZones = [];
      if (!frame.nonJumpableZones) frame.nonJumpableZones = [];

      const list = (type === 'jumpable') ? frame.jumpableZones : frame.nonJumpableZones;
      const count = list.length + 1;
      const newZone = rect ? {
        id: `${type}_${Date.now()}_${count}`,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        label: (type === 'jumpable') ? `Vùng Nhảy Mới ${count}` : `Spike Cấm Nhảy ${count}`
      } : {
        id: `${type}_${Date.now()}_${count}`,
        x: 500,
        y: 440,
        width: 140,
        height: 210,
        label: (type === 'jumpable') ? `Vùng Nhảy Mới ${count}` : `Spike Cấm Nhảy ${count}`
      };

      list.push(newZone);
      this.selectZone(type, list.length - 1);
      this.saveDraftToStorage();
      this.showToast(`Đã thêm ${newZone.label}`);
    }

    duplicateSelectedZone() {
      const zone = this.getSelectedZoneObj();
      if (!zone || !this.selectedZone) return;
      const frame = this.getCurrentFrame();
      const list = (this.selectedZone.type === 'jumpable') ? frame.jumpableZones : frame.nonJumpableZones;
      const cloned = JSON.parse(JSON.stringify(zone));
      cloned.id = `${this.selectedZone.type}_${Date.now()}`;
      cloned.x += 30;
      cloned.y += 10;
      cloned.label += ' (Bản sao)';
      list.push(cloned);
      this.selectZone(this.selectedZone.type, list.length - 1);
      this.saveDraftToStorage();
      this.showToast('Đã nhân bản vùng chọn');
    }

    deleteSelectedZone() {
      if (!this.selectedZone) return;
      const frame = this.getCurrentFrame();
      if (!frame) return;
      const list = (this.selectedZone.type === 'jumpable') ? frame.jumpableZones : frame.nonJumpableZones;
      if (list && list[this.selectedZone.index]) {
        list.splice(this.selectedZone.index, 1);
        this.clearZoneSelection();
        this.saveDraftToStorage();
        this.showToast('Đã xóa vùng');
      }
    }

    autoGenerateZonesFromPoles() {
      const frame = this.getCurrentFrame();
      if (!frame) return;
      const poles = this.config.spikes.poles;
      if (!poles || poles.length === 0) return;

      const floorY = this.config.stage.floorY;
      const zoneY = floorY - 110;
      const zoneH = 210;

      frame.jumpableZones = [];
      frame.nonJumpableZones = [];

      // Safe Left
      frame.jumpableZones.push({
        id: `safe_left_${Date.now()}`,
        x: 240,
        y: zoneY,
        width: 150,
        height: zoneH,
        label: 'Bờ trái an toàn'
      });

      // Poles (Spikes) & Lanes
      for (let i = 0; i < poles.length; i++) {
        const p = poles[i];
        frame.nonJumpableZones.push({
          id: `spike_pole_${i}_${Date.now()}`,
          x: p.baseX - 20,
          y: zoneY,
          width: 44,
          height: zoneH,
          label: `Spike ${p.name || `Cặp ${i+1}`}`
        });

        if (i < poles.length - 1) {
          const nextP = poles[i + 1];
          const laneLeft = p.baseX + 24;
          const laneRight = nextP.baseX - 20;
          const laneW = Math.max(40, laneRight - laneLeft);
          frame.jumpableZones.push({
            id: `lane_${i}_${Date.now()}`,
            x: laneLeft,
            y: zoneY,
            width: laneW,
            height: zoneH,
            label: `Luống ${i + 1} (Nhảy an toàn)`
          });
        }
      }

      // Safe Right
      frame.jumpableZones.push({
        id: `safe_right_${Date.now()}`,
        x: 1280,
        y: zoneY,
        width: 150,
        height: zoneH,
        label: 'Bờ phải an toàn'
      });

      this.clearZoneSelection();
      this.saveDraftToStorage();
      this.showToast('Đã tự động tính toán vùng nhảy & spike theo cặp sạp!');
    }

    copyZonesToNextFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      const curFrame = this.getCurrentFrame();
      if (!anim || !curFrame) return;

      const nextIdx = (this.currentFrameIndex + 1) % anim.frames.length;
      const nextFrame = anim.frames[nextIdx];
      if (nextFrame) {
        nextFrame.jumpableZones = JSON.parse(JSON.stringify(curFrame.jumpableZones || []));
        nextFrame.nonJumpableZones = JSON.parse(JSON.stringify(curFrame.nonJumpableZones || []));
        this.gotoFrame(nextIdx);
        this.saveDraftToStorage();
        this.showToast(`Đã sao chép cấu hình vùng sang Frame ${nextIdx}`);
      }
    }

    applyZonesToAllFrames() {
      const anim = this.config.animations[this.activeAnimationId];
      const curFrame = this.getCurrentFrame();
      if (!anim || !curFrame) return;

      const jCopy = JSON.stringify(curFrame.jumpableZones || []);
      const dCopy = JSON.stringify(curFrame.nonJumpableZones || []);

      anim.frames.forEach((f, idx) => {
        if (idx !== this.currentFrameIndex) {
          f.jumpableZones = JSON.parse(jCopy);
          f.nonJumpableZones = JSON.parse(dCopy);
        }
      });
      this.updateTimelineStrip();
      this.saveDraftToStorage();
      this.showToast(`Đã đồng bộ vùng nhảy cho toàn bộ ${anim.frames.length} frame!`);
    }

    realignPolesEvenly() {
      const poles = this.config.spikes.poles;
      if (!poles || poles.length === 0) return;
      const startX = 410;
      const endX = 1260;
      const step = (endX - startX) / (poles.length - 1);
      poles.forEach((p, idx) => {
        p.baseX = Math.round(startX + idx * step);
      });
      this.renderPolesList();
      this.saveDraftToStorage();
      this.render();
      this.showToast('Đã cân bằng đều khoảng cách các cây sạp');
    }

    // --- TIMELINE PLAYBACK & FRAME NAVIGATION ---
    gotoFrame(index) {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim || !anim.frames) return;
      this.currentFrameIndex = Math.max(0, Math.min(anim.frames.length - 1, index));
      this.clearZoneSelection();
      this.updateFrameInspectorUI();
      this.updateTimelineStrip();
      this.render();
    }

    nextFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim) return;
      const next = (this.currentFrameIndex + 1);
      if (next < anim.frames.length) {
        this.gotoFrame(next);
      } else if (this.isLooping) {
        this.gotoFrame(0);
      }
    }

    prevFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim) return;
      const prev = (this.currentFrameIndex - 1);
      if (prev >= 0) {
        this.gotoFrame(prev);
      } else if (this.isLooping) {
        this.gotoFrame(anim.frames.length - 1);
      }
    }

    togglePlayPause() {
      if (this.isPlaying) {
        this.stopPlayback();
      } else {
        this.startPlayback();
      }
    }

    startPlayback() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      const btn = document.getElementById('btn-play-pause');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        btn.classList.add('active');
      }
      const intervalMs = 1000 / Math.max(1, this.fps);
      this.playbackTimer = setInterval(() => {
        this.nextFrame();
      }, intervalMs);
    }

    stopPlayback() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      const btn = document.getElementById('btn-play-pause');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.classList.remove('active');
      }
      if (this.playbackTimer) {
        clearInterval(this.playbackTimer);
        this.playbackTimer = null;
      }
    }

    addNewFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim) return;
      const idx = anim.frames.length;
      const prev = anim.frames[idx - 1] || {};
      const newFrame = {
        index: idx,
        name: `Frame ${idx}`,
        scale: prev.scale || 0.38,
        offsetX: prev.offsetX || 0,
        offsetY: prev.offsetY || 20,
        isAirborne: prev.isAirborne || false,
        canJump: true,
        causesDamageOnSpike: true,
        causesDamageOnGround: true,
        footAnchor: prev.footAnchor ? { ...prev.footAnchor } : { x: 181, y: 710 },
        jumpableZones: prev.jumpableZones ? JSON.parse(JSON.stringify(prev.jumpableZones)) : [],
        nonJumpableZones: prev.nonJumpableZones ? JSON.parse(JSON.stringify(prev.nonJumpableZones)) : []
      };
      anim.frames.push(newFrame);
      anim.totalFrames = anim.frames.length;
      this.gotoFrame(idx);
      this.saveDraftToStorage();
      this.showToast(`Đã thêm Frame ${idx}`);
    }

    duplicateCurrentFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      const cur = this.getCurrentFrame();
      if (!anim || !cur) return;
      const cloned = JSON.parse(JSON.stringify(cur));
      cloned.index = anim.frames.length;
      cloned.name += ' (Copy)';
      anim.frames.push(cloned);
      anim.totalFrames = anim.frames.length;
      this.gotoFrame(anim.frames.length - 1);
      this.saveDraftToStorage();
      this.showToast('Đã nhân bản frame hiện tại');
    }

    deleteCurrentFrame() {
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim || anim.frames.length <= 1) {
        this.showToast('Không thể xóa frame duy nhất!');
        return;
      }
      anim.frames.splice(this.currentFrameIndex, 1);
      anim.frames.forEach((f, i) => f.index = i);
      anim.totalFrames = anim.frames.length;
      this.gotoFrame(Math.min(this.currentFrameIndex, anim.frames.length - 1));
      this.saveDraftToStorage();
      this.showToast('Đã xóa frame');
    }

    // --- CANVAS MOUSE & GIZMO EVENTS ---
    handleCanvasMouseDown(e) {
      if (this.isPlaytestActive) return;
      const stage = document.getElementById('canvas-stage');
      const coords = this.clientToCanvasCoords(e.clientX, e.clientY);

      // Pan Tool or Space Key
      if (this.activeTool === 'pan' || e.button === 1 || e.spaceKey) {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
        stage.classList.add('panning');
        return;
      }

      // Pick Foot Anchor Tool
      if (this.activeTool === 'pick-foot') {
        const frame = this.getCurrentFrame();
        const dancer = this.config.objects.dancer;
        const dw = dancer.width * dancer.scale;
        const dh = dancer.height * dancer.scale;
        const dx = 836 + (frame?.offsetX || dancer.offsetX) - dw / 2;
        const dy = this.config.stage.floorY + (frame?.offsetY || dancer.offsetY) - dh;

        const relX = Math.round((coords.x - dx) / dancer.scale);
        const relY = Math.round((coords.y - dy) / dancer.scale);

        dancer.footAnchor = { x: relX, y: relY };
        if (frame) frame.footAnchor = { x: relX, y: relY };
        document.getElementById('num-foot-x').value = relX;
        document.getElementById('num-foot-y').value = relY;

        this.setTool('select');
        this.render();
        this.saveDraftToStorage();
        this.showToast(`Đã gán điểm neo chân: (${relX}, ${relY})`);
        return;
      }

      // Draw Tool
      if (this.activeTool === 'draw-jumpable' || this.activeTool === 'draw-danger') {
        this.isDrawingZone = true;
        this.drawStart = coords;
        this.drawCurrent = coords;
        return;
      }

      // Select Tool: Check Handle Hits on Selected Zone first
      const selectedZoneObj = this.getSelectedZoneObj();
      if (selectedZoneObj) {
        const handle = this.hitTestResizeHandle(coords, selectedZoneObj);
        if (handle) {
          this.isResizingZone = true;
          this.activeResizeHandle = handle;
          this.dragStart = coords;
          this.dragInitialRect = { ...selectedZoneObj };
          return;
        }
      }

      // Check Click on Landing Markers (Ghim Điểm Rơi trên sàn)
      const landingHit = this.hitTestLandingMarker(coords);
      if (landingHit) {
        this.isDraggingLandingMarker = landingHit;
        this.dragStart = coords;
        const tabLanding = document.querySelector('.s-tab[data-tab="tab-landing"]');
        tabLanding?.click();
        return;
      }

      // Check Click on Any Zone
      const hit = this.hitTestZones(coords);
      if (hit) {
        this.selectZone(hit.type, hit.index);
        this.isDraggingZone = true;
        this.dragStart = coords;
        this.dragInitialRect = { ...hit.zone };
        return;
      }

      // Check Click on Clappers (Left or Right)
      const clapperHit = this.hitTestClappers(coords);
      if (clapperHit) {
        this.selectedObject = 'clappers';
        this.selectedClapperSide = clapperHit.side;
        document.getElementById('sel-target-object').value = 'clappers';
        const tabClap = document.querySelector('.s-tab[data-tab="tab-clappers"]');
        tabClap?.click();

        this.isDraggingClapper = true;
        this.dragStart = coords;
        const cl = this.config.objects.clappers[clapperHit.side];
        this.dragInitialRect = { ox: cl.offsetX || 0, oy: cl.offsetY || 0 };
        return;
      }

      // Check Click on Dancer
      if (this.hitTestDancer(coords)) {
        this.selectedObject = 'dancer';
        document.getElementById('sel-target-object').value = 'dancer';
        this.updateObjectSubpanels();
        this.isDraggingObject = true;
        this.dragStart = coords;
        const frame = this.getCurrentFrame();
        this.dragInitialRect = {
          ox: frame?.offsetX ?? this.config.objects.dancer.offsetX,
          oy: frame?.offsetY ?? this.config.objects.dancer.offsetY
        };
        return;
      }

      // Clicked on empty space: clear selection
      this.clearZoneSelection();
    }

    handleCanvasMouseMove(e) {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStart.x;
        this.panY = e.clientY - this.panStart.y;
        this.updateCanvasTransform();
        return;
      }

      const coords = this.clientToCanvasCoords(e.clientX, e.clientY);

      // Dragging Landing Marker (Kéo ghim điểm rơi)
      if (this.isDraggingLandingMarker) {
        const newX = Math.round(Math.max(100, Math.min(1572, coords.x)));
        if (this.isDraggingLandingMarker.type === 'safeLeft') {
          this.config.stage.safeLeftX = newX;
        } else if (this.isDraggingLandingMarker.type === 'safeRight') {
          this.config.stage.safeRightX = newX;
        } else if (this.isDraggingLandingMarker.type === 'lane') {
          this.config.stage.lanes[this.isDraggingLandingMarker.index] = newX;
        }
        if (this.isPlaytestActive && this.ptLane === this.isDraggingLandingMarker.index) {
          this.ptTargetX = newX;
        }
        this.updateLandingUI();
        this.render();
        return;
      }

      // Drawing new zone preview
      if (this.isDrawingZone) {
        this.drawCurrent = coords;
        this.render();
        return;
      }

      // Resizing Zone via Gizmo Handle
      if (this.isResizingZone && this.activeResizeHandle && this.dragInitialRect) {
        const dx = coords.x - this.dragStart.x;
        const dy = coords.y - this.dragStart.y;
        const zone = this.getSelectedZoneObj();
        if (zone) {
          const init = this.dragInitialRect;
          let nx = init.x;
          let ny = init.y;
          let nw = init.width;
          let nh = init.height;

          if (this.activeResizeHandle.includes('e')) nw = Math.max(16, init.width + dx);
          if (this.activeResizeHandle.includes('w')) {
            const potentialW = init.width - dx;
            if (potentialW >= 16) { nx = init.x + dx; nw = potentialW; }
          }
          if (this.activeResizeHandle.includes('s')) nh = Math.max(16, init.height + dy);
          if (this.activeResizeHandle.includes('n')) {
            const potentialH = init.height - dy;
            if (potentialH >= 16) { ny = init.y + dy; nh = potentialH; }
          }

          zone.x = Math.round(nx);
          zone.y = Math.round(ny);
          zone.width = Math.round(nw);
          zone.height = Math.round(nh);

          document.getElementById('inp-zone-x').value = zone.x;
          document.getElementById('inp-zone-y').value = zone.y;
          document.getElementById('inp-zone-w').value = zone.width;
          document.getElementById('inp-zone-h').value = zone.height;
          this.render();
        }
        return;
      }

      // Dragging entire Zone
      if (this.isDraggingZone && this.dragInitialRect) {
        const dx = coords.x - this.dragStart.x;
        const dy = coords.y - this.dragStart.y;
        const zone = this.getSelectedZoneObj();
        if (zone) {
          zone.x = Math.round(this.dragInitialRect.x + dx);
          zone.y = Math.round(this.dragInitialRect.y + dy);
          document.getElementById('inp-zone-x').value = zone.x;
          document.getElementById('inp-zone-y').value = zone.y;
          this.render();
        }
        return;
      }

      // Dragging Clappers
      if (this.isDraggingClapper && this.dragInitialRect) {
        const dx = coords.x - this.dragStart.x;
        const dy = coords.y - this.dragStart.y;
        const c = this.config.objects.clappers[this.selectedClapperSide];
        if (c) {
          c.offsetX = Math.round(this.dragInitialRect.ox + dx);
          c.offsetY = Math.round(this.dragInitialRect.oy + dy);
          document.getElementById('num-clapper-ox').value = c.offsetX;
          document.getElementById('num-clapper-oy').value = c.offsetY;
          this.render();
        }
        return;
      }

      // Dragging Dancer
      if (this.isDraggingObject && this.dragInitialRect) {
        const dx = coords.x - this.dragStart.x;
        const dy = coords.y - this.dragStart.y;
        const frame = this.getCurrentFrame();
        const newOX = Math.round(this.dragInitialRect.ox + dx);
        const newOY = Math.round(this.dragInitialRect.oy + dy);

        this.config.objects.dancer.offsetX = newOX;
        this.config.objects.dancer.offsetY = newOY;
        if (frame) {
          frame.offsetX = newOX;
          frame.offsetY = newOY;
        }
        document.getElementById('num-dancer-ox').value = newOX;
        document.getElementById('num-dancer-oy').value = newOY;
        this.render();
        return;
      }
    }

    handleCanvasMouseUp(e) {
      if (this.isPanning) {
        this.isPanning = false;
        document.getElementById('canvas-stage')?.classList.remove('panning');
      }

      if (this.isDrawingZone) {
        this.isDrawingZone = false;
        const minX = Math.min(this.drawStart.x, this.drawCurrent.x);
        const minY = Math.min(this.drawStart.y, this.drawCurrent.y);
        const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
        const h = Math.abs(this.drawCurrent.y - this.drawStart.y);

        if (w >= 14 && h >= 14) {
          const type = (this.activeTool === 'draw-jumpable') ? 'jumpable' : 'danger';
          this.addNewZone(type, { x: minX, y: minY, width: w, height: h });
        }
        this.setTool('select');
        this.render();
      }

      if (this.isDraggingLandingMarker) {
        this.isDraggingLandingMarker = null;
        this.saveDraftToStorage();
        this.updateLandingUI();
        this.render();
      }

      if (this.isDraggingZone || this.isResizingZone || this.isDraggingObject || this.isDraggingClapper) {
        this.isDraggingZone = false;
        this.isResizingZone = false;
        this.isDraggingObject = false;
        this.isDraggingClapper = false;
        this.activeResizeHandle = null;
        this.dragInitialRect = null;
        this.saveDraftToStorage();
      }
    }

    // --- HIT TESTS & HAZARDS ---
    hitTestLandingMarker(coords) {
      if (!this.viewToggles.landing) return null;
      const floorY = this.config.stage.floorY;
      const pinY = floorY + 36;
      const hitRadius = 24;

      // Safe Left
      if (Math.hypot(coords.x - this.config.stage.safeLeftX, coords.y - pinY) <= hitRadius) {
        return { type: 'safeLeft', name: 'Bờ Trái' };
      }
      // Safe Right
      if (Math.hypot(coords.x - this.config.stage.safeRightX, coords.y - pinY) <= hitRadius) {
        return { type: 'safeRight', name: 'Bờ Phải' };
      }
      // Lanes
      const lanes = this.config.stage.lanes || [];
      for (let i = 0; i < lanes.length; i++) {
        if (Math.hypot(coords.x - lanes[i], coords.y - pinY) <= hitRadius) {
          return { type: 'lane', index: i, name: `Luống ${i}` };
        }
      }
      return null;
    }

    getBambooHazardZones(beat = 0) {
      const cl = this.config.objects?.clappers;
      const clapperScale = cl?.scale !== undefined ? cl.scale : 0.50;
      const clapperX = (this.canvas.width - this.canvas.width * clapperScale) / 2 + (cl?.offsetX || 0);
      const ratio = clapperScale / 0.50;

      // 4 cặp sạp tre (mỗi cặp gồm 2 thanh tre khi mở, hoặc khép chặt khi nhịp 4)
      return [
        { min: Math.round(clapperX + 90 * ratio),  max: Math.round(clapperX + 183 * ratio), name: 'Cặp Sạp 1' },
        { min: Math.round(clapperX + 280 * ratio), max: Math.round(clapperX + 370 * ratio), name: 'Cặp Sạp 2' },
        { min: Math.round(clapperX + 470 * ratio), max: Math.round(clapperX + 559 * ratio), name: 'Cặp Sạp 3' },
        { min: Math.round(clapperX + 656 * ratio), max: Math.round(clapperX + 750 * ratio), name: 'Cặp Sạp 4' }
      ];
    }

    checkPointHitsBamboo(x) {
      const hazardZones = this.getBambooHazardZones(0);
      const footRadius = this.config.objects?.dancer?.footHitboxRadius || 14;
      const left = x - footRadius;
      const right = x + footRadius;
      return hazardZones.some(hz => right >= hz.min && left <= hz.max);
    }
    hitTestZones(pt) {
      const frame = this.getCurrentFrame();
      if (!frame) return null;

      if (frame.nonJumpableZones) {
        for (let i = frame.nonJumpableZones.length - 1; i >= 0; i--) {
          const z = frame.nonJumpableZones[i];
          if (pt.x >= z.x && pt.x <= z.x + z.width && pt.y >= z.y && pt.y <= z.y + z.height) {
            return { type: 'danger', index: i, zone: z };
          }
        }
      }

      if (frame.jumpableZones) {
        for (let i = frame.jumpableZones.length - 1; i >= 0; i--) {
          const z = frame.jumpableZones[i];
          if (pt.x >= z.x && pt.x <= z.x + z.width && pt.y >= z.y && pt.y <= z.y + z.height) {
            return { type: 'jumpable', index: i, zone: z };
          }
        }
      }
      return null;
    }

    hitTestResizeHandle(pt, rect) {
      const handleSize = 10 / this.zoom;
      const handles = {
        nw: { x: rect.x, y: rect.y },
        n:  { x: rect.x + rect.width / 2, y: rect.y },
        ne: { x: rect.x + rect.width, y: rect.y },
        e:  { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
        se: { x: rect.x + rect.width, y: rect.y + rect.height },
        s:  { x: rect.x + rect.width / 2, y: rect.y + rect.height },
        sw: { x: rect.x, y: rect.y + rect.height },
        w:  { x: rect.x, y: rect.y + rect.height / 2 }
      };

      for (const [key, pos] of Object.entries(handles)) {
        if (Math.abs(pt.x - pos.x) <= handleSize && Math.abs(pt.y - pos.y) <= handleSize) {
          return key;
        }
      }
      return null;
    }

    hitTestDancer(pt) {
      const frame = this.getCurrentFrame();
      const dancer = this.config.objects.dancer;
      const dw = dancer.width * dancer.scale;
      const dh = dancer.height * dancer.scale;
      const dx = 836 + (frame?.offsetX || dancer.offsetX) - dw / 2;
      const dy = this.config.stage.floorY + (frame?.offsetY || dancer.offsetY) - dh;
      return (pt.x >= dx && pt.x <= dx + dw && pt.y >= dy && pt.y <= dy + dh);
    }

    hitTestClappers(pt) {
      const cl = this.config.objects.clappers;
      if (!cl || !cl.splitMode) return null;

      // Check Left
      const l = cl.left;
      if (l && l.visible !== false) {
        const lx = l.x + (l.offsetX || 0);
        const ly = l.y + (l.offsetY || 0);
        const lw = l.width * (l.scale || 1.0) * (l.scaleX || 1.0);
        const lh = l.height * (l.scale || 1.0) * (l.scaleY || 1.0);
        if (pt.x >= lx && pt.x <= lx + lw && pt.y >= ly && pt.y <= ly + lh) {
          return { side: 'left' };
        }
      }

      // Check Right
      const r = cl.right;
      if (r && r.visible !== false) {
        const rx = r.x + (r.offsetX || 0);
        const ry = r.y + (r.offsetY || 0);
        const rw = r.width * (r.scale || 1.0) * (r.scaleX || 1.0);
        const rh = r.height * (r.scale || 1.0) * (r.scaleY || 1.0);
        if (pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh) {
          return { side: 'right' };
        }
      }
      return null;
    }

    // --- PLAYTEST MODE SIMULATION WITH ENHANCED JUMP & DAMAGE RULES ---
    togglePlaytestMode() {
      this.isPlaytestActive = !this.isPlaytestActive;
      const btn = document.getElementById('btn-toggle-playtest');
      const hud = document.getElementById('playtest-hud');
      const keys = document.getElementById('playtest-keys');

      if (this.isPlaytestActive) {
        btn?.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Dừng Chơi Thử';
        hud?.classList.add('active');
        keys?.classList.add('active');
        this.clearZoneSelection();
        this.startPlaytestLoop();
        this.audio.playBambooTap(0.6);
        this.showToast('Đã BẬT chế độ Chơi Thử! Dùng A/D (Trái/Phải) và SPACE (Nhảy)');
      } else {
        btn?.classList.remove('active');
        btn.innerHTML = '<i class="fa-solid fa-gamepad"></i> Chơi Thử (Playtest)';
        hud?.classList.remove('active');
        keys?.classList.remove('active');
        this.stopPlaytestLoop();
        this.render();
      }
    }

    startPlaytestLoop() {
      this.ptLane = 1;
      const lanes = this.config.stage.lanes || [657, 837, 1017];
      this.ptLane = Math.min(this.ptLane, lanes.length - 1);
      this.ptTargetX = lanes[this.ptLane] || 837;
      this.ptDancerX = this.ptTargetX;
      this.ptDancerY = this.config.stage.floorY;
      this.ptIsAirborne = false;
      this.ptJumpProgress = 0;
      this.ptJumpCooldownTimer = 0;
      this.ptIsTripped = false;
      this.ptTripTimer = 0;
      this.ptTripDuration = 1200;
      this.ptHearts = 3;
      this.ptBeat = 0;
      this.ptBeatTracker = 0;

      const heartEl = document.getElementById('pt-hearts-display');
      if (heartEl) heartEl.textContent = '❤️❤️❤️';

      let lastTime = performance.now();
      const tick = now => {
        if (!this.isPlaytestActive) return;
        const dt = Math.min(100, now - lastTime);
        lastTime = now;
        this.updatePlaytest(dt);
        this.render();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    stopPlaytestLoop() {
      this.isPlaytestActive = false;
    }

    updatePlaytest(dt) {
      // 2. Cooldown timer
      if (this.ptJumpCooldownTimer > 0) {
        this.ptJumpCooldownTimer -= dt;
      }

      // 3. Jump Arc with configured Height & Duration (Nhảy vòng cung chuẩn khoảng cách sạp)
      const jRules = this.config.rules?.jump || {};
      const jumpDur = jRules.jumpDuration || this.config.stage.jumpDuration || 400;
      const jumpLift = jRules.jumpHeight || this.config.stage.jumpYOffset || -90;

      if (this.ptIsAirborne) {
        this.ptJumpProgress += dt / jumpDur;
        if (this.ptJumpProgress >= 1) {
          this.ptIsAirborne = false;
          this.ptJumpProgress = 0;
          this.ptDancerX = this.ptTargetX;
          this.ptDancerY = this.config.stage.floorY;
          this.evaluateLandingCollision();
        } else {
          const t = this.ptJumpProgress;
          const startX = (this.ptJumpStartX !== undefined) ? this.ptJumpStartX : this.ptDancerX;
          this.ptDancerX = startX + (this.ptTargetX - startX) * t;
          const arc = Math.sin(t * Math.PI);
          this.ptDancerY = this.config.stage.floorY + jumpLift * arc;
        }
      } else {
        this.ptDancerX += (this.ptTargetX - this.ptDancerX) * 0.25;
        this.ptDancerY = this.config.stage.floorY;
      }

      // 4. Trip recovery
      if (this.ptIsTripped) {
        this.ptTripTimer -= dt;
        if (this.ptTripTimer <= 0) {
          this.ptIsTripped = false;
        }
      }

      // 5. Beat progression & Danger Window calculation
      const beatMs = (60 / (this.config.stage.bpm || 103)) * 1000;
      this.ptBeatTracker += dt;
      const beatPercent = Math.min(1.0, this.ptBeatTracker / beatMs);

      // Check Damage Window in real time during the beat!
      const dmgRules = this.config.rules?.damage || {};
      const isBeatHarmful = dmgRules.activeBeats ? dmgRules.activeBeats[this.ptBeat] : (this.ptBeat === 3);
      const isWithinDmgWindow = (beatPercent >= (dmgRules.windowStartPercent ?? 0.65) && beatPercent <= (dmgRules.windowEndPercent ?? 1.0));

      // Continuous Pole Collision in Playtest:
      // CHỈ MẤT MÁU KHI ĐÓNG SẠP (Nhịp 4) VÀ ĐỨNG TRÊN SẠP TRE! Vị trí xanh (giữa các cặp sạp / ngoài sạp) KHÔNG BỊ KẸP!
      if (isBeatHarmful && isWithinDmgWindow && !this.ptIsAirborne && !this.ptIsTripped) {
        const hazardZones = this.getBambooHazardZones(this.ptBeat);
        const footRadius = this.config.objects?.dancer?.footHitboxRadius || 14;
        const footLeft = this.ptDancerX - footRadius;
        const footRight = this.ptDancerX + footRadius;
        for (const hz of hazardZones) {
          if (footRight >= hz.min && footLeft <= hz.max) {
            this.triggerDamage(`SẠP ĐÓNG KẸP CHÂN TẠI ${hz.name.toUpperCase()}!`);
            break;
          }
        }
      }

      if (this.ptBeatTracker >= beatMs) {
        this.ptBeatTracker -= beatMs;
        this.ptBeat = (this.ptBeat + 1) % 4;

        if (this.ptBeat === 3) {
          this.audio.playBambooClack(0.9);
        } else {
          this.audio.playBambooTap(0.5);
        }
      }

      // 6. Update HUD elements
      const beatNames = ['Nhịp 1 · Mở', 'Nhịp 2 · Mở', 'Nhịp 3 · Mở', 'Nhịp 4 · ĐÓNG KHÉP'];
      const frameEl = document.getElementById('pt-frame-idx');
      const footXEl = document.getElementById('pt-foot-x');
      const beatPctEl = document.getElementById('pt-beat-pct');
      const needleEl = document.getElementById('pt-beat-needle');
      const dmgBarEl = document.getElementById('pt-damage-bar-segment');

      if (frameEl) frameEl.textContent = beatNames[this.ptBeat] || `Nhịp ${this.ptBeat + 1}`;
      if (footXEl) footXEl.textContent = `${Math.round(this.ptDancerX)}px`;
      if (beatPctEl) beatPctEl.textContent = `${Math.round(beatPercent * 100)}%`;
      if (needleEl) needleEl.style.left = `${beatPercent * 100}%`;
      if (dmgBarEl) {
        const start = (dmgRules.windowStartPercent ?? 0.65) * 100;
        const width = ((dmgRules.windowEndPercent ?? 1.0) - (dmgRules.windowStartPercent ?? 0.65)) * 100;
        dmgBarEl.style.left = `${start}%`;
        dmgBarEl.style.width = `${width}%`;
        dmgBarEl.style.display = isBeatHarmful ? 'block' : 'none';
      }
    }

    handlePlaytestStep(dir) {
      if (!this.isPlaytestActive || this.ptIsTripped) return;
      if (this.ptHearts <= 0) {
        this.ptHearts = 3;
        const heartEl = document.getElementById('pt-hearts-display');
        if (heartEl) heartEl.textContent = '❤️❤️❤️';
      }

      const lanes = this.config.stage.lanes || [];
      this.ptLane = Math.max(-1, Math.min(lanes.length, this.ptLane + dir));

      let nextX = this.config.stage.safeLeftX;
      if (this.ptLane >= 0 && this.ptLane < lanes.length) {
        nextX = lanes[this.ptLane];
      } else if (this.ptLane >= lanes.length) {
        nextX = this.config.stage.safeRightX;
      }

      this.ptJumpStartX = this.ptDancerX;
      this.ptTargetX = nextX;
      this.ptIsAirborne = true;
      this.ptJumpProgress = 0;
      this.audio.playBambooTap(0.4);
    }

    handlePlaytestJump() {
      if (!this.isPlaytestActive || this.ptIsTripped) return;
      if (this.ptHearts <= 0) {
        this.ptHearts = 3;
        const heartEl = document.getElementById('pt-hearts-display');
        if (heartEl) heartEl.textContent = '❤️❤️❤️';
      }

      const jRules = this.config.rules?.jump || {};
      const currentFrame = this.getCurrentFrame();

      // Check Grounded requirement
      if (jRules.requireGrounded !== false && this.ptIsAirborne && !jRules.allowDoubleJump) {
        return;
      }

      // Check Cooldown
      if (this.ptJumpCooldownTimer > 0) {
        this.showToast('Đang hồi chiêu nhảy!');
        return;
      }

      // Check Frame specific jump permission
      if (currentFrame && currentFrame.canJump === false) {
        this.showToast('🚫 Frame này bị cấm nhảy!');
        this.audio.playBambooTap(0.2);
        return;
      }

      // Check Rhythm Jump permission if not anytime
      if (!jRules.allowAnytime) {
        const isBeatAllowed = jRules.allowedBeats ? jRules.allowedBeats[this.ptBeat] : true;
        const beatMs = (60 / (this.config.stage.bpm || 103)) * 1000;
        const beatPercent = this.ptBeatTracker / beatMs;
        const isWindowAllowed = (beatPercent >= (jRules.windowStartPercent ?? 0.0) && beatPercent <= (jRules.windowEndPercent ?? 1.0));

        if (!isBeatAllowed || !isWindowAllowed) {
          this.showToast('🚫 CẤM NHẢY: Sai nhịp hoặc ngoài cửa sổ cho phép!');
          this.audio.playBambooTap(0.2);
          this.updatePlaytestStatus('danger', '🚫 CẤM NHẢY THỜI ĐIỂM NÀY');
          return;
        }
      }

      // Jump allowed!
      this.ptJumpStartX = this.ptDancerX;
      this.ptTargetX = this.ptDancerX;
      this.ptIsAirborne = true;
      this.ptJumpProgress = 0;
      this.ptJumpCooldownTimer = jRules.jumpCooldown || 0;
      this.audio.playJump();
      this.updatePlaytestStatus('airborne', '🔵 ĐANG BAY TRÊN KHÔNG');
    }

    handlePlaytestDown() {
      if (!this.isPlaytestActive || this.ptIsTripped) return;
      this.audio.playBambooTap(0.3);
      this.evaluateLandingCollision();
    }

    evaluateLandingCollision() {
      const frame = this.getCurrentFrame();
      const footX = this.ptDancerX;
      const footY = this.config.stage.floorY;
      const dmgRules = this.config.rules?.damage || {};

      // If in safe zones outside sạp: always safe
      if (this.ptLane === -1 || this.ptLane === this.config.stage.lanes.length) {
        this.updatePlaytestStatus('safe', '🟢 BỜ AN TOÀN');
        return;
      }

      // If Airborne: Safe!
      if (this.ptIsAirborne) {
        this.updatePlaytestStatus('airborne', '🔵 TRÊN KHÔNG');
        return;
      }

      // Check current frame non-jumpable zones
      let isHazard = false;
      let hazardName = '';

      // CHỈ KIỂM TRA VA CHẠM SẠP GÂY SÁT THƯƠNG KHI SẠP ĐÓNG (Nhịp 4 / Beat 3)
      const isHarmfulBeat = dmgRules.activeBeats ? dmgRules.activeBeats[this.ptBeat] : (this.ptBeat === 3);

      if (isHarmfulBeat) {
        // Bamboo hazard poles khi đóng khép
        const bambooZones = this.getBambooHazardZones(this.ptBeat);
        const footRadius = this.config.objects?.dancer?.footHitboxRadius || 14;
        for (const bz of bambooZones) {
          if (footX + footRadius >= bz.min && footX - footRadius <= bz.max) {
            isHazard = true;
            hazardName = `SẠP ĐÓNG KẸP CHÂN (${bz.name.toUpperCase()})!`;
            break;
          }
        }
      }

      if (!isHazard && dmgRules.triggerOnSpikeTouch !== false && frame?.nonJumpableZones && isHarmfulBeat) {
        for (const hz of frame.nonJumpableZones) {
          if (footX >= hz.x && footX <= hz.x + hz.width && footY >= hz.y && footY <= hz.y + hz.height) {
            isHazard = true;
            hazardName = hz.label;
            break;
          }
        }
      }

      if (isHazard) {
        this.triggerDamage(hazardName);
      } else {
        this.audio.playChime();
        this.updatePlaytestStatus('safe', '🟢 TIẾP ĐẤT AN TOÀN (+100)');
      }
    }

    triggerDamage(reason) {
      if (this.ptIsTripped) return;
      const dmgRules = this.config.rules?.damage || {};
      this.ptIsTripped = true;
      this.ptTripTimer = dmgRules.tripFallDuration || 1200;
      this.ptTripDuration = dmgRules.tripFallDuration || 1200;
      this.ptHearts = Math.max(0, (this.ptHearts !== undefined ? this.ptHearts : 3) - (dmgRules.damageAmount || 1));

      // Update hearts display in HUD
      const heartEl = document.getElementById('pt-hearts-display');
      if (heartEl) {
        const full = '❤️'.repeat(this.ptHearts);
        const lost = '🖤'.repeat(Math.max(0, 3 - this.ptHearts));
        heartEl.textContent = `${full}${lost}${this.ptHearts === 0 ? ' (HẾT MÁU!)' : ''}`;
      }

      this.audio.playTrip();
      this.updatePlaytestStatus('danger', `🔴 BỊ KẸP CHÂN: ${reason} (-${dmgRules.damageAmount || 1} ❤️)`);
      this.showToast(`❌ CẢNH BÁO MẤT ${dmgRules.damageAmount || 1} MÁU: ${reason}! (Còn ${this.ptHearts}/3 ❤️)`);

      if (this.ptHearts <= 0) {
        setTimeout(() => {
          this.updatePlaytestStatus('danger', '💀 ĐÃ HẾT MÁU - BẤM NHẢY HOẶC TRÁI/PHẢI ĐỂ THỬ LẠI');
        }, 1000);
      }
    }

    updatePlaytestStatus(type, text) {
      const pill = document.getElementById('pt-landing-status');
      if (pill) {
        pill.className = `status-pill ${type}`;
        pill.textContent = text;
      }
    }

    // --- RENDERING PIPELINE ---
    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.clearRect(0, 0, w, h);

      // 1. Background
      if (this.assets.valley) {
        this.ctx.drawImage(this.assets.valley, 0, 0, w, h);
      } else {
        this.ctx.fillStyle = '#22381f';
        this.ctx.fillRect(0, 0, w, h);
      }

      // 2. Beams (Đòn kê - thu nhỏ 50% cùng vị trí với hoạt ảnh sạp)
      if (this.assets.beams) {
        const cl = this.config.objects?.clappers;
        const clapperScale = cl?.scale !== undefined ? cl.scale : 0.50;
        const cw = w * clapperScale;
        const ch = h * clapperScale;
        const cx = (w - cw) / 2 + (cl?.offsetX || 0);
        const cy = (cl?.offsetY !== undefined) ? cl.offsetY : 280;

        if (clapperScale >= 0.98) {
          this.ctx.drawImage(this.assets.beams, 0, 0, w, h);
        } else {
          this.ctx.drawImage(this.assets.beams, 0, 0, w, h, cx, cy, cw, ch);
        }
      }

      // 3. Bamboo Poles / Spikes (5 Pairs)
      this.renderBambooPoles();

      // 4. Clappers (Đội gõ sạp)
      this.renderClappers();

      // 5. Floor & Lanes Guidelines
      if (this.viewToggles.lanes) {
        this.renderLanesOverlay();
      }

      // 6. Dancer
      this.renderDancer();

      // 7. Jumpable & Non-Jumpable Zones
      this.renderZones();

      // 8. Interactive Drawing Zone Preview
      if (this.isDrawingZone) {
        this.renderDrawingPreview();
      }

      // 9. Coordinate Grid Overlay
      if (this.viewToggles.grid) {
        this.renderGrid();
      }
    }

    renderBambooPoles() {
      const poles = this.config.spikes.poles;
      if (!poles || poles.length === 0) return;

      const floorY = this.config.stage.floorY;
      const poleW = this.config.spikes.poleWidth;
      const poleH = this.config.spikes.poleHeight;
      const isClosed = (this.isPlaytestActive && this.ptBeat === 3) || (this.getCurrentFrame()?.status === 'closed');
      const gap = isClosed ? this.config.spikes.closedGap : this.config.spikes.openGap;
      const showTeeth = this.config.spikes.showSpikeTeeth;
      const hazardColor = this.config.spikes.hazardColor || '#ef4444';

      poles.forEach((p, idx) => {
        const xLeft = p.baseX - gap / 2 - poleW;
        const xRight = p.baseX + gap / 2;
        const y = floorY - poleH * 0.35;

        // Draw Left Bamboo Pole
        this.drawBambooPoleBar(xLeft, y, poleW, poleH, showTeeth && isClosed, hazardColor, true);
        // Draw Right Bamboo Pole
        this.drawBambooPoleBar(xRight, y, poleW, poleH, showTeeth && isClosed, hazardColor, false);
      });
    }

    drawBambooPoleBar(x, y, w, h, hasTeeth, teethColor, isLeft) {
      this.ctx.save();
      const grad = this.ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, '#587a2a');
      grad.addColorStop(0.3, '#8ab342');
      grad.addColorStop(0.7, '#a9d458');
      grad.addColorStop(1, '#4c6c21');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, y, w, h);

      // Bamboo nodes
      this.ctx.fillStyle = 'rgba(40, 25, 10, 0.55)';
      const nodeStep = h / 5;
      for (let i = 1; i <= 4; i++) {
        this.ctx.fillRect(x - 2, y + i * nodeStep, w + 4, 4);
      }

      // Spike Teeth
      if (hasTeeth) {
        this.ctx.fillStyle = teethColor;
        const toothH = 16;
        const toothW = 8;
        const count = Math.floor(h / toothH);
        for (let i = 0; i < count; i++) {
          this.ctx.beginPath();
          const ty = y + i * toothH;
          if (isLeft) {
            this.ctx.moveTo(x + w, ty);
            this.ctx.lineTo(x + w + toothW, ty + toothH / 2);
            this.ctx.lineTo(x + w, ty + toothH);
          } else {
            this.ctx.moveTo(x, ty);
            this.ctx.lineTo(x - toothW, ty + toothH / 2);
            this.ctx.lineTo(x, ty + toothH);
          }
          this.ctx.fill();
        }
      }

      this.ctx.restore();
    }

    renderClappers() {
      let clapperImg = this.assets.clappers_mo_ha;
      if (this.isPlaytestActive) {
        if (this.ptBeat === 0) clapperImg = this.assets.clappers_mo_ha;
        else if (this.ptBeat === 1) clapperImg = this.assets.clappers_mo_nang;
        else if (this.ptBeat === 2) clapperImg = this.assets.clappers_mo_ha;
        else if (this.ptBeat === 3) clapperImg = this.assets.clappers_dong_ha;
      } else {
        const frame = this.getCurrentFrame();
        if (frame?.clapperSprite) {
          const key = frame.clapperSprite.split('/').pop().replace('.png', '');
          clapperImg = this.assets[key] || clapperImg;
        }
      }
      if (!clapperImg) return;

      const cl = this.config.objects.clappers;
      if (cl?.splitMode) {
        // Left Clappers
        const left = cl.left;
        if (left && left.visible !== false) {
          const lx = left.x + (left.offsetX || 0);
          const ly = left.y + (left.offsetY || 0);
          const lw = left.width * (left.scale || 1.0) * (left.scaleX || 1.0);
          const lh = left.height * (left.scale || 1.0) * (left.scaleY || 1.0);

          this.ctx.drawImage(clapperImg, left.sourceX || 0, left.sourceY || 0, left.sourceW || 836, left.sourceH || 941, lx, ly, lw, lh);

          if (this.selectedObject === 'clappers' && this.selectedClapperSide === 'left' && !this.isPlaytestActive) {
            this.drawGizmoBox({ x: lx, y: ly, width: lw, height: lh }, '#38bdf8', '👥 NGƯỜI CẦM SẠP (TRÁI)');
          }
        }

        // Right Clappers
        const right = cl.right;
        if (right && right.visible !== false) {
          const rx = right.x + (right.offsetX || 0);
          const ry = right.y + (right.offsetY || 0);
          const rw = right.width * (right.scale || 1.0) * (right.scaleX || 1.0);
          const rh = right.height * (right.scale || 1.0) * (right.scaleY || 1.0);

          this.ctx.drawImage(clapperImg, right.sourceX || 836, right.sourceY || 0, right.sourceW || 836, right.sourceH || 941, rx, ry, rw, rh);

          if (this.selectedObject === 'clappers' && this.selectedClapperSide === 'right' && !this.isPlaytestActive) {
            this.drawGizmoBox({ x: rx, y: ry, width: rw, height: rh }, '#38bdf8', '👥 NGƯỜI CẦM SẠP (PHẢI)');
          }
        }
      } else {
        const clapperScale = cl?.scale !== undefined ? cl.scale : 0.50;
        const cw = this.canvas.width * clapperScale;
        const ch = this.canvas.height * clapperScale;
        const cx = (this.canvas.width - cw) / 2 + (cl?.offsetX || 0);
        const cy = (cl?.offsetY !== undefined) ? cl.offsetY : 280;

        if (clapperScale >= 0.98) {
          this.ctx.drawImage(clapperImg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
          // Vẽ nguyên vẹn toàn bộ hoạt ảnh sạp (cả người cầm + sạp tre) thu nhỏ 50%
          this.ctx.drawImage(clapperImg, 0, 0, this.canvas.width, this.canvas.height, cx, cy, cw, ch);
        }

        if (this.selectedObject === 'clappers' && !this.isPlaytestActive) {
          this.drawGizmoBox({ x: cx, y: cy, width: cw, height: ch }, '#38bdf8', '👥 HOẠT ẢNH SẠP TOÀN PHẦN (50%)');
        }
      }
    }

    renderLanesOverlay() {
      this.ctx.save();
      const floorY = this.config.stage.floorY;
      const lanes = this.config.stage.lanes || [];

      // 1. Floor line
      this.ctx.strokeStyle = 'rgba(237, 195, 91, 0.45)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(80, floorY);
      this.ctx.lineTo(1592, floorY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Sạp đang ở trạng thái đóng hay mở? (Nhịp 4 / status 'closed' => Đóng; Nhịp 1, 2, 3 => Mở)
      const isSạpClosed = this.isPlaytestActive ? (this.ptBeat === 3) : (this.getCurrentFrame()?.status === 'closed');

      // 2. Helper to draw interactive Landing Pin Markers
      const drawLandingPin = (x, label, hitsBamboo, isHovered, isDragging) => {
        let color = '#10b981'; // Xanh ngọc - An toàn
        let statusText = '🟢 AN TOÀN';
        let subText = '';
        let pinIcon = '🎯';

        if (hitsBamboo) {
          if (isSạpClosed) {
            color = '#ef4444'; // Đỏ - Sát thương kẹp sạp khi đóng
            statusText = '🔴 SẠP ĐÓNG: MẤT MÁU!';
            pinIcon = '⚠️';
          } else {
            color = '#f59e0b'; // Vàng hổ phách - An toàn khi mở, kẹp khi đóng
            statusText = '⚡ KẸP KHI ĐÓNG SẠP';
            subText = '(Nhịp 4: Kẹp · Mở: An Toàn)';
            pinIcon = '⚡';
          }
        }

        const pinY = floorY + 36;

        this.ctx.save();
        // Vertical dashed guideline to floor
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = isDragging ? 2.5 : 1.5;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, floorY - 140);
        this.ctx.lineTo(x, pinY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Landing footprint target spot on floor
        this.ctx.beginPath();
        this.ctx.ellipse(x, floorY, 16, 7, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = hitsBamboo 
          ? (isSạpClosed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)') 
          : 'rgba(16, 185, 129, 0.35)';
        this.ctx.fill();
        this.ctx.strokeStyle = color;
        this.ctx.stroke();

        // Pin Handle
        this.ctx.beginPath();
        this.ctx.arc(x, pinY, isDragging ? 16 : 14, 0, Math.PI * 2);
        this.ctx.fillStyle = isDragging ? '#fff' : color;
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.stroke();

        // Pin Icon
        this.ctx.fillStyle = isDragging ? color : '#fff';
        this.ctx.font = '900 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(pinIcon, x, pinY);

        // Label Badge
        this.ctx.font = '700 10px "Be Vietnam Pro"';
        const txt = `${label} (${Math.round(x)}px)`;
        const tw = this.ctx.measureText(txt).width;
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(x - tw / 2 - 6, pinY + 16, tw + 12, 18);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - tw / 2 - 6, pinY + 16, tw + 12, 18);

        this.ctx.fillStyle = color;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(txt, x, pinY + 20);

        if (hitsBamboo) {
          this.ctx.fillStyle = isSạpClosed ? '#f87171' : '#fbbf24';
          this.ctx.font = '800 9px "Be Vietnam Pro"';
          this.ctx.fillText(statusText, x, pinY + 36);
          if (subText) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '600 8px "Be Vietnam Pro"';
            this.ctx.fillText(subText, x, pinY + 48);
          }
        }

        this.ctx.restore();
      };

      // Draw Safe Left Pin
      const hitsLeft = this.checkPointHitsBamboo(this.config.stage.safeLeftX);
      const isLDrag = this.isDraggingLandingMarker?.type === 'safeLeft';
      drawLandingPin(this.config.stage.safeLeftX, 'BỜ TRÁI', hitsLeft, false, isLDrag);

      // Draw Lanes Pins
      lanes.forEach((lx, idx) => {
        const hitsBamboo = this.checkPointHitsBamboo(lx);
        const isDrag = this.isDraggingLandingMarker?.type === 'lane' && this.isDraggingLandingMarker.index === idx;
        drawLandingPin(lx, `LUỐNG ${idx}`, hitsBamboo, false, isDrag);
      });

      // Draw Safe Right Pin
      const hitsRight = this.checkPointHitsBamboo(this.config.stage.safeRightX);
      const isRDrag = this.isDraggingLandingMarker?.type === 'safeRight';
      drawLandingPin(this.config.stage.safeRightX, 'BỜ PHẢI', hitsRight, false, isRDrag);

      this.ctx.restore();
    }

    renderDancer() {
      const dancer = this.config.objects.dancer;
      const frame = this.getCurrentFrame();
      const scale = frame?.scale || dancer.scale || 0.20;

      let posX = this.isPlaytestActive ? this.ptDancerX : (836 + (frame?.offsetX || dancer.offsetX));
      let posY = this.isPlaytestActive ? this.ptDancerY : (this.config.stage.floorY + (frame?.offsetY || dancer.offsetY));

      let animKey = this.activeAnimationId;
      let spriteSheet = this.assets[animKey] || this.assets.dancer_forward;
      let fIndex = this.currentFrameIndex;

      if (this.isPlaytestActive) {
        if (this.ptIsTripped) {
          animKey = 'dancer_trip';
          spriteSheet = this.assets.dancer_trip;
          const progress = Math.max(0, Math.min(1, 1 - (this.ptTripTimer / (this.ptTripDuration || 1200))));
          fIndex = Math.min(5, Math.floor(progress * 6));
        } else if (this.ptIsAirborne) {
          fIndex = Math.min(5, Math.floor(this.ptJumpProgress * 6));
        } else {
          fIndex = (Math.floor(Date.now() / 110)) % 6;
        }
      }

      const framesList = SPRITE_FRAMES[animKey] || SPRITE_FRAMES.dancer_forward;
      const fDef = framesList[fIndex] || framesList[0];
      const dw = fDef.sw * scale;
      const dh = fDef.sh * scale;
      const dx = posX - fDef.footX * scale;
      const dy = posY - fDef.footY * scale;

      // Shadow
      this.ctx.save();
      this.ctx.beginPath();
      const shadowW = dw * (dancer.shadowWidthRatio || 0.50);
      const shadowH = dancer.shadowHeight || 10;
      this.ctx.ellipse(posX, this.config.stage.floorY + 4, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(15, 10, 5, 0.45)';
      this.ctx.fill();
      this.ctx.restore();

      // Flashing Red Glow when Tripped
      if (this.isPlaytestActive && this.ptIsTripped) {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
        this.ctx.shadowBlur = 24;
      }

      // Dancer Sprite Frame (cắt chính xác từng frame, Zero Bleed)
      if (spriteSheet) {
        this.ctx.drawImage(spriteSheet, fDef.sx, fDef.sy, fDef.sw, fDef.sh, dx, dy, dw, dh);
      } else {
        this.ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
        this.ctx.fillRect(dx, dy, dw, dh);
      }

      if (this.isPlaytestActive && this.ptIsTripped) {
        this.ctx.restore();
      }

      // Foot Anchor Marker & Plumb line
      if (this.viewToggles.foot) {
        const foot = frame?.footAnchor || dancer.footAnchor;
        const footWorldX = dx + foot.x * scale;
        const footWorldY = dy + foot.y * scale;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(footWorldX, footWorldY);
        this.ctx.lineTo(footWorldX, this.config.stage.floorY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(footWorldX, footWorldY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([]);
        this.ctx.stroke();

        const radius = (dancer.footHitboxRadius || 14) * scale;
        this.ctx.beginPath();
        this.ctx.arc(footWorldX, footWorldY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Live Warning if standing touching bamboo while in Edit Mode
      if (!this.isPlaytestActive) {
        const footX = posX;
        const hitsBamboo = this.checkPointHitsBamboo(footX);
        const isClosed = this.getCurrentFrame()?.status === 'closed';
        if (hitsBamboo) {
          this.ctx.save();
          if (isClosed) {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.92)';
            this.ctx.strokeStyle = '#ef4444';
            const warnText = '🔴 SẠP ĐÓNG: DÍNH SÁT THƯƠNG MẤT MÁU!';
            this.ctx.lineWidth = 1.5;
            this.ctx.font = '800 11px "Be Vietnam Pro"';
            const tw = this.ctx.measureText(warnText).width;
            this.ctx.fillRect(footX - tw / 2 - 8, this.config.stage.floorY + 12, tw + 16, 22);
            this.ctx.strokeRect(footX - tw / 2 - 8, this.config.stage.floorY + 12, tw + 16, 22);
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(warnText, footX, this.config.stage.floorY + 23);
          } else {
            this.ctx.fillStyle = 'rgba(245, 158, 11, 0.92)';
            this.ctx.strokeStyle = '#f59e0b';
            const warnText = '⚡ SẠP ĐANG MỞ: AN TOÀN · SẼ KẸP KHI ĐÓNG (NHỊP 4)';
            this.ctx.lineWidth = 1.5;
            this.ctx.font = '800 11px "Be Vietnam Pro"';
            const tw = this.ctx.measureText(warnText).width;
            this.ctx.fillRect(footX - tw / 2 - 8, this.config.stage.floorY + 12, tw + 16, 22);
            this.ctx.strokeRect(footX - tw / 2 - 8, this.config.stage.floorY + 12, tw + 16, 22);
            this.ctx.fillStyle = '#0f172a';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(warnText, footX, this.config.stage.floorY + 23);
          }
          this.ctx.restore();
        }
      }

      // Dancer Gizmo Box if Selected
      if (this.selectedObject === 'dancer' && !this.isPlaytestActive) {
        this.drawGizmoBox({ x: dx, y: dy, width: dw, height: dh }, '#38bdf8', '💃 NHÂN VẬT DANCER');
      }
    }

    renderZones() {
      const frame = this.getCurrentFrame();
      if (!frame) return;

      // 1. Jumpable Zones (Green)
      if (this.viewToggles.jumpable && frame.jumpableZones) {
        frame.jumpableZones.forEach((z, idx) => {
          const isSelected = (this.selectedZone?.type === 'jumpable' && this.selectedZone.index === idx);
          this.drawZoneBox(z, '#10b981', 'rgba(16, 185, 129, 0.22)', isSelected, '✓ NHẢY ĐƯỢC');
        });
      }

      // 2. Non-Jumpable / Spike Hazard Zones (Red)
      if (this.viewToggles.danger && frame.nonJumpableZones) {
        frame.nonJumpableZones.forEach((z, idx) => {
          const isSelected = (this.selectedZone?.type === 'danger' && this.selectedZone.index === idx);
          this.drawZoneBox(z, '#ef4444', 'rgba(239, 68, 68, 0.32)', isSelected, '⛔ SPIKE / CẤM NHẢY', true);
        });
      }
    }

    drawZoneBox(rect, borderColor, fillColor, isSelected, badgeText, hasStripes = false) {
      this.ctx.save();
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      if (hasStripes) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
        this.ctx.clip();
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
        this.ctx.lineWidth = 4;
        const step = 20;
        for (let x = rect.x - rect.height; x < rect.x + rect.width; x += step) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, rect.y + rect.height);
          this.ctx.lineTo(x + rect.height, rect.y);
          this.ctx.stroke();
        }
        this.ctx.restore();
      }

      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = isSelected ? 2.5 : 1.2;
      if (isSelected) {
        this.ctx.shadowColor = borderColor;
        this.ctx.shadowBlur = 8;
      }
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = borderColor;
      this.ctx.font = '800 10px "Be Vietnam Pro"';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${badgeText}: ${rect.label || ''}`, rect.x + 6, rect.y + 14);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = '600 9px "JetBrains Mono"';
      this.ctx.fillText(`${rect.width}×${rect.height}`, rect.x + 6, rect.y + rect.height - 6);

      if (isSelected && !this.isPlaytestActive) {
        this.drawGizmoHandles(rect, borderColor);
      }
      this.ctx.restore();
    }

    drawGizmoBox(rect, color, title) {
      this.ctx.save();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      this.ctx.fillStyle = color;
      this.ctx.font = '800 10px "Be Vietnam Pro"';
      this.ctx.fillText(title, rect.x + 4, rect.y - 6);

      this.drawGizmoHandles(rect, color);
      this.ctx.restore();
    }

    drawGizmoHandles(rect, color) {
      const handleSize = 7;
      const handles = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width / 2, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x + rect.width / 2, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height / 2 }
      ];

      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;

      handles.forEach(h => {
        this.ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        this.ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      });
    }

    renderDrawingPreview() {
      const minX = Math.min(this.drawStart.x, this.drawCurrent.x);
      const minY = Math.min(this.drawStart.y, this.drawCurrent.y);
      const w = Math.abs(this.drawCurrent.x - this.drawStart.x);
      const h = Math.abs(this.drawCurrent.y - this.drawStart.y);
      const isJumpable = (this.activeTool === 'draw-jumpable');

      this.ctx.save();
      this.ctx.fillStyle = isJumpable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.35)';
      this.ctx.fillRect(minX, minY, w, h);
      this.ctx.strokeStyle = isJumpable ? '#10b981' : '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(minX, minY, w, h);
      this.ctx.restore();
    }

    renderGrid() {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < this.canvas.width; x += step) {
        this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
      }
      for (let y = 0; y < this.canvas.height; y += step) {
        this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // --- SIDEBAR UI UPDATES ---
    updateAllUI() {
      this.updateLandingUI();
      this.updateSpikesUI();
      this.updateClappersUI();
      this.updateRulesUI();
      this.updateObjectSubpanels();
      this.updateFrameInspectorUI();
      this.renderPolesList();
      this.renderZonesList();
      this.updateTimelineStrip();
    }

    updateLandingUI() {
      const stage = this.config.stage;
      this.setVal('rng-landing-safe-l', 'num-landing-safe-l', 'lbl-landing-safe-l', stage.safeLeftX, 'px');
      this.setVal('rng-landing-safe-r', 'num-landing-safe-r', 'lbl-landing-safe-r', stage.safeRightX, 'px');
      this.setVal('rng-landing-floor-y', 'num-landing-floor-y', 'lbl-landing-floor-y', stage.floorY, 'px');
      this.setVal('rng-landing-jump-lift', 'num-landing-jump-lift', 'lbl-landing-jump-lift', stage.jumpYOffset || -90, 'px');
      this.setVal('rng-landing-jump-dur', 'num-landing-jump-dur', 'lbl-landing-jump-dur', stage.jumpDuration || 400, 'ms');

      // Sạp đang ở trạng thái đóng hay mở?
      const isSạpClosed = this.isPlaytestActive ? (this.ptBeat === 3) : (this.getCurrentFrame()?.status === 'closed');

      // Update Safety badges for safe borders
      const isSafeLHazard = this.checkPointHitsBamboo(stage.safeLeftX);
      const badgeL = document.getElementById('badge-landing-safe-l');
      if (badgeL) {
        if (!isSafeLHazard) {
          badgeL.className = 'fc-badge safe';
          badgeL.textContent = '🟢 AN TOÀN';
        } else if (isSạpClosed) {
          badgeL.className = 'fc-badge danger';
          badgeL.textContent = '🔴 SẠP ĐÓNG';
        } else {
          badgeL.className = 'fc-badge warning';
          badgeL.textContent = '⚡ KẸP KHI ĐÓNG';
        }
      }

      const isSafeRHazard = this.checkPointHitsBamboo(stage.safeRightX);
      const badgeR = document.getElementById('badge-landing-safe-r');
      if (badgeR) {
        if (!isSafeRHazard) {
          badgeR.className = 'fc-badge safe';
          badgeR.textContent = '🟢 AN TOÀN';
        } else if (isSạpClosed) {
          badgeR.className = 'fc-badge danger';
          badgeR.textContent = '🔴 SẠP ĐÓNG';
        } else {
          badgeR.className = 'fc-badge warning';
          badgeR.textContent = '⚡ KẸP KHI ĐÓNG';
        }
      }

      // Render lanes dynamic list
      const container = document.getElementById('landing-lanes-container');
      if (!container) return;
      container.innerHTML = '';

      stage.lanes.forEach((lx, idx) => {
        const hitsBamboo = this.checkPointHitsBamboo(lx);
        const card = document.createElement('div');
        card.className = 'panel-section';
        card.style.marginBottom = '8px';

        let badgeClass = 'safe';
        let badgeLabel = '🟢 AN TOÀN';
        let cardBg = 'rgba(16, 185, 129, 0.08)';
        let cardBorder = 'rgba(16, 185, 129, 0.35)';
        let titleColor = '#34d399';

        if (hitsBamboo) {
          if (isSạpClosed) {
            badgeClass = 'danger';
            badgeLabel = '🔴 SẠP ĐÓNG (MẤT MÁU)';
            cardBg = 'rgba(239, 68, 68, 0.12)';
            cardBorder = 'rgba(239, 68, 68, 0.5)';
            titleColor = '#f87171';
          } else {
            badgeClass = 'warning';
            badgeLabel = '⚡ KẸP KHI ĐÓNG (NHỊP 4)';
            cardBg = 'rgba(245, 158, 11, 0.10)';
            cardBorder = 'rgba(245, 158, 11, 0.40)';
            titleColor = '#fbbf24';
          }
        }

        card.style.background = cardBg;
        card.style.borderColor = cardBorder;

        card.innerHTML = `
          <div class="sec-header" style="margin-bottom: 6px;">
            <span class="sec-title" style="color: ${titleColor}; font-size: 11px;">
              <i class="fa-solid fa-crosshairs"></i> Luống ${idx} ${idx === 1 ? '(Tâm Sàn)' : ''}
            </span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="fc-badge ${badgeClass}">
                ${badgeLabel}
              </span>
              ${stage.lanes.length > 1 ? `<button class="btn-icon-xs btn-del-lane" data-lane="${idx}" style="color: #f87171; background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4);" title="Xóa luống này"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <div class="slider-row">
              <input type="range" class="rng-lane-val" data-lane="${idx}" min="300" max="1400" step="1" value="${lx}">
              <input type="number" class="num-val num-lane-val" data-lane="${idx}" value="${lx}">
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // Bind events to newly created inputs
      container.querySelectorAll('.rng-lane-val').forEach(rng => {
        rng.addEventListener('input', e => {
          const lIdx = parseInt(e.target.dataset.lane, 10);
          const val = parseInt(e.target.value, 10);
          stage.lanes[lIdx] = val;
          const numInput = container.querySelector(`.num-lane-val[data-lane="${lIdx}"]`);
          if (numInput) numInput.value = val;
          this.render();
          this.saveDraftToStorage();
        });
        rng.addEventListener('change', () => {
          this.updateLandingUI();
        });
      });

      container.querySelectorAll('.num-lane-val').forEach(num => {
        num.addEventListener('change', e => {
          const lIdx = parseInt(e.target.dataset.lane, 10);
          const val = parseInt(e.target.value, 10);
          stage.lanes[lIdx] = val;
          this.render();
          this.updateLandingUI();
          this.saveDraftToStorage();
        });
      });

      container.querySelectorAll('.btn-del-lane').forEach(btn => {
        btn.addEventListener('click', e => {
          const lIdx = parseInt(e.currentTarget.dataset.lane, 10);
          if (stage.lanes.length > 1) {
            stage.lanes.splice(lIdx, 1);
            this.render();
            this.updateLandingUI();
            this.saveDraftToStorage();
            this.showToast(`Đã xóa Luống ${lIdx}`);
          }
        });
      });
    }

    realignLanesEvenly() {
      const stage = this.config.stage;
      const numLanes = stage.lanes.length;
      if (numLanes <= 0) return;
      const span = stage.safeRightX - stage.safeLeftX;
      const step = span / (numLanes + 1);
      stage.lanes = stage.lanes.map((_, i) => Math.round(stage.safeLeftX + step * (i + 1)));
      this.updateLandingUI();
      this.render();
      this.saveDraftToStorage();
      this.showToast(`Đã cân bằng đều ${numLanes} luống nhảy!`);
    }

    addLandingLane() {
      const stage = this.config.stage;
      const lastX = stage.lanes.length > 0 ? stage.lanes[stage.lanes.length - 1] : stage.safeLeftX;
      const newX = Math.min(stage.safeRightX - 40, lastX + 120);
      stage.lanes.push(newX);
      this.updateLandingUI();
      this.render();
      this.saveDraftToStorage();
      this.showToast(`Đã thêm Luống ${stage.lanes.length - 1} tại X = ${newX}px`);
    }

    updateSpikesUI() {
      const sp = this.config.spikes;
      this.setVal('rng-pole-width', 'num-pole-width', 'lbl-pole-width', sp.poleWidth, 'px');
      this.setVal('rng-pole-height', 'num-pole-height', 'lbl-pole-height', sp.poleHeight, 'px');
      this.setVal('rng-open-gap', 'num-open-gap', 'lbl-open-gap', sp.openGap, 'px');
      this.setVal('rng-closed-gap', 'num-closed-gap', 'lbl-closed-gap', sp.closedGap, 'px');
      this.setVal('rng-danger-width', 'num-danger-width', 'lbl-danger-width', sp.dangerWidth, 'px');

      const chkTeeth = document.getElementById('chk-show-spiketeeth');
      if (chkTeeth) chkTeeth.checked = sp.showSpikeTeeth || false;
      const colHaz = document.getElementById('col-hazard');
      if (colHaz) colHaz.value = sp.hazardColor || '#ef4444';
      const colSafe = document.getElementById('col-safe');
      if (colSafe) colSafe.value = sp.safeColor || '#10b981';
    }

    updateClappersUI() {
      const cl = this.config.objects.clappers;
      if (!cl) return;
      const cur = cl[this.selectedClapperSide] || cl.left;
      if (!cur) return;

      const chkVis = document.getElementById('chk-clapper-visible');
      if (chkVis) chkVis.checked = (cur.visible !== false);

      document.getElementById('num-clapper-x').value = cur.x || 0;
      document.getElementById('num-clapper-y').value = cur.y || 0;
      document.getElementById('num-clapper-ox').value = cur.offsetX || 0;
      document.getElementById('num-clapper-oy').value = cur.offsetY || 0;

      this.setVal('rng-clapper-scale', 'num-clapper-scale', 'lbl-clapper-scale', cur.scale || 1.0);
      document.getElementById('num-clapper-scalex').value = cur.scaleX || 1.0;
      document.getElementById('num-clapper-scaley').value = cur.scaleY || 1.0;
      document.getElementById('num-clapper-w').value = cur.width || 836;
      document.getElementById('num-clapper-h').value = cur.height || 941;
    }

    updateRulesUI() {
      const rules = this.config.rules;
      if (!rules) return;

      // Damage Rules
      const dmg = rules.damage || {};
      [0, 1, 2, 3].forEach(bIdx => {
        const chk = document.getElementById(`chk-dmg-beat-${bIdx}`);
        if (chk) chk.checked = dmg.activeBeats ? dmg.activeBeats[bIdx] : (bIdx === 3);
      });

      this.setVal('rng-dmg-win-start', 'num-dmg-win-start', 'lbl-dmg-win-start', Math.round((dmg.windowStartPercent ?? 0.65) * 100), '% nhịp');
      this.setVal('rng-dmg-win-end', 'num-dmg-win-end', 'lbl-dmg-win-end', Math.round((dmg.windowEndPercent ?? 1.00) * 100), '% nhịp');

      const chkSpike = document.getElementById('chk-dmg-on-spike');
      if (chkSpike) chkSpike.checked = (dmg.triggerOnSpikeTouch !== false);
      const chkGrounded = document.getElementById('chk-dmg-on-grounded');
      if (chkGrounded) chkGrounded.checked = (dmg.triggerOnClosedSạpGrounded !== false);
      const chkWrongLane = document.getElementById('chk-dmg-on-wrong-lane');
      if (chkWrongLane) chkWrongLane.checked = (dmg.triggerOnWrongLane || false);

      const selAmt = document.getElementById('sel-dmg-amount');
      if (selAmt) selAmt.value = dmg.damageAmount || 1;
      const numInv = document.getElementById('num-dmg-invincible');
      if (numInv) numInv.value = dmg.invincibilityDuration || 1800;
      const numTrip = document.getElementById('num-dmg-trip');
      if (numTrip) numTrip.value = dmg.tripFallDuration || 1200;

      // Jump Rules
      const jmp = rules.jump || {};
      const chkAny = document.getElementById('chk-jump-anytime');
      if (chkAny) chkAny.checked = (jmp.allowAnytime !== false);

      const panelRestricted = document.getElementById('panel-restricted-jump');
      if (panelRestricted) {
        panelRestricted.style.opacity = chkAny?.checked ? '0.45' : '1.0';
        panelRestricted.style.pointerEvents = chkAny?.checked ? 'none' : 'auto';
      }

      [0, 1, 2, 3].forEach(bIdx => {
        const chk = document.getElementById(`chk-jump-beat-${bIdx}`);
        if (chk) chk.checked = jmp.allowedBeats ? jmp.allowedBeats[bIdx] : true;
      });

      document.getElementById('num-jump-win-start').value = Math.round((jmp.windowStartPercent ?? 0.0) * 100);
      document.getElementById('num-jump-win-end').value = Math.round((jmp.windowEndPercent ?? 1.0) * 100);
      document.getElementById('num-rule-jump-height').value = jmp.jumpHeight ?? -110;
      document.getElementById('num-rule-jump-duration').value = jmp.jumpDuration ?? 450;
      document.getElementById('num-jump-cooldown').value = jmp.jumpCooldown ?? 0;
      document.getElementById('num-jump-coyote').value = jmp.coyoteBufferTime ?? 140;

      const chkReqGround = document.getElementById('chk-jump-require-ground');
      if (chkReqGround) chkReqGround.checked = (jmp.requireGrounded !== false);
      const chkDbl = document.getElementById('chk-jump-double');
      if (chkDbl) chkDbl.checked = (jmp.allowDoubleJump || false);

      // Frame specific flags
      const frame = this.getCurrentFrame();
      if (frame) {
        const fSpike = document.getElementById('chk-frame-dmg-spike');
        if (fSpike) fSpike.checked = (frame.causesDamageOnSpike !== false);
        const fGround = document.getElementById('chk-frame-dmg-ground');
        if (fGround) fGround.checked = (frame.causesDamageOnGround !== false);
        const fCanJump = document.getElementById('chk-frame-can-jump');
        if (fCanJump) fCanJump.checked = (frame.canJump !== false);
      }
    }

    updateObjectSubpanels() {
      document.querySelectorAll('.obj-subpanel').forEach(p => p.style.display = 'none');
      if (this.selectedObject === 'dancer') {
        document.getElementById('obj-ctrl-dancer').style.display = 'block';
        const d = this.config.objects.dancer;
        const f = this.getCurrentFrame();
        this.setVal('rng-dancer-scale', 'num-dancer-scale', 'lbl-dancer-scale', f?.scale || d.scale);
        document.getElementById('num-dancer-w').value = d.width;
        document.getElementById('num-dancer-h').value = d.height;
        document.getElementById('num-dancer-ox').value = f?.offsetX ?? d.offsetX;
        document.getElementById('num-dancer-oy').value = f?.offsetY ?? d.offsetY;
        this.setVal('rng-jump-lift', 'num-jump-lift', 'lbl-jump-lift', this.config.stage.jumpYOffset || -110, 'px');

        const foot = f?.footAnchor || d.footAnchor;
        document.getElementById('num-foot-x').value = foot.x;
        document.getElementById('num-foot-y').value = foot.y;
        this.setVal('rng-foot-radius', 'num-foot-radius', 'lbl-foot-radius', d.footHitboxRadius || 26, 'px');
      } else if (this.selectedObject === 'stage') {
        document.getElementById('obj-ctrl-stage').style.display = 'block';
        this.setVal('rng-floor-y', 'num-floor-y', 'lbl-floor-y', this.config.stage.floorY, 'px');
        document.getElementById('num-safe-l').value = this.config.stage.safeLeftX;
        document.getElementById('num-safe-r').value = this.config.stage.safeRightX;
        [0, 1, 2, 3].forEach(i => {
          const el = document.getElementById(`num-lane-${i}`);
          if (el) el.value = this.config.stage.lanes[i] || 0;
        });
      } else {
        document.getElementById('obj-ctrl-general').style.display = 'block';
        const obj = this.config.objects[this.selectedObject];
        if (obj) {
          this.setVal('rng-gen-scale', 'num-gen-scale', 'lbl-gen-scale', obj.scale || 1.0);
          document.getElementById('num-gen-ox').value = obj.offsetX || 0;
          document.getElementById('num-gen-oy').value = obj.offsetY || 0;
        }
      }
    }

    updateFrameInspectorUI() {
      const frame = this.getCurrentFrame();
      const title = document.getElementById('cur-frame-title');
      const badge = document.getElementById('cur-frame-hazard-badge');
      const chkAir = document.getElementById('chk-frame-airborne');

      if (frame) {
        if (title) title.textContent = `${frame.name || `Frame ${this.currentFrameIndex}`}`;
        if (badge) {
          if (frame.status === 'closed' || frame.isDangerous) {
            badge.className = 'fc-badge danger';
            badge.textContent = '🔴 SẠP KHÉP (NGUY HIỂM)';
          } else if (frame.isAirborne) {
            badge.className = 'fc-badge airborne';
            badge.textContent = '🔵 TRÊN KHÔNG';
          } else {
            badge.className = 'fc-badge safe';
            badge.textContent = '🟢 AN TOÀN';
          }
        }
        if (chkAir) chkAir.checked = frame.isAirborne || false;
      }
      this.renderZonesList();
      this.updateRulesUI();
    }

    renderPolesList() {
      const container = document.getElementById('poles-list-container');
      if (!container) return;
      container.innerHTML = '';
      const poles = this.config.spikes.poles || [];

      poles.forEach((p, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 11px;';
        row.innerHTML = `
          <span style="font-weight: 700; color: #fff;">${p.name || `Cặp ${idx+1}`}:</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--text-muted); font-size: 10px;">X:</span>
            <input type="number" value="${p.baseX}" class="num-val" style="width: 60px;" data-pole-idx="${idx}">
          </div>
        `;
        row.querySelector('input')?.addEventListener('change', e => {
          poles[idx].baseX = parseInt(e.target.value, 10);
          this.render();
          this.saveDraftToStorage();
        });
        container.appendChild(row);
      });
    }

    renderZonesList() {
      const jContainer = document.getElementById('jumpable-zones-list');
      const dContainer = document.getElementById('danger-zones-list');
      if (!jContainer || !dContainer) return;
      jContainer.innerHTML = '';
      dContainer.innerHTML = '';

      const frame = this.getCurrentFrame();
      if (!frame) return;

      (frame.jumpableZones || []).forEach((z, idx) => {
        const isSelected = (this.selectedZone?.type === 'jumpable' && this.selectedZone.index === idx);
        const card = document.createElement('div');
        card.className = `zone-card jumpable ${isSelected ? 'active' : ''}`;
        card.innerHTML = `
          <div class="zc-left">
            <span class="zc-name">✓ ${z.label}</span>
            <span class="zc-coords">${z.width}×${z.height} px · (${z.x}, ${z.y})</span>
          </div>
          <div class="zc-actions">
            <button class="btn-icon-xs" title="Xóa"><i class="fa-solid fa-trash" style="color: #f87171;"></i></button>
          </div>
        `;
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) {
            frame.jumpableZones.splice(idx, 1);
            this.clearZoneSelection();
          } else {
            this.selectZone('jumpable', idx);
          }
        });
        jContainer.appendChild(card);
      });

      (frame.nonJumpableZones || []).forEach((z, idx) => {
        const isSelected = (this.selectedZone?.type === 'danger' && this.selectedZone.index === idx);
        const card = document.createElement('div');
        card.className = `zone-card non-jumpable ${isSelected ? 'active' : ''}`;
        card.innerHTML = `
          <div class="zc-left">
            <span class="zc-name">⛔ ${z.label}</span>
            <span class="zc-coords">${z.width}×${z.height} px · (${z.x}, ${z.y})</span>
          </div>
          <div class="zc-actions">
            <button class="btn-icon-xs" title="Xóa"><i class="fa-solid fa-trash" style="color: #f87171;"></i></button>
          </div>
        `;
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) {
            frame.nonJumpableZones.splice(idx, 1);
            this.clearZoneSelection();
          } else {
            this.selectZone('danger', idx);
          }
        });
        dContainer.appendChild(card);
      });
    }

    updateTimelineStrip() {
      const strip = document.getElementById('timeline-strip');
      if (!strip) return;
      strip.innerHTML = '';
      const anim = this.config.animations[this.activeAnimationId];
      if (!anim || !anim.frames) return;

      anim.frames.forEach((f, idx) => {
        const card = document.createElement('div');
        const isActive = (idx === this.currentFrameIndex);
        const isHazard = (f.status === 'closed' || f.isDangerous);
        card.className = `frame-card ${isActive ? 'active' : ''} ${isHazard ? 'hazard-frame' : ''}`;

        const jCount = f.jumpableZones ? f.jumpableZones.length : 0;
        const dCount = f.nonJumpableZones ? f.nonJumpableZones.length : 0;

        card.innerHTML = `
          <div class="fc-header">
            <span>F${idx}</span>
            <span class="fc-badge ${isHazard ? 'danger' : 'safe'}">${isHazard ? 'SẠP KHÉP' : (f.isAirborne ? 'AIR' : 'SAFE')}</span>
          </div>
          <div class="fc-preview">
            <canvas width="60" height="42" id="thumb-canvas-${idx}"></canvas>
          </div>
          <div style="background: rgba(0,0,0,0.4); padding: 1px 4px; font-size: 8px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span style="color: #34d399;">🟢${jCount}</span>
            <span style="color: #f87171;">🔴${dCount}</span>
          </div>
        `;

        card.addEventListener('click', () => this.gotoFrame(idx));
        strip.appendChild(card);

        setTimeout(() => this.renderThumbnail(`thumb-canvas-${idx}`, f, idx), 10);
      });
    }

    renderThumbnail(canvasId, frame, idx) {
      const tc = document.getElementById(canvasId);
      if (!tc) return;
      const tctx = tc.getContext('2d');
      tctx.clearRect(0, 0, tc.width, tc.height);

      let sprite = this.assets.dancer_forward;
      if (this.activeAnimationId === 'dancer_back') sprite = this.assets.dancer_back;
      if (this.activeAnimationId === 'dancer_trip') sprite = this.assets.dancer_trip;

      if (sprite) {
        const fw = this.config.objects.dancer.width;
        const fh = this.config.objects.dancer.height;
        const sx = idx * fw;
        tctx.drawImage(sprite, sx, 0, fw, fh, 12, 2, 36, 38);
      } else {
        tctx.fillStyle = '#64748b';
        tctx.fillRect(15, 6, 30, 30);
      }
    }

    setVal(sliderId, numId, lblId, val, unit) {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      const lbl = document.getElementById(lblId);
      if (slider) slider.value = val;
      if (num) num.value = val;
      if (lbl) lbl.textContent = unit ? `${val}${unit}` : (typeof val === 'number' ? val.toFixed(3) : val);
    }

    // --- PRESETS ---
    loadPreset(presetKey) {
      if (presetKey === 'default') {
        this.config = JSON.parse(JSON.stringify(this.originalConfig));
        this.showToast('Đã nạp Preset Mặc Định Lễ Hội Tây Bắc');
      } else if (presetKey === 'hardcore') {
        this.config.spikes.openGap = 100;
        this.config.spikes.closedGap = 12;
        this.config.spikes.dangerWidth = 70;
        this.config.spikes.showSpikeTeeth = true;
        this.config.stage.bpm = 120;
        this.config.rules.damage.damageAmount = 3; // Instant death
        this.config.rules.jump.allowAnytime = false; // Only allowed on exact timing!
        this.config.rules.jump.jumpCooldown = 300;
        this.showToast('Đã nạp Preset Cực Khó: Sạp Gai Nightmare (Cấm Nhảy Tự Do & 1 Hit Chết)');
      } else if (presetKey === 'six_lanes') {
        this.config.stage.lanes = [420, 600, 780, 960, 1140, 1320];
        this.config.stage.safeLeftX = 260;
        this.config.stage.safeRightX = 1460;
        this.showToast('Đã nạp Preset Sân Khấu Rộng 6 Luống');
      }
      this.updateAllUI();
      this.render();
      this.saveDraftToStorage();
    }

    resetToDefaults() {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt về mặc định ban đầu?')) {
        localStorage.removeItem('nhay_sap_editor_config');
        this.config = JSON.parse(JSON.stringify(this.originalConfig));
        this.updateAllUI();
        this.render();
        this.showToast('Đã khôi phục cài đặt mặc định');
      }
    }

    // --- JSON IMPORT / EXPORT & SERVER SAVE ---
    openExportModal() {
      const modal = document.getElementById('json-modal');
      const title = document.getElementById('modal-title');
      const desc = document.getElementById('modal-desc');
      const textarea = document.getElementById('modal-json-text');
      const btnApply = document.getElementById('btn-apply-json');

      if (title) title.innerHTML = '<i class="fa-solid fa-file-export"></i> Xuất Cấu Hình JSON';
      if (desc) desc.textContent = 'Sao chép đoạn mã JSON cấu hình bên dưới để lưu trữ hoặc dùng trong game:';
      if (textarea) textarea.value = JSON.stringify(this.config, null, 2);
      if (btnApply) btnApply.style.display = 'none';

      modal?.classList.add('open');
    }

    openImportModal() {
      const modal = document.getElementById('json-modal');
      const title = document.getElementById('modal-title');
      const desc = document.getElementById('modal-desc');
      const textarea = document.getElementById('modal-json-text');
      const btnApply = document.getElementById('btn-apply-json');

      if (title) title.innerHTML = '<i class="fa-solid fa-file-import"></i> Nạp Cấu Hình JSON Mới';
      if (desc) desc.textContent = 'Dán nội dung JSON cấu hình mới vào ô bên dưới rồi nhấn "Nạp Dữ Liệu":';
      if (textarea) textarea.value = '';
      if (btnApply) btnApply.style.display = 'inline-flex';

      modal?.classList.add('open');
    }

    applyJsonFromModal() {
      const txt = document.getElementById('modal-json-text').value;
      try {
        const parsed = JSON.parse(txt);
        this.config = parsed;
        this.ensureSchemaIntegrity();
        this.updateAllUI();
        this.render();
        this.saveDraftToStorage();
        document.getElementById('json-modal')?.classList.remove('open');
        this.showToast('Đã nạp thành công cấu hình JSON mới!');
      } catch (e) {
        alert('Lỗi định dạng JSON: ' + e.message);
      }
    }

    async saveConfigToServer() {
      this.showToast('Đang lưu lên máy chủ...');
      try {
        const res = await fetch('/api/save-nhay-sap-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game: 'nhay-sap', config: this.config })
        });
        const data = await res.json();
        if (data.success) {
          this.showToast('✅ Đã lưu cấu hình thành công vào nhay-sap-config.js và nhay-sap-config.json!');
        } else {
          this.showToast('❌ Lỗi lưu máy chủ: ' + (data.message || 'Không rõ'));
        }
      } catch (err) {
        console.warn('Server save failed, saved locally:', err);
        this.saveDraftToStorage();
        this.showToast('Đã lưu cục bộ (Máy chủ không phản hồi, hãy kiểm tra server.py)');
      }
    }

    saveDraftToStorage() {
      localStorage.setItem('nhay_sap_editor_config', JSON.stringify(this.config));
    }

    showToast(msg) {
      const toast = document.getElementById('toast-msg');
      const text = document.getElementById('toast-text');
      if (!toast || !text) return;
      text.textContent = msg;
      toast.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    handleGlobalKeydown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && !this.isPlaytestActive) {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'KeyP') {
        this.togglePlaytestMode();
      } else if (e.code === 'KeyV') {
        this.setTool('select');
      } else if (e.code === 'KeyH') {
        this.setTool('pan');
      } else if (e.code === 'ArrowLeft') {
        if (this.isPlaytestActive) this.handlePlaytestStep(-1);
        else this.prevFrame();
      } else if (e.code === 'ArrowRight') {
        if (this.isPlaytestActive) this.handlePlaytestStep(1);
        else this.nextFrame();
      } else if ((e.code === 'ArrowUp' || e.code === 'Space') && this.isPlaytestActive) {
        e.preventDefault();
        this.handlePlaytestJump();
      } else if (e.code === 'ArrowDown' && this.isPlaytestActive) {
        this.handlePlaytestDown();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (this.selectedZone) this.deleteSelectedZone();
      }
    }
  }

  // Launch Studio on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    window.sapStudio = new SapStudioEditor();
  });

})();
