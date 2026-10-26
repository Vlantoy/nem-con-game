(() => {
 const button=document.querySelector('.menu-toggle'),menu=document.getElementById('mobile-menu');
 if(button&&menu){const close=()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');};button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';menu.hidden=expanded;button.setAttribute('aria-expanded',String(!expanded));});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();}});}
 const assets=new URL('assets/motifs/',document.currentScript.src);
 const scenes=Array.from(document.querySelectorAll('.games-section,.festival-section,.photo-section'));
 scenes.forEach(section=>{
  const ornament=document.createElement('img');ornament.className='scroll-ornament';ornament.src=new URL('dong-son-gold.svg',assets);ornament.alt='';ornament.setAttribute('aria-hidden','true');ornament.loading='lazy';section.append(ornament);
 });
 const flightLayer=document.createElement('div');flightLayer.className='flight-layer';flightLayer.setAttribute('aria-hidden','true');flightLayer.hidden=true;
 const flock=Array.from({length:5},(_,i)=>{const bird=document.createElement('img');bird.className='scroll-crane flock-bird';bird.src=new URL('crane-flight.svg',assets);bird.alt='';bird.style.width=(116-i*9)+'px';flightLayer.append(bird);return bird;});
 document.body.append(flightLayer);
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const motion=gsap.matchMedia();
 motion.add('(prefers-reduced-motion: no-preference)',()=>{
  const hero=document.querySelector('.hero-copy,.detail-hero-copy');
  if(hero)gsap.from(hero.children,{y:24,opacity:0,duration:.75,stagger:.09,ease:'power2.out',clearProps:'all'});
  document.querySelectorAll('[data-reveal]').forEach(el=>gsap.from(el,{y:32,opacity:0,duration:.8,ease:'power2.out',clearProps:'all',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
 });
 motion.add('(min-width: 1000px) and (prefers-reduced-motion: no-preference)',()=>{
  const collage=document.querySelector('.hero-montage');
  if(collage){gsap.from(collage,{y:28,opacity:0,duration:1,ease:'power2.out',clearProps:'all'});gsap.to('.hero-inset-photo',{y:-38,ease:'none',scrollTrigger:{trigger:'.home-hero',start:'top top',end:'bottom top',scrub:1}});}
 });
 motion.add('(prefers-reduced-motion: no-preference)',()=>{
  const compact=matchMedia('(max-width: 800px)').matches;
  const opening=document.querySelector('.home-hero');
  if(opening)gsap.to(opening,{'--hero-drum-turn':'360deg',ease:'none',scrollTrigger:{trigger:opening,start:'top top',end:()=>'+='+opening.offsetHeight*2,scrub:.7,invalidateOnRefresh:true}});
  document.querySelectorAll('.scroll-ornament').forEach(el=>gsap.fromTo(el,{rotation:-12,y:90},{rotation:36,y:-100,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1.2}}));
  document.querySelectorAll('.game-image,.gallery-grid .photo-button,.festival-grid figure>a').forEach((el,index)=>{
   const tl=gsap.timeline({scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.7}});
   tl.fromTo(el,{x:(index%2?1:-1)*(compact?18:55),y:55,scale:.94,rotation:compact?0:(index%2?2:-2),opacity:.4},{x:0,y:0,scale:1,rotation:0,opacity:1,duration:.3,ease:'power1.out'})
    .to(el,{x:0,y:0,scale:1,opacity:1,duration:.4})
    .to(el,{y:-35,scale:.97,opacity:.65,duration:.3,ease:'power1.in'});
  });
  let activeFlight=null;
  function flyPast(){
   if(activeFlight?.isActive())return;
   flightLayer.hidden=false;
   const vw=innerWidth,vh=innerHeight;
   const widths=[.43,.28,.23,.33,.19].map(r=>Math.min(compact?330:650,Math.max(compact?155:220,vw*r)));
   const lanes=[0,-.12,.16,-.24,.25];
   const duration=compact?1.55:1.85;
   activeFlight=gsap.timeline({onComplete:()=>{flightLayer.hidden=true;}});
   flock.forEach((bird,i)=>{
    const size=widths[i],delay=i*.09;
    gsap.set(bird,{width:size,zIndex:5-i,transformOrigin:'50% 50%'});
    activeFlight.fromTo(bird,{x:vw+size*.15,y:vh*(.66+lanes[i]),rotation:10,scale:.72,opacity:0},
     {x:-size*1.25,y:-vh*.3+vh*lanes[i]*.4,rotation:24,scale:1.12,duration,ease:'power1.inOut'},delay)
     .to(bird,{opacity:i===0?.96:.83,duration:.1},delay)
     .to(bird,{opacity:0,duration:.13},delay+duration-.13);
   });
  }
  // Fly once when the landing slogan reaches the reading area.
  const slogan=document.querySelector('.games-slogan');
  if(slogan)ScrollTrigger.create({trigger:slogan,start:'center 60%',once:true,onEnter:flyPast});
  return ()=>{activeFlight?.kill();flightLayer.hidden=true;};
 });
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
 window.addEventListener('pagehide',()=>motion.revert(),{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted){gsap.set('[data-reveal]',{clearProps:'all'});ScrollTrigger.refresh();}});
})();
