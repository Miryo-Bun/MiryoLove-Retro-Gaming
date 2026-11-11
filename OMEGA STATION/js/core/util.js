export const W=320,H=200;
let seed=7;
export const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
export const sh=(c,k)=>0xFF000000|((((c>>16)&255)*k>>8)<<16)|((((c>>8)&255)*k>>8)<<8)|((c&255)*k>>8);
export const flashC=c=>0xFF000000|(Math.min(255,((c>>16)&255)+70)<<16)|(Math.min(255,((c>>8)&255)+70)<<8)|Math.min(255,(c&255)+70);
export function mk(fn){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');fn(x);return new Uint32Array(x.getImageData(0,0,64,64).data.buffer)}
export const R=(x,c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};