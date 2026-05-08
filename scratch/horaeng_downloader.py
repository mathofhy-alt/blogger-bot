import os
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, unquote
import re
import unicodedata

EXCLUDE_SUBJECTS = ["국어", "영어", "한국사", "사회", "과학", "탐구", "제2외국어", "한문", "물리", "화학", "생명과학", "지구과학", "생활과윤리", "윤리와사상", "한국지리", "세계지리", "동아시아사", "세계사", "정치와법", "사회문화", "경제"]

def normalize_str(s):
    return unicodedata.normalize('NFC', s)

BASE_URL = "https://horaeng.com/"
CATEGORIES = {
    "고3": "https://horaeng.com/category/고3 모의고사",
    "고2": "https://horaeng.com/category/고2 모의고사",
    "고1": "https://horaeng.com/category/고1 모의고사"
}

DOWNLOAD_DIR = os.path.abspath("downloads/horaeng")

def get_soup(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_post_links(category_url):
    links = []
    current_url = category_url
    while current_url:
        print(f"Fetching posts from {current_url}...")
        soup = get_soup(current_url)
        if not soup:
            break
        
        # Find post links
        titles = soup.select('.elementor-post__title a')
        for title in titles:
            links.append(title['href'])
        
        print(f"  Found {len(titles)} titles on this page.")
        
        # Find next page
        next_page = soup.select_one('a.next.page-numbers')
        if next_page:
            current_url = next_page['href']
        else:
            current_url = None
            
    return links

def download_file(url, folder):
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    filename = unquote(url.split('/')[-1])
    filepath = os.path.join(folder, filename)
    
    if os.path.exists(filepath):
        print(f"Skipping {filename} (already exists)")
        return

    print(f"Downloading {filename}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def process_post(post_url, grade_folder):
    print(f"Processing post: {post_url}")
    soup = get_soup(post_url)
    if not soup:
        return
    
    # Find links that contain "수학" and are PDF
    links = soup.find_all('a', href=True)
    for link in links:
        text = link.get_text()
        href = link['href']
        
        # Refining filter: exclude "수학" if it's only part of "수학능력시험"
        norm_text = normalize_str(text)
        norm_href = normalize_str(unquote(href).split('/')[-1])
        
        clean_text = re.sub(r'대학수학능력시험|수학능력시험|수능|대수능', '', norm_text)
        clean_href = re.sub(r'대학수학능력시험|수학능력시험|수능|대수능', '', norm_href)
        
        is_math = False
        if ("수학" in clean_text or "수학" in clean_href) and href.endswith('.pdf'):
            is_math = True
            # Double check: does it contain other subjects?
            for sub in EXCLUDE_SUBJECTS:
                if sub in norm_text or sub in norm_href:
                    is_math = False
                    break
        
        if is_math:
            print(f"  Match found: Text='{norm_text}', Href='{norm_href}'")
            download_url = urljoin(post_url, href)
            download_file(download_url, grade_folder)
            time.sleep(0.5) # Sleep between files

def main():
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)
        
    for grade, url in CATEGORIES.items():
        print(f"Starting {grade}...")
        grade_folder = os.path.join(DOWNLOAD_DIR, grade)
        post_links = get_post_links(url)
        print(f"Found {len(post_links)} posts in {grade}")
        
        for post_url in post_links:
            process_post(post_url, grade_folder)
            time.sleep(1) # Sleep between posts

if __name__ == "__main__":
    main()
