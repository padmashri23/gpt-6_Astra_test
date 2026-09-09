import {FIGHTERS,MOVES,DIFFICULTIES} from './data.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seededRandom(seed=42){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export class Combat {
  constructor({player=0,opponent=1,difficulty='normal',training=false,rng=Math.random}={}){
    this.rng=rng;this.difficulty=difficulty;this.training=training;this.dummy='stand';this.events=[];this.fighters=[this.makeFighter(player,0),this.makeFighter(opponent,1)];
    this.round=1;this.wins=[0,0];this.phase='intro';this.phaseTime=2.1;this.timer=60;this.elapsed=0;this.winner=null;this.roundWinner=null;this.hitstop=0;this.aiTime=0;this.aiInput={};this.stats={hits:[0,0],damage:[0,0],blocks:[0,0],dodges:[0,0],maxCombo:[0,0]};
  }
  makeFighter(id,side){const def=FIGHTERS[id];return {id,side,def,x:side?2.3:-2.3,z:0,y:0,vy:0,angle:side?-Math.PI/2:Math.PI/2,hp:def.maxHealth,meter:50,state:'idle',stateTime:0,attack:null,buffer:null,stun:0,invuln:0,guard:false,crouch:false,walk:0,run:false,sidestep:0,combo:0,comboDamage:0,comboUntil:0,chain:[],chainTime:0,lastMove:'',flash:0,moveClock:0};}
  emit(type,data={}){this.events.push({type,...data});}
  resetPositions(){this.fighters=this.fighters.map((f,i)=>this.makeFighter(f.id,i));this.timer=60;this.hitstop=0;this.aiTime=0;this.aiInput={};}
  nextRound(){this.round++;this.resetPositions();this.phase='intro';this.phaseTime=1.65;this.emit('round',{round:this.round});}
  restart(){this.wins=[0,0];this.round=1;this.stats={hits:[0,0],damage:[0,0],blocks:[0,0],dodges:[0,0],maxCombo:[0,0]};this.resetPositions();this.phase='intro';this.phaseTime=1.5;this.winner=null;this.roundWinner=null;}
  requestAttack(f,key){
    if(this.phase!=='fight'||f.hp<=0)return false;
    if(f.attack||f.stun>0){f.buffer={key,expires:this.elapsed+.19};return false;}
    if(f.state==='down'||f.state==='recover')return false;
    let kind=key==='J'?'jab':key==='K'?'kick':key==='I'?'heavy':key==='U'?'grab':'special';
    if(f.y>.25&&['J','K','I'].includes(key))kind='air';else if(f.crouch&&key==='K')kind='low';else if(f.crouch&&key==='J')kind='upper';
    if(f.y>.05&&(kind==='grab'||kind==='special'))return false;
    const base=MOVES[kind];if(base.cost&&f.meter<base.cost){this.emit('empty',{side:f.side});return false;}
    if(base.cost)f.meter-=base.cost;
    if(this.elapsed-f.chainTime>.78)f.chain=[];
    f.chain.push(key);f.chain=f.chain.slice(-3);f.chainTime=this.elapsed;
    const chain=f.def.chains.find(c=>c[0].replaceAll(' ','')===f.chain.join(''));
    const finisher=!!chain&&f.combo>=2;
    const move={...base,damage:base.damage*(finisher?1.25:1),knockdown:base.knockdown||finisher,name:kind==='special'?f.def.special:finisher?chain[1]:base.name};
    if(f.id===0&&kind==='kick')move.range+=.18;
    if(f.id===1&&kind==='grab')move.damage+=3;
    if(f.id===2&&kind==='special')move.level='low';
    f.attack={kind,move,t:0,connected:false,resolved:false,finisher};f.state='attack';f.stateTime=0;f.guard=false;f.buffer=null;f.lastMove=move.name;
    this.emit('swing',{side:f.side,kind});return true;
  }
  input(f,inp,dt){
    if(f.hp<=0||f.state==='down'||f.state==='recover'||f.stun>0){f.guard=false;return;}
    f.crouch=!!inp.crouch&&f.y===0;f.guard=!!inp.guard&&!f.attack&&f.y===0;f.run=!!inp.run;
    if(inp.attack)this.requestAttack(f,inp.attack);
    if(f.attack)return;
    if(inp.jump&&f.y===0&&!f.guard){f.vy=6.4;f.crouch=false;this.emit('jump',{side:f.side});}
    const dx=inp.x||0,dz=inp.z||0;const length=Math.hypot(dx,dz)||1;
    const speed=f.def.speed*(f.run?1.65:1)*(f.guard?.35:f.crouch?.3:1)*(f.y>0?.65:1);
    f.x+=dx/length*speed*dt;f.z+=dz/length*speed*dt;
    f.walk=Math.hypot(dx,dz);f.sidestep=Math.abs(dz);f.moveClock+=f.walk*dt*(f.run?1.6:1);
    f.state=f.y>0?'jump':f.guard?'guard':f.crouch?'crouch':f.walk?'walk':'idle';
  }
  cpuInput(dt){
    const [p,c]=this.fighters;if(this.training&&this.dummy!=='cpu')return {guard:this.dummy==='guard',crouch:this.dummy==='low'};
    const d=DIFFICULTIES[this.difficulty];this.aiTime-=dt;
    // No frame-perfect input reading: decisions are sampled at a difficulty-specific interval.
    if(this.aiTime>0)return {...this.aiInput,attack:null,jump:false};
    this.aiTime=d.reaction*(.8+this.rng()*.5);const dist=distance(p,c);const random=this.rng();const inp={x:0,z:0};
    if(c.state==='down'||c.stun>0)return inp;
    if(p.attack&&p.attack.t>0.06&&dist<2.8&&random<d.block){
      if(p.attack.move.level==='throw'){inp.x=Math.sign(c.x-p.x);inp.run=true;}
      else {inp.guard=true;inp.crouch=p.attack.move.level==='low';}
    }else if(dist>1.7){inp.x=Math.sign(p.x-c.x);inp.z=Math.abs(p.z-c.z)>.25?Math.sign(p.z-c.z):0;inp.run=dist>4;}
    else if(random<d.aggression){
      if(c.attack?.connected&&this.rng()<d.combo){const prefix=c.chain.join('');const chain=c.def.chains.find(ch=>ch[0].replaceAll(' ','').startsWith(prefix));inp.attack=chain?chain[0].replaceAll(' ','')[prefix.length]||'J':'J';}
      else if(c.meter>=50&&this.rng()<d.special)inp.attack='O';
      else if(p.guard&&dist<1.4&&this.rng()<.7)inp.attack='U';
      else {inp.attack=['J','J','K','K','I','U'][Math.floor(this.rng()*6)];inp.crouch=this.rng()<.22;}
    }else{inp.z=this.rng()<.5?-1:1;inp.guard=this.rng()<.35;}
    this.aiInput=inp;return inp;
  }
  tick(dt,playerInput={},cpuOverride=null){
    dt=Math.min(dt,.05);if(this.phase==='matchOver')return;
    this.elapsed+=dt;
    if(this.hitstop>0){
      // Keep contact-frame inputs: the visual impact freeze must not eat a combo press.
      if(this.phase==='fight'&&playerInput.attack)this.requestAttack(this.fighters[0],playerInput.attack);
      if(this.phase==='fight'&&cpuOverride?.attack)this.requestAttack(this.fighters[1],cpuOverride.attack);
      this.hitstop-=dt;return;
    }
    if(this.phase!=='fight'){
      this.phaseTime-=dt;
      for(const f of this.fighters){f.stateTime+=dt;f.flash=Math.max(0,f.flash-dt);}
      if(this.phaseTime<=0){if(this.phase==='intro'){this.phase='fight';this.emit('fight');}else if(this.phase==='roundOver'){if(this.wins.some(x=>x>=2)){this.phase='matchOver';this.winner=this.wins[0]>=2?0:1;this.emit('matchEnd',{winner:this.winner});}else this.nextRound();}}
      return;
    }
    if(!this.training)this.timer=Math.max(0,this.timer-dt);
    const inputs=[playerInput,cpuOverride??this.cpuInput(dt)];
    for(let i=0;i<2;i++){
      const f=this.fighters[i],opp=this.fighters[1-i];f.stateTime+=dt;f.flash=Math.max(0,f.flash-dt);f.invuln=Math.max(0,f.invuln-dt);f.stun=Math.max(0,f.stun-dt);f.walk=0;f.sidestep=0;
      f.meter=clamp(f.meter+dt*2,0,100);
      if(this.elapsed>f.comboUntil){f.combo=0;f.comboDamage=0;}
      if(f.state==='down'&&f.stateTime>.86){f.state='recover';f.stateTime=0;f.invuln=.55;}
      else if(f.state==='recover'&&f.stateTime>.42){f.state='idle';f.stateTime=0;}
      if(f.y>0||f.vy>0){f.vy-=17*dt;f.y=Math.max(0,f.y+f.vy*dt);if(f.y===0)f.vy=0;}
      // Facing locks during a strike. Sidestepping can leave its forward cone.
      if(!f.attack&&f.state!=='down')f.angle=Math.atan2(opp.x-f.x,opp.z-f.z);
      this.input(f,inputs[i],dt);
      if(f.attack){
        const a=f.attack;a.t+=dt;
        if(a.kind==='special'&&a.t<a.move.startup){f.x+=Math.sin(f.angle)*dt*2;f.z+=Math.cos(f.angle)*dt*2;}
        if(!a.resolved&&a.t>=a.move.startup&&a.t<a.move.startup+a.move.active){this.resolve(f,opp,a);}
        const cancel=a.connected&&a.t>=a.move.startup+a.move.active+.035&&f.combo<3;
        if(cancel&&f.buffer&&f.buffer.expires>=this.elapsed){const key=f.buffer.key;f.attack=null;this.requestAttack(f,key);}
        else if(a.t>=a.move.startup+a.move.active+a.move.recovery){f.attack=null;f.state='idle';if(f.buffer&&f.buffer.expires>=this.elapsed)this.requestAttack(f,f.buffer.key);}
      }else if(f.buffer&&f.stun===0&&f.buffer.expires>=this.elapsed)this.requestAttack(f,f.buffer.key);
      if(f.buffer&&f.buffer.expires<this.elapsed)f.buffer=null;
      this.bound(f);
    }
    const [a,b]=this.fighters;const dist=distance(a,b);const min=.88;
    if(dist<min){const nx=dist>.001?(b.x-a.x)/dist:1,nz=dist>.001?(b.z-a.z)/dist:0;const shift=(min-dist)/2;a.x-=nx*shift;a.z-=nz*shift;b.x+=nx*shift;b.z+=nz*shift;this.bound(a);this.bound(b);}
    if(this.training){for(const f of this.fighters)if(f.hp<=0||(f.hp<f.def.maxHealth&&f.stun===0&&!f.attack&&this.elapsed>this.fighters[1-f.side].comboUntil+1.1)){f.hp=f.def.maxHealth;}}
    else if(a.hp<=0||b.hp<=0||this.timer<=0)this.finishRound();
  }
  bound(f){const r=Math.hypot(f.x,f.z);if(r>6.1){f.x*=6.1/r;f.z*=6.1/r;}}
  resolve(f,o,a){
    const m=a.move,dx=o.x-f.x,dz=o.z-f.z,dist=Math.hypot(dx,dz);if(dist>m.range||o.invuln>0||o.state==='down'||o.state==='recover')return;
    const dot=(Math.sin(f.angle)*dx+Math.cos(f.angle)*dz)/(dist||1);
    if(dot<.87){if(!a.dodged){a.dodged=true;this.stats.dodges[o.side]++;if(o.id===0)o.meter=clamp(o.meter+12,0,100);this.emit('dodge',{side:o.side});}return;}
    if(m.level==='high'&&(o.crouch||o.y>.65))return;
    if(m.level==='low'&&o.y>.22)return;
    if(m.level==='throw'&&(o.y>.1||f.y>.1||o.crouch||o.stun>0))return;
    if(Math.abs(f.y-o.y)>1.4)return;
    a.resolved=true;
    const blocked=o.guard&&(m.level==='low'?o.crouch:!o.crouch)&&m.level!=='throw';
    const nx=dx/(dist||1),nz=dz/(dist||1);
    if(blocked){
      o.stun=.13;o.state='guard';o.meter=clamp(o.meter+(o.id===1?11:4),0,100);o.x+=nx*.12;o.z+=nz*.12;
      this.stats.blocks[o.side]++;this.emit('block',{side:o.side,x:o.x,y:1.5,z:o.z});return;
    }
    if(this.elapsed>f.comboUntil){f.combo=0;f.comboDamage=0;}
    const scale=Math.max(.45,1-f.combo*.18);const damage=Math.max(1,Math.round(m.damage*f.def.power*scale));
    o.hp=clamp(o.hp-damage,0,o.def.maxHealth);o.attack=null;o.buffer=null;o.guard=false;o.flash=.18;
    f.combo++;f.comboDamage+=damage;f.comboUntil=this.elapsed+.85;f.meter=clamp(f.meter+8,0,100);o.meter=clamp(o.meter+damage*.35,0,100);a.connected=true;
    const down=m.knockdown||f.combo>=3;o.state=down?'down':'hit';o.stateTime=0;o.stun=down?.86:m.stun;
    o.x+=nx*m.push;o.z+=nz*m.push;if(down){o.y=0;o.vy=0;f.chain=[];}
    if(a.finisher&&f.id===2)f.hp=clamp(f.hp+4,0,f.def.maxHealth);
    this.hitstop=m.level==='throw'?.10:down?.075:.045;
    this.stats.hits[f.side]++;this.stats.damage[f.side]+=damage;this.stats.maxCombo[f.side]=Math.max(this.stats.maxCombo[f.side],f.combo);
    this.emit('hit',{side:o.side,attacker:f.side,damage,combo:f.combo,total:f.comboDamage,finisher:a.finisher,name:m.name,down,kind:a.kind,x:o.x,y:m.level==='low'?.45:1.5+o.y,z:o.z});
  }
  finishRound(){
    const [a,b]=this.fighters;const ah=a.hp/a.def.maxHealth,bh=b.hp/b.def.maxHealth;
    const winner=ah===bh?null:ah>bh?0:1;this.roundWinner=winner;
    if(winner!==null)this.wins[winner]++;
    this.phase='roundOver';this.phaseTime=2.4;this.emit('ko',{winner,timeout:this.timer===0});
    for(const f of this.fighters){f.attack=null;f.buffer=null;f.guard=false;f.walk=0;f.y=0;f.vy=0;if(f.side===winner){f.state='victory';f.stateTime=0;}else if(f.hp<=0){f.state='down';f.stateTime=.4;}}
  }
  snapshot(){return {phase:this.phase,round:this.round,wins:[...this.wins],timer:this.timer,winner:this.winner,elapsed:this.elapsed,stats:this.stats,fighters:this.fighters.map(f=>({id:f.id,x:f.x,z:f.z,y:f.y,hp:f.hp,meter:f.meter,state:f.state,guard:f.guard,crouch:f.crouch,combo:f.combo,comboDamage:f.comboDamage,attack:f.attack?.kind??null,lastMove:f.lastMove,invuln:f.invuln}))};}
}
