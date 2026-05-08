import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ALL_POSTS, getPostBySlug, getRecentPosts, CATEGORY_LABELS } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { Calendar, Download, FileText, Tag } from 'lucide-react';
import DownloadWithBookmark from '@/components/DownloadWithBookmark';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const pageUrl = `${SITE_CONFIG.url}/posts/${post.slug}`;
  const gradeLabel = post.grade ? `고${post.grade}` : '';
  const monthLabel = post.month ? `${post.month}월` : '';
  const examLabel = post.tags.includes('평가원') ? '평가원' : '전국연합학력평가';

  // 풍부한 키워드 목록
  const keywords = [
    ...post.tags,
    `${post.year}년 ${monthLabel} ${gradeLabel} 수학`,
    `${post.year}년 ${monthLabel} ${gradeLabel} 모의고사`,
    `${post.year}년 ${monthLabel} ${gradeLabel} 수학 기출`,
    `${post.year}년 ${gradeLabel} ${monthLabel} ${examLabel}`,
    `${post.year} ${gradeLabel} 수학 모의고사 기출문제`,
    `${post.year}년 ${gradeLabel} 수학 해설`,
    '수학 기출문제 무료 다운로드',
    '모의고사 PDF',
    '수학 모의고사 해설지',
  ].filter(Boolean);

  return {
    title: post.title,
    description: post.summary,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'article',
      url: pageUrl,
      title: post.title,
      description: post.summary,
      siteName: SITE_CONFIG.name,
      locale: 'ko_KR',
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const dateStr = new Date(post.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const relatedPosts = getRecentPosts(5).filter((p) => p.slug !== slug).slice(0, 4);

  const pageUrl = `${SITE_CONFIG.url}/posts/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    url: pageUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    publisher: { '@type': 'Organization', name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    keywords: post.tags.join(', '),
    inLanguage: 'ko-KR',
  };

  return (
    <div className="post-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        <div className="post-page-layout">
          {/* ── 메인 콘텐츠 ────────────────────────────── */}
          <div>
            {/* 브레드크럼 */}
            <nav className="post-breadcrumb" aria-label="breadcrumb">
              <Link href="/">홈</Link>
              <span>›</span>
              <Link href={`/category/${post.category}`}>{CATEGORY_LABELS[post.category]}</Link>
              <span>›</span>
              <span style={{ color: 'var(--color-text-light)' }}>{post.title}</span>
            </nav>

            {/* 제목 & 메타 */}
            <header className="post-header">
              <h1 className="post-title">{post.title}</h1>
              <div className="post-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> {dateStr}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={13} /> {CATEGORY_LABELS[post.category]}
                </span>
              </div>
            </header>


            {/* 본문 */}
            <div className="post-body">
              <p>{post.summary}</p>
              <br />
              <p>
                아래 첨부파일 버튼을 클릭하면 PDF 파일을 다운로드할 수 있습니다.
                모든 자료는 <strong>무료</strong>로 제공됩니다.
              </p>
              <br />
              <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>
                ※ 파일은 교육 목적으로만 사용하시기 바랍니다.<br />
                ※ 다운로드가 안 되는 경우 다른 브라우저를 이용해 주세요.
              </p>
            </div>

            {/* 파일 다운로드 */}
            <div className="download-section">
              <h2 className="download-title">
                <Download size={20} />
                첨부파일 다운로드
              </h2>
              {post.files.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.15)',
                }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    시험 당일 업로드 예정입니다
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>
                    시험 종료 후 최대한 빠르게 PDF · HWP 파일을 무료 제공합니다.<br />
                    이 페이지를 북마크해두세요!
                  </p>
                </div>
              ) : (
              <>{(() => {
                // 과목 추출 (라벨 앞부분: "기하 문제지 PDF" → "기하")
                const SUBJECTS = ['기하', '미적분', '확통', '확률과통계', '가형', '나형'];
                const hasSubject = post.files.some(f =>
                  SUBJECTS.some(s => f.label.startsWith(s))
                );

                if (hasSubject) {
                  // 과목별 그룹화
                  const groups: Record<string, typeof post.files> = {};
                  const noSubject: typeof post.files = [];
                  post.files.forEach(f => {
                    const subject = SUBJECTS.find(s => f.label.startsWith(s));
                    if (subject) {
                      if (!groups[subject]) groups[subject] = [];
                      groups[subject].push(f);
                    } else {
                      noSubject.push(f);
                    }
                  });

                  return (
                    <div className="download-groups">
                      {Object.entries(groups).map(([subject, files]) => (
                        <div key={subject} className="download-group">
                          <p className="download-group-title">{subject}</p>
                          <div className="download-list">
                            {files.map((file, idx) => {
                              const typeLabel = file.label.replace(subject + ' ', '');
                              return (
                                <DownloadWithBookmark key={idx} fileUrl={file.url} fileName={typeLabel}>
                                  <span className="download-btn-inner">
                                    <FileText size={18} />
                                    {typeLabel}
                                  </span>
                                  <Download size={16} />
                                </DownloadWithBookmark>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {noSubject.map((file, idx) => (
                        <DownloadWithBookmark key={idx} fileUrl={file.url} fileName={file.label}>
                          <span className="download-btn-inner">
                            <FileText size={18} />
                            {file.label}
                          </span>
                          <Download size={16} />
                        </DownloadWithBookmark>
                      ))}
                    </div>
                  );
                }

                // 과목 없는 경우 (고1·고2 통합, 수능 통합본 등)
                return (
                  <div className="download-list">
                    {post.files.map((file, idx) => (
                      <DownloadWithBookmark key={idx} fileUrl={file.url} fileName={file.label}>
                        <span className="download-btn-inner">
                          <FileText size={18} />
                          {file.label}
                        </span>
                        <Download size={16} />
                      </DownloadWithBookmark>
                    ))}
                  </div>
                );
              })()}</>
              )}
            </div>


            {/* 태그 */}
            <div className="post-card-tags" style={{ marginBottom: 28, fontSize: 13 }}>
              <Tag size={14} />
              {post.tags.map((tag) => (
                <span key={tag} className="tag" style={{ fontSize: 13, padding: '4px 10px' }}>
                  #{tag}
                </span>
              ))}
            </div>


          </div>

          {/* ── 사이드바 ─────────────────────────────────── */}
          <aside className="sidebar">

            {/* 최신 게시물 */}
            <div className="sidebar-card">
              <p className="sidebar-title">최신 자료</p>
              <div className="sidebar-post-list">
                {relatedPosts.map((p) => (
                  <div key={p.id} className="sidebar-post-item">
                    <Link href={`/posts/${p.slug}`} className="sidebar-post-title">
                      {p.title}
                    </Link>
                    <p className="sidebar-post-meta">
                      {CATEGORY_LABELS[p.category]} · {new Date(p.publishedAt).getFullYear()}년
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 패밀리 사이트 사이드바 */}
            <div className="sidebar-card" style={{
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              color: '#fff',
              border: 'none',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                FAMILY SITE
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
                {SITE_CONFIG.familySiteName}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.7 }}>
                {SITE_CONFIG.familySiteDescription}
              </p>
              <Link
                href={SITE_CONFIG.familySiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'opacity 0.2s',
                }}
              >
                지금 바로가기 →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
