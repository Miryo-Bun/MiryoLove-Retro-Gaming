import {levelSelect,settingsPanel} from '../ui/menu.js';
import {MU} from '../audio/music.js';
import {setVol,sfx} from '../audio/sfx.js';
import {Input} from './input.js';
import {H,W} from './util.js';
import {ai,kill} from '../enemies/ai.js';
import {ET} from '../enemies/types.js';
import {Renderer} from '../engine/renderer.js';
import {EP,epPage} from '../episodes/episodes.js';
import {Level} from '../levels/level.js';
import {hurt,pw,use} from '../player/player.js';
import {applyCfg,gs,ld,sv,unlocked} from '../save/save.js';
import {FINAL,INTRO} from '../story/story.js';
import {HUD} from '../ui/hud.js';
import {UNL,alt,boom,fireW,hit,rkt} from '../weapons/weapons.js';
import {pick} from '../world/items.js';
import {blood,env} from '../world/world.js';
export class Game{
 constructor(opts={}){this.epi=opts.ep||0;this.cv=document.getElementById('c');this.cv.width=W;this.cv.height=H;this.r=new Renderer(this.cv);this.hud=new HUD();this.in=new Input(c=>this.onKey(c));this.st='menu';this.lv=null;this.last=0;this.df=1;this.sens=5;this.ld();
  this.ov=document.getElementById('ov');this.ot=document.getElementById('ot');this.op=document.getElementById('op');this.ob=document.getElementById('ob');this.ox=document.getElementById('ox');
  this.cv.addEventListener('click',()=>{if(this.st==='play')this.lock()});
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&this.st==='play')this.pause()});
  addEventListener('resize',()=>{});

  requestAnimationFrame(t=>this.loop(t));if(typeof location!=='undefined'&&opts.boot!==false)this.boot()}
 show(t,p,b,fn){this.ot.textContent=t;this.op.textContent=p;this.ob.textContent=b;this.ox.innerHTML='';MU.stop();if(this.st==='win')MU.go(-2,0);if(this.st==='menu')MU.go(-1,0);this.ob.onclick=fn;this.ov.classList.remove('hide');try{document.exitPointerLock()}catch(e){}}
 hide(){this.ov.classList.add('hide')}
 lock(){try{const q=this.cv.requestPointerLock();q&&q.catch&&q.catch(()=>{})}catch(e){}}
 start(n=0,sd){if(!unlocked(this.done,n)){this.selectLevel();return}this.gm=0;this.p={x:0,y:0,a:0,hp:100,ar:0,am:[50,0,0,0],w:0,hv:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],dmg:1,sc:0,kr:false,kb:false};this.li=0;this.kills=0;if(sd&&sd.p){this.p=sd.p;this.kills=sd.k}else if(n>0){for(const w in UNL)if(UNL[w]<=n)this.p.hv[w]=1;this.p.am=[100,24,100,12]}this.load(sd?sd.li:n);this.hide();this.lock();if(this.li%10===0)this.intro(this.li);sfx(200,.3,'sawtooth',.08,200)}
 load(i){this.li=i;this.lv=new Level(i);this.sf=0;this.sn=this.lv.sec;const p=this.p;p.x=this.lv.px;p.y=this.lv.py;p.a=0;p.kr=p.kb=false;this.pr=[];this.pa=[];this.rk=[];this.dlg=null;this.alarm=0;this.dark=0;this.wave=0;this.fx=[];this.bob=0;this.fire=0;this.cd=0;this.dm=0;this.pk=0;this.msg='';this.msgT=0;this.hint='';this.st='play';this.say(EP[i/10|0]+' · УР. '+(i+1));this.kl=0;this.kt=this.lv.en.filter(q=>!ET[q.t].deco).length;this.ic=0;this.itot=this.lv.it.length;this.tm=0;this.sv()}
 say(s){this.msg=s;this.msgT=2.5}
 pause(){if(this.st!=='play')return;MU.stop();this.st='pause';this.show('ПАУЗА','Игра приостановлена.','ПРОДОЛЖИТЬ',()=>this.resume());this.pauseMenu()}
 resume(){if(this.st!=='pause')return;this.st='play';this.hide();this.lock()}
 onKey(c){if(this.st==='play'&&/^Key[A-Z]$/.test(c)){this.cb=((this.cb||'')+c[3]).slice(-8);if(this.cb.endsWith('HEALTH')){this.p.hp=100;this.say('ЧИТ: HEALTH');this.cb=''}else if(this.cb.endsWith('GODMODE')){this.gm=300;this.say('ЧИТ: GODMODE 5:00');this.cb=''}}if(c==='Tab'&&this.st==='play')this.map=!this.map;if(this.st==='play'&&c==='KeyQ')this.cycleW(-1);if(this.st==='play'&&c==='KeyR')this.cycleW(1);if(c==='Escape'){if(this.st==='play')this.pause();else if(this.st==='pause')this.resume()}else if((c==='KeyE'||c==='Space')&&this.st==='play')this.use();else if(/^Digit[0-9]$/.test(c)&&this.st==='play'){const n=c==='Digit0'?9:+c[5]-1;if(this.p.hv[n]){this.p.w=n;sfx(300,.08,'square',.04)}else this.say('ОРУЖИЕ НЕ НАЙДЕНО')}}
 shoot(){this.fireW()}
 fin(){if(this.first){this.TK+=this.kl;this.TS+=this.sf;this.TT+=this.tm}MU.stop();[[392,0],[494,.25],[587,.5],[784,.75],[988,1]].forEach(([f,d])=>setTimeout(()=>sfx(f,.5,'triangle',.08),d*600));try{localStorage.removeItem('omega_save_v4')}catch(e){}}
 update(dt){const p=this.p,L=this.lv,I=this.in;
  {const al=this.smo>0?Math.min(1,dt*(36-3.2*this.smo)):1;this.ms=(this.ms||0)+(I.mx*.0004*this.sens-(this.ms||0))*al;I.mx=0;p.a+=this.ms}if(I.d('ArrowLeft'))p.a-=1.8*dt;if(I.d('ArrowRight'))p.a+=1.8*dt;if(I.wh){this.cycleW(I.wh);I.wh=0}
  const f=(I.d('KeyW')||I.d('ArrowUp')?1:0)-(I.d('KeyS')||I.d('ArrowDown')?1:0),s=(I.d('KeyD')?1:0)-(I.d('KeyA')?1:0);
  {const n=f&&s?.707:1,sp0=(I.d('ShiftLeft')||I.d('ShiftRight')?3.4:2.1)*(this.spd||1)*(p.zs>0?1.4:1)*n,ca=Math.cos(p.a),sa=Math.sin(p.a),k=1-Math.exp(-dt*(f||s?11:16));p.vx=(p.vx||0)+((ca*f-sa*s)*sp0-(p.vx||0))*k;p.vy=(p.vy||0)+((sa*f+ca*s)*sp0-(p.vy||0))*k;const vm=Math.hypot(p.vx,p.vy);if(vm>.02){L.move(p,p.vx*dt,p.vy*dt,.25);this.bob+=vm*dt*3.2}}
  this.shk=Math.max(0,(this.shk||0)-dt);p.sh=this.shk>0?Math.sin(performance.now()/23)*.035*(this.shkAmp||0)*this.shk*4:0;
  this.cd-=dt;this.fire-=dt;this.dm-=dt;this.pk-=dt;this.msgT-=dt;if(I.md)this.shoot();if(I.md2)this.alt();
  for(const i of L.it.slice()){if(Math.hypot(i.x-p.x,i.y-p.y)<.5){let ok=true;if(true){if(this.pick(i)){this.ic++;L.it=L.it.filter(q=>q!==i);p.sc+=50;this.pk=.15;sfx(600,.15,'square',.05,400)}continue}
   if(i.k==='a'){if(p.am>=200)ok=false;else{p.am=Math.min(200,p.am+15);this.say('ЭНЕРГИЯ +15')}}
   else if(i.k==='h'){if(p.hp>=100)ok=false;else{p.hp=Math.min(100,p.hp+25);this.say('ЗДОРОВЬЕ +25')}}
   else if(i.k==='r'){p.kr=true;this.say('КРАСНЫЙ КЛЮЧ!')}else{p.kb=true;this.say('СИНИЙ КЛЮЧ!')}
   if(ok){L.it=L.it.filter(q=>q!==i);p.sc+=50;this.pk=.15;sfx(600,.15,'square',.05,400)}}}
  for(const e of L.en.slice()){if(this.ai(e,dt))continue;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||.01;e.fl=Math.max(0,e.fl-dt);e.cd-=dt;const vis=d<14&&L.los(e.x,e.y,p.x,p.y);if(!e.al&&vis)e.al=true;if(!e.al)continue;e.an+=dt*3;const sp=ET[e.t].sp*dt,nx=dx/d,ny=dy/d;
   if(e.t===1){if(d>.85)L.move(e,nx*sp,ny*sp,.3);else if(e.cd<=0){this.hurt(10);e.cd=.9}}
   else{if(!vis||d>4)L.move(e,nx*sp,ny*sp,.3);if(vis&&d<11&&e.cd<=0){const n=e.t===3?3:1,an=Math.atan2(dy,dx);for(let k=0;k<n;k++){const a=an+(k-(n-1)/2)*.22;this.pr.push({x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,dm:e.t===3?12:8})}e.cd=e.t===3?1.1:1.8;sfx(400,.2,'square',.04,-250)}}}
  this.pr=this.pr.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;if(L.solid(q.x,q.y)){this.fx.push({x:q.x-q.vx*.05,y:q.y-q.vy*.05,t:0,l:.25,s:.3});return false}if(Math.hypot(q.x-p.x,q.y-p.y)<.4){this.hurt(q.dm);return false}return true});
  this.rkt(dt);this.fx=this.fx.filter(q=>(q.t+=dt)<q.l);
  const rc=this.r.rc;rc.cast(L,p.x,p.y,Math.cos(p.a),Math.sin(p.a));const g=rc.i>=0?L.g[rc.i]:0;this.hint=rc.d<1.7&&(g===3||g===4||g===5||g===6)?'E — открыть':'';
  for(let y=(p.y|0)-1;y<=(p.y|0)+1;y++)for(let x=(p.x|0)-1;x<=(p.x|0)+1;x++){if(x>=0&&y>=0&&x<L.w&&y<L.h&&L.g[y*L.w+x]===7&&Math.hypot(x+.5-p.x,y+.5-p.y)<.95){if(L.en.some(q=>ET[q.t].boss)){this.say('СНАЧАЛА УНИЧТОЖЬТЕ БОССА!')}else{this.finish();return}}}}
 finish(){const p=this.p;p.sc+=1000;this.first=!this.done.includes(this.li);if(this.first)this.done.push(this.li);this.sv();sfx(500,.5,'square',.07,500);if(this.li>=99){this.st='win';this.fin();this.show('ПОБЕДА! OMEGA OVERLORD УНИЧТОЖЕН',FINAL+'\n'+p.sc+'\nПоверженных врагов: '+this.kills+'\nВсего врагов: '+this.TK+'  Секретов: '+this.TS+'\nВремя кампании: '+(this.TT/60|0)+' мин '+(this.TT%60|0)+' с','ГЛАВНОЕ МЕНЮ',()=>{location.href='../index.html'})}
  else{if(this.first){this.TK+=this.kl;this.TS+=this.sf;this.TT+=this.tm}this.st='inter';this.show('УРОВЕНЬ ПРОЙДЕН','Враги: '+Math.min(this.kl,this.kt)+'/'+this.kt+'  Секреты: '+this.sf+'/'+this.sn+'  Предметы: '+this.ic+'/'+this.itot+'\nВремя: '+(this.tm|0)+' с\nОчки: '+p.sc+' (+1000 за выход)\nЗдоровье: '+(p.hp|0)+'%  Энергия: '+p.am,'ДАЛЕЕ',()=>this.next())}}
 loop(t){try{const dt=Math.min(.05,(t-this.last)/1000||0);this.last=t;if(this.st==='play')this.update(dt);if(this.lv&&this.st!=='err'){this.r.draw(this);this.hud.draw(this.r.ctx,this)}requestAnimationFrame(q=>this.loop(q))}
  catch(e){console.error(e);this.st='err';this.show('ОШИБКА',String(e&&e.message||e),'ПЕРЕЗАГРУЗКА',()=>location.reload())}}
 intro(i){this.st='inter';this.show(EP[i/10|0],INTRO[i/10|0],'ВПЕРЁД',()=>{this.st='play';this.hide();this.lock()})}
 use(...a){return use(this,...a)}
 hurt(...a){return hurt(this,...a)}
 pw(...a){return pw(this,...a)}
 hit(...a){return hit(this,...a)}
 fireW(...a){return fireW(this,...a)}
 boom(...a){return boom(this,...a)}
 rkt(...a){return rkt(this,...a)}
 pick(...a){return pick(this,...a)}
 env(...a){return env(this,...a)}
 blood(...a){return blood(this,...a)}
 ai(...a){return ai(this,...a)}
 kill(...a){return kill(this,...a)}
 sv(...a){return sv(this,...a)}
 ld(...a){return ld(this,...a)}
 gs(...a){return gs(this,...a)}
 alt(...a){return alt(this,...a)}
 setVol(m,s){this.vm=m;this.vs=s;setVol(m,s);this.sv()}
 selectLevel(){levelSelect(this)}
 next(){const n=this.li+1;if(n%10===0&&typeof location!=='undefined'){location.href=epPage(n/10)+'#level='+(n+1)}else{this.load(n);this.hide();this.lock();if(n%10===0)this.intro(n)}}
 boot(){const h=location.hash,m=h.match(/level=(\d+)/),n=m?+m[1]-1:-1,pg=e=>epPage(e)+h;
  if(h==='#continue'){const s=this.gs();if(s){if((s.li/10|0)!==this.epi){location.replace(epPage(s.li/10|0)+h);return}this.start(0,s);return}}
  if(n>=0&&n<100){if((n/10|0)!==this.epi){location.replace(pg(n/10|0));return}if(unlocked(this.done,n)){this.start(n);return}}
  this.selectLevel()}
 cycleW(d){const p=this.p,n=p.hv.length;for(let k=1;k<=n;k++){const j=((p.w+(d<0?-k:k))%n+n)%n;if(p.hv[j]){p.w=j;sfx(300,.08,'square',.04);return}}}
 pauseMenu(){this.ox.innerHTML='<div class="col"><button id="pSet">НАСТРОЙКИ</button><button id="pSel">ВЫБОР УРОВНЯ</button><a class="btn" href="../index.html">ГЛАВНОЕ МЕНЮ</a></div>';const $=id=>document.getElementById(id);$('pSet').onclick=()=>settingsPanel(this.ox,()=>this.pauseMenu(),this);$('pSel').onclick=()=>{MU.stop();this.selectLevel()}}
 applyCfg(...a){return applyCfg(this,...a)}
}
