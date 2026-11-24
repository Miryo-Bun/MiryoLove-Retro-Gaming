import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
from PIL import Image
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw, 1100, 640)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1200)
        ev = pg.evaluate
        types = ev("[...new Set(RC.G.world.doors.map(b=>b.interior.type))]")
        print('типы интерьеров в мире:', types)
        shots = []
        for t in types:
            res = ev(f"""(()=>{{const b=RC.G.world.doors.find(b=>b.interior.type==='{t}');RC.state.heat=0;RC.state.wanted=0;
               const ok=RC.enterBuilding(b,{{force:true}});return {{ok,name:b.interior.name,title:RC.G.interior?.def.title,npcs:RC.G.interior?.npcs.length,acts:RC.G.interior?.def.acts.length,items:RC.G.interior?.def.items.length}}}})()""")
            pg.wait_for_timeout(700)
            pg.screenshot(path=f'/tmp/int_{t}.png'); shots.append(t)
            print(t, res)
            ev("RC.exitBuilding()"); pg.wait_for_timeout(150)
        im = Image.new('RGB', (1100*2//2, 640*((len(shots)+1)//2)//1))
        cols = 3; w, h = 733, 427
        sheet = Image.new('RGB', (cols*w, ((len(shots)+cols-1)//cols)*h))
        for i, t in enumerate(shots): sheet.paste(Image.open(f'/tmp/int_{t}.png').convert('RGB').resize((w,h)), ((i%cols)*w, (i//cols)*h))
        sheet.save('/tmp/interiors.png')
        print('ошибки:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l])
        b.close()
finally: srv.terminate()
