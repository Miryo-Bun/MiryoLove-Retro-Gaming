let AC=null,GM=null,GS=null,VM=.7,VS=.9;
export function ctx(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();GM=AC.createGain();GS=AC.createGain();GM.gain.value=VM;GS.gain.value=VS;GM.connect(AC.destination);GS.connect(AC.destination)}return AC}
export const musOut=()=>{ctx();return GM};
export function setVol(m,s){VM=m;VS=s;if(GM){GM.gain.value=m;GS.gain.value=s}}
export function sfx(f,d,ty,v,sl){try{const A=ctx(),o=A.createOscillator(),g=A.createGain(),t=A.currentTime;o.type=ty||'square';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(v||.06,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(GS);o.start();o.stop(t+d)}catch(e){}}
