import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.wait_for_timeout(600)
        # портреты всех шести героев
        for i in range(6):
            pg.wait_for_timeout(500)
            pg.locator('#char-portrait').screenshot(path=f'/tmp/portrait_{i}.png')
            print(i, pg.inner_text('#char-name'), '|', pg.inner_text('#char-stats'))
            pg.click('#char-next')
        pg.click('#char-ok'); pg.wait_for_timeout(2500)
        pg.screenshot(path='/tmp/shot_game.png')
        print(pg.evaluate("({mode:RC.state.mode, ch:RC.state.character.id, x:RC.G.player.x, z:RC.G.player.z, peds:RC.G.peds.length, cars:RC.G.cars.length})"))
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l))
        b.close()
finally:
    srv.terminate()
