import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1000)
        ev = pg.evaluate
        # Полиция: 3 звезды, игрок едет по улице
        ev("""(()=>{const {G,state}=RC;const p=G.player;const q=G.world.nearestWalk(-40,-60,6);p.x=q.x;p.z=q.z;RC.cam.snap(p.x,p.z);state.heat=3.5;state.character.speedMul=1;})()""")
        pg.wait_for_timeout(9000)
        ev("(()=>{const {G}=RC;const cs=G.cars.filter(c=>c.ai?.kind==='police');if(cs[0]){RC.cam.snap(cs[0].x,cs[0].z)}})()")
        pg.wait_for_timeout(200)
        print(ev("({wanted:RC.state.wanted,cars:RC.G.cars.filter(c=>c.ai?.kind==='police').length,cops:RC.G.peds.filter(c=>c.kind==='cop'&&!c.dead).length,hp:RC.state.health})"))
        pg.screenshot(path='/tmp/shot_police2.png')
        # Ночь
        ev("(()=>{const {state,G}=RC;state.heat=0;state.dayTime=22;const p=G.player;p.x=6;p.z=6;RC.cam.snap(6,6);})()"); pg.wait_for_timeout(1500)
        pg.screenshot(path='/tmp/shot_night.png')
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
