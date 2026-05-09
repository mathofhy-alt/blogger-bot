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
    당신은 대치동에서 10년 이상 상위권 학생들을 가르쳐온 베테랑 수학 전문 강사이자 교육 칼럼니스트입니다.
    다음 주제에 대해 구글 검색 엔진이 가장 선호하는 'Helpful Content(유용한 콘텐츠)' 형식의 포스팅을 HTML로 작성해 주세요.
    단순한 AI 생성 글이 아닌, 실제 사람이 경험을 바탕으로 쓴 생생한 칼럼처럼 보여야 합니다.
    
    주제: {topic}
    타겟 사이트: {target_url}
    
    [핵심 지시 사항 - 인간다움과 전문성(EEAT)]
    1. 페르소나와 어투: 
       - "결론적으로", "요약하자면", "중요한 점은" 같은 AI 특유의 기계적인 접속사/표현을 절대 사용하지 마세요.
       - "~해요", "~습니다"를 자연스럽게 혼용하며 독자(수험생이나 학부모)에게 직접 말을 거는 듯한 친근한 어투를 사용하세요.
       - "실제로 제가 학생들을 가르치다 보면~", "많은 학생들이 이 부분에서 실수하는데~" 같은 1인칭 경험담(Personal Anecdote)을 적극적으로 포함하세요.
    2. 독자 공감과 훅(Hook): 
       - 서론에서는 뻔한 소리 대신 수험생들의 실제 고민이나 흔히 하는 오개념을 정확히 찌르면서 공감대를 형성하며 시작하세요.
    
    [SEO 및 HTML 구조 지시 사항]
    1. 제목: 너무 딱딱하지 않은, 클릭을 유도하는 매력적인 블로그 제목 (예: "수학 4등급이 1등급 되는 현실적인 기출 분석법")
    2. 본문 구조 (오직 HTML 태그만 사용, 마크다운 절대 금지):
       - 주요 섹션은 <h2>, 세부 내용은 <h3> 로 나누세요.
       - 가독성을 위해 단락(<p>)을 너무 길지 않게 자주 나누고, 중요한 문장이나 키워드는 <strong> 으로 강조하세요.
       - 나열할 내용이 있다면 <ul>, <li> 리스트 태그를 적극 활용하여 시각적으로 편안하게 만드세요.
       - 강조하고 싶은 핵심 노하우는 <blockquote> (인용구) 태그로 감싸주세요.
    3. 매우 길고 깊이 있는 내용: 
       - 전체 분량은 최소 2500자 이상으로 매우 길게 작성하세요. (구글은 정보량이 많은 롱폼 콘텐츠를 우대합니다.)
       - 추상적인 조언("개념을 확실히 하세요") 대신, 구체적인 수학적 접근법이나 문제 풀이 팁 등 실질적이고 유용한 정보(Actionable Advice)를 제공하세요.
    4. 자연스러운 백링크 유도: 
       - 타겟 사이트({target_url}) 링크를 본문 중간(관련 맥락이 나올 때)과 하단 마무리, 총 2번 이상 넣어주세요.
       - "실제로 제가 학생들에게 숙제로 내주는 자료인데, 아래 링크에서 다운받아 오늘 당장 풀어보세요: <a href="{target_url}">수능 수학 기출문제 무료 다운로드</a>" 처럼 문맥에 완벽히 녹아드는 앵커 텍스트를 사용하세요.
    
    [출력 형식]
    제목: [제목 내용]
    본문: [HTML 태그가 포함된 본문 내용 전체]
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
