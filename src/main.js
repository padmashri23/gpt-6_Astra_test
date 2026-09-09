import './style.css';
import {Combat} from './combat.js';
import {World} from './scene.js';
import {GameAudio} from './audio.js';
import {FIGHTERS,ARENAS,DIFFICULTIES,CONTROL_ROWS} from './data.js';

const app=document.querySelector('#app');
const sound=new GameAudio();
let world;
try{world=new World(document.querySelector('#world'));}catch(error){app.innerHTML='<div class="fatal"><h1>YOUR RING IS WAITING.</h1><p>This game needs a browser with WebGL graphics enabled. Try Chrome or Edge with hardware acceleration on, then reload.</p><button onclick="location.reload()">TRY AGAIN</button></div>';throw error;}
let settings={difficulty:'normal',sound:true,music:true,effects:true};
try{const saved=JSON.parse(localStorage.getItem('cinder-settings')||'{}');settings={...settings,...saved};if(!DIFFICULTIES[settings.difficulty])settings.difficulty='normal';}catch{/* Private browsing can disable storage. */}
sound.enabled=settings.sound;sound.music=settings.music;world.reduced=!settings.effects;
let screen='menu',mode='arcade',selected=0,opponent=1,arena=0,arcadeIndex=0,ladder=[],game=new Combat(),paused=false,helpFrom='menu',lastEvent='',lastEventUntil=0,comboText='',comboUntil=0,roundMessageUntil=0,time=0;
const held=new Set();let pendingAttack=null,pendingJump=false;
const save=()=>{try{localStorage.setItem('cinder-settings',JSON.stringify(settings));}catch{}};
const emblem='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 3 18 10v22L24 45 6 35V13Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="m24 3 2 9M42 13l-8 5M42 35l-9-5M24 45l-2-10M6 35l8-5M6 13l8 6" stroke="currentColor" stroke-width="3"/></svg>';
const arrow='<span aria-hidden="true">↗</span>';
const soundButton=()=>`<button class="sound-button" data-action="sound" aria-label="Toggle sound">SOUND ${settings.sound?'ON':'OFF'} <span aria-hidden="true">${settings.sound?'◖))':'×'}</span></button>`;
const header=()=>`<header><a href="#" class="brand" data-action="home" aria-label="Cinder Circuit main menu">${emblem}<span>CINDER<br>CIRCUIT</span></a><div class="header-right">${screen!=='menu'?'<button class="text-button" data-action="help">CONTROLS <kbd>?</kbd></button>':''}${soundButton()}</div></header>`;
const footer=()=>'<footer><span>03 FIGHTERS <i>/</i> 02 ARENAS</span><span>AN ORIGINAL 3D ARCADE FIGHTER</span></footer>';
function clearInput(){held.clear();pendingAttack=null;pendingJump=false;}
function uiSound(){sound.start();sound.play('ui');}
function setScreen(next){screen=next;clearInput();document.body.dataset.screen=screen;document.body.classList.toggle('is-paused',paused);renderUI();}
function menu(){paused=false;sound.fighting=false;setScreen('menu');}
function select(nextMode){mode=nextMode;paused=false;world.setArena(arena);world.setFighters(selected,opponent);game=new Combat({player:selected,opponent});setScreen('select');}
function beginMatch(){
  if(mode==='arcade'){ladder=[0,1,2].filter(i=>i!==selected);arcadeIndex=0;opponent=ladder[0];}
  startBout();
}
function startBout(){
  paused=false;lastEvent='';comboText='';roundMessageUntil=0;world.setArena(arena);world.setFighters(selected,opponent);
  game=new Combat({player:selected,opponent,difficulty:settings.difficulty,training:mode==='training'});sound.start();sound.fighting=true;setScreen('match');
}
function pause(){if(screen!=='match'||paused||game.phase==='matchOver')return;paused=true;clearInput();sound.ctx?.suspend();document.body.classList.add('is-paused');renderUI();}
function resume(){paused=false;sound.start();clearInput();document.body.classList.remove('is-paused');renderUI();}
function showHelp(){if(screen==='help')return;helpFrom=screen;if(screen==='match'){paused=true;sound.ctx?.suspend();}setScreen('help');}
function closeHelp(){if(helpFrom==='match'){screen='match';resume();document.body.dataset.screen='match';}else setScreen(helpFrom);}
function fighterOptions(value){return FIGHTERS.map((f,i)=>`<option value="${i}" ${i===value?'selected':''}>${f.name}</option>`).join('');}
function difficultyOptions(){return Object.entries(DIFFICULTIES).map(([key,d])=>`<option value="${key}" ${key===settings.difficulty?'selected':''}>${d.name}</option>`).join('');}
function moveList(id){return `<div class="chain-list">${FIGHTERS[id].chains.map(c=>`<div><span class="chain-keys">${c[0].split(' ').map(k=>`<kbd>${k}</kbd>`).join('<b>›</b>')}</span><span><strong>${c[1]}</strong><small>${c[2]}</small></span></div>`).join('')}</div>`;}
function renderUI(){
 if(screen==='menu'){
  app.innerHTML=`<div class="menu-art"></div><div class="menu-shade"></div>${header()}<main class="main-menu"><div class="title-block"><h1>CINDER<br>CIRCUIT<span class="title-dot">.</span></h1><p>Make every<br>opening count.</p></div><nav class="menu-nav" aria-label="Game modes"><button class="menu-option primary" data-action="arcade">ENTER THE CIRCUIT ${arrow}</button><button class="menu-option" data-action="quick">QUICK MATCH ${arrow}</button><button class="menu-option" data-action="training">TRAINING ${arrow}</button><button class="menu-option" data-action="help">HOW TO PLAY ${arrow}</button></nav><p class="menu-note">SAME GROUND.<br>DIFFERENT STORIES.</p></main><div class="menu-caption"><span>THE SUNDOWN FOUNDRY</span><p>No crowns. Just courage.</p></div>${footer()}`;
 }else if(screen==='select'){
  const f=FIGHTERS[selected];app.innerHTML=`${header()}<main class="selection"><div class="selection-copy"><button class="back" data-action="home">← MAIN MENU</button><h1>CHOOSE<br>YOUR EDGE.</h1><p class="muted">${mode==='arcade'?'Two rivals. First to two rounds. Earn your place.':mode==='training'?'Find your rhythm. Learn your openings.':'One arena. One rival. Make it count.'}</p><div class="fighter-list" role="group" aria-label="Choose your fighter">${FIGHTERS.map((c,i)=>`<button class="fighter-choice ${selected===i?'selected':''}" data-fighter="${i}" aria-pressed="${selected===i}" style="--fighter:${c.color}"><span class="fighter-index">0${i+1}</span><span><strong>${c.name}</strong><small>${c.style}</small></span><span class="fighter-mark">${selected===i?'↗':'+'}</span></button>`).join('')}</div><div class="fighter-detail"><p>${f.description}</p><div class="attributes">${['SPEED','POWER','GRIT'].map((s,i)=>`<div><span>${s}</span><div aria-label="${s}: ${f.stats[i]} out of 5">${[1,2,3,4,5].map(n=>`<i class="${n<=f.stats[i]?'lit':''}"></i>`).join('')}</div></div>`).join('')}</div><p class="ability"><b>${f.ability}</b> / ${f.abilityText}</p></div></div><div class="fighter-billboard" aria-hidden="true"><span>0${selected+1}</span><h2>${f.short}</h2><p>${f.title}</p></div><div class="match-setup"><label>ARENA<select id="arena-select">${ARENAS.map((a,i)=>`<option value="${i}" ${i===arena?'selected':''}>${a.name}</option>`).join('')}</select></label><label>DIFFICULTY<select id="difficulty-select">${difficultyOptions()}</select></label>${mode!=='arcade'?`<label>OPPONENT<select id="opponent-select">${fighterOptions(opponent)}</select></label>`:'<div class="arcade-preview"><span>THE CIRCUIT</span><strong>2 BOUTS · BEST OF 3</strong></div>'}<button class="primary start-button" data-action="start">${mode==='training'?'ENTER TRAINING':'STEP INTO THE RING'} ${arrow}</button></div></main>`;
 }else if(screen==='help'){
  app.innerHTML=`${header()}<main class="help-screen"><button class="back" data-action="close-help">← ${helpFrom==='match'?'BACK TO MATCH':'BACK'}</button><h1>MAKE YOUR MOVE.</h1><p class="muted">Spacing wins fights. Block high, watch for lows, and punish a missed swing.</p><div class="help-grid"><section><h2>THE CONTROLS</h2><div class="controls-table">${CONTROL_ROWS.map(c=>`<div><kbd>${c[0]}</kbd><span>${c[1]}</span></div>`).join('')}</div></section><section><h2>THE OPENINGS</h2><p><b>Guard with L.</b> Standing guard stops high and mid attacks. Hold C + L to stop low sweeps. Crouching slips high punches, but mid attacks hit a low guard.</p><p><b>Get close. Press U.</b> Throws beat guard. Back away, jump, or crouch to escape their short reach.</p><p><b>Chain your hits.</b> Tap the next key just as the previous strike connects. Finish a listed three-hit chain for bonus damage and a knockdown. Repeated hits deal less damage.</p><p><b>Spend your charge.</b> Press O with at least 50 charge. Rhea drives forward, Bram crushes through with power, and Sable attacks low.</p><p><b>Move in depth.</b> W and S sidestep in 3D. Attacks lock their direction during startup. Step outside the strike, then counter.</p><h2>${FIGHTERS[selected].name.toUpperCase()} · COMBOS</h2>${moveList(selected)}<p class="small muted">Keyboard recommended. Touch controls appear on touch devices. No gamepad support in this edition.</p></section></div><button class="primary" data-action="${helpFrom==='match'?'close-help':'practice'}">${helpFrom==='match'?'BACK TO THE FIGHT':'TRY IT IN TRAINING'} ${arrow}</button></main>`;
 }else if(screen==='match'){
  const a=game.fighters[0],b=game.fighters[1];
  app.innerHTML=`<div class="fight-ui"><div class="fight-topline"><span>${mode==='training'?'TRAINING':mode==='arcade'?`THE CIRCUIT · BOUT ${arcadeIndex+1} / ${ladder.length}`:'QUICK MATCH'} <i>/</i> ${ARENAS[arena].name.toUpperCase()}</span><button class="text-button" data-action="pause">PAUSE <kbd>ESC</kbd></button></div><div class="hud"><div class="fighter-hud player"><div class="hud-name"><strong>${a.def.name}</strong><span>YOU</span></div><div class="health-track" role="progressbar" aria-label="Player health" aria-valuemin="0" aria-valuemax="${a.def.maxHealth}" aria-valuenow="${a.hp}"><div class="health-trail"></div><div id="p-health" class="health-fill"></div></div><div class="hud-under"><div id="p-rounds" class="round-dots"></div><span id="p-hp">${a.hp} / ${a.def.maxHealth}</span></div><div class="charge"><div id="p-meter"></div></div><div class="meter-label"><span>${a.def.special.toUpperCase()}</span><span id="p-charge">50 / 100 <kbd>O</kbd></span></div></div><div class="timer-panel"><strong id="timer">60</strong><span id="round-label">ROUND 1</span></div><div class="fighter-hud cpu"><div class="hud-name"><strong>${b.def.name}</strong><span>${mode==='training'?'DUMMY':DIFFICULTIES[settings.difficulty].name.toUpperCase()}</span></div><div class="health-track" role="progressbar" aria-label="Opponent health" aria-valuemin="0" aria-valuemax="${b.def.maxHealth}" aria-valuenow="${b.hp}"><div class="health-trail"></div><div id="c-health" class="health-fill"></div></div><div class="hud-under"><div id="c-rounds" class="round-dots"></div><span id="c-hp">${b.hp} / ${b.def.maxHealth}</span></div><div class="charge"><div id="c-meter"></div></div><div class="meter-label"><span>${b.def.special.toUpperCase()}</span><span id="c-charge">50 / 100</span></div></div></div><div id="announcement" class="announcement"></div><div id="combo" class="combo-display"></div><div id="combat-feedback" class="combat-feedback" aria-live="polite"></div>${mode==='training'?`<div class="training-toolbar"><label>DUMMY<select id="dummy-select"><option value="stand">Stand</option><option value="guard">High guard</option><option value="low">Crouch</option><option value="cpu">Fight back</option></select></label><button data-action="reset-training">RESET <kbd>R</kbd></button><button data-action="fill-charge">FILL CHARGE</button><button data-action="help">MOVE LIST</button></div>`:''}<div class="fight-bottom"><div class="movement-hint"><span><kbd>A</kbd><kbd>D</kbd> MOVE</span><span><kbd>W</kbd><kbd>S</kbd> STEP</span><span><kbd>SPACE</kbd> JUMP</span></div><div class="attack-hints">${[['J','PUNCH'],['K','KICK'],['I','HEAVY'],['L','GUARD'],['U','THROW'],['O','SPECIAL']].map(([key,label])=>`<span><kbd>${key}</kbd>${label}</span>`).join('')}</div></div><div class="touch-controls"><div class="touch-move"><button data-hold="KeyW" aria-label="Sidestep away">W</button><button data-hold="KeyA" aria-label="Move left">A</button><button data-hold="KeyS" aria-label="Sidestep near">S</button><button data-hold="KeyD" aria-label="Move right">D</button><button data-hold="Space">JUMP</button><button data-hold="KeyC">LOW</button></div><div class="touch-attacks">${['J','K','I','L','U','O'].map(k=>`<button data-hold="Key${k}">${k}</button>`).join('')}</div></div></div>${paused?pauseHTML():''}`;
  if(mode==='training')document.querySelector('#dummy-select').value=game.dummy;
  updateHUD();
 }else if(screen==='results'){
  const won=game.winner===0,complete=won&&mode==='arcade'&&arcadeIndex===ladder.length-1;
  app.innerHTML=`<div class="results-shade"></div>${header()}<main class="result-screen"><p class="result-overline">${complete?'THE CIRCUIT IS YOURS':won?'YOU FOUND YOUR OPENING':'ANOTHER ROUND AWAITS'}</p><h1>${complete?'CIRCUIT<br>CHAMPION.':won?'VICTORY.':'DEFEAT.'}</h1><p class="result-sub">${won?FIGHTERS[selected].name:FIGHTERS[opponent].name} takes the match <b>${game.wins[0]} — ${game.wins[1]}</b></p><div class="result-stats"><div><strong>${game.stats.hits[0]}</strong><span>HITS LANDED</span></div><div><strong>${game.stats.maxCombo[0]}</strong><span>BEST COMBO</span></div><div><strong>${game.stats.blocks[0]}</strong><span>STRIKES BLOCKED</span></div></div><p class="result-tip">${won?'You made the space. You made it count.':'Watch their reach. A missed heavy strike leaves room to counter.'}</p><div class="result-actions">${won&&mode==='arcade'&&!complete?'<button class="primary" data-action="next-bout">NEXT CHALLENGER ↗</button>':'<button class="primary" data-action="rematch">RUN IT BACK ↗</button>'}<button data-action="change-fighter">CHANGE FIGHTER</button><button class="text-button" data-action="home">MAIN MENU</button></div></main>${footer()}`;
 }
}
function pauseHTML(){return `<div class="pause-backdrop"><section class="pause-panel" role="dialog" aria-modal="true" aria-label="Game paused"><div><span class="muted">TAKE A BREATH</span><h1>PAUSED.</h1><div class="pause-actions"><button class="primary" data-action="resume">BACK TO THE FIGHT ↗</button><button data-action="restart">RESTART MATCH</button><button data-action="help">CONTROLS & MOVE LIST</button><button data-action="change-fighter">CHANGE FIGHTER</button><button data-action="home">MAIN MENU</button></div><div class="settings"><label><input type="checkbox" id="music-toggle" ${settings.music?'checked':''}/> MUSIC</label><label><input type="checkbox" id="effects-toggle" ${settings.effects?'checked':''}/> CAMERA & PARTICLE EFFECTS</label></div></div><div class="pause-moves"><h2>${FIGHTERS[selected].name.toUpperCase()}</h2><p class="muted">${FIGHTERS[selected].style}</p>${moveList(selected)}<div class="special-note"><kbd>O</kbd><div><b>${FIGHTERS[selected].special}</b><p>Costs 50 charge. ${selected===2?'A low spinning strike.':'A powerful advancing strike.'}</p></div></div><p class="small muted">Tip: tap the next attack on contact. A third consecutive hit knocks your rival down.</p></div></section></div>`;}
function updateHUD(){
 if(screen!=='match')return;
 game.fighters.forEach((f,i)=>{const p=i?'c':'p';const health=document.querySelector(`#${p}-health`);if(!health)return;health.style.width=`${f.hp/f.def.maxHealth*100}%`;health.parentElement.setAttribute('aria-valuenow',String(f.hp));health.parentElement.querySelector('.health-trail').style.width=health.style.width;document.querySelector(`#${p}-hp`).textContent=`${Math.ceil(f.hp)} / ${f.def.maxHealth}`;document.querySelector(`#${p}-meter`).style.width=`${f.meter}%`;document.querySelector(`#${p}-meter`).parentElement.classList.toggle('ready',f.meter>=50);document.querySelector(`#${p}-charge`).textContent=`${Math.floor(f.meter)} / 100${i?'':' · O'}`;document.querySelector(`#${p}-rounds`).innerHTML=[0,1].map(n=>`<i class="${game.wins[i]>n?'won':''}"></i>`).join('');});
 document.querySelector('#timer').textContent=game.training?'∞':Math.ceil(game.timer).toString().padStart(2,'0');document.querySelector('#timer').classList.toggle('urgent',game.timer<10&&!game.training);document.querySelector('#round-label').textContent=game.training?'PRACTICE':`ROUND ${game.round}`;
 const ann=document.querySelector('#announcement');let text='',sub='';
 if(game.phase==='intro'){text=game.phaseTime>.85?`ROUND ${game.round}`:'READY';sub=game.training?'FIND YOUR RHYTHM':'FIRST TO TWO ROUNDS';}
 else if(game.phase==='roundOver'){text=game.roundWinner===null?'DRAW':game.timer===0?'TIME UP':'K.O.';sub=game.roundWinner===null?'RUN THE ROUND AGAIN':`${game.fighters[game.roundWinner].def.name.toUpperCase()} TAKES THE ROUND`;}
 else if(time<roundMessageUntil){text='FIGHT';}
 const announcement=text?`<strong>${text}</strong><span>${sub}</span>`:'';if(ann.innerHTML!==announcement)ann.innerHTML=announcement;
 document.querySelector('#combo').innerHTML=time<comboUntil?comboText:'';
 document.querySelector('#combat-feedback').textContent=time<lastEventUntil?lastEvent:'';
}
function handleEvents(){for(const e of game.events){sound.play(e.type,e);if(e.type==='hit'||e.type==='block')world.burst(e);
 if(e.type==='hit'){lastEvent=`${e.attacker===0?'YOU':'CPU'} · ${e.name.toUpperCase()} · ${e.damage} DAMAGE`;lastEventUntil=time+1.3;if(e.combo>1){comboText=`<strong>${e.combo}<span>HIT${e.combo>1?'S':''}</span></strong><p>${e.finisher?e.name.toUpperCase():'COMBO'} <b>${e.total} DMG</b></p>`;comboUntil=time+1.4;}}
 if(e.type==='block'){lastEvent=e.side===0?'GUARD · WELL READ':'BLOCKED · TRY A LOW OR THROW';lastEventUntil=time+.9;}
 if(e.type==='dodge'){lastEvent='SLIPPED THE STRIKE';lastEventUntil=time+.8;}
 if(e.type==='empty'&&e.side===0){lastEvent='SPECIAL NEEDS 50 CHARGE';lastEventUntil=time+1;}
 if(e.type==='fight')roundMessageUntil=time+.55;
 if(e.type==='matchEnd'){sound.fighting=false;setScreen('results');}
 }game.events=[];}
app.addEventListener('click',e=>{
 const button=e.target.closest('[data-action],[data-fighter]');if(!button)return;e.preventDefault();uiSound();
 if(button.dataset.fighter!==undefined){selected=Number(button.dataset.fighter);if(opponent===selected)opponent=(selected+1)%3;world.setFighters(selected,opponent);game=new Combat({player:selected,opponent});renderUI();return;}
 switch(button.dataset.action){
  case 'home':menu();break;
  case 'arcade':select('arcade');break;
  case 'quick':select('quick');break;
  case 'training':case 'practice':select('training');break;
  case 'start':beginMatch();break;
  case 'sound':settings.sound=!settings.sound;sound.setEnabled(settings.sound);save();document.querySelectorAll('[data-action="sound"]').forEach(el=>el.innerHTML=`SOUND ${settings.sound?'ON':'OFF'} <span>${settings.sound?'◖))':'×'}</span>`);break;
  case 'help':showHelp();break;
  case 'close-help':closeHelp();break;
  case 'pause':pause();break;
  case 'resume':resume();break;
  case 'restart':game.restart();lastEvent='';comboText='';resume();break;
  case 'rematch':if(mode==='arcade'&&game.winner===0)beginMatch();else startBout();break;
  case 'change-fighter':select(mode);break;
  case 'next-bout':arcadeIndex++;opponent=ladder[arcadeIndex];arena=arcadeIndex%2;startBout();break;
  case 'reset-training':game.restart();break;
  case 'fill-charge':game.fighters.forEach(f=>f.meter=100);break;
 }
});
app.addEventListener('change',e=>{
 const el=e.target;if(el.id==='arena-select'){arena=Number(el.value);world.setArena(arena);}
 if(el.id==='difficulty-select'){settings.difficulty=el.value;save();}
 if(el.id==='opponent-select')opponent=Number(el.value);
 if(el.id==='dummy-select')game.dummy=el.value;
 if(el.id==='music-toggle'){settings.music=el.checked;sound.music=el.checked;save();}
 if(el.id==='effects-toggle'){settings.effects=el.checked;world.reduced=!el.checked;save();}
});
function press(code,repeat=false){
 if(screen!=='match'||paused)return;held.add(code);if(!repeat&&['KeyJ','KeyK','KeyI','KeyU','KeyO'].includes(code))pendingAttack=code.slice(3);if(code==='Space'&&!repeat)pendingJump=true;
}
window.addEventListener('keydown',e=>{
 if(['INPUT','SELECT'].includes(e.target.tagName))return;
 const relevant=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyJ','KeyK','KeyI','KeyL','KeyU','KeyO','KeyC','ShiftLeft','ShiftRight','Escape','KeyP'];if(relevant.includes(e.code))e.preventDefault();
 if(!e.repeat&&(e.code==='Escape'||e.code==='KeyP')){if(screen==='match'){paused?resume():pause();}else if(screen==='help')closeHelp();else if(screen==='select'||screen==='results')menu();return;}
 if(!e.repeat&&e.code==='Slash'){showHelp();return;}
 if(screen==='menu'&&e.code==='Enter'){uiSound();select('arcade');return;}
 if(screen==='select'&&!e.repeat){if(e.code==='Enter'){uiSound();beginMatch();return;}if(['ArrowLeft','ArrowRight'].includes(e.code)){selected=(selected+(e.code==='ArrowRight'?1:2))%3;world.setFighters(selected,opponent);game=new Combat({player:selected,opponent});renderUI();return;}}
 if(screen==='match'&&game.training&&e.code==='KeyR'&&!e.repeat){game.restart();clearInput();return;}
 press(e.code,e.repeat);
});
window.addEventListener('keyup',e=>held.delete(e.code));
app.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-hold]');if(b){e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('pressed');press(b.dataset.hold);sound.start();}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(event,e=>{const b=e.target.closest('[data-hold]');if(b){held.delete(b.dataset.hold);b.classList.remove('pressed');}});
window.addEventListener('blur',()=>{clearInput();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
function readInput(){const inp={x:(held.has('KeyD')||held.has('ArrowRight')?1:0)-(held.has('KeyA')||held.has('ArrowLeft')?1:0),z:(held.has('KeyS')?1:0)-(held.has('KeyW')||held.has('ArrowUp')?1:0),run:held.has('ShiftLeft')||held.has('ShiftRight'),crouch:held.has('KeyC')||held.has('ArrowDown'),guard:held.has('KeyL'),jump:pendingJump,attack:pendingAttack};const x=inp.x,z=inp.z,yaw=world.yaw||0;inp.x=x*Math.cos(yaw)+z*Math.sin(yaw);inp.z=-x*Math.sin(yaw)+z*Math.cos(yaw);pendingAttack=null;pendingJump=false;return inp;}
let last=performance.now(),accumulator=0,frames=0,fpsTime=0,fps=60;
function frame(now){
 const wallDt=(now-last)/1000;const dt=Math.min(.25,wallDt);last=now;time+=dt;frames++;fpsTime+=wallDt;if(fpsTime>=1){fps=Math.round(frames/fpsTime);frames=0;fpsTime=0;}
 if(screen==='match'&&!paused){accumulator+=dt;let first=true;const input=readInput();while(accumulator>=1/60){game.tick(1/60,first?input:{...input,attack:null,jump:false});first=false;accumulator-=1/60;handleEvents();}if(first){pendingAttack=input.attack;pendingJump=input.jump;}updateHUD();}
 else accumulator=0;
 if(screen!=='menu'&&screen!=='help')world.render(game.fighters,paused?0:dt,time,screen==='select'?'select':'fight');
 if(!paused)sound.update();
 requestAnimationFrame(frame);
}
setScreen('menu');requestAnimationFrame(frame);
// Read-only diagnostics are always available. Controlled test setup is opt-in on localhost via ?test=1.
window.cinder={snapshot:()=>({...game.snapshot(),screen,paused,fps,arena,selected,opponent,mode,difficulty:settings.difficulty,audio:sound.ctx?.state||'locked',particles:world.particles.length,camera:world.camera.position.toArray(),cameraYaw:world.yaw,renderer:world.renderer.info.render})};
if(new URLSearchParams(location.search).has('test')&&['localhost','127.0.0.1'].includes(location.hostname)){
 window.cinder.test={game:()=>game,world:()=>world,audio:()=>sound,start:options=>{mode=options.mode||'quick';selected=options.player??0;opponent=options.opponent??1;arena=options.arena??0;settings.difficulty=options.difficulty||'normal';startBout();},input:press,release:code=>held.delete(code),step:(seconds,input={},cpu={})=>{for(let t=0;t<seconds;t+=1/60)game.tick(1/60,input,cpu);handleEvents();updateHUD();},set:(side,values)=>Object.assign(game.fighters[side],values),pause,resume};
}
