import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw, 1100, 700)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1000)
        ev = pg.evaluate
        def goto_act(btype, acttype):
            ev(f"""(()=>{{const b=RC.G.world.doors.find(b=>b.interior.type==='{btype}');RC.enterBuilding(b,{{force:true}});
              const a=RC.G.interior.def.acts.find(a=>a.type==='{acttype}');const p=RC.G.player;p.x=a.x;p.z=a.z-0.2;}})()""")
            pg.wait_for_timeout(300)
        # --- вход в здание через дверь и клавишу E ---
        ev("""(()=>{const b=RC.G.world.doors.find(b=>b.interior.type==='shop_grocery');window._b=b;const p=RC.G.player;p.x=b.door.px;p.z=b.door.pz;RC.state.dayTime=12;RC.cam.snap(p.x,p.z);})()""")
        pg.wait_for_timeout(400); print('подсказка у двери:', pg.inner_text('#hud-hint'))
        pg.keyboard.press('KeyE'); pg.wait_for_timeout(600)
        print('вошли E:', ev("!!RC.G.interior"), ev("RC.G.interior?.def.title"))
        ev("(()=>{RC.state.dayTime=3;})()")
        # --- закрыто ночью ---
        ev("RC.exitBuilding()"); ev("(()=>{const p=RC.G.player;RC.state.dayTime=3;})()"); pg.wait_for_timeout(300)
        pg.keyboard.press('KeyE'); pg.wait_for_timeout(400)
        print('ночью (3:00) магазин закрыт:', not ev("!!RC.G.interior"), '|', pg.inner_text('#hud-msg'))
        ev("RC.state.dayTime=12")
        # --- покупка в магазине ---
        goto_act('shop_grocery','shop'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(400)
        print('панель магазина:', pg.is_visible('#panel'), pg.inner_text('.p-head h2'))
        m0 = ev("RC.state.money"); pg.locator('#panel .p-row .btn').first.click(); pg.wait_for_timeout(200)
        print('куплено (деньги %d -> %d)'%(m0, ev("RC.state.money")), '|', pg.inner_text('.p-msg'))
        pg.screenshot(path='/tmp/ui_shop.png')
        (pg.keyboard.press('Escape'), pg.wait_for_timeout(250)); pg.wait_for_timeout(200); print('Esc закрыл панель:', not pg.is_visible('#panel'), ev("RC.state.mode"))
        # --- аптека и лечение (H) ---
        goto_act('shop_pharmacy','shop'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.locator('#panel .p-tabs .btn').first.click(); 
        pg.locator('#panel .p-row', has_text='Аптечка').locator('.btn').click(); pg.wait_for_timeout(200)
        print('аптечек в сумке:', ev("RC.state.inventory.medkit"))
        (pg.keyboard.press('Escape'), pg.wait_for_timeout(250)); ev("RC.state.health=30"); pg.wait_for_timeout(100); pg.keyboard.press('KeyH'); pg.wait_for_timeout(300)
        print('здоровье после H: 30 ->', round(ev("RC.state.health")), '| аптечек:', ev("RC.state.inventory.medkit||0"))
        # --- оружейный ---
        ev("RC.state.money=2000"); goto_act('shop_guns','shop'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.locator('#panel .p-row', has_text='Аркадный пистолет').locator('.btn').click(); pg.wait_for_timeout(200)
        print('оружие:', ev("RC.state.ownedWeapons"), 'патроны', ev("RC.state.ammo.pistol"), 'деньги', ev("RC.state.money")); (pg.keyboard.press('Escape'), pg.wait_for_timeout(250))
        # --- одежда: образ ---
        goto_act('shop_clothes','shop'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.locator('#panel .p-row', has_text='Красная куртка').locator('.btn').click(); (pg.keyboard.press('Escape'), pg.wait_for_timeout(250)); pg.keyboard.press('KeyI'); pg.wait_for_timeout(300)
        pg.locator('#panel .p-row', has_text='Красная куртка').locator('.btn').click(); pg.wait_for_timeout(200)
        print('надет образ:', ev("RC.state.outfit")); pg.screenshot(path='/tmp/ui_inv.png'); (pg.keyboard.press('Escape'), pg.wait_for_timeout(250))
        # --- банк ---
        goto_act('bank','bank'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.locator('#panel .p-row', has_text='Положить').locator('.btn').nth(1).click(); pg.wait_for_timeout(200)
        print('банк: деньги', ev("RC.state.money"), 'счёт', ev("RC.state.bank")); (pg.keyboard.press('Escape'), pg.wait_for_timeout(250))
        # --- автосалон: покупка машины ---
        ev("RC.state.money=20000"); goto_act('dealer','buycar'); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.screenshot(path='/tmp/ui_dealer.png')
        pg.locator('#panel .p-row .btn').last.click(); pg.wait_for_timeout(200)
        print('куплена машина, гараж:', ev("RC.state.garage.map(g=>g.type+':'+g.out)"), 'деньги', ev("RC.state.money")); (pg.keyboard.press('Escape'), pg.wait_for_timeout(250))
        ev("RC.exitBuilding()"); pg.wait_for_timeout(600)
        print('машина у входа после выхода:', ev("RC.state.garage.map(g=>g.out)"), ev("RC.G.cars.filter(c=>c.ownedId).length"))
        # --- гараж: ремонт, покраска, заправка, сдача, продажа ---
        ev("(()=>{const v=RC.G.cars.find(c=>c.ownedId);v.hp=40;v.fuel=5;})()")
        goto_act('garage','garage'); ev("(()=>{const v=RC.G.cars.find(c=>c.ownedId);const S=RC.G.interior;v.x=S.ret.x+6;v.z=S.ret.z+6;v.vx=v.vz=0;})()"); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        pg.screenshot(path='/tmp/ui_garage.png')
        def gbtn(text): pg.locator('#panel .p-acts .btn', has_text=text).first.click(); pg.wait_for_timeout(150)
        h0 = ev("RC.G.cars.find(c=>c.ownedId).hp"); gbtn('Ремонт'); print('ремонт hp %d -> %d'%(h0, ev("RC.G.cars.find(c=>c.ownedId).hp")))
        gbtn('Заправка'); print('топливо ->', round(ev("RC.G.cars.find(c=>c.ownedId).fuel")))
        print('покраска у одноцветной модели отключена:', pg.locator('#panel .p-acts .btn', has_text='Цвет один').first.is_disabled())
        gbtn('Сдать'); print('сдана в гараж, на улице машин:', ev("RC.G.cars.filter(c=>c.ownedId).length"), 'out=', ev("RC.state.garage[0].out"))
        gbtn('Достать'); print('снова на улице:', ev("RC.state.garage[0].out"), ev("RC.G.cars.filter(c=>c.ownedId).length"))
        m1 = ev("RC.state.money"); gbtn('Сдать'); gbtn('Продать'); print('продана: денег +%d, в гараже %d'%(ev("RC.state.money")-m1, ev("RC.state.garage.length")))
        (pg.keyboard.press('Escape'), pg.wait_for_timeout(250))
        print('ошибки:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l][:6])
        b.close()
finally: srv.terminate()
