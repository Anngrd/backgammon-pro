'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Board } from '@/components/Board';
import { GameSetup } from '@/components/GameSetup';
import { WinnerModal } from '@/components/WinnerModal';
import { BearOffDisplay } from '@/components/BearOffDisplay';
import { PlayerPanel } from '@/components/PlayerPanel';
import { DiceDisplay } from '@/components/DiceDisplay';
import { useGame } from '@/hooks/useGame';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { useSound } from '@/hooks/useSound';
import { useTheme } from '@/hooks/useTheme';
import { useLang } from '@/hooks/useLang';
import { analyzeGame } from '@/lib/openai';
import { AICoachAnalysis, GameSettings, PlayerColor } from '@/types/game';
import { t } from '@/lib/translations';

// ─── Local game view ────────────────────────────────────────────────────────

function LocalGame({
  settings,
  onNewGame,
}: {
  settings: GameSettings;
  onNewGame: () => void;
}) {
  const {
    gameState,
    selectedPoint,
    validMoves,
    isAIThinking,
    lastTurnSkipped,
    handlePointClick,
    handleRollDice,
    resetGame,
    startGame,
  } = useGame();

  const { playSound } = useSound();
  const { theme }     = useTheme();
  const { lang }      = useLang();
  const isDark        = theme === 'dark';

  const [coachAnalysis,   setCoachAnalysis]   = useState<AICoachAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [revealedPoints,  setRevealedPoints]  = useState<Set<number | 'bar'>>(new Set());
  const [showSkipToast,   setShowSkipToast]   = useState(false);
  const prevMoveCount = useRef(0);

  // Start the game immediately with provided settings
  useEffect(() => { startGame(settings); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isDarkMode = settings.mode === 'dark_mode' || settings.variant === 'dark';
  const isLongMode = settings.mode === 'long'      || settings.variant === 'long';
  const isAIMode   = settings.mode === 'vs_ai'     || settings.mode === 'long' || settings.mode === 'dark_mode';

  const myColor: PlayerColor = settings.playerColor;
  const oppColor: PlayerColor = myColor === 'white' ? 'black' : 'white';

  const myName  = isAIMode ? (lang === 'ru' ? 'Вы' : 'You') : (myColor === 'white' ? 'White' : 'Black');
  const oppName = isAIMode
    ? (isAIThinking ? (lang === 'ru' ? 'ИИ думает…' : 'AI thinking…') : 'AI')
    : (oppColor === 'white' ? 'White' : 'Black');

  // Sounds
  useEffect(() => {
    if (gameState.moveHistory.length > prevMoveCount.current) {
      const last = gameState.moveHistory[gameState.moveHistory.length - 1];
      playSound(last?.hitBlot ? 'hit' : 'move');
      if (isDarkMode && last) {
        const dest = last.to;
        if (dest !== 'bearoff') {
          const key = dest as number;
          setRevealedPoints(prev => new Set([...prev, key]));
          setTimeout(() => {
            setRevealedPoints(prev => { const n = new Set(prev); n.delete(key); return n; });
          }, 1000);
        }
      }
      prevMoveCount.current = gameState.moveHistory.length;
    }
  }, [gameState.moveHistory, playSound, isDarkMode]);

  useEffect(() => {
    if (gameState.dice.rolled) playSound('dice');
  }, [gameState.dice.rolled, gameState.dice.values, playSound]);

  useEffect(() => {
    if (gameState.winner) {
      playSound('win');
      setLoadingAnalysis(true);
      analyzeGame(gameState.moveHistory).then(a => { setCoachAnalysis(a); setLoadingAnalysis(false); });
    }
  }, [gameState.winner, playSound]);

  useEffect(() => {
    if (lastTurnSkipped && isLongMode) {
      setShowSkipToast(true);
      const tid = setTimeout(() => setShowSkipToast(false), 2500);
      return () => clearTimeout(tid);
    }
  }, [lastTurnSkipped, isLongMode]);

  const canRoll      = gameState.gamePhase === 'rolling' &&
    (!isAIMode || gameState.currentPlayer === myColor) &&
    !isAIThinking;

  const validDestinations = new Set(validMoves.map(m => m.to));

  return (
    <div className={`min-h-[calc(100vh-57px)] ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-black text-lg">
              {isDarkMode && <span className="text-purple-400">🌑 </span>}
              {isLongMode && <span className="text-red-400">♟️ </span>}
              Backgammon Pro
            </span>
            <p className="text-white/30 text-xs">
              {isAIMode ? (lang === 'ru' ? '🤖 vs ИИ' : '🤖 vs AI')
                : (lang === 'ru' ? '👥 Локально' : '👥 Local')}
              {isLongMode && (lang === 'ru' ? ' · Длинные нарды' : ' · Long rules')}
              {isDarkMode && (lang === 'ru' ? ' · Тёмный режим' : ' · Dark mode')}
            </p>
          </div>
          <button
            onClick={onNewGame}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            ← {t.game.newGame[lang]}
          </button>
        </div>

        {/* Opponent panel */}
        <PlayerPanel
          gameState={gameState}
          color={oppColor}
          name={oppName}
          isYou={false}
          statusOverride={
            isAIThinking && gameState.currentPlayer === oppColor
              ? (lang === 'ru' ? '🤖 ИИ думает…' : '🤖 AI thinking…')
              : undefined
          }
        />

        {/* Dark mode counters */}
        {isDarkMode && <DarkModeCounters gameState={gameState} lang={lang} />}

        {/* Long mode legend */}
        {isLongMode && (
          <div className="flex items-center gap-4 text-xs text-white/40 px-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-red-500/60 bg-red-900/30" />
              {lang === 'ru' ? 'Закрытое поле' : 'Blocked point'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-green-400/80 bg-green-400/20" />
              {lang === 'ru' ? 'Допустимый ход' : 'Valid move'}
            </span>
          </div>
        )}

        {/* Skip toast */}
        <AnimatePresence>
          {showSkipToast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="px-4 py-2 bg-red-900/60 border border-red-500/40 rounded-xl text-red-300 text-sm font-semibold text-center"
            >
              {t.game.pathBlocked[lang]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI turn banner */}
        <AnimatePresence>
          {isAIMode && (isAIThinking || gameState.currentPlayer !== myColor) && gameState.gamePhase !== 'game_over' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-4 py-2.5 bg-purple-900/40 border border-purple-500/40 rounded-xl text-purple-200 text-sm font-bold text-center flex items-center justify-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                🤖
              </motion.span>
              {lang === 'ru' ? 'Ход ИИ — подождите...' : 'AI is thinking — please wait...'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board */}
        <div className="relative">
          <Board
            gameState={gameState}
            selectedPoint={selectedPoint}
            validMoves={validMoves}
            onPointClick={handlePointClick}
            darkMode={isDarkMode}
            longMode={isLongMode}
            isFlipped={myColor === 'black'}
            revealedPoints={isDarkMode ? revealedPoints : undefined}
            playerColor={myColor}
          />
          {/* Dim overlay when not player's turn */}
          {isAIMode && gameState.currentPlayer !== myColor && gameState.gamePhase !== 'game_over' && (
            <div className="absolute inset-0 bg-black/30 rounded-xl pointer-events-none" />
          )}
        </div>

        {/* Player panel */}
        <PlayerPanel
          gameState={gameState}
          color={myColor}
          name={myName}
          isYou={true}
          statusOverride={
            isAIMode && gameState.currentPlayer !== myColor
              ? (lang === 'ru' ? t.game.opponentTurn.ru : t.game.opponentTurn.en)
              : undefined
          }
        />

        {/* Controls row */}
        <div className="flex items-center gap-3 px-1">
          <DiceDisplay
            values={gameState.dice.values}
            remaining={gameState.dice.remaining}
            rolled={gameState.dice.rolled}
          />

          {gameState.gamePhase === 'rolling' ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRollDice}
              disabled={!canRoll}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                canRoll
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-700/40 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAIThinking ? (lang === 'ru' ? 'ИИ…' : 'AI…') : t.game.rollDice[lang]}
            </motion.button>
          ) : (
            <div className="flex-1 text-center text-white/40 text-sm py-3">
              {gameState.bar[gameState.currentPlayer] > 0
                ? t.game.barFirst[lang]
                : t.game.clickToMove[lang]}
            </div>
          )}

          <BearOffDisplay
            whiteCount={gameState.bearOff.white}
            blackCount={gameState.bearOff.black}
            isValidDest={validDestinations.has('bearoff')}
          />
        </div>

        {/* Secondary controls */}
        <div className="flex gap-2 pb-4">
          <button onClick={onNewGame} className="flex-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 text-sm transition-colors">
            {t.game.newGame[lang]}
          </button>
          <button onClick={resetGame} className="flex-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 text-sm transition-colors">
            {t.game.resetGame[lang]}
          </button>
        </div>
      </div>

      <WinnerModal
        winner={gameState.winner}
        playerColor={myColor}
        coachAnalysis={coachAnalysis}
        loadingAnalysis={loadingAnalysis}
        onPlayAgain={resetGame}
        onNewGame={onNewGame}
      />
    </div>
  );
}

// ─── Online game view ────────────────────────────────────────────────────────

function OnlineGame({
  settings,
  onNewGame,
}: {
  settings: GameSettings;
  onNewGame: () => void;
}) {
  const game = useOnlineGame(settings);
  const { theme }   = useTheme();
  const { lang }    = useLang();
  const isDark      = theme === 'dark';
  const { playSound } = useSound();

  const isLong    = settings.variant === 'long';
  const myColor: PlayerColor  = settings.playerColor;
  const oppColor: PlayerColor = myColor === 'white' ? 'black' : 'white';

  const myName  = settings.playerName  || (lang === 'ru' ? 'Вы' : 'You');
  const oppName = settings.opponentName || (lang === 'ru' ? 'Соперник' : 'Opponent');

  const prevMove = useRef(0);
  useEffect(() => {
    if (game.gameState.moveHistory.length > prevMove.current) {
      playSound('move');
      prevMove.current = game.gameState.moveHistory.length;
    }
  }, [game.gameState.moveHistory, playSound]);

  useEffect(() => {
    if (game.gameState.dice.rolled) playSound('dice');
  }, [game.gameState.dice.rolled, game.gameState.dice.values, playSound]);

  const canRoll = game.gameState.gamePhase === 'rolling' && game.isMyTurn;
  const validDestinations = new Set(game.validMoves.map(m => m.to));

  return (
    <div className={`min-h-[calc(100vh-57px)] ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-black text-lg">Backgammon Pro</span>
            <p className="text-white/30 text-xs">
              🌐 {lang === 'ru' ? 'Онлайн' : 'Online'} · {settings.roomCode}
            </p>
          </div>
          <button onClick={onNewGame} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
            ← {t.game.newGame[lang]}
          </button>
        </div>

        {/* Opponent panel */}
        <PlayerPanel
          gameState={game.gameState}
          color={oppColor}
          name={oppName}
          isYou={false}
          isOnline={game.opponentOnline}
          statusOverride={
            !game.isMyTurn && game.gameState.gamePhase === 'rolling'
              ? t.game.opponentTurn[lang]
              : undefined
          }
        />

        {/* Board */}
        <Board
          gameState={game.gameState}
          selectedPoint={game.selectedPoint}
          validMoves={game.validMoves}
          onPointClick={game.handlePointClick}
          longMode={isLong}
          isFlipped={settings.isFlipped}
          playerColor={myColor}
        />

        {/* Player panel */}
        <PlayerPanel
          gameState={game.gameState}
          color={myColor}
          name={myName}
          isYou={true}
          isOnline={true}
          statusOverride={
            !game.isMyTurn
              ? t.game.opponentTurn[lang]
              : game.gameState.gamePhase === 'rolling'
              ? t.game.rollFirst[lang]
              : undefined
          }
        />

        {/* Controls */}
        <div className="flex items-center gap-3 px-1">
          <DiceDisplay
            values={game.gameState.dice.values}
            remaining={game.gameState.dice.remaining}
            rolled={game.gameState.dice.rolled}
          />

          {game.gameState.gamePhase === 'rolling' ? (
            <motion.button
              whileHover={canRoll ? { scale: 1.04 } : {}}
              whileTap={canRoll ? { scale: 0.96 } : {}}
              onClick={game.handleRollDice}
              disabled={!canRoll}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                canRoll
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-700/40 text-gray-500 cursor-not-allowed'
              }`}
            >
              {game.isMyTurn ? t.game.rollDice[lang] : t.game.opponentTurn[lang]}
            </motion.button>
          ) : (
            <div className="flex-1 text-center text-white/40 text-sm py-3">
              {game.isMyTurn
                ? t.game.clickToMove[lang]
                : t.game.opponentTurn[lang]}
            </div>
          )}

          <BearOffDisplay
            whiteCount={game.gameState.bearOff.white}
            blackCount={game.gameState.bearOff.black}
            isValidDest={validDestinations.has('bearoff')}
          />
        </div>

        <div className="pb-4" />
      </div>

      <WinnerModal
        winner={game.gameState.winner}
        playerColor={myColor}
        coachAnalysis={null}
        loadingAnalysis={false}
        onPlayAgain={onNewGame}
        onNewGame={onNewGame}
      />
    </div>
  );
}

// ─── Root page ───────────────────────────────────────────────────────────────

export default function GamePage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Handle pending game from /join/[code] redirect
  useEffect(() => {
    const pending = sessionStorage.getItem('bg_pending_game');
    if (pending) {
      sessionStorage.removeItem('bg_pending_game');
      try { setSettings(JSON.parse(pending) as GameSettings); } catch {}
    }
  }, []);

  const handleStart = (s: GameSettings) => setSettings(s);
  const handleNewGame = () => setSettings(null);

  if (!settings) {
    return (
      <div className={`min-h-[calc(100vh-57px)] ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <GameSetup onStart={handleStart} />
      </div>
    );
  }

  if (settings.mode === 'vs_friend_online') {
    return <OnlineGame settings={settings} onNewGame={handleNewGame} />;
  }

  return <LocalGame settings={settings} onNewGame={handleNewGame} />;
}

// ─── Helper: Dark mode counters ──────────────────────────────────────────────

function DarkModeCounters({ gameState, lang }: { gameState: any; lang: 'en' | 'ru' }) {
  const count = (section: 'left' | 'mid' | 'right' | 'bar', player: 'white' | 'black') => {
    if (section === 'bar') return gameState.bar[player];
    const ranges: Record<string, [number, number]> = { left: [0,7], mid: [8,15], right: [16,23] };
    const [s, e] = ranges[section];
    return gameState.points.slice(s, e+1).reduce((a: number, p: any) => a + p.checkers.filter((c: string) => c === player).length, 0);
  };
  const sections = ['left','mid','right','bar'] as const;
  return (
    <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-3 text-xs">
      <div className="text-purple-300 font-semibold mb-2">🌑 {lang === 'ru' ? 'Позиции шашек' : 'Checker Positions'}</div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {sections.map(s => (
          <div key={s} className="flex flex-col gap-1">
            <div className="text-white/40 capitalize text-[10px]">{s}</div>
            <div className="text-white/80">⚪ {count(s, 'white')}</div>
            <div className="text-white/80">⚫ {count(s, 'black')}</div>
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <div className="text-white/40 text-[10px]">off</div>
          <div className="text-white/80">⚪ {gameState.bearOff.white}</div>
          <div className="text-white/80">⚫ {gameState.bearOff.black}</div>
        </div>
      </div>
    </div>
  );
}
