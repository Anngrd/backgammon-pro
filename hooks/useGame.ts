'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GameState,
  PlayerColor,
  ValidMove,
  GameSettings,
} from '@/types/game';
import {
  createInitialGameState,
  rollDice,
  applyDiceRoll,
  applyMove,
  getAllValidMoves,
  getValidDestinations,
  deepCloneState,
} from '@/lib/gameLogic';
import {
  createLongInitialGameState,
  applyLongDiceRoll,
  applyLongMove,
  getAllLongValidMoves,
  getLongValidDestinations,
} from '@/lib/longBackgammonLogic';
import { getAITurn } from '@/lib/aiEngine';
import { getLongAITurn } from '@/lib/longAiEngine';

export interface GameHookReturn {
  gameState: GameState;
  selectedPoint: number | 'bar' | null;
  validMoves: ValidMove[];
  isAIThinking: boolean;
  lastTurnSkipped: boolean;
  settings: GameSettings;
  handlePointClick: (pointIndex: number | 'bar') => void;
  handleRollDice: () => void;
  resetGame: () => void;
  startGame: (settings: GameSettings) => void;
}

function isLongRules(settings: GameSettings): boolean {
  return settings.mode === 'long' || settings.variant === 'long';
}

function isDarkRules(settings: GameSettings): boolean {
  return settings.mode === 'dark_mode' || settings.variant === 'dark';
}

function isAIOpponent(settings: GameSettings): boolean {
  return settings.mode === 'vs_ai' || settings.mode === 'long' || settings.mode === 'dark_mode';
}

export function useGame(): GameHookReturn {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(null);
  const [validMoves, setValidMoves] = useState<ValidMove[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastTurnSkipped, setLastTurnSkipped] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'vs_ai',
    playerColor: 'white',
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const startGame = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    const initial = isLongRules(newSettings)
      ? createLongInitialGameState()
      : createInitialGameState();
    setGameState(initial);
    setSelectedPoint(null);
    setValidMoves([]);
    setIsAIThinking(false);
    setLastTurnSkipped(false);
  }, []);

  const resetGame = useCallback(() => {
    const cfg = settingsRef.current;
    const initial = isLongRules(cfg)
      ? createLongInitialGameState()
      : createInitialGameState();
    setGameState(initial);
    setSelectedPoint(null);
    setValidMoves([]);
    setIsAIThinking(false);
    setLastTurnSkipped(false);
  }, []);

  const triggerAI = useCallback(
    async (state: GameState, aiPlayer: PlayerColor, long: boolean) => {
      setIsAIThinking(true);
      let currentState = deepCloneState(state);

      // Roll dice for AI
      await new Promise(resolve => setTimeout(resolve, 1600));
      const [d1, d2] = rollDice();
      currentState = long
        ? applyLongDiceRoll(currentState, d1, d2)
        : applyDiceRoll(currentState, d1, d2);
      setGameState(deepCloneState(currentState));

      if (currentState.gamePhase === 'game_over') {
        setIsAIThinking(false);
        return;
      }

      // If AI's roll was also skipped (no moves), just end AI thinking
      if (currentState.gamePhase === 'rolling') {
        setIsAIThinking(false);
        return;
      }

      const aiTurnFn = long ? getLongAITurn : getAITurn;
      const applyFn = long ? applyLongMove : applyMove;

      await aiTurnFn(currentState, aiPlayer, move => {
        currentState = applyFn(deepCloneState(currentState), move);
        setGameState(deepCloneState(currentState));
        return currentState;
      });

      setIsAIThinking(false);
    },
    []
  );

  const handleRollDice = useCallback(() => {
    const state = stateRef.current;
    const cfg = settingsRef.current;
    if (state.gamePhase !== 'rolling' || isAIThinking) return;

    const isAIMode = isAIOpponent(cfg);
    const aiPlayer: PlayerColor = cfg.playerColor === 'white' ? 'black' : 'white';
    const long = isLongRules(cfg);

    const [d1, d2] = rollDice();
    const newState = long
      ? applyLongDiceRoll(state, d1, d2)
      : applyDiceRoll(state, d1, d2);
    setGameState(newState);
    setSelectedPoint(null);
    setValidMoves([]);

    // Detect if human's turn was skipped (no moves available)
    const skipped = newState.currentPlayer !== state.currentPlayer;
    setLastTurnSkipped(skipped && !isAIMode);

    if (newState.gamePhase === 'game_over') return;

    // Human had no moves — turn was skipped, trigger AI if applicable
    if (isAIMode && newState.currentPlayer === aiPlayer && newState.gamePhase === 'rolling') {
      triggerAI(newState, aiPlayer, long);
      return;
    }

    // Human's own turn was passed and now it's still the human (2-player)
    // or it's now AI's rolling turn
    if (isAIMode && newState.currentPlayer === aiPlayer && newState.gamePhase === 'moving') {
      // Shouldn't normally happen — AI always starts in rolling phase
    }
  }, [isAIThinking, triggerAI]);

  const handlePointClick = useCallback(
    (pointIndex: number | 'bar') => {
      const state = stateRef.current;
      const cfg = settingsRef.current;
      if (state.gamePhase !== 'moving' || isAIThinking) return;

      const isAIMode = isAIOpponent(cfg);
      const aiPlayer: PlayerColor = cfg.playerColor === 'white' ? 'black' : 'white';
      const long = isLongRules(cfg);

      if (isAIMode && state.currentPlayer === aiPlayer) return;

      // In long mode there is no bar — ignore bar clicks
      if (long && pointIndex === 'bar') return;

      // If a point is already selected, check if this click is a valid destination
      if (selectedPoint !== null) {
        const destMove = validMoves.find(m => m.to === pointIndex);

        if (destMove) {
          const applyFn = long ? applyLongMove : applyMove;
          const newState = applyFn(deepCloneState(state), destMove);
          setGameState(newState);
          setSelectedPoint(null);
          setValidMoves([]);

          if (newState.gamePhase === 'game_over') return;

          if (isAIMode && newState.currentPlayer === aiPlayer && newState.gamePhase === 'rolling') {
            triggerAI(newState, aiPlayer, long);
          }
          return;
        }
      }

      // Select a new source point
      const hasChecker =
        pointIndex === 'bar'
          ? state.bar[state.currentPlayer] > 0
          : state.points[pointIndex as number].checkers.some(c => c === state.currentPlayer);

      if (!hasChecker) {
        setSelectedPoint(null);
        setValidMoves([]);
        return;
      }

      const moves = long
        ? getLongValidDestinations(state, pointIndex)
        : getValidDestinations(state, pointIndex);

      setSelectedPoint(pointIndex);
      setValidMoves(moves);
    },
    [isAIThinking, selectedPoint, validMoves, triggerAI]
  );

  return {
    gameState,
    selectedPoint,
    validMoves,
    isAIThinking,
    lastTurnSkipped,
    settings,
    handlePointClick,
    handleRollDice,
    resetGame,
    startGame,
  };
}
