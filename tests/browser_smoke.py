from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':800})
    page.goto((root/'index.html').as_uri(),wait_until='domcontentloaded')
    assert page.locator('.metric').count()==4
    page.locator('[data-view="providers"]').click()
    assert page.locator('.provider-card').count()==8
    page.locator('#provider-search').fill('Groq')
    assert page.locator('.provider-card').count()==1
    page.locator('[data-view="workspace"]').click()
    assert page.locator('.file-entry').count()==3
    page.locator('#run-js').click()
    page.wait_for_timeout(900)
    result=page.locator('#console-output').inner_text()
    print('CONSOLE:',result)
    assert 'Hello from your AI development workspace' in result
    assert 'Execution complete.' in result
    page.locator('.file-entry').filter(has_text='index.html').click()
    page.locator('#preview-html').click()
    assert page.locator('#frame-host iframe').count()==1
    page.wait_for_timeout(400)
    print('PREVIEW:',page.frame_locator('#frame-host iframe').locator('h1').inner_text())
    assert page.frame_locator('#frame-host iframe').locator('h1').inner_text()=='Hello, builder!'
    page.frame_locator('#frame-host iframe').locator('button').click()
    assert page.frame_locator('#frame-host iframe').locator('#demo').inner_text()=='It works!'
    page.reload()
    page.locator('[data-view="workspace"]').click()
    assert page.locator('.file-entry').count()==3
    print('PASS: navigation, provider filtering, file browser, JS execution, sandboxed HTML preview, local persistence')
    browser.close()
