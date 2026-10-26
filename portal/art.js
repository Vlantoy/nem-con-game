(() => { for(const canvas of document.querySelectorAll('.sap-illustration')){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const sprite=document.createElement('canvas');sprite.width=80;sprite.height=120;const px=sprite.getContext('2d');
function person(x,y,scale=2.3,female=false,phase=0,seated=false){
 px.clearRect(0,0,80,120);
 const r=(x,y,w,h,c)=>{px.fillStyle=c;px.fillRect(Math.round(x),Math.round(y),w,h);};
 const poly=(points,c)=>{px.fillStyle=c;px.beginPath();points.forEach(([x,y],i)=>i?px.lineTo(Math.round(x),Math.round(y)):px.moveTo(Math.round(x),Math.round(y)));px.closePath();px.fill();};
 const ink='#202731',hair='#24252e',skin='#dba17a',light='#f4c89d',shade='#af745c',ivory='#f0e7c9',red='#b73f50',gold='#d9b76c';
 const sway=seated?0:Math.round(Math.sin(phase)*1.4),lift=seated?0:Math.round(Math.sin(phase)*3);
 px.save();px.translate(sway,0);
 // Small head, shaped shoulders, long clothing: proportions match the illustrated world.
 if(seated){poly([[27,84],[41,84],[51,99],[66,102],[66,108],[46,108],[31,98]],ink);r(54,105,15,4,'#151d25');}
 else{
 poly([[29,78],[41,79],[39,97],[33,112],[23,112],[28,94]],ink);
 poly([[42,78],[53,78],[52,95],[57,112],[47,112],[42,97]],'#293740');
 r(29,91,3,16,'#43515a');r(47,93,3,15,'#46515a');
 r(22,109,10,4,skin);r(47,110,10,4,skin);r(19,113,15,4,'#222832');r(46,114,17,4,'#222832');r(19,116,15,1,'#8d7762');r(47,117,15,1,'#8d7762');
 }
 // Far sleeve and hand.
 poly([[49,33],[55,36],[60,49-lift],[69,53-lift],[67,59-lift],[55,54-lift],[47,43]],female?'#b7c9c0':'#c3cabd');
 r(65,53-lift,6,5,skin);r(67,53-lift,4,2,light);r(56,48-lift,4,4,red);
 poly([[29,31],[39,28],[49,31],[54,40],[51,67],[55,81],[27,81],[29,64],[25,42]],ink);
 poly([[33,32],[40,31],[47,33],[48,64],[32,64]],ivory);
 r(35,34,3,27,'#fff4db');r(45,35,3,27,'#c4bda4');
 // Open indigo vest with woven red, cream and gold edging.
 poly([[28,33],[33,31],[32,64],[28,69],[25,61],[26,42]],'#344756');
 poly([[47,32],[51,34],[53,64],[49,69],[46,63]],'#293d4e');
 r(30,35,2,28,red);r(48,36,2,28,red);r(40,34,2,26,red);
 for(let i=0;i<5;i++){r(30,38+i*5,2,2,gold);r(48,39+i*5,2,2,ivory);r(40,38+i*5,3,1,'#705045');}
 // Near arm: articulated elbow and a small open hand.
 poly([[27,34],[23,36],[19,49+lift],[23,58+lift],[29,55+lift],[25,48+lift],[31,39]],ivory);
 poly([[23,38],[21,49+lift],[24,54+lift],[26,52+lift],[24,48+lift],[28,40]],'#c4c8b9');
 r(23,53+lift,6,4,red);r(24,54+lift,4,1,gold);
 poly([[24,57+lift],[29,56+lift],[33,62+lift],[32,68+lift],[28,68+lift],[28,63+lift]],skin);r(29,59+lift,2,5,light);
 // Sash, apron and the patterned skirt.
 r(28,65,24,5,red);r(31,66,18,1,'#ed926c');r(37,66,6,4,gold);
 if(female){
 poly([[29,70],[51,70],[56,96],[53,101],[24,101],[22,96]],'#253e48');
 poly([[29,72],[34,72],[30,94],[25,95]],'#45616a');r(25,92,29,3,red);r(25,96,29,3,'#c4a46a');r(26,99,27,2,ink);
 for(let i=27;i<53;i+=5){r(i,85,3,3,gold);r(i+1,84,1,5,gold);r(i,93,2,1,'#ffe5af');r(i,97,2,1,red);}
 }else{r(43,70,5,22,red);r(44,72,2,17,gold);r(43,92,1,6,red);r(46,92,1,7,red);}
 // Neck, face planes, ear, angled hairline and distinct eyes.
 r(36,24,9,8,shade);r(37,24,7,6,skin);poly([[32,10],[45,8],[51,14],[50,24],[45,29],[37,27],[31,20]],skin);
 poly([[36,12],[46,12],[49,16],[48,23],[44,26],[38,24]],light);r(31,18,3,5,shade);r(33,19,2,3,skin);
 r(40,18,2,2,ink);r(47,18,2,2,ink);r(40,17,3,1,'#655043');r(46,17,3,1,'#655043');r(45,20,2,3,'#c78c68');r(43,25,4,1,'#985956');r(38,22,3,1,'#e7ac85');
 poly([[30,10],[33,6],[43,4],[49,8],[52,14],[49,17],[45,12],[40,12],[36,17],[34,23],[31,21]],hair);r(34,8,10,2,'#43404a');
 if(female){poly([[32,8],[30,5],[33,1],[41,0],[45,3],[44,7]],hair);r(33,2,7,2,'#49434c');r(31,9,18,3,red);r(34,9,4,2,gold);r(32,22,2,7,gold);r(32,25,3,2,'#ffedb1');}
 else{r(30,9,20,3,'#67384a');r(32,9,16,1,red);r(48,11,4,8,'#35414a');}
 px.restore();ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale*.54,scale*.54);ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,-40,-120);ctx.restore();
}
const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
for(const x of [100,460]){r(x,220,7,97,'#726342');r(x,220,2,97,'#c8b977');}
for(const y of [244,295]){for(const d of [-15,15]){r(78,y+d+4,407,3,'#51623d');r(78,y+d,407,4,'#c7c982');for(let x=95;x<480;x+=42)r(x,y+d,2,6,'#798b4a');}}
person(265,281,2.25,true,.4);person(356,230,1.9,false,1.2);person(56,285,1.3,true,0,true);person(508,285,1.3,false,0,true);
}
for(const c of document.querySelectorAll('[data-art]')){const x=c.getContext('2d');x.imageSmoothingEnabled=false;const r=(a,b,w,h,k)=>{x.fillStyle=k;x.fillRect(a,b,w,h);};const wood='#a28143',light='#dfc48a',dark='#294d42',red='#ac5942';switch(c.dataset.art){case 'stick':r(10,29,60,6,wood);r(10,29,60,2,light);r(20,23,7,16,dark);r(54,23,7,16,red);break;case 'stilts':r(25,8,5,48,wood);r(48,8,5,48,wood);r(20,34,15,4,light);r(43,30,15,4,light);break;case 'top':r(26,18,29,5,red);r(21,23,39,8,wood);r(26,31,29,8,light);r(32,39,17,6,wood);r(38,45,5,9,dark);r(38,12,5,6,dark);break;case 'bow':r(37,12,5,44,wood);r(20,21,40,5,light);r(14,25,7,10,dark);r(59,25,7,10,dark);r(20,35,40,1,wood);r(39,15,1,23,red);break;}}
})();
