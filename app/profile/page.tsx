'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/translations';

const SCORE_COLORS: Record<string, string> = {
  Beginner: 'text-red-400 bg-red-400/10',
  Intermediate: 'text-yellow-400 bg-yellow-400/10',
  Advanced: 'text-blue-400 bg-blue-400/10',
  Expert: 'text-green-400 bg-green-400/10',
};

interface GameRecord {
  id: string;
  opponent_name: string;
  result: string;
  ai_coach_score: string | null;
  mode: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLang();
  const { theme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [city, setCity] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  const modeLabels = t.profile.modeLabels[lang];

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('game_history').select('*').eq('player_id', user.id)
        .order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: pd }, { data: hist }]) => {
      if (pd) { setProfile(pd); setCity(pd.city || ''); }
      if (hist) setHistory(hist);
      setLoadingData(false);
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveCity = async () => {
    if (!user) return;
    setSavingCity(true);
    await supabase.from('profiles').update({ city }).eq('id', user.id);
    setSavingCity(false);
  };

  const gamesPlayed = profile?.games_played ?? 0;
  const gamesWon = profile?.games_won ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const username = profile?.username || user?.email?.split('@')[0] || 'Player';

  const cardClass = isDark
    ? 'bg-gray-900 border-white/10'
    : 'bg-white border-gray-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/50' : 'text-gray-500';
  const inputClass = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-yellow-500/50'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-400';
  const rowClass = isDark ? 'bg-white/5' : 'bg-gray-50';

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>{t.profile.signInPrompt[lang]}</h2>
          <button onClick={() => router.push('/auth')}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold">
            {t.profile.signIn[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-57px)] p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-6 ${cardClass}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-black text-white">
                {username[0].toUpperCase()}
              </div>
              <div>
                <h1 className={`text-xl font-bold ${textPrimary}`}>{username}</h1>
                <p className={`text-sm ${textMuted}`}>{user.email}</p>
                {city && <p className={`text-xs mt-0.5 ${textMuted}`}>📍 {city}</p>}
              </div>
            </div>
            <button onClick={handleSignOut} className={`text-sm transition-colors ${textMuted} hover:text-red-400`}>
              {t.profile.signOut[lang]}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { value: gamesPlayed, label: t.profile.gamesPlayed[lang], color: textPrimary },
              { value: `${winRate}%`, label: t.profile.winRate[lang], color: 'text-green-400' },
              { value: profile?.average_ai_score ? profile.average_ai_score.toFixed(1) : '—', label: t.profile.avgScore[lang], color: 'text-yellow-400' },
            ].map((stat, i) => (
              <div key={i} className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className={`text-xs ${textMuted}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* City */}
          <div className="mt-4 flex gap-2">
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder={t.profile.cityPlaceholder[lang]}
              className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors ${inputClass}`}
            />
            <button onClick={handleSaveCity} disabled={savingCity}
              className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-sm font-medium hover:bg-yellow-500/30 transition-colors">
              {savingCity ? t.profile.saving[lang] : t.profile.save[lang]}
            </button>
          </div>
        </motion.div>

        {/* Game history */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`border rounded-2xl p-6 ${cardClass}`}>
          <h2 className={`font-bold mb-4 ${textPrimary}`}>{t.profile.gameHistory[lang]}</h2>
          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className={`text-center py-8 ${textMuted}`}>
              <div className="text-4xl mb-2">🎲</div>
              <p>{lang === 'ru' ? 'Нет сыгранных партий' : 'No games played yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((game, i) => (
                <motion.div key={game.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${rowClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${game.result === 'win' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <div className={`text-sm font-medium ${textPrimary}`}>{game.opponent_name}</div>
                      <div className={`text-xs ${textMuted}`}>
                        {modeLabels[game.mode as keyof typeof modeLabels]} · {new Date(game.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.ai_coach_score && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCORE_COLORS[game.ai_coach_score] || ''}`}>
                        {game.ai_coach_score}
                      </span>
                    )}
                    <span className={`text-sm font-bold ${game.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                      {game.result === 'win' ? 'W' : 'L'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
