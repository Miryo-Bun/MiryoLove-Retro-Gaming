import {nearAlly,talk} from '../allies/allies.js';
import {MU} from '../audio/music.js';
import {sfx} from '../audio/sfx.js';
import {ET} from '../enemies/types.js';
import {nearTerm,readTerm} from '../story/terminals.js';
export function use(game){const al=nearAlly(game);if(al){talk(game,al);return}const tm=nearTerm(game);if(tm){readTerm(game,tm);return}const p=game.p,L=game.lv,rc=game.r.rc;rc.cast(L,p.x,p.y,Math.cos(p.a),Math.sin(p.a));const i=rc.i;if(i<0||rc.d>1.7)return;const g=L.g[i];
  if(g===3||g===6){L.g[i]=0;sfx(120,.3,'sawtooth',.07,-60);if(g===6){game.sf++;sfx(500,.2,'square',.06,300);sfx(800,.3,'sine',.06,300);p.sc+=500;game.say('СЕКРЕТ НАЙДЕН! +500')}}
  else if(g===4){if(p.kr){L.g[i]=0;sfx(120,.3,'sawtooth',.07,-60)}else game.say('Нужен КРАСНЫЙ ключ')}
  else if(g===5){if(p.kb){L.g[i]=0;sfx(120,.3,'sawtooth',.07,-60)}else game.say('Нужен СИНИЙ ключ')}}
export function hurt(game,n){const p=game.p;if(p.iv>0||game.gm>0)return;n*=[.6,1,1.5][game.df|0];n*=game.lv.dmM||1;if(p.ar>0){const a=Math.min(p.ar,n*.5);p.ar-=a;n-=a}p.hp-=n;game.dm=.3;game.shk=.3;sfx(90,.2,'sawtooth',.1,-40);if(p.hp<=0&&game.st==='play'){game.st='over';game.show('GAME OVER','Вы погибли на уровне '+(game.li+1)+'.\nОчки: '+p.sc,'ЗАНОВО',()=>game.start(game.li))}}
export function pw(game,dt){const p=game.p;p.qd-=dt;p.iv-=dt;p.zs-=dt;if(game.gm>0){game.gm-=dt;if(game.gm<=0){game.gm=0;game.say('GODMODE ЗАВЕРШЁН')}}MU.go(game.li/10|0,(game.lv.en.find(q=>ET[q.t].boss&&q.al)||{t:0}).t)}