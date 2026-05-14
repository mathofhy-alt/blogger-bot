import json
import os
import time
import random
from auth import get_blogger_service
from generator import generate_blog_post, model
try:
    from indexing import submit_url as indexing_submit
except ImportError:
    indexing_submit = None

def load_blogs():
    """저장된 블로그 목록을 로드합니다. 환경 변수(BLOGS_JSON_DATA)가 있으면 이를 우선 사용합니다."""
    blogs_data = os.getenv('BLOGS_JSON_DATA')
    if blogs_data:
        try:
            return json.loads(blogs_data)
        except Exception as e:
            print(f"환경 변수 블로그 데이터 파싱 실패: {e}")
    
    path = 'scripts/blogger/blogs.json'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def post_to_blogger(blog_id, title, content):
    """지정한 블로그 ID로 포스트를 업로드합니다."""
    service = get_blogger_service()
    if not service:
        return None

    body = {
        "kind": "blogger#post",
        "title": title,
        "content": content.replace('\n', '<br>') # 줄바꿈을 HTML 태그로 변환
    }

    try:
        posts = service.posts()
        request = posts.insert(blogId=blog_id, body=body)
        response = request.execute()
        return response
    except Exception as e:
        print(f"블로그({blog_id}) 포스팅 중 오류 발생: {e}")
        return None

def request_indexing(post_url: str):
    """발행된 포스트 URL의 구글 색인을 요청합니다."""
    if not indexing_submit:
        print("[Indexing] indexing.py 모듈 없음 — 색인 요청 건너뜀")
        return
    if not post_url:
        return
    try:
        indexing_submit(post_url)
    except Exception as e:
        print(f"[Indexing] 색인 요청 중 오류(포스팅은 성공): {e}")

def run_automation():
    """현재 시간에 맞춰 블로그 1개에만 포스팅을 진행합니다."""
    blogs = load_blogs()
    if not blogs:
        print("포스팅할 블로그가 없습니다.")
        return

    # 블로그 목록을 이름순으로 정렬 (일관성을 위해)
    blogs.sort(key=lambda x: x['name'])
    
    # 현재 한국 시간(KST) 기준 시간 가져오기 (GitHub Actions는 UTC 기준이므로 +9시간)
    from datetime import datetime, timedelta
    current_time_kst = datetime.utcnow() + timedelta(hours=9)
    current_hour = current_time_kst.hour
    
    # 현재 시간에 해당하는 블로그 선택 (24개 블로그 기준)
    blog_index = current_hour % len(blogs)
    blog = blogs[blog_index]
    
    blog_name = blog['name']
    blog_id = blog['id']
    
    print(f"현재 {current_hour}시입니다. '{blog_name}' 블로그 포스팅을 시작합니다.")
    
    # AI에게 오늘의 주제 후보들을 다양하게 생성하도록 요청
    categories = [
        '수능 수학 기출문제 무료 다운로드 및 분석', 
        '경찰대 수학 기출문제 완벽 풀이 전략', 
        '무료 기출로 끝내는 수학 노베이스 탈출법', 
        '수능 수학 기출문제 100% 활용법', 
        '고3 수능 기출 무료 자료 및 등급별 학습법', 
        '수능 수학 기출 완벽 분석 및 오답노트 작성법', 
        '수학 기출문제 무료 다운로드 및 실전 연습법',
        '고3 수학 모의고사 무료 다운로드 및 성적 향상 비법',
        '수학 모의고사 실전 대비 기출 학습법'
    ]
    random_category = random.choice(categories)
    target_audiences = ['고1', '고2', '고3', '수학 노베이스', '1등급 최상위권', '수학 포기자(수포자)', '학부모']
    random_audience = random.choice(target_audiences)
    current_date = current_time_kst.strftime('%Y년 %m월 %d일')
    
    topic_prompt = f"""
    당신은 대입 수능 수학 전문 블로거입니다. 
    오늘의 키워드는 '{random_category}'이고, 타겟 독자는 '{random_audience}'입니다.
    이 키워드와 타겟 독자를 바탕으로 학생들이 클릭하고 싶어지는 매우 독창적이고 구체적인 블로그 포스팅 주제 1가지만 추천해줘.
    매번 똑같은 패턴이 되지 않도록, 오늘은 무작위 상황(예: 슬럼프 극복, 실수 줄이기, 특정 단원 약점 등)을 하나 가정해서 구체적으로 적어줘.
    주제명만 딱 한 줄로 작성해줘.
    """
    try:
        from google.generativeai.types import GenerationConfig
        topic_response = model.generate_content(
            topic_prompt,
            generation_config=GenerationConfig(temperature=0.9)
        )
        current_topic = topic_response.text.strip()
    except:
        current_topic = f"[{random_audience} 대상] {random_category} 및 실전 연습법"

    from generator import generate_blog_image
    
    # 이미지 생성 (나노바나나)
    image_url = generate_blog_image(current_topic)

    # 포스트 생성
    title, content = generate_blog_post(current_topic, "https://math.stac100.com")
    
    if title and content:
        # 이미지가 성공적으로 생성되었다면 본문 최상단에 삽입
        if image_url:
            img_html = f'<div style="text-align: center; margin-bottom: 20px;"><img src="{image_url}" alt="{current_topic}" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" /></div>\n<br>\n'
            content = img_html + content

        result = post_to_blogger(blog_id, title, content)
        if result:
            print(f"성공! '{blog_name}' 블로그에 포스팅 완료.")
            # 발행된 URL로 구글 색인 요청
            post_url = result.get('url')
            request_indexing(post_url)
        else:
            print(f"'{blog_name}' 포스팅 실패")
    else:
        print("콘텐츠 생성 실패.")

if __name__ == '__main__':
    run_automation()
