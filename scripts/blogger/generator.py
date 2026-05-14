import google.generativeai as genai
import os
import random

# Gemini API 설정 (환경 변수 또는 직접 입력)
# 실제 사용 시 .env 파일 등에 저장하는 것을 권장합니다.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
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

        return title, body

    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return None, None

def generate_blog_image(topic):
    """나노바나나(Gemini Imagen 3)를 사용하여 썸네일 이미지를 생성하고 호스팅 URL을 반환합니다."""
    import requests
    import base64
    
    # 1. 제미나이에게 이미지 생성을 위한 상세 프롬프트 영문으로 번역/작성 요청
    prompt_for_image = f"Write a highly detailed, short english prompt to generate a blog thumbnail image for the following topic. It should be cinematic, educational, professional, and visually appealing. Return ONLY the prompt text, without any introductory text, conversational filler, or markdown formatting like **. Topic: {topic}"
    try:
        image_prompt_response = model.generate_content(prompt_for_image)
        image_prompt = image_prompt_response.text.strip()
    except:
        image_prompt = "A professional and aesthetic desk setup with math study materials, cinematic lighting, 4k"

    # 2. 나노바나나(Imagen 3) API 직접 호출 시도 (requests 사용)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    url = f'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={GEMINI_API_KEY}'
    
    payload = {
        'instances': [{'prompt': image_prompt}],
        'parameters': {'sampleCount': 1, 'aspectRatio': '16:9'}
    }
    
    try:
        r = requests.post(url, json=payload)
        
        # 만약 404 에러(계정 권한 부족 등)가 발생하면 무료 우회 API로 자동 전환
        if r.status_code != 200:
            print(f"나노바나나 API 호출 실패 ({r.status_code}): {r.text[:100]}")
            print("대체 AI(Pollinations.ai)를 사용하여 이미지를 생성합니다...")
            import urllib.parse
            encoded_prompt = urllib.parse.quote(image_prompt)
            fallback_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&nologo=true"
            print(f"이미지 생성 성공 (대체 AI): {fallback_url}")
            return fallback_url

        r.raise_for_status()
        data = r.json()
        
        if 'predictions' in data and len(data['predictions']) > 0:
            b64_image = data['predictions'][0].get('bytesBase64Encoded')
            if not b64_image:
                raise ValueError("이미지 생성 결과에 바이트 데이터가 없습니다.")
                
            # 3. FreeImage.Host 공용 API를 사용하여 이미지 업로드 및 URL 획득
            print("이미지 생성 성공, 호스팅 서버에 업로드 중...")
            upload_response = requests.post(
                'https://freeimage.host/api/1/upload',
                data={
                    'key': '6d207e02198a847aa98d0a2a901485a5',
                    'action': 'upload',
                    'source': b64_image,
                    'format': 'json'
                }
            )
            upload_data = upload_response.json()
            if upload_response.status_code == 200 and 'image' in upload_data:
                image_url = upload_data['image']['url']
                print(f"이미지 호스팅 성공: {image_url}")
                return image_url
            else:
                raise ValueError(f"이미지 업로드 실패: {upload_data}")
        else:
            raise ValueError("나노바나나 API가 예측 결과를 반환하지 않았습니다.")
            
    except Exception as e:
        print(f"이미지 생성/업로드 중 오류 발생: {e}")
        print("대체 AI(Pollinations.ai)를 사용하여 이미지를 생성합니다...")
        import urllib.parse
        encoded_prompt = urllib.parse.quote(image_prompt)
        fallback_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&nologo=true"
        print(f"이미지 생성 성공 (대체 AI): {fallback_url}")
        return fallback_url

if __name__ == '__main__':
    # 테스트 실행
    test_topic = "2025학년도 고3 5월 학력평가 수학 기출문제"
    test_url = "https://math.stac100.com"
    title, body = generate_blog_post(test_topic, test_url)
    if title:
        print(f"생성된 제목: {title}")
        print("-" * 50)
        print(f"생성된 본문 요약: {body[:100]}...")
