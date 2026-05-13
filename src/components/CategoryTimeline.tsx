'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  year: number;
  month?: number | null;
}

interface Props {
  posts: Post[];
  currentSlug: string;
  categoryLabel: string;
}

export default function CategoryTimeline({ posts, currentSlug, categoryLabel }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      hasMoved.current = false;
      startX.current = e.clientX;
      scrollStart.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const diff = e.clientX - startX.current;
      if (Math.abs(diff) > 3) hasMoved.current = true;
      el.scrollLeft = scrollStart.current - diff;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    // 링크 클릭 vs 드래그 구분
    const onClickCapture = (e: MouseEvent) => {
      if (hasMoved.current) e.preventDefault();
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--color-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: '0.75rem',
      }}>
        {categoryLabel} 전체 목록
      </p>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          maxWidth: '100%',
          width: '100%',
          paddingBottom: 8,
          cursor: 'grab',
          userSelect: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {(() => {
          const idx = posts.findIndex(p => p.slug === currentSlug);
          const start = Math.max(0, idx - 4);
          const end = Math.min(posts.length, idx + 5);
          return posts.slice(start, end).map((p) => {
            const isCurrent = p.slug === currentSlug;
            const label = p.month ? `${p.year}년 ${p.month}월` : `${p.year}년`;
            return (
              <Link
                key={p.slug}
                href={isCurrent ? '#' : `/posts/${p.slug}`}
                draggable={false}
                style={{
                  flexShrink: 0,
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? 800 : 500,
                  whiteSpace: 'nowrap',
                  background: isCurrent ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                  border: isCurrent ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  color: isCurrent ? 'rgba(99,102,241,1)' : 'var(--color-text-light)',
                  textDecoration: 'none',
                  pointerEvents: isCurrent ? 'none' : 'auto',
                }}
              >
                {label}
              </Link>
            );
          });
        })()}
      </div>
    </div>
  );
}
