/**
 * migrate-from-this.js
 * 
 * this/ 폴더에서 파일을 파싱해서 모의고사/ 폴더로 이동합니다.
 * 
 * 실행: node scripts/migrate-from-this.js
 */

const fs   = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', '..', '모의고사', 'this');
const DEST   = path.join(__dirname, '..', '..');  // 기출홈페이지/

let copied = 0;
let skipped = 0;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyTo(src, destDir, destName) {
  ensureDir(destDir);
  const destPath = path.join(destDir, destName);
  if (fs.existsSync(destPath)) {
    console.log(`  ⏭  이미 존재: ${destName}`);
    skipped++;
    return;
  }
  fs.copyFileSync(src, destPath);
  console.log(`  ✓ ${destName}`);
  copied++;
}

// ══════════════════════════════════════════════════════════
// 고1 마이그레이션
// 패턴: this/고1/{year}/{YY}{MM}.pdf   → 문제지
//               {YY}{MM}a.pdf  → 해설지
// ══════════════════════════════════════════════════════════
function migrateGo1() {
  const gradeDir = path.join(SOURCE, '고1');
  if (!fs.existsSync(gradeDir)) return;

  const years = fs.readdirSync(gradeDir).filter(d =>
    fs.statSync(path.join(gradeDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(gradeDir, year);
    const yy = year.slice(2); // 2025 → "25"
    const files = fs.readdirSync(yearDir).filter(f => f.toLowerCase().endsWith('.pdf'));

    console.log(`\n[고1 ${year}년]`);

    for (const file of files) {
      const base = file.replace(/\.pdf$/i, '');
      let monthNum = null;
      let isHaeseol = false;

      // 패턴 1: {YY}{MM} or {YY}{MM}a  (예: 2506.pdf, 2506a.pdf)
      const match1 = base.match(/^(\d{2})(\d{1,2})(a?)$/);
      if (match1) {
        monthNum = parseInt(match1[2]);
        isHaeseol = match1[3] === 'a';
      }

      // 패턴 2: {YY}년_고1_{MM}월[_해설].pdf (예: 26년_고1_3월.pdf, 26년_고1_3월_해설.pdf)
      if (!monthNum) {
        const match2 = base.match(/\d{2}년_고1_(\d{1,2})월/);
        if (match2) {
          monthNum = parseInt(match2[1]);
          isHaeseol = /해설/.test(base);
        }
      }

      // 패턴 3: {YY}_고1_{MM}[월][_해설] (예: 19_고1_11월.pdf, 19_고1_3_해설.pdf)
      if (!monthNum) {
        const match3 = base.match(/\d{2}_고1_(\d{1,2})월?/);
        if (match3) {
          monthNum = parseInt(match3[1]);
          isHaeseol = /해설/.test(base);
        }
      }

      if (!monthNum) {
        console.log(`  ⚠  파싱 불가: ${file}`);
        skipped++;
        continue;
      }

      const monthStr = `${monthNum}월`;
      const typeStr  = isHaeseol ? '해설지' : '문제지';
      const destName = `${monthStr}_${typeStr}.pdf`;
      const destDir  = path.join(DEST, '모의고사', year, '고1');

      copyTo(path.join(yearDir, file), destDir, destName);
    }
  }
}

// ══════════════════════════════════════════════════════════
// 고2 마이그레이션
// 파일명에서 {MM}월 패턴과 해설 여부를 추출
// ══════════════════════════════════════════════════════════
function migrateGo2() {
  const gradeDir = path.join(SOURCE, '고2');
  if (!fs.existsSync(gradeDir)) return;

  const years = fs.readdirSync(gradeDir).filter(d =>
    fs.statSync(path.join(gradeDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(gradeDir, year);
    const files = fs.readdirSync(yearDir).filter(f => f.toLowerCase().endsWith('.pdf'));

    console.log(`\n[고2 ${year}년]`);

    for (const file of files) {
      // 파일명에서 월 추출
      // 우선 "고2{MM}월" 패턴 시도 (예: 25고23월 → 3월)
      let monthMatch = file.match(/고2(\d{1,2})월/);
      // 없으면 일반 "{MM}월" 패턴
      if (!monthMatch) monthMatch = file.match(/(\d{1,2})월/);
      if (!monthMatch) {
        console.log(`  ⚠  월 파싱 불가: ${file}`);
        skipped++;
        continue;
      }

      const monthNum = parseInt(monthMatch[1]);
      // 해설 여부
      const isHaeseol = /해설/.test(file);

      const monthStr = `${monthNum}월`;
      const typeStr  = isHaeseol ? '해설지' : '문제지';
      const destName = `${monthStr}_${typeStr}.pdf`;
      const destDir  = path.join(DEST, '모의고사', year, '고2');

      copyTo(path.join(yearDir, file), destDir, destName);
    }
  }
}

// ══════════════════════════════════════════════════════════
// 고3 마이그레이션
// 구조: this/고3/{year}/{MM}월/{파일}.pdf
// training_data 폴더와 플랫폼 내부 파일은 스킵
// ══════════════════════════════════════════════════════════
function migrateGo3() {
  const gradeDir = path.join(SOURCE, '고3');
  if (!fs.existsSync(gradeDir)) return;

  const years = fs.readdirSync(gradeDir).filter(d =>
    fs.statSync(path.join(gradeDir, d)).isDirectory() && /^\d{4}$/.test(d)
  );

  for (const year of years) {
    const yearDir = path.join(gradeDir, year);

    // 월별 하위 폴더 탐색
    const monthDirs = fs.readdirSync(yearDir).filter(d => {
      const full = path.join(yearDir, d);
      return fs.statSync(full).isDirectory() && /^\d{1,2}월$/.test(d);
    });

    // 월 폴더가 없으면 직접 파일 탐색
    if (monthDirs.length === 0) {
      console.log(`\n[고3 ${year}년] 월별 폴더 없음 - 건너뜀`);
      continue;
    }

    for (const monthDir of monthDirs) {
      const monthNum = parseInt(monthDir);
      const monthPath = path.join(yearDir, monthDir);
      const files = fs.readdirSync(monthPath).filter(f => f.toLowerCase().endsWith('.pdf'));

      console.log(`\n[고3 ${year}년 ${monthDir}]`);

      for (const file of files) {
        // 플랫폼 내부 파일 스킵: 2025_고3_9월_0문제.pdf 패턴
        if (/^\d{4}_고\d_\d{1,2}월_\d/.test(file)) {
          console.log(`  ⏭  내부파일 스킵: ${file}`);
          skipped++;
          continue;
        }
        // 숫자만으로 된 이상한 파일명 스킵 (123123.pdf 등)
        if (/^\d+\.pdf$/i.test(file)) {
          console.log(`  ⏭  이름 불명확 스킵: ${file}`);
          skipped++;
          continue;
        }

        // 종류 판별
        let typeStr = '문제지';
        if (/해설/.test(file)) typeStr = '해설지';
        else if (/정답/.test(file)) typeStr = '정답지';
        else if (/확정/.test(file)) typeStr = '정답지';

        const monthStr = `${monthNum}월`;
        const destName = `${monthStr}_${typeStr}.pdf`;
        const destDir  = path.join(DEST, '모의고사', year, '고3');

        copyTo(path.join(monthPath, file), destDir, destName);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════
// 실행
// ══════════════════════════════════════════════════════════

if (!fs.existsSync(SOURCE)) {
  console.error(`❌ this 폴더가 없습니다: ${SOURCE}`);
  process.exit(1);
}

console.log('🚀 마이그레이션 시작...');
migrateGo1();
migrateGo2();
migrateGo3();

console.log(`
══════════════════════════════
✅ 마이그레이션 완료
   복사: ${copied}개
   스킵: ${skipped}개
══════════════════════════════
이제 npm run sync 를 실행하세요.
`);
