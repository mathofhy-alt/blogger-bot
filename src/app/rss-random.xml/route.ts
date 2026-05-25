import { NextRequest, NextResponse } from 'next/server';
import { ALL_POSTS } from '@/data/posts';
import { SITE_CONFIG } from '@/data/config';
import { getAllStories } from '@/data/stories';

// 호출 시마다 무작위로 기출 포스트 또는 웹 스토리 1개를 선정해 RSS 피드로 제공하는 API
// Make.com이 하루 3번 등 정해진 스케줄에 이 주소를 조회하면 매번 새로운 글인 것처럼 올려줍니다.
export async function GET(request: NextRequest) {
  const base = SITE_CONFIG.url;

  // 1. 일반 기출문제 포스트 매핑
  const postsMapped = ALL_POSTS
    .filter(post => !post.upcoming) // 업로드 예정은 제외
    .map((post) => ({
      title: post.title,
      url: `${base}/posts/${post.slug}`,
      description: post.summary || `${post.title} 수학 기출문제 및 해설을 무료로 다운로드하세요.`,
    }));

  // 2. 웹 스토리 매핑
  const storiesMapped = getAllStories().map((story) => {
    const description = story.pages[0]?.heading || `흥미진진한 수능 수학 실화 카드뉴스: ${story.title}`;
    return {
      title: `[웹스토리] ${story.title}`,
      url: `${base}/stories/${story.id}`,
      description: description,
    };
  });

  // 3. 모든 콘텐츠 병합
  const allItems = [...postsMapped, ...storiesMapped];

  if (allItems.length === 0) {
    return new NextResponse('No items found', { status: 404 });
  }

  // 4. 무작위로 1개 선택
  const randomIndex = Math.floor(Math.random() * allItems.length);
  const selectedItem = allItems[randomIndex];

  // 5. 매번 Make.com이 '새로운 글'로 인식하도록 guid에 타임스탬프를 덧붙임
  const uniqueGuid = `${selectedItem.url}?t=${Date.now()}`;
  const pubDateStr = new Date().toUTCString();

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title><![CDATA[${SITE_CONFIG.name} - 추천 콘텐츠]]></title>
        <link>${base}</link>
        <description><![CDATA[매번 호출할 때마다 새로운 추천 기출 자료 및 기출썰을 무작위로 제공합니다.]]></description>
        <atom:link href="${base}/rss-random.xml" rel="self" type="application/rss+xml" />
        <language>ko-KR</language>
        <lastBuildDate>${pubDateStr}</lastBuildDate>
        <item>
          <title><![CDATA[${selectedItem.title}]]></title>
          <link>${selectedItem.url}</link>
          <guid isPermaLink="false">${uniqueGuid}</guid>
          <pubDate>${pubDateStr}</pubDate>
          <description><![CDATA[${selectedItem.description}]]></description>
        </item>
      </channel>
    </rss>`;

  // 매번 새로운 무작위 글이 뽑혀야 하므로 브라우저/CDN 캐싱을 완전히 금지합니다.
  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
