import google.generativeai as genai
import os
import random
import markdown
import re

# Gemini API 설정 (환경 변수 또는 직접 입력)
# 실제 사용 시 .env 파일 등에 저장하는 것을 권장합니다.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyA-c7-wDmHlMWtg3VQej6JE-5wGm6HR4P4")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite')

def generate_blog_post(topic, target_url):
    """주제와 타겟 URL을 바탕으로 블로그 포스트를 생성합니다."""
    
    prompt = f"""
    당신은 교육 및 SEO 전문가입니다. 다음 주제에 대해 구글 검색 결과 상단에 노출될 수 있도록 최적화된 포스팅을 HTML 형식으로 작성해 주세요.
    
    주제: {topic}
    타겟 사이트: {target_url}
    
    [지시 사항]
    1. 제목: 클릭을 부르는 매력적인 제목을 지어주세요.
    2. 본문 구조 (반드시 HTML 태그 사용):
       - 주요 섹션은 <h2>, 세부 섹션은 <h3> 태그를 사용하여 구조화해 주세요.
       - 각 단락은 <p> 태그로 감싸주세요.
       - 중요한 키워드는 <strong> 태그로 강조해 주세요.
    3. 링크 전략: 
       - 타겟 사이트({target_url})로 가는 링크를 본문 중간과 하단에 2번 이상 넣어주세요.
       - 링크는 <a href="{target_url}">수학 기출문제 무료 다운로드</a> 처럼 키워드가 포함된 형태(앵커 텍스트)를 선호합니다.
    4. 내용: 최소 1200자 이상, 전문적이고 신뢰감 있는 정보를 제공해 주세요.
    5. 주의: 마크다운 형식을 절대 사용하지 말고, 오직 HTML 태그만 사용하세요.
    
    [출력 형식]
    제목: [제목 내용]
    본문: [HTML 태그가 포함된 본문 내용]
    """

    try:
        response = model.generate_content(prompt)
        content = response.text
        
        # 제목과 본문 분리
        lines = content.strip().split('\n')
        title = ""
        body = ""
        
        for line in lines:
            if line.startswith("제목:"):
                title = line.replace("제목:", "").strip()
            elif line.startswith("본문:"):
                body = content.split("본문:")[1].strip()
                break
        
        # 만약 형식이 안 지켜졌을 경우의 예외 처리
        if not title:
            title = f"{topic} 안내 및 다운로드"
            body = content

        # 코드 블록 마크다운(```html) 등 제거
        body = re.sub(r'```(?:html)?\n?(.*?)\n?```', r'\1', body, flags=re.DOTALL)
        
        # 마크다운을 완벽한 HTML로 강제 변환
        html_body = markdown.markdown(body, extensions=['extra', 'sane_lists'])

        return title, html_body

    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return None, None

if __name__ == '__main__':
    # 테스트 실행
    test_topic = "2025학년도 고3 5월 학력평가 수학 기출문제"
    test_url = "https://math.stac100.com"
    title, body = generate_blog_post(test_topic, test_url)
    if title:
        print(f"생성된 제목: {title}")
        print("-" * 50)
        print(f"생성된 본문 요약: {body[:100]}...")
