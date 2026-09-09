export const FIGHTERS = [
  { id:'rhea', name:'Rhea Vale', short:'RHEA', title:'The moving target', style:'Slipstream / kickboxing', description:'Fast feet. Long kicks. Relentless pressure. Turn a sidestep into an opening.', color:'#a9d8cd', accent:'#ee7446', skin:'#c89472', outfit:'#21484b', speed:3.6, power:0.94, maxHealth:100, scale:0.96, special:'Gale Driver', ability:'Slip charge', abilityText:'A successful sidestep dodge earns 12 extra charge.', stats:[5,3,3], chains:[['J J K','Crosswind','Two quick hands into a spinning kick.'],['K J K','Switchback','A kick, a cross, and a rising heel.'],['J K I','Gale Break','A three-strike knockdown finish.']] },
  { id:'bram', name:'Bram Kor', short:'BRAM', title:'Built to hold the line', style:'Ironframe / power boxing', description:'Heavy hands. Close-range throws. Stand your ground, then break theirs.', color:'#e18b50', accent:'#f4c882', skin:'#815743', outfit:'#333b42', speed:2.75, power:1.14, maxHealth:115, scale:1.08, special:'Foundry Rush', ability:'Iron reserve', abilityText:'Blocking a strike earns 7 extra charge.', stats:[2,5,5], chains:[['J J I','Rivet Line','Two jabs into a crushing hammer.'],['K J I','Anvil Drop','Open low and finish with power.'],['J K K','Pressure Test','A cross into a double boot finish.']] },
  { id:'sable', name:'Sable Nyx', short:'SABLE', title:'A little misdirection', style:'Afterimage / acrobatics', description:'Unusual angles and sweeping lows. Make them guess where the next strike lands.', color:'#bba4ec', accent:'#dfed97', skin:'#aa7c62', outfit:'#41354f', speed:3.35, power:1, maxHealth:102, scale:1, special:'Orbit Breaker', ability:'Second wind', abilityText:'Landing a combo finisher restores 4 health.', stats:[4,4,3], chains:[['J K K','Moonturn','A hand check into two sweeping kicks.'],['K K I','Nightfall','Two kicks and an overhead finisher.'],['J J I','Blind Angle','Quick hands hide a heavy strike.']] }
];
export const ARENAS = [
  {id:'foundry',name:'The Sundown Foundry',tag:'Rooftop / Golden hour',description:'Above the city. Nothing between you and the horizon.',accent:'#ee8758'},
  {id:'reservoir',name:'The Quiet Reservoir',tag:'Waterworks / Blue hour',description:'A forgotten water temple, brought back to life.',accent:'#75caca'}
];
// Seconds are fixed-simulation time. Every attack resolves at most once.
export const MOVES = {
  jab:{name:'Straight',input:'J',startup:.11,active:.10,recovery:.22,damage:7,range:1.62,level:'high',stun:.26,push:.13,anim:'punch'},
  kick:{name:'Drive kick',input:'K',startup:.20,active:.12,recovery:.30,damage:11,range:2.02,level:'mid',stun:.32,push:.25,anim:'kick'},
  heavy:{name:'Hammer strike',input:'I',startup:.34,active:.14,recovery:.43,damage:18,range:1.85,level:'mid',stun:.48,push:.50,anim:'heavy',knockdown:true},
  low:{name:'Low sweep',input:'↓ K',startup:.22,active:.12,recovery:.38,damage:10,range:1.92,level:'low',stun:.35,push:.2,anim:'sweep',knockdown:true},
  upper:{name:'Rising palm',input:'↓ J',startup:.18,active:.10,recovery:.30,damage:9,range:1.55,level:'mid',stun:.32,push:.2,anim:'heavy'},
  air:{name:'Air kick',input:'SPACE K',startup:.12,active:.16,recovery:.30,damage:13,range:2.10,level:'mid',stun:.4,push:.4,anim:'kick'},
  grab:{name:'Clinch throw',input:'U',startup:.20,active:.08,recovery:.56,damage:16,range:1.30,level:'throw',stun:.6,push:1.25,anim:'grab',knockdown:true},
  special:{name:'Special',input:'O',startup:.28,active:.20,recovery:.52,damage:24,range:2.50,level:'mid',stun:.55,push:.9,anim:'special',knockdown:true,cost:50},
};
export const DIFFICULTIES = {
  easy:{name:'Rookie',reaction:.43,aggression:.56,block:.26,combo:.18,special:.18},
  normal:{name:'Contender',reaction:.24,aggression:.74,block:.50,combo:.48,special:.35},
  hard:{name:'Veteran',reaction:.14,aggression:.89,block:.72,combo:.73,special:.55}
};
export const CONTROL_ROWS = [ ['A / D','Walk left / right'],['W / S','Sidestep into / out of the screen'],['SHIFT + A / D','Run'],['SPACE','Jump'],['↓ / C','Crouch'],['J','Quick punch'],['K','Kick · crouch for low sweep'],['I','Heavy knockdown strike'],['L','Hold guard · crouch to block lows'],['U','Close-range throw · beats guard'],['O','Special · costs 50 charge'],['ESC / P','Pause / move list'] ];
