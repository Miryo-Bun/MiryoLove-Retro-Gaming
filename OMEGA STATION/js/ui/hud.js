import {nearAlly} from '../allies/allies.js';
import {CHARS} from '../characters/characters.js';
import {H,R,W} from '../core/util.js';
import {ET} from '../enemies/types.js';
import {nearTerm} from '../story/terminals.js';
import {AMN,WP} from '../weapons/weapons.js';
export const PAL={r:'#e22',w:'#fff',g:'#999',y:'#fd2',b:'#37f',c:'#4ff',o:'#f80',n:'#a62',G:'#2c2',d:'#444'};
export const IC={h:['.rr.rr..','rrrrrrr.','rrrrrrr.','.rrrrr..','..rrr...','...r....'],r:['bbbbbbb.','bwwbbbb.','bwbbbbb.','bbbbbbb.','.bbbbb..','..bbb...','...b....'],a:['..y.....','.yyy....','.yyy....','.nnn....','.nnn....','.ddd....'],k:['.yyy....','y..y....','y..y....','.yyy....','..y.....','..yy....','..y.....','..yy....'],s:['...y....','...y....','yyyyyyy.','.yyyyy..','..yyy...','.yy.yy..','yy...yy.'],u:['...G....','..GGG...','.GGGGG..','...G....','...G....','...G....'],w0:['........','.ggggg..','.ggggg..','.dd.....','.dd.....','.d......'],w1:['gggggggg','nnngd...','.nn.....'],w2:['gggggggg','gggggggg','nnngd...','.nn.....'],w3:['.ccg....','cddggggg','.dd..cc.','.dd.....'],w4:['..oooo..','.oddddo.','oddggddo','.oddddo.','..oooo..'],w5:['.....r..','..ggrrr.','gggggrr.','..ggrrr.','.....r..'],w6:['.GGGGG..','GwwGGGG.','GwwGGGGG','.GGGGG..','..dd....'],w7:['.cc.cc..','cwwcwwc.','.cc.cc..','..dddd..','..d..d..'],w8:['..ccc...','.cwwwc..','.cwwwc..','..ddd...','...d....'],w9:['gggggg..','gggggggg','gggggg..','.dd.....','.dd.....'],w10:['.ggggg..','gddgggg.','.dd..gg.','.dd.....'],w11:['.......w','wwwwwwww','.cc.cc..','.dd.....'],w12:['..gggg..','.gddddg.','.gddddg.','..gggg..','..nn....'],w13:['b.b.b...','bbbbbbbb','b.b.b...','.dd.....']};
export class HUD{
 navigation(c,g,T){const n=g.nav;if(!n||!n.show)return;const cx=W-36,cy=H-54,r=14;R(c,'rgba(0,0,0,.6)',cx-r-3,cy-r-3,2*r+6,2*r+16);
  if(n.msg){T(n.msg,W-6-n.msg.length*4.6,H-80,'#fa6');return}
  const a=n.as||0,pt=(k,m)=>[cx+Math.sin(a+k)*r*m,cy-Math.cos(a+k)*r*m];c.beginPath();let q=pt(0,1);c.moveTo(q[0],q[1]);q=pt(2.5,.75);c.lineTo(q[0],q[1]);q=pt(Math.PI,.25);c.lineTo(q[0],q[1]);q=pt(-2.5,.75);c.lineTo(q[0],q[1]);c.closePath();c.fillStyle='#4f8';c.fill();c.strokeStyle='#021';c.stroke();
  T(n.d+' м',cx-10,cy+r+2,'#8f8');if(n.boss)T('БОСС',cx-10,cy-r-12,'#f66')}
 automap(c,g){const L=g.lv;if(!g.map||!L.sn)return;const s=L.w>40?2:3,ox=W-L.w*s-4,oy=4;R(c,'rgba(0,0,0,.55)',ox-2,oy-2,L.w*s+4,L.h*s+4);for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++){if(!L.sn[y*L.w+x])continue;const v=L.g[y*L.w+x];R(c,v===0?'#336':v===3?'#fa0':v===4?'#e22':v===5?'#37f':v===7?'#4f8':'#777',ox+x*s,oy+y*s,s,s)}R(c,'#fff',ox+((g.p.x*s)|0)-1,oy+((g.p.y*s)|0)-1,3,3);R(c,'#ff0',ox+(((g.p.x+Math.cos(g.p.a)*1.5)*s)|0),oy+(((g.p.y+Math.sin(g.p.a)*1.5)*s)|0),2,2)}
 dialog(c,g,T){const d=g.dlg;if(d&&d.t>0){R(c,'rgba(0,0,20,.85)',10,H-84,W-20,52);R(c,d.col,10,H-84,W-20,2);R(c,d.col,10,H-84,4,52);T(d.name,18,H-80,d.col);(d.text.match(/.{1,48}(\s|$)/g)||[d.text]).slice(0,3).forEach((s,i)=>T(s.trim(),18,H-68+i*11,'#fff'));T('[E] далее',W-62,H-42,'#888')}
  else{const a=nearAlly(g);if(a)T('[E] '+CHARS[a.id].name+' ('+CHARS[a.id].role+')',W/2-70,H-42,'#4f4');else if(nearTerm(g))T('[E] ТЕРМИНАЛ',W/2-30,H-42,'#4f8')}}
 ico(c,p,x,y,m){for(let j=0;j<p.length;j++)for(let i=0;i<p[j].length;i++){let ch=p[j][i];if(ch==='.')continue;if(m&&m[ch])ch=m[ch];R(c,PAL[ch]||'#fff',x+i,y+j,1,1)}}
 lr(k,v){this[k]=this[k]===undefined?v:this[k]+(v-this[k])*.15;if(Math.abs(this[k]-v)<.5)this[k]=v;return this[k]}
 gun(c,g,gx,gy){const w=g.p.w,f=g.fire>0,o=f?3:0;
  if(w===0){R(c,'#333',gx-5,gy-14+o,10,26);R(c,'#888',gx-4,gy-24+o,8,12)}
  else if(w===1){R(c,'#a62',gx-8,gy-4,16,16);R(c,'#555',gx-4,gy-36+o,8,34);R(c,'#321',gx-7,gy-20+(f?-5:0),14,6)}
  else if(w===2){R(c,'#a62',gx-10,gy-4,20,16);R(c,'#666',gx-8,gy-34+o,6,32);R(c,'#666',gx+2,gy-34+o,6,32);R(c,'#222',gx-8,gy-36+o,6,3);R(c,'#222',gx+2,gy-36+o,6,3)}
  else if(w===3){R(c,'#246',gx-9,gy-30,18,40);R(c,'#4ff',gx-11,gy-22,22,3);R(c,'#4ff',gx-11,gy-12,22,3);R(c,f?'#fff':'#0aa',gx-3,gy-36,6,8)}
  else if(w===4){R(c,'#556',gx-13,gy-26+o,26,36);R(c,'#889',gx-9,gy-34+o,18,10);R(c,'#f80',gx-13,gy-14,26,3);R(c,'#222',gx-4,gy-38+o,8,6)}
  else if(w===5){R(c,'#464',gx-11,gy-30+o,22,40);R(c,'#232',gx-7,gy-34+o,14,6);R(c,f?'#fa0':'#f50',gx-3,gy-38,6,6);R(c,'#aa4',gx-11,gy-8,22,3)}
  else if(w===6){R(c,'#173',gx-15,gy-30+o,30,44);R(c,'#4a6',gx-11,gy-34+o,22,8);R(c,f?'#fff':'#8f8',gx-6,gy-24,12,12);R(c,'#052',gx-15,gy-4,30,4)}
  else if(w===7){R(c,'#335',gx-8,gy-30,16,36);R(c,'#8cf',gx-10,gy-34,3,18);R(c,'#8cf',gx+7,gy-34,3,18);R(c,f?'#fff':'#46a',gx-3,gy-38,6,6)}
  else if(w===8){R(c,'#9de',gx-9,gy-28+o,18,34);R(c,'#fff',gx-6,gy-32+o,12,6);R(c,'#4af',gx-4,gy-12,8,10);R(c,'#235',gx-9,gy-4,18,4)}
  else if(w===9){for(let k=0;k<3;k++)R(c,'#777',gx-9+k*6,gy-34+o+(f?(k&1)*2:0),4,32);R(c,'#333',gx-12,gy-6,24,14);R(c,'#fa0',gx+10,gy-14,5,8)}
  else if(w===10){R(c,'#445',gx-6,gy-30+o,12,38);R(c,'#778',gx-4,gy-34+o,8,6);R(c,'#a62',gx-4,gy-2,8,12);R(c,'#222',gx-2,gy-38+o,4,6)}
  else if(w===11){R(c,'#ccd',gx-3,gy-40+o,6,46);R(c,'#7ac',gx-8,gy-26,16,4);R(c,'#7ac',gx-8,gy-16,16,4);R(c,'#335',gx-6,gy-4,12,12)}
  else if(w===12){R(c,'#565',gx-11,gy-26+o,22,28);R(c,'#343',gx-9,gy-32+o,18,8);R(c,'#fb4',gx-4,gy-36,8,5);R(c,'#a62',gx-6,gy-2,12,12)}
  else{R(c,'#335',gx-8,gy-28,16,32);for(let k=0;k<3;k++){R(c,'#9bf',gx-12,gy-30+k*8,5,3);R(c,'#9bf',gx+7,gy-30+k*8,5,3)}R(c,f?'#fff':'#58f',gx-3,gy-36,6,6)}
  if(f){R(c,WP[w].fx,gx-6,gy-46,12,10);R(c,'#fff',gx-3,gy-43,6,5)}}
 draw(c,g){const p=g.p,t=performance.now()/1000;
  const gx=W/2+Math.sin(g.bob)*5,gy=H-24+Math.abs(Math.cos(g.bob))*3+(g.fire>0?4:0);
  if(g.fire>0&&WP[p.w].beam){const a=Math.min(1,g.fire*6*(g.fxF??1));c.strokeStyle=`rgba(80,255,255,${a})`;c.lineWidth=3;c.beginPath();c.moveTo(gx,gy-34);c.lineTo(W/2,H/2);c.stroke();c.strokeStyle=`rgba(255,255,255,${a})`;c.lineWidth=1;c.stroke();R(c,`rgba(80,255,255,${a*.5})`,gx-12,gy-48,24,24)}
  this.gun(c,g,gx,gy);
  R(c,'#fff',W/2-1,H/2-5,2,3);R(c,'#fff',W/2-1,H/2+2,2,3);R(c,'#fff',W/2-6,H/2-1,3,2);R(c,'#fff',W/2+3,H/2-1,3,2);
  if(g.dm>0)R(c,`rgba(220,0,0,${Math.min(.35,g.dm*2)*(g.fxF??1)})`,0,0,W,H);if(g.pk>0)R(c,`rgba(255,220,60,${g.pk*.7*(g.fxF??1)})`,0,0,W,H);
  const Y=H-24;R(c,'#1a1210',0,Y,W,24);R(c,'#5a4030',0,Y,W,2);for(let i=0;i<5;i++)R(c,'#3a2a20',i*80+2,Y+4,1,18);
  c.font='bold 8px "Courier New",monospace';c.textBaseline='top';const T=(s,x,y,col)=>{c.fillStyle='#000';c.fillText(s,x+1,y+1);c.fillStyle=col;c.fillText(s,x,y)};
  this.ico(c,IC.h,1,Y+2);this.ico(c,IC.r,1,Y+12);T(Math.max(0,this.lr('dh',p.hp)|0)+'%',11,Y+3,p.hp>30?'#4e4':'#f33');T((this.lr('da',p.ar)|0)+'',11,Y+14,'#7bf');T('',0,0,p.hp>30?'#4e4':'#f33');
  this.ico(c,IC['w'+p.w],42,Y+3);this.ico(c,IC.a,42,Y+13);T((p.w+1)+' '+WP[p.w].n,52,Y+4,'#a86');T(AMN[WP[p.w].t]+' '+p.am[WP[p.w].t],52,Y+12,p.am[WP[p.w].t]>=WP[p.w].c?'#fd3':'#f33');
  T('ОЧКИ',120,Y+4,'#a86');T(''+p.sc,120,Y+12,'#fff');
  T('УРОВЕНЬ '+(g.li+1),176,Y+4,'#a86');T(g.lv.n,176,Y+12,'#8cf');
  this.ico(c,IC.s,240,Y+3);T(g.sf+'/'+g.sn,250,Y+4,'#8cf');if(p.kr)this.ico(c,IC.k,240,Y+12,{y:'r'});if(p.kb)this.ico(c,IC.k,250,Y+12,{y:'b'});if(p.dmg>1)this.ico(c,IC.u,260,Y+12);
  T('УБИТО '+g.kills,282,Y+4,'#a86');
  if(g.gm>0)T('GOD '+(g.gm/60|0)+':'+('0'+((g.gm%60)|0)).slice(-2),4,34,'#fff');if(p.qd>0)T('x2 '+(p.qd|0),4,4,'#f8f');if(p.iv>0)T('НЕУЯЗ '+(p.iv|0),4,14,'#ff0');if(p.zs>0)T('СКОР '+(p.zs|0),4,24,'#4f4');if(g.alarm>0)R(c,'rgba(200,0,0,'+(g.calm?.07:.09+.06*Math.sin(t*4))+')',0,0,W,H);if(g.li>=30)R(c,'rgba(140,0,0,'+(g.calm?.04:.05+.03*Math.sin(t*2))+')',0,0,W,H);
  const bs=g.lv.en.find(e=>ET[e.t].boss&&e.al);if(bs){const M=ET[bs.t];R(c,'#000',60,H-36,200,7);R(c,bs.ph>1?'#f3f':bs.ph>0?'#fa2':'#c22',61,H-35,198*Math.max(0,bs.hp)/M.hp,5);T(M.name+' · ФАЗА '+(bs.ph+1),60,H-46,'#f66')}
  this.dialog(c,g,T);this.automap(c,g);this.navigation(c,g,T);if(g.msgT>0)T(g.msg,W/2-g.msg.length*2.6,14,'#fe6');else if(g.hint)T(g.hint,W/2-g.hint.length*2.6,14,'#ccc')}
}