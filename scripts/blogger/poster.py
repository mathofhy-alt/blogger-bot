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
    
    # AI에게 오늘의 주제 후보들을 생성해달라고 요청
    topic_prompt = f"""
    수학 교육 및 대입 수능 전문 블로거로서 포스팅할 주제 1가지만 추천해줘.
    현재 시각은 {current_hour}시입니다. 시간대에 어울리는 주제면 더 좋습니다.
    (예: 아침엔 공부 자극, 오후엔 실전 연습 등)
    주제명만 딱 한 줄로 작성해줘.
    """
    try:
        topic_response = model.generate_content(topic_prompt)
        current_topic = topic_response.text.strip()
    except:
        current_topic = "수학 기출문제 분석 및 실전 연습법"

    # 포스트 생성
    title, content = generate_blog_post(current_topic, "https://math.stac100.com")
    
    if title and content:
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
