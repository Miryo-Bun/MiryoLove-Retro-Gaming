import {Game} from './core/game.js';
import {mainMenu} from './ui/menu.js';
import {ctx} from './audio/sfx.js';
import {MU} from './audio/music.js';
const d=document.body.dataset;
addEventListener('error',e=>console.error(e.message));
addEventListener('pointerdown',()=>{try{ctx().resume()}catch(e){}});
try{if(d.page==='menu'){mainMenu();addEventListener('pointerdown',()=>MU.go(-1,0),{once:true})}else window.game=new Game({ep:(+d.ep||1)-1})}
catch(e){console.error(e);document.body.insertAdjacentHTML('beforeend','<p style="color:#f55">Ошибка запуска: '+e.message+'</p>')}
