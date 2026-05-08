import { MetadataRoute } from 'next';
import { ALL_POSTS, CATEGORY_LABELS } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[];

// 빌드 시각 = 배포할 때마다 자동 갱신 → 구글이 변경 감지
const LAST_SYNC = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: LAST_SYNC, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/search`, lastModified: LAST_SYNC, changeFrequency: 'monthly', priority: 0.5 },
    ...CATEGORIES.map((cat) => ({
      url: `${base}/category/${cat}`,
      lastModified: LAST_SYNC,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  const now = Date.now();
  const postRoutes: MetadataRoute.Sitemap = ALL_POSTS.map((post) => {
    const published = new Date(post.publishedAt);
    // 최근 30일 이내 게시물은 우선순위 높게
    const isNew = now - published.getTime() < 1000 * 60 * 60 * 24 * 30;
    return {
      url: `${base}/posts/${post.slug}`,
      lastModified: LAST_SYNC, // 배포 시각으로 설정 → 구글이 변경 인식
      changeFrequency: isNew ? ('weekly' as const) : ('monthly' as const),
      priority: isNew ? 0.9 : 0.7,
    };
  });

  return [...staticRoutes, ...postRoutes];
}
