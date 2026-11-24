"""Общий запуск: HTTP-сервер + headless Chromium (Playwright)."""
import subprocess, time, os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
def serve(port=8765):
    p = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8); return p
def open_page(pw, w=1280, h=720, port=8765):
    b = pw.chromium.launch(args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': w, 'height': h}); logs = []
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}')); pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); return b, pg, logs
