import { getDictionary } from '@/lib/dictionaries';

import Link from 'next/link';
import { Download, Globe, Shield, EyeOff, Sparkles, RefreshCcw } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import { HeroSearch } from '@/components/HeroSearch';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale) as any;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <LogoIcon className="w-12 h-12 text-[var(--color-ink)]" />
          <div className="flex flex-col">
            <span className="font-serif text-3xl font-bold tracking-tight">Beiwe</span>
          </div>
        </div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-[var(--color-ink-light)]">
          <Link href="https://getsaule.com" target="_blank" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_saule}</Link>
          <Link href={`/${locale}/book`} className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_book}</Link>
        </nav>

        <button className="bg-[var(--color-ink)] text-[var(--color-paper)] px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
          {dict.landing.btn_download_short || "İndir"}
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-24 max-w-5xl mx-auto w-full space-y-12">
        

        <div className="space-y-6">
          <span className="text-xs font-bold text-[var(--color-ink-light)] tracking-widest uppercase mb-4 block">
            {dict.landing.kicker}
          </span>
          <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight leading-tight">
            {dict.landing.hero_title.map((part: {t: string, c: string}, i: number) => (
              <span key={i} className={part.c === 'orange' ? 'text-[var(--color-burnt-orange)]' : 'text-[var(--color-ink)]'}>
                {part.t}
              </span>
            ))}
          </h1>
          <p className="text-xl text-[var(--color-ink-light)] max-w-2xl mx-auto leading-relaxed">
            {dict.landing.subtitle_part1} <br className="hidden sm:block"/>
            {dict.landing.subtitle_part2}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-burnt-orange)] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            <Download size={20} />
            {dict.landing.btn_download}
          </button>
          
          <Link href="/app" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent text-[var(--color-ink)] border-2 border-[var(--color-ink)]/10 px-8 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-ink)]/5 transition-colors">
            {dict.landing.btn_test || "Web'de Test Et"}
          </Link>
        </div>
        <span className="text-xs text-[var(--color-ink-light)] font-medium block text-center mt-4">
          {dict.landing.windows_note}
        </span>

        {/* Mockup System Preview */}
        <div className="w-full max-w-5xl mx-auto mt-16 mb-8 text-left">
          <div className="bg-white rounded-3xl shadow-2xl border border-[var(--color-ink)]/5 overflow-hidden flex flex-col min-h-[400px]">
            {/* Top App Bar area */}
            <div className="border-b border-[var(--color-ink)]/5 p-4 flex justify-center bg-[var(--color-paper)]/50">
              <div className="w-full max-w-2xl relative shadow-sm rounded-full">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-ink-light)]"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
                <div className="w-full bg-white border border-[var(--color-ink)]/10 rounded-full h-12 flex items-center pl-12 pr-4 text-[var(--color-ink)] font-medium text-sm">
                  {dict.landing.mockup_search}
                  <span className="ml-1 w-0.5 h-5 bg-[var(--color-burnt-orange)] animate-pulse"></span>
                </div>
              </div>
            </div>
            {/* Main Body */}
            <div className="flex-1 bg-[var(--color-paper)] p-6 md:p-8 flex flex-col gap-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-[var(--color-ink)]/10 pb-px">
                <div className="bg-white border-t border-l border-r border-[var(--color-ink)]/10 rounded-t-xl px-4 py-2 text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
                  {dict.landing.mockup_tab_appointments}
                </div>
                <div className="bg-[var(--color-ink)]/5 rounded-t-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-light)] flex items-center gap-2">
                  {dict.landing.mockup_tab_customers}
                </div>
              </div>
              {/* Content inside Tab */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white p-6 rounded-2xl border border-[var(--color-ink)]/5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{dict.landing.mockup_tag_canceling}</span>
                    <span className="text-[var(--color-ink-light)] text-sm font-medium">{dict.landing.mockup_time}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-ink)] mb-1">{dict.landing.mockup_name}</h3>
                  <p className="text-[var(--color-ink-light)] text-sm">{dict.landing.mockup_desc}</p>
                </div>
                {/* AI Suggestion Box */}
                <div className="flex-1 bg-gradient-to-br from-orange-50/50 to-white p-6 rounded-2xl border border-[var(--color-burnt-orange)]/20 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[var(--color-burnt-orange)]" />
                    <span className="text-[10px] font-bold text-[var(--color-burnt-orange)] uppercase tracking-widest">Clarity Engine</span>
                  </div>
                  <p className="text-base font-medium text-[var(--color-ink)] mb-5 leading-relaxed">
                    {dict.landing.mockup_ai_text_1} <span className="font-bold underline decoration-[var(--color-burnt-orange)]/30">{dict.landing.mockup_ai_text_2}</span>{dict.landing.mockup_ai_text_3}
                  </p>
                  <div className="flex gap-2">
                    <button className="bg-[var(--color-burnt-orange)] text-white px-4 py-2 rounded-full text-xs font-bold shadow-md shadow-orange-500/20">{dict.landing.mockup_btn_yes}</button>
                    <button className="bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] px-4 py-2 rounded-full text-xs font-medium">{dict.landing.mockup_btn_cancel_only}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span className="text-xs text-[var(--color-ink-light)] font-medium block text-center mt-4 opacity-70">
            {dict.landing.mockup_footer}
          </span>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-[var(--color-ink)]/5 w-full mt-12">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
            <Shield size={24} className="text-[var(--color-ink-light)] mb-1" />
            <span className="font-bold text-sm">{dict.landing.feature_privacy_title}</span>
            <span className="text-xs text-[var(--color-ink-light)]">{dict.landing.feature_privacy_desc}</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
            <EyeOff size={24} className="text-[var(--color-ink-light)] mb-1" />
            <span className="font-bold text-sm">{dict.landing.feature_notrack_title}</span>
            <span className="text-xs text-[var(--color-ink-light)]">{dict.landing.feature_notrack_desc}</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
            <Sparkles size={24} className="text-[var(--color-ink-light)] mb-1" />
            <span className="font-bold text-sm">{dict.landing.feature_ai_title}</span>
            <span className="text-xs text-[var(--color-ink-light)]">{dict.landing.feature_ai_desc}</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
            <RefreshCcw size={24} className="text-[var(--color-ink-light)] mb-1" />
            <span className="font-bold text-sm">{dict.landing.feature_improving_title}</span>
            <span className="text-xs text-[var(--color-ink-light)]">{dict.landing.feature_improving_desc}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
