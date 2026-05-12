import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/data/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      // 네이버 검색로봇 명시적 허용
      {
        userAgent: 'Yeti',
        allow: '/',
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
