/* Small illustrations share the same pixel character renderer as the game. */
(() => {
 const source = document.createElement('script');
 // The drawing module is generated from the game's code-native art, without game state.
 source.src = new URL('art.js?v=20261018-portal-4',document.currentScript.src).href;document.head.append(source);
 document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.video;if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
  const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;frame.title=button.getAttribute('aria-label')||'Video tư liệu';frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';button.replaceWith(frame);
 }));
})();

(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const candidates=document.querySelectorAll('.section-heading,.game-card,.coming-heading,.coming-grid,.real-life-heading,.life-grid figure,.story-image,.story-copy,.detail-visual,.detail-copy,.next-game');
 if('IntersectionObserver' in window&&!reduce.matches){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.12,rootMargin:'0px 0px 20px 0px'});
  for(const el of candidates){el.dataset.reveal='';observer.observe(el);}document.documentElement.classList.add('motion-ready');
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  window.addEventListener('pageshow',e=>{if(e.persisted)for(const el of candidates)el.classList.add('is-visible');});
 }
 const petals=document.querySelectorAll('.petals i');petals.forEach((petal,i)=>{petal.style.setProperty('--left',(i*8.1)+'%');petal.style.setProperty('--duration',(13+i%5*3)+'s');petal.style.setProperty('--delay',(-i*2.7)+'s');});
 const hero=document.querySelector('.hero');
 if(hero&&!reduce.matches&&matchMedia('(pointer: fine)').matches){
  const controller=new AbortController();let frame=0;
  hero.addEventListener('pointermove',event=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const box=hero.getBoundingClientRect();hero.style.setProperty('--scene-x',((event.clientX-box.left)/box.width-.5)*-15+'px');hero.style.setProperty('--scene-y',((event.clientY-box.top)/box.height-.5)*-10+'px');});},{signal:controller.signal});
  hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);hero.style.setProperty('--scene-x','0px');hero.style.setProperty('--scene-y','0px');},{signal:controller.signal});
  window.addEventListener('pagehide',()=>{controller.abort();cancelAnimationFrame(frame);},{once:true});
 }
})();
