import Link from 'next/link';
import { getAllStories } from '@/data/stories';
import { SITE_CONFIG } from '@/data/config';

export const metadata = {
  title: '실시간 기출 썰 (웹스토리 모아보기)',
  description: '수험생들의 리얼한 기출문제 풀이 썰과 팁을 숏폼 형태로 만나보세요.',
};

export default function StoriesIndexPage() {
  const stories = getAllStories();

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <header className="section-header">
        <h1 className="section-title">
          <span className="section-title-dot"></span>
          실시간 기출 썰 모음
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '8px' }}>
          수험생들의 생생한 기출 썰을 인스타 스토리처럼 넘겨보세요!
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '20px',
        marginTop: '32px'
      }}>
        {stories.map(story => (
          <Link 
            key={story.id} 
            href={`/stories/${story.id}`}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '9/16',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid var(--color-border)',
              position: 'relative'
            }}>
              <img 
                src={story.posterImage} 
                alt={story.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                padding: '24px 12px 12px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
              }}>
                <span style={{ 
                  color: '#fff', 
                  fontSize: '12px', 
                  fontWeight: 700,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {story.title}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
