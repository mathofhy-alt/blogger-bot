"""
Google Indexing API 공용 모듈 (OAuth2 방식)
----------------------------------------------
Blogger API와 동일한 OAuth2 credentials를 사용합니다.
Search Console 소유자 계정(mathofhy@gmail.com)으로 인증하므로
서비스 계정 Search Console 등록이 필요 없습니다.

환경 변수:
  BLOGGER_TOKEN_JSON        : 기존 Blogger OAuth 토큰 (GitHub Actions용)
  BLOGGER_CREDENTIALS_JSON  : 기존 Blogger OAuth credentials (GitHub Actions용)
"""

import sys
import json
import os
import time
import argparse

# Windows cp949 콘솔 인코딩 문제 방지
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Blogger + Indexing API 동시 권한
SCOPES = [
    'https://www.googleapis.com/auth/blogger',
    'https://www.googleapis.com/auth/indexing',
]

TOKEN_PATH = 'scripts/blogger/token.json'
CREDS_PATH = 'scripts/blogger/credentials.json'

# 할당량 보호: 요청 간 딜레이(초)
REQUEST_DELAY = 0.5


def _get_credentials():
    """OAuth2 인증 정보를 반환합니다 (auth.py와 동일한 방식)."""
    creds = None

    token_data = os.getenv('BLOGGER_TOKEN_JSON')
    creds_data = os.getenv('BLOGGER_CREDENTIALS_JSON')

    if token_data:
        creds = Credentials.from_authorized_user_info(json.loads(token_data), SCOPES)
    elif os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if creds_data:
                flow = InstalledAppFlow.from_client_config(json.loads(creds_data), SCOPES)
            elif os.path.exists(CREDS_PATH):
                flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
            else:
                print("[Indexing] [ERROR] credentials.json을 찾을 수 없습니다.")
                return None

            if os.getenv('GITHUB_ACTIONS'):
                print("[Indexing] [ERROR] GitHub Actions에서는 신규 로그인 불가. 로컬 token.json 재생성 후 시크릿 업데이트 필요.")
                return None

            creds = flow.run_local_server(port=0)

        if not os.getenv('GITHUB_ACTIONS') and creds:
            with open(TOKEN_PATH, 'w') as f:
                f.write(creds.to_json())

    return creds


def _build_service():
    """Indexing API 서비스 객체를 반환합니다."""
    creds = _get_credentials()
    if not creds:
        return None
    return build("indexing", "v3", credentials=creds, cache_discovery=False)


def submit_url(url: str, service=None) -> bool:
    """단일 URL의 색인을 요청합니다."""
    if service is None:
        service = _build_service()
    if service is None:
        return False

    body = {"url": url, "type": "URL_UPDATED"}

    try:
        response = service.urlNotifications().publish(body=body).execute()
        notify_time = response.get("urlNotificationMetadata", {}).get("latestUpdate", {}).get("notifyTime", "")
        print(f"[Indexing] [OK] 색인 요청 완료: {url}")
        if notify_time:
            print(f"           notifyTime: {notify_time}")
        return True
    except HttpError as e:
        status = e.resp.status
        if status == 403:
            print(f"[Indexing] [403] 권한 없음: {url}")
            print("           Search Console에서 이 계정이 소유자인지 확인하세요.")
        elif status == 429:
            print("[Indexing] [429] 할당량 초과 - 10초 후 재시도")
            time.sleep(10)
            try:
                service.urlNotifications().publish(body=body).execute()
                print(f"[Indexing] [OK] 재시도 성공: {url}")
                return True
            except Exception:
                print(f"[Indexing] [FAIL] 재시도도 실패: {url}")
        else:
            print(f"[Indexing] [ERROR] HTTP {status}: {url}")
        return False
    except Exception as e:
        print(f"[Indexing] [ERROR] 예외 발생: {url} - {e}")
        return False


def submit_urls(urls: list[str], daily_limit: int = 180) -> dict:
    """여러 URL의 색인을 일괄 요청합니다."""
    service = _build_service()
    if service is None:
        return {"success": [], "failed": list(urls)}

    results = {"success": [], "failed": []}
    submitted = 0

    for url in urls:
        if submitted >= daily_limit:
            print(f"[Indexing] 일일 한도({daily_limit}) 도달. 나머지 {len(urls) - submitted}개 건너뜀.")
            results["failed"].extend(urls[submitted:])
            break

        ok = submit_url(url, service=service)
        if ok:
            results["success"].append(url)
        else:
            results["failed"].append(url)

        submitted += 1
        if submitted < len(urls):
            time.sleep(REQUEST_DELAY)

    print(f"\n[Indexing] 완료 - 성공: {len(results['success'])}개 / 실패: {len(results['failed'])}개")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Indexing API 색인 요청")
    parser.add_argument("--url", type=str, help="색인 요청할 URL")
    args = parser.parse_args()

    test_url = args.url or "https://math.stac100.com"
    print(f"[Indexing] 테스트 요청: {test_url}")
    submit_url(test_url)
