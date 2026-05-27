'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/lib/translations';

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

function classifyError(msg: string, lang: 'en' | 'ru'): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid') || lower.includes('credentials')) {
    return t.auth.errorInvalidCredentials[lang];
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch') || lower.includes('placeholder')) {
    return t.auth.errorNetwork[lang];
  }
  if (lower.includes('email') && lower.includes('rate')) {
    return lang === 'ru' ? 'Слишком много попыток. Подождите немного.' : 'Too many attempts. Please wait a moment.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already')) {
    return lang === 'ru' ? 'Этот email уже зарегистрирован. Войдите в аккаунт.' : 'This email is already registered. Sign in instead.';
  }
  if (lower.includes('password') && (lower.includes('least') || lower.includes('short') || lower.includes('characters'))) {
    return lang === 'ru' ? 'Пароль должен быть не менее 6 символов.' : 'Password must be at least 6 characters.';
  }
  if (lower.includes('email') && lower.includes('valid')) {
    return lang === 'ru' ? 'Введите корректный email.' : 'Please enter a valid email address.';
  }
  if (lower.includes('signup') && lower.includes('disabled')) {
    return lang === 'ru' ? 'Регистрация отключена. Обратитесь к администратору.' : 'Signups are disabled. Contact the administrator.';
  }
  // Fall back to the raw message so it's always diagnosable
  return msg;
}

export default function AuthPage() {
  const router = useRouter();
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SUPABASE_CONFIGURED) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user) {
          // Non-critical — ignore errors if profiles table doesn't exist yet
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              username: username || email.split('@')[0],
              email,
              games_played: 0,
              games_won: 0,
            });
          } catch {
            // profiles table may not exist yet — auth still succeeds
          }

          // If email confirmation is disabled, user is already logged in
          if (data.session) {
            router.push('/profile');
          } else {
            setMessage(t.auth.confirmEmail[lang]);
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/profile');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(classifyError(msg, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!SUPABASE_CONFIGURED) return;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (oauthError) setError(classifyError(oauthError.message, lang));
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#080E1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20" />
              <div className="absolute inset-[5px] rounded-full border border-[#C9A84C]/30" />
              <div className="absolute inset-[11px] rounded-full bg-[#C9A84C]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-[#E8E4DC] tracking-tight">
            Backgammon <span className="text-[#C9A84C]">Pro</span>
          </h1>
          <p className="text-[#E8E4DC]/40 text-sm mt-1">{t.auth.subtitle[lang]}</p>
        </div>

        {/* Supabase not configured banner */}
        {!SUPABASE_CONFIGURED && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <p className="text-amber-400 text-sm font-medium mb-1">⚠️ {t.auth.noSupabase[lang]}</p>
            <p className="text-amber-300/70 text-xs mb-3">{t.auth.playWithout[lang]}</p>
            <Link
              href="/game"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
            >
              {t.auth.playGame[lang]}
            </Link>
          </motion.div>
        )}

        <div className={`bg-[#0F1725] border border-white/6 rounded-2xl p-6 shadow-2xl ${!SUPABASE_CONFIGURED ? 'opacity-60 pointer-events-none select-none' : ''}`}>
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-black/30 p-1 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-white/10 text-white' : 'text-white/40'
                }`}
              >
                {m === 'signin' ? t.auth.signIn[lang] : t.auth.signUp[lang]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-white/60 mb-1">{t.auth.username[lang]}</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t.auth.usernamePlaceholder[lang]}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.auth.email[lang]}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">{t.auth.password[lang]}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm"
              >
                {message}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#E2C97E] text-[#080E1A] font-bold shadow-lg shadow-[#C9A84C]/15 transition-colors disabled:opacity-40"
            >
              {loading
                ? t.auth.loading[lang]
                : mode === 'signin'
                ? t.auth.signIn[lang]
                : t.auth.createAccount[lang]}
            </motion.button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-white/40">
              <span className="bg-gray-900 px-2">{t.auth.orContinueWith[lang]}</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.auth.google[lang]}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
