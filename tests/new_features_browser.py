"""Chromium acceptance for P23/Q04/Q06/Q07, on checkout and deployed Pages.
No paid providers, external services or real user files are needed.
"""
import argparse
import io
import sys
import traceback
import zipfile
from playwright.sync_api import sync_playwright, expect

def document_bytes():
    memory=io.BytesIO()
    with zipfile.ZipFile(memory,"w",compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml","<Types/>")
        z.writestr("word/document.xml",'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX_BROWSER_QA_42</w:t></w:r></w:p></w:body></w:document>')
    return memory.getvalue()

def check(page):
    page.locator('[data-view="workspace"]').first.click()
    expect(page.locator("#code-editor")).to_be_visible()
    before=page.locator("#code-editor").input_value()
    proposed=before+"\nconsole.log('Q04_BROWSER_QA');"
    page.locator("#q04-proposal").fill(proposed)
    page.locator("#q04-preview-button").click()
    expect(page.locator("#q04-diff")).to_contain_text("+console.log('Q04_BROWSER_QA');")
    assert page.locator("#code-editor").input_value()==before, "Q04 preview mutated code"
    page.once("dialog",lambda d:d.accept())
    page.locator("#q04-accept").click()
    expect(page.locator("#code-editor")).to_have_value(proposed)
    page.once("dialog",lambda d:d.accept())
    page.locator("#q04-rollback").click()
    expect(page.locator("#code-editor")).to_have_value(before)
    print("PASS: Q04 preview/accept/rollback in real browser",flush=True)

    page.locator('[data-view="knowledge"]').first.click()
    page.locator("#knowledge-import").set_input_files({"name":"browser-qa.docx","mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","buffer":document_bytes()})
    page.locator("#knowledge-search").fill("DOCX_BROWSER_QA_42")
    expect(page.locator("#knowledge-results")).to_contain_text("DOCX_BROWSER_QA_42",timeout=20000)
    assert "1 notes" in page.locator("#note-count").inner_text(), "Q06 note missing"
    print("PASS: Q06 DOCX imported into Knowledge in real browser",flush=True)

    page.locator('[data-view="datalab"]').first.click()
    wasm=bytes([0,97,115,109,1,0,0,0,1,5,1,0x60,0,1,0x7f,3,2,1,0,7,8,1,4,109,97,105,110,0,0,10,6,1,4,0,0x41,42,0x0b])
    page.locator("#wasm-file").set_input_files({"name":"answer.wasm","mimeType":"application/wasm","buffer":wasm})
    page.locator("#wasm-entry").fill("main")
    page.locator("#wasm-run").click()
    expect(page.locator("#wasm-output")).to_contain_text("Result: 42",timeout=20000)
    expect(page.locator("#wasm-stop")).to_be_disabled()
    print("PASS: Q07 real WASM compiled and ran in isolated browser worker",flush=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--base-url",required=True)
    args=parser.parse_args()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
            page=browser.new_page(viewport={"width":1280,"height":800},accept_downloads=True)
            errors=[]
            page.on("pageerror",lambda error:errors.append(str(error)))
            page.goto(args.base_url,wait_until="domcontentloaded",timeout=45000)
            expect(page.locator("#code-editor")).to_be_attached(timeout=15000)
            check(page)
            assert not errors,"Unhandled browser errors: "+repr(errors)
            browser.close()
            print("PASS: feature browser acceptance",flush=True)
            return 0
    except Exception as error:
        print("FAIL: new feature browser acceptance: "+repr(error),flush=True)
        traceback.print_exc()
        return 1
if __name__=="__main__":
    sys.exit(main())
