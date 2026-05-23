import os
import json
import uuid
import datetime
import random
from google import genai
from google.genai import types

# 환경 변수에서 Gemini API 키 로드
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. Using dummy data.")
    client = None
else:
    client = genai.Client(api_key=GEMINI_API_KEY)

def generate_story_content(topic):
    """
    제미나이 텍스트 모델을 사용하여 웹스토리 대본과 이미지 생성용 프롬프트를 기획합니다.
    """
    if not client:
        return [
            {"heading": "고3 3월 모평 5등급 찍고 오열한 썰", "image_prompt": "A depressed high school student looking at a test paper, dark room, rainy window, cinematic lighting, 9:16 aspect ratio"},
            {"heading": "대치동 1타 인강 다 소용없더라", "image_prompt": "A messy desk filled with thick textbooks and a laptop, frustration, dark and moody, 9:16 aspect ratio"},
            {"heading": "결국 해답은 '기출'에 있었어", "image_prompt": "A glowing magical test paper with mathematical equations, hopeful lighting, 9:16 aspect ratio"}
        ]
    
    prompt = f"""
    당신은 수험생 커뮤니티(수만휘, 오르비 등)에서 가장 인기 있는 '썰'을 모바일 웹스토리 포맷으로 변환하는 천재 기획자이자 웹소설 작가입니다.
    주제: {topic}
    
    웹스토리는 5~7개의 슬라이드로 구성되며, 스마트폰 전체 화면에 노출됩니다.

    [가장 중요한 텍스트(heading) 작성 규칙]
    - 각 슬라이드의 텍스트는 뚝뚝 끊기는 문장이 아니라, **기승전결이 완벽하게 이어지는 하나의 흥미진진한 이야기(썰)**여야 합니다.
    - 슬라이드를 넘길 때마다 독자가 몰입할 수 있도록 인과관계와 감정선(자신감 -> 당황 -> 절망 -> 깨달음 등)이 자연스럽게 흘러가야 합니다.
    - 실제 수험생이 커뮤니티에 올릴 법한 생생하고 구체적인 묘사(예: 등급, 과목명, 시험지 넘기는 소리, 식은땀 등)를 디테일하게 넣어주세요.
    - 슬라이드당 너무 짧은 한 문장보다는, **읽는 맛이 살아있는 2~3문장(약 40~80자)**으로 구성해 주세요.

    [중요: 이미지 프롬프트 작성 규칙]
    - 이미지 생성 AI의 특성상 그림 속에 글자, 단어, 텍스트가 들어가면 외계어처럼 뭉개집니다.
    - 따라서 image_prompt에는 절대 글자나 문구에 대한 묘사를 넣지 말고, 끝에 "no text, no words, typography-free, clean background" 같은 옵션을 반드시 추가하세요. 
    - 시험지나 책을 묘사할 때도 글자가 보이지 않는 앵글이나 실루엣 위주의 분위기만 묘사하세요.
    
    반드시 아래 JSON 배열 형식으로만 응답하세요. (백틱 등 다른 문구는 절대 넣지 마세요)
    [
      {{
        "heading": "1슬라이드 텍스트 (스토리가 시작되는 2~3문장의 생생한 묘사)",
        "image_prompt": "English prompt for image generation, vertical 9:16"
      }}
    ]
    """
    
    # 텍스트 생성 모델
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
    )
    
    try:
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
        return json.loads(raw_text)
    except Exception as e:
        print("JSON Parse Error:", e)
        print("Raw text:", response.text)
        raise e

def generate_background_image(prompt):
    """
    제미나이 이미지 모델을 호출하여 배경 이미지를 생성합니다.
    """
    print(f"Generating image for prompt: {prompt}")
    
    if not client:
        return "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=720&h=1280"

    # 이미지 생성 모델
    image_model_name = "imagen-4.0-generate-001"
    
    try:
        result = client.models.generate_images(
            model=image_model_name,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="9:16",
                output_mime_type="image/jpeg"
            )
        )
        
        image_bytes = result.generated_images[0].image.image_bytes
        
        filename = f"{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join("public", "stories", filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
            
        return f"/stories/{filename}"
    except Exception as e:
        print(f"Image generation failed: {e}")
        return "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=720&h=1280"

def main():
    topics = [
        "경찰대 기출문제 처음 풀고 멘붕온 고3 썰",
        "수학 5등급에서 기출문제만 파서 1등급 찍은 썰",
        "대치동 학원 끊고 혼자 기출 풀다가 깨달음 얻은 썰",
        "고1 첫 모의고사 수학 40점 맞고 충격받은 썰",
        "수능 100일 남기고 기출문제집 3회독 한 후기",
        "수학 포기하려다가 사관학교 기출 풀고 자신감 얻은 썰",
        "내신 1등급인데 수능 수학 3등급 나와서 오열한 썰",
        "고2 겨울방학, 남들 롤할때 기출문제 풀어서 역전한 썰",
        "재수생이 말해주는 '기출문제가 전부다'라는 말의 진짜 의미",
        "수학 킬러문제 22번 풀다가 뇌정지 온 썰",
        "수포자가 수능 수학 2등급 맞고 오열한 썰",
        "기출문제 오답노트 쓰다가 깨달음 얻은 고3 썰"
    ]
    topic = random.choice(topics)
    print(f"Start generating web story: {topic}")
    
    story_content = generate_story_content(topic)
    
    pages = []
    for i, slide in enumerate(story_content):
        bg_image_url = generate_background_image(slide["image_prompt"])
        
        pages.append({
            "id": f"page{i+1}",
            "bgImage": bg_image_url,
            "heading": slide["heading"]
        })
    
    new_story_id = f"story-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    new_story = {
        "id": new_story_id,
        "title": topic,
        "publisher": "수학주식",
        "posterImage": pages[0]["bgImage"],
        "pages": pages,
        "outlinkText": "수능 수학 기출 무료 다운로드",
        "outlinkUrl": "https://math.stac100.com",
        "createdAt": datetime.datetime.now().isoformat() + "Z"
    }
    
    stories_file_path = os.path.join("src", "data", "stories.json")
    try:
        with open(stories_file_path, "r", encoding="utf-8") as f:
            stories = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        stories = []
        
    stories.insert(0, new_story)
    
    os.makedirs(os.path.dirname(stories_file_path), exist_ok=True)
    
    with open(stories_file_path, "w", encoding="utf-8") as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)
        
    print(f"Success! Web story ID: {new_story_id}")

if __name__ == "__main__":
    main()
