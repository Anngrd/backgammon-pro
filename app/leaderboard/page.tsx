'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/lib/translations';
import { supabase } from '@/lib/supabase';

const SCORE_COLORS: Record<string, string> = {
  Beginner: 'text-red-400',
  Intermediate: 'text-yellow-400',
  Advanced: 'text-blue-400',
  Expert: 'text-green-400',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface GlobalEntry {
  rank: number;
  username: string;
  city: string | null;
  games_played: number;
  win_rate: number;
  avg_score: string | null;
}

interface CityEntry {
  city: string;
  top_player: string;
  player_count: number;
  avg_win_rate: number;
}

export default function LeaderboardPage() {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<'global' | 'city'>('global');
  const [globalData, setGlobalData] = useState<GlobalEntry[]>([]);
  const [cityData, setCityData] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Global leaderboard — players with 10+ games, sorted by win rate
        const { data } = await supabase
          .from('profiles')
          .select('username, city, games_played, games_won, average_ai_score')
          .gte('games_played', 10)
          .order('games_won', { ascending: false })
          .limit(50);

        if (data) {
          const ranked: GlobalEntry[] = data
            .map((p, i) => ({
              rank: i + 1,
              username: p.username,
              city: p.city,
              games_played: p.games_played,
              win_rate: p.games_played > 0 ? Math.round((p.games_won / p.games_played) * 100) : 0,
              avg_score: p.average_ai_score
                ? p.average_ai_score >= 3.5 ? 'Expert'
                : p.average_ai_score >= 2.5 ? 'Advanced'
                : p.average_ai_score >= 1.5 ? 'Intermediate'
                : 'Beginner'
                : null,
            }))
            .sort((a, b) => b.win_rate - a.win_rate)
            .map((p, i) => ({ ...p, rank: i + 1 }));
          setGlobalData(ranked);

          // City leaderboard
          const cityMap = new Map<string, { players: GlobalEntry[] }>();
          ranked.forEach(p => {
            if (p.city) {
              if (!cityMap.has(p.city)) cityMap.set(p.city, { players: [] });
              cityMap.get(p.city)!.players.push(p);
            }
          });
          const cities: CityEntry[] = Array.from(cityMap.entries())
            .map(([city, { players }]) => ({
              city,
              top_player: players[0].username,
              player_count: players.length,
              avg_win_rate: Math.round(players.reduce((s, p) => s + p.win_rate, 0) / players.length),
            }))
            .sort((a, b) => b.avg_win_rate - a.avg_win_rate);
          setCityData(cities);
        }
      } catch {
        // Supabase not configured — show empty state
      }
      setLoading(false);
    }
    load();
  }, []);

  const card = isDark
    ? 'bg-gray-900 border-white/10 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const subtext = isDark ? 'text-white/40' : 'text-gray-400';
  const tabBg = isDark ? 'bg-black/30' : 'bg-gray-200';
  const tabActive = isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow';
  const tabInactive = isDark ? 'text-white/40' : 'text-gray-500';

  return (
    <div className="min-h-[calc(100vh-57px)] p-4">
      <div className="max-w-2xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.leaderboard.title[lang]}</h1>
          <p className={`mt-1 ${subtext}`}>{t.leaderboard.subtitle[lang]}</p>
        </motion.div>

        <div className={`flex rounded-xl ${tabBg} p-1 mb-6`}>
          {(['global', 'city'] as const).map(tabId => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === tabId ? tabActive : tabInactive}`}
            >
              {tabId === 'global' ? t.leaderboard.global[lang] : t.leaderboard.city[lang]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'global' ? (
          globalData.length === 0 ? (
            <EmptyState isDark={isDark} msg={lang === 'ru' ? 'Пока нет игроков с 10+ партиями. Сыграйте больше игр!' : 'No players with 10+ games yet. Keep playing!'} />
          ) : (
            <div className="space-y-2">
              {globalData.map((player, i) => (
                <motion.div key={player.rank}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center justify-between border rounded-xl px-4 py-3 ${card} ${i < 3 ? 'border-yellow-500/40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">
                      {i < 3 ? <span className="text-lg">{RANK_MEDALS[i]}</span>
                        : <span className={`font-mono text-sm ${subtext}`}>{player.rank}</span>}
                    </div>
                    <div>
                      <div className="font-semibold">{player.username}</div>
                      <div className={`text-xs ${subtext}`}>
                        {player.city && `📍 ${player.city} · `}{player.games_played} {t.leaderboard.games[lang]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{player.win_rate}%</div>
                    {player.avg_score && <div className={`text-xs ${SCORE_COLORS[player.avg_score]}`}>{player.avg_score}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          cityData.length === 0 ? (
            <EmptyState isDark={isDark} msg={lang === 'ru' ? 'Добавьте город в профиле чтобы появиться здесь' : 'Add your city in your profile to appear here'} />
          ) : (
            <div className="space-y-3">
              {cityData.map((city, i) => (
                <motion.div key={city.city}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl p-4 ${card}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{i < 3 ? RANK_MEDALS[i] : '🏙️'}</span>
                      <div>
                        <div className="font-bold">{city.city}</div>
                        <div className={`text-xs ${subtext}`}>
                          {t.leaderboard.top[lang]} <span className="text-yellow-400">{city.top_player}</span>
                          {' '}· {city.player_count} {t.leaderboard.players[lang]}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{city.avg_win_rate}%</div>
                      <div className={`text-xs ${subtext}`}>{t.leaderboard.avgWinRate[lang]}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ isDark, msg }: { isDark: boolean; msg: string }) {
  return (
    <div className={`text-center py-16 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
      <div className="text-5xl mb-4">🏆</div>
      <p>{msg}</p>
    </div>
  );
}
