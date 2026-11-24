import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
from PIL import Image
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        ev = pg.evaluate
        sheet = Image.new('RGB', (6*220, 3*220), (30,30,30))
        for i in range(6):
            ev(f"(()=>{{RC.state.charIndex={i};RC.startGame(null);RC.G.peds.length=0;RC.G.cars.length=0;RC.cam.userZoom=2.2;RC.state.missionMgr.current=null;const p=RC.G.player;const q=RC.G.world.nearestWalk(-60,-60,10);p.x=q.x;p.z=q.z;RC.cam.snap(q.x,q.z);}})()")
            pg.wait_for_timeout(900)
            for row,(keys,shift) in enumerate([((), False), (('KeyD','KeyS'), False), (('KeyA',), True)]):
                for k in keys: pg.keyboard.down(k)
                if shift: pg.keyboard.down('Shift')
                pg.wait_for_timeout(450)
                pg.screenshot(path='/tmp/hc.png', clip={'x':640-110,'y':360-110,'width':220,'height':220})
                for k in keys: pg.keyboard.up(k)
                if shift: pg.keyboard.up('Shift')
                sheet.paste(Image.open('/tmp/hc.png').convert('RGB'), (i*220, row*220))
                pg.wait_for_timeout(250)
        sheet.save('/tmp/heroes_ingame.png')
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
