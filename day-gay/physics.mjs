export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const STEP=1/120;
export function createMatch(){
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
export function advance(s,inputs,dt=STEP){
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
export function solve(root,end,a,b,bend=1){
  const dx=end.x-root.x,dy=end.y-root.y,raw=Math.hypot(dx,dy)||.001;
  const d=clamp(raw,Math.abs(a-b)+.001,a+b-.001),ux=dx/raw,uy=dy/raw;
  const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
  return {x:root.x+ux*along-uy*height*bend,y:root.y+uy*along+ux*height*bend};
}

const point=(x,y)=>({x,y});
export function makePose(s,i){
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

export function poleEnds(s){
  return [0,1].map(i=>{
    const p=s.players[i];
    return point((i===0?535:912)+s.x,342-p.attack*24+p.defend*12);
  });
}

export function makeArms(s,i){
  const pose=makePose(s,i),ends=poleEnds(s),t=i===0?.27:.73;
  const far=point(ends[0].x+(ends[1].x-ends[0].x)*t,ends[0].y+(ends[1].y-ends[0].y)*t);
  return [ends[i],far].map((hand,j)=>{
    const shoulder=point(pose.shoulder.x-pose.sign*j*6,pose.shoulder.y+j*8);
    return {shoulder,elbow:solve(shoulder,hand,84,94,pose.sign),hand};
  });
}
