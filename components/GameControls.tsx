'use client';

import { motion } from 'framer-motion';
import { GameState, PlayerColor, GameSettings } from '@/types/game';
import { DiceDisplay } from './DiceDisplay';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

interface GameControlsProps {
  gameState: GameState;
  settings: GameSettings;
  isAIThinking: boolean;
  onRollDice: () => void;
  onResetGame: () => void;
  onNewGame: () => void;
}

export function GameControls({
  gameState,
  settings,
  isAIThinking,
  onRollDice,
  onResetGame,
  onNewGame,
}: GameControlsProps) {
  const { lang } = useLang();
  const { currentPlayer, gamePhase, dice } = gameState;
  const isPlayerTurn = settings.mode !== 'vs_ai' || currentPlayer === settings.playerColor;
  const canRoll = gamePhase === 'rolling' && isPlayerTurn && !isAIThinking;

  const playerLabel = (p: PlayerColor) =>
    p === 'white' ? `⚪ ${lang === 'ru' ? 'Белые' : 'White'}` : `⚫ ${lang === 'ru' ? 'Чёрные' : 'Black'}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Turn indicator */}
      <div className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-3">
        <div className="text-sm">
          <span className="text-white/60">{t.game.turn[lang]} </span>
          <span className="font-bold text-white">{playerLabel(currentPlayer)}</span>
          {settings.mode === 'vs_ai' && (
            <span className="text-white/40 text-xs ml-2">
              ({t.game.youAre[lang]} {playerLabel(settings.playerColor)})
            </span>
          )}
        </div>
        {isAIThinking && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"
            />
            {t.game.aiThinking[lang]}
          </div>
        )}
      </div>

      {/* Dice */}
      <div className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-3">
        <DiceDisplay values={dice.values} remaining={dice.remaining} rolled={dice.rolled} />

        {gamePhase === 'rolling' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRollDice}
            disabled={!canRoll}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              canRoll
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:shadow-yellow-500/30'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAIThinking ? t.game.waiting[lang] : t.game.rollDice[lang]}
          </motion.button>
        )}

        {gamePhase === 'moving' && (
          <div className="text-white/60 text-sm">{t.game.clickToMove[lang]}</div>
        )}
      </div>

      {/* Pip counts */}
      <div className="flex gap-3 text-xs text-white/50">
        <span>{t.game.pipCounts[lang]}</span>
        <span>⚪ {getPipCount(gameState, 'white')}</span>
        <span>⚫ {getPipCount(gameState, 'black')}</span>
      </div>

      {/* Game controls */}
      <div className="flex gap-2">
        <button
          onClick={onNewGame}
          className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          {t.game.newGame[lang]}
        </button>
        <button
          onClick={onResetGame}
          className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          {t.game.resetGame[lang]}
        </button>
      </div>
    </div>
  );
}

function getPipCount(state: GameState, player: PlayerColor): number {
  let count = 0;
  for (let i = 0; i < 24; i++) {
    const dist = player === 'white' ? i + 1 : 24 - i;
    count += state.points[i].checkers.filter(c => c === player).length * dist;
  }
  count += state.bar[player] * 25;
  return count;
}
