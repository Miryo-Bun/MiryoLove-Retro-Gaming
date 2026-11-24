import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1000)
        ev = pg.evaluate
        ev("(()=>{const p=RC.G.player;const q=RC.G.world.nearestWalk(-60,-60,10);p.x=q.x;p.z=q.z;RC.cam.snap(p.x,p.z);RC.G.peds.length=0;RC.G.cars.length=0;})()")
        # три машины в разной стадии повреждений
        ev("""(()=>{const {G}=RC;const p=G.player;const mk=(t,dx,hp)=>{const v=G.cars.push(Object.assign(new (RC.G.cars.constructor===Array?Object:Object)(),{}));G.cars.pop();};
          })()""")
        r = ev("""(()=>{const {G}=RC;const p=G.player;const C=RC.GA; return 0})()""")
        # используем spawnOut для создания машин
        ev("""(()=>{const {G,state}=RC;const p=G.player;RC.state.garage=[];
          for(const [t,dx,hpf] of [['sedan',-12,1],['sport',-6,0.6],['suv',0,0.4],['muscle',6,0.15]]){const e=RC.GA.addCar(t,2);const v=RC.GA.spawnOut(e,p.x+dx,p.z+8,0.3);v.hp=v.maxHp*hpf;}
          const e=RC.GA.addCar('van',1);const w=RC.GA.spawnOut(e,p.x+14,p.z+8,0.2);w.hp=0;w.wreck=true;})()""")
        pg.wait_for_timeout(600); pg.screenshot(path='/tmp/fx_damage.png')
        # взрыв
        ev("(()=>{const p=RC.G.player;RC.explode(p.x+4,p.z+14,{r:9,dmg:80})})()"); pg.wait_for_timeout(250); pg.screenshot(path='/tmp/fx_boom1.png')
        pg.wait_for_timeout(900); pg.screenshot(path='/tmp/fx_boom2.png')
        print('частиц:', ev("RC.G.fx.length"), 'следов:', ev("RC.G.decals.length"))
        # горящая машина взрывается сама
        ev("(()=>{const v=RC.G.cars.find(c=>c.wreck&&!c.charred);if(v)v.burnT=0.3;})()"); pg.wait_for_timeout(1500)
        print('сгоревших остовов:', ev("RC.G.cars.filter(c=>c.charred).length"))
        # разрушение предмета: фонарь
        ev("""(()=>{const {G}=RC;const d=G.world.decor.find(d=>d.name==='lamp'&&Math.abs(d.x-G.player.x)<80);window._d=d;const v=G.cars[0];v.x=d.x;v.z=d.z;v.vx=8;v.vz=0;v.hp=v.maxHp;v.wreck=false;})()""")
        pg.wait_for_timeout(500); print('фонарь разрушен:', ev("!!window._d.broken"))
        print('ошибки:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l][:5])
        b.close()
finally: srv.terminate()
