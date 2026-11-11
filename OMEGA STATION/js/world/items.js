import {WP} from '../weapons/weapons.js';
export function pick(game,i){const p=game.p,k=i.k,A=(n,m,v,s)=>{if(p.am[n]>=m)return false;p.am[n]=Math.min(m,p.am[n]+v);game.say(s);return true};
  if(k==='a')return A(0,200,15,'ПУЛИ +15');if(k==='s')return A(1,50,8,'ДРОБЬ +8');if(k==='c')return A(2,300,40,'БАТАРЕЯ +40');if(k==='k')return A(3,30,5,'РАКЕТЫ +5');
  if(k==='h'){if(p.hp>=100)return false;p.hp=Math.min(100,p.hp+25);game.say('АПТЕЧКА +25');return true}
  if(k==='A'){if(p.ar>=100)return false;p.ar=Math.min(100,p.ar+50);game.say('БРОНЯ +50');return true}
  if(k==='H'){if(p.hp>=100)return false;p.hp=Math.min(100,p.hp+50);game.say('БОЛЬШАЯ АПТЕЧКА +50');return true}
  if(k==='Q'){p.qd=15;game.say('ДВОЙНОЙ УРОН!');return true}if(k==='V'){p.iv=10;game.say('НЕУЯЗВИМОСТЬ!');return true}if(k==='Z'){p.zs=12;game.say('УСКОРЕНИЕ!');return true}
  if(k==='u'){p.dmg+=.15;game.say('УЛУЧШЕНИЕ: УРОН ОРУЖИЯ +15%');return true}
  if(k==='w'){p.hv[i.n]=1;p.w=i.n;p.am[WP[i.n].t]+=[0,8,8,40,20,5,40,30,30,120,60,12,6,80][i.n];game.say('НОВОЕ ОРУЖИЕ: '+WP[i.n].n);return true}
  if(k==='r')p.kr=true;else p.kb=true;game.say(k==='r'?'КРАСНЫЙ КЛЮЧ!':'СИНИЙ КЛЮЧ!');return true}