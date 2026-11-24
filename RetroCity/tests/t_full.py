import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw, 1200, 720)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(300)
        ev = pg.evaluate

        def flush():
            for _ in range(6):
                if ev("RC.state.mode")!='outcome': break
                pg.keyboard.press('Space'); pg.wait_for_timeout(300)
        print('режим сразу после старта (кат-сцена):', ev("RC.state.mode"))
        pg.screenshot(path='/tmp/cut_intro.png')
        for _ in range(4): pg.keyboard.press('Space'); pg.wait_for_timeout(250)
        print('после пропуска:', ev("RC.state.mode"))
        ev("(()=>{const p=RC.G.player;const q=RC.G.world.nearestWalk(30,30,10);p.x=q.x;p.z=q.z;RC.cam.snap(p.x,p.z)})()")
        pg.wait_for_timeout(500)
        # --- задержание ---
        ev("(()=>{RC.state.money=500;RC.state.ownedWeapons=['fists','pistol'];RC.state.ammo.pistol=10;RC.state.health=6;})()")
        ev("(()=>{RC.G.hurtPlayer(10,'baton')})()")
        pg.wait_for_timeout(300); print('режим после удара дубинкой (0 hp):', ev("RC.state.mode"))
        pg.screenshot(path='/tmp/cut_jail.png')
        for _ in range(4): pg.keyboard.press('Space'); pg.wait_for_timeout(400)
        print('после задержания: режим', ev("RC.state.mode"), 'оружие', ev("RC.state.ownedWeapons"), 'конфисковано', ev("RC.state.confiscated"), 'деньги', ev("RC.state.money"))
        # вернуть оружие в участке
        ev("""(()=>{const b=RC.G.world.doors.find(b=>b.interior.type==='police');RC.enterBuilding(b,{force:true});
          const a=RC.G.interior.def.acts.find(a=>a.type==='police');const p=RC.G.player;p.x=a.x;p.z=a.z-0.2;})()""")
        flush(); pg.wait_for_timeout(300); pg.keyboard.press('KeyE'); pg.wait_for_timeout(300)
        print('панель полиции открыта:', pg.is_visible('#panel'))
        m0 = ev("RC.state.money")
        btn = pg.locator('#panel .p-row .btn', has_text='Забрать')
        if btn.count(): btn.click(); pg.wait_for_timeout(200)
        flush()
        print('после выкупа: оружие', ev("RC.state.ownedWeapons"), 'потрачено', m0 - ev("RC.state.money"))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200); ev("RC.exitBuilding()"); pg.wait_for_timeout(300); flush()
        # --- смерть -> больница ---
        ev("(()=>{RC.state.health=15;})()"); ev("(()=>{RC.G.hurtPlayer(20,'shot')})()")
        pg.wait_for_timeout(300); print('режим после смертельного урона (без розыска -> больница):', ev("RC.state.mode"))
        for _ in range(4): pg.keyboard.press('Space'); pg.wait_for_timeout(400)
        print('после больницы: здоровье', ev("RC.state.health"), 'режим', ev("RC.state.mode"))
        # --- эскалация ---
        ev("(()=>{RC.state.heat=5.5;})()"); pg.wait_for_timeout(13000)
        esc = ev("({wanted:RC.state.wanted, martial:RC.state.martialLaw, military:RC.G.cars.filter(c=>c.military).length})")
        print('эскалация (5-6 звёзд):', esc)
        pg.screenshot(path='/tmp/escalation.png')
        ev("(()=>{RC.state.heat=0;})()"); pg.wait_for_timeout(12000)
        print('после сброса розыска:', ev("({wanted:RC.state.wanted, martial:RC.state.martialLaw})"))
        # --- регрессия: миссии ещё работают ---
        done = []
        for mid in [1,2,5,8,10,15]:
            ev(f"""(()=>{{const mm=RC.state.missionMgr;mm.current=null;mm.start(RC.MISSIONS.find(x=>x.id=={mid}));RC.state.heat=0;
              const p=RC.G.player;if(p.inVehicle){{p.inVehicle.driver=null;p.inVehicle=null}}}})()""")
            m = ev(f"RC.MISSIONS.find(x=>x.id=={mid})")
            if m['type']=='deliver_car':
                t=m['target']
                ev(f"""(()=>{{const p=RC.G.player;const v=RC.G.cars.find(c=>!c.driver&&!c.wreck);v.x={t['x']}+4;v.z={t['z']}+4;v.vx=v.vz=0;v.driver='player';v.ai=null;p.inVehicle=v;p.x=v.x;p.z=v.z;}})()""")
            elif m['type']=='wanted':
                ev("RC.state.heat=2.4"); pg.wait_for_timeout(300); ev("RC.state.heat=0"); pg.wait_for_timeout(300)
            elif m['type']=='race':
                for t in m['targets']: ev(f"(()=>{{const p=RC.G.player;p.x={t['x']}+3;p.z={t['z']}+3;}})()"); pg.wait_for_timeout(150)
            else:
                t=m['target']; ev(f"(()=>{{const p=RC.G.player;p.x={t['x']}+4;p.z={t['z']}+4;}})()")
            pg.wait_for_timeout(300)
            done.append((mid, ev(f"RC.state.missionMgr.completed.has({mid})")))
        print('миссии (регрессия):', done)
        print('FPS:', round(ev("""new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>2500)r(n/2.5);else requestAnimationFrame(f)}requestAnimationFrame(f)})"""),1))
        print('ошибки:', [l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l][:10])
        b.close()
finally: srv.terminate()
