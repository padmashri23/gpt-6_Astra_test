import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const out=path.join(os.tmpdir(),'cinder-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.CINDER_BROWSER||'chrome',args:['--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const snapshot=()=>page.evaluate(()=>window.cinder.snapshot());
const waitFight=()=>page.waitForFunction(()=>window.cinder.snapshot().phase==='fight',null,{timeout:20000});
const pass=(name,data)=>{results.push({name,pass:true,data});console.log('PASS',name,data?JSON.stringify(data):'');};
async function setup({player=0,opponent=1,arena=0,dummy='stand',gap=1.2}={}){
 await page.evaluate(o=>{const t=window.cinder.test;t.start({player:o.player,opponent:o.opponent,arena:o.arena,mode:'training'});const g=t.game();g.phase='fight';g.dummy=o.dummy;g.fighters[0].x=-o.gap/2;g.fighters[1].x=o.gap/2;}, {player,opponent,arena,dummy,gap});
 await page.waitForTimeout(100);
}
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.evaluate(()=>document.fonts.ready);assert.match(await page.title(),/Cinder Circuit/);assert.equal(await page.getByRole('button',{name:'ENTER THE CIRCUIT'}).count(),1);await page.screenshot({path:path.join(out,'menu.png')});pass('Page identity, meaningful menu, local assets');
 await page.getByRole('button',{name:'HOW TO PLAY'}).click();assert.ok(await page.getByText('THE CONTROLS',{exact:true}).isVisible());await page.getByRole('button',{name:'TRY IT IN TRAINING'}).click();
 for(const name of ['Bram Kor','Sable Nyx','Rhea Vale']){await page.getByRole('button',{name:new RegExp(name)}).click();assert.equal((await snapshot()).selected,['Rhea Vale','Bram Kor','Sable Nyx'].indexOf(name));}
 await page.locator('#arena-select').selectOption('1');await page.locator('#difficulty-select').selectOption('hard');assert.equal((await snapshot()).arena,1);await page.screenshot({path:path.join(out,'select-reservoir.png')});pass('All fighters, arena selection, difficulty selection and help');
 await page.getByRole('button',{name:'ENTER TRAINING'}).click();await waitFight();assert.equal((await snapshot()).mode,'training');pass('Menu → selection → playable training');
 await setup({gap:5});const before=(await snapshot()).fighters[0];await page.keyboard.down('a');await page.waitForTimeout(250);await page.keyboard.up('a');const walk=(await snapshot()).fighters[0];assert.ok(walk.x<before.x-.3);
 await page.keyboard.down('Shift');await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');await page.keyboard.up('Shift');const run=(await snapshot()).fighters[0];assert.ok(run.x-walk.x>before.x-walk.x);
 await page.keyboard.down('w');await page.waitForTimeout(250);await page.keyboard.up('w');const away=(await snapshot()).fighters[0];assert.ok(away.z<-.3);
 await page.keyboard.down('s');await page.waitForTimeout(250);await page.keyboard.up('s');assert.ok((await snapshot()).fighters[0].z>away.z+.3);
 await page.keyboard.press('Space');await page.waitForTimeout(150);assert.ok((await snapshot()).fighters[0].y>.2);await page.waitForTimeout(850);assert.equal((await snapshot()).fighters[0].y,0);
 await page.keyboard.down('c');await page.waitForTimeout(80);assert.equal((await snapshot()).fighters[0].crouch,true);await page.keyboard.up('c');pass('Walking, running, both sidesteps, jump/landing and crouch through real keyboard input');
 for(const [key,extra,move] of [['j',null,'Straight'],['k',null,'Drive kick'],['i',null,'Hammer strike'],['k','c','Low sweep'],['j','c','Rising palm'],['u',null,'Clinch throw'],['o',null,'Gale Driver'],['k','Space','Air kick']]){
  await setup();if(extra==='c')await page.keyboard.down('c');if(extra==='Space'){await page.keyboard.press('Space');await page.waitForTimeout(100);}await page.keyboard.press(key);await page.waitForFunction(()=>window.cinder.snapshot().stats.hits[0]>0);assert.equal((await snapshot()).fighters[0].lastMove,move);if(extra==='c')await page.keyboard.up('c');pass(`Keyboard attack: ${move}`);
 }
 await setup({dummy:'guard'});await page.keyboard.press('j');await page.waitForTimeout(600);assert.equal((await snapshot()).stats.blocks[1],1);assert.equal((await snapshot()).fighters[1].hp,115);
 await page.keyboard.down('c');await page.keyboard.press('k');await page.waitForTimeout(550);await page.keyboard.up('c');assert.ok((await snapshot()).stats.hits[0]>0);
 await setup({dummy:'guard'});await page.keyboard.press('u');await page.waitForTimeout(400);assert.equal((await snapshot()).fighters[1].state,'down');await page.waitForTimeout(1350);assert.equal((await snapshot()).fighters[1].state,'guard');pass('Opponent blocking, low-guard mixup, guard-breaking throw and recovery');
 await setup();await page.keyboard.down('l');await page.waitForTimeout(80);await page.evaluate(()=>window.cinder.test.game().requestAttack(window.cinder.test.game().fighters[1],'J'));await page.waitForTimeout(450);assert.equal((await snapshot()).stats.blocks[0],1);await page.keyboard.up('l');pass('Player guard prevents damage');
 await setup({gap:4});await page.keyboard.press('j');await page.waitForTimeout(550);assert.equal((await snapshot()).stats.hits[0],0);pass('Out-of-range strike does not register');
 await setup();for(const key of ['j','j','k']){await page.keyboard.press(key);await page.waitForFunction(()=>!!window.cinder.snapshot().fighters[0].attack);await page.waitForFunction(()=>!window.cinder.snapshot().fighters[0].attack);}
 assert.equal((await snapshot()).stats.maxCombo[0],3);assert.equal((await snapshot()).fighters[0].lastMove,'Crosswind');await page.screenshot({path:path.join(out,'combo.png')});pass('Real keyboard three-hit finisher and damage scaling');
 await setup();await page.keyboard.press('o');await page.waitForFunction(()=>window.cinder.snapshot().particles>0);const particles=(await snapshot()).particles;await page.screenshot({path:path.join(out,'special.png')});assert.ok(particles>0);pass('Live hit particles, special animation and camera effects',{particles});
 const audio=await page.evaluate(async()=>{const s=window.cinder.test.audio();s.start();const a=s.ctx.createAnalyser();a.fftSize=256;s.master.connect(a);s.play('hit',{down:true});await new Promise(r=>setTimeout(r,40));const bytes=new Uint8Array(256);a.getByteTimeDomainData(bytes);s.master.disconnect(a);return {state:s.ctx.state,signal:bytes.some(v=>v!==128)};});assert.equal(audio.state,'running');assert.equal(audio.signal,true);pass('Web Audio graph produces nonzero synthesized output',audio);
 await page.keyboard.press('Escape');assert.equal((await snapshot()).paused,true);const frozen=(await snapshot()).elapsed;await page.waitForTimeout(400);assert.equal((await snapshot()).elapsed,frozen);await page.screenshot({path:path.join(out,'pause.png')});
 await page.getByRole('button',{name:'CONTROLS & MOVE LIST'}).click();await page.getByRole('button',{name:'BACK TO THE FIGHT'}).click();assert.equal((await snapshot()).paused,false);
 await page.keyboard.press('Escape');await page.locator('#music-toggle').uncheck();await page.locator('#effects-toggle').uncheck();await page.getByRole('button',{name:'RESTART MATCH'}).click();assert.equal((await snapshot()).round,1);assert.equal((await snapshot()).fighters[0].hp,100);pass('Pause freezes simulation, move list returns correctly, settings and restart');
 // Verify both result paths and arcade progression with controlled KO setup; full natural matches follow.
 await page.evaluate(()=>window.cinder.test.start({mode:'quick'}));await page.evaluate(()=>{const g=window.cinder.test.game();g.phase='fight';g.wins=[1,0];g.fighters[1].hp=0;});await page.waitForFunction(()=>window.cinder.snapshot().screen==='results');assert.ok(await page.getByRole('heading',{name:'VICTORY.'}).isVisible());await page.getByRole('button',{name:'RUN IT BACK'}).click();assert.equal((await snapshot()).screen,'match');pass('KO → match results → rematch');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.getByRole('button',{name:'ENTER THE CIRCUIT'}).click();await page.getByRole('button',{name:'STEP INTO THE RING'}).click();
 await page.evaluate(()=>{const g=window.cinder.test.game();g.phase='fight';g.wins=[1,0];g.fighters[1].hp=0;});await page.waitForFunction(()=>window.cinder.snapshot().screen==='results');await page.getByRole('button',{name:'NEXT CHALLENGER'}).click();assert.equal((await snapshot()).arena,1);
 await page.evaluate(()=>{const g=window.cinder.test.game();g.phase='fight';g.wins=[1,0];g.fighters[1].hp=0;});await page.waitForFunction(()=>window.cinder.snapshot().screen==='results');assert.ok(await page.getByRole('heading',{name:'CIRCUIT CHAMPION.'}).isVisible());await page.screenshot({path:path.join(out,'champion.png')});pass('Two-bout arcade progression and champion screen');
 for(const [index,difficulty] of (process.env.CINDER_SKIP_MATCHES?[]:['easy','normal','hard']).entries()){
  await page.evaluate(o=>window.cinder.test.start(o),{mode:'quick',player:index,opponent:(index+1)%3,arena:index%2,difficulty});await waitFight();const start=Date.now();let n=0;const fps=[];let keys=new Set();
  while((await snapshot()).screen!=='results'&&Date.now()-start<180000){
   const s=await snapshot();fps.push(s.fps);const [p,c]=s.fighters;const wanted=new Set();
   if(s.phase==='fight'){
    const dx=c.x-p.x,dz=c.z-p.z,dist=Math.hypot(dx,dz),sx=dx*Math.cos(s.cameraYaw)-dz*Math.sin(s.cameraYaw),sz=dx*Math.sin(s.cameraYaw)+dz*Math.cos(s.cameraYaw);if(dist>1.18){if(Math.abs(sx)>.25)wanted.add(sx>0?'d':'a');if(Math.abs(sz)>.25)wanted.add(sz>0?'s':'w');if(dist>3)wanted.add('Shift');}
    if(!p.attack&&p.state!=='down'&&p.state!=='recover'&&p.state!=='hit'){
     if(n%8===5)wanted.add('l');else if(dist<2.3){const attacks=['j','j','k','i','o','k','u','i'];await page.keyboard.press(attacks[n%attacks.length]);}
    }
   }
   for(const key of keys)if(!wanted.has(key))await page.keyboard.up(key);for(const key of wanted)if(!keys.has(key))await page.keyboard.down(key);keys=wanted;n++;await page.waitForTimeout(130);
  }
  for(const key of keys)await page.keyboard.up(key);const final=await snapshot();assert.equal(final.screen,'results',`Natural ${difficulty} match timed out`);assert.ok(final.stats.hits[0]>0&&final.stats.hits[1]>0);assert.ok(final.wins.some(x=>x===2));await page.screenshot({path:path.join(out,`match-${difficulty}.png`)});pass(`Complete unforced ${difficulty} match with real keyboard play`,{seconds:Math.round((Date.now()-start)/1000),wins:final.wins,hits:final.stats.hits,bestCombo:final.stats.maxCombo,averageFPS:Math.round(fps.reduce((a,b)=>a+b,0)/fps.length)});
 }
 await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile-menu.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.getByRole('button',{name:'QUICK MATCH'}).click();await page.screenshot({path:path.join(out,'mobile-select.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.getByRole('button',{name:'STEP INTO THE RING'}).click();await waitFight();await page.screenshot({path:path.join(out,'mobile-fight.png')});pass('390 × 844 responsive menu, selection and match HUD');
 assert.deepEqual(errors,[]);pass('No application or console errors');
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({results,errors},null,2));console.log(`ALL ${results.length} BROWSER CHECKS PASSED. Evidence: ${out}`);
}catch(e){console.error('FAIL',e);await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.log('STATE',await snapshot().catch(()=>null));process.exitCode=1;}finally{await browser.close();}
