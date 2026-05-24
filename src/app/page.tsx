import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/data/config';
import { getRecentPosts, ALL_POSTS } from '@/data/posts';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import DDay from '@/components/DDay';

export const metadata: Metadata = {
  title: `수학주식 - 수능·모의고사·경찰대·사관학교 수학 기출문제 무료 다운로드`,
  description: '수학주식 | 수능, 고1~고3 모의고사, 경찰대, 사관학교 수학 기출문제 및 해설을 무료로 제공합니다. PDF·HWP 파일을 직접 다운로드 하세요.',
  alternates: { canonical: '/' },
};

const CATEGORY_QUICK = [
  { label: '수능 기출',    href: '/category/suneung',      icon: '🎯', color: '#4D5E8A', count: ALL_POSTS.filter(p => p.category === 'suneung'      && !p.upcoming).length },
  { label: '고3 모의고사', href: '/category/go3',           icon: '📘', color: '#1B9A8E', count: ALL_POSTS.filter(p => p.category === 'go3'          && !p.upcoming).length },
  { label: '고2 모의고사', href: '/category/go2',           icon: '📗', color: '#EDD97C', count: ALL_POSTS.filter(p => p.category === 'go2'          && !p.upcoming).length },
  { label: '고1 모의고사', href: '/category/go1',           icon: '📙', color: '#F28C7A', count: ALL_POSTS.filter(p => p.category === 'go1'          && !p.upcoming).length },
  { label: '경찰대 기출',  href: '/category/gyeongchalda', icon: '👮', color: '#3a4c7a', count: ALL_POSTS.filter(p => p.category === 'gyeongchalda' && !p.upcoming).length },
  { label: '사관학교 기출',href: '/category/sagwan',        icon: '🎖️', color: '#A8C4D2', count: ALL_POSTS.filter(p => p.category === 'sagwan'       && !p.upcoming).length },
  { label: '시험 일정',    href: '/category/upcoming',     icon: '📅', color: '#b0b8c1', count: ALL_POSTS.filter(p => p.upcoming === true).length },
];

export default function HomePage() {
  const recentPosts = getRecentPosts(20).filter(p => !p.upcoming).slice(0, 6);

  return (
    <>
      {/* ── 히어로 ────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-inner">
          <DDay variant="hero" />
          <p className="hero-brand">수학주식</p>
          <h1 className="hero-title">
            수능부터 사관학교까지<br />
            수학 기출문제를 무료로
          </h1>
          <p className="hero-subtitle">
            수능, 고1~고3 모의고사, 경찰대, 육·해·공군 사관학교<br />
            수학 기출문제와 해설을 PDF · HWP 로 무료 제공합니다.
          </p>
        </div>
      </section>

      {/* ── 카테고리 퀵메뉴 ──────────────────────────────── */}


      {/* ── 최신 자료 ─────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-dot" />
              최신 자료
            </h2>
            <Link href="/category/suneung" className="section-more">
              전체보기 →
            </Link>
          </div>
          <div className="posts-grid">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 수능 기출 ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-dot" />
              수능 기출
            </h2>
            <Link href="/category/suneung" className="section-more">더보기 →</Link>
          </div>
          <div className="posts-grid">
            {ALL_POSTS.filter(p => p.category === 'suneung' && !p.upcoming).slice(0, 3).map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 경찰대 & 사관학교 ─────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-dot" />
              경찰대 · 사관학교 기출
            </h2>
          </div>
          <div className="posts-grid">
            {ALL_POSTS.filter(p => (p.category === 'gyeongchalda' || p.category === 'sagwan') && !p.upcoming)
              .slice(0, 4)
              .map(post => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </div>
      </section>

      {/* ── 시험 일정 (진행 예정) ─────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-dot" style={{ background: '#b0b8c1' }} />
              시험 일정 (진행 예정)
            </h2>
            <Link href="/category/upcoming" className="section-more">더보기 →</Link>
          </div>
          <div className="posts-grid">
            {ALL_POSTS.filter(p => p.upcoming)
              .slice(0, 4)
              .map(post => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
