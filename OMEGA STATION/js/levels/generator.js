import {UNL,availW} from '../weapons/weapons.js';
import {EPF,POOL2,RARE} from '../enemies/types.js';
import {BOSS,LEVEL_NAMES,LEVELS_PER_EPISODE,THEMES} from '../episodes/episodes.js';
import {allyAt,termAt} from '../story/story.js';
import {ARCHITECTURES,LEVEL_BLUEPRINTS} from './designs.js';

const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
export {ARCHITECTURES};

function random(seed){
 let s=(seed>>>0)||1;
 return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
}

function createMap(D,r){
 const W=D.width,H=D.height,g=Array.from({length:H},()=>Array(W).fill('#')),rooms=[],edges=[];
 const inside=(x,y)=>x>0&&y>0&&x<W-1&&y<H-1;
 const set=(x,y,c='.')=>{if(inside(x,y))g[y][x]=c};
 const floor=(x,y)=>g[y]?.[x]==='.';
 const room=(cx,cy,w,h,shape='rect')=>{
  w=Math.max(4,Math.min(W-4,w|0));h=Math.max(4,Math.min(H-4,h|0));
  const x0=Math.max(2,Math.min(W-w-2,Math.round(cx-w/2)));
  const y0=Math.max(2,Math.min(H-h-2,Math.round(cy-h/2)));
  const x1=x0+w-1,y1=y0+h-1,mx=(x0+x1)/2,my=(y0+y1)/2;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const dx=Math.abs((x-mx)/(w/2)),dy=Math.abs((y-my)/(h/2));
   if(shape==='oval'?dx*dx+dy*dy<=1:shape==='cross'?dx<.52||dy<.52:shape==='octagon'?dx+dy<1.46:true)set(x,y);
  }
  const q={x:Math.round(mx),y:Math.round(my),x0,y0,x1,y1,w,h,shape};
  rooms.push(q);return q;
 };
 const brush=(x,y,width)=>{
  const lo=-Math.floor((width-1)/2),hi=lo+width-1;
  for(let dy=lo;dy<=hi;dy++)for(let dx=lo;dx<=hi;dx++)set(x+dx,y+dy);
 };
 const line=(a,b,width=1,style='elbow')=>{
  let pts;
  if(style==='bent'&&r()<.65){
   const mx=Math.round((a.x+b.x)/2+(r()-.5)*Math.min(14,W/5));
   const my=Math.round((a.y+b.y)/2+(r()-.5)*Math.min(14,H/5));
   pts=[[a.x,a.y],[mx,a.y],[mx,my],[b.x,my],[b.x,b.y]];
  }else if(r()<.5)pts=[[a.x,a.y],[b.x,a.y],[b.x,b.y]];
  else pts=[[a.x,a.y],[a.x,b.y],[b.x,b.y]];
  for(let p=1;p<pts.length;p++){
   let [x,y]=pts[p-1];const [tx,ty]=pts[p];
   while(x!==tx||y!==ty){brush(x,y,width);if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y)}
   brush(tx,ty,width);
  }
  edges.push([rooms.indexOf(a),rooms.indexOf(b)]);
 };
 const nearest=(x,y)=>{for(let d=0;d<12;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++)if(floor(x+dx,y+dy))return{x:x+dx,y:y+dy};return{x,y}};
 const connectSet=(list,loops,width=1)=>{
  if(list.length<2)return;
  const connected=[list[0]],rest=list.slice(1);
  while(rest.length){
   let bi=0,bj=0,bd=Infinity;
   for(let i=0;i<connected.length;i++)for(let j=0;j<rest.length;j++){
    const d=Math.abs(connected[i].x-rest[j].x)+Math.abs(connected[i].y-rest[j].y);
    if(d<bd){bd=d;bi=i;bj=j}
   }
   const a=connected[bi],b=rest.splice(bj,1)[0];line(a,b,width,D.style==='technical-spine'||D.style==='maintenance-maze'?'bent':'elbow');connected.push(b);
  }
  const pairs=[];
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   if(edges.some(e=>e[0]===i&&e[1]===j||e[0]===j&&e[1]===i))continue;
   pairs.push([i,j,Math.abs(list[i].x-list[j].x)+Math.abs(list[i].y-list[j].y)]);
  }
  pairs.sort((a,b)=>a[2]-b[2]);
  for(let k=0;k<Math.min(loops,pairs.length);k++)line(list[pairs[k][0]],list[pairs[k][1]],width,r()<.5?'bent':'elbow');
 };
 const center=(x,y,w,h,shape)=>room(x,y,w,h,shape);
 const jitter=(v,n)=>v+Math.round((r()-.5)*n);
 const N=D.rooms,rx=()=>4+Math.floor(r()*6),ry=()=>4+Math.floor(r()*6);
 let start;

 switch(D.style){
  case 'industrial-bays': {
   const cols=3+(D.width>75?1:0),rows=2+(D.height>68?1:0),list=[];
   for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++){
    const x=(xx+.5)*W/cols,y=(yy+.5)*H/rows;
    list.push(center(jitter(x,6),jitter(y,6),Math.max(9,W/cols*.62),Math.max(8,H/rows*.58),r()<.25?'octagon':'rect'));
   }
   connectSet(list,D.loops,2);start=list[0];
   break;
  }
  case 'technical-spine': {
   const horizontal=W>=H,steps=N+1,list=[];
   for(let k=0;k<steps;k++){
    const t=(k+.5)/steps;
    const x=horizontal?t*W:W/2+(k%2?W*.22:-W*.22);
    const y=horizontal?H/2+(k%2?H*.2:-H*.2):t*H;
    list.push(center(x,y,horizontal?7+rx():12+rx(),horizontal?12+ry():7+ry(),'rect'));
    if(k>0)line(list[k-1],list[k],1,'bent');
    for(let b=0;b<1+(k%3===0?1:0);b++){
     const side=(b%2?1:-1),x2=horizontal?x:jitter(x+side*W*.22,5),y2=horizontal?jitter(y+side*H*.24,5):y;
     const branch=center(x2,y2,7+rx(),7+ry(),b%2?'cross':'rect');line(list[k],branch,1,'bent');
    }
   }
   connectSet(list,D.loops,1);start=list[0];break;
  }
  case 'research-wings': {
   const hub=center(W*.51,H*.49,Math.min(17,W*.25),Math.min(15,H*.26),'cross'),list=[hub];
   for(let wing=0;wing<4;wing++){
    const angle=wing*Math.PI/2+(r()-.5)*.24, len=Math.min(W,H)*(.24+r()*.06);
    let prev=hub;
    for(let k=1;k<=2+(wing%2);k++){
     const q=center(W*.51+Math.cos(angle)*len*k/3,H*.49+Math.sin(angle)*len*k/3,9+rx(),8+ry(),k%2?'oval':'rect');
     line(prev,q,k===1?2:1);prev=q;list.push(q);
    }
   }
   connectSet(list,D.loops,1);start=hub;break;
  }
  case 'ring-concourse': {
   const hub=center(W*.5,H*.5,11,11,'octagon'),list=[hub],count=8+Math.floor(r()*4),radius=Math.min(W,H)*(.31+r()*.035);
   const ring=[];
   for(let k=0;k<count;k++){
    const a=2*Math.PI*k/count, q=center(W*.5+Math.cos(a)*radius,H*.5+Math.sin(a)*radius,8+rx(),8+ry(),k%3?'oval':'rect');
    ring.push(q);list.push(q);
   }
   for(let k=0;k<count;k++)line(ring[k],ring[(k+1)%count],1);
   for(let k=0;k<count;k+=2)line(hub,ring[k],1);
   start=hub;break;
  }
  case 'maintenance-maze': {
   const cellW=2,ox=2,oy=2,cw=Math.floor((W-4)/2),ch=Math.floor((H-4)/2),seen=new Set(),stack=[[0,0]];
   const key=(x,y)=>y*cw+x;seen.add(key(0,0));set(ox,oy);
   while(stack.length){
    const [x,y]=stack[stack.length-1],opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>x+dx>=0&&y+dy>=0&&x+dx<cw&&y+dy<ch&&!seen.has(key(x+dx,y+dy)));
    if(!opts.length){stack.pop();continue}
    const [dx,dy]=opts[Math.floor(r()*opts.length)],nx=x+dx,ny=y+dy;
    set(ox+x*2+dx,oy+y*2+dy);set(ox+nx*2,oy+ny*2);seen.add(key(nx,ny));stack.push([nx,ny]);
   }
   for(let k=0;k<N;k++){const x=3+r()*(W-6),y=3+r()*(H-6);if(floor(x|0,y|0))center(x,y,7+rx(),7+ry(),k%2?'cross':'rect')}
   for(let k=0;k<Math.floor(W*H*.007);k++){const x=2+Math.floor(r()*(W-4)),y=2+Math.floor(r()*(H-4));if(g[y][x]==='#'&&DIRS.every(([dx,dy])=>!floor(x+dx,y+dy)))set(x,y)}
   start=nearest(ox,oy);break;
  }
  case 'atrium-branches': {
   const hub=center(W*.5,H*.5,W*.3,H*.29,'cross'),list=[hub],count=5+(D.loops%3);
   for(let k=0;k<count;k++){
    const a=2*Math.PI*k/count,dist=Math.min(W,H)*(.3+r()*.04),end=center(W*.5+Math.cos(a)*dist,H*.5+Math.sin(a)*dist,10+rx(),9+ry(),k%2?'rect':'octagon');
    line(hub,end,1+(k%3===0?1:0),'bent');list.push(end);
    for(let j=0;j<2;j++){const b=center(end.x+jitter(0,14),end.y+jitter(0,14),7+rx(),7+ry(),'rect');line(end,b,1,'bent');list.push(b)}
   }
   connectSet(list,D.loops,1);start=hub;break;
  }
  case 'cargo-aisles': {
   const horizontal=H>W,aisles=5+Math.floor(r()*4),list=[];
   for(let k=0;k<aisles;k++){
    const coord=(k+1)*(horizontal?H:W)/(aisles+1);
    const a=horizontal?{x:3,y:coord|0}:{x:coord|0,y:3},b=horizontal?{x:W-4,y:coord|0}:{x:coord|0,y:H-4};
    for(let t=0;t<Math.floor((horizontal?W:H)/12);t++){
     const v=horizontal?{x:7+t*11,y:coord|0}:{x:coord|0,y:7+t*11};
     const q=center(v.x,v.y,horizontal?8+rx():11,horizontal?11:8+ry(),'rect');list.push(q);
    }
    line(a,b,1);
   }
   const crossCount=3+Math.floor(r()*3);
   for(let k=1;k<=crossCount;k++){
    if(horizontal){const x=k*W/(crossCount+1)|0;for(let y=2;y<H-2;y++)set(x,y)}
    else{const y=k*H/(crossCount+1)|0;for(let x=2;x<W-2;x++)set(x,y)}
   }
   start=nearest(W*.08|0,H*.5|0);break;
  }
  case 'security-checkpoints': {
   const layers=4,list=[];
   for(let k=0;k<layers;k++){
    const t=(k+1)/(layers+1),q=center(W*t,H*t*.78+H*.11,12+rx(),11+ry(),k%2?'cross':'rect');
    list.push(q);
    if(k)line(list[k-1],q,k===1?2:1,'bent');
    const wing=center(W*(1-t*.55),H*(1-t*.4),8+rx(),8+ry(),'rect');line(q,wing,1,'bent');list.push(wing);
   }
   connectSet(list,D.loops,1);start=list[0];break;
  }
  case 'multi-wing': {
   const hub=center(W*.44,H*.56,13,12,'octagon'),list=[hub];
   for(const [sx,sy] of [[1,-1],[1,1],[-1,1],[-1,-1],[1,0]]){
    let prev=hub;
    for(let k=1;k<=2+(Math.floor(r()*2));k++){
     const q=center(W*.44+sx*W*.25*k/3+(sy?0:jitter(0,8)),H*.56+sy*H*.25*k/3+(sx?0:jitter(0,8)),9+rx(),8+ry(),k%2?'rect':'oval');
     line(prev,q,1,'bent');prev=q;list.push(q);
    }
   }
   connectSet(list,D.loops,1);start=hub;break;
  }
  case 'dense-room-web':
  case 'zone-network': {
   const target=N+(D.style==='dense-room-web'?4:0),tries=target*20;
   for(let t=0;t<tries&&rooms.length<target;t++){
    const w=7+rx()+(D.style==='zone-network'?5:0),h=7+ry()+(D.style==='zone-network'?3:0);
    const x=3+Math.floor(r()*(W-w-5)),y=3+Math.floor(r()*(H-h-5));
    if(rooms.some(q=>x<q.x1+2&&x+w>q.x0-2&&y<q.y1+2&&y+h>q.y0-2))continue;
    center(x+w/2,y+h/2,w,h,D.style==='dense-room-web'&&r()<.35?'oval':'rect');
   }
   if(rooms.length<5){
    for(let yy=0;yy<3;yy++)for(let xx=0;xx<4;xx++)center((xx+1)*W/5,(yy+1)*H/4,9+rx(),8+ry());
   }
   connectSet(rooms,D.loops,D.style==='zone-network'?2:1);start=rooms[0];break;
  }
  case 'long-facility': {
   const horizontal=W>=H,count=N+2,list=[];
   for(let k=0;k<count;k++){
    const t=(k+.5)/count;
    const q=center(horizontal?t*W:W*.5+(k%2?W*.22:-W*.22),horizontal?H*.5+(k%2?H*.16:-H*.16):t*H,horizontal?Math.max(12,W/count*.75):13, horizontal?13:Math.max(12,H/count*.7),k%3?'rect':'octagon');
    list.push(q);
    if(k)line(list[k-1],q,k%4===0?2:1,'bent');
    for(let side of [-1,1]){const b=center(q.x+(horizontal?0:side*(9+rx())),q.y+(horizontal?side*(9+ry()):0),8+rx(),8+ry());line(q,b,1,'bent')}
   }
   connectSet(list,D.loops,1);start=list[0];break;
  }
  case 'asym-campus':
  case 'open-yard': {
   for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){
    const dx=(x-W/2)/(W*.53),dy=(y-H/2)/(H*.53),edge=dx*dx+dy*dy;
    if(edge<.78+(r()-.5)*.12)set(x,y);
   }
   const list=[];
   if(D.style==='asym-campus'){
    const n=7+Math.floor(r()*5);
    for(let k=0;k<n;k++){
     const x=4+r()*(W-8),y=4+r()*(H-8),q=center(x,y,8+rx(),7+ry(),k%2?'rect':'cross');
     for(let xx=q.x0;xx<=q.x1;xx++){set(xx,q.y0,'#');set(xx,q.y1,'#')}
     for(let yy=q.y0;yy<=q.y1;yy++){set(q.x0,yy,'#');set(q.x1,yy,'#')}
     set(q.x,q.y0);list.push(q);
    }
   }else{
    const n=7+Math.floor(r()*5);
    for(let k=0;k<n;k++){const q=center(4+r()*(W-8),4+r()*(H-8),12+rx(),9+ry(),k%2?'octagon':'rect');list.push(q)}
   }
   connectSet(list,D.loops,1);
   for(let k=0;k<Math.floor(W*H*.035);k++){const x=2+Math.floor(r()*(W-4)),y=2+Math.floor(r()*(H-4));if(floor(x,y)&&DIRS.filter(([dx,dy])=>floor(x+dx,y+dy)).length>=3&&r()<.4)set(x,y,'#')}
   start=nearest(W*.08|0,H*.12|0);break;
  }
  case 'reactor-radial': {
   const hub=center(W*.5,H*.5,Math.min(W,H)*.27,Math.min(W,H)*.27,'octagon'),list=[hub],count=10;
   const radius=Math.min(W,H)*.34,outer=[];
   for(let k=0;k<count;k++){
    const a=2*Math.PI*k/count,q=center(W*.5+Math.cos(a)*radius,H*.5+Math.sin(a)*radius,10+rx(),9+ry(),k%2?'oval':'rect');
    outer.push(q);list.push(q);line(hub,q,k%2?1:2);
   }
   for(let k=0;k<count;k+=2)line(outer[k],outer[(k+2)%count],1,'bent');
   start=hub;break;
  }
  case 'organic-hive': {
   const hub=center(W*.5,H*.5,17,15,'oval'),list=[hub],n=N+2;
   for(let k=0;k<n;k++){
    const a=2*Math.PI*k/n,radius=Math.min(W,H)*(.25+r()*.15),q=center(W*.5+Math.cos(a)*radius,H*.5+Math.sin(a)*radius,8+rx(),8+ry(),'oval');
    line(list[list.length-1],q,1,'bent');list.push(q);
    const branch=center(q.x+jitter(0,18),q.y+jitter(0,18),7+rx(),7+ry(),'oval');line(q,branch,1,'bent');list.push(branch);
   }
   connectSet(list,D.loops,1);start=hub;break;
  }
  default: throw new Error('Unknown architecture: '+D.style);
 }

 if(!start)throw new Error('No start room for '+D.style);
 start=nearest(start.x,start.y);set(start.x,start.y);
 return {W,H,g,rooms,edges,start,inside,floor,set,room};
}

function components(map){
 const {W,H,g}=map,seen=new Uint8Array(W*H),out=[];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
  const s=y*W+x;if(seen[s]||!['.','P','D','R','B','S','E'].includes(g[y][x]))continue;
  const q=[s];seen[s]=1;
  for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cy=c/W|0;for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy,n=ny*W+nx;if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&!seen[n]&&['.','P','D','R','B','S','E'].includes(g[ny][nx])){seen[n]=1;q.push(n)}}}
  out.push(q);
 }
 return out;
}

function connectComponents(map){
 const {W,H,g}=map;
 for(let attempt=0;attempt<W*H;attempt++){
  const comps=components(map);if(comps.length<=1)return comps.length;
  const a=comps[0],b=comps[1];let ca=a[0],cb=b[0],best=Infinity;
  for(const x of a)for(const y of b){
   const d=Math.abs(x%W-y%W)+Math.abs((x/W|0)-(y/W|0));
   if(d<best){best=d;ca=x;cb=y}
  }
  let x=ca%W,y=ca/W|0,bx=cb%W,by=cb/W|0;
  while(x!==bx){if(!['P','E','D','R','B','S'].includes(g[y][x]))g[y][x]='.';x+=Math.sign(bx-x)}
  while(y!==by){if(!['P','E','D','R','B','S'].includes(g[y][x]))g[y][x]='.';y+=Math.sign(by-y)}
  if(!['P','E','D','R','B','S'].includes(g[y][x]))g[y][x]='.';
 }
 return components(map).length;
}

function finishMap(i,D,map,r){
 const {W,H,g,start,rooms}=map,flat=(x,y)=>y*W+x,pass=(x,y)=>x>0&&y>0&&x<W-1&&y<H-1&&['.','P'].includes(g[y][x]);
 let comps=components(map),guard=0;
 while(comps.length>1&&guard++<comps.length+2){
  const a=comps[0],b=comps[1];let bestA=a[0],bestB=b[0],best=Infinity;
  for(const ca of a)for(const cb of b){const ax=ca%W,ay=ca/W|0,bx=cb%W,by=cb/W|0,d=Math.abs(ax-bx)+Math.abs(ay-by);if(d<best){best=d;bestA=ca;bestB=cb}}
  let x=bestA%W,y=bestA/W|0,bx=bestB%W,by=bestB/W|0;
  while(x!==bx){g[y][x]='.';x+=Math.sign(bx-x)}
  while(y!==by){g[y][x]='.';y+=Math.sign(by-y)}
  g[y][x]='.';comps=components(map);
 }
 const startIndex=flat(start.x,start.y),dist=new Int32Array(W*H).fill(-1),parent=new Int32Array(W*H).fill(-1),queue=[startIndex];dist[startIndex]=0;
 for(let h=0;h<queue.length;h++){const c=queue[h],x=c%W,y=c/W|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,n=flat(nx,ny);if(pass(nx,ny)&&dist[n]<0){dist[n]=dist[c]+1;parent[n]=c;queue.push(n)}}}
 let end=queue[0];for(const c of queue)if(dist[c]>dist[end])end=c;
 const route=[];for(let c=end;c>=0;c=parent[c])route.unshift(c);
 const items=[],enemies=[],props=[],lifts=[],stairs=[],events=[],terminals=[];
 const floorCells=queue.filter(c=>pass(c%W,c/W|0)),pick=list=>list[Math.floor(r()*list.length)];
 const pos=c=>[c%W,c/W|0],available=floorCells.filter(c=>dist[c]>3);
 const exitBase=pos(end);let ex=-1,ey=-1;
 for(const[dx,dy]of DIRS){const x=exitBase[0]+dx,y=exitBase[1]+dy;if(map.inside(x,y)&&g[y][x]==='#'){ex=x;ey=y;break}}
 if(ex<0){const c=route[Math.max(0,route.length-2)];[ex,ey]=pos(c);g[ey][ex]='.'}

 const canReachExit=()=>{
  const seen=new Uint8Array(W*H),q=[startIndex];seen[startIndex]=1;
  for(let h=0;h<q.length;h++){
   const c=q[h];if(c===end)return true;
   const x=c%W,y=c/W|0;
   for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,n=flat(nx,ny),tile=g[ny]?.[nx];
    if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&!seen[n]&&['.','P','D','R','B','E'].includes(tile)){seen[n]=1;q.push(n)}
   }
  }
  return false;
 };
 const optionalDoor=(kind)=>{
  const candidates=floorCells.filter(c=>c!==startIndex&&c!==end&&g[c/W|0][c%W]==='.');
  for(let attempt=0;attempt<Math.min(120,candidates.length);attempt++){
   const k=Math.floor(r()*candidates.length),c=candidates.splice(k,1)[0],x=c%W,y=c/W|0;
   g[y][x]=kind;
   if(canReachExit())return c;
   g[y][x]='.';
  }
  return null;
 };
 const red=optionalDoor('R'),blue=red===null?null:optionalDoor('B');
 const nearby=floorCells.filter(c=>dist[c]>=3&&dist[c]<=Math.max(12,dist[end]*.16)&&g[c/W|0][c%W]==='.');
 const keySpots=[];
 while(nearby.length&&keySpots.length<(blue===null?(red===null?0:1):2)){
  const k=Math.floor(r()*nearby.length),c=nearby.splice(k,1)[0];
  if(keySpots.every(q=>Math.abs(q%W-c%W)+Math.abs((q/W|0)-(c/W|0))>3))keySpots.push(c);
 }
 if(red!==null&&keySpots[0]!==undefined)items.push([...pos(keySpots[0]),'r']);
 if(blue!==null&&keySpots[1]!==undefined)items.push([...pos(keySpots[1]),'b']);
 const doorCandidates=route.filter((c,k)=>k>route.length*.18&&k<route.length*.82&&g[c/W|0][c%W]==='.');
 for(let k=0;k<Math.min(2,doorCandidates.length);k++){const c=doorCandidates[Math.floor((k+1)*doorCandidates.length/3)];g[c/W|0][c%W]='D'}
 g[ey][ex]='E';

 const secretCandidates=[];
 for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++)if(g[y][x]==='#'){
  for(const[dx,dy]of DIRS){
   if(!pass(x-dx,y-dy)||!map.inside(x+dx,y+dy)||g[y+dy][x+dx]!=='#')continue;
   let clear=true;
   for(let t=1;t<=3&&clear;t++)for(let side=-1;side<=1;side++){
    const xx=x+dx*t+(dy?side:0),yy=y+dy*t+(dx?side:0);
    if(!map.inside(xx,yy)||g[yy][xx]!== '#')clear=false;
   }
   if(clear)secretCandidates.push([x,y,dx,dy]);
  }
 }
 let secretCount=0;
 while(secretCandidates.length&&secretCount<1+(i%3===0?1:0)){
  const k=Math.floor(r()*secretCandidates.length),[x,y,dx,dy]=secretCandidates.splice(k,1)[0];
  if(g[y][x]!=='#')continue;
  g[y][x]='S';
  for(let t=1;t<=3;t++)for(let side=-1;side<=1;side++)g[y+dy*t+(dx?side:0)][x+dx*t+(dy?side:0)]='.';
  const sx=x+dx*2,sy=y+dy*2;items.push([sx,sy,secretCount%2?'A':'k']);secretCount++;
  rooms.push({x:sx,y:sy,x0:sx-2,y0:sy-2,x1:sx+2,y1:sy+2,w:5,h:5,shape:'secret'});
 }
 if(secretCount===0){
  for(const c of floorCells){
   if(dist[c]<6||c===end)continue;
   const x=c%W,y=c/W|0;
   for(const[dx,dy]of DIRS){
    const sx=x+dx,sy=y+dy,bx=sx+dx,by=sy+dy;
    if(!map.inside(sx,sy)||!map.inside(bx,by)||g[sy][sx]!=='#'||g[by][bx]!=='#')continue;
    if(DIRS.some(([ox,oy])=>(ox!==-dx||oy!==-dy)&&(['.','P','D','R','B','E'].includes(g[sy+oy]?.[sx+ox]))))continue;
    g[sy][sx]='S';g[by][bx]='.';
    items.push([bx,by,'k']);rooms.push({x:bx,y:by,x0:bx-1,y0:by-1,x1:bx+1,y1:by+1,w:3,h:3,shape:'secret'});
    secretCount=1;break;
   }
   if(secretCount)break;
  }
 }

 const used=new Set([startIndex,end]);
 for(const it of items)used.add(flat(it[0],it[1]));
 const farCells=available.filter(c=>!used.has(c));
 for(let k=0;k<10+Math.floor(r()*7);k++){
  if(!farCells.length)break;
  const c=pick(farCells);items.push([c%W,c/W|0,'asckhHA'[Math.floor(r()*7)]]);
 }
 for(const weapon of Object.keys(UNL))if(UNL[weapon]===i&&i>0&&farCells.length){
  const c=pick(farCells);items.push([c%W,c/W|0,'w',+weapon]);
 }
 if(farCells.length){const c=pick(farCells);items.push([c%W,c/W|0,'Q'])}

 const episode=Math.floor(i/LEVELS_PER_EPISODE),stage=i%LEVELS_PER_EPISODE,tier=Math.floor(i/8),enemyCount=Math.min(48,9+Math.floor(i*.65)+Math.floor(r()*5));
 const spawnCells=available.filter(c=>Math.hypot(c%W-start.x,(c/W|0)-start.y)>7&&!used.has(c));
 const usedSpawns=new Set();
 for(let k=0;k<enemyCount&&spawnCells.length;k++){
  let c=pick(spawnCells),tries=0;
  while(usedSpawns.has(c)&&tries++<12)c=pick(spawnCells);
  usedSpawns.add(c);
  const types=POOL2.slice(0,Math.min(POOL2.length,6+tier*3));
  const type=k%4===0?EPF[episode][(stage+k)%EPF[episode].length]:types[(i*5+k*3)%types.length];
  enemies.push([c%W,c/W|0,type]);
 }
 if(stage===4&&spawnCells.length){const c=pick(spawnCells);enemies.push([c%W,c/W|0,RARE[episode%RARE.length]])}
 if(stage===11){const q=rooms[Math.floor(rooms.length/2)]||start;enemies.push([q.x,q.y,BOSS[episode]])}

 const liftCells=available.filter(c=>!used.has(c)&&!usedSpawns.has(c)&&g[c/W|0][c%W]==='.');
 if(liftCells.length>50){
  const a=pick(liftCells),ax=a%W,ay=a/W|0;
  const candidates=liftCells.filter(c=>Math.abs(c%W-ax)+Math.abs((c/W|0)-ay)>Math.min(W,H)*.35);
  if(candidates.length){const b=pick(candidates);lifts.push([ax,ay,b%W,b/W|0])}
 }
 const corridorCells=available.filter(c=>{
  const x=c%W,y=c/W|0,n=DIRS.filter(([dx,dy])=>pass(x+dx,y+dy)).length;
  return n===2&&g[y][x]==='.';
 });
 const pl=[];
 for(let k=0;k<Math.min(3,Math.max(1,Math.floor(D.loops/3)));k++){
  if(!corridorCells.length)break;
  const c=pick(corridorCells),x=c%W,y=c/W|0;
  if(r()<.5){pl.push([x,y,1]);if(y+1<H&&g[y+1][x]==='.')pl.push([x,y+1,1])}
  else pl.push([x,y,2]);
 }
 const pthemes=THEMES[i>>1][10],propsCount=Math.min(45,10+Math.floor(r()*15));
 for(let k=0;k<propsCount&&available.length;k++){const c=pick(available);props.push([c%W,c/W|0,pthemes[Math.floor(r()*pthemes.length)]])}

 const allyId=allyAt(i),ally=[];
 if(allyId!==null&&available.length){const c=available.find(c=>dist[c]>5&&dist[c]<16)||available[0];ally.push([c%W,c/W|0,allyId])}
 for(const item of termAt(i)){if(available.length){const c=available.find(c=>dist[c]>7)||available[0];terminals.push([c%W,c/W|0,item])}}
 const keys=['pwr','amb','rsv','alm','blk'];
 for(let k=0;k<(episode===0?1:2+(stage%2));k++)if(available.length){const c=pick(available);events.push([c%W,c/W|0,episode===0?'pwr':keys[(i+k*2)%keys.length]])}
 for(let x=2;x<W-2;x++)for(let y=2;y<H-2;y++)if(g[y][x]==='#'&&DIRS.filter(([dx,dy])=>pass(x+dx,y+dy)).length===1&&r()<.12)g[y][x]=THEMES[i>>1][9][Math.floor(r()*2)];

 g[start.y][start.x]='P';
 return {
  n:LEVEL_NAMES[i],m:g.map(row=>row.join('')),e:enemies,i:items,t:[],r:[],a:ally,tm:terminals,v:events,
  pp:props,pl,lf:lifts,open:D.open,arch:D.style,theme:D.theme,dm:1+i*.004,sm:1+i*.002,
  meta:{seed:D.seed,style:D.style,rooms:rooms.map(q=>({x:q.x,y:q.y,x0:q.x0,y0:q.y0,x1:q.x1,y1:q.y1,w:q.w,h:q.h,shape:q.shape})),edges:map.edges,secretCount,exit:[ex,ey]}
 };
}

export function genLevel(i,seedOverride){
 if(!Number.isInteger(i)||i<0||i>=LEVEL_NAMES.length)throw new RangeError('Invalid campaign level: '+i);
 const D=LEVEL_BLUEPRINTS[i],seed=seedOverride===undefined?D.seed:seedOverride,r=random(seed);
 const generatedDesign={...D,seed};
 const layout=createMap(generatedDesign,r);
 const result=finishMap(i,generatedDesign,layout,r);
 const map={W:D.width,H:D.height,g:result.m.map(row=>[...row])};
 const componentCount=connectComponents(map);
 result.m=map.g.map(row=>row.join(''));
 if(componentCount!==1)throw new Error(`Invalid generated map ${i}: ${componentCount} disconnected components`);
 if(result.meta.secretCount<1)throw new Error(`Invalid generated map ${i}: no discoverable secret`);
 return result;
}
