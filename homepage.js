/**
 * SẮC VIỆT — TRANG CHỦ LỄ HỘI TRÒ CHƠI DÂN GIAN VIỆT NAM
 * Controller: Multi-Game Carousel (6 games), Seamless Slide & Blur Transition,
 * Aura Glow Silhouette, Synthesizer Audio & Fast Site Redirection.
 */
(() => {
  'use strict';

  // ==========================================================================
  // 1. WEB AUDIO SYNTHESIZER (NHẠC KHÈN TÂY BẮC & SFX)
  // ==========================================================================
  class FestivalAudioSystem {
    constructor() {
      this.ctx = null;
      this.isMusicPlaying = false;
      this.musicTimer = null;
      this.step = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMusic() {
      this.init();
      this.isMusicPlaying = !this.isMusicPlaying;
      if (this.isMusicPlaying) {
        this.startMusic();
      } else {
        this.stopMusic();
      }
      return this.isMusicPlaying;
    }

    startMusic() {
      if (this.musicTimer) clearInterval(this.musicTimer);
      // Giai điệu ngũ cung khèn bè Tây Bắc (F4, G4, Bb4, C5, D5, F5)
      const notes = [349.23, 392.00, 466.16, 523.25, 587.33, 698.46];
      const seq = [0, 1, 3, 2, 4, 3, 5, 4, 3, 1, 2, 0, 1, 4, 3, 0];

      this.musicTimer = setInterval(() => {
        if (!this.isMusicPlaying || !this.ctx) return;
        const noteIdx = seq[this.step % seq.length];
        this.step++;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[noteIdx], now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.7);
      }, 520);
    }

    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }

    // Tiếng gõ tre nhẹ khi di chuột hover
    playHoverTick() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      } catch (e) {}
    }

    // Tiếng lướt gió tre (whoosh) êm dịu khi trượt carousel
    playSlideWhoosh() {
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.Q.setValueAtTime(1.5, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
      } catch (e) {}
    }

    // Chuông khánh vàng ngân vang khi chọn thẻ
    playSelectChime() {
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [880, 1760].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          const vol = idx === 0 ? 0.08 : 0.03;
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 0.45 : 0.25));
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
      } catch (e) {}
    }

    // Tiếng trống hội trầm bổng khi bắt đầu vào chơi
    playLaunchDrum() {
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      } catch (e) {}
    }

    // Tiếng cồng chiêng khi bấm logo
    playGong() {
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [220, 440, 660].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.95);
        });
      } catch (e) {}
    }
  }

  // ==========================================================================
  // 2. CONFIG: TOÀN BỘ 6 TRÒ CHƠI DÂN GIAN
  // ==========================================================================
  const GAMES = [
    {
      id: 'nem-con',
      name: 'NÉM CÒN',
      desc: 'Lễ hội Lồng Tồng Tây Bắc',
      url: 'nem-con/index.html'
    },
    {
      id: 'day-gay',
      name: 'ĐẨY GẬY',
      desc: 'Đấu sức đối kháng truyền thống',
      url: 'day-gay/index.html'
    },
    {
      id: 'nhay-sap',
      name: 'NHẢY SẠP',
      desc: 'Vũ điệu tre nứa vùng cao',
      url: 'nhay-sap/index.html'
    },
    {
      id: 'ca-kheo',
      name: 'ĐI CÀ KHEO',
      desc: 'Nghệ thuật thăng bằng vượt sông suối',
      url: 'ca-kheo/index.html'
    },
    {
      id: 'ban-no',
      name: 'BẮN NỎ',
      desc: 'Thiện xạ cung nỏ đại ngàn',
      url: 'ban-no/index.html'
    },
    {
      id: 'danh-quay',
      name: 'NÉM QUAY',
      desc: 'Đánh con quay gỗ truyền thống H\'Mông',
      url: 'danh-quay/index.html'
    }
  ];

  // ==========================================================================
  // 3. MAIN CONTROLLER
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    const audioSys = new FestivalAudioSystem();

    // Elements
    const cards = [
      document.getElementById('card-nem-con'),
      document.getElementById('card-day-gay'),
      document.getElementById('card-nhay-sap'),
      document.getElementById('card-ca-kheo'),
      document.getElementById('card-ban-no'),
      document.getElementById('card-danh-quay')
    ];

    const btnPrev = document.getElementById('btn-slide-prev');
    const btnNext = document.getElementById('btn-slide-next');
    const btnPlay = document.getElementById('btn-play-game');
    const btnCulture = document.getElementById('btn-kham-pha');
    const logoLayer = document.getElementById('logo-layer');
    const dots = document.querySelectorAll('.carousel-dots .dot');

    const modalCulture = document.getElementById('modal-culture');
    const modalSettings = document.getElementById('modal-settings');
    const btnAudio = document.getElementById('btn-audio-toggle');
    const btnSettings = document.getElementById('btn-settings-toggle');

    const transitionOverlay = document.getElementById('page-transition-overlay');
    const spinnerText = document.getElementById('spinner-text');

    let currentIndex = 0; // Mặc định Ném Còn (index 0)
    let isSliding = false;

    // Slot classes map
    const SLOT_CLASSES = [
      'slot-center',
      'slot-right',
      'slot-hidden-right',
      'slot-hidden-back',
      'slot-hidden-left',
      'slot-left'
    ];

    // Cập nhật vị trí các slot của 6 thẻ game
    function updateCarouselSlots() {
      const n = GAMES.length; // 6

      cards.forEach((card, i) => {
        if (!card) return;
        // Xóa sạch các slot class cũ
        SLOT_CLASSES.forEach(cls => card.classList.remove(cls));
        card.classList.remove('selected');

        // Tính khoảng cách offset tương đối so với currentIndex theo chiều kim đồng hồ
        const offset = (i - currentIndex + n) % n;
        const targetSlot = SLOT_CLASSES[offset];

        card.classList.add(targetSlot);

        if (offset === 0) {
          // Thẻ chính giữa: thêm hiệu ứng hào quang ôm sát hình thể
          card.classList.add('selected');
          card.setAttribute('aria-checked', 'true');
        } else {
          card.setAttribute('aria-checked', 'false');
        }
      });

      // Cập nhật indicator dots
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });

      // Cập nhật href cho nút CHƠI NGAY
      const current = GAMES[currentIndex];
      if (btnPlay && current) {
        btnPlay.setAttribute('href', current.url);
      }
    }

    // Trượt sang thẻ tiếp theo (Mũi tên phải)
    function nextSlide() {
      if (isSliding) return;
      isSliding = true;
      audioSys.playSlideWhoosh();

      currentIndex = (currentIndex + 1) % GAMES.length;
      updateCarouselSlots();

      setTimeout(() => {
        isSliding = false;
      }, 160);
    }

    // Trượt về thẻ trước (Mũi tên trái)
    function prevSlide() {
      if (isSliding) return;
      isSliding = true;
      audioSys.playSlideWhoosh();

      currentIndex = (currentIndex - 1 + GAMES.length) % GAMES.length;
      updateCarouselSlots();

      setTimeout(() => {
        isSliding = false;
      }, 160);
    }

    // Bắt đầu vào chơi game đang chọn
    function launchCurrentGame() {
      const currentGame = GAMES[currentIndex];
      audioSys.playLaunchDrum();

      if (spinnerText) {
        spinnerText.textContent = `ĐANG VÀO HỘI ${currentGame.name}...`;
      }
      transitionOverlay?.classList.add('active');

      setTimeout(() => {
        window.location.href = currentGame.url;
      }, 160);
    }

    // Gắn sự kiện cho các nút điều hướng tam giác
    btnNext?.addEventListener('click', () => nextSlide());
    btnPrev?.addEventListener('click', () => prevSlide());

    btnNext?.addEventListener('mouseenter', () => audioSys.playHoverTick());
    btnPrev?.addEventListener('mouseenter', () => audioSys.playHoverTick());

    // Click trực tiếp vào các thẻ game
    cards.forEach((card, idx) => {
      if (!card) return;

      card.addEventListener('click', () => {
        const n = GAMES.length;
        const offset = (idx - currentIndex + n) % n;

        if (offset === 0) {
          // Thẻ ở chính giữa: phát tiếng chuông xác nhận
          audioSys.playSelectChime();
        } else if (offset === 1 || offset === 2) {
          // Thẻ bên phải: trượt sang phải để đưa thẻ về giữa
          nextSlide();
        } else if (offset === 5 || offset === 4) {
          // Thẻ bên trái: trượt sang trái để đưa thẻ về giữa
          prevSlide();
        }
      });

      card.addEventListener('dblclick', () => {
        if (card.classList.contains('slot-center')) {
          launchCurrentGame();
        }
      });

      card.addEventListener('mouseenter', () => {
        audioSys.playHoverTick();
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          launchCurrentGame();
        }
      });
    });

    // Bàn phím điều hướng mũi tên trái/phải
    window.addEventListener('keydown', (e) => {
      // Nếu đang mở modal thì không bắt phím điều hướng carousel
      if (document.querySelector('.modal-overlay.open')) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Enter' && !e.target.matches('button, a')) {
        e.preventDefault();
        launchCurrentGame();
      }
    });

    // Nút CHƠI NGAY
    btnPlay?.addEventListener('click', (e) => {
      e.preventDefault();
      launchCurrentGame();
    });
    btnPlay?.addEventListener('mouseenter', () => audioSys.playHoverTick());

    // Nút KHÁM PHÁ VĂN HÓA: Mở chuyên trang văn hóa Sắc Việt
    btnCulture?.addEventListener('click', (e) => {
      e.preventDefault();
      audioSys.playLaunchDrum();
      if (spinnerText) {
        spinnerText.textContent = 'ĐANG VÀO CHUYÊN TRANG VĂN HÓA...';
      }
      transitionOverlay?.classList.add('active');
      setTimeout(() => {
        window.location.href = 'van-hoa.html';
      }, 140);
    });
    btnCulture?.addEventListener('mouseenter', () => audioSys.playHoverTick());

    // Bỏ overlay khi người dùng nhấn nút Back trên trình duyệt
    window.addEventListener('pageshow', () => {
      transitionOverlay?.classList.remove('active');
    });

    // Logo SẮC VIỆT
    logoLayer?.addEventListener('click', () => {
      audioSys.playGong();
    });
    logoLayer?.addEventListener('mouseenter', () => audioSys.playHoverTick());

    // Top Utility: Âm thanh
    btnAudio?.addEventListener('click', () => {
      audioSys.toggleMusic();
    });

    // Top Utility: Cài đặt & Kỷ lục
    btnSettings?.addEventListener('click', () => {
      audioSys.init();
      loadHighScores();
      modalSettings?.classList.add('open');
    });

    // Đóng tất cả modal khi click nút đóng hoặc click nền ngoài
    document.querySelectorAll('.modal-close-btn, .btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    // Đọc điểm kỷ lục từ localStorage
    function loadHighScores() {
      try {
        const nemConScore = localStorage.getItem('nemConHighScore') || localStorage.getItem('score_nemcon') || '0';
        const nhaySapScore = localStorage.getItem('nhaySapHighScore') || localStorage.getItem('score_nhaysap') || '0';
        const dayGayScore = localStorage.getItem('dayGayWins') || '0';
        const banNoScore = localStorage.getItem('banNoHighScore') || '0';

        const elNemCon = document.getElementById('val-nemcon-hs');
        const elNhaySap = document.getElementById('val-nhaysap-hs');
        const elDayGay = document.getElementById('val-daygay-hs');
        const elBanNo = document.getElementById('val-banno-hs');

        if (elNemCon) elNemCon.textContent = nemConScore;
        if (elNhaySap) elNhaySap.textContent = nhaySapScore;
        if (elDayGay) elDayGay.textContent = dayGayScore;
        if (elBanNo) elBanNo.textContent = banNoScore;
      } catch (e) {}
    }

    // Xóa điểm kỷ lục
    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn thiết lập lại toàn bộ điểm kỷ lục?')) {
        try {
          localStorage.removeItem('nemConHighScore');
          localStorage.removeItem('score_nemcon');
          localStorage.removeItem('nhaySapHighScore');
          localStorage.removeItem('score_nhaysap');
          localStorage.removeItem('dayGayWins');
          localStorage.removeItem('banNoHighScore');
          loadHighScores();
        } catch (e) {}
      }
    });

    // ==========================================================================
    // 4. HIỆU ỨNG CÁNH HOA BAY TRONG GIÓ HỘI XUÂN
    // ==========================================================================
    const particleContainer = document.getElementById('ambient-particles');
    if (particleContainer) {
      const PETAL_COUNT = 15;
      for (let i = 0; i < PETAL_COUNT; i++) {
        const petal = document.createElement('div');
        petal.className = 'festival-petal';

        const size = 8 + Math.random() * 12;
        petal.style.width = `${size}px`;
        petal.style.height = `${size * 0.85}px`;
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `${-20 - Math.random() * 80}px`;

        const duration = 7 + Math.random() * 9;
        const delay = Math.random() * 8;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${delay}s`;

        particleContainer.appendChild(petal);
      }
    }

    // Hỗ trợ mở trực tiếp game qua URL query param (vd: ?game=day-gay hoặc ?slide=1)
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    const slideParam = parseInt(urlParams.get('slide'), 10);
    if (gameParam) {
      const foundIdx = GAMES.findIndex(g => g.id === gameParam);
      if (foundIdx !== -1) currentIndex = foundIdx;
    } else if (!isNaN(slideParam) && slideParam >= 0 && slideParam < GAMES.length) {
      currentIndex = slideParam;
    }

    // Hỗ trợ mở trực tiếp modal qua URL query param (vd: ?modal=culture hoặc ?modal=settings)
    const modalParam = urlParams.get('modal');
    if (modalParam === 'culture' && modalCulture) {
      modalCulture.classList.add('open');
    } else if (modalParam === 'settings' && modalSettings) {
      loadHighScores();
      modalSettings.classList.add('open');
    }
    const viewport = document.getElementById('carousel-viewport');
    if (viewport) viewport.classList.add('no-transition');
    updateCarouselSlots();
    // Bật lại transition mượt mà cho các thao tác click sau đó
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (viewport) viewport.classList.remove('no-transition');
      }, 60);
    });
  });
})();

