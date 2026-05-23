import storiesData from './stories.json';

export interface StoryPage {
  id: string;
  bgImage: string;
  heading: string;
}

export interface WebStory {
  id: string;
  title: string;
  publisher: string;
  posterImage: string;
  pages: StoryPage[];
  outlinkText: string;
  outlinkUrl: string;
  createdAt: string;
}

export function getAllStories(): WebStory[] {
  return storiesData as WebStory[];
}

export function getStoryById(id: string): WebStory | undefined {
  return getAllStories().find((s) => s.id === id);
}
