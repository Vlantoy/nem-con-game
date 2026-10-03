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
  const DEFAULT_SKIN_ID = 'nam_tay_khoe_khoan';

  // DANH SÁCH TẤT CẢ CÁC SKIN NHÂN VẬT
  const CHARACTER_SKINS = {
    // -----------------------------------------------------------------------
    // SKIN 1: CÔ GÁI TÀY TRUYỀN THỐNG (Mặc định)
    // -----------------------------------------------------------------------
    'nu_tay_truyen_thong': {
      id: 'nu_tay_truyen_thong',
      name: 'Cô Gái Tày Lễ Hội',
      ethnicity: 'Dân tộc Tày - Nùng (Việt Bắc)',
      gender: 'female',
      preview: 'assets/character/skins/skin_template/anh_mau_khi_ghep_hoan_chinh.png',
      description: 'Trang phục áo chàm truyền thống, khăn vấn, thắt lưng ngũ sắc trẩy hội Lồng Tồng.',

      // Tỉ lệ thu phóng và vị trí đứng trên sân ném
      scale: 0.21,              // Tỉ lệ scale nhân vật so với ảnh gốc
      standingAnchorX: 220,     // Vị trí gót chân đứng trên mặt đất (X trong canvas)

      // Đường dẫn tài nguyên hình ảnh (Sprites)
      sprites: {
        body: 'assets/character/skin/body.png',
        upper_arm: 'assets/character/skin/upper_arm_unified.png',
        forearm: 'assets/character/skin/forearm.png',
        hand: 'assets/character/skin/hand.png'
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
        scaleUpper: 0.53,  // Tỉ lệ bắp tay (upper arm)
        scaleFore: 1.15,   // Tỉ lệ cẳng tay (forearm)
        scaleHand: 0.35,   // Tỉ lệ bàn tay (hand)

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
          gripTunnel: { x: 165, y: 135 }      // Điểm luồn dây còn trong lòng bàn tay
        }
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
      preview: 'assets/character/skins/New skin/ChatGPT Image Oct 2, 2026, 10_30_13 PM-1.png',
      description: 'Trang phục áo chàm nam tính cộc tay hoa văn thổ cẩm đỏ xanh, sải tay dài.',
      scale: 0.21,
      standingAnchorX: 220,
      sprites: {
        body: 'assets/character/skins/nam_tay_moi/body.png',
        upper_arm: 'assets/character/skins/nam_tay_moi/upper_arm_unified.png',
        forearm: 'assets/character/skins/nam_tay_moi/forearm.png',
        hand: 'assets/character/skins/nam_tay_moi/hand.png'
      },
      anchors: {
        footAnchor: { x: 512, y: 1470 },
        shoulderJoint: { x: 378, y: 248 }
      },
      kinematics: {
        scaleUpper: 0.125,
        scaleFore: 0.125,
        scaleHand: 0.08,
        upperArm: {
          shoulderPivot: { x: 435, y: 275 },
          elbowJoint: { x: 440, y: 1470 }
        },
        forearm: {
          elbowPivot: { x: 350, y: 260 },
          wristJoint: { x: 360, y: 1420 }
        },
        hand: {
          wristPivot: { x: 320, y: 600 },
          gripTunnel: { x: 800, y: 550 }
        }
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
      const saved = localStorage.getItem('nemcon_active_skin');
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
        localStorage.setItem('nemcon_active_skin', skinId);
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
  function getCharacterAssetEntries(skinId = null) {
    const cfg = getSkinConfig(skinId);
    return [
      { key: 'body',      src: cfg.sprites.body },
      { key: 'upper_arm', src: cfg.sprites.upper_arm },
      { key: 'forearm',   src: cfg.sprites.forearm },
      { key: 'hand',      src: cfg.sprites.hand }
    ];
  }

  /**
   * Lấy danh sách tất cả skin có trong hệ thống (dùng cho menu chọn tướng/skin sau này)
   */
  function getAllSkins() {
    return Object.values(CHARACTER_SKINS);
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
