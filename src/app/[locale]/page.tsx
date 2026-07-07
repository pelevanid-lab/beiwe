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
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <LogoIcon className="w-12 h-12 text-[var(--color-ink)]" />
          <div className="flex flex-col">
            <span className="font-serif text-3xl font-bold tracking-tight">Beiwe</span>
            <span className="text-[10px] font-bold text-[var(--color-burnt-orange)] tracking-widest uppercase">Clarity Engine</span>
          </div>
        </div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-[var(--color-ink-light)]">
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_product}</Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_security}</Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_about}</Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_careers}</Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_data_ethics}</Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors">{dict.landing.nav_app_store}</Link>
        </nav>

        <button className="bg-[var(--color-ink)] text-[var(--color-paper)] px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
          İndir
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-24 max-w-4xl mx-auto w-full space-y-12">
        
        <HeroSearch placeholder="Herhangi bir şey arayın..." />

        <div className="space-y-6">
          <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight leading-tight">
            {dict.landing.title_part1} <br/>
            {dict.landing.title_part2}
            <span className="text-[var(--color-burnt-orange)]">{dict.landing.title_highlight}</span>
          </h1>
          <p className="text-xl text-[var(--color-ink-light)] max-w-2xl mx-auto leading-relaxed">
            {dict.landing.subtitle_part1} <br className="hidden sm:block"/>
            {dict.landing.subtitle_part2}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
          <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-burnt-orange)] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            <Download size={20} />
            {dict.landing.btn_download}
          </button>
          <span className="text-xs text-[var(--color-ink-light)] font-medium">
            {dict.landing.windows_note}
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
