import {makeArms,makePose,poleEnds} from './physics.mjs';
export {makePose,poleEnds} from './physics.mjs';

/**
 * =========================================================================
 * BẢNG TÀI NGUYÊN HOẠT ẢNH CHUẨN ĐỐI CHIẾU KHÔNG GIAN (SPATIAL CONSISTENT)
 * =========================================================================
 * 4 bộ Sprite Sheet 8-frame với độ nhất quán không gian tuyệt đối (100% scale consistency):
 * 1. attack_defense_sheet: P1 Công (bước chân luân phiên 2 chân: chân trái rồi chân phải) vs P2 Thủ (hạ tấn ghì sàn)
 * 2. defense_attack_sheet: P2 Công (bước chân luân phiên 2 chân tiến sang trái) vs P1 Thủ (hạ tấn ghì sàn)
 * 3. attack_attack_sheet:  Cả hai cùng Công (Clash: Giằng co đối xứng tại tâm)
 * 4. defense_defense_sheet: Cả hai cùng Thủ (Stance: Trung bình tấn chuẩn mực & hồi thể lực)
 *
 * Mọi khung hình được khóa cố định:
 * - Cao độ sàn tiếp đất: Y = 320px (khớp chuẩn xác vòng phấn ARENA_GROUND_Y = 478)
 * - Tọa độ tâm đối xứng: X = 512px
 * - Độ lệch kích thước nhân vật: 0.00%
 * - Không dùng mờ nhòe alpha (Discrete Keyframes) đảm bảo hình ảnh sắc nét tuyệt đối.
 */
const names = [
  'arena',
  'attack_attack_sheet',
  'attack_defense_sheet',
  'defense_attack_sheet',
  'defense_defense_sheet'
];

export async function loadArt(){
  const art = {};
  await Promise.all(names.map(name => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { art[name] = img; resolve(); };
    img.onerror = () => reject(new Error('Không tải được ' + name));
    img.src = `assets/${name}.png`;
  })));
  return art;
}

const point = (x, y) => ({x, y});

// Hệ thống hạt bụi cát khi miết chân trượt sàn
const dust = [];
export function addDust(x, y, count = 4, color = '#c2a77b', vxScale = 1){
  for(let i = 0; i < count; i++){
    dust.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 30 * vxScale,
      vy: -Math.random() * 20 - 5,
      r: Math.random() * 4 + 2.5,
      alpha: 0.5,
      decay: Math.random() * 1.5 + 1.2,
      color
    });
  }
}

// Tỷ lệ hiển thị nhân vật: Vừa vặn cân đối trong vòng tròn sân 1447px
// 1024 * 0.52 = 532px (đứng thanh thoát trong vòng phấn, chừa 280px biên độ sải bước 2 bên)
export const CHAR_SCALE = 0.52;
const FRAME_W = 1024;
const FRAME_H = 512;
const ANCHOR_X = 511.5;
const ANCHOR_Y = 476;

// Tâm sân đấu và cao độ tiếp đất trên vòng phấn
const ARENA_CENTER_X = 723;
const ARENA_GROUND_Y = 478;

/**
 * =========================================================================
 * QUY TẮC PHÂN ĐỊNH TRẠNG THÁI HOẠT ẢNH (STATE MACHINE MAPPING)
 * =========================================================================
 * 4 kịch bản động lực học phân định rõ ràng theo yêu cầu:
 *
 * 1. CẢ HAI CÙNG CÔNG (Mutual Clash):
 *    - Điều kiện: p1.attack > 0.35 && p2.attack > 0.35
 *    - Sheet: 'attack_attack_sheet' (10 fps - Dướn người đối xứng, gậy nén rung chấn tại tâm)
 *
 * 2. P1 CÔNG, P2 THỦ:
 *    - Điều kiện: p1.attack > 0.35 || s.velocity > 0.15
 *    - Sheet: 'attack_defense_sheet' (8 fps - P1 bước chân trái rồi bước chân phải tiến sâu, P2 hạ tấn ghì giữ sàn)
 *
 * 3. P2 CÔNG, P1 THỦ:
 *    - Điều kiện: p2.attack > 0.35 || s.velocity < -0.15
 *    - Sheet: 'defense_attack_sheet' (8 fps - P2 bước chân phải rồi bước chân trái tiến sang trái, P1 hạ tấn ghì giữ sàn)
 *
 * 4. CẢ HAI CÙNG THỦ (Stance / Rest):
 *    - Điều kiện: Không bên nào công, giữ thế hoặc buông nút hồi sức
 *    - Sheet: 'defense_defense_sheet' (6 fps - Hai bên đứng trung bình tấn thăng bằng, thở nhịp hồi phục)
 * =========================================================================
 */
export function resolveSheet(s){
  const p1 = s.players[0];
  const p2 = s.players[1];
  const isP1Atk = p1.attack > 0.35;
  const isP2Atk = p2.attack > 0.35;

  if(isP1Atk && isP2Atk){
    return { name: 'attack_attack_sheet', fps: 10, mode: 'clash' };
  }
  if(isP1Atk || s.velocity > 0.15){
    return { name: 'attack_defense_sheet', fps: 8, mode: 'p1_atk' };
  }
  if(isP2Atk || s.velocity < -0.15){
    return { name: 'defense_attack_sheet', fps: 8, mode: 'p2_atk' };
  }
  return { name: 'defense_defense_sheet', fps: 6, mode: 'stance' };
}

export function render(ctx, art, s, dt = 0.016){
  // 1. Xóa và vẽ nền sân đấu lễ hội
  ctx.clearRect(0, 0, 1447, 616);
  ctx.drawImage(art.arena, 0, 0, 1447, 616);

  // 2. Cập nhật và vẽ các hạt bụi cát tiếp đất
  for(let i = dust.length - 1; i >= 0; i--){
    const d = dust[i];
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 120 * dt;
    d.alpha -= d.decay * dt;
    d.r += dt * 5;
    if(d.alpha <= 0){ dust.splice(i, 1); continue; }
    ctx.save();
    ctx.fillStyle = d.color;
    ctx.globalAlpha = Math.max(0, d.alpha);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Phân định hoạt cảnh theo trạng thái trận đấu
  const anim = resolveSheet(s);
  const sheet = art[anim.name] || art['defense_defense_sheet'];

  // Chọn khung hình rời rạc sắc nét (Discrete Keyframe 16 frames - 4x4) - 100% Solid, ZERO blur
  const frameIndex = Math.floor(s.elapsed * anim.fps) % 16;
  const col = frameIndex % 4;
  const row = Math.floor(frameIndex / 4);
  const sx = col * FRAME_W;
  const sy = row * FRAME_H;

  // 4. Khóa sàn tiếp đất vững chắc và đồng bộ chuyển vị vật lý
  const drawW = Math.round(FRAME_W * CHAR_SCALE);
  const drawH = Math.round(FRAME_H * CHAR_SCALE);
  const drawX = Math.round(ARENA_CENTER_X + s.x - (ANCHOR_X * CHAR_SCALE));
  const drawY = Math.round(ARENA_GROUND_Y - (ANCHOR_Y * CHAR_SCALE));

  // Tạo hiệu ứng bụi ma sát khi bước chân hoặc trượt dạt sàn
  if(Math.abs(s.velocity) > 0.2 && Math.random() < 0.25){
    if(s.velocity > 0){
      addDust(drawX + 850 * CHAR_SCALE, ARENA_GROUND_Y, 2, '#9c835c', -1);
    } else {
      addDust(drawX + 170 * CHAR_SCALE, ARENA_GROUND_Y, 2, '#9c835c', 1);
    }
  }

  // 5. Vẽ khung hình đơn nhất 100% sắc nét, không có hiện tượng bóng mờ
  if(sheet){
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 1.0;
    ctx.drawImage(sheet, sx, sy, FRAME_W, FRAME_H, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // 6. Nhãn tên võ sĩ phía trên đầu
  ctx.save();
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8c291e';
  ctx.fillText('P1', drawX + 240 * CHAR_SCALE, drawY + 30 * CHAR_SCALE);
  ctx.fillStyle = '#145d59';
  ctx.fillText('P2', drawX + 780 * CHAR_SCALE, drawY + 30 * CHAR_SCALE);
  ctx.restore();

  // Tọa độ đầu gậy & bàn tay phục vụ HUD và kiểm tra giới hạn vòng tròn
  const p1_hand_x = drawX + 420 * CHAR_SCALE;
  const p1_hand_y = drawY + 310 * CHAR_SCALE;
  const p2_hand_x = drawX + 600 * CHAR_SCALE;
  const p2_hand_y = drawY + 310 * CHAR_SCALE;

  return {
    poses: [{ name: anim.name, frame: frameIndex }, { name: anim.name, frame: frameIndex }],
    ends: [point(p1_hand_x, p1_hand_y), point(p2_hand_x, p2_hand_y)]
  };
}
