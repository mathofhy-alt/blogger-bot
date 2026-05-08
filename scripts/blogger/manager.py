import json
import os
from auth import get_blogger_service

BLOGS_DATA_PATH = 'scripts/blogger/blogs.json'

def update_blogs_list():
    """사용자 계정의 모든 블로그 목록을 가져와 JSON 파일로 저장합니다."""
    service = get_blogger_service()
    if not service:
        return

    print("블로그 목록을 가져오는 중...")
    try:
        # 사용자 본인의 블로그 목록 조회
        blogs_result = service.blogs().listByUser(userId='self').execute()
        
        blogs_list = []
        if 'items' in blogs_result:
            for blog in blogs_result['items']:
                blogs_list.append({
                    'id': blog['id'],
                    'name': blog['name'],
                    'url': blog['url'],
                    'posts_count': blog['posts']['totalItems']
                })
            
            with open(BLOGS_DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(blogs_list, f, ensure_ascii=False, indent=4)
            
            print(f"성공! 총 {len(blogs_list)}개의 블로그 정보를 {BLOGS_DATA_PATH}에 저장했습니다.")
            return blogs_list
        else:
            print("블로그를 찾을 수 없습니다.")
            return []
            
    except Exception as e:
        print(f"오류 발생: {e}")
        return []

def get_saved_blogs():
    """저장된 블로그 목록을 로드합니다."""
    if os.path.exists(BLOGS_DATA_PATH):
        with open(BLOGS_DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return update_blogs_list()

if __name__ == '__main__':
    update_blogs_list()
