'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ProModal } from './ProModal';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/translations';

interface NavbarProps {
  onToggleTheme: () => void;
}

export function Navbar({ onToggleTheme }: NavbarProps) {
  const [showProModal, setShowProModal] = useState(false);
  const { lang, toggleLang } = useLang();
  const { theme } = useTheme();
  const { user, loading } = useAuth();

  const isDark = theme === 'dark';

  const linkClass = `text-sm font-medium transition-colors ${
    isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
  }`;
  const btnClass = `p-2 rounded-lg transition-colors ${
    isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`;

  return (
    <>
      <nav className={`w-full px-4 py-3 flex items-center justify-between border-b sticky top-0 z-40 ${
        isDark ? 'bg-gray-950/90 border-white/5 backdrop-blur-md' : 'bg-white/90 border-gray-200 backdrop-blur-md'
      }`}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <span className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Backgammon <span className="text-yellow-500">Pro</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/leaderboard" className={linkClass}>{t.nav.leaderboard[lang]}</Link>
          <Link href="/profile" className={linkClass}>{t.nav.profile[lang]}</Link>
        </div>

        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggleLang}
            className={`${btnClass} font-bold text-sm min-w-[38px]`}
          >
            {lang === 'en' ? 'RU' : 'EN'}
          </motion.button>

          <button onClick={onToggleTheme} className={btnClass}>
            {isDark ? '☀️' : '🌙'}
          </button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowProModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black shadow-md"
          >
            {t.nav.pro[lang]}
          </motion.button>

          {!loading && (
            user ? (
              <Link href="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {(user.username || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.username || user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link href="/auth"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {t.nav.signIn[lang]}
              </Link>
            )
          )}
        </div>
      </nav>

      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} theme={theme} />
    </>
  );
}
