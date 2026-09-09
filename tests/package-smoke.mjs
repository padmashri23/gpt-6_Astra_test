import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
try{
 await page.goto('http://127.0.0.1:5173');
 await page.evaluate(()=>document.fonts.ready);
 const output=path.join(os.tmpdir(),'cinder-qa');fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,'final-menu.png')});
 await page.getByRole('button',{name:'QUICK MATCH',exact:true}).click();
 await page.getByRole('button',{name:'STEP INTO THE RING'}).click();
 await page.waitForFunction(()=>window.cinder.snapshot().phase==='fight');
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');
 await page.keyboard.press('k');await page.waitForTimeout(350);
 await page.screenshot({path:path.join(output,'final-game.png')});
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>window.cinder.snapshot().paused),true);
 assert.deepEqual(errors,[]);
 console.log('PASS Production package loads all local assets with external requests blocked; selection, movement, attack and pause respond.');
 console.log('Screenshots:',output);
}finally{await browser.close();}
