import {setVol} from '../audio/sfx.js';
export const SAVE_V=4,KEY='omega_save_v4',PKEY='omega_progress_v1',CKEY='omega_cfg';
export const DEF={df:1,sens:4,spd:5,sm:5,shk:4,fxi:6,nav:1,calm:0,vm:.7,vs:.9};
export function applyCfg(game){const c=readCfg();game.df=c.df;game.sens=c.sens;game.spd=.6+.08*c.spd;game.smo=c.sm;game.calm=c.calm?1:0;game.shkAmp=c.calm?0:c.shk/10;game.fxF=c.calm?Math.min(.3,c.fxi/6):c.fxi/6;game.navMode=c.nav;game.vm=c.vm;game.vs=c.vs;setVol(c.vm,c.vs)}
export function readCfg(){try{return Object.assign({},DEF,JSON.parse(localStorage.getItem(CKEY)||'{}'))}catch(e){return{...DEF}}}
export function writeCfg(c){try{localStorage.setItem(CKEY,JSON.stringify(c))}catch(e){}}
export function readSave(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x||x.v!==SAVE_V||!x.p||!Array.isArray(x.p.am)||!(x.li>=0&&x.li<=99))return null;return x}catch(e){return null}}
export function readProg(){try{const x=JSON.parse(localStorage.getItem(PKEY)||'null');if(x&&Array.isArray(x.done))return{done:x.done,met:x.met||[],T:x.T||[0,0,0]}}catch(e){}
 const s=readSave();if(s){const d=new Set(s.done||[]);for(let k=0;k<s.li;k++)d.add(k);return{done:[...d],met:s.met||[],T:s.T||[0,0,0]}}return{done:[],met:[],T:[0,0,0]}}
export function writeProg(p){try{localStorage.setItem(PKEY,JSON.stringify(p))}catch(e){}}
export const unlocked=(done,i)=>i===0||done.includes(i-1)||done.includes(i);
export function resetAll(){try{localStorage.removeItem(PKEY);localStorage.removeItem(KEY)}catch(e){}}
export function hasOld(){try{return!!localStorage.getItem('omega_save')||(!!localStorage.getItem(KEY)&&!readSave())}catch(e){return false}}
export function delOld(){try{localStorage.removeItem('omega_save');if(localStorage.getItem(KEY)&&!readSave())localStorage.removeItem(KEY)}catch(e){}}
export function sv(game){try{writeProg({done:game.done,met:game.met,T:[game.TK,game.TS,game.TT]});if(game.p&&game.lv)localStorage.setItem(KEY,JSON.stringify({v:SAVE_V,li:game.li,sd:game.li*7919+13,k:game.kills,p:game.p,T:[game.TK,game.TS,game.TT],met:game.met,done:game.done,sec:game.sf}))}catch(e){}}
export function ld(game){applyCfg(game);const pr=readProg();game.done=pr.done;game.met=pr.met;[game.TK,game.TS,game.TT]=pr.T}
export function gs(game){game.oldSave=hasOld();return readSave()}
