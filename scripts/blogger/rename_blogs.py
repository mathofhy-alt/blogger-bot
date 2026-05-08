import json
import time
import random
from auth import get_blogger_service
from generator import model

def generate_blog_names(count):
    """Gemini를 사용하여 지정된 개수만큼의 블로그 이름을 생성합니다."""
    prompt = f"""
    수학 교육, 기출문제 다운로드, 수능 및 모의고사 분석을 전문으로 하는 블로그 이름 {count}개를 지어주세요.
    
    [지시 사항]
    1. 각 이름은 고유해야 하며 서로 겹치지 않게 해주세요.
    2. 절대로 "블로그 1", "블로그 2" 처럼 숫자를 붙이지 마세요.
    3. "수학", "기출", "모의고사", "공부", "분석", "가이드", "창고", "비법", "정석", "노트", "비밀", "전략", "필승" 등의 키워드를 조합하세요.
    4. 예시: "수학 실력 향상의 길", "기출문제 완벽 분석실", "대입 성공 수학 비법", "모의고사 오답 정복기", "수학 고수의 기밀 노트"
    5. 한 줄에 이름 하나씩만 출력하고, 번호나 기호를 붙이지 마세요.
    """
    
    try:
        response = model.generate_content(prompt)
        # 줄바꿈으로 나누고 공백 제거, 빈 줄 제외
        names = [n.strip() for n in response.text.strip().split('\n') if n.strip() and len(n.strip()) > 2]
        
        # 만약 AI가 생성한 이름이 부족하면 백업 리스트와 조합
        if len(names) < count:
            backups = ["수학의 정석 분석", "기출문제 보물섬", "모의고사 만점 가이드", "대입 수능 수학 전략", "수학 오답 완벽 케어", "기출 분석 마스터"]
            while len(names) < count:
                names.append(random.choice(backups) + f" {random.randint(100, 999)}") # 정말 부족할 때만 숫자 추가
                
        return names[:count]
    except Exception as e:
        print(f"이름 생성 중 오류 발생: {e}")
        return [f"수학 기출문제 분석 블로그 {i+1}" for i in range(count)]

def rename_all_blogs():
    """blogs.json에 있는 모든 블로그의 이름을 변경합니다."""
    service = get_blogger_service()
    if not service:
        return

    # 저장된 블로그 목록 로드
    blogs_path = 'scripts/blogger/blogs.json'
    try:
        with open(blogs_path, 'r', encoding='utf-8') as f:
            blogs = json.load(f)
    except Exception as e:
        print(f"블로그 목록을 읽을 수 없습니다: {e}")
        return

    print(f"총 {len(blogs)}개의 블로그 이름을 변경합니다.")
    
    # 새 이름 생성
    new_names = generate_blog_names(len(blogs))
    
    for i, blog in enumerate(blogs):
        blog_id = blog['id']
        old_name = blog['name']
        new_name = new_names[i] if i < len(new_names) else f"수학 분석 창고 {i+1}"
        
        print(f"[{i+1}/{len(blogs)}] '{old_name}' -> '{new_name}' 변경 중...")
        
        try:
            # 먼저 현재 블로그 정보를 가져옵니다 (필수 필드 확보를 위해)
            blog_info = service.blogs().get(blogId=blog_id).execute()
            
            # 이름을 변경합니다
            blog_info['name'] = new_name
            
            # 전체 정보를 업데이트(PUT) 합니다
            service.blogs().update(blogId=blog_id, body=blog_info).execute()
            print("성공!")
            
            time.sleep(1) 
            
        except Exception as e:
            print(f"실패: {e}")

    print("\n모든 블로그 이름 변경 작업이 완료되었습니다!")

if __name__ == '__main__':
    rename_all_blogs()
