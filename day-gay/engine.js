/* Shared deterministic rules; presentation and input live in game.js. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const levels={easy:{width:.34,bot:.44,speed:.8},normal:{width:.29,bot:.63,speed:1},hard:{width:.24,bot:.77,speed:1.2}};
 function player(){return {force:.5,target:.5,quality:0,focus:0,cooldown:0,bursts:0,perfect:0};}
 function create(level='normal'){return {level,time:25,elapsed:0,position:0,velocity:0,players:[player(),player()],winner:null,reason:''};}
 function quality(force,target,width){const distance=Math.abs(force-target);return distance<width/8?1:distance<width/2?.73:.12;}
 function step(s,dt,held,bot=true){
  if(s.winner!==null)return [];dt=clamp(dt,0,.05);s.elapsed+=dt;s.time=Math.max(0,25-s.elapsed);const cfg=levels[s.level];const events=[];
  s.players.forEach((p,i)=>{
   p.target=.5+.22*Math.sin(s.elapsed*.83*cfg.speed+i*1.6)+.06*Math.sin(s.elapsed*1.9+i);
   if(i===1&&bot){p.force=clamp(p.target+.09*Math.sin(s.elapsed*3.4)+.025*Math.cos(s.elapsed*7),0,1);p.quality=cfg.bot+.12*Math.sin(s.elapsed*1.7);}
   else {p.force=clamp(p.force+(held[i]?.47:-.41)*dt,0,1);p.quality=quality(p.force,p.target,cfg.width);}
   p.cooldown=Math.max(0,p.cooldown-dt);
   if(p.quality>.95){p.perfect+=dt;p.focus+=dt;}else p.focus=Math.max(0,p.focus-dt*.7);
   if(p.focus>=.85&&p.cooldown===0){p.focus=0;p.cooldown=3;p.bursts++;s.velocity+=(i===0?1:-1)*.22;events.push(i);}
  });
  const difference=s.players[0].quality-s.players[1].quality;
  s.velocity+=(difference*.43-s.velocity*2.4)*dt;s.position=clamp(s.position+s.velocity*dt,-1,1);
  if(Math.abs(s.position)>=1){s.winner=s.position>0?0:1;s.reason='ring';}
  else if(s.time<=0){s.winner=Math.abs(s.position)<.025?2:s.position>0?0:1;s.reason='time';}
  return events;
 }
 const api={create,step,quality,levels};if(typeof module!=='undefined')module.exports=api;else root.StickEngine=api;
})(typeof window!=='undefined'?window:this);
