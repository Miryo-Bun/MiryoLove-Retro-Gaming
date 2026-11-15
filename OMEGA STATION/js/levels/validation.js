import {ARCHITECTURES,genLevel} from './generator.js';

const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const WALK=new Set(['.','P','D','R','B','E','S']);

function routeCheck(level){
 const H=level.m.length,W=level.m[0].length,map=level.m.map(row=>[...row]);
 let start=-1,exit=-1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(map[y][x]==='P')start=y*W+x;
  if(map[y][x]==='E')exit=y*W+x;
 }
 const keys=new Map();
 for(const [x,y,k] of level.i||[])if(k==='r'||k==='b')keys.set(y*W+x,k==='r'?1:2);
 const lifts=[];
 for(const [x,y,bx,by] of level.lf||[]){
  const a=y*W+x,b=by*W+bx;
  if(!WALK.has(map[y]?.[x])||!WALK.has(map[by]?.[bx]))return {ok:false,reason:'elevator endpoint is blocked'};
  lifts.push([a,b]);
 }
 if(start<0||exit<0)return {ok:false,reason:'missing start or exit'};
 const teleports=new Map();
 for(const[a,b]of lifts){teleports.set(a,[...(teleports.get(a)||[]),b]);teleports.set(b,[...(teleports.get(b)||[]),a])}
 const seen=new Set(),queue=[[start,0]],stateKey=(c,k)=>c*4+k;
 seen.add(stateKey(start,0));
 let reachedExit=false,maxKeys=0;
 for(let h=0;h<queue.length;h++){
  const [cell,owned]=queue[h],x=cell%W,y=cell/W|0;
  maxKeys=Math.max(maxKeys,owned);
  if(cell===exit)reachedExit=true;
  const next=DIRS.map(([dx,dy])=>(y+dy)*W+x+dx).concat(teleports.get(cell)||[]);
  for(const n of next){
   const nx=n%W,ny=n/W|0,tile=map[ny]?.[nx];
   if(tile===undefined||!WALK.has(tile))continue;
   if(tile==='R'&&!(owned&1)||tile==='B'&&!(owned&2))continue;
   let k=owned|(keys.get(n)||0),sk=stateKey(n,k);
   if(!seen.has(sk)){seen.add(sk);queue.push([n,k])}
  }
 }
 const requiredKeys=(map.some(row=>row.includes('R'))?1:0)|(map.some(row=>row.includes('B'))?2:0);
 const keysReachable=(maxKeys&requiredKeys)===requiredKeys;
 return {ok:reachedExit&&keysReachable,reason:!keysReachable?'required key unreachable':reachedExit?'':'exit unreachable with key progression',states:seen.size,lifts:lifts.length,maxKeys,requiredKeys};
}

function mapMetrics(level){
 const H=level.m.length,W=level.m[0].length,walk=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&WALK.has(level.m[y][x]);
 let deadEnds=0,junctionTiles=0,corridor=0,walkable=0,edges=0;
 const degrees=[0,0,0,0,0];
 const junctions=new Uint8Array(W*H);
 const visited=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(walk(x,y)){
  walkable++;
  const d=DIRS.reduce((n,[dx,dy])=>n+(walk(x+dx,y+dy)?1:0),0);
  degrees[d]++;if(d===1)deadEnds++;if(d>=3){junctions[y*W+x]=1;junctionTiles++}if(d===2)corridor++;
  edges+=d;
 }
 let componentCount=0;
 for(let c=0;c<visited.length;c++)if(!visited[c]&&walk(c%W,c/W|0)){
  componentCount++;const q=[c];visited[c]=1;
  for(let h=0;h<q.length;h++){const n=q[h],x=n%W,y=n/W|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,ni=ny*W+nx;if(walk(nx,ny)&&!visited[ni]){visited[ni]=1;q.push(ni)}}}
 }
 let intersections=0;
 for(let c=0;c<junctions.length;c++)if(junctions[c]){
  intersections++;const q=[c];junctions[c]=0;
  for(let h=0;h<q.length;h++){const n=q[h],x=n%W,y=n/W|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,ni=ny*W+nx;if(nx>=0&&ny>=0&&nx<W&&ny<H&&junctions[ni]){junctions[ni]=0;q.push(ni)}}}
 }
 const rooms=level.meta?.rooms||[],areas=rooms.map(q=>q.w*q.h).sort((a,b)=>a-b);
 return {
  width:W,height:H,aspect:+(W/H).toFixed(2),rooms:rooms.length,
  roomAreaMedian:areas.length?areas[areas.length>>1]:0,
  roomSizeBuckets:{small:areas.filter(a=>a<100).length,medium:areas.filter(a=>a>=100&&a<250).length,large:areas.filter(a=>a>=250).length},
  corridorTiles:corridor,corridorFraction:+(corridor/Math.max(1,walkable)).toFixed(3),
  intersections,junctionTiles,deadEnds,components:componentCount,branching:+(intersections/Math.max(1,walkable)).toFixed(4),
  cycleRank:Math.max(0,edges/2-walkable+componentCount),secrets:level.meta?.secretCount||0,
  walkable,style:level.arch,theme:level.theme,degrees
 };
}

function canonicalForms(level,size=20){
 const H=level.m.length,W=level.m[0].length;
 const source=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>{
  const sx=Math.min(W-1,Math.floor((x+.5)*W/size)),sy=Math.min(H-1,Math.floor((y+.5)*H/size));
  return WALK.has(level.m[sy][sx])?'1':'0';
 }));
 const forms=[];
 for(let flip=0;flip<2;flip++)for(let rotate=0;rotate<4;rotate++){
  let a=source.map(row=>row.slice());
  if(flip)a=a.map(row=>row.reverse());
  for(let turn=0;turn<rotate;turn++)a=a[0].map((_,x)=>a.map(row=>row[x]).reverse());
  forms.push(a.flat().join(''));
 }
 return forms;
}

function spatialSimilarity(a,b){
 let best=0;
 for(const x of a)for(const y of b){
  let intersection=0,union=0;
  for(let i=0;i<x.length;i++){if(x[i]==='1'&&y[i]==='1')intersection++;if(x[i]==='1'||y[i]==='1')union++}
  if(union)best=Math.max(best,intersection/union);
 }
 return best;
}

function graphSignature(metrics){
 return [metrics.rooms,metrics.intersections,metrics.deadEnds,metrics.degrees.join(','),metrics.cycleRank|0].join(':');
}

export function validateMaps(count=100,baseSeed=0x5a17){
 if(!Number.isInteger(count)||count<1)throw new RangeError('Map count must be a positive integer');
 const maps=[],failures=[];
 for(let n=0;n<count;n++){
  const index=n%36,seed=(baseSeed+Math.imul(n+1,7919))>>>0;
  const level=genLevel(index,seed),route=routeCheck(level),metrics=mapMetrics(level);
  const expected=ARCHITECTURES.includes(level.arch);
  if(n<36&&genLevel(index,seed).m.join('\n')!==level.m.join('\n'))failures.push({sample:n,index,seed,reason:'seed is not reproducible'});
  if(!route.ok)failures.push({sample:n,index,seed,style:level.arch,reason:route.reason});
  if(!expected)failures.push({sample:n,index,seed,reason:'unknown architecture '+level.arch});
  if(!metrics.secrets)failures.push({sample:n,index,seed,style:level.arch,reason:'no secret'});
  if(metrics.components!==1)failures.push({sample:n,index,seed,style:level.arch,reason:`${metrics.components} disconnected walkable components`});
  maps.push({level,route,metrics,forms:canonicalForms(level)});
 }
 const nearDuplicates=[];
 for(let i=0;i<maps.length;i++)for(let j=i+1;j<maps.length;j++){
  const similarity=spatialSimilarity(maps[i].forms,maps[j].forms);
  if(similarity>=.94&&graphSignature(maps[i].metrics)===graphSignature(maps[j].metrics)){
   nearDuplicates.push({a:i,b:j,similarity:+similarity.toFixed(3),styleA:maps[i].metrics.style,styleB:maps[j].metrics.style});
  }
 }
 const styles=Object.fromEntries(ARCHITECTURES.map(style=>[style,maps.filter(m=>m.metrics.style===style).length]));
 return {
  count,failures,nearDuplicates,styles,
  summary:{
   minRooms:Math.min(...maps.map(m=>m.metrics.rooms)),maxRooms:Math.max(...maps.map(m=>m.metrics.rooms)),
   minWalkable:Math.min(...maps.map(m=>m.metrics.walkable)),maxWalkable:Math.max(...maps.map(m=>m.metrics.walkable)),
   componentRange:[Math.min(...maps.map(m=>m.metrics.components)),Math.max(...maps.map(m=>m.metrics.components))],
   widthRange:[Math.min(...maps.map(m=>m.metrics.width)),Math.max(...maps.map(m=>m.metrics.width))],
   heightRange:[Math.min(...maps.map(m=>m.metrics.height)),Math.max(...maps.map(m=>m.metrics.height))],
   meanIntersections:+(maps.reduce((s,m)=>s+m.metrics.intersections,0)/count).toFixed(1),
   meanDeadEnds:+(maps.reduce((s,m)=>s+m.metrics.deadEnds,0)/count).toFixed(1),
   meanSecrets:+(maps.reduce((s,m)=>s+m.metrics.secrets,0)/count).toFixed(2)
  },
  samples:maps.map(({level,route,metrics})=>({name:level.n,seed:level.meta.seed,route,metrics,map:level.m,items:level.i,lifts:level.lf,meta:level.meta}))
 };
}

export function validateCampaign(){
 const failures=[],levels=[];
 for(let index=0;index<36;index++){
  const level=genLevel(index),route=routeCheck(level),metrics=mapMetrics(level);
  if(!route.ok)failures.push({index,name:level.n,reason:route.reason});
  if(!metrics.secrets)failures.push({index,name:level.n,reason:'no secret'});
  if(metrics.components!==1)failures.push({index,name:level.n,reason:`${metrics.components} disconnected walkable components`});
  levels.push({index,name:level.n,seed:level.meta.seed,style:level.arch,route,metrics});
 }
 return {count:levels.length,failures,levels};
}
