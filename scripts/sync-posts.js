/**
 * sync-posts.js
 *
 * 사용법: node scripts/sync-posts.js
 *
 * 폴더 구조를 스캔해서:
 *  1. PDF 파일을 public/files/ 로 복사
 *  2. src/data/posts.ts 를 자동 생성
 *
 * 스캔 대상 폴더 (이 프로젝트 기준 상대 경로):
 *   ../모의고사/{년도}/{학년}/{월}_{종류}.pdf
 *   ../수능/{년도}/{종류}.pdf
 *   ../경찰대/{년도}/{종류}.pdf
 *   ../사관학교/{년도}/{종류}.pdf
 */

const fs   = require('fs');
const path = require('path');

// ── 경로 설정 ─────────────────────────────────────────────
const PROJECT_ROOT = __dirname + '/..';                    // math-girul/
const SOURCE_ROOT  = path.join(PROJECT_ROOT, '..');        // 기출홈페이지/
const PUBLIC_FILES = path.join(PROJECT_ROOT, 'public', 'files');
const POSTS_FILE   = path.join(PROJECT_ROOT, 'src', 'data', 'posts.ts');

// ── 학년 정규화 ───────────────────────────────────────────
const GRADE_MAP = { '고1': 1, '고2': 2, '고3': 3 };

// ── 월 매핑 ───────────────────────────────────────────────
const MONTH_NAMES = {
  '1': '1월', '1월': '1월',
  '2': '2월', '2월': '2월',
  '3': '3월', '3월': '3월',
  '4': '4월', '4월': '4월',
  '5': '5월', '5월': '5월',
  '6': '6월', '6월': '6월',
  '7': '7월', '7월': '7월',
  '8': '8월', '8월': '8월',
  '9': '9월', '9월': '9월',
  '10': '10월', '10월': '10월',
  '11': '11월', '11월': '11월',
  '12': '12월', '12월': '12월',
};

// ── 파일 종류 정규화 ──────────────────────────────────────
function normalizeFileType(name) {
  if (/문제/.test(name)) return '문제지';
  if (/해설/.test(name)) return '해설지';
  if (/정답/.test(name)) return '정답지';
  return name;
}

// ── 폴더가 없으면 생성 ────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── 파일 복사 + 소스에 up_ 마킹 ────────────────────────────
// 이미 up_가 붙어있으면 복사 건너뜀 (이미 처리된 파일)
function copyFileAndMark(src, dest) {
  const srcBase = path.basename(src);
  if (srcBase.startsWith('up_')) {
    // 이미 처리됨 - 복사 건너뜀 (public/files에 이미 있음)
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  // 소스 파일명 앞에 up_ 추가 (복사 성공 후)
  const srcDir = path.dirname(src);
  fs.renameSync(src, path.join(srcDir, 'up_' + srcBase));
}

// ── 문자열 → slug 변환 ───────────────────────────────────
function toSlug(str) {
  return str
    .replace(/학년도/g, '')
    .replace(/[가-힣]/g, (c) => encodeURIComponent(c))
    .replace(/[^a-zA-Z0-9%]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    // 한글은 그냥 영문으로 매핑
    .replace(/%EA%B3%A0/g, 'go')   // 고
    .replace(/%EC%88%98%EB%8A%A5/g, 'suneung');
}

// ── 슬러그 직접 생성 함수 ─────────────────────────────────
function makeSlug(category, year, grade, month) {
  const parts = [String(year)];
  if (grade) parts.push(`go${grade}`);
  if (month) parts.push(`${month.replace('월', '')}wol`);
  parts.push(category);
  return parts.join('-');
}

// ── 포스트 ID 생성 ───────────────────────────────────────
function makeId(category, year, grade, month) {
  const parts = [category, String(year)];
  if (grade) parts.push(`go${grade}`);
  if (month) parts.push(month.replace('월', ''));
  return parts.join('-');
}

// ══════════════════════════════════════════════════════════
// 스캔 로직
// ══════════════════════════════════════════════════════════

const posts = [];

/**
 * 모의고사 스캔
 * 구조: 모의고사/{년도}/{학년}/{월}_{종류}.pdf
 */
function scanMoygoosa() {
  const baseDir = path.join(SOURCE_ROOT, '모의고사');
  if (!fs.existsSync(baseDir)) {
    console.log('⚠️  ../모의고사 폴더 없음 - 건너뜀');
    return;
  }

  const years = fs.readdirSync(baseDir).filter(d =>
    fs.statSync(path.join(baseDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(baseDir, year);
    const grades = fs.readdirSync(yearDir).filter(d =>
      fs.statSync(path.join(yearDir, d)).isDirectory()
    );

    for (const gradeStr of grades) {
      const grade = GRADE_MAP[gradeStr];
      if (!grade) { console.log(`⚠️  알 수 없는 학년 폴더: ${gradeStr}`); continue; }

      const gradeDir = path.join(yearDir, gradeStr);
      // PDF + HWP 모두 스캔 (up_ 접두사 포함)
      const files = fs.readdirSync(gradeDir).filter(f =>
        (f.endsWith('.pdf') || f.endsWith('.hwp') || f.endsWith('.hwpx'))
      );

      // 월별로 그룹화
      const byMonth = {};
      for (const file of files) {
        const ext = file.split('.').pop().toLowerCase(); // pdf / hwp / hwpx
        // up_ 접두사 제거한 실제 파일명 (URL, 파싱용)
        const cleanFile = file.startsWith('up_') ? file.slice(3) : file;

        // 월 추출: 두 가지 패턴 지원
        // 1) "3월_기하_문제지.pdf"  -> 3월
        // 2) "2025_고3_9월_공통.hwp" -> 9월
        let monthRaw = null;
        // m1: 파일명이 연도(4자리)로 시작하지 않을 때만 앞쪽 숫자를 월로 인식
        // (2026_고3_3월_... 같은 파일명에서 "20"을 월로 잘못 인식하는 버그 방지)
        const m1 = !cleanFile.match(/^\d{4}/) ? cleanFile.match(/^(\d{1,2}월?)/) : null;
        const m2 = cleanFile.match(/_(\d{1,2}월?)(?:_|\.)/);
        if (m1) {
          monthRaw = m1[1];
        } else if (m2) {
          monthRaw = m2[1];
        }
        if (!monthRaw) { console.log(`⚠️  월 파싱 실패: ${file}`); continue; }
        const rawMonth = monthRaw.includes('월') ? monthRaw : monthRaw + '월';
        const month = MONTH_NAMES[rawMonth] ?? rawMonth;
        if (!byMonth[month]) byMonth[month] = [];

        // 타입 추출
        const stem = cleanFile.replace(/\.(pdf|hwp|hwpx)$/i, '');
        // "3월_기하_문제지" → "기하_문제지" → 과목 "기하" + 타입 "문제지"
        // "2025_고3_9월_0공통" → "공통"
        let typePart = stem
          .replace(/^\d{4}_고\d_\d{1,2}월?_\d*/, '')  // YYYY_고X_MM월_N 제거
          .replace(/^[\d월_]+/, '')                      // 앞쪽 월_ 제거
          .trim();
        if (!typePart) typePart = stem;

        // 과목 접두사 분리 (기하, 미적분, 확통, 확률과통계, 가형, 나형, 공통)
        const SUBJECT_PREFIXES = ['기하', '미적분', '확통', '확률과통계', '가형', '나형', '공통'];
        const parts2 = typePart.split(/_/);
        let subjectPrefix = '';
        let typeStr = typePart;
        if (parts2.length >= 2 && SUBJECT_PREFIXES.includes(parts2[0])) {
          subjectPrefix = parts2[0];
          typeStr = parts2.slice(1).join('_');
        }

        const fileType = normalizeFileType(typeStr) || typeStr;
        const extLabel = ext === 'pdf' ? 'PDF' : 'HWP';
        const label = subjectPrefix
          ? `${subjectPrefix} ${fileType} ${extLabel}`
          : `${fileType} ${extLabel}`;

        // 파일 복사 (up_ 없으면 복사 후 소스에 up_ 추가, 있으면 건너뜀)
        const destRelPath = `모의고사/${year}/${gradeStr}/${cleanFile}`;
        const destPath = path.join(PUBLIC_FILES, destRelPath);
        const srcPath = path.join(gradeDir, file);
        if (file.startsWith('up_')) {
          console.log(`⏭  이미처리: ${file}`);
        } else {
          copyFileAndMark(srcPath, destPath);
          console.log(`✓ 복사+마킹: ${destRelPath}`);
        }

        byMonth[month].push({ label, url: `/files/${destRelPath}` });
      }


      // 월별 포스트 생성
      for (const [month, fileLinks] of Object.entries(byMonth)) {
        const monthNum = parseInt(month);
        const catKey = `go${grade}`;
        const categoryMap = { go1: 'go1', go2: 'go2', go3: 'go3' };
        const labelMap = { go1: '고1', go2: '고2', go3: '고3' };

        // 시험 종류 판별 (고3 6월/9월 = 평가원)
        let examType = '전국연합학력평가';
        if (grade === 3 && (monthNum === 6 || monthNum === 9)) examType = '평가원';
        const shortExam = (grade === 3 && (monthNum === 6 || monthNum === 9)) ? '평가원 모의고사' : '학력평가';

        // HWP 파일 포함 여부 확인
        const hasHwp = fileLinks.some(f => f.url.endsWith('.hwp') || f.url.endsWith('.hwpx'));

        // SEO 최적화 제목
        const title = hasHwp
          ? `${year}년 ${month} ${labelMap[catKey]} 수학 ${shortExam} 기출문제 PDF HWP 무료 다운로드`
          : `${year}년 ${month} ${labelMap[catKey]} 수학 ${shortExam} 기출문제 정답 해설 PDF 무료`;

        // 풍부한 태그 (검색 키워드 최대화)
        const tags = [
          labelMap[catKey], month, '모의고사', '수학', String(year), examType,
          `${year}년 ${month} ${labelMap[catKey]}`, `${labelMap[catKey]} 수학 모의고사`,
          `${year} ${labelMap[catKey]} 수학`, '기출문제', '해설지', 'PDF', '무료',
          `${year}년 수학 기출`, `${labelMap[catKey]} ${examType}`,
          ...(hasHwp ? ['HWP', '한글파일', '수학 hwp', `${labelMap[catKey]} 모의고사 hwp`] : []),
        ];

        // SEO 최적화 설명
        const summary = hasHwp
          ? `${year}년 ${month} 시행 ${labelMap[catKey]} ${examType} 수학 기출문제입니다. 문제지·해설지를 PDF와 한글(HWP) 파일로 무료 다운로드하세요. 수학주식에서만 제공하는 HWP 한글 파일 포함.`
          : `${year}년 ${month} 시행 ${labelMap[catKey]} ${examType} 수학 기출문제입니다. 문제지·해설지·정답지를 PDF로 무료 다운로드하세요. 수학주식에서 ${year}년 ${labelMap[catKey]} 수학 모의고사 기출 전 회차를 제공합니다.`;

        posts.push({
          id: makeId(catKey, year, grade, month),
          slug: makeSlug(catKey, year, grade, month),
          title,
          category: catKey,
          year: parseInt(year),
          month: monthNum,
          grade,
          tags,
          summary,
          files: fileLinks,
          publishedAt: `${year}-${String(monthNum).padStart(2, '0')}-15`,
        });

      }
    }
  }
}

/**
 * 수능 스캔
 * 구조: 수능/{학년도}/{종류}.pdf  또는  수능/{학년도}/{과목}_{종류}.pdf
 * 예: 수능/2026/문제지.pdf  /  수능/2026/기하_문제지.pdf
 */
function scanSuneung() {
  const baseDir = path.join(SOURCE_ROOT, '수능');
  if (!fs.existsSync(baseDir)) {
    console.log('⚠️  ../수능 폴더 없음 - 건너뜀');
    return;
  }

  const years = fs.readdirSync(baseDir).filter(d =>
    fs.statSync(path.join(baseDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(baseDir, year);
    const files = fs.readdirSync(yearDir).filter(f =>
      f.endsWith('.pdf') || f.endsWith('.hwp') || f.endsWith('.hwpx')
    );
    if (files.length === 0) continue;

    const fileLinks = [];
    for (const file of files) {
      const ext = file.split('.').pop().toLowerCase();
      const extLabel = ext === 'pdf' ? 'PDF' : 'HWP';
      const cleanFile = file.startsWith('up_') ? file.slice(3) : file;
      if (cleanFile.length < 5) continue; // 더미 파일 건너뜀
      const stem = cleanFile.replace(/\.(pdf|hwp|hwpx)$/i, '');

      // 파일 label 결정 (다양한 파일명 패턴 처리)
      let label;
      // 패턴: "2025_고3_11월_0공통.hwp" → 공통 HWP
      const SUBJ_LIST = ['기하', '미적분', '확통', '확률과통계', '공통', '가형', '나형'];
      const subjMatch = stem.match(/_\d*([가-힣]+)$/);
      if (subjMatch && SUBJ_LIST.includes(subjMatch[1])) {
        label = `${subjMatch[1]} ${extLabel}`;
      } else if (/^(기하|미적분|확통|확률과통계)_/.test(stem)) {
        const [subj, ...rest] = stem.split('_');
        const ftype = normalizeFileType(rest.join('_'));
        label = `${subj} ${ftype} ${extLabel}`;
      } else if (/가형|나형/.test(stem)) {
        const form = /가형/.test(stem) ? '가형' : '나형';
        const ftype = /해설/.test(stem) ? '해설지' : '문제지';
        label = `${form} ${ftype} ${extLabel}`;
      } else if (/[AB]형?/.test(stem)) {
        const form = /A/.test(stem) ? 'A형' : 'B형';
        const ftype = /해설/.test(stem) ? '해설지' : '문제지';
        label = `${form} ${ftype} ${extLabel}`;
      } else {
        const ftype = normalizeFileType(stem);
        label = `${ftype} ${extLabel}`;
      }

      const destRelPath = `수능/${year}/${cleanFile}`;
      const destPath = path.join(PUBLIC_FILES, destRelPath);
      const srcPath = path.join(yearDir, file);
      if (file.startsWith('up_')) {
        console.log(`⏭  이미처리: ${file}`);
      } else {
        copyFileAndMark(srcPath, destPath);
        console.log(`✓ 복사+마킹: ${destRelPath}`);
      }
      fileLinks.push({ label, url: `/files/${destRelPath}` });
    }

    // 시행 연도 = 학년도 - 1
    const execYear = parseInt(year) - 1;

    // SEO 최적화 제목 및 태그
    const title = `${year}학년도 수능 수학 기출문제 정답 해설 PDF 무료 다운로드`;
    const tags = [
      '수능', '수학', String(year), '기출', '해설',
      `${year}학년도 수능`, `${year}학년도 수능 수학`,
      `${execYear}년 수능`, '수능 수학 기출문제', '수능 수학 해설',
      '수능 PDF', '무료', '대학수학능력시험',
    ];
    const summary = `${execYear}년 11월 시행 ${year}학년도 대학수학능력시험 수학 영역 기출문제입니다. 기하·미적분·확률과통계 문제지·해설지를 PDF로 무료 다운로드하세요.`;

    posts.push({
      id: `suneung-${year}`,
      slug: `${year}-suneung-math`,
      title,
      category: 'suneung',
      year: parseInt(year),
      tags,
      summary,
      files: fileLinks,
      publishedAt: `${execYear}-11-15`,
    });
  }
}


/**
 * 경찰대 스캔
 * 구조: 경찰대/{학년도}/{종류}.pdf
 */
function scanGyeongchalda() {
  const baseDir = path.join(SOURCE_ROOT, '경찰대');
  if (!fs.existsSync(baseDir)) {
    console.log('⚠️  ../경찰대 폴더 없음 - 건너뜀');
    return;
  }

  const years = fs.readdirSync(baseDir).filter(d =>
    fs.statSync(path.join(baseDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(baseDir, year);
    const files = fs.readdirSync(yearDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) continue;

    const fileLinks = [];
    for (const file of files) {
      const cleanFile = file.startsWith('up_') ? file.slice(3) : file;
      const typePart = cleanFile.replace(/\.pdf$/i, '');
      const fileType = normalizeFileType(typePart);
      const destRelPath = `경찰대/${year}/${cleanFile}`;
      const destPath = path.join(PUBLIC_FILES, destRelPath);
      const srcPath = path.join(yearDir, file);
      if (file.startsWith('up_')) {
        console.log(`⏭  이미처리: ${file}`);
      } else {
        copyFileAndMark(srcPath, destPath);
        console.log(`✓ 복사+마킹: ${destRelPath}`);
      }
      fileLinks.push({ label: `${fileType} PDF`, url: `/files/${destRelPath}` });
    }

    posts.push({
      id: `gyeongchalda-${year}`,
      slug: `${year}-gyeongchalda-math`,
      title: `${year}학년도 경찰대학교 입시 수학 기출문제, 정답 및 해설`,
      category: 'gyeongchalda',
      year: parseInt(year),
      tags: ['경찰대', '수학', String(year), '기출', '입시'],
      summary: `${year}학년도 경찰대학교 1차 시험 수학 기출문제, 정답 및 해설입니다. 경찰대 지망생 필수 자료.`,
      files: fileLinks,
      publishedAt: `${parseInt(year) - 1}-08-01`,
    });
  }
}

/**
 * 사관학교 스캔
 * 구조: 사관학교/{학년도}/{파일명}.pdf/.hwp
 *
 * 파일명 패턴:
 *   가형_문제지.pdf/.hwp   → 가형 (문제+해설) PDF/HWP
 *   나형_문제지.pdf/.hwp   → 나형 (문제+해설) PDF/HWP
 *   문제지.pdf/.hwp        → 수학영역 (문제+해설 통합) PDF/HWP  [2022~]
 *   육사_문제지.pdf 등     → 학교별 PDF
 */
function scanSagwan() {
  const baseDir = path.join(SOURCE_ROOT, '사관학교');
  if (!fs.existsSync(baseDir)) {
    console.log('⚠️  ../사관학교 폴더 없음 - 건너뜀');
    return;
  }

  const years = fs.readdirSync(baseDir).filter(d =>
    fs.statSync(path.join(baseDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(baseDir, year);
    // PDF + HWP 모두 스캔 (up_ 접두사 포함)
    const files = fs.readdirSync(yearDir).filter(f =>
      f.endsWith('.pdf') || f.endsWith('.hwp') || f.endsWith('.hwpx')
    );
    if (files.length === 0) continue;

    const fileLinks = [];
    for (const file of files) {
      const ext = file.split('.').pop().toLowerCase();
      const extLabel = ext === 'pdf' ? 'PDF' : 'HWP';
      const cleanFile = file.startsWith('up_') ? file.slice(3) : file;
      const stem = cleanFile.replace(/\.(pdf|hwp|hwpx)$/i, '');

      // 라벨 결정
      let label;
      const parts = stem.split('_');
      const firstPart = parts[0] ?? '';

      if (firstPart === '가형' || firstPart === '나형') {
        // 가형_문제지 / 나형_문제지 → "가형 문제+해설 PDF/HWP"
        label = `${firstPart} 문제+해설 ${extLabel}`;
      } else if (firstPart === '문제지') {
        // 단일 수학영역 통합본 (2022~)
        label = `수학영역 문제+해설 ${extLabel}`;
      } else if (parts.length >= 2) {
        // 육사_문제지, 해사_문제지 등 학교별
        const school = firstPart;
        const typeStr = parts.slice(1).join('_');
        const fileType = normalizeFileType(typeStr);
        label = `${school} ${fileType} ${extLabel}`;
      } else {
        label = `${normalizeFileType(stem)} ${extLabel}`;
      }

      const destRelPath = `사관학교/${year}/${cleanFile}`;
      const destPath = path.join(PUBLIC_FILES, destRelPath);
      const srcPath = path.join(yearDir, file);
      if (file.startsWith('up_')) {
        console.log(`⏭  이미처리: ${file}`);
      } else {
        copyFileAndMark(srcPath, destPath);
        console.log(`✓ 복사+마킹: ${destRelPath}`);
      }
      fileLinks.push({ label, url: `/files/${destRelPath}` });
    }

    if (fileLinks.length === 0) continue;

    // 연도별 SEO 타이틀/태그 구성
    const yearNum = parseInt(year);
    const execYear = yearNum - 1;
    const hasHwp = fileLinks.some(f => f.url.endsWith('.hwp') || f.url.endsWith('.hwpx'));
    const title = hasHwp
      ? `${year}학년도 사관학교 수학 기출문제 정답 해설 PDF HWP 무료 다운로드`
      : `${year}학년도 육·해·공군 사관학교 수학 기출문제, 정답 및 해설 PDF 무료`;
    const tags = [
      '사관학교', '육군사관학교', '해군사관학교', '공군사관학교',
      '수학', String(year), '기출', '입시', '사관학교 수학',
      `${year}학년도 사관학교`, `${execYear}년 사관학교 수학`,
      ...(hasHwp ? ['HWP', '한글파일', '사관학교 hwp'] : []),
    ];
    const summary = hasHwp
      ? `${execYear}년 시행 ${year}학년도 육·해·공군사관학교 1차 시험 수학 기출문제입니다. 문제+해설을 PDF와 한글(HWP) 파일로 무료 다운로드하세요.`
      : `${execYear}년 시행 ${year}학년도 육·해·공군사관학교 1차 시험 수학 기출문제, 정답 및 해설 PDF 무료 다운로드.`;

    posts.push({
      id: `sagwan-${year}`,
      slug: `${year}-sagwan-math`,
      title,
      category: 'sagwan',
      year: yearNum,
      tags,
      summary,
      files: fileLinks,
      publishedAt: `${execYear}-07-01`,
    });
  }
}

// ══════════════════════════════════════════════════════════
// posts.ts 생성
// ══════════════════════════════════════════════════════════

function generatePostsTs(posts) {
  // 날짜 내림차순 정렬
  posts.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.month ?? 12) - (a.month ?? 12);
  });

  const postLines = posts.map(post => {
    const filesStr = post.files
      .map(f => `      { label: '${f.label}', url: '${f.url}' }`)
      .join(',\n');
    const tagsStr = post.tags.map(t => `'${t}'`).join(', ');

    return `  {
    id: '${post.id}',
    slug: '${post.slug}',
    title: '${post.title}',
    category: '${post.category}',
    year: ${post.year},${post.month != null ? `\n    month: ${post.month},` : ''}${post.grade != null ? `\n    grade: ${post.grade},` : ''}${post.upcoming ? `\n    upcoming: true,` : ''}
    tags: [${tagsStr}],
    summary: '${post.summary.replace(/'/g, "\\'")}',
    files: [\n${filesStr}\n    ],
    publishedAt: '${post.publishedAt}',
  }`;
  }).join(',\n');

  return `// ⚠️ 이 파일은 scripts/sync-posts.js 가 자동 생성합니다.
// 직접 수정하지 마세요. 파일을 추가한 후 npm run sync 를 실행하세요.

export type Category =
  | 'suneung'
  | 'go3'
  | 'go2'
  | 'go1'
  | 'gyeongchalda'
  | 'sagwan'
  | 'upcoming';

export interface FileLink {
  label: string;
  url: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  category: Category;
  year: number;
  month?: number;
  grade?: number;
  tags: string[];
  summary: string;
  files: FileLink[];
  publishedAt: string;
  thumbnail?: string;
  upcoming?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  suneung: '수능 기출',
  go3: '고3 모의고사',
  go2: '고2 모의고사',
  go1: '고1 모의고사',
  gyeongchalda: '경찰대 기출',
  sagwan: '사관학교 기출',
  upcoming: '업로드 예정',
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  suneung: '대학수학능력시험 수학 기출문제와 해설',
  go3: '고3 전국연합학력평가 수학 기출문제',
  go2: '고2 전국연합학력평가 수학 기출문제',
  go1: '고1 전국연합학력평가 수학 기출문제',
  gyeongchalda: '경찰대학교 입시 수학 기출문제',
  sagwan: '육·해·공군 사관학교 입시 수학 기출문제',
  upcoming: '업로드 예정 시험 자료 목록',
};

// 자동 생성된 게시물 목록 (총 ${posts.length}건)
// 마지막 동기화: ${new Date().toLocaleString('ko-KR')}
export const ALL_POSTS: Post[] = [
${postLines}
];

export function getPostsByCategory(category: Category): Post[] {
  return ALL_POSTS.filter((p) => p.category === category).sort(
    (a, b) => b.year - a.year || (b.month ?? 12) - (a.month ?? 12)
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

export function getRecentPosts(count = 6): Post[] {
  return [...ALL_POSTS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
}
`;
}

// ══════════════════════════════════════════════════════════
// 예정 시험 일정 (파일 미업로드 시 placeholder 게시글 생성)
// ══════════════════════════════════════════════════════════

const UPCOMING_EXAMS = [
  // 2026년 고3
  { year: 2026, grade: 3, month: 5,  examType: '학력평가',  publishedAt: '2026-05-07' },
  { year: 2026, grade: 3, month: 6,  examType: '평가원',    publishedAt: '2026-06-03' },
  { year: 2026, grade: 3, month: 7,  examType: '학력평가',  publishedAt: '2026-07-10' },
  { year: 2026, grade: 3, month: 9,  examType: '평가원',    publishedAt: '2026-09-03' },
  { year: 2026, grade: 3, month: 10, examType: '학력평가',  publishedAt: '2026-10-14' },
  // 2026년 고1
  { year: 2026, grade: 1, month: 6,  examType: '학력평가',  publishedAt: '2026-06-04' },
  { year: 2026, grade: 1, month: 9,  examType: '학력평가',  publishedAt: '2026-09-02' },
  { year: 2026, grade: 1, month: 10, examType: '학력평가',  publishedAt: '2026-10-20' },
  // 2026년 고2
  { year: 2026, grade: 2, month: 6,  examType: '학력평가',  publishedAt: '2026-06-04' },
  { year: 2026, grade: 2, month: 9,  examType: '학력평가',  publishedAt: '2026-09-02' },
  { year: 2026, grade: 2, month: 10, examType: '학력평가',  publishedAt: '2026-10-20' },
];

function addUpcomingPlaceholders() {
  const MONTH_KO = ['', '1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const GRADE_KO = { 1: '고1', 2: '고2', 3: '고3' };
  const CAT_KEY  = { 1: 'go1', 2: 'go2', 3: 'go3' };

  for (const exam of UPCOMING_EXAMS) {
    const { year, grade, month, examType, publishedAt } = exam;
    const catKey = CAT_KEY[grade];
    const id = makeId(catKey, year, grade, MONTH_KO[month]);
    const slug = makeSlug(catKey, year, grade, MONTH_KO[month]);

    // 이미 실제 파일이 업로드된 포스트가 있으면 건너뜀
    const exists = posts.find(p => p.id === id);
    if (exists) continue;

    const gradeKo = GRADE_KO[grade];
    const monthKo = MONTH_KO[month];
    const shortExam = (grade === 3 && (month === 6 || month === 9)) ? '평가원 모의고사' : '학력평가';

    const title = `${year}년 ${monthKo} ${gradeKo} 수학 ${shortExam} 기출문제 PDF HWP 무료 다운로드`;
    const tags = [
      gradeKo, monthKo, '모의고사', '수학', String(year), examType,
      `${year}년 ${monthKo} ${gradeKo}`, `${gradeKo} 수학 모의고사`,
      `${year} ${gradeKo} 수학`, '기출문제', 'PDF', '무료',
      `${year}년 수학 기출`,
    ];
    const summary = `${year}년 ${monthKo} 시행 ${gradeKo} ${examType} 수학 기출문제입니다. 시험 당일 문제지·해설지를 PDF와 HWP 파일로 무료 제공 예정입니다. 수학주식에서 ${year}년 ${gradeKo} 수학 기출 전 회차를 무료로 다운로드하세요.`;

    posts.push({
      id,
      slug,
      title,
      category: catKey,
      year,
      month,
      grade,
      tags,
      summary,
      files: [],  // 아직 파일 없음 → 업로드 예정
      publishedAt,
      upcoming: true,
    });
    console.log(`📅 예정 게시글 추가: ${title}`);
  }
}

// ══════════════════════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════════════════════

console.log('🔍 파일 스캔 시작...\n');

ensureDir(PUBLIC_FILES);

scanMoygoosa();
scanSuneung();
scanGyeongchalda();
scanSagwan();
addUpcomingPlaceholders();

if (posts.length === 0) {
  console.log('\n⚠️  스캔된 파일이 없습니다.');
  console.log('기출홈페이지/ 폴더 안에 아래 구조로 파일을 넣어주세요:');
  console.log('');
  console.log('  기출홈페이지/');
  console.log('  ├── 모의고사/');
  console.log('  │   └── 2025/');
  console.log('  │       └── 고3/');
  console.log('  │           ├── 3월_문제지.pdf');
  console.log('  │           └── 3월_해설지.pdf');
  console.log('  ├── 수능/');
  console.log('  │   └── 2026/');
  console.log('  │       └── 문제지.pdf');
  console.log('  ├── 경찰대/');
  console.log('  │   └── 2025/');
  console.log('  └── 사관학교/');
  console.log('      └── 2025/');
  process.exit(0);
}

console.log(`\n📝 posts.ts 생성 중... (총 ${posts.length}개 게시물)`);
fs.writeFileSync(POSTS_FILE, generatePostsTs(posts), 'utf-8');

console.log('\n✅ 완료!');
console.log(`   - 게시물: ${posts.length}개`);
console.log(`   - 파일 위치: public/files/`);
console.log(`   - posts.ts 업데이트 완료`);
console.log('\n이제 npm run dev 로 확인하세요.');
