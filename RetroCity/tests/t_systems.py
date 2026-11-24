import sys, os, math, json; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1200)
        ev = pg.evaluate
        # ---------- A. Бой ----------
        ev("""(()=>{const {state,G}=RC;state.ownedWeapons=['fists','bat','pistol'];state.weaponIndex=2;state.ammo.pistol=30;
          const p=G.player;const q=G.world.nearestWalk(30,30,10);p.x=q.x;p.z=q.z;G.peds.length=0;
          const n=G.peds.push(Object.assign(new (G.peds.constructor===Array?Object:Object)(),{}));G.peds.length=0;})()""")
        # создаём NPC через экспортированный класс: берём существующий спавн
        ev("""(()=>{const {G}=RC;const p=G.player;for(let i=0;i<200&&G.peds.filter(x=>x.kind==='npc').length<30;i++){}})()""")
        pg.wait_for_timeout(1500)
        info = ev("""(()=>{const {G}=RC;const p=G.player;const c=G.peds.filter(x=>x.kind==='npc'&&!x.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
          const t=G.world.nearestWalk(p.x+6,p.z,5);c.x=t.x;c.z=t.z;c.mode='idle';c.timer=99;window._target=c;
          return {px:p.x,pz:p.z,cx:c.x,cz:c.z,hp:c.hp,sx:RC.cam.sx(c.x),sy:RC.cam.sz(c.z)}})()""")
        pg.mouse.move(info['sx'], info['sy']); pg.mouse.down(); pg.wait_for_timeout(1500); pg.mouse.up()
        res = ev("({dead:window._target.dead,hp:window._target.hp,ammo:RC.state.ammo.pistol,heat:RC.state.heat,wanted:RC.state.wanted,hpPed:window._target.mode})")
        print('A. бой:', res)
        ev("RC.state.heat=0")
        # ---------- B. Полиция ----------
        ev("(()=>{const {G,state}=RC;state.heat=3.2;state.health=100;})()")
        pg.wait_for_timeout(15000)
        pol = ev("""(()=>{const {G}=RC;const p=G.player;const cars=G.cars.filter(c=>c.ai?.kind==='police');const cops=G.peds.filter(c=>c.kind==='cop'&&!c.dead);
          return {wanted:RC.state.wanted,cars:cars.length,carDist:cars.map(c=>Math.round(Math.hypot(c.x-p.x,c.z-p.z))),cops:cops.length,copDist:cops.map(c=>Math.round(Math.hypot(c.x-p.x,c.z-p.z))),hp:RC.state.health,mode:RC.state.mode}})()""")
        print('B. полиция:', pol)
        pg.screenshot(path='/tmp/shot_police.png')
        ev("(()=>{RC.state.heat=0;})()"); pg.wait_for_timeout(14000)
        pol2 = ev("""(()=>{const {G}=RC;return {wanted:RC.state.wanted,cars:G.cars.filter(c=>c.ai?.kind==='police').length,cops:G.peds.filter(c=>c.kind==='cop'&&!c.dead).length,mode:RC.state.mode}})()""")
        print('B2. после сброса розыска:', pol2)
        # ---------- C. Поезд ----------
        ev("""(()=>{const {G,state}=RC;state.mode==='dead'&&0;const p=G.player;p.dead=false;state.health=100;state.mode='playing';document.getElementById('wasted').classList.add('hidden');
          const q=G.world.nearestWalk(2,112,6);p.x=q.x;p.z=q.z;RC.cam.snap(p.x,p.z);G.peds.forEach(c=>{if(c.kind==='cop')c.dead=true});
          const t=G.trains[0];t.n=5;t.len=18+5*15.3;t.speed=14;t.cargo=['#6b5a3a','#4a5568','#7a3b2e','#58606b','#6b5a3a'];t.x=p.x-60;t.active=true;t.dir=1;})()""")
        pg.wait_for_timeout(2500)
        g = ev("({closed:RC.G.gates.map(g=>g.closed),arm:RC.G.gates.map(g=>+g.arm.toFixed(2))})")
        print('C. шлагбаум при поезде:', g)
        pg.screenshot(path='/tmp/shot_train.png')
        # игрок на путях → гибель
        ev("(()=>{const p=RC.G.player;p.z=RC.G.trains[0].z;p.x=RC.G.trains[0].x-3;})()")
        pg.wait_for_timeout(1500)
        print('C2. игрок на путях под поездом:', ev("({dead:RC.G.player.dead,mode:RC.state.mode,health:RC.state.health})"))
        pg.wait_for_timeout(4500)
        print('C3. респавн:', ev("({dead:RC.G.player.dead,mode:RC.state.mode,health:RC.state.health,money:RC.state.money})"))
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
