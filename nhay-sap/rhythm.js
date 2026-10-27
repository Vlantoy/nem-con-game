/* Pure rhythm rules shared with the headless checks. Times are seconds. */
(function(root){
  const levels={easy:{bpm:84,perfect:.09,good:.19},normal:{bpm:104,perfect:.07,good:.145},hard:{bpm:124,perfect:.055,good:.115}};
  const pattern=[0,1,0,null,0,1,0,1];
  function chart(level){const beat=60/levels[level].bpm;return Array.from({length:48},(_,i)=>({time:(i+4)*beat,kind:pattern[i%8],beat:i+4,judged:false})).filter(n=>n.kind!==null);}
  function judge(delta,level){const d=Math.abs(delta);return d<=levels[level].perfect?'perfect':d<=levels[level].good?'good':'miss';}
  function points(quality,combo){return quality==='miss'?0:Math.round((quality==='perfect'?100:60)*(1+Math.min(combo,30)/30));}
  const api={levels,chart,judge,points};if(typeof module!=='undefined')module.exports=api;root.Rhythm=api;
})(typeof window!=='undefined'?window:globalThis);
