'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Cpu, Users, Globe, BookOpen, Trophy, Smartphone, EyeOff, ArrowRight } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

const FEATURE_ICONS = [BookOpen, Cpu, EyeOff, BookOpen, Trophy, Smartphone];

// SVG icons replacing emoji
const LUCIDE_FEATURE_ICONS = [
  <BookOpen key="0" size={20} className="text-[#C9A84C]" />,
  <Cpu        key="1" size={20} className="text-[#C9A84C]" />,
  <EyeOff     key="2" size={20} className="text-[#C9A84C]" />,
  <BookOpen   key="3" size={20} className="text-[#C9A84C]" />,
  <Trophy     key="4" size={20} className="text-[#C9A84C]" />,
  <Smartphone key="5" size={20} className="text-[#C9A84C]" />,
];

export default function HomePage() {
  const { lang } = useLang();
  const features = t.home.features[lang];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#080E1A]">

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#C9A84C]/4 blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Decorative board piece */}
            <div className="flex justify-center mb-8">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full bg-[#C9A84C]/8 border border-[#C9A84C]/20" />
                <div className="absolute inset-[6px] rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30" />
                <div className="absolute inset-[13px] rounded-full bg-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-[#E8E4DC] mb-4 tracking-tight leading-none">
              Backgammon <span className="text-[#C9A84C]">Pro</span>
            </h1>
            <p className="text-lg text-[#E8E4DC]/45 mb-10 max-w-lg mx-auto leading-relaxed">
              {t.home.subtitle[lang]}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/game"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#C9A84C] text-[#080E1A] font-black text-base shadow-lg shadow-[#C9A84C]/20 hover:bg-[#E2C97E] transition-colors"
                >
                  {t.home.playNow[lang]}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/8 text-[#E8E4DC]/70 font-semibold text-base hover:bg-white/8 hover:text-[#E8E4DC] transition-colors"
                >
                  {t.nav.leaderboard[lang]}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]/60 text-center mb-3"
        >
          {lang === 'ru' ? 'Возможности' : 'Features'}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-2xl font-black text-[#E8E4DC] text-center mb-10"
        >
          {t.home.featuresTitle[lang]}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#0F1725] border border-white/5 rounded-xl p-5 hover:border-[#C9A84C]/20 hover:bg-[#111D30]/80 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center mb-3 group-hover:bg-[#C9A84C]/15 transition-colors">
                {LUCIDE_FEATURE_ICONS[i]}
              </div>
              <h3 className="text-[#E8E4DC] font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-[#E8E4DC]/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dark mode callout */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-[#0F1725] border border-[#C9A84C]/15 rounded-2xl p-8 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/4 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center">
                <EyeOff size={20} className="text-[#C9A84C]" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#E8E4DC] mb-2">{t.home.darkModeTitle[lang]}</h3>
            <p className="text-[#E8E4DC]/45 max-w-md mx-auto text-sm leading-relaxed">
              {t.home.darkModeDesc[lang]}
            </p>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C]/20 transition-colors"
            >
              {t.home.tryDark[lang]}
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>

      <footer className="border-t border-white/4 py-7 text-center text-[#E8E4DC]/20 text-xs">
        {t.home.footer[lang]}
      </footer>
    </div>
  );
}
