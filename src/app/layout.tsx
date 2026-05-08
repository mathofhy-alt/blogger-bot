import type { Metadata } from 'next';
import './globals.css';
import { SITE_CONFIG } from '@/data/config';
import FamilySiteBanner from '@/components/FamilySiteBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdSenseScript } from '@/components/AdBanner';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    '수학주식', '수학 기출문제', '수학주식 기출', '수능 수학 기출', '모의고사 수학',
    '경찰대 수학 기출', '사관학교 수학 기출', '고3 수학 모의고사', '수능 수학 해설',
    '무료 기출문제', '수학주식 수능', '수학주식 모의고사',
  ],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <AdSenseScript />
        {/* Google Ads 리타게팅 태그 - 잠재고객 수집용 (AW-17263917467) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17263917467"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17263917467');
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google 사이트명 표시용 JSON-LD (WebSite 스키마) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "수학주식",
              "alternateName": ["수학주식 기출", "수학주식 수능"],
              "url": "https://math.stac100.com",
              "description": "수능, 고1~고3 모의고사, 경찰대, 사관학교 수학 기출문제 PDF·HWP 무료 다운로드",
              "inLanguage": "ko-KR",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://math.stac100.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        {/* 패밀리 사이트 배너 - 최상단 고정 */}
        <FamilySiteBanner />

        {/* 헤더 */}
        <Header />

        {/* 메인 콘텐츠 */}
        <main>{children}</main>

        {/* 푸터 */}
        <Footer />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
