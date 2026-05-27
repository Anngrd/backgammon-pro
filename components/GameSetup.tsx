'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Users, Globe, Circle, MoveRight, EyeOff, Check } from 'lucide-react';
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
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

interface OppButton {
  id: OpponentType;
  titleKey: keyof typeof t.setup;
  subKey: keyof typeof t.setup;
  icon: React.ReactNode;
  accent: string;
  accentBorder: string;
}

const GAME_TYPES: GameTypeCard[] = [
  {
    id: 'short',
    titleKey: 'typeShortTitle', descKey: 'typeShortDesc', badgeKey: 'typeShortBadge',
    icon: <Circle size={20} />,
    accent: 'text-[#C9A84C]', accentBg: 'bg-[#C9A84C]/8', accentBorder: 'border-[#C9A84C]/30', accentText: 'text-[#C9A84C]',
  },
  {
    id: 'long',
    titleKey: 'typeLongTitle', descKey: 'typeLongDesc', badgeKey: 'typeLongBadge',
    icon: <MoveRight size={20} />,
    accent: 'text-rose-400', accentBg: 'bg-rose-500/8', accentBorder: 'border-rose-500/30', accentText: 'text-rose-400',
  },
  {
    id: 'dark',
    titleKey: 'typeDarkTitle', descKey: 'typeDarkDesc', badgeKey: 'typeDarkBadge',
    icon: <EyeOff size={20} />,
    accent: 'text-violet-400', accentBg: 'bg-violet-500/8', accentBorder: 'border-violet-500/30', accentText: 'text-violet-400',
  },
];

const OPP_BUTTONS: OppButton[] = [
  {
    id: 'ai', titleKey: 'oppAiTitle', subKey: 'oppAiSub',
    icon: <Cpu size={18} />,
    accent: 'bg-[#C9A84C]/8', accentBorder: 'border-[#C9A84C]/30',
  },
  {
    id: 'local', titleKey: 'oppLocalTitle', subKey: 'oppLocalSub',
    icon: <Users size={18} />,
    accent: 'bg-blue-500/8', accentBorder: 'border-blue-500/30',
  },
  {
    id: 'online', titleKey: 'oppOnlineTitle', subKey: 'oppOnlineSub',
    icon: <Globe size={18} />,
    accent: 'bg-emerald-500/8', accentBorder: 'border-emerald-500/30',
  },
];

function resolveMode(variant: GameVariant, opp: OpponentType): GameMode {
  if (opp === 'online') return 'vs_friend_online';
  if (opp === 'local')  return 'vs_friend_local';
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

  useEffect(() => {
    const v = localStorage.getItem('bg_variant') as GameVariant | null;
    const o = localStorage.getItem('bg_opp')     as OpponentType | null;
    if (v && ['short','long','dark'].includes(v)) setVariant(v);
    if (o && ['ai','local','online'].includes(o)) setOpp(o);
  }, []);

  const pick    = (v: GameVariant)    => { setVariant(v); localStorage.setItem('bg_variant', v); };
  const pickOpp = (o: OpponentType)   => { setOpp(o);     localStorage.setItem('bg_opp', o); };

  const handleStart = () => {
    if (opp === 'online') { setShowOnlineRoom(true); return; }
    onStart({ mode: resolveMode(variant, opp), playerColor, variant });
  };

  const startBtnBg =
    variant === 'long' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'   :
    variant === 'dark' ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/40' :
                         'bg-[#C9A84C] hover:bg-[#E2C97E] shadow-[#C9A84C]/20 text-[#080E1A]';

  const activeGT = GAME_TYPES.find(g => g.id === variant)!;

  if (showOnlineRoom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <OnlineRoom gameVariant={variant} onGameStart={onStart} onCancel={() => setShowOnlineRoom(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto px-2 w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20" />
            <div className="absolute inset-[5px] rounded-full border border-[#C9A84C]/30" />
            <div className="absolute inset-[11px] rounded-full bg-[#C9A84C]" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-[#E8E4DC] tracking-tight">
          Backgammon <span className="text-[#C9A84C]">Pro</span>
        </h1>
        <p className="text-[#E8E4DC]/35 text-sm mt-1">{t.setup.subtitle[lang]}</p>
      </div>

      {/* Section 1 — Game type */}
      <div className="mb-6">
        <p className="text-[#E8E4DC]/40 text-[10px] font-semibold uppercase tracking-widest mb-3">
          {t.setup.gameMode[lang]}
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {GAME_TYPES.map(gt => {
            const sel = variant === gt.id;
            return (
              <motion.button
                key={gt.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => pick(gt.id)}
                className={`relative p-3.5 rounded-xl border text-left transition-all ${
                  sel
                    ? `${gt.accentBg} ${gt.accentBorder}`
                    : 'border-white/6 bg-[#0F1725] hover:bg-[#111D30]'
                }`}
              >
                {/* Selected check */}
                {sel && (
                  <span className={`absolute top-2 right-2 ${gt.accentText}`}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                {/* Badge */}
                {!sel && (
                  <span className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${gt.accentBg} ${gt.accentText} border ${gt.accentBorder}`}>
                    {(t.setup[gt.badgeKey] as { en: string; ru: string })[lang]}
                  </span>
                )}
                <div className={`mb-2 ${sel ? gt.accentText : 'text-[#E8E4DC]/40'}`}>
                  {gt.icon}
                </div>
                <div className={`font-bold text-xs leading-tight ${sel ? 'text-[#E8E4DC]' : 'text-[#E8E4DC]/70'}`}>
                  {(t.setup[gt.titleKey] as { en: string; ru: string })[lang]}
                </div>
                <div className="text-[#E8E4DC]/30 text-[10px] mt-1 leading-snug">
                  {(t.setup[gt.descKey] as { en: string; ru: string })[lang]}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section 2 — Opponent */}
      <div className="mb-5">
        <p className="text-[#E8E4DC]/40 text-[10px] font-semibold uppercase tracking-widest mb-3">
          {t.setup.opponent[lang]}
        </p>
        <div className="flex gap-2.5">
          {OPP_BUTTONS.map(ob => {
            const sel = opp === ob.id;
            return (
              <motion.button
                key={ob.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => pickOpp(ob.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border transition-all ${
                  sel
                    ? `${ob.accent} ${ob.accentBorder}`
                    : 'border-white/6 bg-[#0F1725] hover:bg-[#111D30]'
                }`}
              >
                <span className={sel ? 'text-[#E8E4DC]' : 'text-[#E8E4DC]/40'}>
                  {ob.icon}
                </span>
                <span className={`font-bold text-xs ${sel ? 'text-[#E8E4DC]' : 'text-[#E8E4DC]/60'}`}>
                  {(t.setup[ob.titleKey] as { en: string; ru: string })[lang]}
                </span>
                <span className="text-[#E8E4DC]/30 text-[10px] text-center leading-tight">
                  {(t.setup[ob.subKey] as { en: string; ru: string })[lang]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color picker — only vs AI */}
      <AnimatePresence>
        {opp === 'ai' && (
          <motion.div
            key="color"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <p className="text-[#E8E4DC]/40 text-[10px] font-semibold uppercase tracking-widest mb-3">
              {t.setup.playAs[lang]}
            </p>
            <div className="flex gap-2.5">
              {(['white', 'black'] as const).map(c => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPlayerColor(c)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                    playerColor === c
                      ? 'border-[#C9A84C]/40 bg-[#C9A84C]/8 text-[#C9A84C]'
                      : 'border-white/6 bg-[#0F1725] text-[#E8E4DC]/50 hover:bg-[#111D30]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    c === 'white'
                      ? 'bg-[#E8E4DC] border-[#C0BBAF]'
                      : 'bg-[#1a1a1a] border-[#444]'
                  }`} />
                  {c === 'white' ? t.setup.white[lang].replace('⚪ ', '') : t.setup.black[lang].replace('⚫ ', '')}
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
        className={`w-full py-3.5 rounded-xl text-white font-black text-base shadow-lg transition-all ${startBtnBg}`}
      >
        {opp === 'online' ? t.setup.startOnline[lang] : t.setup.start[lang]}
      </motion.button>

      {/* Hints */}
      <AnimatePresence mode="wait">
        {variant === 'dark' && (
          <motion.div key="dark" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-violet-500/6 border border-violet-500/20 rounded-xl text-sm text-violet-300/80"
          >
            <strong className="text-violet-300">{t.setup.darkModeHint[lang]}</strong>{' '}
            {t.setup.darkModeDesc[lang]}
          </motion.div>
        )}
        {variant === 'long' && (
          <motion.div key="long" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-rose-500/6 border border-rose-500/20 rounded-xl text-sm text-rose-300/80"
          >
            <strong className="text-rose-300">{t.setup.longModeHint[lang]}</strong>{' '}
            {t.setup.longModeDesc[lang]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
