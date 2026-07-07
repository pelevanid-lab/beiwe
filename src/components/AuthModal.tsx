'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: any;
  forceLogin?: boolean;
}

export function AuthModal({ isOpen, onClose, dict, forceLogin = false }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Use popup since we will fix Electron's popup handling
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google ile giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed top-6 right-6 z-50 flex"
        >
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col relative border border-[var(--color-ink)]/10"
          >
            {/* Header */}
            <div className="p-6 pb-4 text-center space-y-2">
              <div className="w-12 h-12 bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield size={24} />
              </div>
              <h2 className="font-serif text-xl font-bold tracking-tight">
                {isLogin ? 'Hesabına Giriş Yap' : 'Verilerini Koru'}
              </h2>
              <p className="text-xs text-[var(--color-ink-light)] font-medium leading-relaxed">
                {isLogin 
                  ? 'Aramalarına tüm cihazlardan ulaşmak için giriş yap.' 
                  : 'Aramalarını senkronize etmek için hesap oluştur.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3 flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold text-center border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--color-ink)]/30 group-focus-within:text-[var(--color-burnt-orange)] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E-posta adresi"
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-burnt-orange)]/50 focus:border-[var(--color-burnt-orange)] transition-all"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--color-ink)]/30 group-focus-within:text-[var(--color-burnt-orange)] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Şifre"
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-burnt-orange)]/50 focus:border-[var(--color-burnt-orange)] transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3.5 text-sm font-bold mt-2 hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'} <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[var(--color-ink)]/10"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-[var(--color-ink-light)] font-bold uppercase tracking-wider">Veya</span>
                <div className="flex-grow border-t border-[var(--color-ink)]/10"></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-xl py-3.5 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.11c-.22-.69-.35-1.43-.35-2.11s.13-1.42.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                </svg>
                Google ile Devam Et
              </button>

              <div className="text-center mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs font-semibold text-[var(--color-ink-light)] hover:text-[var(--color-burnt-orange)] transition-colors"
                >
                  {isLogin ? 'Hesabın yok mu? Yeni oluştur' : 'Zaten hesabın var mı? Giriş yap'}
                </button>
              </div>
            </form>

            {/* Skip Button */}
            {!forceLogin && (
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] p-2 text-xs font-bold transition-colors"
              >
                Geç
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
