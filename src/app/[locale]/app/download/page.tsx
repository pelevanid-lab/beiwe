'use client';

import React from 'react';
import { MonitorDown, MousePointerClick, ShieldCheck, Zap } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';

export default function DownloadPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative items-center justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-12 text-center">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <LogoIcon className="w-24 h-24 text-[var(--color-ink)]" />
          <h1 className="text-5xl font-bold text-[var(--color-ink)] tracking-tight">Beiwe OS Masaüstü</h1>
          <p className="text-xl text-[var(--color-ink-light)] max-w-2xl">
            Tarayıcı sınırlarını aşın. Gelişmiş entegrasyonlar ve sağ tık menüsü ile Beiwe'yi gerçek bir işletim sistemi gibi kullanın.
          </p>
        </div>

        {/* Download Button */}
        <div className="flex flex-col items-center justify-center pt-4 pb-8">
          <a 
            href="/Beiwe-Setup.exe" 
            download
            className="group px-10 py-5 bg-[var(--color-burnt-orange)] text-white rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-1 flex items-center gap-4"
          >
            <MonitorDown size={32} />
            <div className="flex flex-col items-start">
              <span>Windows Sürümünü İndir</span>
              <span className="text-sm font-normal opacity-80">Test Versiyonu (.exe)</span>
            </div>
          </a>
          <p className="mt-4 text-sm text-[var(--color-ink)]/40 font-medium">Yakında macOS ve Linux için de geliyor</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12 border-t border-[var(--color-ink)]/10 pt-12">
          
          <div className="bg-white p-6 rounded-3xl border border-[var(--color-ink)]/5 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">Sınırsız Entegrasyon</h3>
            <p className="text-[var(--color-ink-light)]">
              Instagram, LinkedIn ve Google gibi dış bağlantıları güvenlik (X-Frame) engeline takılmadan sorunsuzca tam ekran açın.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[var(--color-ink)]/5 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] rounded-xl flex items-center justify-center mb-4">
              <MousePointerClick size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">OS Sağ Tık Menüsü</h3>
            <p className="text-[var(--color-ink-light)]">
              Herhangi bir sitede metin seçip sağ tıkladığınızda anında "Not Olarak Ekle", "Müşteri ile Bağdaştır" işlemlerini yapın.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[var(--color-ink)]/5 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">Yüksek Performans</h3>
            <p className="text-[var(--color-ink-light)]">
              Tarayıcı sekmelerinden bağımsız, kendi bellek alanında (Electron mimarisi) arka planda daha hızlı ve akıcı çalışır.
            </p>
          </div>

        </div>
        
      </div>
    </div>
  );
}
