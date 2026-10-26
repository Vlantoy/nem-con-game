const {test}=require('node:test');const assert=require('node:assert/strict');const P=require('../physics.js');
function run(s,dt=1/120){for(let i=0;i<3000&&!s.done;i++)P.step(s,dt);return s;}
test('Aimed throws hit every paired target and score points',()=>{for(let round=0;round<3;round++){const s=P.create(round);assert.ok(P.launch(s,s.target.x,s.target.z-3.25,.9));run(s);assert.ok(s.hit);assert.ok(s.score>=20&&s.score<=100);}});
test('A wide miss receives no points',()=>{const s=P.create();P.launch(s,3,-1,.6);run(s);assert.equal(s.hit,false);assert.equal(s.score,0);});
test('Both players receive identical targets in each paired round',()=>{for(let r=0;r<3;r++)assert.deepEqual(P.create(r),P.create(r));});
test('Launch rejects backward/zero direction and duplicate launch',()=>{const s=P.create();assert.equal(P.launch(s,0,1,.5),false);assert.equal(P.launch(s,0,0,.5),false);assert.equal(P.launch(s,0,-1,.5),true);assert.equal(P.launch(s,0,-1,.5),false);});
test('Simulation remains stable across frame sizes',()=>{const a=P.create(),b=P.create();P.launch(a,a.target.x,a.target.z-3.25,.85);P.launch(b,b.target.x,b.target.z-3.25,.85);run(a,1/120);run(b,1/30);assert.ok(Math.abs(a.score-b.score)<3);for(const t of [a.attacker,a.target,b.attacker,b.target])assert.ok(Number.isFinite(t.x)&&Number.isFinite(t.z));});
test('Finished shots freeze and hard hits destabilize target',()=>{const s=P.create();P.launch(s,s.target.x,s.target.z-3.25,1);run(s);assert.ok(s.target.stability<40);const snapshot=JSON.stringify(s);P.step(s,.05);assert.equal(JSON.stringify(s),snapshot);});
