/**
 * WEBCAM GESTURE CONTROLLER (MediaPipe Tasks Vision)
 * ----------------------------------------------------
 * Điều khiển chuyển động nhân vật và ném quả còn bằng cử chỉ tay qua Webcam:
 * 1. Nắm tay (Closed Fist): Giữ chặt dây còn và vung xoay lấy đà theo chuyển động thực tế 1:1.
 * 2. Thả tay (Open Palm): Buông tay phóng quả còn bay vút qua vòng tròn trên cột tre.
 */

export class WebcamGestureController {
  constructor(options = {}) {
    this.video = options.videoElement || null;
    this.canvas = options.canvasElement || null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.recognizer = null;
    this.running = false;
    this.animFrameId = null;

    // Callbacks
    this.onGesture = options.onGesture || null; // ({ isFist, isOpen, gameX, gameY, normX, normY, gestureName, rawLandmarks }) => {}
    this.onStatus = options.onStatus || null;   // (statusText, type) => {}

    // Tracking states
    this.lastVideoTime = -1;
    this.currentGesture = 'None';
    this.isFist = false;
    this.prevFist = false;

    // Smoothed hand position
    this.smoothX = 0.5;
    this.smoothY = 0.5;
    this.lerpSpeed = 0.35; // Độ mượt mặc định khi tay đứng yên

    // Motion blur recovery & Inertial Dead Reckoning (Quán tính chuyển động tốc độ cao)
    this.lostFrames = 0;
    this.MAX_COASTING_FRAMES = 8; // Cho phép duy trì đà quay quán tính tối đa 8 frames (~250ms) khi ngón tay bị nhòe
    this.vx = 0;                  // Vận tốc chuyển động X (norm/s)
    this.vy = 0;                  // Vận tốc chuyển động Y (norm/s)
    this.prevNormX = 0.5;
    this.prevNormY = 0.5;
    this.prevTimestamp = 0;

    // Phân tích chuyển động quay tròn (Circular Kinematics)
    this.rotCenterX = 0.5;
    this.rotCenterY = 0.5;
    this.curAngle = 0;
    this.prevAngle = 0;
    this.angularVelocity = 0;     // rad/s (vận tốc góc)
    this.spinRadius = 0.16;       // Bán kính quỹ đạo tay

    // Bộ đệm chống nhận diện nhầm khi ngón tay bị motion blur (Debounce & Hysteresis)
    this.openPalmCount = 0;
    this.fistConfirmCount = 0;

    // Landmark connections for drawing skeleton
    this.HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Ngón cái
      [0, 5], [5, 6], [6, 7], [7, 8],       // Ngón trỏ
      [5, 9], [9, 10], [10, 11], [11, 12],  // Ngón giữa
      [9, 13], [13, 14], [14, 15], [15, 16],// Ngón áp út
      [13, 17], [17, 18], [18, 19], [19, 20],// Ngón út
      [0, 17]                               // Cạnh bàn tay
    ];
  }

  /**
   * Khởi tạo MediaPipe GestureRecognizer
   * Tối ưu ngưỡng Tracking xuống 0.25 để giữ chặt bàn tay khi xoay nhanh bị Motion Blur
   */
  async init() {
    this.reportStatus('Đang khởi tạo AI nhận diện cử chỉ...', 'info');

    try {
      // 1. Dynamic import bundle
      let visionModule;
      try {
        visionModule = await import('/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs');
      } catch (e1) {
        console.warn('Local vision bundle failed, falling back to CDN...', e1);
        visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs');
      }

      const { GestureRecognizer, FilesetResolver } = visionModule;

      // 2. Resolve WASM
      let visionFileset;
      try {
        visionFileset = await FilesetResolver.forVisionTasks('/node_modules/@mediapipe/tasks-vision/wasm');
      } catch (e2) {
        console.warn('Local WASM failed, falling back to CDN...', e2);
        visionFileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
      }

      // 3. Create GestureRecognizer với ngưỡng tracking cực nhạy cho tốc độ cao
      const modelPath = '/assets/models/gesture_recognizer.task';
      try {
        this.recognizer = await GestureRecognizer.createFromOptions(visionFileset, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.35,  // Dễ bắt dính bàn tay đang di chuyển
          minHandPresenceConfidence: 0.30,   // Không bỏ rơi bàn tay khi bị mờ viền
          minTrackingConfidence: 0.25        // Khóa mục tiêu qua các frame mờ ngón (Motion Blur)
        });
      } catch (e3) {
        console.warn('GPU delegate failed or local model error, trying CPU/CDN...', e3);
        this.recognizer = await GestureRecognizer.createFromOptions(visionFileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.30,
          minTrackingConfidence: 0.25
        });
      }

      this.reportStatus('AI đã sẵn sàng! Đang mở Webcam...', 'success');
      return true;
    } catch (err) {
      console.error('Lỗi khởi tạo GestureRecognizer:', err);
      this.reportStatus('Không thể tải AI nhận diện cử chỉ: ' + err.message, 'error');
      return false;
    }
  }

  /**
   * Kiểm tra quyền Camera trên trình duyệt
   */
  static async checkCameraPermission() {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const p = await navigator.permissions.query({ name: 'camera' });
        return p.state; // 'granted', 'prompt', 'denied'
      } catch (e) {
        return 'unknown';
      }
    }
    return 'unknown';
  }

  /**
   * Mở Camera stream ngay lập tức để kích hoạt hộp thoại xin quyền của trình duyệt
   */
  async openCameraStream(videoEl, canvasEl) {
    if (videoEl) this.video = videoEl;
    if (canvasEl) {
      this.canvas = canvasEl;
      this.ctx = this.canvas.getContext('2d');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('Trình duyệt không hỗ trợ WebRTC Camera hoặc kết nối không an toàn (cần dùng http://localhost:8080 hoặc HTTPS).');
      err.name = 'InsecureContextError';
      throw err;
    }

    this.reportStatus('Đang xin quyền truy cập Camera...', 'info');

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 60 },
        facingMode: 'user'
      },
      audio: false
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (errConstraint) {
      console.warn('Advanced constraints failed, falling back to basic camera stream...', errConstraint);
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    this.video.srcObject = stream;
    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play().catch(e => console.warn('Video play error:', e));
        resolve();
      };
    });

    if (this.canvas) {
      this.canvas.width = this.video.videoWidth || 640;
      this.canvas.height = this.video.videoHeight || 480;
    }

    return true;
  }

  /**
   * Mở Webcam và AI: chạy song song để trình duyệt hiện thông báo xin quyền ngay tức khắc!
   */
  async startWebcam(videoEl, canvasEl) {
    if (videoEl) this.video = videoEl;
    if (canvasEl) {
      this.canvas = canvasEl;
      this.ctx = this.canvas.getContext('2d');
    }

    try {
      // 1. Kích hoạt camera ngay tức thì (hiện popup Allow lập tức)
      const camPromise = this.openCameraStream(videoEl, canvasEl);

      // 2. Tải AI MediaPipe song song trong nền
      const aiPromise = this.recognizer ? Promise.resolve(true) : this.init();

      // Chờ mở Camera trước
      await camPromise;
      this.reportStatus('Camera đã kết nối! Đang tải mô hình nhận diện cử chỉ MediaPipe...', 'info');

      // Chờ AI sẵn sàng
      const aiOk = await aiPromise;
      if (!aiOk) {
        throw new Error('Không thể tải mô hình MediaPipe Tasks Vision.');
      }

      this.running = true;
      this.reportStatus('Hệ thống AI đã sẵn sàng! Đưa bàn tay vào khung hình để chơi.', 'success');
      this.loop();
      return { success: true };
    } catch (err) {
      console.error('Lỗi khởi động Webcam & AI:', err);
      let errorType = 'unknown';
      let errorMsg = err.message || 'Không thể mở Camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'denied';
        errorMsg = 'Quyền Camera đã bị từ chối hoặc bị trình duyệt chặn (Blocked).';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorType = 'not_found';
        errorMsg = 'Không tìm thấy thiết bị Webcam trên máy tính của bạn.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorType = 'in_use';
        errorMsg = 'Camera đang bị ứng dụng khác (Zoom, Teams, Zalo, ứng dụng Camera...) chiếm dụng.';
      } else if (err.name === 'InsecureContextError') {
        errorType = 'insecure';
        errorMsg = err.message;
      }

      this.reportStatus(errorMsg, 'error');
      return { success: false, errorType, errorMsg, originalError: err };
    }
  }

  /**
   * Tắt Webcam
   */
  stopWebcam() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.reportStatus('Đã tắt Webcam.', 'info');
  }

  /**
   * Vòng lặp nhận diện theo từng khung hình (Real-time frame processing)
   */
  loop() {
    if (!this.running) return;

    if (this.video && this.video.readyState >= 2) {
      const now = performance.now();
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        const results = this.recognizer.recognizeForVideo(this.video, now);
        this.processResults(results);
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Xử lý kết quả nhận diện bàn tay và cử chỉ
   * Tích hợp:
   * 1. Bù quán tính (Inertial Dead Reckoning) khi xoay nhanh bị Motion Blur
   * 2. Làm mượt thích ứng (Adaptive Smoothing: tay đi chậm thì siêu êm, tay quay nhanh thì phản hồi tức thì 0ms lag)
   * 3. Chống buông tay ảo khi ngón tay bị nhòe vệt
   */
  processResults(results) {
    const now = performance.now();
    let dt = (now - this.prevTimestamp) / 1000;
    if (dt <= 0 || dt > 0.2) dt = 1 / 30;

    if (this.canvas && this.ctx) {
      // 1. Vẽ webcam frame lật ngược như soi gương (Mirror effect)
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-this.canvas.width, 0);
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // ========================================================
    // TRƯỜNG HỢP 1: BỊ MẤT FRAME DO XOAY QUÁ NHANH (MOTION BLUR)
    // ========================================================
    if (!results || !results.landmarks || results.landmarks.length === 0) {
      this.lostFrames++;

      // Nếu người chơi đang nắm tay giữ dây hoặc đang xoay vòng, AI duy trì quán tính trong MAX_COASTING_FRAMES (~250ms)
      if (this.isFist && this.lostFrames <= this.MAX_COASTING_FRAMES) {
        // Dự đoán vị trí tiếp theo theo quỹ đạo quay tròn (Circular Extrapolation)
        if (Math.abs(this.angularVelocity) > 1.2) {
          this.curAngle += this.angularVelocity * dt;
          this.smoothX = this.rotCenterX + Math.cos(this.curAngle) * this.spinRadius;
          this.smoothY = this.rotCenterY + Math.sin(this.curAngle) * this.spinRadius;
        } else {
          // Dự đoán theo vector vận tốc thẳng có giảm tốc
          this.smoothX += this.vx * dt;
          this.smoothY += this.vy * dt;
          this.vx *= 0.85;
          this.vy *= 0.85;
        }

        // Giới hạn biên an toàn
        this.smoothX = Math.max(0.05, Math.min(0.95, this.smoothX));
        this.smoothY = Math.max(0.05, Math.min(0.95, this.smoothY));

        // Vẽ hiệu ứng vòng quay quán tính tốc độ cao lên preview canvas
        if (this.canvas && this.ctx) {
          this.drawInertialIndicator(this.smoothX, this.smoothY);
        }

        // Gửi tiếp tín hiệu ĐANG NẮM TAY (Giữ chặt đà quay, không bị rơi hoặc ném hụt!)
        if (this.onGesture) {
          this.onGesture({
            isFist: true,
            isOpen: false,
            hasHand: true,
            isInertial: true,
            normX: this.smoothX,
            normY: this.smoothY,
            angularVelocity: this.angularVelocity,
            gestureName: 'Closed_Fist (Quán tính tốc độ cao)'
          });
        }
        return;
      }

      // Nếu đã mất dấu quá lâu (> 250ms), bàn tay đã thực sự rút ra ngoài camera
      this.currentGesture = 'None';
      this.isFist = false;
      this.angularVelocity = 0;
      this.vx = 0;
      this.vy = 0;
      if (this.onGesture) {
        this.onGesture({
          isFist: false,
          isOpen: false,
          hasHand: false,
          isInertial: false,
          normX: this.smoothX,
          normY: this.smoothY,
          gestureName: 'None'
        });
      }
      return;
    }

    // ========================================================
    // TRƯỜNG HỢP 2: DETECT ĐƯỢC BÀN TAY (CẬP NHẬT TRẠNG THÁI)
    // ========================================================
    this.lostFrames = 0; // Reset số frame mất dấu

    const landmarks = results.landmarks[0];
    const gestures = results.gestures && results.gestures[0] ? results.gestures[0] : [];
    let detectedGesture = gestures.length > 0 ? gestures[0].categoryName : 'None';
    const gestureScore = gestures.length > 0 ? gestures[0].score : 0;

    // 2. Thuật toán phân tích hình học đốt ngón tay (Geometric Knuckle Distance)
    const wrist = landmarks[0];
    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerBases = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

    let foldedFingers = 0;
    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(fingerTips[i].x - wrist.x, fingerTips[i].y - wrist.y);
      const baseDist = Math.hypot(fingerBases[i].x - wrist.x, fingerBases[i].y - wrist.y);
      if (tipDist < baseDist * 1.25) {
        foldedFingers++;
      }
    }

    // 3. Toạ độ bàn tay 1:1 (Lấy tâm khớp giữa bàn tay - Landmark #9)
    const centerPoint = landmarks[9] || landmarks[0];
    const rawNormX = 1.0 - centerPoint.x; // Lật trục X vì camera soi gương
    const rawNormY = centerPoint.y;

    // Tính vận tốc tức thời và vector chuyển động
    if (dt > 0.005) {
      const instVx = (rawNormX - this.prevNormX) / dt;
      const instVy = (rawNormY - this.prevNormY) / dt;
      this.vx = this.vx * 0.5 + instVx * 0.5;
      this.vy = this.vy * 0.5 + instVy * 0.5;
    }
    this.prevNormX = rawNormX;
    this.prevNormY = rawNormY;
    this.prevTimestamp = now;

    const speed = Math.hypot(this.vx, this.vy);

    // Tính vận tốc góc (Angular Velocity) quanh tâm xoay
    const relX = rawNormX - this.rotCenterX;
    const relY = rawNormY - this.rotCenterY;
    const curR = Math.hypot(relX, relY);

    if (curR > 0.05 && curR < 0.45) {
      this.spinRadius = this.spinRadius * 0.92 + curR * 0.08;
      const angle = Math.atan2(relY, relX);
      let dAngle = angle - this.prevAngle;
      while (dAngle > Math.PI) dAngle -= Math.PI * 2;
      while (dAngle < -Math.PI) dAngle += Math.PI * 2;

      if (dt > 0.005) {
        const instOmega = dAngle / dt;
        this.angularVelocity = this.angularVelocity * 0.65 + instOmega * 0.35;
      }
      this.prevAngle = angle;
      this.curAngle = angle;
    }

    // Khi tay quay nhanh (|omega| > 3.0 rad/s hoặc speed > 1.2 norm/s):
    const isSpinningFast = Math.abs(this.angularVelocity) > 3.0 || speed > 1.2;

    // 4. LÀM MƯỢT THÍCH ỨNG (ADAPTIVE SMOOTHING)
    // Bình thường: lerp = 0.35 (không rung giật)
    // Khi vung nhanh: lerp tăng vọt lên 0.85 - 0.95 (bám sát 100% bàn tay thực tế, không hề có độ trễ!)
    const adaptiveLerp = Math.min(0.92, Math.max(0.35, 0.35 + speed * 0.25));
    this.smoothX += (rawNormX - this.smoothX) * adaptiveLerp;
    this.smoothY += (rawNormY - this.smoothY) * adaptiveLerp;

    // 5. CƠ CHẾ CHỐNG NHẬN DIỆN BUÔNG TAY ẢO KHI MỜ NGÓN (DEBOUNCED FIST / OPEN)
    const aiIsFist = (detectedGesture === 'Closed_Fist' && gestureScore > 0.38);
    const geomIsFist = (foldedFingers >= 2);
    const aiIsOpen = (detectedGesture === 'Open_Palm' && gestureScore > 0.50);
    const geomIsOpen = (foldedFingers <= 1);

    let isFistNow = this.isFist;

    if (isFistNow) {
      // Đang nắm tay: Chỉ mở tay khi nhận diện rõ ràng Open_Palm (ít nhất 2 frame nếu đang xoay nhanh)
      if (aiIsOpen || (geomIsOpen && !isSpinningFast)) {
        this.openPalmCount++;
        const requiredFrames = isSpinningFast ? 2 : 1;
        if (this.openPalmCount >= requiredFrames) {
          isFistNow = false;
          this.openPalmCount = 0;
        }
      } else {
        this.openPalmCount = 0;
        isFistNow = true;
      }
    } else {
      // Đang mở tay: Muốn nắm lại thì nhận diện nắm tay ngay
      if (aiIsFist || geomIsFist) {
        this.fistConfirmCount++;
        if (this.fistConfirmCount >= 1) {
          isFistNow = true;
          this.fistConfirmCount = 0;
        }
      } else {
        this.fistConfirmCount = 0;
        isFistNow = false;
      }
    }

    this.isFist = isFistNow;
    this.currentGesture = isFistNow ? 'Closed_Fist' : (aiIsOpen ? 'Open_Palm' : detectedGesture);

    // 6. Vẽ Skeleton khung xương bàn tay lên Canvas Preview
    if (this.canvas && this.ctx) {
      this.drawHandSkeleton(landmarks, isFistNow, isSpinningFast);
    }

    // 7. Gửi dữ liệu cử chỉ về Game Engine
    if (this.onGesture) {
      this.onGesture({
        isFist: this.isFist,
        isOpen: !this.isFist,
        hasHand: true,
        isInertial: false,
        isSpinningFast: isSpinningFast,
        normX: this.smoothX,
        normY: this.smoothY,
        angularVelocity: this.angularVelocity,
        speed: speed,
        gestureName: this.currentGesture,
        confidence: gestureScore,
        rawLandmarks: landmarks
      });
    }

    this.prevFist = this.isFist;
  }

  /**
   * Vẽ bộ xương bàn tay 21 điểm lên màn hình Preview
   */
  drawHandSkeleton(landmarks, isFist, isSpinningFast = false) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Vẽ các đường nối đốt ngón tay
    ctx.lineWidth = isSpinningFast ? 4 : 3;
    ctx.strokeStyle = isFist ? (isSpinningFast ? '#f59e0b' : '#ef4444') : '#10b981';
    ctx.beginPath();
    for (const [i, j] of this.HAND_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      const x1 = (1.0 - p1.x) * w;
      const y1 = p1.y * h;
      const x2 = (1.0 - p2.x) * w;
      const y2 = p2.y * h;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Vẽ 21 khớp tròn
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const x = (1.0 - p.x) * w;
      const y = p.y * h;
      ctx.beginPath();
      const r = (i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20) ? 6 : 4;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = (i === 9) ? '#fbbf24' : (isFist ? '#fca5a5' : '#a7f3d0');
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hiển thị nhãn trạng thái trực tiếp trên màn hình camera
    const badgeText = isFist 
      ? (isSpinningFast ? '⚡ ĐANG QUAY TỐC ĐỘ CAO (GIỮ DÂY)' : '✊ ĐANG NẮM TAY (GIỮ DÂY)') 
      : '✋ THẢ TAY (PHÓNG CÒN)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 270, 36);
    ctx.fillStyle = isFist ? (isSpinningFast ? '#fbbf24' : '#f87171') : '#34d399';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(badgeText, 18, 33);
  }

  /**
   * Vẽ con trỏ quán tính khi camera bị Motion Blur tạm thời
   */
  drawInertialIndicator(normX, normY) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = normX * w;
    const cy = normY * h;

    ctx.save();
    // Vòng tròn hào quang quán tính
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.restore();

    // Nhãn báo hiệu bù quán tính
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(10, 10, 270, 36);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('⚡ BÙ QUÁN TÍNH (MOTION BLUR)', 18, 33);
  }

  reportStatus(msg, type = 'info') {
    if (this.onStatus) {
      this.onStatus(msg, type);
    }
  }
}
