import sys, os, math, json; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
spots = {'bridge':(120,0),'rail_cross':(2,118),'station':(-50,112),'industrial':(-100,200),'junkyard':(-200,296),'residential':(200,-100),'river':(112,-120),'port':(-150,250),'bank':(10,-50),'downtown_tower':(-250,-250)}
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1200)
        for name,(x,z) in spots.items():
            pg.evaluate(f"(()=>{{const p=RC.G.player;const q=RC.G.world.nearestWalk({x},{z},12);p.x=q.x;p.z=q.z;RC.cam.snap(q.x,q.z);}})()")
            pg.wait_for_timeout(1800)
            pg.screenshot(path=f'/tmp/tour_{name}.png')
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
