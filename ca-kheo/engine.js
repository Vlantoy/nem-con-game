(function(root){'use strict';const UNIT=65,END=30*UNIT,LENGTH=148;
function ground(x){if(x>=890&&x<970||x>=1040&&x<1125||x>=1550&&x<1630)return null;if(x>=810&&x<890)return -24;if(x>=970&&x<1040)return -24;if(x>=1125&&x<1210)return -12;if(x>=440&&x<545)return -22;if(x>=545&&x<630)return -42;if(x>=630&&x<715)return -20;if(x>=1470&&x<1550)return -18;if(x>=1630&&x<1730)return -35;return 0;}
function create(checkpoint=0){const x=checkpoint*UNIT+75;return{feet:[{x:x-20,y:ground(x-20)??0},{x:x+20,y:ground(x+20)??0}],hip:{x,y:-LENGTH},vx:0,vy:0,angle:0,angular:0,active:0,hold:0,swing:0,phase:'stance',phaseTime:0,liftFrom:null,air:null,landingTarget:null,reach:0,unstable:0,status:'play',checkpoint,distance:checkpoint,steps:0,message:'',fallTime:0};}
function landing(s){const support=s.feet[1-s.active];const x=support.x+32+s.reach;return{x,y:ground(x)};}
function fall(s,message){if(s.status!=='play')return;s.status='falling';s.fallTime=0;s.message=message;s.vy=-24;s.angular=(s.hip.x-s.feet[1-s.active].x>=0?1:-1)*1.4;}
function release(s){if(s.status!=='play'||s.phase!=='swing')return false;s.landingTarget=landing(s);s.phase='lower';s.phaseTime=0;s.lowerFrom={...s.air};return true;}
function tick(s,dt,held){
if(s.status==='falling'){s.fallTime+=dt;s.vy+=480*dt;s.hip.y+=s.vy*dt;s.hip.x+=s.vx*dt;s.angle+=s.angular*dt;const floor=ground(s.hip.x)??30;if(s.hip.y>floor-24){s.hip.y=floor-24;s.vy*=-.18;s.vx*=.95;s.angular*=.9;}if(s.fallTime>1.15)s.status='fallen';return;}
if(s.status!=='play')return;s.phaseTime+=dt;
if(held&&s.phase==='stance'){s.phase='swing';s.phaseTime=0;s.hold=0;s.reach=0;s.liftFrom={...s.feet[s.active]};s.air={...s.liftFrom};}
if(s.phase==='swing'){s.hold+=dt;s.reach=132*(1-Math.exp(-s.hold*1.55));const target=landing(s),t=Math.min(1,s.phaseTime/.3);s.air.x=s.liftFrom.x+(target.x-s.liftFrom.x)*t;s.air.y=s.liftFrom.y-38*Math.sin(t*Math.PI/2);s.swing=32+s.reach;}
if(s.phase==='lower'){const t=Math.min(1,s.phaseTime/.22),p=s.landingTarget;s.air.x=s.lowerFrom.x+(p.x-s.lowerFrom.x)*t;s.air.y=s.lowerFrom.y+((p.y??35)-s.lowerFrom.y)*t*t;if(t===1){const support=s.feet[1-s.active],dy=p.y===null?0:p.y-support.y;if(p.y===null){fall(s,'Đầu kheo trượt xuống suối.');return;}if(Math.abs(dy)>52){fall(s,'Bậc cao quá — chưa đặt được chân.');return;}s.feet[s.active]={...p};s.active=1-s.active;s.phase='transfer';s.phaseTime=0;s.air=null;s.steps++;s.vx+=Math.min(35,(p.x-support.x)*.18);}}
if(s.phase==='transfer'&&s.phaseTime>.25){s.phase='stance';s.phaseTime=0;s.hold=0;s.reach=0;}
// The body follows the support rather than teleporting to the foot midpoint.
const single=s.phase==='swing'||s.phase==='lower',support=s.feet[1-s.active];const desired=single?support.x+8+(s.phase==='swing'?s.hold*9:0):(s.feet[0].x+s.feet[1].x)/2+8;const acceleration=(desired-s.hip.x)*20-s.vx*6;s.vx+=acceleration*dt;s.hip.x+=s.vx*dt;
const feet=single?[support]:s.feet;let desiredY=0;for(const f of feet){const dx=s.hip.x-f.x;desiredY+=f.y-Math.sqrt(Math.max(900,LENGTH*LENGTH-dx*dx));}desiredY/=feet.length;s.vy+=((desiredY-s.hip.y)*80-s.vy*15)*dt;s.hip.y+=s.vy*dt;
const tiltTarget=Math.max(-.7,Math.min(.7,(s.hip.x-desired)*.008+s.vx*.002));s.angular+=(tiltTarget-s.angle)*18*dt-s.angular*7*dt;s.angle+=s.angular*dt;
const min=Math.min(...s.feet.map(f=>f.x)),max=Math.max(...s.feet.map(f=>f.x)),spread=max-min;const imbalance=single?Math.abs(s.hip.x-support.x):Math.max(0,min-s.hip.x,s.hip.x-max);const unsafe=imbalance>64||spread>148||Math.abs(s.angle)>.65;s.unstable=Math.max(0,s.unstable+(unsafe?dt:-dt*2));if(s.unstable>.42)fall(s,spread>148?'Hai chân xoạc quá xa — bước ngắn lại để giữ thế.':'Người đã nghiêng khỏi chân trụ.');
s.distance=Math.max(s.distance,Math.max(0,(min-55)/UNIT));const cp=Math.min(20,Math.floor(s.distance/10)*10);if(cp>s.checkpoint)s.checkpoint=cp;if(s.distance>=30)s.status='won';}
function step(s,dt,held){let remaining=Math.min(.05,Math.max(0,dt));while(remaining>1e-8){const h=Math.min(remaining,1/120);tick(s,h,held);remaining-=h;}}
function cancel(s){if(s.status!=='play')return;if(s.phase==='swing'){s.phase='stance';s.air=null;s.hold=0;s.reach=0;} }
const api={UNIT,END,LENGTH,ground,create,step,landing,release,cancel};if(typeof module!=='undefined')module.exports=api;else root.StiltEngine=api;})(typeof window!=='undefined'?window:this);
