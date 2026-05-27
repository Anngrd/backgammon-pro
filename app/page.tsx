'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/lib/translations';

export default function HomePage() {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const features = t.home.features[lang];

  return (
    <div className={`min-h-[calc(100vh-57px)] ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gray-50'}`}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5" />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-4">🎲</div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              Backgammon <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-xl text-white/60 mb-8 max-w-xl mx-auto">
              {t.home.subtitle[lang]}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/game"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-lg shadow-xl hover:shadow-yellow-500/30 transition-shadow"
                >
                  {t.home.playNow[lang]}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-lg hover:bg-white/15 transition-colors"
                >
                  {t.nav.leaderboard[lang]}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-2xl font-black text-white text-center mb-10"
        >
          {t.home.featuresTitle[lang]}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 hover:border-yellow-500/20 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-1">{f.title}</h3>
              <p className="text-white/50 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-900/40 to-gray-900 border border-purple-500/20 rounded-2xl p-8 text-center"
        >
          <div className="text-4xl mb-3">🌑</div>
          <h3 className="text-2xl font-black text-white mb-2">{t.home.darkModeTitle[lang]}</h3>
          <p className="text-white/60 max-w-md mx-auto">{t.home.darkModeDesc[lang]}</p>
          <Link
            href="/game"
            className="inline-flex mt-6 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold hover:bg-purple-500/30 transition-colors"
          >
            {t.home.tryDark[lang]}
          </Link>
        </motion.div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
        <p>{t.home.footer[lang]}</p>
      </footer>
    </div>
  );
}
