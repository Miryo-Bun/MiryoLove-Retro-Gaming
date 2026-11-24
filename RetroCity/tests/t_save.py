import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--no-sandbox']); ctx = b.new_context(viewport={'width':1280,'height':720}); pg = ctx.new_page(); logs=[]
        pg.on('pageerror', lambda e: logs.append(str(e))); pg.goto('http://127.0.0.1:8765/index.html')
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        print('Продолжить заблокирована без сохранения:', pg.is_disabled('#btn-continue'))
        pg.click('#btn-new'); pg.click('#char-next'); pg.click('#char-next'); pg.click('#char-ok'); pg.wait_for_timeout(600)
        for _ in range(5): pg.keyboard.press('Space'); pg.wait_for_timeout(250)
        ev = pg.evaluate
        # меняем состояние: деньги, оружие, миссия, позиция в машине
        ev("""(()=>{const {state,G}=RC;state.money=4321;state.ownedWeapons=['fists','pistol','smg'];state.ammo.smg=77;state.weaponIndex=2;state.health=63;state.heat=1.5;
          const mm=state.missionMgr;mm.completed=new Set([1,2,3]);mm.current=null;mm.start(RC.MISSIONS.find(m=>m.id==4));
          const p=G.player;const v=G.cars.find(c=>c.type==='sedan'&&!c.driver);v.driver='player';v.ai=null;p.inVehicle=v;v.x=-100;v.z=-20;v.ang=1.0;p.x=v.x;p.z=v.z;})()""")
        pg.wait_for_timeout(300)
        before = ev("({money:RC.state.money,w:RC.state.ownedWeapons,smg:RC.state.ammo.smg,hp:Math.round(RC.state.health),wanted:RC.state.wanted,done:[...RC.state.missionMgr.completed],cur:RC.state.missionMgr.current.id,ch:RC.state.character.id,veh:RC.G.player.inVehicle.type})")
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200); pg.click('#btn-save'); pg.wait_for_timeout(200)
        print('Сохранено:', before)
        pg.reload(); pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        print('Продолжить доступна после перезагрузки:', not pg.is_disabled('#btn-continue'))
        pg.click('#btn-continue'); pg.wait_for_timeout(1000)
        after = ev("({money:RC.state.money,w:RC.state.ownedWeapons,smg:RC.state.ammo.smg,hp:Math.round(RC.state.health),wanted:RC.state.wanted,done:[...RC.state.missionMgr.completed],cur:RC.state.missionMgr.current?.id,ch:RC.state.character.id,veh:RC.G.player.inVehicle?.type,x:Math.round(RC.G.player.x),z:Math.round(RC.G.player.z)})")
        print('Загружено:', after)
        # совместимость со старым форматом сохранения
        ev("localStorage.setItem('retrocity3d_save', JSON.stringify({money:777,health:90,wanted:0,unlocked:['downtown'],characterId:'marina',weapons:['fists'],ammo:{pistol:5},pos:{x:50,z:-20},missions:{completed:[1],currentId:2,stage:0}}))")
        pg.reload(); pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000); pg.click('#btn-continue'); pg.wait_for_timeout(800)
        print('Старый формат:', ev("({money:RC.state.money,ch:RC.state.character.id,x:Math.round(RC.G.player.x),cur:RC.state.missionMgr.current?.id,mode:RC.state.mode})"))
        print('ошибки:', logs)
        b.close()
finally: srv.terminate()
