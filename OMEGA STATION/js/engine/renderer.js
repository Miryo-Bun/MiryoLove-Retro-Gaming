import {H,W,flashC,sh} from '../core/util.js';
import {ET} from '../enemies/types.js';
import {Raycaster} from './raycaster.js';
import {SP} from './sprites.js';
import {TX} from './textures.js';
export class Renderer{
 constructor(cv){this.cv=cv;this.ctx=cv.getContext('2d',{alpha:false});this.img=this.ctx.createImageData(W,H);this.buf=new Uint32Array(this.img.data.buffer);this.rc=new Raycaster()}
 world(L,p){const b=this.buf,rc=this.rc,dx=Math.cos(p.a),dy=Math.sin(p.a),qx=-dy*.66,qy=dx*.66;
  for(let y=(H/2|0)+1;y<H;y++){const rd=H/2/(y-H/2),k=(Math.max(25,(256*(1-rd/(L.open?20:11)))|0)*(L.lt||1))|0;let fx=p.x+rd*(dx-qx),fy=p.y+rd*(dy-qy);const sx=rd*2*qx/W,sy=rd*2*qy/W,o1=y*W,o2=(H-1-y)*W;
   for(let x=0;x<W;x++){const t=(((fy*64)&63)<<6)|((fx*64)&63);b[o1+x]=sh(L.fl[t],k);b[o2+x]=L.sky?L.sky[((((H-1-y)*64/(H/2))|0)<<6)|(((x*.45+p.a*60)|0)&63)]:sh(L.ce[t],k);fx+=sx;fy+=sy}}
  for(let x=0;x<W;x++){const c=2*x/W-1;rc.cast(L,p.x,p.y,dx+qx*c,dy+qy*c);const d=rc.d;rc.zb[x]=d;
   const lh=H/d,ys=(H-lh)/2,y0=Math.max(0,ys|0),y1=Math.min(H-1,(ys+lh)|0),tex=L.t[rc.i]>=30?L.wt[L.t[rc.i]-30]:TX[L.t[rc.i]]||TX[1],st=64/lh,u=rc.wx;let tp=(y0-ys)*st;
   const k=((Math.max(25,(256*(1-d/(L.open?20:11)))|0))*(rc.s?.72:1)*(L.lt||1))|0;
   for(let y=y0;y<=y1;y++){b[y*W+x]=sh(tex[(((tp|0)&63)<<6)|u],k);tp+=st}}}
 sprites(S,p){const b=this.buf,zb=this.rc.zb,dx=Math.cos(p.a),dy=Math.sin(p.a),qx=-dy*.66,qy=dx*.66,inv=1/(qx*dy-dx*qy);
  for(const s of S)s.dd=(p.x-s.x)**2+(p.y-s.y)**2;S.sort((a,c)=>c.dd-a.dd);
  for(const s of S){const rx=s.x-p.x,ry=s.y-p.y,tx=inv*(dy*rx-dx*ry),ty=inv*(-qy*rx+qx*ry);if(ty<.2)continue;
   const sc=W/2*(1+tx/ty),sz=H/ty*s.s,bot=H/2+H/ty/2-(s.vo||0)*H/ty,top=bot-sz,x0=Math.max(0,(sc-sz/2)|0),x1=Math.min(W-1,(sc+sz/2)|0),y0=Math.max(0,top|0),y1=Math.min(H-1,bot|0),k=Math.max(50,(256*(1-ty/12))|0);
   for(let x=x0;x<=x1;x++){if(ty>=zb[x])continue;const u=((x-(sc-sz/2))/sz*64)|0;if(u<0||u>63)continue;
    for(let y=y0;y<=y1;y++){const v=((y-top)/sz*64)|0;if(v<0||v>63)continue;const c=s.tx[(v<<6)|u];if(c&&!(s.gh&&((x+y+(s.fr|0))&1)))b[y*W+x]=s.fl?flashC(c):sh(c,k)}}}}
 draw(g){const L=g.lv,p=g.p,a0=p.a;p.a+=p.sh||0;this.world(L,p);const S=[];
  for(const e of L.en)if(!(ET[e.t].amb&&!e.al)&&(e.x-p.x)**2+(e.y-p.y)**2<900)S.push({x:e.x,y:e.y,tx:SP['e'+e.t+'_'+((e.an|0)&1)],s:(ET[e.t].s||.9)*(e.cd>(ET[e.t].cd||1.5)-.2?1.15:1+Math.sin(performance.now()/300+e.x)*.03),fl:e.fl>0&&!g.calm,gh:ET[e.t].gh,fr:e.an*3,vo:ET[e.t].fly?.35+Math.sin(e.an)*.08:0});
  for(const i of L.it)if((i.x-p.x)**2+(i.y-p.y)**2<600)S.push({x:i.x,y:i.y,tx:SP[i.k],s:.45});
  for(const q of g.pr)S.push({x:q.x,y:q.y,tx:SP.o,s:.35,vo:.35});for(const q of g.rk)S.push({x:q.x,y:q.y,tx:SP.o,s:.3,vo:.3});for(const q of g.pa)S.push({x:q.x,y:q.y,tx:q.sp||SP.bl,s:q.sz||.07,vo:q.z});
  for(const f of g.fx)S.push(f.tx?{x:f.x,y:f.y,tx:f.tx,s:f.s0*(1-f.t/f.l*.8),fl:(f.t*16|0)&1}:{x:f.x,y:f.y,tx:SP.x,s:.5+f.t/f.l*f.s,vo:.3,fl:true});for(const t of L.tl)S.push({x:t[0]+.5,y:t[1]+.5,tx:SP.tp,s:.9+Math.sin(performance.now()/200)*.05});for(const t of L.tr)S.push({x:t[0]+.5,y:t[1]+.5,tx:Math.sin(g.ph*2.5)>.2?SP.tr1:SP.tr0,s:.7});
  for(const a of L.al||[])S.push({x:a.x,y:a.y,tx:SP['a'+a.id+'_'+((performance.now()/500|0)&1)],s:.95,fl:a.fl>0});for(const t of L.tm||[])S.push({x:t.x,y:t.y,tx:SP.term,s:.6});for(const q of L.pp||[]){const dx=q.x-p.x,dy=q.y-p.y;if(dx*dx+dy*dy<324)S.push({x:q.x,y:q.y,tx:SP['pr'+q.k],s:.8})}this.sprites(S,p);p.a=a0;this.ctx.putImageData(this.img,0,0)}
}