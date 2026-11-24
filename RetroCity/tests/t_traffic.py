import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
srv = serve()
try:
    with sync_playwright() as pw:
        b, pg, logs = open_page(pw)
        pg.wait_for_function('window.RC && window.RC.G.world', timeout=30000)
        pg.click('#btn-new'); pg.click('#char-ok'); pg.wait_for_timeout(800)
        ev = pg.evaluate
        # Игрок переходит в разные районы, наблюдаем трафик и пешеходов
        stops = [(6,6),(-100,-100),(250,-150),(-150,220),(0,-250)]
        agg = {'samples':0,'civ':0,'stuck':0,'offroad':0,'wreck':0,'ovl':0,'peds':0,'maxdt':0}
        for (x,z) in stops:
            ev(f"(()=>{{const p=RC.G.player;const q=RC.G.world.nearestWalk({x},{z},12);p.x=q.x;p.z=q.z;RC.cam.snap(q.x,q.z);}})()")
            pg.wait_for_timeout(5000)
            for _ in range(6):
                pg.wait_for_timeout(1500)
                s = ev("""(()=>{const {G}=RC;const w=G.world;const civ=G.cars.filter(c=>c.ai?.kind==='civ');
                  let stuck=0,off=0;for(const c of civ){const i=w.tileAt(c.x,c.z);if(i<0||w.rd[i]===0&&w.type[i]!==1&&w.type[i]!==5)off++;if(Math.abs(c.speed)<0.3&&c.ai.wait<0.5)stuck++;}
                  const a=G.peds.filter(p=>!p.dead&&p.kind==='npc');let ovl=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(Math.hypot(a[i].x-a[j].x,a[i].z-a[j].z)<0.45)ovl++;
                  return {civ:civ.length,stuck,off,wreck:G.cars.filter(c=>c.wreck).length,ovl,peds:a.length,speeds:civ.map(c=>Math.round(Math.abs(c.speed)))}})()""")
                agg['samples']+=1; agg['civ']+=s['civ']; agg['stuck']+=s['stuck']; agg['offroad']+=s['off']; agg['wreck']=max(agg['wreck'],s['wreck']); agg['ovl']+=s['ovl']; agg['peds']+=s['peds']
            print((x,z), {k:v for k,v in s.items() if k!='speeds'}, 'speeds', sorted(s['speeds'])[-6:])
        print('Итого по выборкам:', agg)
        print('среднее civ-машин: %.1f, застрявших (в среднем): %.2f, вне дороги: %.2f, пар пешеходов <0.45 м: %.2f на выборку'%(agg['civ']/agg['samples'],agg['stuck']/agg['samples'],agg['offroad']/agg['samples'],agg['ovl']/agg['samples']))
        fps = ev("""new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>3000)r(n/3);else requestAnimationFrame(f)}requestAnimationFrame(f)})""")
        print('FPS:', round(fps,1), 'pedTarget', ev("RC.G.quality.pedTarget"), 'carTarget', ev("RC.G.quality.carTarget"))
        print('\n'.join(l for l in logs if 'Canvas2D' not in l and 'ERR_NAME' not in l and 'Ready' not in l))
        b.close()
finally: srv.terminate()
