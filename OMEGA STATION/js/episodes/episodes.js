import {CEK,FLK,FM,TM,TX,skyGen,tint} from '../engine/textures.js';
export const LEVELS_PER_EPISODE=12;
export const CAMPAIGN_LEVELS=36;
export const EP=['EPISODE I — THE OUTBREAK','EPISODE II — DEEP SPACE','EPISODE III — OMEGA'];
export const LEVEL_NAMES=[
 'Arrival','Security Sector','Abandoned Hangar','Medical Complex','Research Laboratory','Reactor Access','Underground Storage','Communications','Containment Zone','Power Station','The Infested','The Beginning',
 'Outer Dock','Cargo District','Engineering','Maintenance Tunnels','Hydroponics','Military Sector','Orbital Factory','Waste Processing','Dark Laboratory','Reactor Core','The Breach','Deep Space',
 'Lower Station','Biohazard','Ancient Sector','Forgotten Facility','The Abyss','Core Complex','Omega Research','Experimental Zone','The Hive','Final Defense','Omega Station','Final Encounter'
];
export const BOSS=[9,21,28];
const BASE={46:TX[46],47:TX[47],48:TX[48],49:TX[49],50:TX[50],51:TX[51],52:TX[52],53:TX[53],54:TX[54],55:TX[55],1:TX[1],2:TX[2],20:TX[20],21:TX[21],22:TX[22],40:TX[40],41:TX[41],42:TX[42],43:TX[43],44:TX[44],45:TX[45]};
const SKY=[['#234','#68a'],['#432','#a86'],['#112','#336'],['#321','#975'],['#022','#4aa'],['#232','#686'],['#301','#a24'],['#024','#59c'],['#120','#9c4'],['#312','#a76'],['#210','#d83'],['#103','#76c']];
const ARCH=[
{nm:['НАУЧНАЯ ЛАБОРАТОРИЯ','ИССЛЕДОВАТЕЛЬСКИЙ ЦЕНТР','КАРАНТИННЫЙ БЛОК','ВИВАРИЙ'],b:[[46,2],[46,40],[2,42],[46,21]],f:[9,0,2,9],c:[3,0,3,0],p:[0,6,3,4,23,12],dk:['pl','lw','pw','wl'],cl:['rooms','hall'],op:['yard'],cw:[1,1,2,1],sh:[[0,3],[0,1,3],[0,2],[0,3,1]],ck:.02,pk:'lp'},
{nm:['ЗАВОД','ЛИТЕЙНЫЙ ЦЕХ','СБОРОЧНАЯ ЛИНИЯ','ХИМИЧЕСКИЙ КОМБИНАТ'],b:[[44,41],[44,21],[51,44],[41,1]],f:[1,2,1,2],c:[1,1,2,1],p:[2,7,8,11,1,23],dk:['xo','xo','ox','xx'],cl:['hall','rooms','ring'],op:['colony'],cw:[2,1,2,3],sh:[[0,2],[0],[0,3],[0,2,3]],ck:.04,pk:'xo'},
{nm:['СКЛАД','ГРУЗОВОЙ ТЕРМИНАЛ','АРХИВ','ХОЛОДИЛЬНЫЙ СКЛАД'],b:[[47,40],[47,44],[47,21],[40,41]],f:[2,7,2,7],c:[2,0,1,2],p:[1,16,7,9,24,3],dk:['xw','xx','xp','wx'],cl:['rooms','maze','ring'],op:['colony','yard'],cw:[1,2,1,2],sh:[[0,3],[0],[0,3],[0]],ck:.07,pk:'xx'},
{nm:['ТЕХНИЧЕСКИЕ КОРИДОРЫ','СЕРВИСНЫЕ ТОННЕЛИ','КАБЕЛЬНЫЙ ЯРУС','ВЕНТИЛЯЦИОННЫЕ ШАХТЫ'],b:[[42,51],[21,51],[42,2],[51,40]],f:[1,1,2,1],c:[1,2,1,2],p:[12,0,2,3,23,17],dk:['po','xo','pp','ow'],cl:['maze','rooms','ring'],op:['ruins'],cw:[1,1,1,2],sh:[[0],[0,3],[0],[0,2]],ck:.015,pk:'po'},
{nm:['АНГАРЫ','ДОКИ','ЛЁТНАЯ ПАЛУБА','РЕМОНТНЫЕ БОКСЫ'],b:[[21,41],[40,21],[41,44],[21,1]],f:[2,1,2,1],c:[2,3,2,1],p:[16,5,11,3,17,9],dk:['wx','xx','wp','xw'],cl:['hall','rooms'],op:['yard','colony'],cw:[3,2,2,3],sh:[[0],[0,2],[0],[0,3]],ck:.025,pk:'xp'},
{nm:['ЖИЛОЙ БЛОК','ОБЩЕЖИТИЕ','ЖИЛОЙ ПОСЁЛОК','КАЮТЫ'],b:[[50,40],[50,43],[50,47],[50,46]],f:[8,7,8,9],c:[3,0,3,0],p:[19,20,24,3,14,4],dk:['wp','wl','pp','lw'],cl:['rooms','ring','maze'],op:['colony'],cw:[1,1,2,1],sh:[[0,1],[0,3],[0],[0,1,2]],ck:.03,pk:'pl'},
{nm:['ВНУТРЕННИЙ ДВОР','СКВЕР','ПЛАЦ','ОРАНЖЕРЕЯ'],b:[[1,48],[43,48],[1,40],[43,1]],f:[4,3,4,2],c:[0,0,0,0],p:[14,15,13,1,3,5],dk:['xw','wx','xx','pw'],cl:['rooms','ring'],op:['yard','colony'],cw:[1,2,1,2],sh:[[0,1],[0],[0,1,3],[0,2]],ck:.03,pk:'xw'},
{nm:['РУИНЫ','РАЗРУШЕННЫЙ КВАРТАЛ','ОБЛОМКИ КОРПУСА','ПОГРЕБЁННАЯ БАЗА'],b:[[43,20],[20,48],[43,44],[20,1]],f:[3,2,3,4],c:[4,2,4,2],p:[18,13,5,15,14,9],dk:['xw','xx','xo','wx'],cl:['cave','rooms'],op:['ruins'],cw:[1,2,1,1],sh:[[0,1],[0,2],[0,1],[0]],ck:.05,pk:'xx'},
{nm:['ПЕЩЕРЫ','КРИСТАЛЬНЫЕ ГРОТЫ','ГРИБНЫЕ ШТОЛЬНИ','ЛЕДЯНЫЕ ПРОВАЛЫ'],b:[[49,20],[49,22],[49,48],[49,45]],f:[3,5,6,4],c:[4,4,4,2],p:[10,21,22,18,14,15],dk:['xo','ox','xx','wx'],cl:['cave','maze'],op:['ruins','yard'],cw:[1,1,2,1],sh:[[1],[1,0],[1],[1,2]],ck:.04,pk:'xo'},
{nm:['ПОДЗЕМНЫЙ КОМПЛЕКС','ГЛУБОКАЯ СТАНЦИЯ','БУНКЕР','МЕТРОПОЛИТЕН'],b:[[40,51],[21,20],[51,2],[40,42]],f:[1,2,1,2],c:[1,2,1,2],p:[2,12,0,23,6,24],dk:['pw','xo','pp','op'],cl:['ring','hall','maze'],op:['colony'],cw:[1,2,1,2],sh:[[0,3],[0],[0,2],[0,3]],ck:.025,pk:'po'},
{nm:['ЭНЕРГОСТАНЦИЯ','РЕАКТОРНЫЙ ЗАЛ','ПОДСТАНЦИЯ','КОНТУР ОХЛАЖДЕНИЯ'],b:[[42,41],[42,2],[41,21],[2,42]],f:[1,2,1,2],c:[1,1,0,2],p:[11,8,12,0,17,3],dk:['oo','op','ox','ow'],cl:['hall','ring'],op:['yard'],cw:[2,1,2,2],sh:[[0,1],[0,3],[0,1],[0,2]],ck:.03,pk:'oo'},
{nm:[],b:[[22,21],[44,41],[43,20],[49,22],[45,2],[22,42],[21,41],[40,22],[42,22],[41,22]],f:[5,2,3,6,6,5,1,2,1,5],c:[1,2,4,4,1,1,2,1,0,1],p:[13,5,18,10,8,3],dk:['ox','xo','xx','wx','ow','oo','xw','op','pw','ox'],cl:['hall','ring'],op:['arena'],cw:[2,2,3,2,2,3,2,3,2,2],sh:[[0,1],[0],[0,1],[1],[0,3],[0,1],[0,2],[0],[0,3],[0,1]],ck:.03,pk:'ox'}];
const AR_NM=['АРЕНА «ГОРН»','АРЕНА «СЕРДЦЕ СПОР»','АРЕНА «ПЛАВИЛЬНЯ»','АРЕНА «ГЛУБИННЫЙ ЗАЛ»','АРЕНА «ЛЕДЯНОЙ СОБОР»','АРЕНА «ОГНЕННЫЙ ЗАЛ»','АРЕНА «КРОВАВЫЙ КРУГ»','АРЕНА «ЖЕЛЕЗНАЯ БЕЗДНА»','АРЕНА «ПОСЛЕДНИЙ СПУСК»','АРЕНА «ТРОН OMEGA»'];
const fr=x=>x-Math.floor(x);
export const EP_ART=['INDUSTRIAL NIGHTMARE','BIOHAZARD','INFERNAL DIMENSION'];
const EP_ARCH=[[1,4,0,3,10,2],[0,5,0,8,2,9],[9,7,8,11,10,11]];
const EP_TINT=[[1.12,.91,.72],[.68,1.08,.77],[.55,.72,1.22]];
const EP_WALLS=[[52,55,51,41,21],[53,22,42,46,2],[54,20,49,22,55]];
const EP_SKY=[[0,1,2,3],[4,5,8,9],[6,10,11,7]];
const ENV_WALLS={
 production:[55,52,51,41,21],research:[46,53,42,22,2],reactor:[52,55,41,42,21],
 military:[51,44,55,40,21],logistics:[47,40,41,52,44],residential:[50,46,43,47,40],
 maintenance:[42,51,40,21,55],communications:[42,47,51,2,40],underground:[40,43,49,20,21],
 experimental:[53,54,22,42,21],biohazard:[53,22,42,46,2],infernal:[54,20,49,22,55]
};
const ENV_TINT={
 production:[1.06,.96,.82],research:[.88,1.05,.91],reactor:[1.12,.86,.68],
 military:[.92,.94,.88],logistics:[1,.94,.83],residential:[.91,.96,1.04],
 maintenance:[.82,.9,.98],communications:[.84,.96,1.12],underground:[.78,.8,.9],
 experimental:[.82,.98,1.12],biohazard:[.72,1.06,.76],infernal:[1.12,.72,.58]
};
const ENV_LIGHT={production:.9,research:1.04,reactor:.78,military:.92,logistics:1,residential:1.08,maintenance:.76,communications:.94,underground:.7,experimental:.82,biohazard:.72,infernal:.68};
export const environmentLight=environment=>ENV_LIGHT[environment]||1;
export const THEMES=Array.from({length:50},(_,t)=>{const ep=t<18?t/6|0:-1,stage=t%6,boss=ep>=0?stage===5:t%5===4;let a,v;if(ep>=0){a=ARCH[boss?11:EP_ARCH[ep][stage]];v=stage}else if(boss){a=ARCH[11];v=t/5|0}else{const k=t-(t/5|0);a=ARCH[k%11];v=k/11|0}
 const at=(arr,o=0)=>arr[(v+o)%arr.length],s=v+t,n=a.p.length,pal=ep>=0?EP_TINT[ep]:[.75+.5*fr(t*.618+.1),.75+.5*fr(t*.381+.4),.75+.5*fr(t*.236+.7)],sky=ep>=0?SKY[EP_SKY[ep][stage%4]]:SKY[(t*5+v)%12];
 return[boss?AR_NM[v]:a.nm[v%a.nm.length],at(a.b),pal,at(a.f),at(a.c),sky[0],sky[1],.78+.22*fr(t*.73),t%3===0?1:0,at(a.dk),[a.p[s%n],a.p[(s+1)%n],a.p[(s+3)%n]],{cl:a.cl,op:a.op,cw:at(a.cw),sh:at(a.sh),ck:a.ck*(.7+.6*fr(t*.31)),pk:a.pk}]});
export const themeOf=i=>i>>1;
export function wallSet(i,environment){const th=THEMES[themeOf(i)],m=th[2].map((v,k)=>v*(.88+.24*(Math.sin(i*78.233+k*3.7)+1)/2)),special=ENV_WALLS[environment]||EP_WALLS[themeOf(i)/6|0]||[23,24,25,26,27];return th[1].map(b=>tint(BASE[b],m)).concat(special.map(b=>tint(TX[b]||TX[23],m)))}
const FC=new Map(),SK=[];
export function floorSet(th,environment){const ep=th/6|0,base=THEMES[th][2],adj=ENV_TINT[environment]||[1,1,1],m=base.map((v,k)=>v*adj[k]),key=`${th}:${environment||''}`;if(!FC.has(key))FC.set(key,[tint(FLK[THEMES[th][3]],m),tint(CEK[THEMES[th][4]],m),FM.map(x=>tint(x,m))]);return FC.get(key)}
export function skySet(th){return SK[th]||(SK[th]=skyGen(THEMES[th][5],THEMES[th][6],th))}

export const EPD=[
 'Twelve sectors overrun by the Resonance. Fight through the station outbreak and find the source.',
 'Push beyond the hull through docks, factories, and reactor chambers into deep space.',
 'Descend into Omega Station’s oldest sectors and destroy the intelligence at its heart.'
];
export const epPage=e=>'episode-'+String(e+1).padStart(2,'0')+'.html';
