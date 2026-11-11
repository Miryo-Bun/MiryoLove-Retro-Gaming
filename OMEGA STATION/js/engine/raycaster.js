import {W} from '../core/util.js';
export class Raycaster{
 constructor(){this.zb=new Float32Array(W);this.d=0;this.s=0;this.i=-1;this.wx=0}
 cast(L,ox,oy,dx,dy){let mx=ox|0,my=oy|0;const ax=Math.abs(1/(dx||1e-9)),ay=Math.abs(1/(dy||1e-9));let sx,sy,qx,qy;
  if(dx<0){sx=-1;qx=(ox-mx)*ax}else{sx=1;qx=(mx+1-ox)*ax}
  if(dy<0){sy=-1;qy=(oy-my)*ay}else{sy=1;qy=(my+1-oy)*ay}
  let side=0,i=-1;
  for(let n=0;n<80;n++){if(qx<qy){qx+=ax;mx+=sx;side=0}else{qy+=ay;my+=sy;side=1}
   if(mx<0||my<0||mx>=L.w||my>=L.h){i=-1;break}i=my*L.w+mx;if(L.g[i])break}
  this.d=Math.max(.05,side?qy-ay:qx-ax);this.s=side;this.i=i;
  const h=side?ox+this.d*dx:oy+this.d*dy;let u=((h-Math.floor(h))*64)|0;if((side===0&&dx>0)||(side===1&&dy<0))u=63-u;this.wx=u}
}