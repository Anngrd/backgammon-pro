'use client';

import { motion } from 'framer-motion';
import { GameState, PlayerColor } from '@/types/game';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

interface PlayerPanelProps {
  gameState: GameState;
  color: PlayerColor;
  name: string;
  isYou: boolean;
  isOnline?: boolean;
  statusOverride?: string;  // custom status string (e.g. "AI thinking…")
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

export function PlayerPanel({
  gameState,
  color,
  name,
  isYou,
  isOnline,
  statusOverride,
}: PlayerPanelProps) {
  const { lang } = useLang();
  const pip = getPipCount(gameState, color);
  const isActive = gameState.currentPlayer === color && gameState.gamePhase !== 'game_over';

  const initial = name?.trim()?.[0]?.toUpperCase() ?? (color === 'white' ? 'W' : 'B');

  const status = statusOverride
    ? statusOverride
    : isActive
    ? (gameState.gamePhase === 'rolling' ? t.game.rollFirst[lang] : t.game.clickToMove[lang])
    : '';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive
          ? 'bg-white/10 ring-1 ring-yellow-400/40'
          : 'bg-white/5'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
          color === 'white'
            ? 'bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800'
            : 'bg-gradient-to-br from-gray-700 to-gray-900 text-white border border-gray-600'
        }`}
      >
        {initial}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-sm truncate">{name}</span>
          {isYou && (
            <span className="text-[10px] text-yellow-400/70 bg-yellow-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {t.online.you[lang]}
            </span>
          )}
          {/* Online indicator */}
          {isOnline !== undefined && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={isOnline ? t.game.online[lang] : t.game.offline[lang]}
            />
          )}
        </div>
        {status && (
          <motion.p
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/50 text-xs truncate"
          >
            {status}
          </motion.p>
        )}
      </div>

      {/* Pip count */}
      <div className="text-right flex-shrink-0">
        <div className="text-white/40 text-[10px]">{t.game.pip[lang]}</div>
        <div className={`font-mono font-bold text-sm ${isActive ? 'text-yellow-300' : 'text-white/60'}`}>
          {pip}
        </div>
      </div>

      {/* Borne-off checkers */}
      <div className="text-right flex-shrink-0 min-w-[40px]">
        <div className="text-white/40 text-[10px]">{t.game.off[lang]}</div>
        <div className="text-white/70 text-sm font-bold">{gameState.bearOff[color]}</div>
      </div>
    </div>
  );
}
