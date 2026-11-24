import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw, 1280, 720)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        t0 = __import__('time').time()
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(500)
        for _ in range(5): pg.keyboard.press('Space'); pg.wait_for_timeout(250)
        ev = pg.evaluate
        print('время запуска до игры: %.1f с'%(__import__('time').time()-t0))
        print('мир:', ev("({W:RC.G.world.W,H:RC.G.world.H,buildings:RC.G.world.buildings.length,doors:RC.G.world.doors.length,cars:RC.G.cars.length,peds:RC.G.peds.length})"))
        for (x,z,name) in [(6,6,'центр'),(-600,-120,'торговый'),(700,-100,'особняки'),(790,380,'аэропорт'),(-300,800,'порт'),(430,880,'военные'),(-600,330,'пригород')]:
            ev(f"(()=>{{const p=RC.G.player;const q=RC.G.world.nearestWalk({x},{z},14);p.x=q.x;p.z=q.z;RC.cam.snap(q.x,q.z)}})()")
            pg.wait_for_timeout(1200)
            fps = ev("""new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>1200)r(n/1.2);else requestAnimationFrame(f)}requestAnimationFrame(f)})""")
            print(f'{name}: FPS {round(fps,1)} район={ev("RC.G.world.districtAt(RC.G.player.x,RC.G.player.z)")}')
        print('ошибки консоли:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l])
        b.close()
finally: srv.terminate()
