/**
 * =========================================================================
 * CẤU HÌNH NHÂN VẬT & QUẢN LÝ SKIN (CHARACTER CONFIGURATION & SKIN SYSTEM)
 * =========================================================================
 * File này chứa toàn bộ thông tin về nhân vật, bao gồm:
 *  - Đường dẫn hình ảnh (body, upper_arm, forearm, hand).
 *  - Toạ độ khớp nối xương (vai, khuỷu tay, cổ tay, điểm nắm dây con).
 *  - Tỉ lệ kích thước (scale) và thông số chuyển động (animation/kinematics).
 * 
 * 👉 HƯỚNG DẪN ĐỔI SKIN HOẶC THÊM NHÂN VẬT MỚI:
 *  1. Để thay đổi skin hiện tại: Sửa trực tiếp đường dẫn ảnh hoặc toạ độ khớp trong skin 'nu_tay_truyen_thong'.
 *  2. Để thêm nhân vật mới: Thêm 1 object mới vào CHARACTER_SKINS và đổi DEFAULT_SKIN_ID sang ID mới đó.
 *  3. Không cần phải chỉnh sửa hay can thiệp vào game.js!
 */

const CHARACTER_CONFIG = (() => {
  'use strict';

  // Skin mặc định khi người chơi vào game
  const DEFAULT_SKIN_ID = 'p3_nu_ao_vang';

  // DANH SÁCH TẤT CẢ CÁC SKIN NHÂN VẬT
  const CHARACTER_SKINS = {
    // -----------------------------------------------------------------------
    // SKIN 0: CÔ GÁI MƯỜNG ÁO VÀNG (P3)
    // -----------------------------------------------------------------------
                    'p3_nu_ao_vang': {
      id: 'p3_nu_ao_vang',
      name: 'Cô Gái Mường Áo Vàng (P3)',
      ethnicity: 'Dân tộc Mường / Thái (Tây Bắc)',
      gender: 'female',
      preview: 'assets/character/P3/body.png',
      description: 'Trang phục áo vàng tay phồng thổ cẩm, váy quấn indigo truyền thống, nối khớp tay động học mượt mà.',

      scale: 0.205,
      standingAnchorX: 220,
      drawForearmFirst: false,
      drawHandUnderForearm: true,

      sprites: {
        body: 'assets/character/p3_nu_ao_vang/body.png',
        upper_arm: 'assets/character/p3_nu_ao_vang/upper_arm_unified.png',
        forearm: 'assets/character/p3_nu_ao_vang/forearm.png',
        hand: 'assets/character/p3_nu_ao_vang/hand.png'
      },

      anchors: {
        footAnchor: { x: 496, y: 1515 },
        shoulderJoint: { x: 428, y: 355 }
      },

      kinematics: {
        scaleUpper: 0.78,
        scaleFore: 0.36,
        scaleHand: 0.52,

        upperArm: {
          shoulderPivot: { x: 74, y: 55 },
          elbowJoint: { x: 66, y: 310 }
        },
        forearm: {
          elbowPivot: { x: 582, y: 474 },
          wristJoint: { x: 605, y: 1041 }
        },
        hand: {
          wristPivot: { x: 78, y: 14 },
          gripTunnel: { x: 111, y: 178 }
        },
        idleHandOffset: { x: 5, y: 76 }
      },

      animation: {
        breathSpeed: 2.2,
        breathAmplitude: 1.5,
        swingKneeFlexMultiplier: 4,
        throwFollowThroughVelocity: -14,
        wristFlexionLimit: 1.05
      }
    },
    // -----------------------------------------------------------------------
    // SKIN 1: CÔ GÁI TÀY TRUYỀN THỐNG (Mặc định)
    // -----------------------------------------------------------------------
    'nu_tay_truyen_thong': {
      id: 'nu_tay_truyen_thong',
      name: 'Cô Gái Tày Lễ Hội',
      ethnicity: 'Dân tộc Tày - Nùng (Việt Bắc)',
      gender: 'female',
      preview: 'assets/character/p2/body.png',
      description: 'Trang phục áo chàm truyền thống, khăn vấn, thắt lưng ngũ sắc trẩy hội Lồng Tồng.',

      // Tỉ lệ thu phóng và vị trí đứng trên sân ném
      scale: 0.21,              // Tỉ lệ scale nhân vật so với ảnh gốc
      standingAnchorX: 220,     // Vị trí gót chân đứng trên mặt đất (X trong canvas)

      // Đường dẫn tài nguyên hình ảnh (Sprites)
      sprites: {
        body: 'assets/character/p2/body.png',
        upper_arm: 'assets/character/p2/upper_arm_unified.png',
        forearm: 'assets/character/p2/forearm.png',
        hand: 'assets/character/p2/hand.png'
      },

      // Toạ độ điểm neo trên ảnh Thân (Body)
      anchors: {
        // Gót chân tiếp xúc mặt đất (gốc toạ độ thân)
        footAnchor: { x: 565, y: 1510 },
        // Khớp vai trên thân người (tâm xoay cánh tay)
        shoulderJoint: { x: 429, y: 360 }
      },

      // Tỉ lệ kích thước từng bộ phận tay (so với scale chung của nhân vật)
      kinematics: {
        scaleUpper: 0.477, // Tỉ lệ bắp tay (giảm 10%: 0.53 -> 0.477)
        scaleFore: 1.035,  // Tỉ lệ cẳng tay (giảm 10%: 1.15 -> 1.035)
        scaleHand: 0.385,  // Tỉ lệ bàn tay cầm còn (tăng 10%: 0.35 -> 0.385)

        // Bắp tay (upper_arm_unified.png - 322x648px)
        upperArm: {
          shoulderPivot: { x: 206, y: 208 },  // Điểm khớp vai xoay
          elbowJoint: { x: 228, y: 603 }      // Điểm khớp khuỷu tay
        },

        // Cẳng tay (forearm.png - 69x221px)
        forearm: {
          elbowPivot: { x: 29, y: 20 },       // Điểm gắn vào khuỷu tay
          wristJoint: { x: 49, y: 200 }       // Điểm khớp cổ tay
        },

        // Bàn tay (hand.png - 325x270px)
        hand: {
          wristPivot: { x: 25, y: 180 },      // Điểm nối vào cổ tay
          gripTunnel: { x: 255, y: 68 }       // Điểm kẹp dây giữa đầu ngón cái và đầu ngón trỏ
        },

        idleHandOffset: { x: 1, y: 77 }       // Toạ độ tay đứng chờ tương ứng chiều dài tay mới
      },

      // Cấu hình chuyển động (Animation & Physics Feel)
      animation: {
        breathSpeed: 2.2,                  // Tốc độ nhịp thở khi đứng chờ
        breathAmplitude: 1.5,              // Biên độ nhấp nhô nhịp thở
        swingKneeFlexMultiplier: 4.0,      // Độ chùng gối khi vung tay lấy đà
        throwFollowThroughVelocity: -14,   // Độ nảy người lên khi buông quả còn
        wristFlexionLimit: 1.05            // Giới hạn gập cổ tay theo dây (~60 độ)
      }
    },

    // -----------------------------------------------------------------------
    // SKIN 2 (MẪU DỰ PHÒNG / MỞ RỘNG): CHÀNG TRAI TÀY
    // (Bật khi có tài nguyên sprite tương ứng)
    // -----------------------------------------------------------------------
    'nam_tay_khoe_khoan': {
      id: 'nam_tay_khoe_khoan',
      name: 'Chàng Trai Bản Tày',
      ethnicity: 'Dân tộc Tày (Việt Bắc)',
      gender: 'male',
      preview: 'assets/character/p1/body.png',
      description: 'Trang phục áo chàm nam tính cộc tay hoa văn thổ cẩm đỏ xanh, sải tay dài.',
      scale: 0.21,
      standingAnchorX: 220,
      drawForearmFirst: false,
      drawHandUnderForearm: true,
      sprites: {
        body: 'assets/character/p1/body.png',
        upper_arm: 'assets/character/p1/upper_arm_unified.png',
        forearm: 'assets/character/p1/forearm.png',
        hand: 'assets/character/p1/hand.png'
      },
      anchors: {
        footAnchor: { x: 470, y: 1520 },
        shoulderJoint: { x: 363, y: 371 } // Nâng vai cao lên 8px khớp vòm nách áo tự nhiên
      },
      kinematics: {
        scaleUpper: 1.0,
        scaleFore: 1.0,
        scaleHand: 1.0,
        upperArm: {
          shoulderPivot: { x: 78, y: 66 },  // Khớp vai trên bắp tay nối đúng vào tâm ô tròn
          elbowJoint: { x: 78, y: 258 }     // Khớp cùi chỏ đáy bắp tay
        },
        forearm: {
          elbowPivot: { x: 78, y: 7 },      // Khớp cùi chỏ đỉnh cẳng tay (tâm vòm đỏ viền cúp)
          wristJoint: { x: 113, y: 225 }    // Khớp cổ tay đáy cẳng tay (tâm vòm tròn da)
        },
        hand: {
          wristPivot: { x: 36, y: 35 },     // Khớp cổ tay trên bàn tay (tâm vòm da nối khớp)
          gripTunnel: { x: 78, y: 119 }     // Điểm kẹp dây giữa đầu ngón cái và đầu ngón trỏ
        },
        idleHandOffset: { x: 7, y: 84 }     // Trạng thái ban đầu: Cánh tay thả lỏng xuôi thẳng tự nhiên dọc thân người
      },
      animation: {
        breathSpeed: 2.0,
        breathAmplitude: 1.6,
        swingKneeFlexMultiplier: 4.2,
        throwFollowThroughVelocity: -15,
        wristFlexionLimit: 1.05
      }
    }
  };

  // =========================================================================
  // HELPER FUNCTIONS ĐỂ TRUY XUẤT VÀ QUẢN LÝ SKIN
  // =========================================================================
  
  /**
   * Lấy ID skin đang được kích hoạt từ localStorage hoặc mặc định
   */
  function getActiveSkinId() {
    try {
      // Hỗ trợ truyền ?skin=nam_tay_khoe_khoan trên URL để kích hoạt và lưu ngay vào localStorage
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const qSkin = urlParams.get('skin');
        if (qSkin && CHARACTER_SKINS[qSkin]) {
          localStorage.setItem('nemcon_active_skin_v3', qSkin);
          return qSkin;
        }
      }
      const saved = localStorage.getItem('nemcon_active_skin_v3');
      if (saved && CHARACTER_SKINS[saved]) {
        return saved;
      }
    } catch (e) {}
    return DEFAULT_SKIN_ID;
  }

  /**
   * Thiết lập skin đang được kích hoạt
   */
  function setActiveSkinId(skinId) {
    if (CHARACTER_SKINS[skinId]) {
      try {
        localStorage.setItem('nemcon_active_skin_v3', skinId);
      } catch (e) {}
      return true;
    }
    return false;
  }

  /**
   * Lấy thông tin cấu hình của một skin (hoặc skin đang kích hoạt)
   */
  function getSkinConfig(skinId = null) {
    const id = skinId || getActiveSkinId();
    return CHARACTER_SKINS[id] || CHARACTER_SKINS[DEFAULT_SKIN_ID];
  }

  /**
   * Lấy danh sách tất cả các asset ảnh cần load cho nhân vật hiện tại
   */
    function resolveAsset(p) {
    const pfx = (typeof window !== 'undefined' && window.ASSET_PREFIX) ? window.ASSET_PREFIX : '';
    return (p && p.startsWith('assets/') && pfx) ? (pfx + p) : p;
  }

  function getCharacterAssetEntries(skinId = null) {
    const cfg = getSkinConfig(skinId);
    return [
      { key: 'body',      src: resolveAsset(cfg.sprites.body) },
      { key: 'upper_arm', src: resolveAsset(cfg.sprites.upper_arm) },
      { key: 'forearm',   src: resolveAsset(cfg.sprites.forearm) },
      { key: 'hand',      src: resolveAsset(cfg.sprites.hand) }
    ];
  }

  /**
   * Lấy danh sách tất cả skin có trong hệ thống (dùng cho menu chọn tướng/skin sau này)
   */
  function getAllSkins() {
    return Object.values(CHARACTER_SKINS).map(s => ({
      ...s,
      preview: resolveAsset(s.preview),
      sprites: {
        body: resolveAsset(s.sprites.body),
        upper_arm: resolveAsset(s.sprites.upper_arm),
        forearm: resolveAsset(s.sprites.forearm),
        hand: resolveAsset(s.sprites.hand)
      }
    }));
  }

  return {
    DEFAULT_SKIN_ID,
    CHARACTER_SKINS,
    getActiveSkinId,
    setActiveSkinId,
    getSkinConfig,
    getCharacterAssetEntries,
    getAllSkins
  };
})();

// Xuất ra môi trường toàn cục (Browser & Node test environment)
if (typeof window !== 'undefined') {
  window.CHARACTER_CONFIG = CHARACTER_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHARACTER_CONFIG;
}
