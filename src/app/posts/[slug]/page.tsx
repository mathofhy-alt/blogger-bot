import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ALL_POSTS, getPostBySlug, getPostsByCategory, getRecentPosts, CATEGORY_LABELS } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { Calendar, Download, FileText, Tag } from 'lucide-react';
import DownloadWithBookmark from '@/components/DownloadWithBookmark';
import { getExamAnalysis } from '@/data/examAnalysis';
import ShareButtons from '@/components/ShareButtons';
import CategoryTimeline from '@/components/CategoryTimeline';
import PdfPreviewButton from '@/components/PdfPreviewButton';

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
  const analysis = getExamAnalysis(slug);

  // description: 분석 데이터가 있으면 킬러 문항 + 핵심 개념 추가
  let description = post.summary;
  if (analysis) {
    const killerStr = analysis.killer_questions.length > 0
      ? ` 킬러 문항 ${analysis.killer_questions.join(', ')}번.`
      : '';
    const conceptStr = analysis.key_concepts.slice(0, 4).join(', ');
    description = `${post.summary}${killerStr} 주요 개념: ${conceptStr}.`;
  }

  // keywords: 기본 + 분석 핵심 개념
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
    ...(analysis ? analysis.key_concepts : []),
    ...(analysis?.killer_questions.map(n => `${n}번 풀이`) ?? []),
  ].filter(Boolean);

  return {
    title: post.title,
    description,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'article',
      url: pageUrl,
      title: post.title,
      description,
      siteName: SITE_CONFIG.name,
      locale: 'ko_KR',
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description,
    },
  };
}


/* ── 게시물 메타 헬퍼 ─────────────────────────────────────────── */
type PostLike = { year: number; month?: number; grade?: number | null; category: string; tags: string[]; files: { label: string; url: string }[] };

function getInstitution(p: PostLike): string {
  if (p.category === 'suneung') return '한국교육과정평가원 (수능)';
  if (p.category === 'gyeongchalda') return '경찰대학';
  if (p.category === 'sagwan') return '사관학교';
  if ((p.category === 'go3') && (p.month === 6 || p.month === 9)) return '한국교육과정평가원';
  return '교육청';
}

function getGradeLabel(p: PostLike): string {
  if (p.category === 'suneung') return '고등학교 3학년 (수험생)';
  if (p.category === 'gyeongchalda' || p.category === 'sagwan') return '고등학교 3학년';
  if (p.grade) return `고등학교 ${p.grade}학년`;
  return '고등학교 3학년';
}

function getSubjectLabel(p: PostLike): string {
  const SELECT = ['기하', '미적분', '확통', '확률과통계'];
  if (p.files.some(f => SELECT.some(s => f.label.includes(s)))) return '수학 (공통 + 선택과목)';
  const hasGa = p.files.some(f => f.label.includes('가형')) || p.tags.includes('가형');
  const hasNa = p.files.some(f => f.label.includes('나형')) || p.tags.includes('나형');
  if (hasGa || hasNa) return '수리 영역 (가형 / 나형)';
  return '수학';
}

function getIncludedFiles(p: PostLike): string {
  if (p.files.length === 0) return '파일 업로드 예정';
  const parts: string[] = [];
  if (p.files.some(f => f.label.toUpperCase().includes('PDF') || f.url.endsWith('.pdf'))) parts.push('원본 문제지 (PDF)');
  if (p.files.some(f => f.label.toUpperCase().includes('HWP') || f.url.endsWith('.hwp'))) parts.push('편집용 한글파일 (HWP)');
  if (p.files.some(f => f.label.includes('해설') || f.label.includes('정답'))) parts.push('정답 및 해설지');
  return parts.length ? parts.join(', ') : p.files.map(f => f.label).join(', ');
}

function getExamName(p: PostLike): string {
  if (p.category === 'suneung') return `${p.year}학년도 대학수학능력시험 수학`;
  if (p.category === 'gyeongchalda') return `${p.year}학년도 경찰대학 입시 수학`;
  if (p.category === 'sagwan') return `${p.year}학년도 사관학교 입시 수학`;
  const g = p.grade ? `고${p.grade}` : '고3';
  const org = getInstitution(p);
  return org === '한국교육과정평가원' ? `${g} 평가원 모의고사 수학` : `${g} 교육청 모의고사 수학`;
}

function getDescriptionText(p: PostLike): string {
  const when = p.month ? `${p.year}년 ${p.month}월` : `${p.year}년`;
  const name = getExamName(p);
  const hasHWP = p.files.some(f => f.label.toUpperCase().includes('HWP') || f.url.endsWith('.hwp'));
  const hwpSentence = hasHWP
    ? ' 학생들의 수능 대비 학습용은 물론, 학원 강사 및 교사분들의 자체 교재 제작을 위한 편집용 HWP(한글) 파일이 함께 첨부되어 있습니다.'
    : ' 학생들의 수능 대비 학습용은 물론, 내신 기출 분석과 학원 교재 편집에도 활용할 수 있습니다.';
  return `본 페이지는 [${when}]에 시행된 [${name}] 기출문제 다운로드를 제공합니다.${hwpSentence}`;
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
  const examAnalysis = getExamAnalysis(post.slug);

  // 같은 카테고리 게시물 (최신순 → 과거순)
  const categoryPosts = getPostsByCategory(post.category as never)
    .sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0));

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

            {/* 같은 카테고리 타임라인 */}
            {categoryPosts.length > 1 && (
              <CategoryTimeline
                posts={categoryPosts}
                currentSlug={post.slug}
                categoryLabel={CATEGORY_LABELS[post.category]}
              />
            )}

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
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <div style={{ flex: 1 }}>
                                    <DownloadWithBookmark fileUrl={file.url} fileName={typeLabel}>
                                      <span className="download-btn-inner">
                                        <FileText size={18} />
                                        {typeLabel}
                                      </span>
                                      <Download size={16} />
                                    </DownloadWithBookmark>
                                  </div>
                                  {(file.url.toLowerCase().endsWith('.pdf') || file.label.includes('PDF')) && (
                                    <PdfPreviewButton fileUrl={file.url} fileName={typeLabel} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {noSubject.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <DownloadWithBookmark fileUrl={file.url} fileName={file.label}>
                              <span className="download-btn-inner">
                                <FileText size={18} />
                                {file.label}
                              </span>
                              <Download size={16} />
                            </DownloadWithBookmark>
                          </div>
                          {(file.url.toLowerCase().endsWith('.pdf') || file.label.includes('PDF')) && (
                            <PdfPreviewButton fileUrl={file.url} fileName={file.label} />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }

                // 과목 없는 경우 (고1·고2 통합, 수능 통합본 등)
                return (
                  <div className="download-list">
                    {post.files.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <DownloadWithBookmark fileUrl={file.url} fileName={file.label}>
                            <span className="download-btn-inner">
                              <FileText size={18} />
                              {file.label}
                            </span>
                            <Download size={16} />
                          </DownloadWithBookmark>
                        </div>
                        {(file.url.toLowerCase().endsWith('.pdf') || file.label.includes('PDF')) && (
                          <PdfPreviewButton fileUrl={file.url} fileName={file.label} />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}</>
              )}
            </div>

            {/* AI 시험 분석 */}
            {examAnalysis && (
              <div style={{
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '12px',
                padding: '1.5rem 1.75rem',
                marginBottom: '1.5rem',
              }}>
                <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>📋</span> 시험지 분석
                  {examAnalysis.subjects.length > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-muted)', marginLeft: 4 }}>
                      ({examAnalysis.subjects.join(' · ')})
                    </span>
                  )}
                </p>

                {/* 킬러 문항 */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(99,102,241,0.9)', textTransform: 'uppercase', letterSpacing: 1 }}>킬러 문항</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {examAnalysis.killer_questions.map((n) => (
                      <span key={n} style={{
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 6,
                        padding: '2px 10px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}>{n}번</span>
                    ))}
                  </div>
                </div>

                {/* 핵심 개념 */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(99,102,241,0.9)', textTransform: 'uppercase', letterSpacing: 1 }}>핵심 출제 개념</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {examAnalysis.key_concepts.map((c, i) => (
                      <span key={i} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        padding: '2px 10px',
                        fontSize: '0.83rem',
                      }}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* 총평 */}
                <div style={{ marginBottom: Object.keys(examAnalysis.difficulty_notes).length > 0 ? '1rem' : 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(99,102,241,0.9)', textTransform: 'uppercase', letterSpacing: 1 }}>총평</span>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.8, marginTop: 6, color: 'var(--color-text-light)' }}>
                    {examAnalysis.exam_summary}
                  </p>
                </div>

                {/* 난이도 특이사항 */}
                {Object.keys(examAnalysis.difficulty_notes).length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(99,102,241,0.9)', textTransform: 'uppercase', letterSpacing: 1 }}>문항 분석</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(examAnalysis.difficulty_notes).map(([num, note]) => (
                        <li key={num} style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                          <strong style={{ color: 'rgba(99,102,241,0.9)' }}>{num}번</strong> — {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}

            {/* 시험 정보 카드 */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              marginBottom: '1.5rem',
              lineHeight: 2,
              fontSize: '0.93rem',
            }}>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.4rem', margin: 0 }}>
                <li><strong>시험 연도:</strong> {post.year}학년도</li>
                <li><strong>출제 기관:</strong> {getInstitution(post)}</li>
                <li><strong>대상 학년:</strong> {getGradeLabel(post)}</li>
                <li><strong>과목 / 영역:</strong> {getSubjectLabel(post)}</li>
                <li><strong>포함된 파일:</strong> {getIncludedFiles(post)}</li>
                <li><strong>활용 용도:</strong> 수능 대비, 내신 기출 분석, 학원 교재 편집용</li>
              </ul>
            </div>

            {/* 설명 단락 */}
            <blockquote style={{
              borderLeft: '4px solid var(--color-primary)',
              paddingLeft: '1.25rem',
              margin: '0 0 1.75rem 0',
              color: 'var(--color-text-light)',
              lineHeight: 1.85,
              fontSize: '0.93rem',
            }}>
              &ldquo;{getDescriptionText(post)}&rdquo;
            </blockquote>

            {/* 태그 */}
            <div className="post-card-tags" style={{ marginBottom: 28, fontSize: 13 }}>
              <Tag size={14} />
              {post.tags.map((tag) => (
                <span key={tag} className="tag" style={{ fontSize: 13, padding: '4px 10px' }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* 공유 버튼 */}
            <ShareButtons url={pageUrl} title={post.title} />

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
