import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

def inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        page.goto("https://www.ebsi.co.kr/ebs/pot/potl/login.ebs")
        page.wait_for_load_state('networkidle')
        page.fill('input[name="i"]', "stac0110")
        page.fill('input[name="c"]', "Gjdus007")
        page.evaluate("login()")
        page.wait_for_load_state('networkidle')
        
        page.goto("https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs?targetCd=D100")
        page.wait_for_load_state('networkidle')
        
        page.check("#sFormPartMath01")
        try:
            page.locator("button:has-text('검색'), a:has-text('검색')").first.click()
        except:
            page.locator("a.btn_search, button.btn_search").first.click()
            
        page.wait_for_load_state('networkidle')
        
        # Get outerHTML of first qus_box
        box = page.locator("div.qus_box").first
        html = box.evaluate("el => el.outerHTML")
        with open("ebsi_box.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        browser.close()

if __name__ == "__main__":
    inspect()
