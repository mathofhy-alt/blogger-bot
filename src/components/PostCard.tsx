'use client';

import { Post } from '@/data/posts';
import Link from 'next/link';
import { FileDown, ChevronRight } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

// 카테고리별 사이드바 컬러 (팔레트 4색 순환)
const CATEGORY_COLOR: Record<string, { color: string; label: string }> = {
  suneung:      { color: '#4D5E8A', label: '수능' },        // Pond Blue
  go3:          { color: '#1B9A8E', label: '고3' },         // Peacock Green
  go2:          { color: '#EDD97C', label: '고2' },         // Sweet Corn
  go1:          { color: '#F28C7A', label: '고1' },         // Fiona Peach
  gyeongchalda: { color: '#3a4c7a', label: '경찰대' },     // 다크 Pond Blue
  sagwan:       { color: '#A8C4D2', label: '사관학교' },   // Winter Sky
  upcoming:     { color: '#b0b8c1', label: '예정' },
};

const MONTH_LABEL: Record<number, string> = {
  3:'3월', 4:'4월', 5:'5월', 6:'6월', 7:'7월',
  9:'9월', 10:'10월', 11:'11월',
};

function getExamType(post: Post): string {
  const { category, month, grade } = post;
  if (category === 'suneung') return '수능';
  if (category === 'gyeongchalda') return '경찰대';
  if (category === 'sagwan') return '사관학교';
  if (grade === 3 && (month === 6 || month === 9)) return '평가원';
  return '학력평가';
}

export default function PostCard({ post }: PostCardProps) {
  const cat = CATEGORY_COLOR[post.category] ?? CATEGORY_COLOR.go3;
  const examType = getExamType(post);
  const hasFiles = post.files.length > 0;
  const hasPdf = post.files.some(f => f.url.endsWith('.pdf'));
  const hasHwp = post.files.some(f => f.url.endsWith('.hwp') || f.url.endsWith('.hwpx'));

  return (
    <Link href={`/posts/${post.slug}`} className="pcard">
      {/* 왼쪽 컬러 사이드바 */}
      <div className="pcard-bar" style={{ background: cat.color }} />

      {/* 콘텐츠 */}
      <div className="pcard-content">
        {/* 상단: 카테고리 + 시험 종류 */}
        <div className="pcard-top">
          <span className="pcard-cat" style={{ color: cat.color }}>{cat.label}</span>
          <span className="pcard-type">{examType}</span>
          {post.upcoming && <span className="pcard-upcoming">예정</span>}
        </div>

        {/* 중단: 연도 + 월 (핵심) */}
        <div className="pcard-main">
          <span className="pcard-year">{post.year}</span>
          {post.month && (
            <span className="pcard-month" style={{ color: cat.color }}>
              {MONTH_LABEL[post.month] ?? `${post.month}월`}
            </span>
          )}
        </div>

        {/* 하단: 파일 정보 + 화살표 */}
        <div className="pcard-bottom">
          {hasFiles ? (
            <div className="pcard-files">
              <FileDown size={12} style={{ color: cat.color }} />
              <span>{post.files.length}개</span>
              {hasPdf && <span className="pcard-tag">PDF</span>}
              {hasHwp && <span className="pcard-tag">HWP</span>}
            </div>
          ) : (
            <span className="pcard-nofile">업로드 예정</span>
          )}
          <ChevronRight size={16} style={{ color: cat.color, flexShrink: 0 }} />
        </div>
      </div>
    </Link>
  );
}
