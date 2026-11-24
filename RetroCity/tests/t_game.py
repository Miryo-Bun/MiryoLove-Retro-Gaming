import sys, os, math, json; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
R = {}
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(1500)
        ev = pg.evaluate
        # --- FPS ---
        fps = ev("""new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>3000)r(n/3);else requestAnimationFrame(f)}requestAnimationFrame(f)})""")
        print('FPS (headless, программный рендер):', round(fps,1))
        # --- направления ---
        dirs = {'KeyD':(1,0),'KeyS':(0,1),'KeyA':(-1,0),'KeyW':(0,-1)}
        combos = [('KeyD',),('KeyS',),('KeyA',),('KeyW',),('KeyD','KeyS'),('KeyA','KeyS'),('KeyA','KeyW'),('KeyD','KeyW')]
        ev("(()=>{const p=RC.G.player;const q=RC.G.world.nearestWalk(30,30,10);p.x=q.x;p.z=q.z;})()")
        ok_dirs = 0
        for c in combos:
            ev("(()=>{const p=RC.G.player;const q=RC.G.world.nearestWalk(30,30,10);p.x=q.x;p.z=q.z;p.vx=p.vz=0;})()")
            pg.wait_for_timeout(100)
            s = ev("({x:RC.G.player.x,z:RC.G.player.z})")
            for k in c: pg.keyboard.down(k)
            pg.wait_for_timeout(500)
            e = ev("({x:RC.G.player.x,z:RC.G.player.z,ang:RC.G.player.ang,spd:RC.G.player.speed})")
            for k in c: pg.keyboard.up(k)
            dx,dz = sum(dirs[k][0] for k in c), sum(dirs[k][1] for k in c)
            exp = math.atan2(dz,dx); mx,mz = e['x']-s['x'], e['z']-s['z']
            moved = math.hypot(mx,mz); da = abs(((math.atan2(mz,mx)-exp+math.pi)%(2*math.pi))-math.pi)
            fa = abs(((e['ang']-exp+math.pi)%(2*math.pi))-math.pi)
            good = moved>0.6 and da<0.5 and fa<0.5
            ok_dirs += good
            print('dir',c,'moved %.2f'%moved,'dirErr %.2f'%da,'facingErr %.2f'%fa, 'OK' if good else 'FAIL')
        R['directions_ok']=ok_dirs
        # --- ходьба / бег ---
        ev("(()=>{const p=RC.G.player;const q=RC.G.world.nearestWalk(30,30,10);p.x=q.x;p.z=q.z;})()")
        pg.keyboard.down('KeyD'); pg.wait_for_timeout(700); w = ev("RC.G.player.speed"); pg.keyboard.down('Shift'); pg.wait_for_timeout(700); r = ev("({s:RC.G.player.speed,run:RC.G.player.run})"); pg.keyboard.up('Shift'); pg.keyboard.up('KeyD')
        print('walk speed %.2f, run speed %.2f run=%s'%(w, r['s'], r['run']))
        # --- пешеходы: количество, наложение ---
        pg.wait_for_timeout(8000)
        st = ev("""(()=>{const a=RC.G.peds.filter(p=>!p.dead&&p.kind==='npc');let ov=0,pairs=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const d=Math.hypot(a[i].x-a[j].x,a[i].z-a[j].z);if(d<0.45)ov++;}
          const vis=a.filter(p=>RC.cam.visible(p.x,p.z,0));const modes={};a.forEach(p=>modes[p.mode]=(modes[p.mode]||0)+1);const variants=new Set(a.map(p=>p.variant)).size;
          return {n:a.length,visible:vis.length,overlapPairs:ov,modes,variants,target:RC.G.quality.pedTarget,cars:RC.G.cars.filter(c=>c.ai).length}})()""")
        print('NPC:', st)
        # --- посадка в машину ---
        ev("""(()=>{const p=RC.G.player;const v=RC.G.cars.find(c=>!c.driver&&!c.wreck&&c.type==='sedan'&&c.keep);const d=v.doorPos(-1);p.x=d.x;p.z=d.z;window._v=v;})()""")
        pg.wait_for_timeout(300); pg.keyboard.press('KeyE'); pg.wait_for_timeout(250)
        mid = ev("({enter:!!RC.G.player.enter,crouch:RC.G.player.crouch})")
        pg.wait_for_timeout(700)
        inv = ev("({inV:!!RC.G.player.inVehicle,drv:window._v.driver})")
        print('enter anim mid:',mid,' after:',inv)
        # --- движение машины ---
        pg.keyboard.down('KeyW'); pg.wait_for_timeout(2500)
        d1 = ev("({sp:window._v.speed,x:window._v.x,z:window._v.z,zoom:RC.cam.zoom})"); pg.keyboard.down('KeyD'); pg.wait_for_timeout(1200); a1 = ev("window._v.ang"); pg.keyboard.up('KeyD')
        pg.screenshot(path='/tmp/shot_drive.png')
        pg.keyboard.up('KeyW'); pg.keyboard.down('KeyS'); pg.wait_for_timeout(1800); pg.keyboard.up('KeyS'); pg.wait_for_timeout(800)
        print('drive:',d1,'turn ang',a1, 'speed after brake', ev("window._v.speed"))
        pg.keyboard.press('KeyE'); pg.wait_for_timeout(300); ex_mid = ev("({exit:!!RC.G.player.exit})"); pg.wait_for_timeout(800)
        print('exit anim:',ex_mid,'out:',ev("!RC.G.player.inVehicle"))
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally:
    srv.terminate()
