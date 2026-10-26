(() => {
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STEP=1/120;
function createMatch(){
  return {
    time:60,
    elapsed:0,
    x:0,
    velocity:0,
    advantage:0,
    winner:null,
    reason:'',
    stepState:[0,1].map(()=>({phase:0,lastFoot:'left'})),
    players:[0,1].map(()=>({energy:100,attack:0,defend:0,force:0}))
  };
}
function advance(s,inputs,dt=STEP){
  if(s.winner!==null)return;
  s.elapsed+=dt;s.time=Math.max(0,s.time-dt);if(s.time<1e-9)s.time=0;
  s.players.forEach((p,i)=>{
    const defend=inputs[i].defend,attack=inputs[i].attack&&!defend;
    const ease=1-Math.exp(-dt*12);
    p.attack+=(Number(attack)-p.attack)*ease;p.defend+=(Number(defend)-p.defend)*ease;
    p.energy=clamp(p.energy+dt*(attack?-19:defend?7:15),0,100);
    p.force=attack?(30+p.energy*.9)*(1+.12*Math.sin(s.elapsed*8)):0;
  });
  const [a,b]=s.players;
  const net=(a.force-b.force)/(1+3.8*(a.force>b.force?b.defend:a.defend));
  s.velocity+=(net*1.55-s.velocity*(4.5+1.5*(a.defend+b.defend)))*dt;
  s.x+=s.velocity*dt;s.advantage+=s.x*dt;

  // Update alternating footstep gait for advancing side
  if(s.stepState){
    s.players.forEach((p,i)=>{
      const st=s.stepState[i];
      const fwdSpeed=i===0?s.velocity:-s.velocity;
      const isAdvancing=fwdSpeed>0.2||(p.attack>0.35&&p.force>s.players[1-i].force);
      if(isAdvancing&&fwdSpeed>0.12){
        // Natural human stepping cadence: ~1.5 to 2.2 steps per second
        const cadence=clamp(Math.abs(fwdSpeed)*0.15,1.4,2.2);
        st.phase+=cadence*dt;
      }else{
        // When stopping, smoothly complete the active stride to ground the foot
        const target=Math.round(st.phase);
        st.phase+=(target-st.phase)*(1-Math.exp(-dt*8));
      }
    });
  }

  const outside=[0,1].map(i=>{
    const pose=makePose(s,i);
    return [pose.front,pose.rear].some(foot=>{
      if(foot.y<477)return false;
      const y=foot.y+17;
      const half=609*Math.sqrt(Math.max(0,1-((y-471.5)/67)**2));
      return foot.x-21<721-half||foot.x+21>721+half;
    });
  });
  if(outside[0]||outside[1]){s.winner=outside[0]&&outside[1]?'draw':outside[0]?1:0;s.reason=s.winner==='draw'?'Cả hai cùng ra khỏi vòng phấn.':outside[0]?'Người chơi 1 đã bước ra ngoài vòng phấn.':'Người chơi 2 đã bước ra ngoài vòng phấn.';}
  else if(s.time===0){const mean=s.advantage/Math.max(s.elapsed,STEP);s.winner=Math.abs(mean)<2?'draw':mean>0?0:1;s.reason=s.winner==='draw'?'Hai bên giữ thế cân bằng khi hết giờ.':'Hết giờ · thắng nhờ chiếm ưu thế sân lâu hơn.';}
}
function solve(root,end,a,b,bend=1){
  const dx=end.x-root.x,dy=end.y-root.y,raw=Math.hypot(dx,dy)||.001;
  const d=clamp(raw,Math.abs(a-b)+.001,a+b-.001),ux=dx/raw,uy=dy/raw;
  const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
  return {x:root.x+ux*along-uy*height*bend,y:root.y+uy*along+ux*height*bend};
}

const point=(x,y)=>({x,y});
function makePose(s,i){
  const p=s.players[i],otherP=s.players[1-i],sign=i===0?1:-1,base=(i===0?505:942)+s.x;
  
  // 1. DƯỚN vs HẠ TẤN vs CÙNG DƯỚN
  const bothAttack=Math.min(p.attack,otherP.attack);
  const tremor=bothAttack>0.25?Math.sin(s.elapsed*55+i*1.6)*bothAttack*2.4:0;
  
  // Pushing fighter lifts higher (dướn cao), defending fighter drops stance (hạ tấn), clashing both lift (cùng dướn)
  const duonLift=p.attack*22+bothAttack*8;
  const hatanDrop=p.defend*26+(otherP.attack>p.attack?(otherP.attack-p.attack)*10:0);
  const hipY=405-duonLift+hatanDrop+tremor;
  const hip=point(base,hipY);
  
  // Torso tilt forward when attacking, brace back when defending
  const angle=(p.attack*0.18-p.defend*0.12)+(bothAttack*0.06);
  const shoulder=point(
    base+sign*(-17*Math.cos(angle)+126*Math.sin(angle))+(tremor*0.4*sign),
    hip.y-17*Math.sin(angle)-126*Math.cos(angle)
  );

  // 2. Alternating footstep walking gait (Trái -> Phải -> Trái)
  const st=s.stepState?s.stepState[i]:null;
  const stepPhase=st?st.phase:(s.elapsed*7.2+i*Math.PI);
  const cycleIndex=Math.floor(stepPhase);
  const frac=clamp(stepPhase-cycleIndex,0,1);
  
  const fwdSpeed=i===0?s.velocity:-s.velocity;
  const isAdvancing=fwdSpeed>0.25||(p.attack>0.4&&p.force>otherP.force);
  const strideAmp=clamp(Math.abs(fwdSpeed)/25,0,1)*22+p.attack*14;
  
  let liftFront=0,liftRear=0,offsetFront=0,offsetRear=0;
  if(isAdvancing&&strideAmp>2){
    const isRearStepping=(cycleIndex%2===0);
    const liftHeight=Math.sin(Math.PI*frac)*26;
    const swingDist=(Math.sin(Math.PI*(frac-0.5))*0.5+0.5)*strideAmp*1.5;
    if(isRearStepping){
      // Rear foot (Left foot) steps forward:
      liftRear=liftHeight;
      offsetRear=swingDist;
    }else{
      // Front foot (Right foot) steps forward:
      liftFront=liftHeight;
      offsetFront=swingDist;
    }
  }

  const front=point(base+sign*(42+p.attack*24+p.defend*12+offsetFront),478-liftFront);
  const rear=point(base-sign*(96+p.defend*14-offsetRear),478-liftRear);
  const rootRear=point(hip.x-sign*8,hip.y);
  
  const kneeFront=solve(hip,front,84,78,-sign);
  const kneeRear=solve(rootRear,rear,84,78,sign);
  return {sign,hip,shoulder,front,rear,rootRear,kneeFront,kneeRear,liftFront,liftRear};
}

function poleEnds(s){
  return [0,1].map(i=>{
    const p=s.players[i];
    return point((i===0?535:912)+s.x,342-p.attack*24+p.defend*12);
  });
}

function makeArms(s,i){
  const pose=makePose(s,i),ends=poleEnds(s),t=i===0?.27:.73;
  const far=point(ends[0].x+(ends[1].x-ends[0].x)*t,ends[0].y+(ends[1].y-ends[0].y)*t);
  return [ends[i],far].map((hand,j)=>{
    const shoulder=point(pose.shoulder.x-pose.sign*j*6,pose.shoulder.y+j*8);
    return {shoulder,elbow:solve(shoulder,hand,84,94,pose.sign),hand};
  });
}


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

async function loadArt(){
  const art = {};
  await Promise.all(names.map(name => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { art[name] = img; resolve(); };
    img.onerror = () => reject(new Error('Không tải được ' + name));
    img.src = `assets/${name}.png`;
  })));
  return art;
}


// Hệ thống hạt bụi cát khi miết chân trượt sàn
const dust = [];
function addDust(x, y, count = 4, color = '#c2a77b', vxScale = 1){
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
const CHAR_SCALE = 0.52;
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
function resolveSheet(s){
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

function render(ctx, art, s, dt = 0.016){
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


loadArt().then(art => {
  // 1. Scene Duon vs Ha Tan
  const ctxDuon = document.getElementById('canvas-duon').getContext('2d');
  const matchDuon = createMatch();
  for(let i = 0; i < 90; i++) {
    advance(matchDuon, [{attack: true, defend: false}, {attack: false, defend: true}], STEP);
  }

  // 2. Scene Clash
  const ctxClash = document.getElementById('canvas-clash').getContext('2d');
  const matchClash = createMatch();
  for(let i = 0; i < 90; i++) {
    advance(matchClash, [{attack: true, defend: false}, {attack: true, defend: false}], STEP);
  }

  // 3. Scene Walking Gait (P1 pushing P2 across the circle)
  const ctxWalk = document.getElementById('canvas-walk').getContext('2d');
  const matchWalk = createMatch();
  for(let i = 0; i < 120; i++) {
    advance(matchWalk, [{attack: true, defend: false}, {attack: false, defend: false}], STEP);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
    last = now;

    advance(matchDuon, [{attack: true, defend: false}, {attack: false, defend: true}], dt);
    render(ctxDuon, art, matchDuon, dt);

    advance(matchClash, [{attack: true, defend: false}, {attack: true, defend: false}], dt);
    render(ctxClash, art, matchClash, dt);

    advance(matchWalk, [{attack: true, defend: false}, {attack: false, defend: false}], dt);
    if (matchWalk.x > 140) {
      matchWalk.x = -60;
    }
    render(ctxWalk, art, matchWalk, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}).catch(err => {
  console.error('Lỗi tải hình ảnh:', err);
});

})();
