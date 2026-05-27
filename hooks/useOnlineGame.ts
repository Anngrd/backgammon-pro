'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerColor, ValidMove, GameSettings } from '@/types/game';
import {
  createInitialGameState,
  rollDice,
  applyDiceRoll,
  applyMove,
  getValidDestinations,
  deepCloneState,
} from '@/lib/gameLogic';
import {
  createLongInitialGameState,
  applyLongDiceRoll,
  applyLongMove,
  getLongValidDestinations,
} from '@/lib/longBackgammonLogic';
import { supabase } from '@/lib/supabase';
import { pushGameState } from '@/lib/roomManager';

export interface OnlineGameReturn {
  gameState: GameState;
  selectedPoint: number | 'bar' | null;
  validMoves: ValidMove[];
  isMyTurn: boolean;
  lastTurnSkipped: boolean;
  opponentOnline: boolean;
  handlePointClick: (p: number | 'bar') => void;
  handleRollDice: () => void;
}

function makeInitialState(variant: string): GameState {
  return variant === 'long' ? createLongInitialGameState() : createInitialGameState();
}

export function useOnlineGame(settings: GameSettings): OnlineGameReturn {
  const isLong = settings.variant === 'long';

  // player1 = white, player2 = black (always in online mode)
  const myColor: PlayerColor = settings.playerRole === 'player1' ? 'white' : 'black';
  const myRole = settings.playerRole ?? 'player1';

  const [gameState, setGameState] = useState<GameState>(() =>
    makeInitialState(settings.variant ?? 'short')
  );
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(null);
  const [validMoves, setValidMoves] = useState<ValidMove[]>([]);
  const [lastTurnSkipped, setLastTurnSkipped] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(true);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const isMyTurn = gameState.currentPlayer === myColor;

  /** Push local state to Supabase and notify opponent */
  const syncState = useCallback(
    async (state: GameState) => {
      if (!settings.roomId) return;
      const nextColor = state.currentPlayer;
      const nextRole: 'player1' | 'player2' =
        nextColor === 'white' ? 'player1' : 'player2';
      await pushGameState(settings.roomId, state, nextRole);
    },
    [settings.roomId]
  );

  // Subscribe to opponent's moves via Supabase Realtime
  useEffect(() => {
    if (!settings.roomId) return;

    const channel = supabase
      .channel(`room-${settings.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${settings.roomId}`,
        },
        payload => {
          const updated = payload.new as Record<string, unknown>;
          if (!updated.game_state) return;
          const remote = updated.game_state as GameState;

          // Accept the update only when the remote state reflects the
          // opponent having made a move (i.e. it's now our turn, or game over)
          const remoteIsOurTurn = remote.currentPlayer === myColor;
          if (remoteIsOurTurn || remote.gamePhase === 'game_over') {
            setGameState(remote);
            setSelectedPoint(null);
            setValidMoves([]);
          }
        }
      )
      // Presence to track opponent connectivity
      .on('presence', { event: 'leave' }, () => setOpponentOnline(false))
      .on('presence', { event: 'join' },  () => setOpponentOnline(true))
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ player: myRole });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings.roomId, myColor, myRole]);

  const handleRollDice = useCallback(() => {
    const state = stateRef.current;
    if (state.gamePhase !== 'rolling' || state.currentPlayer !== myColor) return;

    const [d1, d2] = rollDice();
    const newState = isLong
      ? applyLongDiceRoll(state, d1, d2)
      : applyDiceRoll(state, d1, d2);

    const skipped = newState.currentPlayer !== state.currentPlayer;
    setLastTurnSkipped(skipped);
    setGameState(newState);
    setSelectedPoint(null);
    setValidMoves([]);
    syncState(newState);
  }, [myColor, isLong, syncState]);

  const handlePointClick = useCallback(
    (pointIndex: number | 'bar') => {
      const state = stateRef.current;
      if (state.gamePhase !== 'moving' || state.currentPlayer !== myColor) return;
      if (isLong && pointIndex === 'bar') return;

      if (selectedPoint !== null) {
        const dest = validMoves.find(m => m.to === pointIndex);
        if (dest) {
          const apply = isLong ? applyLongMove : applyMove;
          const next = apply(deepCloneState(state), dest);
          setGameState(next);
          setSelectedPoint(null);
          setValidMoves([]);
          syncState(next);
          return;
        }
      }

      const hasChecker =
        pointIndex === 'bar'
          ? state.bar[myColor] > 0
          : state.points[pointIndex as number].checkers.some(c => c === myColor);

      if (!hasChecker) {
        setSelectedPoint(null);
        setValidMoves([]);
        return;
      }

      const moves = isLong
        ? getLongValidDestinations(state, pointIndex)
        : getValidDestinations(state, pointIndex);

      setSelectedPoint(pointIndex);
      setValidMoves(moves);
    },
    [myColor, isLong, selectedPoint, validMoves, syncState]
  );

  return {
    gameState,
    selectedPoint,
    validMoves,
    isMyTurn,
    lastTurnSkipped,
    opponentOnline,
    handlePointClick,
    handleRollDice,
  };
}
