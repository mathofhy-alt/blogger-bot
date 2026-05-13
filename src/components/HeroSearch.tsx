"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form className="hero-search-form" onSubmit={handleSubmit}>
      <div className="hero-search-wrapper">
        <Search className="hero-search-icon" size={20} />
        <input
          type="text"
          className="hero-search-input"
          placeholder="찾으시는 기출문제가 있나요? (예: 수능 기하, 2024년 6월)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="hero-search-btn">
          검색
        </button>
      </div>
    </form>
  );
}
