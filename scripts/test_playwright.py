from playwright.sync_api import sync_playwright
import time

def test_login():
    with sync_playwright() as p:
        # Use headed mode to avoid anti-bot sometimes, but headless=True is default.
        # Let's try headless=False to see if it makes a difference, but on server it might fail.
        # So we stick to headless=True.
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.ebsi.co.kr/ebs/pot/potl/login.ebs")
        page.wait_for_load_state('networkidle')
        
        page.fill('input[name="i"]', "stac0110")
        page.fill('input[name="c"]', "Gjdus007")
        
        # Call the login function
        page.evaluate("login()")
        
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        print("Login URL after submit:", page.url)
        
        # Now go to 기출문제 page
        page.goto("https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs?targetCd=D100")
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        with open("ebsi_gichul.html", "w", encoding="utf-8") as f:
            f.write(page.content())
            
        browser.close()

if __name__ == "__main__":
    test_login()
