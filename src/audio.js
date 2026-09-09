// Original synthesized score and effects. No samples, recordings or external audio assets.
export class GameAudio {
 constructor(){this.enabled=true;this.music=true;this.ctx=null;this.nextBeat=0;this.beat=0;this.fighting=false;}
 start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.32;this.master.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.25,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}if(this.ctx.state==='suspended')this.ctx.resume();}
 tone(freq,duration,type='sine',volume=.2,when=0,endFreq=null){if(!this.ctx||!this.enabled)return;const t=when||this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 noiseHit(volume=.2,duration=.1,when=0,freq=1800){if(!this.ctx||!this.enabled)return;const t=when||this.ctx.currentTime,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 play(type,e={}){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;
  if(type==='hit'){this.tone(e.down?95:145,.16,'sine',.55,0,38);this.noiseHit(.48,.11,0,2400);if(e.kind==='special'){this.tone(490,.4,'sawtooth',.1,0,70);}}
  if(type==='block'){this.noiseHit(.2,.07,0,3800);this.tone(620,.07,'triangle',.16);}
  if(type==='swing')this.noiseHit(.075,.12,0,900);
  if(type==='jump')this.tone(120,.10,'sine',.12,0,300);
  if(type==='ui'){this.tone(520,.07,'triangle',.16);this.tone(780,.08,'sine',.1,t+.04);}
  if(type==='fight'){this.tone(196,.12,'square',.14);this.tone(392,.25,'square',.12,t+.15);}
  if(type==='ko'){[196,246.94,293.66,392].forEach((n,i)=>this.tone(n,.55,'triangle',.2,t+i*.10));this.noiseHit(.3,.23);}
  if(type==='empty')this.tone(85,.09,'square',.1);
 }
 update(){if(!this.ctx||!this.enabled||!this.music)return;const t=this.ctx.currentTime;if(this.nextBeat<t-.4)this.nextBeat=t;
  while(this.nextBeat<t+.12){const n=this.beat++,when=this.nextBeat;const roots=[73.416,65.406,87.307,65.406];const root=roots[Math.floor(n/16)%4];
   if(n%2===0)this.tone(root*(n%8===6?2:1),.18,'sawtooth',this.fighting?.10:.055,when);
   if(n%4===0)this.tone(125,.15,'sine',.32,when,38);
   if(n%4===2)this.noiseHit(.13,.09,when,2600);
   if(this.fighting||n%2===0)this.noiseHit(.035,.028,when,7000);
   if(n%2===1){const steps=[0,7,10,14,12,7,3,10];this.tone(root*4*2**(steps[Math.floor(n/2)%8]/12),.24,'triangle',.055,when);}
   this.nextBeat+=60/112/4;
  }
 }
 setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?.32:0,this.ctx.currentTime,.025);}
}
