import {ctx,musOut} from './sfx.js';
const T=(r,s,b,l,w,lw,k,t)=>({r,s,b,l,w,lw,k,t}),M7=[0,2,3,5,7,8,10];
const TH=[T(33,M7,'0.0.3.0.5.0.3.2.','....4...2...5...','triangle','square','x...x...x...x...',140),
T(35,[0,3,5,6,7,10],'0..0.0..0.3.5.0.','2.4.....5.4.....','sawtooth','square','x..xx..xx..xx..x',120),
T(31,[0,1,3,5,6,8,10],'0.1.0.1.3.1.0.6.','.5..3...6..1....','triangle','sine','x.......x.......',165),
T(30,M7,'0000.000.0000.00','....5.....3.....','sawtooth','sawtooth','x.x.x.x.x.x.x.x.',110),
T(34,[0,2,3,5,7,8,11],'0.......3.......','..4...2...5.6...','sine','triangle','x.......',190),
T(28,[0,1,4,5,7,8,11],'0.0.0.1.0.0.4.1.','5.3.4.....2.1...','sawtooth','square','x...x.x.x...x.x.',125),
T(29,[0,2,3,6,7,8,11],'0..3..5..3..0...','.6.5.4.3.2.1...','triangle','sawtooth','x.....x.x.....x.',150),
T(38,[0,2,4,7,9],'0.0.2.0.3.0.2.4.','4.3.2.3.4.3.2.1.','square','square','x.x.x.x.x.x.xxx.',105),
T(32,M7,'0.3.0.5.0.3.0.7.','6.5.4.5.6.5.4.3.','sawtooth','triangle','x...x...x..xx...',135),
T(27,[0,1,3,6,7,8,10],'0.0.1.0.0.0.6.0.','3.4.5.6.5.4.3.1.','sawtooth','sawtooth','x.x.x.x.xxx.x.x.',100)];
const MENU=T(36,[0,2,4,5,7,9,11],'0...4...5...3...','....2...4...5...','triangle','sine','x.......x.......',170),FIN=T(48,[0,2,4,7,9],'0...2...4...3...','4.3.2.3.4...0...','triangle','sine','x.......',200);
const BS=[[0,1,4,5,7,8,11],[0,2,3,6,7,8,10],[0,3,5,6,7,10,11]],BB=['0.0.1.0.0.3.0.1.','0.0.0.6.0.0.5.4.','0.1.0.1.0.3.0.5.'],BL=['5.4.3.4.5.6.5.4.','..6...5...4.3...','3.5.6.5.3.1.2.3.'];
const bossTh=id=>id===28?T(24,[0,1,3,6,7,8,10],'0.0.1.0.0.6.1.0.','5.6.7.8.9.8.7.6.','sawtooth','square','x.x.xxx.x.x.xxx.',72):T(24+id%7,BS[id%3],BB[id%3],BL[id%3],'sawtooth',id%2?'square':'sawtooth','x.x.x.xxx.x.x.xx',80+(id%5)*7);
export const MU={t:0,n:0,key:null,th:null,
 go(ep,bs){const key=bs?'b'+bs:ep;if(this.t&&this.key===key)return;this.stop();this.key=key;this.th=bs?bossTh(bs):ep===-1?MENU:ep===-2?FIN:TH[ep%10];this.n=0;try{ctx().resume&&ctx().resume();this.t=setInterval(()=>this.tick(),this.th.t)}catch(e){this.t=0}},
 stop(){clearInterval(this.t);this.t=0;this.key=null},
 tick(){try{const th=this.th,n=this.n++,st=n%16,A=ctx(),t=A.currentTime,m=x=>440*Math.pow(2,(x-69)/12),deg=d=>th.r+th.s[d%th.s.length]+12*(d/th.s.length|0);
  const o=(f,dur,ty,v)=>{const a=A.createOscillator(),g=A.createGain();a.type=ty;a.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);a.connect(g);g.connect(musOut());a.start(t);a.stop(t+dur)};
  const b=th.b[st];if(b&&b!=='.')o(m(deg(+b)),th.t/1000*1.6,th.w,.05);const l=th.l[st];if(l&&l!=='.')o(m(deg(+l)+12),th.t/1000*1.1,th.lw,.022);if(th.k[st%th.k.length]==='x')o(60,.18,'sine',.09)}catch(e){}}};
