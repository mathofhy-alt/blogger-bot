'use client';

import { SITE_CONFIG } from '@/data/config';
import Link from 'next/link';
import { BookOpen, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import DDay from './DDay';

const NAV_ITEMS = [
  { label: '수능 기출', href: '/category/suneung' },
  { label: '고3 모의고사', href: '/category/go3' },
  { label: '고2 모의고사', href: '/category/go2' },
  { label: '고1 모의고사', href: '/category/go1' },
  { label: '경찰대 기출', href: '/category/gyeongchalda' },
  { label: '사관학교 기출', href: '/category/sagwan' },
  { label: '시험 일정', href: '/category/upcoming' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner container">
        {/* 로고 */}
        <Link href="/" className="logo">
          <div className="logo-icon">
            <BookOpen size={22} />
          </div>
          <span className="logo-text">{SITE_CONFIG.name}</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="desktop-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 우측 아이콘 */}
        <div className="header-actions">
          <DDay variant="header" />
          <Link href="/search" className="icon-btn" aria-label="검색">
            <Search size={20} />
          </Link>
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="mobile-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
