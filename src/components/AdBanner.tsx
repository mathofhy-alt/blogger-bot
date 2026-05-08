'use client';

import { SITE_CONFIG } from '@/data/config';

/**
 * Google AdSense 자동광고 스크립트
 * layout.tsx 의 <head> 에 한 번만 삽입하면 Google이 자동으로 광고 위치를 결정합니다.
 * AdSense 대시보드 → 사이트 → 자동 광고 ON 으로 설정하세요.
 */
export function AdSenseScript() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-component
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsensePublisherId}`}
      crossOrigin="anonymous"
    />
  );
}
