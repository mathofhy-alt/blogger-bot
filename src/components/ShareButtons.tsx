'use client';

import { useState, useEffect } from 'react';
import { Link2, Check } from 'lucide-react';

interface Props {
  url: string;
  title: string;
}

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (opts: object) => void;
      };
    };
  }
}

const KAKAO_APP_KEY = '51955382a25ad0c6b3e95e19c5f0ec36';

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
      }
      setKakaoReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('링크를 복사하세요:', url);
    }
  };

  const handleKakao = () => {
    if (!window.Kakao || !kakaoReady) return;
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${title} | 수학 기출문제 무료 다운로드 - 수학주식`,
      link: { mobileWebUrl: url, webUrl: url },
      buttons: [{ title: '기출문제 보기', link: { mobileWebUrl: url, webUrl: url } }],
    });
  };

  const handleX = () => {
    const text = encodeURIComponent(`${title} | 수학 기출문제 무료 다운로드`);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank');
  };

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
        공유하기
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {/* 링크 복사 */}
        <button onClick={handleCopy} style={{ ...btnBase, background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', color: copied ? '#4ade80' : 'var(--color-text-light)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          {copied ? '복사됨!' : '링크 복사'}
        </button>

        {/* 카카오톡 공유 */}
        {kakaoReady && (
          <button onClick={handleKakao} style={{ ...btnBase, background: '#FEE500', color: '#3A1D1D' }}>
            <span style={{ fontSize: '0.9rem' }}>💬</span> 카카오톡
          </button>
        )}

        {/* X */}
        <button onClick={handleX} style={{ ...btnBase, background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-light)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>✕</span> X 공유
        </button>
      </div>
    </div>
  );
}
