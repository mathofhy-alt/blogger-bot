'use client';

import { useEffect, useState } from 'react';

// 2027학년도 수능: 2026년 11월 19일
const SUNEUNG_DATE = new Date('2026-11-19T00:00:00+09:00');

function calcDday() {
  const now = new Date();
  const diff = SUNEUNG_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface Props {
  variant?: 'header' | 'hero';
}

export default function DDay({ variant = 'header' }: Props) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(calcDday());
    const timer = setInterval(() => setDays(calcDday()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (days === null) return null;

  const passed = days <= 0;
  const label = passed ? '수능 완료 🎉' : `수능 D-${days}`;

  if (variant === 'hero') {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: 14,
        padding: '10px 20px',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: '1.3rem' }}>🎯</span>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'rgba(180,180,255,0.8)', display: 'block', lineHeight: 1 }}>
            2027학년도 대학수학능력시험
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a5b4fc', letterSpacing: -0.5 }}>
            {label}
          </span>
        </div>
      </div>
    );
  }

  // header variant
  return (
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 700,
      color: '#a5b4fc',
      background: 'rgba(99,102,241,0.15)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 20,
      padding: '3px 10px',
      whiteSpace: 'nowrap',
      letterSpacing: -0.3,
    }}>
      🎯 {label}
    </span>
  );
}
