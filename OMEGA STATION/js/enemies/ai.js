import {sfx} from '../audio/sfx.js';
import {rnd} from '../core/util.js';
import {BP,ET,mkE} from './types.js';
import {SP} from '../engine/sprites.js';
export function ai(game,e,dt){if(ET[e.t].deco)return true;const p=game.p,L=game.lv,M=ET[e.t],dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||.01;e.fl=Math.max(0,e.fl-dt);e.cd-=dt;const vis=d<16&&L.los(e.x,e.y,p.x,p.y);if(M.amb&&!e.al){if(d<4.5){e.al=true;sfx(300,.3,'sawtooth',.06,200)}return true}if(!e.al&&vis){e.al=true;sfx(250+e.t*30,.2,'sawtooth',.04)}if(!e.al){if(M.pat){e.an+=dt*2;e.wd=(e.wd||0)-dt;if(e.wd<=0){e.wd=1.5;e.wa=rnd()*6.28}L.move(e,Math.cos(e.wa)*M.sp*.3*dt,Math.sin(e.wa)*M.sp*.3*dt,.28)}return true}e.an+=dt*(M.sp>2?5:3);e.sl=Math.max(0,(e.sl||0)-dt);if(M.rg)e.hp=Math.min(M.hp,e.hp+5*dt);
  const nx=dx/d,ny=dy/d,sp=M.sp*dt*(L.spM||1)*(e.sl>0?.35:1)*(M.en&&e.hp<M.hp*.5?1.6:1),an=Math.atan2(dy,dx);
  const fire=(n,spd,dm,sr)=>{for(let k=0;k<n;k++){const a=an+(k-(n-1)/2)*sr;game.pr.push({x:e.x,y:e.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dm})}sfx(Math.max(120,420-e.t*8),.2,'square',.04,-250)};
  const ring=(n,spd,dm,o)=>{for(let k=0;k<n;k++){const a=k*6.283/n+o;game.pr.push({x:e.x,y:e.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dm})}sfx(120,.3,'sawtooth',.06,-60)};
  const spawn=(t)=>{if(L.en.length>=70)return;const a=rnd()*6.28,q=mkE(e.x+Math.cos(a)*1.6,e.y+Math.sin(a)*1.6,t);if(L.free(q.x,q.y,.3)){q.al=true;L.en.push(q)}};
  if(M.hl){e.th=(e.th||0)-dt;if(e.th<=0){e.th=.5;for(const q of L.en)if(q!==e&&q.al&&!ET[q.t].boss&&q.hp<ET[q.t].hp&&Math.hypot(q.x-e.x,q.y-e.y)<6){q.hp=Math.min(ET[q.t].hp,q.hp+8);game.fx.push({x:q.x,y:q.y,t:0,l:.2,s:.2});break}}}
  if(M.mine){e.tn=(e.tn||0)-dt;if(e.tn<=0&&vis&&L.en.length<70){e.tn=6;for(let tr=0;tr<8;tr++){const q=mkE(p.x+(rnd()-.5)*5,p.y+(rnd()-.5)*5,40);if(Math.hypot(q.x-p.x,q.y-p.y)>1.2&&L.free(q.x,q.y,.3)){L.en.push(q);break}}}}
  if(M.rtr&&e.hp<M.hp*.3){L.move(e,-nx*sp,-ny*sp,.28);return true}
  if(M.cir&&vis&&d<8)L.move(e,-ny*sp,nx*sp,.28);
  if(M.tp){e.tt=(e.tt||0)-dt;if(e.tt<=0){e.tt=3;const a=rnd()*6.28,tx=p.x+Math.cos(a)*3,ty=p.y+Math.sin(a)*3;if(L.free(tx,ty,.3)){game.fx.push({x:e.x,y:e.y,t:0,l:.3,s:.6});e.x=tx;e.y=ty;sfx(900,.15,'sine',.05,-600)}}}
  if(M.sm){e.ts=(e.ts||0)-dt;if(e.ts<=0&&vis){e.ts=5;spawn(M.smt||11);spawn(M.smt||11)}}
  if(M.kam&&d<.9){game.hurt(15);game.fx.push({x:e.x,y:e.y,t:0,l:.4,s:.8});L.en=L.en.filter(q=>q!==e);game.blood(e.x,e.y,8);sfx(100,.3,'sawtooth',.1,-60);return true}
  if(M.dash){e.td=(e.td||0)-dt;if(e.td<=0&&vis&&d<8&&d>2){e.td=3;e.dsh=.4}if(e.dsh>0){e.dsh-=dt;L.move(e,nx*8*dt,ny*8*dt,.3)}}
  if(e.dsh>0&&!M.dash){e.dsh-=dt;L.move(e,nx*9*dt,ny*9*dt,.4)}
  if(M.zz)L.move(e,-ny*Math.sin(e.an*3)*sp*.8,nx*Math.sin(e.an*3)*sp*.8,.25);
  if(M.snip){if(!vis)L.move(e,nx*sp,ny*sp,.28);else if(d<6)L.move(e,-nx*sp,-ny*sp,.28);if(vis&&e.cd<=0){fire(1,10,M.dm,0);e.cd=M.cd}return true}
  if(M.boss){const f=e.hp/M.hp,nP=BP[e.t]?BP[e.t].length:3,ph=Math.min(nP-1,((1-f)*nP)|0);if(ph!==e.ph){e.ph=ph;game.say(M.name+' — ФАЗА '+(ph+1));sfx(70,.6,'sawtooth',.1,-30)}
   e.bt=(e.bt||0)-dt;if(e.bt<=0){e.bt=.5-ph*.1;sfx(e.t===3?[55,65,82][ph]:70,.25,'sawtooth',.04)}
   const mv=sp*(1+ph*.3);if(!vis||d>(e.t===10?7:4))L.move(e,nx*mv,ny*mv,.4);else if(e.t===10&&d<5)L.move(e,-nx*mv,-ny*mv,.4);
   if(e.cd<=0&&vis){
    if(e.t===9){if(ph===0)fire(3,5,10,.2);else if(ph===1)fire(5,6,10,.25);else{fire(7,7,9,.4);ring(10,4,8,e.an)}e.cd=1.3-ph*.3}
    else if(e.t===10){if(ph===0)fire(1,7,12,0);else ring(8,4,9,e.an);if(ph>0)spawn(ph>1?7:4);e.cd=1.8-ph*.4}
    else if(BP[e.t]){const B=BP[e.t][ph],o=B.ops[(e.k=(e.k||0)+1)%B.ops.length],k=o[0];
     if(k==='f')fire(o[1],o[2],o[3],o[4]);else if(k==='r')ring(o[1],o[2],o[3],e.an);
     else if(k==='sw'){for(let q=0;q<o[1];q++){const a=e.an*2+q*6.283/o[1]+Math.sin(e.an)*.5;game.pr.push({x:e.x,y:e.y,vx:Math.cos(a)*o[2],vy:Math.sin(a)*o[2],dm:o[3]})}sfx(160,.3,'sawtooth',.06,-80)}
     else if(k==='s')spawn(o[1]);
     else if(k==='t'){const a=rnd()*6.28,tx=p.x+Math.cos(a)*4.5,ty=p.y+Math.sin(a)*4.5;if(L.free(tx,ty,.5)){game.fx.push({x:e.x,y:e.y,t:0,l:.4,s:1});e.x=tx;e.y=ty;sfx(900,.2,'sine',.06,-600)}}
     else if(k==='c'){e.dsh=.6}
     else if(k==='l'){game.pr.push({x:e.x,y:e.y,vx:nx*2.6,vy:ny*2.6,dm:o[1]*2});sfx(100,.4,'sawtooth',.08,-30)}
     else if(k==='m'){for(let q=0;q<2;q++){const m2=mkE(p.x+(rnd()-.5)*4,p.y+(rnd()-.5)*4,40);if(L.free(m2.x,m2.y,.3)&&L.en.length<70)L.en.push(m2)}}
     e.cd=B.cd}
    else{if(ph===0)fire(3,5.5,10,.18);else if(ph===1){ring(12,4.5,8,e.an)}else{fire(5,7,12,.2);spawn(rnd()<.5?4:7);if(rnd()<.3){const a=rnd()*6.28,tx=p.x+Math.cos(a)*4,ty=p.y+Math.sin(a)*4;if(L.free(tx,ty,.5)){e.x=tx;e.y=ty}}}e.cd=1.5-ph*.3}}
   e.tm-=dt;if(d<1.3&&e.tm<=0){game.hurt(15);e.tm=1}return true}
  if(M.m){if(d>.85)L.move(e,nx*sp,ny*sp,.28);else if(e.cd<=0){game.hurt(M.dm);e.cd=M.cd}}
  else{if(!vis||d>(e.t===8?3:4.5))L.move(e,nx*sp,ny*sp,.28);else if(e.t===6||e.t===8)L.move(e,-ny*sp*(Math.sin(e.an)>0?1:-1),nx*sp*(Math.sin(e.an)>0?1:-1),.28);
   if(vis&&d<12&&e.cd<=0){if(M.rng)ring(M.rng,M.pv||4.5,M.dm,e.an);else fire(M.burst||1,M.pv||(e.t===8?7:5.5),M.dm,.15);e.cd=M.cd}}
  return true}
export function kill(game,e){if(ET[e.t].deco){game.lv.en=game.lv.en.filter(q=>q!==e);game.boom(e.x,e.y);return}game.fx.push({x:e.x,y:e.y,t:0,l:.6,tx:SP['e'+e.t+'_0'],s0:ET[e.t].s||.9});if(ET[e.t].boss){game.say(ET[e.t].name+' УНИЧТОЖЕН!');sfx(60,1.2,'sawtooth',.12,400)}game.kl++;{const M=ET[e.t];if(M.spl){for(let k=0;k<2;k++){const q=mkE(e.x+(k?.35:-.35),e.y,M.spl);if(!game.lv.free(q.x,q.y,.3)){q.x=e.x;q.y=e.y}q.al=true;game.lv.en.push(q)}}if(M.exp){const pd=Math.hypot(game.p.x-e.x,game.p.y-e.y);if(pd<2)game.hurt(18*(1-pd/2));game.fx.push({x:e.x,y:e.y,t:0,l:.4,s:1.2});sfx(90,.4,'sawtooth',.1,-50)}if(rnd()<.14)game.lv.it.push({x:e.x,y:e.y,k:'ahsc'[rnd()*4|0]})}game.blood(e.x,e.y,12);game.p.sc+=ET[e.t].pt;game.kills++;game.fx.push({x:e.x,y:e.y,t:0,l:.5,s:e.t===3?2:1});game.lv.en=game.lv.en.filter(q=>q!==e);sfx(150,.4,'sawtooth',.08,-100)}