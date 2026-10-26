/* Shared balance values for scoring, prediction and player-facing descriptions. */
(() => {
  const levels = {
    easy: { label: 'Dễ · Làm quen', tolerance: 1.8, charge: 1.55, stop: 0.55, preview: 90, botMin: 0.20, botMax: 0.35, summary: 'Vùng trúng rộng · Đường ngắm đầy đủ · Tích lực nhanh · Bot nhẹ tay' },
    medium: { label: 'Vừa · So tài', tolerance: 1.15, charge: 1, stop: 0.30, preview: 36, botMin: 0.48, botMax: 0.62, summary: 'Vùng trúng chuẩn · Gợi ý đường bay ngắn · Tích lực chuẩn · Bot cân sức' },
    hard: { label: 'Khó · Cao thủ', tolerance: 0.70, charge: 0.78, stop: 0.18, preview: 0, botMin: 0.78, botMax: 0.90, summary: 'Vùng trúng hẹp · Tự căn đường bay · Cần xoay đều tay · Bot cao thủ' }
  };
  window.NEMCON_DIFFICULTY = Object.freeze(Object.fromEntries(Object.entries(levels).map(([key, value]) => [key, Object.freeze(value)])));
})();
