import { NextRequest, NextResponse } from 'next/server';
import { getStoryById } from '@/data/stories';
import { SITE_CONFIG } from '@/data/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const story = getStoryById(resolvedParams.id);

  if (!story) {
    return new NextResponse('Story not found', { status: 404 });
  }

  // Construct absolute URLs
  const posterUrl = story.posterImage.startsWith('http') 
    ? story.posterImage 
    : `${SITE_CONFIG.url}${story.posterImage}`;

  const canonicalUrl = `${SITE_CONFIG.url}/stories/${story.id}`;
  const logoUrl = `${SITE_CONFIG.url}/icon.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": story.title,
    "image": [posterUrl],
    "datePublished": story.createdAt,
    "dateModified": story.createdAt,
    "author": {
      "@type": "Organization",
      "name": story.publisher,
      "url": SITE_CONFIG.url
    },
    "publisher": {
      "@type": "Organization",
      "name": story.publisher,
      "logo": {
        "@type": "ImageObject",
        "url": logoUrl
      }
    }
  };

  const html = `<!doctype html>
<html amp lang="ko">
  <head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
    <script async custom-element="amp-story-page-outlink" src="https://cdn.ampproject.org/v0/amp-story-page-outlink-0.1.js"></script>
    <title>\${story.title}</title>
    <link rel="canonical" href="\${canonicalUrl}">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <script type="application/ld+json">
      \${JSON.stringify(structuredData)}
    </script>
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <style amp-custom>
      amp-story-grid-layer.text-layer {
        align-content: end;
        padding-bottom: 8%;
      }
      .heading-container {
        background-color: rgba(0, 0, 0, 0.55);
        padding: 16px 20px;
        border-radius: 12px;
        backdrop-filter: blur(8px);
        margin: 0 16px;
      }
      h1, h2 {
        color: #ffffff;
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
        font-weight: 600;
        margin: 0;
        line-height: 1.5;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        word-break: keep-all;
      }
      h1 { font-size: 22px; }
      h2 { font-size: 20px; }
      .cta-layer {
        align-content: center;
        text-align: center;
      }
      .cta-container {
        background-color: rgba(0, 0, 0, 0.7);
        padding: 32px 24px;
        border-radius: 20px;
        margin: 0 20px;
      }
    </style>
  </head>
  <body>
    <amp-story standalone
        title="\${story.title}"
        publisher="\${story.publisher}"
        publisher-logo-src="\${logoUrl}"
        poster-portrait-src="\${posterUrl}">
      
      \${story.pages.map((page, index) => \`
      <amp-story-page id="\${page.id}">
        <amp-story-grid-layer template="fill">
          <amp-img src="\${page.bgImage}" width="720" height="1280" layout="responsive" alt="background image"></amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical" class="text-layer">
          <div class="heading-container">
            \${index === 0 ? \`<h1>\${page.heading}</h1>\` : \`<h2>\${page.heading}</h2>\`}
          </div>
        </amp-story-grid-layer>
      </amp-story-page>
      \`).join('')}

      <!-- Last Page with CTA -->
      <amp-story-page id="outlink-page">
        <amp-story-grid-layer template="fill">
          <amp-img src="\${story.pages[story.pages.length - 1].bgImage}" width="720" height="1280" layout="responsive" alt="background image"></amp-img>
        </amp-story-grid-layer>
        <amp-story-grid-layer template="vertical" class="cta-layer">
          <div class="cta-container">
            <h2>수능 수학 기출문제<br/>100% 무료 다운로드</h2>
          </div>
        </amp-story-grid-layer>
        <amp-story-page-outlink layout="nodisplay">
          <a href="\${story.outlinkUrl}" title="\${story.outlinkText}">\${story.outlinkText}</a>
        </amp-story-page-outlink>
      </amp-story-page>

    </amp-story>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    },
  });
}
