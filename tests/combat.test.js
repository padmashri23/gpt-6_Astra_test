import test from 'node:test';
import assert from 'node:assert/strict';
import {Combat,seededRandom,distance} from '../src/combat.js';
import {FIGHTERS,MOVES} from '../src/data.js';
function step(g,seconds,input={},cpu={}){for(let t=0;t<seconds;t+=1/60)g.tick(1/60,typeof input==='function'?input(g):input,cpu);}
function ready(options={}){const g=new Combat({rng:seededRandom(41),...options});g.phase='fight';g.fighters[0].x=-.6;g.fighters[1].x=.6;return g;}
function attack(g,key,extra={},cpu={}){g.tick(1/60,{attack:key,...extra},cpu);step(g,.8,{...extra,attack:null},cpu);}
test('walk, run, sidestep, crouch and jump move through 3D space',()=>{
 const g=ready();step(g,.3,{x:-1,z:1});assert.ok(g.fighters[0].x<-.9);assert.ok(g.fighters[0].z>.3);
 const walking=g.fighters[0].x;step(g,.3,{x:-1,run:true});assert.ok(walking-g.fighters[0].x>1.2);
 g.tick(1/60,{crouch:true},{});assert.equal(g.fighters[0].state,'crouch');
 g.tick(1/60,{jump:true},{});step(g,.15);assert.ok(g.fighters[0].y>.4);step(g,1);assert.equal(g.fighters[0].y,0);
});
test('arena bounds and body separation remain stable under sustained movement',()=>{
 const g=ready();step(g,12,{x:1,z:1});for(const f of g.fighters)assert.ok(Math.hypot(f.x,f.z)<=6.10001);assert.ok(distance(...g.fighters)>.85);
});
for(const [key,kind,extra] of [['J','jab',{}],['K','kick',{}],['I','heavy',{}],['K','low',{crouch:true}],['J','upper',{crouch:true}],['U','grab',{}],['O','special',{}]]){
 test(`${kind}: correct damage and exactly one hit per move`,()=>{const g=ready();attack(g,key,extra);assert.equal(g.stats.hits[0],1);assert.equal(g.stats.damage[0],Math.round(MOVES[kind].damage*FIGHTERS[0].power));assert.equal(g.fighters[1].hp,FIGHTERS[1].maxHealth-g.stats.damage[0]);step(g,1);assert.equal(g.stats.hits[0],1);});
}
test('air kick registers against a standing rival and returns to ground',()=>{const g=ready();g.fighters[0].y=.4;g.fighters[0].vy=1;attack(g,'K');assert.equal(g.stats.hits[0],1);assert.equal(g.fighters[0].lastMove,'Air kick');step(g,1);assert.equal(g.fighters[0].y,0);});
test('high guard stops punches, kicks, heavies, and specials without health damage',()=>{
 for(const key of ['J','K','I','O']){const g=ready();attack(g,key,{}, {guard:true});assert.equal(g.stats.hits[0],0,key);assert.equal(g.stats.blocks[1],1,key);assert.equal(g.fighters[1].hp,115,key);}
});
test('low attacks beat high guard, low guard beats sweeps, mids beat low guard',()=>{
 const a=ready();attack(a,'K',{crouch:true},{guard:true});assert.equal(a.stats.hits[0],1);
 const b=ready();attack(b,'K',{crouch:true},{guard:true,crouch:true});assert.equal(b.stats.blocks[1],1);assert.equal(b.fighters[1].hp,115);
 const c=ready();attack(c,'K',{}, {guard:true,crouch:true});assert.equal(c.stats.hits[0],1);
});
test('crouching slips high attacks; jumping slips low attacks',()=>{
 const a=ready();attack(a,'J',{}, {crouch:true});assert.equal(a.stats.hits[0],0);
 const b=ready();b.fighters[1].y=.7;b.fighters[1].vy=3;attack(b,'K',{crouch:true});assert.equal(b.stats.hits[0],0);
});
test('throws beat guard but fail on crouching and airborne targets',()=>{
 const a=ready();attack(a,'U',{}, {guard:true});assert.equal(a.stats.hits[0],1);assert.equal(a.fighters[1].state,'down');
 const b=ready();attack(b,'U',{}, {crouch:true});assert.equal(b.stats.hits[0],0);
 const c=ready();c.fighters[1].y=.5;c.fighters[1].vy=3;attack(c,'U');assert.equal(c.stats.hits[0],0);
});
test('out-of-range and off-axis attacks miss',()=>{
 const a=ready();a.fighters[1].x=4;attack(a,'J');assert.equal(a.stats.hits[0],0);
 const b=ready();b.requestAttack(b.fighters[0],'K');b.fighters[1].z=1.3;b.fighters[1].x=-.6;step(b,.6);assert.equal(b.stats.hits[0],0);assert.ok(b.stats.dodges[1]>0);
});
test('special requires 50 charge and spends it once',()=>{
 const a=ready();a.fighters[0].meter=20;assert.equal(a.requestAttack(a.fighters[0],'O'),false);assert.equal(a.fighters[0].attack,null);
 a.fighters[0].meter=50;assert.equal(a.requestAttack(a.fighters[0],'O'),true);assert.equal(a.fighters[0].meter,0);step(a,.1);assert.ok(a.fighters[0].meter<1);
});
test('knockdown recovers with invulnerability and returns control',()=>{
 const g=ready();attack(g,'I');assert.equal(g.fighters[1].state,'down');step(g,.5);assert.equal(g.fighters[1].state,'recover');assert.ok(g.fighters[1].invuln>0);step(g,.5);assert.equal(g.fighters[1].state,'idle');assert.equal(g.fighters[1].invuln,0);
});
test('three-strike combo scales damage and forces a recoverable knockdown',()=>{
 const g=ready();const p=g.fighters[0];
 for(const key of ['J','J','K']){g.requestAttack(p,key);while(p.attack){step(g,1/60);}g.fighters[1].x=p.x+1.15;}
 assert.equal(p.combo,3);assert.equal(g.stats.maxCombo[0],3);assert.ok(g.stats.damage[0]<7+7+14);assert.equal(g.fighters[1].state,'down');assert.equal(p.lastMove,'Crosswind');
 const hp=g.fighters[1].hp;g.requestAttack(p,'J');step(g,.25);assert.equal(g.fighters[1].hp,hp);step(g,1.2);assert.equal(g.fighters[1].state,'idle');
});
test('attack buffering cancels a connected strike into the next move',()=>{
 const g=ready();g.requestAttack(g.fighters[0],'J');step(g,.20);g.requestAttack(g.fighters[0],'K');step(g,.14);assert.equal(g.fighters[0].attack?.kind,'kick');
});
test('an attack pressed during hit stop is preserved for the combo cancel',()=>{
 const g=ready();g.requestAttack(g.fighters[0],'J');while(g.hitstop===0)step(g,1/60);g.tick(1/60,{attack:'K'},{});step(g,.25);assert.equal(g.fighters[0].attack?.kind,'kick');
});
test('interruption clears the attack and cannot create a ghost hit',()=>{
 const g=ready();g.requestAttack(g.fighters[0],'I');g.requestAttack(g.fighters[1],'J');step(g,.6);assert.equal(g.stats.hits[0],0);assert.equal(g.stats.hits[1],1);
});
test('health clamps at zero and KO awards exactly one round',()=>{
 const g=ready();g.fighters[1].hp=2;attack(g,'J');assert.equal(g.fighters[1].hp,0);assert.equal(g.phase,'roundOver');assert.deepEqual(g.wins,[1,0]);step(g,1);assert.deepEqual(g.wins,[1,0]);
});
test('round transitions reset health and two wins end the match',()=>{
 const g=ready();g.fighters[1].hp=0;step(g,.1);step(g,4.2);assert.equal(g.round,2);assert.equal(g.phase,'fight');assert.equal(g.fighters[1].hp,115);g.fighters[1].hp=0;step(g,3);assert.equal(g.phase,'matchOver');assert.equal(g.winner,0);assert.deepEqual(g.wins,[2,0]);
});
test('timeout compares health percentages and draws replay without awarding a win',()=>{
 const g=ready();g.timer=.01;g.fighters[0].hp=70;g.fighters[1].hp=75;step(g,.1);assert.equal(g.roundWinner,0);
 const a=ready();a.timer=.01;step(a,.1);assert.equal(a.roundWinner,null);assert.deepEqual(a.wins,[0,0]);step(a,4.2);assert.equal(a.phase,'fight');
});
test('training has no timer loss, refills a defeated dummy, and supports reset',()=>{
 const g=ready({training:true});g.fighters[1].hp=1;attack(g,'J');assert.equal(g.phase,'fight');assert.equal(g.timer,60);assert.equal(g.fighters[1].hp,115);g.restart();assert.equal(g.phase,'intro');assert.equal(g.round,1);assert.deepEqual(g.wins,[0,0]);
});
test('unique abilities: Bram gains block charge; Sable special hits low',()=>{
 const g=ready();g.fighters[1].meter=0;attack(g,'J',{}, {guard:true});assert.ok(g.fighters[1].meter>=11);
 const s=ready({player:2});attack(s,'O',{}, {guard:true});assert.equal(s.stats.hits[0],1);assert.equal(s.fighters[0].lastMove,'Orbit Breaker');
});
for(const difficulty of ['easy','normal','hard']){
 test(`${difficulty}: CPU moves, attacks and completes a full match without soft-locking`,()=>{
  const g=new Combat({difficulty,rng:seededRandom(81)});let count=0;
  while(g.phase!=='matchOver'&&count++<60*220){g.tick(1/60,{});for(const f of g.fighters){assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.z));assert.ok(f.hp>=0&&f.hp<=f.def.maxHealth);}}
  assert.equal(g.phase,'matchOver');assert.equal(g.winner,1);assert.ok(g.stats.hits[1]>=8);assert.equal(g.wins[1],2);
 });
}
test('seeded difficulty comparison: veteran pressures faster than rookie over 12 matches',()=>{
 const duration={easy:0,hard:0};for(const level of ['easy','hard'])for(let seed=1;seed<=6;seed++){
  const g=new Combat({difficulty:level,rng:seededRandom(seed)});let frames=0;while(g.phase!=='matchOver'&&frames++<16000)g.tick(1/60,{});assert.equal(g.phase,'matchOver');duration[level]+=frames;
 }assert.ok(duration.hard<duration.easy,JSON.stringify(duration));
});
for(let id=0;id<3;id++)for(const chain of FIGHTERS[id].chains){
 test(`${FIGHTERS[id].name}: ${chain[1]} is a reachable unique finisher`,()=>{
  const g=ready({player:id,opponent:(id+1)%3});const p=g.fighters[0];
  for(const key of chain[0].split(' ')){g.requestAttack(p,key);while(p.attack)step(g,1/60);g.fighters[1].x=p.x+1.1;}
  assert.equal(p.lastMove,chain[1]);assert.equal(g.stats.maxCombo[0],3);assert.equal(g.fighters[1].state,'down');
 });
}
test('Sable combo passive restores health without exceeding the maximum',()=>{
 const g=ready({player:2});g.fighters[0].hp=90;for(const key of ['J','J','I']){g.requestAttack(g.fighters[0],key);while(g.fighters[0].attack)step(g,1/60);g.fighters[1].x=g.fighters[0].x+1.1;}assert.equal(g.fighters[0].hp,94);
});
test('sustained attack spam cannot prevent recovery or exceed the combo cap',()=>{
 const g=ready({training:true});let recoveries=0;for(let i=0;i<3600;i++){const f=g.fighters[1];if(f.state==='recover')recoveries++;g.tick(1/60,{attack:'J',x:1},{});}assert.ok(recoveries>0);assert.ok(g.stats.maxCombo[0]<=3);assert.ok(g.fighters[1].hp>0);
});
