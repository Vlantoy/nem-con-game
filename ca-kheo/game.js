(()=>{'use strict';const $=id=>document.getElementById(id),c=$('scene'),ctx=c.getContext('2d'),E=window.StiltEngine;const bg=(window.GameLoader?.track(new Image()) || new Image());bg.src='../assets/background/Background-extend.png';const body=(window.GameLoader?.track(new Image()) || new Image());body.src='../assets/character/p1/body.png';let s=E.create(),phase='menu',held=false,inputs=new Set(),last=0,camera=0,walk=0,previous=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){c.width=Math.round(c.clientWidth*Math.min(devicePixelRatio,1.5));c.height=Math.round(c.clientHeight*Math.min(devicePixelRatio,1.5));}new ResizeObserver(resize).observe(c);resize();
function clear(){held=false;inputs.clear();E.cancel(s);$('hold').classList.remove('active');}
function begin(){s=E.create(s.status==='won'?0:s.checkpoint);phase='play';camera=s.feet[0].x-140;clear();$('overlay').hidden=true;$('dock').hidden=false;$('pause').disabled=false;$('pause').textContent='Tạm dừng';}
function result(){phase='result';clear();$('dock').hidden=true;$('pause').disabled=true;$('overlay').hidden=false;document.querySelector('.panel h2').innerHTML=s.status==='won'?'Về đích rồi!':'Chưa vững chân.';$('copy').textContent=s.status==='won'?`Bạn đã qua đường bản sau ${s.steps} bước. Thử đi lại với ít bước hơn nhé!`:s.message+(s.checkpoint?' Tiếp tục từ cờ '+s.checkpoint+' m.':' Thử lại ngay từ đầu.');$('start').textContent=s.status==='won'?'Đi lại lần nữa →':'Thử lại →';}
function press(key){if(phase!=='play')return;inputs.add(key);held=true;$('hold').classList.add('active');}
function release(key){if(!inputs.has(key))return;inputs.delete(key);if(inputs.size)return;held=false;$('hold').classList.remove('active');if(phase==='play'){const ok=E.release(s);if(ok)walk=1;if(['fallen','won'].includes(s.status))result();}}
for(const el of [c,$('hold')]){el.addEventListener('pointerdown',e=>{if(phase!=='play')return;e.preventDefault();el.setPointerCapture(e.pointerId);press('p'+e.pointerId);});el.addEventListener('pointerup',e=>release('p'+e.pointerId));el.addEventListener('pointercancel',clear);el.addEventListener('lostpointercapture',e=>{if(inputs.has('p'+e.pointerId))clear();});}
window.addEventListener('keydown',e=>{if($('guide').open)return;if(e.code==='Space'&&phase==='play'){e.preventDefault();press('space');}if(e.code==='Escape')pause();});window.addEventListener('keyup',e=>{if(e.code==='Space'&&inputs.has('space')){e.preventDefault();release('space');}});
function pause(){if(phase!=='play')return;clear();phase='paused';$('overlay').hidden=false;$('dock').hidden=true;document.querySelector('.panel h2').textContent='Nghỉ chân một chút.';$('copy').textContent='Đường bản đang chờ bạn.';$('start').textContent='Tiếp tục →';$('pause').textContent='Tiếp tục';}
$('start').onclick=()=>{if(phase==='paused'){phase='play';$('overlay').hidden=true;$('dock').hidden=false;$('pause').textContent='Tạm dừng';}else begin();};$('pause').onclick=()=>phase==='paused'?$('start').click():pause();$('help').onclick=()=>{pause();$('guide').showModal();};$('close').onclick=()=>$('guide').close();window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function line(x,y,x2,y2,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function draw(dt){const W=c.width,H=c.height,scale=Math.min(W/780,H/520),vw=W/scale,vh=H/scale,base=vh*.71;ctx.setTransform(scale,0,0,scale,0,0);ctx.imageSmoothingEnabled=false;
if(bg.complete&&bg.naturalWidth){const bh=vh,bw=bh*bg.naturalWidth/bg.naturalHeight;ctx.drawImage(bg,-(camera*.15%Math.max(1,bw-vw)),0,Math.max(vw,bw),bh);}else rect(0,0,vw,vh,'#8cbaae');
const midpoint=(s.feet[0].x+s.feet[1].x)/2;const desired=midpoint-vw*.32;camera+=(desired-camera)*(1-Math.exp(-6*dt));ctx.save();ctx.translate(-camera,base);
for(let x=Math.floor(camera/8)*8;x<camera+vw+10;x+=8){const y=E.ground(x);if(y===null){rect(x,18,8,vh,'#559c9f');rect(x,20+(Math.floor(x/8)%3)*3,6,2,'#acd6ba');}else{rect(x,y,8,vh,'#987348');rect(x,y,8,6,'#84944f');rect(x,y+6,8,4,'#c7aa65');}}
for(const cp of [0,650,1300,1950]){const y=E.ground(cp)??0;line(cp,y,cp,y-85,'#795b38',4);ctx.fillStyle=cp<=s.checkpoint*65?'#e8c77e':'#315f52';ctx.beginPath();ctx.moveTo(cp,y-85);ctx.lineTo(cp+32,y-75);ctx.lineTo(cp,y-61);ctx.fill();ctx.font='bold 10px Arial';ctx.fillStyle='#fff0c4';ctx.fillText(cp/65+' m',cp+6,y-92);}
const target=E.landing(s),feet=s.feet.map((f,i)=>i===s.active&&s.air?{...s.air}:{...f});
const hipX=s.hip.x,hipY=s.hip.y;
function joint(ax,ay,bx,by,l1,l2,bend){const dx=bx-ax,dy=by-ay,d=Math.max(.001,Math.hypot(dx,dy)),dist=Math.min(d,l1+l2-.01),along=(l1*l1-l2*l2+dist*dist)/(2*dist),height=Math.sqrt(Math.max(0,l1*l1-along*along));return{x:ax+dx/d*along-dy/d*height*bend,y:ay+dy/d*along+dx/d*height*bend};}
// Rounded, shaded joint chains keep limbs readable against the detailed costume.
function chain(points,color,width,outline='#263733'){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 function stroke(w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);if(points.length===3){const [a,k,b]=points;const q1={x:k.x+(a.x-k.x)*.2,y:k.y+(a.y-k.y)*.2},q2={x:k.x+(b.x-k.x)*.2,y:k.y+(b.y-k.y)*.2};ctx.lineTo(q1.x,q1.y);ctx.quadraticCurveTo(k.x,k.y,q2.x,q2.y);ctx.lineTo(b.x,b.y);}else ctx.lineTo(points[1].x,points[1].y);ctx.stroke();}
 stroke(width+3,outline);stroke(width,color);ctx.restore();
}
const rig=feet.map((f,i)=>{const offset=i?9:-9,foot={x:f.x+(hipX-f.x)*.34,y:f.y-65};return{f,i,foot,offset};});
rig.forEach(({f,i,foot,offset})=>{
 line(f.x,f.y,foot.x+(foot.x-f.x)*1.15,foot.y-132,'#5b432b',7);line(f.x-1,f.y,foot.x+(foot.x-f.x)*1.15-1,foot.y-132,i===s.active?'#e1bf78':'#ab8c55',3);line(foot.x-9,foot.y,foot.x+11,foot.y,'#684a2e',5);
 const localHipX=i?10:-5,localHipY=-13;const hip={x:hipX+localHipX*Math.cos(s.angle)-localHipY*Math.sin(s.angle),y:hipY+localHipX*Math.sin(s.angle)+localHipY*Math.cos(s.angle)},ankle={x:foot.x,y:foot.y-7},knee=joint(hip.x,hip.y,ankle.x,ankle.y,42,43,-1);
 chain([hip,knee,ankle],i?'#304458':'#40596c',14);chain([{x:hip.x-3,y:hip.y+5},{x:knee.x-3,y:knee.y},{x:ankle.x-2,y:ankle.y-4}],i?'#496071':'#617585',3,i?'#496071':'#617585');
 chain([{x:foot.x-6,y:foot.y-5},{x:foot.x+12,y:foot.y-5}],'#30353b',7,'#202a2d');
});
// Paint far arm before the vest and near arm after it.
function drawArm({f,i,foot}){
 const localX=i?17:-12,localY=-68,cos=Math.cos(s.angle),sin=Math.sin(s.angle);
 const shoulder={x:hipX+localX*cos-localY*sin,y:hipY+localX*sin+localY*cos};
 const gripY=foot.y-116+(i?4:-3),poleTopX=foot.x+(foot.x-f.x)*1.15;const hand={x:foot.x+(poleTopX-foot.x)*(foot.y-gripY)/132,y:gripY};
 const elbow=joint(shoulder.x,shoulder.y,hand.x,hand.y,30,30,1);
 chain([shoulder,elbow],i?'#ede5ce':'#c5c7b4',10,'#55594b');
 chain([elbow,hand],i?'#dfa976':'#bb8b60',7,'#70543c');
 chain([{x:elbow.x-1,y:elbow.y-1},{x:hand.x-1,y:hand.y-1}],'#f3c797',2,'#f3c797');
 ctx.fillStyle='#765237';ctx.beginPath();ctx.ellipse(hand.x,hand.y,6,5,.2,0,Math.PI*2);ctx.fill();ctx.fillStyle=i?'#edbb86':'#d5a06d';ctx.beginPath();ctx.ellipse(hand.x-1,hand.y-1,4.5,3.8,.2,0,Math.PI*2);ctx.fill();
 line(hand.x-2,hand.y+1,hand.x+3,hand.y+1,'#ae774e',1);line(hand.x-2,hand.y+3,hand.x+2,hand.y+3,'#ae774e',1);
}
// Explicit occlusion excludes the torso even where source art has transparent pixels.
ctx.save();ctx.beginPath();ctx.rect(camera-1000,-2000,5000,4000);
const torsoMask=[[-18,-81],[22,-81],[24,-48],[20,-12],[-23,-12],[-20,-48]];
torsoMask.forEach(([x,y],index)=>{const px=hipX+x*Math.cos(s.angle)-y*Math.sin(s.angle),py=hipY+x*Math.sin(s.angle)+y*Math.cos(s.angle);if(index===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.clip('evenodd');drawArm(rig[1]);ctx.restore();
ctx.save();ctx.translate(hipX,hipY);ctx.rotate(s.angle);if(body.complete&&body.naturalWidth){// Mask the source's stationary arms; only head, neck and vest belong to this layer.
ctx.beginPath();ctx.moveTo(-13,-118);ctx.lineTo(33,-118);ctx.lineTo(34,-87);ctx.lineTo(22,-80);ctx.lineTo(22,-53);ctx.lineTo(18,-21);ctx.lineTo(26,-1);ctx.lineTo(-26,-1);ctx.lineTo(-20,-22);ctx.lineTo(-20,-55);ctx.lineTo(-12,-79);ctx.lineTo(-14,-87);ctx.closePath();ctx.clip();ctx.drawImage(body,250,0,540,820,-32,-118,76,118);}else rect(-18,-80,36,80,'#294e5c');ctx.restore();
drawArm(rig[0]);
if(held&&s.phase==='swing'){const y=target.y??10;ctx.strokeStyle=target.y===null||s.swing>145?'#d36a4b':'#fff0b0';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(target.x,y,13,5,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
ctx.restore();ctx.setTransform(1,0,0,1,0,0);}
function loop(now){const dt=Math.min((now-last)/1000||0,.05);last=now;if(phase==='play'){previous=s.checkpoint;E.step(s,dt,held);if(s.checkpoint>previous)$('tip').textContent='Đã lưu mốc '+s.checkpoint+' m';else $('tip').textContent=s.unstable>.1?'Đang chao đảo — đặt chân để giữ thế!':'';if(['fallen','won'].includes(s.status))result();}walk=Math.max(0,walk-dt*3);$('distance').textContent=Math.min(30,Math.floor(s.distance))+' / 30 m';$('progress').style.width=Math.min(100,s.distance/30*100)+'%';$('leg').textContent=s.active===0?'CHÂN TRÁI':'CHÂN PHẢI';draw(dt);requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();
