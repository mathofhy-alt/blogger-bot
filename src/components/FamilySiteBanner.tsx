'use client';

import { SITE_CONFIG } from '@/data/config';
import Link from 'next/link';
import { ExternalLink, Zap, X } from 'lucide-react';
import { useState } from 'react';

export default function FamilySiteBanner() {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="family-float">
      <button
        className="family-float-close"
        onClick={() => setClosed(true)}
        aria-label="닫기"
      >
        <X size={14} />
      </button>
      <div className="family-float-header">
        <Zap size={14} className="family-float-icon" />
        <span className="family-float-label">패밀리 사이트</span>
      </div>
      <p className="family-float-name">{SITE_CONFIG.familySiteName}</p>
      <p className="family-float-desc">{SITE_CONFIG.familySiteDescription}</p>
      <Link
        href={SITE_CONFIG.familySiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="family-float-cta"
      >
        바로가기 <ExternalLink size={12} />
      </Link>
    </div>
  );
}

