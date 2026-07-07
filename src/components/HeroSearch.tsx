'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSearch({ placeholder }: { placeholder: string }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Redirect to the App page with the query in URL
      router.push(`/tr/app?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto mb-4 relative group">
      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-ink-light)] group-hover:text-[var(--color-burnt-orange)] transition-colors"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
      </div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder} 
        className="w-full h-16 pl-14 pr-16 bg-white border border-[var(--color-ink)]/10 rounded-full text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-burnt-orange)] focus:border-transparent transition-all"
      />
      <button type="submit" className="absolute inset-y-2 right-2 w-12 h-12 bg-[var(--color-burnt-orange)] text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </button>
    </form>
  );
}
