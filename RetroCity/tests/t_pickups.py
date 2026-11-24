import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(800)
        ev = pg.evaluate
        print('старт:', ev("({w:RC.state.ownedWeapons,pk:RC.G.pickups.map(k=>k.kind).join(',')})"))
        for kind in ['pistol','bat','smg','shotgun','special']:
            ev(f"(()=>{{const k=RC.G.pickups.find(k=>k.kind==='{kind}');const p=RC.G.player;p.x=k.x;p.z=k.z;}})()"); pg.wait_for_timeout(300)
        print('оружие после подбора:', ev("({w:RC.state.ownedWeapons,ammo:RC.state.ammo})"))
        i0 = ev("RC.state.weaponIndex"); pg.keyboard.press('KeyR'); pg.wait_for_timeout(100); i1 = ev("RC.state.weaponIndex"); pg.keyboard.press('KeyQ'); pg.wait_for_timeout(100); i2 = ev("RC.state.weaponIndex")
        print('смена оружия R/Q:', i0, i1, i2, '| HUD:', pg.inner_text('#hud-weapon'))
        ev("RC.state.health=40"); ev("(()=>{const k=RC.G.pickups.find(k=>k.kind==='health');const p=RC.G.player;p.x=k.x;p.z=k.z;})()"); pg.wait_for_timeout(300)
        print('аптечка:', ev("Math.round(RC.state.health)"))
        # удар кулаком/битой по NPC
        ev("RC.state.weaponIndex=RC.state.ownedWeapons.indexOf('bat')")
        ev("""(()=>{const {G}=RC;const p=G.player;const c=G.peds.find(x=>x.kind==='npc'&&!x.dead);c.x=p.x+1.5;c.z=p.z;c.mode='idle';c.timer=99;p.ang=0;window._c=c;})()"""); 
        pg.keyboard.down('Space'); pg.wait_for_timeout(900); pg.keyboard.up('Space')
        print('удар битой: hp NPC', round(ev("window._c.hp"),1), 'из', round(ev("window._c.maxHp"),1), 'mode', ev("window._c.mode"))
        print('ошибки:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l])
        b.close()
finally: srv.terminate()
