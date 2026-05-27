'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export function ProModal({ isOpen, onClose, theme }: ProModalProps) {
  const { lang } = useLang();
  const features = t.pro.features[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-yellow-500/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1.5 rounded-full mb-3">
                <span className="text-white font-black text-sm">{t.pro.upgrade[lang]}</span>
              </div>
              <h2 className="text-2xl font-black text-white">{t.pro.title[lang]}</h2>
              <p className="text-white/60 text-sm mt-1">{t.pro.subtitle[lang]}</p>
            </div>

            <div className="space-y-3 mb-6">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 items-start"
                >
                  <span className="text-xl flex-shrink-0">{feat.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{feat.title}</div>
                    <div className="text-white/50 text-xs">{feat.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4 text-center">
              <div className="text-white/50 text-xs line-through">{t.pro.oldPrice[lang]}</div>
              <div className="text-3xl font-black text-yellow-400">
                {t.pro.price[lang]}
                <span className="text-base font-normal text-white/60">{t.pro.perMonth[lang]}</span>
              </div>
              <div className="text-green-400 text-xs mt-1">{t.pro.discount[lang]}</div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-base shadow-lg hover:shadow-yellow-500/30 transition-shadow mb-3"
            >
              {t.pro.upgradeCta[lang]}
            </motion.button>

            <button
              onClick={onClose}
              className="w-full py-2 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              {t.pro.later[lang]}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
