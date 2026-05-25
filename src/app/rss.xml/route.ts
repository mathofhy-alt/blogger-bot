import { ALL_POSTS } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';
import { getAllStories } from '@/data/stories';

export async function GET() {
  const base = SITE_CONFIG.url;

  // 1. 일반 기출문제 포스트 매핑
  const postsMapped = ALL_POSTS
    .filter(post => !post.upcoming) // 업로드 예정은 제외
    .map((post) => ({
      title: post.title,
      url: `${base}/posts/${post.slug}`,
      pubDate: new Date(post.publishedAt).getTime(),
      pubDateStr: new Date(post.publishedAt).toUTCString(),
      description: post.summary,
    }));

  // 2. 웹 스토리 매핑
  const storiesMapped = getAllStories().map((story) => {
    // 첫 페이지 문구를 요약(description)으로 활용
    const description = story.pages[0]?.heading || `흥미진진한 수능 수학 실화 카드뉴스: ${story.title}`;
    return {
      title: `[웹스토리] ${story.title}`,
      url: `${base}/stories/${story.id}`,
      pubDate: new Date(story.createdAt).getTime(),
      pubDateStr: new Date(story.createdAt).toUTCString(),
      description: description,
    };
  });

  // 3. 두 데이터를 하나로 병합하고 가장 최근 50개 정렬
  const recentItems = [...postsMapped, ...storiesMapped]
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, 50);

  const rssItemsXml = recentItems.map((item) => {
    return `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${item.url}</link>
        <guid isPermaLink="true">${item.url}</guid>
        <pubDate>${item.pubDateStr}</pubDate>
        <description><![CDATA[${item.description}]]></description>
      </item>
    `;
  }).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title><![CDATA[${SITE_CONFIG.name}]]></title>
        <link>${base}</link>
        <description><![CDATA[${SITE_CONFIG.description}]]></description>
        <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
        <language>ko-KR</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${rssItemsXml}
      </channel>
    </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
