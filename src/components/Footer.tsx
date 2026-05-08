'use client';

import { SITE_CONFIG } from '@/data/config';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

const NAV_ITEMS = [
  { label: '수능 기출', href: '/category/suneung' },
  { label: '고3 모의고사', href: '/category/go3' },
  { label: '고2 모의고사', href: '/category/go2' },
  { label: '고1 모의고사', href: '/category/go1' },
  { label: '경찰대 기출', href: '/category/gyeongchalda' },
  { label: '사관학교 기출', href: '/category/sagwan' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        {/* 로고 & 설명 */}
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <BookOpen size={18} />
            <span>{SITE_CONFIG.name}</span>
          </Link>
          <p className="footer-desc">{SITE_CONFIG.description}</p>
        </div>

        {/* 카테고리 링크 */}
        <div className="footer-links">
          <p className="footer-links-title">카테고리</p>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="footer-link">
              {item.label}
            </Link>
          ))}
        </div>

        {/* 패밀리 사이트 */}
        <div className="footer-family">
          <p className="footer-links-title">패밀리 사이트</p>
          <Link
            href={SITE_CONFIG.familySiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-family-link"
          >
            <ExternalLink size={14} />
            {SITE_CONFIG.familySiteName}
          </Link>
          <p className="footer-family-desc">{SITE_CONFIG.familySiteDescription}</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {year} {SITE_CONFIG.name}. 본 사이트의 자료는 교육 목적으로 제공됩니다.</p>
          <p className="footer-disclaimer">
            광고 문의 및 저작권 관련 문의는 이메일로 연락해 주세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
