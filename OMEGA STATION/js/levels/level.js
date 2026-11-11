import {R} from '../core/util.js';
import {ET,mkE} from '../enemies/types.js';
import {CEs,FLs} from '../engine/textures.js';
import {THEMES,floorSet,skySet,themeOf,wallSet} from '../episodes/episodes.js';
import {LV} from './campaign.js';
import {genLevel} from './generator.js';
export class Level{
 constructor(i){const d=getLevel(i);this.n=d.n;this.h=d.m.length;this.w=d.m[0].length;this.g=new Uint8Array(this.w*this.h);this.t=new Uint8Array(this.w*this.h);this.en=[];this.it=[];this.px=1.5;this.py=1.5;
  const T={'#':1,S:1,p:1,w:1,o:1,x:1,l:1,D:3,R:4,B:5,E:7},G={'#':1,S:6,p:1,w:1,o:1,x:1,l:1,D:3,R:4,B:5,E:7};
  for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){const c=d.m[y][x],j=y*this.w+x;
   if(T[c]){this.g[j]=G[c];this.t[j]=T[c]===1?('pwoxl'.includes(c)?32+'pwoxl'.indexOf(c):i>2?30+(((x>>3)+(y>>3)+i)&1):i==0?1:i==2?2:(((x>>2)+(y>>2))&1?1:2)):T[c]}
   else if(c==='P'){this.px=x+.5;this.py=y+.5}
   else if('123'.includes(c)){const s=ET[c];this.en.push({x:x+.5,y:y+.5,t:+c,hp:s.hp,cd:1,al:false,an:0,fl:0})}
   else if('ahrb'.includes(c))this.it.push({x:x+.5,y:y+.5,k:c})}
  for(const q of d.e||[])this.en.push(mkE(q[0]+.5,q[1]+.5,q[2]));for(const q of d.i||[])this.it.push({x:q[0]+.5,y:q[1]+.5,k:q[2],n:q[3]});this.dmM=d.dm||1;this.spM=d.sm||1;this.sn=new Uint8Array(this.w*this.h);this.tl=d.t||[];this.ev=(d.v||[]).map(q=>({x:q[0]+.5,y:q[1]+.5,k:q[2]}));this.al=(d.a||[]).map(q=>({x:q[0]+.5,y:q[1]+.5,id:q[2],hp:60}));this.tm=(d.tm||[]).map(q=>({x:q[0]+.5,y:q[1]+.5,i:q[2]}));this.tr=d.r||[];this.sec=d.m.join('').split('S').length-1;this.wt=wallSet(i);{const th=themeOf(i),fs=floorSet(th);this.fl=fs[0];this.ce=fs[1];this.th=th;this.open=!!d.open;this.sky=this.open?skySet(th):null;this.lt0=THEMES[th][7];this.fk=THEMES[th][8];this.lt=this.lt0;this.pp=(d.pp||[]).map(q=>({x:q[0]+.5,y:q[1]+.5,k:q[2]}))}}
 solid(x,y){const a=x|0,b=y|0;return a<0||b<0||a>=this.w||b>=this.h||this.g[b*this.w+a]!==0}
 free(x,y,r){return !this.solid(x-r,y-r)&&!this.solid(x+r,y-r)&&!this.solid(x-r,y+r)&&!this.solid(x+r,y+r)}
 move(o,dx,dy,r){if(this.free(o.x+dx,o.y,r))o.x+=dx;if(this.free(o.x,o.y+dy,r))o.y+=dy}
 los(x0,y0,x1,y1){const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy),n=Math.ceil(d/.2);for(let i=1;i<n;i++){if(this.solid(x0+dx*i/n,y0+dy*i/n))return false}return true}
}
const cache=[];
export function getLevel(i){return i<3&&i!==1?LV[i]:cache[i]||(cache[i]=genLevel(i))}
