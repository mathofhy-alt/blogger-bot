import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import time
from playwright.sync_api import sync_playwright

def download_ebs_exams(user_id, user_pw):
    # Set paths
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    base_dir = os.path.dirname(project_root) # 기출홈페이지
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        # Timeout settings
        context.set_default_timeout(30000)
        page = context.new_page()
        
        # Auto-accept all dialogs (alerts, confirms)
        def handle_dialog(dialog):
            try:
                dialog.accept()
            except Exception:
                pass
        page.on("dialog", handle_dialog)
        
        # 1. Login
        print("로그인 중...")
        page.goto("https://www.ebsi.co.kr/ebs/pot/potl/login.ebs")
        page.wait_for_load_state('networkidle')
        page.fill('input[name="i"]', user_id)
        page.fill('input[name="c"]', user_pw)
        page.evaluate("login()")
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        targets = [
            {"cd": "D200", "grade": "고2"},
            {"cd": "D300", "grade": "고3"}
        ]
        
        for target in targets:
            print(f"\n{target['grade']} 기출문제 페이지 접속 중...")
            page.goto(f"https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs?targetCd={target['cd']}")
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            
            # Select Math tab and search
            print("수학 과목 필터 적용 중...")
            try:
                page.check("#sFormPartMath01")
                search_btn = page.locator("button:has-text('검색'), a:has-text('검색')").first
                if search_btn.is_visible():
                    search_btn.click()
                else:
                    page.locator("a.btn_search, button.btn_search").first.click()
                page.wait_for_load_state('networkidle')
                time.sleep(3)
            except Exception as e:
                print("필터 적용 오류:", e)

            # Find all exam list items
            items = page.locator("div.qus_box").all()
            if not items:
                items = page.locator("table.boardList tbody tr, ul.board_list_st01 > li").all()
            print(f"{target['grade']} 항목 {len(items)}개 발견.")
            
            for item in items:
                try:
                    # Look for buttons (strictly download buttons)
                    buttons = item.locator("button.btn_L_col17, a.btn_L_col17").all()
                    for btn in buttons:
                        btn_text = btn.inner_text().strip() if btn.is_visible() else ""
                        if '문제' in btn_text or '해설' in btn_text or '정답' in btn_text:
                            # Start download (EBSi opens PDF in a new tab)
                            try:
                                with context.expect_page(timeout=10000) as new_page_info:
                                    btn.click(force=True)
                                new_page = new_page_info.value
                                new_page.wait_for_load_state()
                                pdf_url = new_page.url
                                filename = pdf_url.split('/')[-1]
                                
                                save_folder = os.path.join(base_dir, '모의고사', '2025', target['grade'])
                                os.makedirs(save_folder, exist_ok=True)
                                save_path = os.path.join(save_folder, filename)
                                
                                # Download using context request to keep auth
                                resp = context.request.get(pdf_url)
                                with open(save_path, 'wb') as f:
                                    f.write(resp.body())
                                    
                                print(f"다운로드 완료: {filename} -> {save_path}")
                                new_page.close()
                                time.sleep(1)
                            except Exception as dl_err:
                                print("다운로드 무시됨:", repr(dl_err))
                except Exception as e:
                    print("항목 처리 중 오류 발생:", repr(e))
                    
        browser.close()

if __name__ == "__main__":
    # Test with provided credentials
    download_ebs_exams("stac0110", "Gjdus007")
