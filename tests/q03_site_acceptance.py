"""Q03 acceptance on the actual served Studio UI (local checkout or deployed site)."""
import argparse
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url',required=True)
args=parser.parse_args()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(args.base_url,wait_until='domcontentloaded',timeout=30000)
    page.locator('[data-view="workspace"]').first.click()
    page.locator('#add-file').wait_for()
    page.once('dialog',lambda dialog:dialog.accept('lib.js'))
    page.locator('#add-file').click()
    page.locator('#code-editor').fill('export const value=42;')
    page.locator('#file-tree button[title="main.js"]').click()
    page.locator('#code-editor').fill('import {value} from "./lib.js";\nconsole.log("Q03 LIVE",value);')
    page.locator('#run-code').click()
    page.wait_for_function('document.querySelector("#console-output").textContent.includes("Q03 LIVE 42")',timeout=12000)
    page.wait_for_function('document.querySelector("#console-output").textContent.includes("Module execution complete")',timeout=12000)
    assert not errors,errors
    print('PASS: actual Studio UI executed local two-file module in isolated Worker')
    browser.close()