import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {FIGHTERS} from './data.js';
const V=THREE.Vector3;
const mat=(color,metalness=.0,roughness=.75)=>new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:true});
const emissive=(color,intensity=2)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.4});
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,material,x,y,z,w,h,d){return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
function sphere(parent,material,x,y,z,w,h,d){const m=mesh(new THREE.SphereGeometry(1,10,8),material,parent,x,y,z);m.scale.set(w,h,d);return m;}
function bone(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function limb(parent,material,length,top,bottom){return mesh(new THREE.CylinderGeometry(top,bottom,length,8),material,parent,0,-length/2,0);}
function textPlane(parent,text,x,y,z,w,h,color='#d8f36a',bg='#222825'){
 const c=document.createElement('canvas');c.width=512;c.height=256;const ct=c.getContext('2d');ct.fillStyle=bg;ct.fillRect(0,0,512,256);ct.strokeStyle=color;ct.lineWidth=6;ct.strokeRect(14,14,484,228);ct.fillStyle=color;ct.textAlign='center';ct.font='bold 48px sans-serif';const lines=text.split('\n');lines.forEach((t,i)=>ct.fillText(t,256,115+(i-(lines.length-1)/2)*60));
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.8});return mesh(new THREE.PlaneGeometry(w,h),material,parent,x,y,z);
}
export class FighterModel {
 constructor(id,side=0){
  this.id=id;const d=FIGHTERS[id];this.root=new THREE.Group();this.rig=bone(this.root,0,0,0);this.body=bone(this.rig,0,1.09,0);this.time=0;
  this.materials=[];const make=(c,m=0,r=.75)=>{const a=mat(c,m,r);this.materials.push(a);return a;};
  const skin=make(d.skin),cloth=make(d.outfit),trim=make(d.color,.15),accent=make(d.accent,.12),dark=make('#192326'),hair=make(id===2?'#e5e1ce':'#1e2222'),ivory=make('#d4d8c2'),metal=make('#5b6466',.65,.4);
  this.root.scale.setScalar(d.scale);const bulk=id===1?1.22:1;
  mesh(new THREE.CylinderGeometry(.28*bulk,.32*bulk,.27,8),cloth,this.body,0,.04,0);
  const torso=mesh(new THREE.CylinderGeometry(.43*bulk,.28*bulk,.68,8),id===0?trim:cloth,this.body,0,.49,0);torso.scale.z=.66;
  box(this.body,dark,0,.17,.0,.62*bulk,.12,.40);box(this.body,accent,.04,.17,.225,.16,.11,.055);
  this.chest=bone(this.body,0,.52,0);
  if(id===0){
   const jacketL=box(this.body,ivory,-.29,.57,.02,.20,.60,.49);jacketL.rotation.z=-.1;const jacketR=box(this.body,ivory,.29,.57,.02,.20,.60,.49);jacketR.rotation.z=.1;
   box(this.body,accent,-.32,.49,.282,.055,.28,.03);box(this.body,dark,.30,.65,.278,.12,.055,.028);
  }else if(id===1){
   box(this.body,trim,0,.57,.24,.80,.51,.18);box(this.body,metal,0,.57,.35,.08,.40,.04);
   for(const s of [-1,1]){box(this.body,dark,s*.22,.60,.344,.24,.08,.04);box(this.body,accent,s*.22,.40,.344,.18,.05,.04);}
  }else{
   const sash=box(this.body,trim,0,.48,.26,.13,.78,.08);sash.rotation.z=-.52;
   box(this.body,accent,.23,.65,.27,.13,.12,.05);
   for(const s of [-1,1]){const tail=box(this.body,cloth,s*.25,-.20,-.18,.25,.6,.11);tail.rotation.z=s*.15;}
  }
  limb(bone(this.body,0,.99,0),skin,.14,.12,.14);
  this.head=bone(this.body,0,1.02,0);
  sphere(this.head,skin,0,.14,0,.205,.275,.185);sphere(this.head,skin,0,-.02,.062,.155,.13,.14);
  box(this.head,skin,0,.13,.183,.065,.105,.06);box(this.head,dark,0,-.012,.184,.09,.017,.014);
  for(const s of [-1,1]){sphere(this.head,skin,s*.204,.12,0,.045,.07,.047);box(this.head,ivory,s*.087,.18,.17,.07,.027,.035);box(this.head,dark,s*.079,.18,.193,.027,.033,.012);const brow=box(this.head,hair,s*.085,.226,.185,.105,.026,.03);brow.rotation.z=s*.15;}
  if(id===1){sphere(this.head,hair,0,.32,-.025,.19,.105,.17);sphere(this.head,hair,0,-.055,.065,.14,.072,.13);box(this.head,accent,-.16,.075,.116,.027,.11,.035);}
  else{sphere(this.head,hair,0,.32,-.035,.21,.15,.18);const fringe=sphere(this.head,hair,-.09,.29,.115,.135,.13,.10);fringe.rotation.z=-.4;
   if(id===0){this.ponytail=bone(this.head,0,.34,-.16);sphere(this.ponytail,hair,0,.02,-.17,.115,.12,.24);const t=sphere(this.ponytail,hair,0,-.15,-.28,.08,.22,.10);t.rotation.x=-.6;}
   else{const mohawk=box(this.head,hair,0,.43,-.02,.10,.18,.30);mohawk.rotation.x=-.18;}
  }
  this.scarf=bone(this.body,0,.91,-.1);mesh(new THREE.TorusGeometry(.17,.055,5,10),accent,this.body,0,.92,0).rotation.x=Math.PI/2;
  if(id!==1){const tail=box(this.scarf,accent,-.12,-.08,-.27,.17,.06,.57);tail.rotation.y=-.3;}
  this.arms=[];this.legs=[];
  for(const s of [-1,1]){
   const shoulder=bone(this.body,s*.43*bulk,.75,0);sphere(shoulder,id===0?ivory:trim,0,-.04,0,(id===1?.22:.17)*bulk,id===1?.22:.18,id===1?.23:.18);
   limb(shoulder,id===1?cloth:skin,.40,.145*bulk,.12*bulk);
   const elbow=bone(shoulder,0,-.40,0);sphere(elbow,id===1?metal:skin,0,0,0,.125,.13,.13);limb(elbow,id===0?ivory:cloth,.38,.125*bulk,.105*bulk);
   box(elbow,id===1?trim:dark,0,-.30,.025,.26*bulk,.24,.24*bulk);box(elbow,accent,0,-.30,.153*bulk,.12,.11,.035);
   const hand=bone(elbow,0,-.43,0);sphere(hand,dark,0,-.045,.02,.145*bulk,.14,.135*bulk);box(hand,trim,0,-.075,.125,.19*bulk,.11,.045);
   this.arms.push({upper:shoulder,lower:elbow,hand});
   const hip=bone(this.body,s*.225,-.075,0);limb(hip,cloth,.54,.205*bulk,.15*bulk);
   const knee=bone(hip,0,-.54,0);sphere(knee,cloth,0,0,0,.155*bulk,.16,.17);limb(knee,cloth,.48,.15*bulk,.095*bulk);
   if(id===1){box(hip,trim,0,-.24,.15,.27,.36,.12);box(knee,trim,0,-.20,.12,.24,.33,.14);}else {box(hip,trim,s*.13,-.23,.025,.08,.29,.25);box(knee,accent,0,-.34,.115,.19,.06,.045);}
   box(knee,dark,0,-.46,.10,.27*bulk,.23,.42);box(knee,metal,0,-.575,.12,.28*bulk,.045,.44);box(knee,trim,0,-.44,.28,.19,.065,.075);
   this.legs.push({upper:hip,lower:knee});
  }
  this.shadow=mesh(new THREE.CircleGeometry(.66,32),new THREE.MeshBasicMaterial({color:'#070b09',transparent:true,opacity:.28,depthWrite:false}),this.root,0,.016,0);this.shadow.rotation.x=-Math.PI/2;
 }
 animate(f,dt,time){
  this.root.position.set(f.x,f.y+.06,f.z);this.root.rotation.y=f.angle;this.time+=dt;
  const breath=Math.sin(time*2.7+this.id)*.014;this.rig.position.set(0,breath,0);this.rig.rotation.set(0,0,0);this.body.rotation.set(0,0,0);this.body.position.y=1.09;this.head.rotation.set(0,0,0);
  this.arms.forEach((a,i)=>{a.upper.rotation.set(-.70,0,(i===0?1:-1)*.13);a.lower.rotation.set(-1.05,0,0);});
  this.legs.forEach((l,i)=>{l.upper.rotation.set(i===0?-.35:.25,0,(i===0?1:-1)*.18);l.lower.rotation.set(.18,0,0);});
  if(this.ponytail)this.ponytail.rotation.x=Math.sin(time*3)*.1;
  this.scarf.rotation.y=Math.sin(time*4)*.15;
  if(f.state==='walk'){
   const swing=Math.sin(f.moveClock*11);this.body.position.y+=Math.abs(swing)*.045;this.legs.forEach((l,i)=>{l.upper.rotation.x=swing*(i===0?1:-1)*(f.run?.68:.4);l.lower.rotation.x=Math.max(0,-l.upper.rotation.x)*1.25;});
   this.body.rotation.x=f.run?.12:0;this.arms.forEach((a,i)=>a.upper.rotation.x+=swing*(i?1:-1)*.18);
  }
  if(f.crouch&&!f.attack){this.body.position.y-=.40;this.legs.forEach(l=>{l.upper.rotation.x=-.95;l.lower.rotation.x=1.3;});this.body.rotation.x=.18;}
  if(f.y>0){this.legs[0].upper.rotation.x=-.55;this.legs[0].lower.rotation.x=.75;this.legs[1].upper.rotation.x=.25;this.legs[1].lower.rotation.x=.75;this.shadow.visible=false;}else this.shadow.visible=true;
  if(f.guard){this.arms.forEach((a,i)=>{a.upper.rotation.set(-.65,0,i===0?-.2:.2);a.lower.rotation.x=-1.7;});this.body.rotation.x=.08;}
  if(f.attack){
   const a=f.attack,m=a.move;const progress=Math.min(1,a.t/(m.startup+m.active));const strike=Math.sin(progress*Math.PI/2);const recover=a.t>m.startup+m.active?Math.max(0,1-(a.t-m.startup-m.active)/m.recovery):1;const p=strike*recover;const side=f.chain.length%2;
   if(m.anim==='punch'){this.arms[side].upper.rotation.x=-1.5*p;this.arms[side].lower.rotation.x=-1.28*(1-p);this.body.rotation.y=(side?-.28:.28)*p;this.body.rotation.x=.10*p;}
   if(m.anim==='heavy'){this.arms[1].upper.rotation.x=-2.6*Math.sin(progress*Math.PI)*recover-.95*p;this.arms[1].lower.rotation.x=-.2-.7*(1-p);this.body.rotation.x=.20*p;}
   if(m.anim==='kick'||m.anim==='special'){this.legs[0].upper.rotation.x=-1.6*p;this.legs[0].lower.rotation.x=.18*(1-p);this.body.rotation.x=-.18*p;this.arms[0].upper.rotation.z=.8*p;this.arms[1].upper.rotation.x=-.8;
    if(m.anim==='special'){
     if(this.id===1){this.body.rotation.x=.42*p;this.body.rotation.y=.25*p;this.legs[0].upper.rotation.x=-.35;this.arms.forEach(arm=>{arm.upper.rotation.x=-1.35*p;arm.lower.rotation.x=-.35-.4*(1-p);});}
     else{this.body.rotation.y=Math.PI*2*progress*recover;this.legs[0].upper.rotation.z=-.55*p;if(this.id===2){this.body.position.y-=.35*p;this.legs[0].upper.rotation.x=-.85*p;}}}}
   if(m.anim==='sweep'){this.body.position.y-=.42*p;this.legs[0].upper.rotation.set(-.85*p,0,-.35*p);this.legs[0].lower.rotation.x=0;this.legs[1].upper.rotation.x=-.85*p;this.legs[1].lower.rotation.x=1.5*p;this.body.rotation.y=1.7*p;}
   if(m.anim==='grab'){this.arms.forEach(a=>{a.upper.rotation.x=-1.4*p;a.lower.rotation.x=-.3;});this.body.rotation.x=.25*Math.sin(progress*Math.PI);this.body.rotation.y=-.5*p;}
  }
  if(f.state==='hit'){this.body.rotation.x=-.28;this.head.rotation.x=-.2;this.arms[0].upper.rotation.z=.5;}
  if(f.state==='down'||f.state==='recover'){
   const p=f.state==='down'?Math.min(1,f.stateTime/.22):1-Math.min(1,f.stateTime/.42);this.rig.rotation.x=-Math.PI/2*p;this.rig.position.y=.25*p;this.rig.position.z=-.5*p;this.arms.forEach((a,i)=>a.upper.rotation.z=(i?-.65:.65)*p);this.legs.forEach(l=>{l.upper.rotation.x=.05;l.lower.rotation.x=.05;});
  }
  if(f.state==='victory'){this.arms[1].upper.rotation.x=-2.8;this.arms[1].lower.rotation.x=-.3;this.body.rotation.y=Math.sin(time)*.15;}
  this.materials.forEach(m=>{m.emissive.set(f.flash>0?'#dd863f':'#000000');m.emissiveIntensity=f.flash>0?.6:0;});
 }
 dispose(){this.root.traverse(o=>{o.geometry?.dispose();});this.materials.forEach(m=>m.dispose());this.shadow.material.dispose();}
}
export class World {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');this.software=debug?/swiftshader|llvmpipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):false;this.renderer.setPixelRatio(this.software?.7:Math.min(window.devicePixelRatio,1.5));this.renderer.shadowMap.enabled=!this.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(39,1,.1,180);this.camera.position.set(0,4.4,12.8);this.target=new V(0,1.1,0);this.scene.add(new THREE.HemisphereLight('#ffddae','#2b3c46',2.5));
  this.sun=new THREE.DirectionalLight('#ffd1a0',3.6);this.sun.position.set(-7,12,-5);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:45});this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.04;this.scene.add(this.sun);
  const fill=new THREE.DirectionalLight('#b4dce9',2);fill.position.set(1,6,8);this.scene.add(fill);
  this.arena=new THREE.Group();this.scene.add(this.arena);this.models=[];this.particles=[];this.shake=0;this.reduced=false;this.stage=-1;this.setArena(0);this.setFighters(0,1);this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 clearGroup(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});group.clear();}
 setArena(id){
  if(this.stage===id)return;this.stage=id;this.clearGroup(this.arena);const night=id===1;
  this.scene.background=new THREE.Color(night?'#142c3c':'#bf7960');this.scene.fog=new THREE.Fog(night?'#142c3c':'#bb8069',23,90);this.sun.color.set(night?'#bbebf1':'#ffca96');this.sun.intensity=night?2.2:3.6;
  const concrete=mat(night?'#41545a':'#625f54'),edge=mat('#303b3c',.2),dark=mat(night?'#243c46':'#494943'),steel=mat('#566269',.7,.4),light=emissive(night?'#70d7d4':'#f7d38b');
  const c=document.createElement('canvas');c.width=c.height=256;const ct=c.getContext('2d');ct.fillStyle='#bab9ad';ct.fillRect(0,0,256,256);for(let i=0;i<6500;i++){const n=Math.sin(i*127.1)*43758.5453,x=(n-Math.floor(n))*256,y=(Math.sin(i*311.7)*.5+.5)*256;ct.fillStyle=i%2?'#30332912':'#ffffff13';ct.fillRect(x,y,1+(i%3),1+(i%2));}ct.strokeStyle='#383e3330';ct.lineWidth=1;for(let i=0;i<15;i++){ct.beginPath();ct.moveTo(i*17,(i*59)%256);ct.lineTo(i*17+30,(i*59)%256+8);ct.stroke();}concrete.map=new THREE.CanvasTexture(c);concrete.map.colorSpace=THREE.SRGBColorSpace;concrete.map.wrapS=concrete.map.wrapT=THREE.RepeatWrapping;concrete.map.repeat.set(5,5);
  mesh(new THREE.CylinderGeometry(7.3,7.5,.55,64),edge,this.arena,0,-.35,0);mesh(new THREE.CylinderGeometry(7.15,7.15,.13,64),concrete,this.arena,0,-.02,0);
  const ring=mesh(new THREE.TorusGeometry(6.65,.035,6,96),light,this.arena,0,.053,0);ring.rotation.x=Math.PI/2;
  const inner=mesh(new THREE.TorusGeometry(3.4,.018,4,64),mat('#bac0a7'),this.arena,0,.052,0);inner.rotation.x=Math.PI/2;
  for(let i=-6;i<=6;i++){const len=2*Math.sqrt(7.1**2-i*i);box(this.arena,edge,i,.052,0,.012,.006,len);box(this.arena,edge,0,.052,i,len,.006,.012);}
  const center=textPlane(this.arena,'CINDER\nCIRCUIT',0,.063,0,3.3,1.65,night?'#81adae':'#b9b7a1',night?'#41545a':'#71685e');center.rotation.x=-Math.PI/2;
  for(let i=0;i<32;i++){
   const angle=i/32*Math.PI*2,x=Math.sin(angle)*7,z=Math.cos(angle)*7;
   const marker=box(this.arena,i%4===0?light:edge,x,.058,z,.12,.012,.37);marker.rotation.y=angle;
   if(i%4===0&&z<3){box(this.arena,steel,x,.66,z,.13,1.3,.13);sphere(this.arena,light,x,1.32,z,.08,.08,.08);}
  }
  // A surrounding modeled catwalk, trusses, utility buildings and skyline.
  mesh(new THREE.CylinderGeometry(10,10,.15,64),dark,this.arena,0,-.69,0);
  if(!night){
   mesh(new THREE.CylinderGeometry(90,90,.5,64),mat('#665e51'),this.arena,0,-5.6,0);
   const skyMat=new THREE.MeshBasicMaterial({color:'#ffdfa1',fog:false});sphere(this.arena,skyMat,-13,8,-58,4,4,1);
   for(let i=0;i<32;i++){
    const x=(i%16-7.5)*6.8,z=-40-Math.floor(i/16)*18;const h=4+(Math.sin(i*42.7)*.5+.5)*15;
    box(this.arena,mat(i%2?'#675e56':'#625952'),x,h/2-5.35,z,3.4,h,3.7);
    box(this.arena,steel,x,h-4.35,z,.09,2,.09);
    for(let j=0;j<Math.floor(h/2);j++)if((i+j)%3!==0)box(this.arena,light,x+.6,j*1.8-4.35,z+1.87,.13,.42,.025);
   }
   for(const s of [-1,1]){
    box(this.arena,dark,s*10,2,-5,3.8,5,4);box(this.arena,steel,s*10,4.5,-5,4.1,.16,4.2);
    for(let y=0;y<7;y++){box(this.arena,steel,s*8.2,y*.75,-6,.15,.15,3.5);}
    for(const z of [-7,-3]){box(this.arena,steel,s*8.2,4,z,.16,8,.16);box(this.arena,steel,s*11.5,4,z,.16,8,.16);}
    box(this.arena,steel,s*9.8,7.8,-5,4,.16,5);
    const banner=textPlane(this.arena,s<0?'MAKE EVERY\nOPENING COUNT':'NO CROWNS.\nJUST COURAGE.',s*8,3.3,-3,2.2,3,'#d9e0be','#303e3d');banner.rotation.y=-s*.18;
    const pipe=mesh(new THREE.CylinderGeometry(.36,.36,6.4,12),steel,this.arena,s*11,3,-2);pipe.rotation.z=.07*s;
   }
  }else{
   const water=mat('#244c59',.7,.2);mesh(new THREE.CylinderGeometry(65,65,.1,64),water,this.arena,0,-1.0,0);
   for(let i=0;i<11;i++){const x=(i-5)*3.9;box(this.arena,dark,x,4.4,-12,1.5,10,1.8);box(this.arena,concrete,x,9.2,-12,2.1,.6,2.2);box(this.arena,light,x,3.7,-11.08,.10,6,.05);if(i<10)box(this.arena,concrete,x+1.9,8.4,-12,3.1,.85,1.6);}
   for(const s of [-1,1]){for(let i=0;i<3;i++){const z=-4-i*4;box(this.arena,dark,s*10,2,z,1.7,5,1.7);box(this.arena,light,s*10,4.6,z,2,.1,2);}
    const banner=textPlane(this.arena,'STILL WATER\nSTRONG WILL',s*9,2.8,-4,2,2.8,'#95ddd0','#253b43');banner.rotation.y=-s*.3;}
   sphere(this.arena,new THREE.MeshBasicMaterial({color:'#c0e6e2',fog:false}),18,21,-65,3.4,3.4,1);
   for(let i=0;i<35;i++){const x=Math.sin(i*34.6)*36,z=-18-(i%5)*10;box(this.arena,mat('#203b43'),x,0,z,3,3+(i%7)*2,4);}
  }
  for(const s of [-1,1]){
   const x=s*6.9,z=-4.5;box(this.arena,steel,x,3.1,z,.12,6.2,.12);box(this.arena,steel,x,6.1,z,1.3,.8,.18);
   for(let i=0;i<6;i++)box(this.arena,light,x+(i%3-1)*.36,5.94+Math.floor(i/3)*.33,z+.12,.25,.24,.09);
   const l=new THREE.PointLight(night?'#85e3ef':'#ffe8b8',15,13,2);l.position.set(x,5.8,z);this.arena.add(l);
  }
  this.mergeStatic();
 }
 mergeStatic(){
  this.arena.updateMatrixWorld(true);const buckets=new Map();const originals=[];this.arena.traverse(o=>{if(!o.isMesh)return;const m=o.material;const key=[m.type,m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.metalness,m.roughness,m.map?.uuid,m.side,m.fog].join('|');if(!buckets.has(key))buckets.set(key,{material:m,geometries:[]});const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);buckets.get(key).geometries.push(g);originals.push(o);});
  originals.forEach(o=>{o.removeFromParent();o.geometry.dispose();});
  for(const {material,geometries} of buckets.values()){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(merged)mesh(merged,material,this.arena);}
 }
 setFighters(a,b){this.yaw=0;this.models.forEach(m=>{this.scene.remove(m.root);m.dispose();});this.models=[new FighterModel(a),new FighterModel(b,1)];this.models.forEach(m=>this.scene.add(m.root));}
 burst(event){
  if(this.reduced)return;const block=event.type==='block';this.shake=block?.035:event.down?.17:.085;
  const color=block?'#b4e8f4':event.kind==='special'?'#dcf88a':'#ffcb73';const material=new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false});
  for(let i=0;i<(block?9:16);i++){const geo=new THREE.BoxGeometry(.025,.025,.17);const p=mesh(geo,material,this.scene,event.x,event.y,event.z);p.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);this.particles.push({mesh:p,velocity:new V((Math.random()-.5)*6,Math.random()*3,(Math.random()-.5)*6),life:.25+Math.random()*.2,max:.45});}
 }
 render(fighters,dt,time,mode='fight'){
  fighters.forEach((f,i)=>{if(this.models[i].id!==f.id)this.setFighters(fighters[0].id,fighters[1].id);this.models[i].animate(f,dt,time);});
  const a=fighters[0],b=fighters[1];const center=new V((a.x+b.x)/2,1.15,(a.z+b.z)/2);let desired;
  if(mode==='select'){const narrow=this.camera.aspect<.8;this.models[1].root.visible=false;this.models[0].root.position.set(narrow?.95:1.3,.06,0);this.models[0].root.rotation.y=-.35+Math.sin(time*.23)*.12;desired=new V(narrow?.15:.3,2.5,narrow?10.3:7.2);center.set(narrow?.15:.3,1.2,0);}
  else{
   this.models[1].root.visible=true;const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);const aspect=this.camera.aspect;const zoom=Math.max(9.5,dist*1.42+4,(dist+2.5)/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*aspect));
   // A limited, damped orbit keeps the pair readable when a sidestep aligns them in depth.
   const orbit=Math.abs(dx)<.75?Math.sign(this.yaw||-dz)*1.05:Math.max(-1.05,Math.min(1.05,Math.atan2(-dz*Math.sign(dx),Math.abs(dx))));
   this.yaw+=(orbit-this.yaw)*(1-Math.exp(-dt*2.8));desired=new V(center.x+Math.sin(this.yaw)*zoom,2.95+zoom*.018,center.z+Math.cos(this.yaw)*zoom);
  }
  const smooth=1-Math.exp(-dt*5);this.camera.position.lerp(desired,smooth);this.target.lerp(center,smooth);this.shake=Math.max(0,this.shake-dt*.65);
  this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;this.camera.lookAt(this.target);
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.velocity.y-=dt*8;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.scale.setScalar(Math.max(0,p.life/p.max));if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();this.particles.splice(i,1);if(!this.particles.some(v=>v.mesh.material===p.mesh.material))p.mesh.material.dispose();}}
  this.renderer.render(this.scene,this.camera);
 }
}
