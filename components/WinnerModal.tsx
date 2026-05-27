'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, AICoachAnalysis } from '@/types/game';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

interface WinnerModalProps {
  winner: PlayerColor | null;
  playerColor: PlayerColor;
  coachAnalysis: AICoachAnalysis | null;
  loadingAnalysis: boolean;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

const SCORE_COLORS: Record<string, string> = {
  Beginner: 'text-red-400',
  Intermediate: 'text-yellow-400',
  Advanced: 'text-blue-400',
  Expert: 'text-green-400',
};

export function WinnerModal({
  winner,
  playerColor,
  coachAnalysis,
  loadingAnalysis,
  onPlayAgain,
  onNewGame,
}: WinnerModalProps) {
  const { lang } = useLang();
  if (!winner) return null;
  const isWin = winner === playerColor;

  const winnerName = winner === 'white' ? t.winner.white[lang] : t.winner.black[lang];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">{isWin ? '🏆' : '😔'}</div>
            <h2 className="text-2xl font-bold text-white">
              {isWin ? t.winner.youWin[lang] : `${winnerName} ${t.winner.wins[lang]}`}
            </h2>
            <p className="text-white/60 mt-1">
              {isWin ? t.winner.excellent[lang] : t.winner.betterLuck[lang]}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-white">{t.winner.aiCoach[lang]}</h3>
            </div>

            {loadingAnalysis ? (
              <div className="flex items-center gap-2 text-white/60">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                />
                {t.winner.analyzing[lang]}
              </div>
            ) : coachAnalysis ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">{t.winner.overallScore[lang]}</span>
                  <span className={`font-bold ${SCORE_COLORS[coachAnalysis.score] || 'text-white'}`}>
                    {coachAnalysis.score}
                  </span>
                </div>
                <div className="space-y-2">
                  {coachAnalysis.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-2 text-sm text-white/80"
                    >
                      <span className="text-blue-400 flex-shrink-0">•</span>
                      {insight}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm">{t.winner.noKey[lang]}</p>
            )}
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPlayAgain}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-lg"
            >
              {t.winner.playAgain[lang]}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewGame}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold"
            >
              {t.winner.newGame[lang]}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
