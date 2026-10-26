(() => {
 'use strict';
 const pending=[],seen=new WeakSet();let done=0,failed=false,finished=false;
 const style=document.createElement('style');
 style.textContent='#asset-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#12382f;color:#f6edce;font-family:system-ui,sans-serif;padding:24px}#asset-loader section{width:min(360px,100%);text-align:center}#asset-loader h2{font-size:26px;margin:0 0 18px}#asset-loader p{font-size:16px;line-height:1.6;color:#cfdbc9}#asset-loader progress{width:100%;height:8px;accent-color:#ecc479}#asset-loader button{border:0;border-radius:10px;padding:14px 28px;background:#ecc479;color:#12382f;font:700 16px system-ui;cursor:pointer}';
 document.head.append(style);
 const layer=document.createElement('div');layer.id='asset-loader';layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');layer.innerHTML='<section><h2>Đang chuẩn bị cuộc vui…</h2><progress aria-label="Tiến trình tải trò chơi"></progress><p>Đang tải hình ảnh và dựng màn chơi.</p><button hidden>Thử lại</button></section>';
 const mount=()=>{document.body.append(layer);document.querySelector('main')?.setAttribute('inert','');};
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
 const bar=layer.querySelector('progress'),copy=layer.querySelector('p'),retry=layer.querySelector('button');retry.onclick=()=>location.reload();
 function fail(){if(finished||failed)return;failed=true;layer.querySelector('h2').textContent='Chưa tải đủ trò chơi';copy.textContent='Kiểm tra kết nối rồi thử tải lại nhé.';bar.hidden=true;retry.hidden=false;}
 function track(img){
  if(seen.has(img))return img;seen.add(img);
  const task=new Promise((resolve,reject)=>{
   let settled=false;
   const cleanup=()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',broken);};
   const broken=()=>{if(settled)return;settled=true;cleanup();reject(new Error('Asset unavailable'));};
   const loaded=async()=>{if(settled)return;settled=true;cleanup();try{if(!img.naturalWidth)throw new Error('Empty image');if(img.decode)await img.decode();done++;bar.max=pending.length;bar.value=done;copy.textContent=`Đã tải ${done} / ${pending.length} hình ảnh.`;resolve();}catch(e){reject(e);}};
   img.addEventListener('load',loaded,{once:true});img.addEventListener('error',broken,{once:true});
   if(img.complete&&img.currentSrc)loaded();
  });
  pending.push(task);task.catch(fail);return img;
 }
 window.GameLoader={track};
 window.addEventListener('error',fail,true);
 const timeout=setTimeout(fail,45000);
 window.addEventListener('load',async()=>{
  try{
   document.querySelectorAll('img').forEach(track);
   await Promise.all(pending);
   if(document.fonts)await document.fonts.ready;
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(failed)return;finished=true;clearTimeout(timeout);document.querySelector('main')?.removeAttribute('inert');layer.remove();style.remove();
  }catch{fail();}
 },{once:true});
})();
