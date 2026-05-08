// 환경 변수로 관리되는 사이트 설정
export const SITE_CONFIG = {
  name: '수학주식',
  tagline: '수능·모의고사·경찰대·사관학교 수학 기출문제 무료 제공',
  description:
    '수능, 고1~고3 모의고사, 경찰대, 사관학교 수학 기출문제 및 해설을 무료로 제공합니다. PDF 파일을 직접 다운로드 하세요.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com',

  /** 패밀리 사이트 */
  familySiteUrl: process.env.NEXT_PUBLIC_FAMILY_SITE_URL ?? 'https://your-family-site.com',
  familySiteName: '수학ETF',
  familySiteDescription: '원하는 조건으로 나만의 수학 시험지를 만들어보세요!',

  /**
   * Google AdSense Publisher ID
   * 자동광고(Auto Ads) 사용 - 스크립트만 삽입하면 Google이 위치를 자동 결정
   * AdSense 대시보드 → 광고 → 사이트별로 자동광고 ON 설정 필요
   */
  adsensePublisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? 'ca-pub-XXXXXXXXXXXXXXXXX',
} as const;
