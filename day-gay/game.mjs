import {createMatch,advance,STEP,clamp,makeArms} from './physics.mjs';
import {loadArt,render,makePose,poleEnds} from './render.mjs';

const $ = id => document.getElementById(id), canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
let match = createMatch(), art, running = false, paused = false, last = 0, accumulator = 0;
const keys = new Set(), pointers = new Map();
const controls = [...document.querySelectorAll('[data-action]')];
const bindings = {KeyA:[0,'attack'],KeyS:[0,'defend'],KeyL:[1,'attack'],KeyK:[1,'defend']};

function clearInput(){keys.clear();pointers.clear();controls.forEach(b=>b.classList.remove('held'));}

function inputs(){
  const result = [{attack:false,defend:false},{attack:false,defend:false}];
  for(const code of keys){const [i,action]=bindings[code];result[i][action]=true;}
  for(const [i,action] of pointers.values())result[i][action]=true;
  if($('mode').value==='bot'){
    const phase=match.elapsed%6.7;
    result[1]={attack:phase>2.2&&phase<5.25,defend:phase<=2.2};
  }
  return result;
}

function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value;}

function hud(){
  $('clock').textContent=String(Math.ceil(match.time)).padStart(2,'0');
  match.players.forEach((p,i)=>{
    const active=p.attack>.5?'Dồn lực':p.defend>.5?'Trụ vững':'Hồi sức';
    $('stance'+i).textContent=active+' · '+Math.round(p.energy)+'%';
    $('energy'+i).value=p.energy;
  });
  $('advantage').style.left=`${50-clamp(match.advantage/Math.max(match.elapsed,1)/198,-1,1)*47}%`;
  if(running&&!paused){
    const d=match.players[0].force-match.players[1].force;
    setText('status',Math.abs(d)<3?'Hai bên đang giằng co':d>0?'P1 đang dồn lực về phía trước':'P2 đang dồn lực về phía trước');
  }
  for(const b of controls){
    const key=Object.entries(bindings).find(([,v])=>v[0]===Number(b.dataset.player)&&v[1]===b.dataset.action)?.[0];
    const held=keys.has(key)||[...pointers.values()].some(v=>v[0]===Number(b.dataset.player)&&v[1]===b.dataset.action);
    b.classList.toggle('held',held&&running&&!paused);
    b.setAttribute('aria-pressed',String(held&&running&&!paused));
    b.disabled=!running||paused||(b.dataset.player==='1'&&$('mode').value==='bot');
  }
}

function end(){
  running=false;
  clearInput();
  $('pause').disabled=true;
  $('dialog').hidden=false;
  $('dialog-title').textContent=match.winner==='draw'?'Trận đấu hòa':match.winner===0?'Người chơi 1 thắng!':$('mode').value==='bot'?'Đối thủ máy thắng!':'Người chơi 2 thắng!';
  $('result').textContent=match.reason;
  $('status').textContent=match.reason;
  $('start').textContent='Đấu lại';
  hud();
}

function tick(now){
  const dt=last?Math.min((now-last)/1000,.1):0;
  last=now;
  if(running&&!paused){
    accumulator+=dt;
    const currentInputs = inputs();

    while(accumulator>=STEP){
      advance(match,currentInputs);
      accumulator-=STEP;
      if(match.winner!==null){
        end();
        break;
      }
    }
  }
  if(art) render(ctx,art,match,dt||0.016);
  hud();
  requestAnimationFrame(tick);
}

function start(){
  match=createMatch();
  accumulator=0;
  running=true;
  paused=false;
  clearInput();
  $('dialog').hidden=true;
  $('pause').disabled=false;
  $('pause').textContent='Tạm dừng';
  $('name2').textContent=$('mode').value==='bot'?'ĐỐI THỦ MÁY':'NGƯỜI CHƠI 2';
}

function pause(){
  if(!running)return;
  paused=!paused;
  clearInput();
  $('pause').textContent=paused?'Tiếp tục':'Tạm dừng';
  $('status').textContent=paused?'Đã tạm dừng · bấm Tiếp tục để đấu':'Trận đấu tiếp tục';
}

window.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&!e.repeat){pause();return;}
  if(!bindings[e.code]||e.target.matches('select,input,textarea'))return;
  e.preventDefault();
  if(running&&!paused)keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(running&&!paused)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(running&&!paused)pause();}});

controls.forEach(b=>{
  b.addEventListener('pointerdown',e=>{
    if(b.disabled)return;
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,[Number(b.dataset.player),b.dataset.action]);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>pointers.delete(e.pointerId));
  b.addEventListener('contextmenu',e=>e.preventDefault());
});

$('start').addEventListener('click',start);
$('pause').addEventListener('click',pause);

$('help-toggle').addEventListener('click',()=>{
  const show=$('help').hidden;
  $('help').hidden=!show;
  $('help-toggle').setAttribute('aria-expanded',String(show));
});

// Explicit QA mode exposes deterministic snapshots without changing the live game path.
if(new URLSearchParams(location.search).has('qa'))window.duelQA={get state(){return match;},start,pause,render:()=>render(ctx,art,match),pose:i=>makePose(match,i),arms:i=>makeArms(match,i),pole:()=>poleEnds(match),step:(input,n=1)=>{for(let k=0;k<n;k++)advance(match,input);render(ctx,art,match);hud();},stop:()=>{running=false;},finish:end};

loadArt().then(result=>{
  art=result;
  $('loading').hidden=true;
  $('start').disabled=false;
  requestAnimationFrame(tick);
}).catch(error=>{
  $('loading').textContent=error.message+' · Hãy tải lại trang.';
  console.error(error);
});
