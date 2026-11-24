import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
spots = {'start':(6,6),'shopping':(-600,-120),'rich':(700,-100),'airport':(790,380),'port':(-300,800),'military':(430,880),'rural_n':(-300,-600),'suburb':(-600,330),'downtown_n':(-250,-500),'bank':(10,-50)}
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        print('мир:', pg.evaluate("({W:RC.G.world.W,H:RC.G.world.H,b:RC.G.world.buildings.length,doors:RC.G.world.doors.length})"))
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1500)
        for name,(x,z) in spots.items():
            pg.evaluate(f"(()=>{{const p=RC.G.player;const q=RC.G.world.nearestWalk({x},{z},14);p.x=q.x;p.z=q.z;p.vx=p.vz=0;RC.cam.snap(q.x,q.z);}})()")
            pg.wait_for_timeout(1500)
            pg.screenshot(path=f'/tmp/m2_{name}.png')
            print(name, pg.evaluate("RC.G.world.districtAt(RC.G.player.x,RC.G.player.z)"), pg.inner_text('#hud-district'))
        print('FPS', round(pg.evaluate("""new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>2500)r(n/2.5);else requestAnimationFrame(f)}requestAnimationFrame(f)})"""),1))
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
