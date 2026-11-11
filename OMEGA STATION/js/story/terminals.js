import {sfx} from '../audio/sfx.js';
import {LOGS} from './story.js';
export function nearTerm(game){const p=game.p;for(const t of game.lv.tm||[])if(Math.hypot(t.x-p.x,t.y-p.y)<1.5)return t;return null}
export function readTerm(game,t){const ep=game.li/10|0;game.dlg={name:'ТЕРМИНАЛ'+(t.read?' (ПРОЧИТАНО)':' · ЗАПИСЬ'),col:'#4f8',text:LOGS[ep][t.i%2],t:8};if(!t.read){t.read=1;game.p.sc+=100;sfx(900,.15,'square',.05,300)}}
