import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Category, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, getPostsByCategory } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { Clock, CalendarDays } from 'lucide-react';

const VALID_CATEGORIES: Category[] = ['suneung', 'go3', 'go2', 'go1', 'gyeongchalda', 'sagwan', 'upcoming'];

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((c) => ({ category: c }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as Category)) return {};
  const cat = category as Category;
  const titleSuffix = cat === 'upcoming' ? '업로드 예정 시험 일정' : `${CATEGORY_LABELS[cat]} 수학 기출문제 무료 다운로드`;
  return {
    title: `${titleSuffix} - ${SITE_CONFIG.name}`,
    description: `${CATEGORY_DESCRIPTIONS[cat]} - ${SITE_CONFIG.name}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const cat = category as Category;
  const posts = getPostsByCategory(cat);

  /* ── 시험 일정 전용 뷰 ─────────────────────────────────── */
  if (cat === 'upcoming') {
    return (
      <>
        <div className="category-hero">
          <div className="container">
            <h1 className="category-hero-title">시험 일정</h1>
            <p className="category-hero-desc">
              자료 업로드 예정 시험 목록입니다. 시험 당일 이후 파일이 업로드됩니다.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '0 20px 60px' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>모든 예정 자료가 업로드되었습니다!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: '18px 24px',
                    textDecoration: 'none',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                  className="upcoming-item"
                >
                  {/* 날짜 뱃지 */}
                  <div style={{
                    minWidth: 64,
                    textAlign: 'center',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1.3,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{post.year}년</div>
                    <div>{post.month}월</div>
                  </div>

                  {/* 정보 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                        color: 'var(--color-primary)',
                        borderRadius: 6,
                        padding: '2px 8px',
                      }}>
                        {CATEGORY_LABELS[post.category]}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} /> 업로드 예정
                      </span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
                      {post.title}
                    </p>
                  </div>

                  <CalendarDays size={20} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── 일반 카테고리 뷰 ─────────────────────────────────── */
  return (
    <>
      <div className="category-hero">
        <div className="container">
          <h1 className="category-hero-title">{CATEGORY_LABELS[cat]}</h1>
          <p className="category-hero-desc">{CATEGORY_DESCRIPTIONS[cat]}</p>
        </div>
      </div>

      <div className="container" style={{ padding: '0 20px 60px' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>아직 등록된 자료가 없습니다.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>곧 업로드될 예정입니다.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
