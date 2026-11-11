import {setVol} from '../audio/sfx.js';
import {DEF,delOld,hasOld,readCfg,readProg,readSave,resetAll,unlocked,writeCfg} from '../save/save.js';
import {EP,EPD,epPage} from '../episodes/episodes.js';
const $=id=>document.getElementById(id);
export function mainMenu(){const ot=$('ot'),op=$('op'),ob=$('ob'),ox=$('ox');ob.style.display='none';const cfg=readCfg();setVol(cfg.vm,cfg.vs);
 const prog=readProg(),sv_=readSave(),any=prog.done.length>0||!!sv_,page=e=>'episodes/'+epPage(e);
 const root=()=>{ot.textContent='OMEGA STATION';op.textContent='MiryoLove Retro Gaming — MiryoLove Product\nRetro games. Classic spirit. Freedom through technology.'+(hasOld()?'\n(Найдено несовместимое старое сохранение — оно не удалено; см. «Настройки».)':'');
  ox.innerHTML='<div class="col"><button id="mNew">НОВАЯ ИГРА</button><button id="mCont"'+(any?'':' disabled')+'>ПРОДОЛЖИТЬ</button><button id="mEp">ЭПИЗОДЫ</button><button id="mSet">НАСТРОЙКИ</button><button id="mCr">ТИТРЫ</button></div>';
  $('mNew').onclick=()=>{if(any&&!confirm('Начать новую кампанию? Прогресс и текущее сохранение будут сброшены.'))return;resetAll();location.href=page(0)+'#level=1'};
  $('mCont').onclick=()=>{if(sv_)location.href=page(sv_.li/10|0)+'#continue';else{let n=0;while(n<99&&prog.done.includes(n))n++;location.href=page(n/10|0)+'#level='+(n+1)}};
  $('mEp').onclick=episodes;$('mSet').onclick=settings;$('mCr').onclick=credits};
 const episodes=()=>{ot.textContent='ЭПИЗОДЫ';op.textContent='';ox.innerHTML='<div class="grid eps">'+EP.map((nm,e)=>{const dn=prog.done.filter(x=>x>=e*10&&x<e*10+10).length,un=unlocked(prog.done,e*10),h='<b>'+(e+1)+'. '+nm+'</b><i>'+EPD[e]+'</i><u>Пройдено '+dn+'/10 · '+(un?'открыт':'закрыт')+'</u>';return un?'<a class="card" href="'+page(e)+'">'+h+'</a>':'<div class="card lock">'+h+'</div>'}).join('')+'</div><button id="bk">НАЗАД</button>';$('bk').onclick=root};
 const settings=()=>{ot.textContent='НАСТРОЙКИ';op.textContent='';settingsPanel(ox,root,null)};
 const credits=()=>{ot.textContent='ТИТРЫ';op.textContent='OMEGA STATION\nMiryoLove Retro Gaming — MiryoLove Product\n\nКод, графика, музыка и звуки созданы программно.\nОригинальная игра: сюжет, персонажи, карты.\nЛицензия: GNU GPL-3.0-only.\n\nRetro games. Classic spirit. Freedom through technology.';ox.innerHTML='<button id="bk">НАЗАД</button>';$('bk').onclick=root};
 root()}
export function levelSelect(game){const e=game.epi,base=e*10,done=game.done,s=readSave(),dn=done.filter(x=>x>=base&&x<base+10).length;game.st='menu';
 game.show('ЭПИЗОД '+(e+1)+': '+EP[e],EPD[e]+'\nПройдено: '+dn+'/10','ГЛАВНОЕ МЕНЮ',()=>{location.href='../index.html'});
 let h='<div class="grid">';for(let k=0;k<10;k++){const n=base+k,ok=unlocked(done,n),d=done.includes(n);h+='<button class="lv '+(d?'done':ok?'ok':'lock')+'" data-l="'+n+'"'+(ok?'':' disabled')+'>'+(n+1)+'<small>'+(d?'пройден':ok?'открыт':'закрыт')+'</small></button>'}
 game.ox.innerHTML=h+'</div>'+(s&&(s.li/10|0)===e?'<button id="lC" style="margin-top:8px">ПРОДОЛЖИТЬ (УР. '+(s.li+1)+')</button>':'');
 if(game.ox.querySelectorAll)game.ox.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const n=+b.dataset.l;game.start(n,s&&s.li===n?s:undefined)});
 const c=document.getElementById('lC');if(c)c.onclick=()=>game.start(0,s)}

export function settingsPanel(ox,back,game){const c=readCfg(),g=id=>document.getElementById(id),row=(id,l,mn,mx,v)=>'<p>'+l+' <input id="'+id+'" type="range" min="'+mn+'" max="'+mx+'" value="'+v+'"> <span id="'+id+'v">'+v+'</span></p>';
 ox.innerHTML='<p>Сложность <select id="sD"><option>Лёгкая<option>Нормальная<option>Кошмар</select></p>'+row('sS','Чувствительность мыши',1,10,c.sens)+row('sV','Скорость движения',1,10,c.spd)+row('sC','Плавность камеры',0,10,c.sm)+row('sK','Тряска камеры',0,10,c.shk)+row('sX','Интенсивность эффектов',0,10,c.fxi)+'<p><label><input id="sCm" type="checkbox"'+(c.calm?' checked':'')+'> Щадящий режим (без тряски, вспышек и мерцания)</label></p><p>Навигационная стрелка <select id="sN"><option>Выкл<option>Лабиринты (закрытые уровни)<option>Всегда</select></p>'+row('sM','Музыка',0,10,Math.round(c.vm*10))+row('sF','Звук',0,10,Math.round(c.vs*10))+(hasOld()?'<p style="color:#fa0">Несовместимое старое сохранение<br><button id="sO" style="font-size:14px">УДАЛИТЬ СТАРОЕ СОХРАНЕНИЕ</button></p>':'')+'<p><button id="sR" style="font-size:16px">СТАНДАРТНЫЕ</button> <button id="bk">НАЗАД</button></p>';
 g('sD').selectedIndex=c.df;g('sN').selectedIndex=c.nav;
 const upd=()=>{const n={df:g('sD').selectedIndex,sens:+g('sS').value,spd:+g('sV').value,sm:+g('sC').value,shk:+g('sK').value,fxi:+g('sX').value,nav:g('sN').selectedIndex,calm:g('sCm').checked?1:0,vm:g('sM').value/10,vs:g('sF').value/10};writeCfg(n);for(const k of['sS','sV','sC','sK','sX','sM','sF'])g(k+'v').textContent=g(k).value;if(game)game.applyCfg();else setVol(n.vm,n.vs)};
 for(const i of['sD','sS','sV','sC','sK','sX','sN','sCm','sM','sF']){g(i).onchange=upd;g(i).oninput=upd}
 g('sR').onclick=()=>{writeCfg({...DEF});if(game)game.applyCfg();else setVol(DEF.vm,DEF.vs);settingsPanel(ox,back,game)};g('bk').onclick=back;
 if(hasOld())g('sO').onclick=()=>{if(confirm('Удалить несовместимое сохранение без возможности восстановления?')){delOld();settingsPanel(ox,back,game)}}}
