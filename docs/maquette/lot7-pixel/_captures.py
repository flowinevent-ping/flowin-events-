# Captures PNG des maquettes lot 7 (Chrome local, animations coupees = prefers-reduced-motion).
import os, sys
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__))
PAGES = ['lot7-0-style', 'lot7-A-quiz', 'lot7-A-roue', 'lot7-B-quiz', 'lot7-B-roue', 'lot7-5-sequences', 'lot7-3-choix-style']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1760, 'height': 1000}, device_scale_factor=1, reduced_motion='reduce')
    pg = ctx.new_page()
    for nom in PAGES:
        pg.goto(f'file://{D}/{nom}.html')
        pg.wait_for_timeout(1500)
        pg.evaluate('document.fonts.ready')
        for el in pg.query_selector_all('[data-png]'):
            el.screenshot(path=f'{D}/' + el.get_attribute('data-png') + '.png')
        pg.locator('#page').screenshot(path=f'{D}/{nom}-ensemble.png')
    b.close()
print('captures ok')
