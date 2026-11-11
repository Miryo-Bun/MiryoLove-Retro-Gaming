import {sfx} from '../audio/sfx.js';
import {CHARS} from '../characters/characters.js';
import {ET} from '../enemies/types.js';
export function updateAllies(game,dt){const L=game.lv;if(!L.al||!L.al.length)return;
 for(const a of L.al){a.cd=(a.cd||0)-dt;a.fl=Math.max(0,(a.fl||0)-dt);
  for(const q of game.pr)if(Math.hypot(q.x-a.x,q.y-a.y)<.4){a.hp-=q.dm;q.x=-9;q.y=-9;a.fl=.2}
  for(const e of L.en){const M=ET[e.t];if(M.m&&e.al&&Math.hypot(e.x-a.x,e.y-a.y)<.9)a.hp-=M.dm*dt*.8}
  if(CHARS[a.id].fights&&a.cd<=0){let best=null,bd=9;for(const e of L.en){if(ET[e.t].deco)continue;const d=Math.hypot(e.x-a.x,e.y-a.y);if(d<bd&&L.los(a.x,a.y,e.x,e.y)){best=e;bd=d}}if(best){a.cd=.9;game.hit(best,9,0);game.fx.push({x:(a.x+best.x)/2,y:(a.y+best.y)/2,t:0,l:.15,s:.2});sfx(700,.08,'square',.03,-300)}}}
 const dead=L.al.filter(a=>a.hp<=0);if(dead.length){L.al=L.al.filter(a=>a.hp>0);game.say('СОЮЗНИК ПОГИБ: '+CHARS[dead[0].id].name);sfx(120,.5,'sawtooth',.08,-60)}}
export function nearAlly(game){const p=game.p;let best=null,bd=1.8;for(const a of game.lv.al||[]){const dx=a.x-p.x,dy=a.y-p.y,d=Math.hypot(dx,dy);if(d<bd&&(dx*Math.cos(p.a)+dy*Math.sin(p.a))/(d||1)>.2){best=a;bd=d}}return best}
export function talk(game,a){const c=CHARS[a.id],n=a.li||0;if(!a.used){a.used=1;if(!game.met.includes(a.id))game.met.push(a.id);c.act(game,a);game.p.sc+=50}
 game.dlg={name:c.name+' · '+c.role,col:c.color,text:c.lines[n===0?0:1+((n-1)%(c.lines.length-1))],t:7};a.li=n+1;sfx(600,.1,'triangle',.05,200)}
