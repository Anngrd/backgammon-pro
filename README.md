# 🎲 Backgammon Pro

The world's most refined backgammon experience — built for serious players who want more than a casual game.

## What is it?

Backgammon Pro is a full-featured web backgammon application with an AI opponent, post-game coaching, a unique "Dark Mode" variant, and a global leaderboard. It's designed for players who want to improve their game, not just pass the time.

**Who it's for:** Competitive backgammon players, people learning the game seriously, and anyone who wants a polished, distraction-free board game experience on any device.

## Key Features

- **Full Rules Engine** — Perfectly validated moves: bar entry, bearing off, hitting blots, blocking, doubles, and no-move detection
- **Smart AI Opponent** — Rule-based AI that prioritizes hitting blots, building primes, and running when pip-count favors it
- **Dark Mode (World First)** — All checkers are invisible (shown only as shadows). Checkers reveal for 1 second after each move. A section counter shows how many checkers each player has in each zone. No other platform has this mode.
- **AI Coach** — After each game, GPT-4o-mini analyzes your move history and delivers 3–5 specific, move-referenced insights + an overall skill score (Beginner / Intermediate / Advanced / Expert). Falls back to heuristic analysis without an API key.
- **Auth & Profiles** — Email or Google OAuth via Supabase. Track games played, win rate, and average AI Coach score.
- **Leaderboard** — Global (minimum 10 games) and city-based rankings sorted by win rate.
- **Sound Effects** — Synthesized audio for dice rolls, checker moves, blot hits, and wins using the Web Audio API (no files needed).
- **Pro Tier UI** — Upgrade modal showing premium features: custom skins, extended analysis, unlimited history, advanced leaderboards.
- **Mobile Responsive** — Fully playable on phone with touch-friendly point selection.
- **Dark/Light Theme** — Persistent toggle in the navbar.

## How to Run Locally

```bash
# 1. Clone and enter the directory
cd backgammon-pro

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Supabase and (optionally) OpenAI keys

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without any API keys — Supabase auth and AI Coach gracefully degrade.

### Supabase Setup (optional, for auth + leaderboard)

1. Create a project at [supabase.com](https://supabase.com)
2. Run these SQL tables in the Supabase SQL editor:

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  username text not null,
  email text not null,
  city text,
  games_played int default 0,
  games_won int default 0,
  average_ai_score numeric,
  created_at timestamptz default now()
);

create table game_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id),
  opponent_name text not null,
  result text check (result in ('win', 'loss')),
  ai_coach_score text,
  mode text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table game_history enable row level security;
create policy "Users can read all profiles" on profiles for select using (true);
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own history" on game_history for all using (auth.uid() = player_id);
```

3. Copy your project URL and anon key into `.env.local`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Animations | Framer Motion |
| Auth & DB | Supabase (PostgreSQL + Realtime) |
| AI Coach | OpenAI API (gpt-4o-mini) |
| Audio | Web Audio API (synthesized, no files) |
| Language | TypeScript |
| Deployment | Vercel (recommended) |

## What Makes This Different

| Feature | Backgammon Pro | Others |
|---|---|---|
| Dark Mode (invisible checkers) | ✅ | ❌ Nowhere else |
| Post-game AI coaching | ✅ GPT-4o-mini | ❌ |
| Move-level insight analysis | ✅ | ❌ |
| Synthesized sound (no files) | ✅ | ❌ |
| Global + city leaderboard | ✅ | Rarely |
| Mobile-first design | ✅ | Often broken |
| Open source + self-hostable | ✅ | ❌ |

## Project Structure

```
app/                   # Next.js App Router pages
├── game/             # Main game page
├── auth/             # Sign in / sign up
├── profile/          # User stats & history
└── leaderboard/      # Global & city rankings

components/           # React UI components
├── Board.tsx         # Game board rendering
├── Checker.tsx       # Individual checker piece
├── DiceDisplay.tsx   # Animated dice faces
├── GameControls.tsx  # Roll button, turn indicator
├── GameSetup.tsx     # Mode & color selection
├── WinnerModal.tsx   # End-game + AI Coach display
├── Navbar.tsx        # Top navigation
├── ProModal.tsx      # Upgrade flow UI
└── AppShell.tsx      # Theme wrapper

lib/                  # Pure logic, no UI
├── gameLogic.ts      # Full backgammon rules engine
├── aiEngine.ts       # Rule-based AI with look-ahead
├── supabase.ts       # Database client
└── openai.ts         # AI Coach integration

hooks/
├── useGame.ts        # Core game state machine
└── useSound.ts       # Web Audio sound effects

types/
└── game.ts           # All TypeScript interfaces
```
