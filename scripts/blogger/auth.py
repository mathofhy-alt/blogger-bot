import json
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Blogger API 권한 범위 (읽기/쓰기 권한 필요)
SCOPES = ['https://www.googleapis.com/auth/blogger']

def get_blogger_service():
    """Blogger API 서비스 객체를 반환합니다. 환경 변수(GitHub Secrets)가 있으면 이를 우선 사용합니다."""
    creds = None
    
    # 깃허브 금고(Secrets)에서 데이터 가져오기 시도
    token_data = os.getenv('BLOGGER_TOKEN_JSON')
    creds_data = os.getenv('BLOGGER_CREDENTIALS_JSON')

    if token_data:
        # 깃허브 환경인 경우
        creds = Credentials.from_authorized_user_info(json.loads(token_data), SCOPES)
    elif os.path.exists('scripts/blogger/token.json'):
        # 로컬 환경인 경우
        creds = Credentials.from_authorized_user_file('scripts/blogger/token.json', SCOPES)
    
    # 유효한 토큰이 없거나 만료된 경우
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # 깃허브 금고에 클라이언트 정보가 있는 경우
            if creds_data:
                flow = InstalledAppFlow.from_client_config(json.loads(creds_data), SCOPES)
            else:
                if not os.path.exists('scripts/blogger/credentials.json'):
                    print("Error: 인증 정보가 없습니다.")
                    return None
                flow = InstalledAppFlow.from_client_secrets_file('scripts/blogger/credentials.json', SCOPES)
            
            # 깃허브 환경에서는 서버를 띄울 수 없으므로 에러 발생 (로컬에서 먼저 토큰을 생성해야 함)
            if os.getenv('GITHUB_ACTIONS'):
                print("Error: GitHub Actions 환경에서는 신규 로그인을 할 수 없습니다. 로컬에서 생성된 token.json을 Secrets에 등록해 주세요.")
                return None
                
            creds = flow.run_local_server(port=0)
            
        # 로컬에서만 파일로 저장 (깃허브 서버는 파일 저장이 의미 없음)
        if not os.getenv('GITHUB_ACTIONS'):
            with open('scripts/blogger/token.json', 'w') as token:
                token.write(creds.to_json())

    return build('blogger', 'v3', credentials=creds)

if __name__ == '__main__':
    service = get_blogger_service()
    if service:
        print("Blogger API 인증 성공!")
