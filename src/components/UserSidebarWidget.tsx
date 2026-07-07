'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { User, LogOut } from 'lucide-react';

export default function UserSidebarWidget() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 border border-[var(--color-ink)]/10 flex items-center justify-center overflow-hidden text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors cursor-pointer">
        <User size={16} />
      </div>
    );
  }

  return (
    <div className="relative group flex justify-center w-full">
      <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center overflow-hidden text-green-600 cursor-pointer">
        <User size={16} />
      </div>
      
      {/* Tooltip / Popup Menu */}
      <div className="absolute left-12 bottom-0 bg-[var(--color-paper)] border border-[var(--color-ink)]/10 shadow-lg rounded-xl p-3 w-48 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 translate-x-2 group-hover:translate-x-0">
        <p className="text-xs font-bold text-[var(--color-ink)] truncate mb-1">{user.email}</p>
        <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hesap Korunuyor
        </p>
        <button 
          onClick={() => auth.signOut()}
          className="w-full text-left text-xs text-red-500 hover:text-red-600 flex items-center gap-2 py-1"
        >
          <LogOut size={12} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}
