import {UNL,availW} from '../weapons/weapons.js';
import {EPF,POOL2,RARE} from '../enemies/types.js';
import {BOSS,THEMES} from '../episodes/episodes.js';
import {allyAt,termAt} from '../story/story.js';
let S=31;const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
export const LAYOUTS=['rooms','cave','maze','hall','ring'];
export function genLevel(i){for(let a=0;a<8;a++){const L=build(i,a);if(L)return L}throw new Error('level '+i)}
function build(i,att){
 const ep=i/10|0,N=i%10,open=i%2===1,TA=THEMES[i>>1],A=TA[11],lay0=open?(N===9?'arena':att>5?'yard':A.op[(i*3+att)%A.op.length]):att>5?'rooms':A.cl[(i*3+att)%A.cl.length];S=open&&N!==9?39+2*((i*5)%7):31;let s=i*7919+13+att*104729;const r=()=>(s=s*16807%2147483647)/2147483647,ri=n=>r()*n|0;
 const g=[...Array(S)].map(()=>Array(S).fill('#')),at=(x,y)=>g[y]&&g[y][x]!==undefined?g[y][x]:'?',inb=(x,y)=>x>0&&y>0&&x<S-1&&y<S-1,set=(x,y,c='.')=>{if(inb(x,y))g[y][x]=c};
 const lay=lay0;
 const nearF=(x,y)=>{for(let d=0;d<14;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++)if(at(x+dx,y+dy)==='.')return[x+dx,y+dy];return[x,y]};
 const rect=(x0,y0,x1,y1,shape=0)=>{const cx=(x0+x1)/2,cy=(y0+y1)/2,a=(x1-x0+1)/2,b=(y1-y0+1)/2;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let ok=true;if(shape===1)ok=((x-cx)/a)**2+((y-cy)/b)**2<=1;else if(shape===2)ok=Math.abs(x-cx)<a*.45||Math.abs(y-cy)<b*.45;else if(shape===3)ok=!((x-x0)%3===1&&(y-y0)%3===1&&x>x0&&y>y0&&x<x1&&y<y1);if(ok)set(x,y)}return{x0,y0,x1,y1,c:nearF((x0+x1)>>1,(y0+y1)>>1)}};
 const link=(A,B,w=1)=>{let[x,y]=A;const[tx,ty]=B,sx=()=>{while(x!==tx){x+=Math.sign(tx-x);for(let k=0;k<w;k++)set(x,y+k)}},sy=()=>{while(y!==ty){y+=Math.sign(ty-y);for(let k=0;k<w;k++)set(x+k,y)}};if(r()<.5){sx();sy()}else{sy();sx()}};
 const disc=(cx,cy,rad)=>{for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++)if((x-cx)**2+(y-cy)**2<=rad*rad)set(x,y)};
 let start,rooms=[];
 if(lay==='rooms'){const K=7+ri(4);for(let t=0;t<300&&rooms.length<K;t++){const w=4+ri(i<10?4:8),h=4+ri(i<10?4:7),x=2+ri(S-w-4),y=2+ri(S-h-4);if(rooms.some(q=>x<q.x1+3&&x+w>q.x0-3&&y<q.y1+3&&y+h>q.y0-3))continue;rooms.push(rect(x,y,x+w-1,y+h-1,A.sh[ri(A.sh.length)]))}
  if(rooms.length<5)return null;const ord=[rooms[0]],rest=rooms.slice(1);while(rest.length){const l=ord[ord.length-1],dd=q=>Math.hypot(q.c[0]-l.c[0],q.c[1]-l.c[1]);let bi=0;rest.forEach((q,k)=>{if(dd(q)<dd(rest[bi]))bi=k});ord.push(rest.splice(bi,1)[0])}
  for(let k=1;k<ord.length;k++)link(ord[k-1].c,ord[k].c,Math.max(A.cw,r()<.25?2:1));for(let k=0;k<2+(ep>>2);k++)link(rooms[ri(rooms.length)].c,rooms[ri(rooms.length)].c,1);start=ord[0].c}
 else if(lay==='cave'){let ok=false;for(let t=0;t<6&&!ok;t++){for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++)g[y][x]=r()<.44+t*.01?'#':'.';
   for(let it=0;it<4;it++){const c=g.map(a=>a.slice());for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(at(x+dx,y+dy)!=='.')n++;c[y][x]=n>=5?'#':'.'}for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++)g[y][x]=c[y][x]}
   for(let k=0;k<2;k++)disc(5+ri(S-10),5+ri(S-10),3);
   const lab=new Int16Array(S*S);let best=0,bl=0,l=0;for(let c0=0;c0<S*S;c0++){if(lab[c0]||g[c0/S|0][c0%S]!=='.')continue;l++;let n=0;const q=[c0];lab[c0]=l;for(let h=0;h<q.length;h++){const c=q[h];n++;for(const[dx,dy]of DIRS){const x=c%S+dx,y=(c/S|0)+dy;if(x>0&&y>0&&x<S-1&&y<S-1&&!lab[y*S+x]&&g[y][x]==='.'){lab[y*S+x]=l;q.push(y*S+x)}}}if(n>best){best=n;bl=l}}
   if(best>=300){ok=true;const fl=[];for(let c=0;c<S*S;c++){if(lab[c]!==bl)g[c/S|0][c%S]='#';else fl.push(c)}const c=fl[ri(fl.length)];start=[c%S,c/S|0]}}
  if(!ok)return null}
 else if(lay==='maze'){const vis=new Set([S+1]),st=[[1,1]];set(1,1);while(st.length){const[x,y]=st[st.length-1],nb=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>inb(x+dx,y+dy)&&!vis.has((y+dy)*S+x+dx));if(!nb.length){st.pop();continue}const[dx,dy]=nb[ri(nb.length)];set(x+dx/2,y+dy/2);set(x+dx,y+dy);vis.add((y+dy)*S+x+dx);st.push([x+dx,y+dy])}
  for(let k=0;k<45;k++){const x=2+ri(S-4),y=2+ri(S-4);if(g[y][x]==='#'&&((at(x-1,y)==='.'&&at(x+1,y)==='.')||(at(x,y-1)==='.'&&at(x,y+1)==='.')))set(x,y)}
  for(let k=0;k<3+ri(3);k++){const x=1+2*ri(11),y=1+2*ri(11);rooms.push(rect(x,y,x+4+ri(3)*2,y+4,ri(2)))}start=[1,1]}
 else if(lay==='hall'){const st=ri(3),hx=3+ri(4),hy=3+ri(4),x0=15-hx,y0=15-hy,x1=15+hx,y1=15+hy;rect(x0,y0,x1,y1,ri(5)>3?1:0);const tg=nearF(15,15);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x-x0,py=y-y0;if(Math.abs(x-15)<2&&Math.abs(y-15)<2)continue;if(st===0&&px%3===1&&py%3===1&&px>0&&py>0&&px<2*hx&&py<2*hy)g[y][x]='#';if(st===1&&(px===2||px===2*hx-2)&&(py===2||py===2*hy-2))g[y][x]='#';if(st===2&&(px===hx-2||px===hx+1)&&(py===hy-2||py===hy+1)&&px!==py)g[y][x]='#'}
  const W4=[0,1,2,3].map(k=>{const w=5+ri(4),h=5+ri(4),x=k&1?S-3-w-ri(3):2+ri(3),y=k&2?S-3-h-ri(3):2+ri(3);return rect(x,y,x+w-1,y+h-1,A.sh[ri(A.sh.length)])});
  W4.forEach(q=>link(q.c,tg,1));if(r()<.7)link(W4[0].c,W4[1].c,1);if(r()<.7)link(W4[2].c,W4[3].c,1);if(r()<.4)link(W4[0].c,W4[2].c,1);
  if(r()<.5){const q=rect(13,1+ri(2),17+ri(3),4+ri(2),ri(2));link(q.c,tg,1);W4.push(q)}if(r()<.5){const q=rect(13,25+ri(2),17+ri(3),29,ri(2));link(q.c,tg,1);W4.push(q)}
  rooms=W4;start=W4[i%4].c}
 else if(lay==='ring'){const ins=2+2*ri(3),w=2+ri(2),lo=ins+w+2,hi=S-ins-w-3;for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const m=Math.min(x,y,S-1-x,S-1-y);if(m>=ins&&m<ins+w)g[y][x]='.'}
  for(let t=0;t<300&&rooms.length<5+ri(3);t++){const rw=4+ri(7),rh=4+ri(7),x=lo+ri(Math.max(1,hi-lo-rw)),y=lo+ri(Math.max(1,hi-lo-rh));if(x+rw>hi+1||y+rh>hi+1||rooms.some(q=>x<q.x1+2&&x+rw>q.x0-2&&y<q.y1+2&&y+rh>q.y0-2))continue;const q=rect(x,y,x+rw-1,y+rh-1,ri(4));rooms.push(q);const side=ri(4);if(side<2)link(q.c,[q.c[0],side?S-1-ins:ins],1);else link(q.c,[side===2?ins:S-1-ins,q.c[1]],1)}
  if(rooms.length<3)return null;if(r()<.6)link([ins,ins],[S-1-ins,S-1-ins],1);start=[ins,ins]}
 else if(lay==='yard'||lay==='ruins'||lay==='colony'){for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++)set(x,y);
  const bld=[],free=(x0,y0,x1,y1,m)=>!bld.some(q=>x0<q[2]+m&&x1>q[0]-m&&y0<q[3]+m&&y1>q[1]-m),wall=(x,y)=>set(x,y,'#');
  const building=(x0,y0,x1,y1,doors,part,ruin)=>{bld.push([x0,y0,x1,y1]);for(let x=x0;x<=x1;x++){wall(x,y0);wall(x,y1)}for(let y=y0;y<=y1;y++){wall(x0,y);wall(x1,y)}
   for(let d=0;d<doors;d++){const side=ri(4);if(side<2){set(x0+2+ri(Math.max(1,x1-x0-3)),side?y1:y0)}else{set(side===2?x0:x1,y0+2+ri(Math.max(1,y1-y0-3)))}}
   if(part&&x1-x0>7){const px=x0+3+ri(x1-x0-5);for(let y=y0+1;y<y1;y++)wall(px,y);set(px,y0+2+ri(Math.max(1,y1-y0-4)))}
   if(ruin)for(let k=0;k<6+ri(8);k++){if(r()<.5)set(x0+ri(x1-x0+1),r()<.5?y0:y1);else set(r()<.5?x0:x1,y0+ri(y1-y0+1))}};
  const A=[[3,3],[S-4,3],[3,S-4],[S-4,S-4]],si=ri(4),st=A[si],op=A[3-si];start=st;
  const ex0=op[0]<S/2?2:S-12,ey0=op[1]<S/2?2:S-12;building(ex0,ey0,ex0+9,ey0+9,0,false);{const gx=op[0]<S/2?ex0+9:ex0;set(gx,ey0+4+ri(2));for(const[px,py]of[[ex0+3,ey0+3],[ex0+6,ey0+6]])wall(px,py)}
  const nearStart=(x0,y0,x1,y1)=>x0<st[0]+9&&x1>st[0]-9&&y0<st[1]+9&&y1>st[1]-9;
  if(lay==='yard'){for(let t=0;t<300&&bld.length<5+ri(4);t++){const w=7+ri(6),h=6+ri(6),x=3+ri(S-w-6),y=3+ri(S-h-6);if(!free(x,y,x+w,y+h,3)||nearStart(x,y,x+w,y+h))continue;building(x,y,x+w-1,y+h-1,1+ri(2),r()<.5,false)}}
  else if(lay==='ruins'){for(let t=0;t<300&&bld.length<3+ri(3);t++){const w=7+ri(6),h=6+ri(6),x=3+ri(S-w-6),y=3+ri(S-h-6);if(!free(x,y,x+w,y+h,3)||nearStart(x,y,x+w,y+h))continue;building(x,y,x+w-1,y+h-1,2,false,true)}
   for(let k=0;k<Math.round(S*1.2);k++){const L2=3+ri(7),hz=r()<.5,x=3+ri(S-L2-6),y=3+ri(S-L2-6),x1=hz?x+L2:x,y1=hz?y:y+L2;if(!free(x,y,x1,y1,2)||nearStart(x,y,x1,y1))continue;for(let q=0;q<=L2;q++)wall(hz?x+q:x,hz?y:y+q)}}
  else{const sw=3+ri(2),bw=7+ri(4),bh=7+ri(4);for(let y=3;y+bh<S-3;y+=bh+sw)for(let x=3;x+bw<S-3;x+=bw+sw){if(!free(x,y,x+bw-1,y+bh-1,2)||nearStart(x,y,x+bw-1,y+bh-1)||r()<.2)continue;if(r()<.15){for(let yy=y;yy<y+bh;yy++)for(let xx=x;xx<x+bw;xx++)wall(xx,yy);bld.push([x,y,x+bw-1,y+bh-1])}else building(x,y,x+bw-1,y+bh-1,1+ri(2),r()<.6,false)}}
  for(let t=0,n=0,m=3+ri(4);t<200&&n<m;t++){const w=5+ri(4),h=5+ri(4),x=3+ri(S-w-6),y=3+ri(S-h-6);if(!free(x,y,x+w,y+h,3)||nearStart(x,y,x+w,y+h))continue;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)wall(xx,yy);bld.push([x,y,x+w-1,y+h-1]);n++}}
 else{const c=15,K=ep,ins=(x,y)=>{const dx=x-c,dy=y-c,ax=Math.abs(dx),ay=Math.abs(dy),d=dx*dx+dy*dy;switch(K){case 0:return d<=90;case 1:return ax<=8&&ay<=8;case 2:return ax+ay<=11;case 3:return(ax<=3&&ay<=10)||(ay<=3&&ax<=10);case 4:return d<=110&&d>=14;case 5:return ax<=10&&ay<=6;case 6:return d<=70||((ax<=2||ay<=2)&&ax<=12&&ay<=12);case 7:return(dx+4)**2+dy*dy<=49||(dx-4)**2+dy*dy<=49;case 8:return ax<=9&&ay<=9&&ax+ay<=13;default:return ax<=11&&ay<=11&&ax+ay<=16}};
  for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++)if(ins(x,y))set(x,y);
  const PM=(K+(K>>2))%3;if(PM===0)for(let k=0;k<8;k++){const a=k*Math.PI/4+N*.1,px=Math.round(c+6*Math.cos(a)),py=Math.round(c+6*Math.sin(a));if(ins(px,py)){set(px,py,'#');set(px+1,py,'#')}}
  else if(PM===1){for(let y=7;y<=23;y+=4)for(let x=7;x<=23;x+=4)if(ins(x,y)&&Math.hypot(x-c,y-c)>3)set(x,y,'#')}
  else for(const[sx2,sy2]of[[-5,-5],[5,-5],[-5,5],[5,5]])if(ins(c+sx2,c+sy2)){set(c+sx2,c+sy2,'#');set(c+sx2+1,c+sy2,'#');set(c+sx2,c+sy2+1,'#');set(c+sx2+1,c+sy2+1,'#')}
  const z=K%3,ch=[rect(12-z,1,18+z,3+(K>4?1:0),ri(4)),rect(12-z,27-(K>4?1:0),18+z,29,ri(4)),rect(1,12-z,3+(K>4?1:0),18+z,ri(4)),rect(27-(K>4?1:0),12-z,29,18+z,ri(4))],tg=nearF(15,15);ch.forEach(q=>link(q.c,tg,1));rooms=ch;start=ch[1].c}
 const sx=start[0],sy=start[1];set(sx,sy);
 {const ck=Math.round(S*S*A.ck/3);for(let t=0,k=0;t<ck*25&&k<ck;t++){const x=2+ri(S-4),y=2+ri(S-4);if(Math.hypot(x-sx,y-sy)<4||g[y][x]!=='.')continue;let ok=true;for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&g[y+dy][x+dx]!=='.'){ok=false;break}if(ok){g[y][x]=A.pk[ri(A.pk.length)];k++}}}
 const idx=(x,y)=>y*S+x,walk=c=>c!=='#'&&c!=='E',cx2=c=>[c%S,c/S|0];
 const bfs=(blk,par)=>{const d=new Int16Array(S*S).fill(-1),q=[idx(sx,sy)];d[q[0]]=0;for(let h=0;h<q.length;h++){const c=q[h],x=c%S,y=c/S|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=S||ny>=S)continue;const n=idx(nx,ny);if(d[n]>=0||!walk(g[ny][nx])||(blk&&blk.has(n)))continue;d[n]=d[c]+1;if(par)par[n]=c;q.push(n)}}return d};
 const par=new Int16Array(S*S).fill(-1),d0=bfs(null,par);let fl=[];for(let c=0;c<S*S;c++)if(d0[c]>=0&&g[c/S|0][c%S]==='.')fl.push(c);if(fl.length<220)return null;
 fl.sort((a,b)=>d0[b]-d0[a]);let F=-1;
 for(const c of fl.slice(0,80)){const[x,y]=cx2(c);for(const[dx,dy]of DIRS)if(at(x+dx,y+dy)==='#'&&!(x+dx===sx&&y+dy===sy)){F=c;g[y+dy][x+dx]='E';break}if(F>=0)break}
 if(F<0)return null;
 const P=[];for(let c=F;c>=0;c=par[c])P.unshift(c);
 const cut=c=>bfs(new Set([c]))[F]<0,lock=(from,ch)=>{for(let k=Math.max(3,from|0);k<P.length-2;k++){const[x,y]=cx2(P[k]);if(g[y][x]==='.'&&cut(P[k])){g[y][x]=ch;return k}}return -1};
 const kR=lock(P.length*.3,'R'),kB=kR>=0?lock(Math.max(kR+4,P.length*.6),'B'):-1;lock(P.length*.15,'D');lock(P.length*.78,'D');
 const blk=new Set();if(kR>=0)blk.add(P[kR]);if(kB>=0)blk.add(P[kB]);
 const d1=blk.size?bfs(blk):d0,d2=kB>=0?bfs(new Set([P[kB]])):d1;
 fl=fl.filter(c=>{const[x,y]=cx2(c);return g[y][x]==='.'});
 const e=[],it=[],put=(c,k,n)=>{const[x,y]=cx2(c);it.push(n===undefined?[x,y,k]:[x,y,k,n])},pickOf=l=>l[ri(l.length)];
 const far=(d,pred,n)=>{const l=fl.filter(c=>d[c]>=0&&pred(c)).sort((a,b)=>d[b]-d[a]).slice(0,n);return l};
 if(kR>=0){const l=far(d1,c=>true,6);put(pickOf(l),'r')}
 if(kB>=0){let l=far(d2,c=>d1[c]<0,8);if(!l.length)l=far(d1,c=>true,8);put(pickOf(l),'b')}
 const nSec=2+(N%2),used=[];const cl=[];for(let y=2;y<S-2;y++)for(let x=2;x<S-2;x++){if(g[y][x]!=='#')continue;for(const[dx,dy]of DIRS)if(at(x-dx,y-dy)==='.'&&d0[idx(x-dx,y-dy)]>=0&&at(x+dx,y+dy)==='#'&&at(x+2*dx,y+2*dy)==='#'&&at(x+dx+dy,y+dy+dx)==='#'&&at(x+dx-dy,y+dy-dx)==='#'&&at(x+dy,y+dx)==='#'&&at(x-dy,y-dx)==='#')cl.push([x,y,dx,dy])}
 const SEC=[['w',availW(i)],['u'],['A'],['H'],['k'],['c']];let sk=ri(6);
 for(let t=0;t<cl.length&&used.length<nSec;t++){const[x,y,dx,dy]=cl[ri(cl.length)];if(g[y][x]!=='#'||used.some(q=>Math.abs(q[0]-x)+Math.abs(q[1]-y)<4))continue;g[y][x]='S';set(x+dx,y+dy);used.push([x,y]);const q=SEC[sk++%6];it.push([x+dx,y+dy,...q])}
 let nsc=0;for(let t=0;t<300&&nsc<1+(ep>3?1:0);t++){const x=2+ri(S-4),y=2+ri(S-4);if(g[y][x]!=='#')continue;const hz=at(x-1,y)==='.'&&at(x+1,y)==='.'&&at(x,y-1)==='#'&&at(x,y+1)==='#',vt=at(x,y-1)==='.'&&at(x,y+1)==='.'&&at(x-1,y)==='#'&&at(x+1,y)==='#';if(!hz&&!vt)continue;const a=hz?d0[idx(x-1,y)]:d0[idx(x,y-1)],b=hz?d0[idx(x+1,y)]:d0[idx(x,y+1)];if(a>=0&&b>=0&&Math.abs(a-b)>=14){g[y][x]='S';nsc++}}
 const reg=c=>d1[c]>=0?0:d2[c]>=0?1:2,tl=[],rc=[[],[],[]];for(const c of fl){const[x,y]=cx2(c);if(Math.hypot(x-sx,y-sy)>3)rc[reg(c)].push(c)}
 if(i>=3)for(let k=0;k<3;k++){const q=rc[k];if(q.length<40||(k>0&&r()<.3))continue;for(let p=0;p<(k===0?1+(N%2):1);p++)for(let t=0;t<60;t++){const[ax,ay]=cx2(pickOf(q)),[bx,by]=cx2(pickOf(q));if(Math.hypot(ax-bx,ay-by)>=12&&!tl.some(z=>(z[0]===ax&&z[1]===ay)||(z[0]===bx&&z[1]===by))){tl.push([ax,ay,bx,by],[bx,by,ax,ay]);break}}}
 const trp=[];if(i>=10)for(let k=0;k<1+(i/12|0)+(N%3?0:1);k++){const l=fl.filter(c=>d0[c]>=8);if(l.length)trp.push(cx2(pickOf(l)))}
 const tier=i/7|0,lim=t=>POOL2.indexOf(t)<Math.min(POOL2.length,6+tier*3)?t:POOL2[Math.max(0,Math.min(POOL2.length,6+tier*3)-1-ri(4))],sf=fl.filter(c=>{const[x,y]=cx2(c);return Math.hypot(x-sx,y-sy)>=7}),usd=new Set,E=(c,t)=>{if(c===undefined||usd.has(c))return;usd.add(c);const[x,y]=cx2(c);e.push([x,y,t])};
 for(let gi=0,gN=Math.min(open?14:12,3+(i/8|0)+(open?1:0));gi<gN&&sf.length;gi++){const[ax,ay]=cx2(pickOf(sf)),A=lim(EPF[ep][(N+gi)%3]),B=POOL2[(i*5+ep*3+gi*7)%Math.min(POOL2.length,6+tier*3)],n=2+ri(2)+(i>40?1:0),nb=sf.filter(c=>Math.abs(c%S-ax)<=2&&Math.abs((c/S|0)-ay)<=2);let cnt=0;for(let k=0;k<nb.length&&cnt<n;k++){const c=nb[(k*7+ri(nb.length))%nb.length];if(!usd.has(c)){E(c,cnt%3===2?B:A);cnt++}}if(tier>=3&&r()<.05+i*.0025)E(pickOf(nb),RARE[(i+gi)%RARE.length])}
 if(N===4)E(pickOf(fl.slice(0,Math.max(1,fl.length>>2))),RARE[ep%RARE.length]);
 if(N===9){const[bx,by]=nearF(15,15);e.push([bx,by,BOSS[ep]])}
 for(let k=0;k<8+ri(6);k++){const[x,y]=cx2(pickOf(fl));e.push([x,y,40])}
 for(let k=0,nI=Math.round((Math.max(6,16-(i/12|0))+ri(4))*(open?1.5:1));k<nI;k++)put(pickOf(fl),'asckhHA'[ri(7)]);for(const wn of Object.keys(UNL))if(UNL[wn]===i&&i>0)put(pickOf(far(d0,c=>true,Math.max(8,fl.length>>3))),'w',+wn);put(pickOf(fl),'QVZ'[ri(3)]);
 const aid=allyAt(i);let ally;if(aid!==null){const l=fl.filter(c=>d0[c]>=4&&d0[c]<=14);const[x,y]=cx2(pickOf(l.length?l:fl));ally=[[x,y,aid]]}
 const term=termAt(i).map(k=>{const l=fl.filter(c=>d0[c]>=6);const[x,y]=cx2(pickOf(l.length?l:fl));return[x,y,k]});
 const evs=[];for(let k=0;k<(i<10?1:2+(N%2));k++){const l=fl.filter(c=>d0[c]>=8);if(l.length){const[x,y]=cx2(pickOf(l)),K=i<20?['pwr']:i<30?['pwr','amb','rsv']:i<40?['pwr','amb','blk','rsv']:['amb','alm','blk','pwr','rsv'];evs.push([x,y,K[(i+k*3)%K.length]])}}
 if(N%3===1)for(let t=0;t<300;t++){const x=3+ri(S-8),y=4+ri(S-8);if(g[y][x]!=='#'||at(x-1,y)!=='.'||d0[idx(x-1,y)]<0)continue;let ok=true;for(let yy=y-2;yy<=y+2&&ok;yy++)for(let xx=x;xx<=x+4;xx++)if(!inb(xx,yy)||g[yy][xx]!=='#')ok=false;if(!ok)continue;g[y][x]='S';for(let yy=y-1;yy<=y+1;yy++)for(let xx=x+1;xx<=x+3;xx++)g[yy][xx]='.';it.push([x+2,y,'w',availW(i)],[x+1,y-1,'k'],[x+3,y+1,'c'],[x+3,y-1,'A']);e.push([x+2,y+1,RARE[(i+3)%RARE.length]],[x+1,y+1,RARE[(i+5)%RARE.length]]);break}
 const dk=TA[9];for(let t=0,n=0,mx=14+ri(14);t<400&&n<mx;t++){const x=1+ri(S-2),y=1+ri(S-2);if(g[y][x]!=='#')continue;if(DIRS.filter(([dx,dy])=>at(x+dx,y+dy)==='.').length!==1)continue;g[y][x]=dk[ri(2)];n++}
 const pp=[];{const pt=TA[10],np=14+ri(14)+(open?12:0),pf=fl.filter(c=>{const[x,y]=cx2(c);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if('DRBSE'.includes(at(x+dx,y+dy)))return false;return true});for(let k=0;k<np&&pf.length;k++){const[x,y]=cx2(pickOf(pf));pp.push([x,y,pt[ri(pt.length)]])}}
 g[sy][sx]='P';return{n:'Э'+(ep+1)+'-'+(N+1),lay,m:g.map(a=>a.join('')),e,i:it,t:tl,r:trp,a:ally,tm:term,v:evs,pp,open,dm:1+i*.004,sm:1+i*.002}}
