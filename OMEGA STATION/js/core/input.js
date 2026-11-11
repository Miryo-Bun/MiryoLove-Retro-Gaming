export class Input{
 constructor(onKey){this.onKey=onKey;this.k={};this.md=false;this.mx=0;
  addEventListener('keydown',e=>{this.k[e.code]=true;if(/^(Space|Arrow|Tab)/.test(e.code))e.preventDefault();this.onKey&&this.onKey(e.code)});
  addEventListener('keyup',e=>{this.k[e.code]=false});
  addEventListener('mousedown',e=>{if(e.button===0)this.md=true;if(e.button===2)this.md2=true});
  addEventListener('mouseup',e=>{if(e.button===0)this.md=false;if(e.button===2)this.md2=false});
  addEventListener('mousemove',e=>{if(document.pointerLockElement)this.mx+=e.movementX});
  addEventListener('wheel',e=>{this.wh=(this.wh||0)+Math.sign(e.deltaY)});
  addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('blur',()=>{this.k={};this.md=false})}
 d(c){return !!this.k[c]}
}