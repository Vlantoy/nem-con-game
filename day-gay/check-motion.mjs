import {createMatch,advance,makeArms,makePose,poleEnds} from './physics.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),idle={attack:false,defend:false},atk={attack:true,defend:false},def={attack:false,defend:true};
const report={frames:64,sequences:[],maxUpperArmError:0,maxForearmError:0,maxHandToPoleError:0,maxLegError:0,maxAdjacentJointDisplacement:0};
for(const [name,input] of [['attack-defense',[atk,def]],['defense-attack',[def,atk]],['attack-attack',[atk,atk]],['defense-defense',[def,def]]]){
 const s=createMatch();let prior;const frames=[];
 for(let frame=0;frame<16;frame++){
  for(let step=0;step<4;step++)advance(s,input);
  const bones=[makePose(s,0),makePose(s,1)],arms=[makeArms(s,0),makeArms(s,1)],ends=poleEnds(s),joints=[];
  for(const pose of bones){for(const [a,b,len] of [[pose.hip,pose.kneeFront,84],[pose.kneeFront,pose.front,78],[pose.rootRear,pose.kneeRear,84],[pose.kneeRear,pose.rear,78]])report.maxLegError=Math.max(report.maxLegError,Math.abs(d(a,b)-len));joints.push(pose.hip,pose.kneeFront,pose.front,pose.kneeRear,pose.rear);}
  for(const chain of arms)for(const arm of chain){report.maxUpperArmError=Math.max(report.maxUpperArmError,Math.abs(d(arm.shoulder,arm.elbow)-84));report.maxForearmError=Math.max(report.maxForearmError,Math.abs(d(arm.elbow,arm.hand)-94));const [a,b]=ends;report.maxHandToPoleError=Math.max(report.maxHandToPoleError,Math.abs((b.x-a.x)*(arm.hand.y-a.y)-(b.y-a.y)*(arm.hand.x-a.x))/d(a,b));joints.push(arm.shoulder,arm.elbow,arm.hand);}
  if(prior)for(let i=0;i<joints.length;i++)report.maxAdjacentJointDisplacement=Math.max(report.maxAdjacentJointDisplacement,d(joints[i],prior[i]));
  prior=joints;frames.push({frame,time:s.elapsed,joints});
 }
 report.sequences.push({name,frames});
}
if(Math.max(report.maxUpperArmError,report.maxForearmError,report.maxHandToPoleError,report.maxLegError)>1e-6)throw new Error('Joint stability failed');
await mkdir('.omo/evidence/day-gay',{recursive:true});
await writeFile('.omo/evidence/day-gay/joint-stability.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,sequences:report.sequences.map(s=>s.name)}));
