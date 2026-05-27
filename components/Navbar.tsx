'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sun, Moon, Trophy, User, Star, LogIn } from 'lucide-react';
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

  return (
    <>
      <nav className="w-full px-5 py-0 flex items-center justify-between border-b border-white/5 sticky top-0 z-40 bg-[#080E1A]/95 backdrop-blur-md h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-sm border-2 border-[#C9A84C] rotate-45 group-hover:rotate-[225deg] transition-transform duration-500" />
          </div>
          <span className="font-black text-base tracking-tight text-[#E8E4DC]">
            Backgammon <span className="text-[#C9A84C]">Pro</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7">
          <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm text-[#E8E4DC]/50 hover:text-[#E8E4DC] transition-colors">
            <Trophy size={14} />
            {t.nav.leaderboard[lang]}
          </Link>
          <Link href="/profile" className="flex items-center gap-1.5 text-sm text-[#E8E4DC]/50 hover:text-[#E8E4DC] transition-colors">
            <User size={14} />
            {t.nav.profile[lang]}
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#E8E4DC]/60 hover:text-[#E8E4DC] text-xs font-bold transition-colors border border-white/5"
          >
            {lang === 'en' ? 'RU' : 'EN'}
          </motion.button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[#E8E4DC]/60 hover:text-[#E8E4DC] transition-colors border border-white/5"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* PRO badge */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setShowProModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold hover:bg-[#C9A84C]/20 transition-colors"
          >
            <Star size={11} fill="currentColor" />
            PRO
          </motion.button>

          {/* Auth */}
          {!loading && (
            user ? (
              <Link href="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#E8E4DC]/80 hover:text-[#E8E4DC] text-sm transition-colors border border-white/5"
              >
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] text-[10px] font-bold">
                  {(user.username || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs">
                  {user.username || user.email?.split('@')[0]}
                </span>
              </Link>
            ) : (
              <Link href="/auth"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#E8E4DC]/60 hover:text-[#E8E4DC] text-xs font-medium transition-colors border border-white/5"
              >
                <LogIn size={13} />
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
