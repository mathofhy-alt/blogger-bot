// scripts/submit_twitter.js
// 사용법: node scripts/submit_twitter.js
// 이 스크립트는 배포 완료 시점에 호출되어, 아직 X에 공유되지 않은 최신 기출 포스트 및 기출썰을
// "본문 트윗 + 댓글 링크"의 타래(Thread) 형태로 X API v2를 통해 자동 발행합니다.

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

// 1. 설정 및 환경 변수 로드
let CONSUMER_KEY = process.env.X_CONSUMER_KEY;
let CONSUMER_SECRET = process.env.X_CONSUMER_SECRET;
let ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
let ACCESS_SECRET = process.env.X_ACCESS_SECRET;
let GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// .env.local 파일이 있으면 읽어오기 (로컬 테스트용)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const keyMatch = line.match(/^\s*X_CONSUMER_KEY\s*=\s*(.+)$/);
    const secretMatch = line.match(/^\s*X_CONSUMER_SECRET\s*=\s*(.+)$/);
    const tokenMatch = line.match(/^\s*X_ACCESS_TOKEN\s*=\s*(.+)$/);
    const tokenSecretMatch = line.match(/^\s*X_ACCESS_SECRET\s*=\s*(.+)$/);
    const geminiMatch = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)$/);
    
    if (keyMatch) CONSUMER_KEY = keyMatch[1].trim().replace(/['"]/g, '');
    if (secretMatch) CONSUMER_SECRET = secretMatch[1].trim().replace(/['"]/g, '');
    if (tokenMatch) ACCESS_TOKEN = tokenMatch[1].trim().replace(/['"]/g, '');
    if (tokenSecretMatch) ACCESS_SECRET = tokenSecretMatch[1].trim().replace(/['"]/g, '');
    if (geminiMatch) GEMINI_API_KEY = geminiMatch[1].trim().replace(/['"]/g, '');
  }
}

const HOST_URL = 'https://math.stac100.com';
const HISTORY_FILE = path.join(__dirname, '.submitted_twitter_urls.json');

// 2. `posts.ts` 파일에서 ALL_POSTS 상수 데이터 수집 및 안전 파싱
function getRecentPostsFromTs() {
  const postsTsPath = path.join(__dirname, '..', 'src', 'data', 'posts.ts');
  if (!fs.existsSync(postsTsPath)) {
    console.warn("posts.ts 파일을 찾을 수 없습니다.");
    return [];
  }

  try {
    const fileContent = fs.readFileSync(postsTsPath, 'utf8');
    // ALL_POSTS 대괄호 내부를 추출하기 위한 정규식 파서
    const match = fileContent.match(/export const ALL_POSTS: Post\[\] = (\[[\s\S]*?\]);/);
    if (!match) return [];
    
    // JS 코드를 안전하게 평가하여 상수로 파싱 (Node.js vm이나 간단한 eval 대체)
    // posts.ts는 JSON 호환형 배열 구조이므로 단순 eval로도 안전하게 배열로 복원 가능합니다.
    const allPosts = eval(match[1]);
    return Array.isArray(allPosts) ? allPosts : [];
  } catch (err) {
    console.error("posts.ts 파싱 오류:", err);
    return [];
  }
}

// 3. `stories.json`에서 최신 기출썰 수집
function getRecentStories() {
  const storiesJsonPath = path.join(__dirname, '..', 'src', 'data', 'stories.json');
  if (!fs.existsSync(storiesJsonPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(storiesJsonPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("stories.json 파싱 오류:", err);
    return [];
  }
}

// 4. 이력 관리 파일 조회 및 생성
function getSubmittedUrls() {
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSubmittedUrl(url) {
  const urls = getSubmittedUrls();
  if (!urls.includes(url)) {
    urls.push(url);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(urls, null, 2));
  }
}

// 5. 메인 자동 발행 실행 프로세스
async function run() {
  console.log("\n==================================================");
  console.log("🐦 X (Twitter) 자동 발행 봇 가동 시작");
  console.log("==================================================");

  const posts = getRecentPostsFromTs();
  const stories = getRecentStories();
  const submittedUrls = getSubmittedUrls();

  const candidates = [];

  // A. 기출 포스트 후보 수집 (최근 5개 중 upcoming=true 가 아닌 실제 등록 완료 글)
  const activePosts = posts.filter(p => !p.upcoming).slice(0, 5);
  for (const post of activePosts) {
    const destinationLink = `${HOST_URL}/posts/${post.slug}`;
    candidates.push({
      link: destinationLink,
      type: 'post',
      title: post.title,
      summary: post.summary,
      // X Premium 구독 상태이므로 글자 수 제한 없이 매력적이고 긴 설명 제공
      tweetText: `[수학 기출 업데이트] 2026학년도 대비 실전 훈련 자료집!\n\n📌 ${post.title}\n\n과외용, 독학용 인쇄에 가장 적합하게 편집된 기출문제지와 정답 해설지가 무료 업로드되었습니다. 아래 타래의 댓글 링크에서 지금 바로 다운로드하세요! 👇 #수능수학 #수학기출 #기출문제`
    });
  }

  // B. 기출썰 웹 스토리 후보 수집 (최근 5개)
  const recentStories = stories.slice(0, 5);
  for (const story of recentStories) {
    const destinationLink = `${HOST_URL}/stories/${story.id}`;
    candidates.push({
      link: destinationLink,
      type: 'story',
      title: story.title,
      summary: story.title,
      tweetText: `[수학 기출썰 카드뉴스] 📚\n\n📌 ${story.title}\n\n흥미진진한 수능 수학 실화 및 꿀팁 카드뉴스입니다. 이미지를 넘기며 가볍고 재밌게 감상하세요. 상세 스토리는 아래 댓글 링크에서 즉시 읽어보실 수 있습니다! 👇 #공부자극 #수능꿀팁 #수학공부`
    });
  }

  // 아직 X에 올라가지 않은 최신 1개 대상 선정 (중복 제거)
  const target = candidates.find(c => !submittedUrls.includes(c.link));

  if (!target) {
    console.log("✅ X에 새로 발행할 신규 콘텐츠가 없습니다. 모든 포스트가 동기화되어 있습니다.");
    console.log("==================================================\n");
    return;
  }

  console.log(`\n🆕 신규 발행 대상 감지: [${target.type.toUpperCase()}] ${target.title}`);
  console.log(`👉 목적지 주소: ${target.link}`);

  // 6. Gemini AI가 설정되어 있으면 인공지능 문구 생성 적용
  if (GEMINI_API_KEY) {
    target.tweetText = await generateAiTweet(target, GEMINI_API_KEY);
  }

  // API 키 유효성 체크
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
    console.log("\n⚠️ 알림: X_CONSUMER_KEY 등 API 토큰 환경 변수가 설정되지 않았습니다.");
    console.log("   실제 트윗을 올리지 않고 모의 테스트 모드로 스캔만 마쳤습니다.");
    console.log("   (API 연동 가동을 시작하려면 X 개발자 키를 .env.local 이나 Vercel에 적어주세요.)");
    console.log("==================================================\n");
    return;
  }

  // X Client 초기화 (OAuth 1.0a User Context 인증 활용 - 토큰 갱신 불필요)
  const client = new TwitterApi({
    appKey: CONSUMER_KEY,
    appSecret: CONSUMER_SECRET,
    accessToken: ACCESS_TOKEN,
    accessSecret: ACCESS_SECRET,
  });

  try {
    console.log("\n⏳ 1단계: 본문 요약 트윗 발행 중...");
    
    // 1단계: 본문 발행 (이미지 업로드 비용 $0.20 방지를 위해 순수 텍스트만 전송)
    const tweetResponse = await client.v2.tweet(target.tweetText);
    const parentTweetId = tweetResponse.data.id;
    console.log(`✅ 본문 트윗 발행 완료 (ID: ${parentTweetId})`);

    console.log("⏳ 2단계: 댓글 타래로 바로가기 링크 발행 중...");
    
    // 2단계: 1단계에서 획득한 트윗 ID 아래에 댓글(Reply) 형식으로 목적지 URL 발행
    const replyResponse = await client.v2.reply(
      `무료 자료 다운로드 및 기출썰 읽기 링크 바로가기 📥\n👉 ${target.link}`,
      parentTweetId
    );
    console.log(`✅ 댓글 링크 트윗 발행 완료 (ID: ${replyResponse.data.id})`);

    // 이력 파일에 저장 (다시는 중복 발행하지 않음)
    saveSubmittedUrl(target.link);
    console.log("\n🎉 성공적으로 X(트위터) 연동 발행을 모두 완료했습니다!");
    console.log("==================================================\n");

  } catch (err) {
    console.error("\n❌ X API 통신 도중 에러가 발생했습니다:", err);
    console.log("==================================================\n");
  }
}

// 7. Gemini AI 카피라이팅 생성 도우미 함수 (패키지 설치 없이 원시 fetch로 호출)
async function generateAiTweet(target, apiKey) {
  console.log("🤖 Gemini AI 카피라이팅 엔진 호출 중...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
당신은 실력이 뛰어난 고등학교 수학 교육 마케터이자 전문 카피라이터입니다.
아래의 수학 교육 콘텐츠 정보를 바탕으로 X(트위터) 공식 계정에 업로드할 매력적인 홍보 트윗 본문 문구를 한국어로 작성해 주세요.

[조건]
1. 타겟 독자는 수능/내신 준비생, 학부모, 수학 과외 교사 및 학원 강사입니다.
2. 친근하면서도 정보의 전문성과 신뢰성을 주는 톤앤매너로 작성해 주세요.
3. 분량은 한글 기준 150자~250자 내외로 풍성하고 자연스럽게 채워 주세요.
4. 맨 마지막 줄에 관련 해시태그 2~3개를 달아주세요. (예: #수능수학 #수학기출)
5. 본문 문장 내에 외부 링크 URL 주소는 절대로 포함하지 마세요! (링크는 댓글 타래로 별도 발행되므로 필요 없습니다.)
6. 오직 최종 트윗 본문 텍스트만 답변해 주세요.

[콘텐츠 정보]
- 종류: ${target.type === 'post' ? '기출문제 자료실 무료 다운로드 업데이트 소식' : '기출썰 카드뉴스 콘텐츠 소식'}
- 제목: ${target.title}
- 요약내용: ${target.summary || ''}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      const trimmed = generatedText.trim();
      console.log("🤖 AI가 생성한 문구:\n--------------------------------------------------");
      console.log(trimmed);
      console.log("--------------------------------------------------");
      return trimmed;
    }
  } catch (err) {
    console.error("⚠️ AI 멘트 생성 실패 (기본 템플릿으로 대체합니다):", err.message);
  }
  return target.tweetText;
}

run();
