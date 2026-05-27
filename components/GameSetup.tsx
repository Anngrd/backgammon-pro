'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSettings, GameMode, GameVariant } from '@/types/game';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';
import { OnlineRoom } from './OnlineRoom';

interface GameSetupProps {
  onStart: (settings: GameSettings) => void;
}

type OpponentType = 'ai' | 'local' | 'online';

interface GameTypeCard {
  id: GameVariant;
  titleKey: keyof typeof t.setup;
  descKey: keyof typeof t.setup;
  badgeKey: keyof typeof t.setup;
  icon: string;
  color: string;   // accent
}

const GAME_TYPES: GameTypeCard[] = [
  { id: 'short', titleKey: 'typeShortTitle', descKey: 'typeShortDesc', badgeKey: 'typeShortBadge', icon: '🎲', color: 'yellow' },
  { id: 'long',  titleKey: 'typeLongTitle',  descKey: 'typeLongDesc',  badgeKey: 'typeLongBadge',  icon: '♟️', color: 'red'    },
  { id: 'dark',  titleKey: 'typeDarkTitle',  descKey: 'typeDarkDesc',  badgeKey: 'typeDarkBadge',  icon: '🌑', color: 'purple' },
];

interface OppButton {
  id: OpponentType;
  titleKey: keyof typeof t.setup;
  subKey: keyof typeof t.setup;
  icon: string;
}

const OPP_BUTTONS: OppButton[] = [
  { id: 'ai',     titleKey: 'oppAiTitle',     subKey: 'oppAiSub',     icon: '🤖' },
  { id: 'local',  titleKey: 'oppLocalTitle',  subKey: 'oppLocalSub',  icon: '👥' },
  { id: 'online', titleKey: 'oppOnlineTitle', subKey: 'oppOnlineSub', icon: '🌐' },
];

const ACCENT_SELECTED: Record<string, string> = {
  yellow: 'border-yellow-400 bg-yellow-400/10',
  red:    'border-red-400    bg-red-400/10',
  purple: 'border-purple-400 bg-purple-400/10',
};

const BADGE_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-400/20 text-yellow-300',
  red:    'bg-red-400/20    text-red-300',
  purple: 'bg-purple-400/20 text-purple-300',
};

const BUTTON_ACTIVE: Record<string, string> = {
  ai:     'border-yellow-400 bg-yellow-400/10',
  local:  'border-blue-400   bg-blue-400/10',
  online: 'border-green-400  bg-green-400/10',
};

function resolveMode(variant: GameVariant, opp: OpponentType): GameMode {
  if (opp === 'online') return 'vs_friend_online';
  if (opp === 'local')  return 'vs_friend_local';
  // AI
  if (variant === 'long') return 'long';
  if (variant === 'dark') return 'dark_mode';
  return 'vs_ai';
}

export function GameSetup({ onStart }: GameSetupProps) {
  const { lang } = useLang();

  const [variant, setVariant]     = useState<GameVariant>('short');
  const [opp, setOpp]             = useState<OpponentType>('ai');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [showOnlineRoom, setShowOnlineRoom] = useState(false);

  // Persist last selections
  useEffect(() => {
    const v = localStorage.getItem('bg_variant') as GameVariant | null;
    const o = localStorage.getItem('bg_opp')     as OpponentType | null;
    if (v && ['short','long','dark'].includes(v)) setVariant(v);
    if (o && ['ai','local','online'].includes(o)) setOpp(o);
  }, []);

  const pick = (v: GameVariant) => { setVariant(v); localStorage.setItem('bg_variant', v); };
  const pickOpp = (o: OpponentType) => { setOpp(o); localStorage.setItem('bg_opp', o); };

  const showColorPick = opp === 'ai';

  const handleStart = () => {
    if (opp === 'online') {
      setShowOnlineRoom(true);
      return;
    }
    const mode = resolveMode(variant, opp);
    onStart({ mode, playerColor, variant });
  };

  const startBtnColor =
    variant === 'long'  ? 'from-red-600    to-orange-600'  :
    variant === 'dark'  ? 'from-purple-600 to-indigo-600'  :
                          'from-yellow-500 to-orange-500';

  if (showOnlineRoom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <OnlineRoom
          gameVariant={variant}
          onGameStart={onStart}
          onCancel={() => setShowOnlineRoom(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto px-2"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          🎲 Backgammon <span className="text-yellow-400">Pro</span>
        </h1>
        <p className="text-white/50 text-sm">{t.setup.subtitle[lang]}</p>
      </div>

      {/* Section 1 — Game type */}
      <div className="mb-7">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
          {t.setup.gameMode[lang]}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {GAME_TYPES.map(gt => {
            const selected = variant === gt.id;
            return (
              <motion.button
                key={gt.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick(gt.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all ${
                  selected ? ACCENT_SELECTED[gt.color] : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                {/* Badge */}
                <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${BADGE_COLORS[gt.color]}`}>
                  {(t.setup[gt.badgeKey] as { en: string; ru: string })[lang]}
                </span>
                <div className="text-2xl mb-2">{gt.icon}</div>
                <div className="text-white font-bold text-sm leading-tight">
                  {(t.setup[gt.titleKey] as { en: string; ru: string })[lang]}
                </div>
                <div className="text-white/40 text-[11px] mt-1 leading-snug">
                  {(t.setup[gt.descKey] as { en: string; ru: string })[lang]}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section 2 — Opponent type */}
      <div className="mb-6">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
          {t.setup.opponent[lang]}
        </p>
        <div className="flex gap-3">
          {OPP_BUTTONS.map(ob => {
            const selected = opp === ob.id;
            return (
              <motion.button
                key={ob.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pickOpp(ob.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-2xl border transition-all ${
                  selected ? BUTTON_ACTIVE[ob.id] : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                <span className="text-2xl">{ob.icon}</span>
                <span className="text-white font-bold text-sm">
                  {(t.setup[ob.titleKey] as { en: string; ru: string })[lang]}
                </span>
                <span className="text-white/40 text-[11px] text-center leading-tight">
                  {(t.setup[ob.subKey] as { en: string; ru: string })[lang]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color picker — only for vs AI */}
      <AnimatePresence>
        {showColorPick && (
          <motion.div
            key="color"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
              {t.setup.playAs[lang]}
            </p>
            <div className="flex gap-3">
              {(['white', 'black'] as const).map(color => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPlayerColor(color)}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${
                    playerColor === color
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {color === 'white' ? t.setup.white[lang] : t.setup.black[lang]}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl transition-shadow bg-gradient-to-r ${startBtnColor}`}
      >
        {opp === 'online' ? t.setup.startOnline[lang] : t.setup.start[lang]}
      </motion.button>

      {/* Contextual hints */}
      <AnimatePresence mode="wait">
        {variant === 'dark' && (
          <motion.div key="dark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-purple-900/40 border border-purple-500/30 rounded-xl text-sm text-purple-200"
          >
            <strong className="text-purple-300">{t.setup.darkModeHint[lang]}</strong>{' '}
            {t.setup.darkModeDesc[lang]}
          </motion.div>
        )}
        {variant === 'long' && (
          <motion.div key="long" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-red-900/40 border border-red-500/30 rounded-xl text-sm text-red-200"
          >
            <strong className="text-red-300">{t.setup.longModeHint[lang]}</strong>{' '}
            {t.setup.longModeDesc[lang]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
