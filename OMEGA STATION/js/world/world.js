import {EPF,ET,POOL2,mkE} from '../enemies/types.js';
import {updateAllies} from '../allies/allies.js';
import {sfx} from '../audio/sfx.js';
import {rnd} from '../core/util.js';
import {SP} from '../engine/sprites.js';
export function env(game,dt){const p=game.p,L=game.lv;updateAllies(game,dt);{const px=p.x|0,py=p.y|0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=px+dx,y=py+dy;if(x>=0&&y>=0&&x<L.w&&y<L.h&&dx*dx+dy*dy<=16)L.sn[y*L.w+x]=1}}events(game,dt);nav(game,dt);if(game.dlg)game.dlg.t-=dt;let on=false;for(const t of L.tl)if(Math.hypot(t[0]+.5-p.x,t[1]+.5-p.y)<.45){on=true;if(!game.tp0){p.x=t[2]+.5;p.y=t[3]+.5;game.fx.push({x:p.x,y:p.y,t:0,l:.4,s:1});sfx(1000,.3,'sine',.07,-800);sfx(300,.4,'sine',.05,600);game.tp0=true;return}}game.tp0=on;
  game.ph=(game.ph||0)+dt;if(Math.sin(game.ph*2.5)>.2)for(const t of L.tr)if(Math.hypot(t[0]+.5-p.x,t[1]+.5-p.y)<.55&&(game.tt2=(game.tt2||0)-dt)<=0){game.tt2=.6;game.hurt(8);sfx(200,.1,'square',.06)}
  if(rnd()<dt*4*(game.fxF??1)&&game.pa.length<90){const a=rnd()*6.28,d=1+rnd()*5;game.pa.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,vx:0,vy:0,z:.2,vz:.3,t:0,sp:(game.li/10|0)>=3?SP.em:SP.sm,sz:.2})}}
export function blood(game,x,y,n){for(let k=0;k<n&&game.pa.length<90;k++)game.pa.push({x,y,vx:(rnd()-.5)*2,vy:(rnd()-.5)*2,z:.4+rnd()*.3,vz:rnd()*2,t:0})}
const EVS={amb:'ЗАСАДА!',alm:'ТРЕВОГА: ПОДКРЕПЛЕНИЕ ЧЕРЕЗ 6 С',blk:'АВАРИЙНОЕ ОСВЕЩЕНИЕ',pwr:'ЭНЕРГОУСТАНОВКА: БРОНЯ +60, ЯЧЕЙКИ +40',rsv:'РЕЗЕРВНОЕ ПИТАНИЕ: СВЕТ ВКЛЮЧЁН, ТАЙНИК ОТКРЫТ'};
function spawnAround(game,n,types,rmin,rmax){const p=game.p,L=game.lv;let k=0;for(let t=0;t<60&&k<n&&L.en.length<70;t++){const a=rnd()*6.28,d=rmin+rnd()*(rmax-rmin),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;if(L.free(x,y,.3)){const q=mkE(x,y,types[k%types.length]);q.al=true;L.en.push(q);game.fx.push({x,y,t:0,l:.4,s:.8});k++}}}
function events(game,dt){const L=game.lv,p=game.p,ep=game.li/10|0;
 for(const v of L.ev||[]){if(v.done||Math.hypot(v.x-p.x,v.y-p.y)>2.8)continue;v.done=1;game.say(EVS[v.k]);p.sc+=100;
  if(v.k==='amb'){spawnAround(game,2+(game.li/15|0),EPF[ep],3,5);sfx(200,.5,'sawtooth',.1,-100)}
  else if(v.k==='alm'){game.alarm=14;game.wave=6;sfx(500,.8,'square',.07,300)}
  else if(v.k==='rsv'){game.dark=0;game.alarm=0;let b=-1,bd=1e9;for(let q=0;q<L.g.length;q++)if(L.g[q]===6){const d=Math.hypot(q%L.w+.5-p.x,(q/L.w|0)+.5-p.y);if(d<bd){bd=d;b=q}}if(b>=0)L.g[b]=0;for(let k=0;k<4;k++)L.it.push({x:p.x+(rnd()-.5)*2,y:p.y+(rnd()-.5)*2,k:'asck'[k]});sfx(500,.4,'sine',.07,300)}
  else if(v.k==='blk'){game.dark=12;sfx(80,.8,'sawtooth',.1,-30)}
  else{p.ar=Math.min(100,p.ar+60);p.am[2]+=40;sfx(700,.3,'sine',.08,500)}}
 if(game.alarm>0){game.alarm-=dt;if(game.wave>0){game.wave-=dt;if(game.wave<=0)spawnAround(game,3+(ep/3|0),POOL2.slice(0,8+ep*2),5,9)}}
 if(game.dark>0){game.dark-=dt;L.lt=game.calm?.45:.3+.25*Math.abs(Math.sin(performance.now()/300))}else L.lt=(L.lt0||1)*(L.fk&&!game.calm?.92+.08*Math.sin(performance.now()/500)*Math.sin(performance.now()/230):1)}

const D4=[[1,0],[-1,0],[0,1],[0,-1]];
function navField(L,p,all){const w=L.w,h=L.h,d=new Int16Array(w*h).fill(-1),q=[],pass=g=>g!==1&&g!==6&&g!==7&&(g===0||g===3||all||(g===4&&p.kr)||(g===5&&p.kb));
 for(let i=0;i<w*h;i++)if(L.g[i]===7){const x=i%w,y=i/w|0;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w&&ny<h){const j=ny*w+nx;if(d[j]<0&&pass(L.g[j])){d[j]=0;q.push(j)}}}}
 for(let k=0;k<q.length;k++){const c=q[k],x=c%w,y=c/w|0;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const j=ny*w+nx;if(d[j]>=0||!pass(L.g[j]))continue;d[j]=d[c]+1;q.push(j)}}return d}
function stepDown(L,f,c){const x=c%L.w,y=c/L.w|0;let b=c;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=L.w||ny>=L.h)continue;const j=ny*L.w+nx;if(f[j]>=0&&(f[b]<0||f[j]<f[b]))b=j}return b}
export function nav(game,dt){const L=game.lv,p=game.p,N=game.nav||(game.nav={as:0,ta:0,show:false,msg:'',d:0,boss:false}),mode=game.navMode??1;N.show=mode===2||(mode===1&&!L.open);if(!N.show)return;
 game.nt=(game.nt||0)-dt;if(game.nt<=0){game.nt=.35;const ci=(p.y|0)*L.w+(p.x|0),f=navField(L,p,false),dd=f[ci];N.msg='';N.boss=L.en.some(q=>ET[q.t].boss);
  if(dd<0){const f2=navField(L,p,true);N.d=-1;if(f2[ci]>=0){let c=ci,door=0;for(let s=0;s<600&&f2[c]>0;s++){const b=stepDown(L,f2,c);if(b===c)break;c=b;const g=L.g[c];if(g===4&&!p.kr){door=4;break}if(g===5&&!p.kb){door=5;break}}N.msg=door===4?'Маршрут закрыт: нужен красный ключ':door===5?'Маршрут закрыт: нужен синий ключ':'Маршрут закрыт'}else N.msg='Маршрута к выходу нет'}
  else{N.d=dd+1;let c=ci;for(let s=0;s<2&&f[c]>0;s++){const b=stepDown(L,f,c);if(b===c)break;c=b}let tx=c%L.w+.5,ty=(c/L.w|0)+.5;if(f[c]===0){for(const[dx,dy]of D4){const x=(c%L.w)+dx,y=(c/L.w|0)+dy;if(L.g[y*L.w+x]===7){tx=x+.5;ty=y+.5}}}N.ta=Math.atan2(ty-p.y,tx-p.x)}}
 const rel=N.ta-p.a,dl=Math.atan2(Math.sin(rel-N.as),Math.cos(rel-N.as));N.as+=dl*Math.min(1,dt*8)}
