'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSettings, GameVariant } from '@/types/game';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';
import {
  createRoom,
  joinRoom,
  getOrCreatePlayerId,
  getPlayerName,
  savePlayerName,
  Room,
} from '@/lib/roomManager';
import { supabase } from '@/lib/supabase';

interface OnlineRoomProps {
  gameVariant: GameVariant;
  initialCode?: string;             // pre-filled when arriving via /join/CODE link
  onGameStart: (settings: GameSettings) => void;
  onCancel: () => void;
}

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

const VARIANT_LABELS: Record<GameVariant, { en: string; ru: string }> = {
  short: { en: 'Short Backgammon', ru: 'Короткие нарды' },
  long:  { en: 'Long Backgammon',  ru: 'Длинные нарды'  },
  dark:  { en: 'Dark Mode',        ru: 'Тёмные нарды'   },
};

type Tab = 'create' | 'join';

export function OnlineRoom({ gameVariant, initialCode, onGameStart, onCancel }: OnlineRoomProps) {
  const { lang } = useLang();

  const [tab, setTab]               = useState<Tab>(initialCode ? 'join' : 'create');
  const [nickname, setNickname]     = useState(getPlayerName());
  const [nickSaved, setNickSaved]   = useState(!!getPlayerName());

  // Create-room state
  const [creating, setCreating]     = useState(false);
  const [room, setRoom]             = useState<Room | null>(null);
  const [copied, setCopied]         = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);

  // Join-room state
  const [code, setCode]             = useState(initialCode ?? '');
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState('');

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to room updates while waiting
  useEffect(() => {
    if (!room) return;

    const ch = supabase
      .channel(`room-wait-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        payload => {
          const updated = payload.new as Room;
          if (updated.player2_id) {
            setOpponentJoined(true);
            // Brief delay then start
            setTimeout(() => {
              const pid = getOrCreatePlayerId();
              onGameStart({
                mode: 'vs_friend_online',
                variant: gameVariant,
                playerColor: 'white',       // host = white
                playerRole: 'player1',
                playerId: pid,
                playerName: nickname || t.online.player1[lang],
                opponentName: updated.player2_name ?? t.online.player2[lang],
                roomId: room.id,
                roomCode: room.room_code,
                isFlipped: false,
              });
            }, 1200);
          }
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [room, gameVariant, nickname, lang, onGameStart]);

  // Auto-trigger join when arriving with a pre-filled code
  const autoJoinDone = useRef(false);
  useEffect(() => {
    if (initialCode && !autoJoinDone.current && nickSaved) {
      autoJoinDone.current = true;
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickSaved]);

  const saveNick = () => {
    savePlayerName(nickname);
    setNickSaved(true);
  };

  const handleCreate = async () => {
    savePlayerName(nickname);
    setCreating(true);
    const pid = getOrCreatePlayerId();
    const { room: r, error } = await createRoom(gameVariant, pid, nickname || t.online.player1[lang]);
    setCreating(false);
    if (error || !r) {
      return;
    }
    setRoom(r);
  };

  const handleJoin = async () => {
    if (code.length < 6) { setJoinError(t.online.errorNotFound[lang]); return; }
    setJoining(true);
    setJoinError('');
    const pid = getOrCreatePlayerId();
    const { room: r, error } = await joinRoom(code, pid, nickname || t.online.player2[lang]);
    setJoining(false);

    if (error === 'room_not_found') { setJoinError(t.online.errorNotFound[lang]); return; }
    if (error === 'game_started')   { setJoinError(t.online.errorStarted[lang]);  return; }
    if (error === 'game_finished')  { setJoinError(t.online.errorFinished[lang]); return; }
    if (error)                      { setJoinError(t.online.errorGeneric[lang]);   return; }
    if (!r) return;

    onGameStart({
      mode: 'vs_friend_online',
      variant: gameVariant,
      playerColor: 'black',       // guest = black
      playerRole: 'player2',
      playerId: pid,
      playerName: nickname || t.online.player2[lang],
      opponentName: r.player1_name ?? t.online.player1[lang],
      roomId: r.id,
      roomCode: r.room_code,
      isFlipped: true,            // flip board for black's perspective
    });
  };

  const copyCode = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Supabase not configured
  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <p className="text-amber-400 text-sm">{t.online.noSupabase[lang]}</p>
        <button onClick={onCancel} className="mt-4 text-white/40 text-sm hover:text-white">
          ← {t.online.cancel[lang]}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
      {/* Nickname step */}
      {!nickSaved && (
        <div>
          <h2 className="text-white font-bold text-lg mb-1">{t.online.nickname[lang]}</h2>
          <p className="text-white/40 text-sm mb-4">
            {VARIANT_LABELS[gameVariant][lang]}
          </p>
          <input
            autoFocus
            type="text"
            maxLength={20}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveNick()}
            placeholder={t.online.nicknamePlaceholder[lang]}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={saveNick}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
            >
              {t.online.join[lang]}
            </button>
            <button
              onClick={() => { setNickSaved(true); }}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm"
            >
              {t.online.skip[lang]}
            </button>
          </div>
          <button onClick={onCancel} className="mt-3 text-white/30 text-xs w-full text-center hover:text-white/60">
            ← {t.online.cancel[lang]}
          </button>
        </div>
      )}

      {/* Waiting screen (after room created) */}
      {nickSaved && room && (
        <AnimatePresence mode="wait">
          {opponentJoined ? (
            <motion.div key="joined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <div className="text-4xl mb-3">🎲</div>
              <p className="text-green-400 font-bold text-lg">{t.online.opponentJoined[lang]}</p>
            </motion.div>
          ) : (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-white font-bold text-xl mb-1">{t.online.roomCreated[lang]}</h2>
              <p className="text-white/40 text-sm mb-5">{VARIANT_LABELS[gameVariant][lang]}</p>

              {/* Room code */}
              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <p className="text-white/50 text-xs mb-1">{t.online.roomCode[lang]}</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-yellow-400 tracking-widest font-mono">
                    {room.room_code}
                  </span>
                  <button
                    onClick={() => copyCode(room.room_code)}
                    className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
                  >
                    {copied ? t.online.copied[lang] : '📋 ' + t.online.copyCode[lang]}
                  </button>
                </div>
              </div>

              {/* Share link */}
              <div className="bg-black/20 rounded-xl p-3 mb-5">
                <p className="text-white/40 text-xs mb-1">{t.online.shareLink[lang]}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs truncate flex-1 font-mono">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/join/{room.room_code}
                  </span>
                  <button
                    onClick={() =>
                      copyCode(
                        `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${room.room_code}`
                      )
                    }
                    className="text-white/40 text-xs hover:text-white/70 flex-shrink-0"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center gap-2 text-white/50 text-sm mb-5">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-yellow-400"
                />
                {t.online.waitingForOpponent[lang]}
              </div>

              <button
                onClick={onCancel}
                className="w-full py-2 rounded-xl bg-white/5 text-white/40 text-sm hover:bg-white/10 hover:text-white/70 transition-colors"
              >
                {t.online.cancel[lang]}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Create / Join tabs */}
      {nickSaved && !room && (
        <>
          {/* Tabs */}
          <div className="flex rounded-xl bg-black/30 p-1 mb-5">
            {(['create', 'join'] as Tab[]).map(tabId => (
              <button
                key={tabId}
                onClick={() => { setTab(tabId); setJoinError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === tabId ? 'bg-white/10 text-white' : 'text-white/40'
                }`}
              >
                {tabId === 'create' ? t.online.createRoom[lang] : t.online.joinRoom[lang]}
              </button>
            ))}
          </div>

          <p className="text-white/40 text-xs mb-4">{VARIANT_LABELS[gameVariant][lang]}</p>

          <AnimatePresence mode="wait">
            {tab === 'create' ? (
              <motion.div key="create" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-lg shadow-lg disabled:opacity-50"
                >
                  {creating ? '…' : t.online.createRoom[lang]}
                </button>
              </motion.div>
            ) : (
              <motion.div key="join" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <input
                  autoFocus
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder={t.online.codePlaceholder[lang]}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-yellow-500/50 mb-3"
                />
                {joinError && (
                  <p className="text-red-400 text-sm text-center mb-3">{joinError}</p>
                )}
                <button
                  onClick={handleJoin}
                  disabled={joining || code.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold disabled:opacity-40"
                >
                  {joining ? '…' : t.online.join[lang]}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={onCancel} className="mt-4 text-white/30 text-xs w-full text-center hover:text-white/60">
            ← {t.online.cancel[lang]}
          </button>
        </>
      )}
    </motion.div>
  );
}
