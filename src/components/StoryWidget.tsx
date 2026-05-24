import Link from 'next/link';
import { getAllStories } from '@/data/stories';

export default function StoryWidget() {
  const stories = getAllStories();
  if (!stories || stories.length === 0) return null;
  
  // Get the most recent story
  const latestStory = stories[0];

  return (
    <Link href={`/stories/${latestStory.id}`} className="story-widget" aria-label="최신 웹스토리 보기">
      <div className="story-widget-ring">
        <img src={latestStory.posterImage} alt={latestStory.title} className="story-widget-img" />
      </div>
      <div className="story-widget-label">
        <span className="story-widget-badge">N</span>
        기출썰
      </div>
    </Link>
  );
}
