'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { OnlineRoom } from '@/components/OnlineRoom';
import { getRoomByCode } from '@/lib/roomManager';
import { GameSettings, GameVariant } from '@/types/game';
import { useLang } from '@/hooks/useLang';
import { t } from '@/lib/translations';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { lang } = useLang();
  const isDark = theme === 'dark';

  const code = (params.code as string ?? '').toUpperCase();

  const [variant, setVariant] = useState<GameVariant | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');

  useEffect(() => {
    if (!code) { setError('Invalid link'); setLoading(false); return; }
    getRoomByCode(code).then(room => {
      if (!room) { setError(t.online.errorNotFound[lang]); setLoading(false); return; }
      if (room.status === 'finished') { setError(t.online.errorFinished[lang]); setLoading(false); return; }
      if (room.status === 'playing')  { setError(t.online.errorStarted[lang]);  setLoading(false); return; }
      setVariant(room.game_type as GameVariant);
      setLoading(false);
    });
  }, [code, lang]);

  const handleGameStart = (settings: GameSettings) => {
    // Store settings in sessionStorage and redirect to game page
    sessionStorage.setItem('bg_pending_game', JSON.stringify(settings));
    router.push('/game');
  };

  return (
    <div className={`min-h-[calc(100vh-57px)] ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      {loading ? (
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      ) : error ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-white/70 text-lg mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            ← {t.online.cancel[lang]}
          </button>
        </motion.div>
      ) : variant ? (
        <OnlineRoom
          gameVariant={variant}
          initialCode={code}
          onGameStart={handleGameStart}
          onCancel={() => router.push('/')}
        />
      ) : null}
    </div>
  );
}
