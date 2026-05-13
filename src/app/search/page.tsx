'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { ALL_POSTS, CATEGORY_LABELS, Category } from '@/data/posts';
import PostCard from '@/components/PostCard';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const GRADE_TABS: { label: string; value: string }[] = [
  { label: '전체', value: 'all' },
  { label: '수능', value: 'suneung' },
  { label: '고3', value: 'go3' },
  { label: '고2', value: 'go2' },
  { label: '고1', value: 'go1' },
  { label: '경찰대', value: 'gyeongchalda' },
  { label: '사관학교', value: 'sagwan' },
];

// 전체 연도 목록 (내림차순)
const ALL_YEARS = Array.from(new Set(ALL_POSTS.map(p => p.year)))
  .sort((a, b) => b - a);

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [grade, setGrade] = useState('all');
  const [year, setYear] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const results = useMemo(() => {
    return ALL_POSTS.filter(p => {
      const matchGrade = grade === 'all' || p.category === grade;
      const matchYear = year === 'all' || p.year === parseInt(year);
      const q = query.trim();
      const matchQuery = q.length < 1 || (
        p.title.includes(q) ||
        p.summary.includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        CATEGORY_LABELS[p.category].includes(q)
      );
      return matchGrade && matchYear && matchQuery;
    });
  }, [query, grade, year]);

  const hasFilter = grade !== 'all' || year !== 'all' || query.trim().length > 0;
  const showResults = hasFilter;

  function resetAll() {
    setQuery('');
    setGrade('all');
    setYear('all');
  }

  return (
    <div className="search-page">
      <div className="container">
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 800,
          color: 'var(--color-primary)',
          marginBottom: 8,
        }}>
          🔍 자료 검색
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 28 }}>
          학년·연도·검색어를 조합해서 원하는 자료를 찾아보세요.
        </p>

        {/* 학년 탭 */}
        <div className="filter-tabs" role="tablist">
          {GRADE_TABS.map(tab => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={grade === tab.value}
              className={`filter-tab${grade === tab.value ? ' active' : ''}`}
              onClick={() => setGrade(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 연도 + 텍스트 검색 */}
        <div className="filter-row">
          <select
            className="filter-year"
            value={year}
            onChange={e => setYear(e.target.value)}
            aria-label="연도 선택"
          >
            <option value="all">전체 연도</option>
            {ALL_YEARS.map(y => (
              <option key={y} value={String(y)}>{y}년</option>
            ))}
          </select>

          <div className="search-box" style={{ margin: 0, flex: 1 }}>
            <input
              type="text"
              className="search-input"
              placeholder="키워드 검색 (예: 6월, 기하, 수능)"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  padding: '0 12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="검색어 지우기"
              >
                <X size={16} />
              </button>
            )}
            <button className="search-btn">
              <Search size={18} />
              검색
            </button>
          </div>
        </div>

        {/* 초기화 버튼 */}
        {hasFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-light)' }}>
              검색 결과 <strong style={{ color: 'var(--color-primary)' }}>{results.length}건</strong>
            </p>
            <button
              onClick={resetAll}
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 99,
                padding: '3px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={11} /> 필터 초기화
            </button>
          </div>
        )}

        {/* 결과 */}
        {showResults ? (
          results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🤔</p>
              <p style={{ fontSize: 17, fontWeight: 700 }}>검색 결과가 없습니다.</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>다른 조건을 선택해 보세요.</p>
            </div>
          ) : (
            <div className="posts-grid">
              {results.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
            <p style={{ fontSize: 17, fontWeight: 700 }}>학년이나 연도를 선택해보세요</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>총 {ALL_POSTS.length}개의 자료가 준비되어 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" style={{ margin: '0 auto' }} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
