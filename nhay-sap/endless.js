(function(root){'use strict';
function config(round){const progress=Math.max(0,round-1),length=Math.min(10,3+Math.floor(progress/3)),secondsPerKey=Math.max(.17,.38-progress*.005),settle=Math.max(.4,.65-progress*.004);return{length,secondsPerKey,settle,duration:length*secondsPerKey+settle,good:Math.max(.075,.20-progress*.004),perfect:Math.max(.035,.085-progress*.0015),bpm:Math.min(160,90+progress*2)};}

function create(round=1,start=0,random=Math.random){const c=config(round);return{round,start,...c,sequence:Array.from({length:c.length},()=>Math.floor(random()*4)),index:0,resolved:false,result:null,target:start+c.duration};}
function input(s,kind){if(s.resolved)return'ignored';if(s.index===s.sequence.length)return'ready';if(kind===s.sequence[s.index]){s.index++;return s.index===s.sequence.length?'ready':'correct';}s.index=0;return'wrong';}
function commit(s,time){if(s.resolved)return'ignored';s.resolved=true;const delta=Math.abs(time-s.target);s.result=s.index<s.sequence.length||delta>s.good?'miss':delta<=s.perfect?'perfect':'good';return s.result;}
const api={config,create,input,commit};if(typeof module!=='undefined')module.exports=api;else root.SapEndless=api;})(typeof window!=='undefined'?window:this);
