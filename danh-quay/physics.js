(function(root){'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const RADIUS=4.65,TOP_RADIUS=.48;
function top(x,z){return {x,z,vx:0,vz:0,spin:100,stability:100,fallen:false,out:false};}
function targetFor(round){return [{x:-.65,z:-1.15},{x:.85,z:-1.6},{x:-1.1,z:-.9}][round%3];}
function create(round=0){const t=targetFor(round);return {attacker:top(0,3.25),target:top(t.x,t.z),time:0,hit:false,impact:0,done:false,score:0};}
function launch(s,dx,dz,power){if(s.launched||s.done)return false;const length=Math.hypot(dx,dz);if(length<.001||dz>=-.05)return false;s.launched=true;const p=clamp(power,.15,1),speed=2.6+p*6.2;s.attacker.vx=dx/length*speed;s.attacker.vz=dz/length*speed;s.attacker.spin=60+p*40;s.attacker.stability=100-Math.max(0,p-.86)*120;return true;}
function tally(s){const damage=100-s.target.stability;return Math.round(clamp((s.hit?20:0)+damage*.5+(s.target.fallen?25:0)+(s.target.out?15:0),0,100));}
function step(s,dt){if(!s.launched||s.done)return [];const events=[];const steps=Math.max(1,Math.ceil(Math.min(dt,.05)/.008));const h=Math.min(dt,.05)/steps;
for(let k=0;k<steps;k++){s.time+=h;for(const t of [s.attacker,s.target]){const damping=Math.exp(-(t.fallen?2.2:.87)*h);t.vx*=damping;t.vz*=damping;t.x+=t.vx*h;t.z+=t.vz*h;t.spin=Math.max(0,t.spin-h*(t.fallen?16:2));if(t.stability<28||t.spin<8){if(!t.fallen)events.push('fall');t.fallen=true;}if(!t.out&&Math.hypot(t.x,t.z)>RADIUS){t.out=true;t.fallen=true;t.stability=0;events.push('out');}}
const a=s.attacker,b=s.target,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),diameter=TOP_RADIUS*2;
if(d<diameter&&!b.out&&!a.out){const nx=d>.0001?dx/d:1,nz=d>.0001?dz/d:0,closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;const correction=(diameter-d)/2;a.x-=nx*correction;a.z-=nz*correction;b.x+=nx*correction;b.z+=nz*correction;
if(closing>.05){const impulse=closing*.82;a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;const damage=closing*17;b.stability=clamp(b.stability-damage,0,100);b.spin=clamp(b.spin-closing*8,0,100);a.stability=clamp(a.stability-closing*4,0,100);s.hit=true;s.impact=Math.max(s.impact,closing);events.push('hit');}}
}
if(s.time>=7.5||(s.time>2.8&&Math.hypot(s.attacker.vx,s.attacker.vz)+Math.hypot(s.target.vx,s.target.vz)<.1)){s.done=true;s.score=tally(s);}return events;}
const api={create,launch,step,tally,targetFor,RADIUS,TOP_RADIUS};if(typeof module!=='undefined')module.exports=api;else root.TopPhysics=api;
})(typeof window!=='undefined'?window:this);
