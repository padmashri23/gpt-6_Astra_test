import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
const url=process.env.CINDER_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(()=>window.cinder.snapshot());
try{
 await page.goto(`${url}/?test=1`);await page.getByRole('button',{name:'TRAINING',exact:true}).click();await page.getByRole('button',{name:'ENTER TRAINING'}).click();await page.waitForFunction(()=>window.cinder.snapshot().phase==='fight');
 for(const positions of [[0,-2,0,2],[-6,0,6,0],[-4,-4,4,4],[-4,4,4,-4],[0,-6,0,6]]){
  await page.evaluate(p=>{const g=window.cinder.test.game();g.fighters[0].x=p[0];g.fighters[0].z=p[1];g.fighters[1].x=p[2];g.fighters[1].z=p[3];},positions);await page.waitForTimeout(2200);
  const points=await page.evaluate(()=>{const w=window.cinder.test.world();return w.models.flatMap(m=>[0,2.65].map(y=>{const v=m.root.position.clone();v.y+=y;v.project(w.camera);return {x:v.x,y:v.y};}));});for(const p of points){assert.ok(Math.abs(p.x)<.97&&Math.abs(p.y)<.95,JSON.stringify({positions,points}));}if(positions[0]===0)assert.ok(Math.abs(points[0].x-points[2].x)>.12);console.log('PASS Camera framing',positions,points);
 }
 await page.screenshot({path:path.join(os.tmpdir(),'cinder-qa','camera-depth.png')});
 await page.locator('#dummy-select').selectOption('cpu');await page.waitForFunction(()=>window.cinder.snapshot().stats.hits[1]>0,null,{timeout:15000});console.log('PASS Training CPU activates');
 await page.keyboard.down('l');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await snapshot()).paused,true);await page.keyboard.up('l');await page.getByRole('button',{name:'BACK TO THE FIGHT'}).click();await page.waitForTimeout(150);assert.equal((await snapshot()).fighters[0].guard,false);console.log('PASS Focus loss pauses and clears held inputs');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'CONTROLS & MOVE LIST'}).click();await page.keyboard.press('?');await page.keyboard.press('Escape');assert.equal((await snapshot()).screen,'match');console.log('PASS Help cannot become its own back destination');
 await page.evaluate(()=>{const t=window.cinder.test;t.start({mode:'training'});t.game().phase='fight';});await page.waitForTimeout(200);const initial=await page.evaluate(()=>window.cinder.test.world().renderer.info.memory);
 for(let i=0;i<12;i++){await page.evaluate(i=>window.cinder.test.start({mode:'training',player:i%3,opponent:(i+1)%3,arena:i%2}),i);await page.waitForTimeout(70);}
 const final=await page.evaluate(()=>window.cinder.test.world().renderer.info.memory);assert.ok(final.geometries<initial.geometries+25);assert.ok(final.textures<=initial.textures+2);console.log('PASS Model/stage disposal across 12 reloads',{initial,final});
 await page.evaluate(()=>{const t=window.cinder.test;t.start({mode:'quick'});const g=t.game();g.phase='fight';g.timer=30;g.fighters[0].x=-6;g.fighters[1].x=6;});await page.waitForTimeout(2000);const timer=(await snapshot()).timer;assert.ok(timer>27.5&&timer<28.5);console.log('PASS Timer follows real time',timer);
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:path.join(os.tmpdir(),'cinder-qa','mobile-menu.png')});await page.getByRole('button',{name:'QUICK MATCH'}).click();await page.screenshot({path:path.join(os.tmpdir(),'cinder-qa','mobile-select.png')});await page.getByRole('button',{name:'STEP INTO THE RING'}).click();await page.waitForFunction(()=>window.cinder.snapshot().phase==='fight');await page.screenshot({path:path.join(os.tmpdir(),'cinder-qa','mobile-fight.png')});console.log('PASS Responsive overflow regression');
 await page.close();
 const touch=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});touch.on('pageerror',e=>errors.push(e.message));await touch.goto(`${url}/?test=1`);await touch.getByRole('button',{name:'TRAINING',exact:true}).tap();await touch.getByRole('button',{name:'ENTER TRAINING'}).tap();await touch.waitForFunction(()=>window.cinder.snapshot().phase==='fight');await touch.evaluate(()=>{const g=window.cinder.test.game();g.fighters[0].x=-.6;g.fighters[1].x=.6;});assert.ok(await touch.locator('[data-hold="KeyK"]').isVisible());await touch.locator('[data-hold="KeyK"]').tap();await touch.waitForFunction(()=>window.cinder.snapshot().stats.hits[0]>0);await touch.screenshot({path:path.join(os.tmpdir(),'cinder-qa','touch-landscape.png')});console.log('PASS Emulated touch attack');await touch.close();assert.deepEqual(errors,[]);console.log('ALL EDGE CASES PASSED');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();}
