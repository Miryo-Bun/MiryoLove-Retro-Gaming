import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(800)
        ev = pg.evaluate
        ev("(()=>{window._sp=(x,z)=>{const p=RC.G.player;p.x=x;p.z=z;RC.cam.snap(x,z)};})()")
        results = []
        for mid in range(1, 16):
            ev(f"""(()=>{{const mm=RC.state.missionMgr;mm.current=null;const m=RC.MISSIONS.find(x=>x.id=={mid});mm.start(m);RC.state.heat=0;
               const p=RC.G.player;if(p.inVehicle){{p.inVehicle.driver=null;p.inVehicle=null}}}})()""")
            m = ev(f"RC.MISSIONS.find(x=>x.id=={mid})")
            money0 = ev("RC.state.money")
            if m['type'] == 'race':
                for t in m['targets']:
                    ev(f"_sp({t['x']}+3,{t['z']}+3)"); pg.wait_for_timeout(250)
            elif m['type'] == 'wanted':
                ev("RC.state.heat=2.4"); pg.wait_for_timeout(400); st1 = ev("RC.state.missionMgr.stage")
                ev("RC.state.heat=0"); pg.wait_for_timeout(400)
            else:
                t = m['target']
                if m['type'] == 'deliver_car':
                    ev(f"_sp({t['x']}+30,{t['z']}+30)")
                    ev(f"""(()=>{{const p=RC.G.player;const v=RC.G.cars.find(c=>!c.driver&&!c.wreck);v.x=p.x;v.z=p.z;v.vx=v.vz=0;v.driver='player';v.ai=null;p.inVehicle=v;}})()""")
                    pg.wait_for_timeout(300)
                    # без машины миссия не должна засчитываться
                ev(f"_sp({t['x']}+4,{t['z']}+4)"); 
                if m['type'] == 'deliver_car':
                    ev("(()=>{const v=RC.G.player.inVehicle;v.x=RC.G.player.x;v.z=RC.G.player.z;})()")
                pg.wait_for_timeout(400)
            done = ev(f"RC.state.missionMgr.completed.has({mid})")
            results.append(done)
            print(f"Миссия {mid:2d} {m['name']:<24} type={m['type']:<12} выполнена={done} +${ev('RC.state.money')-money0}")
            pg.wait_for_timeout(100)
        print('Выполнено:', sum(results), 'из 15')
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
