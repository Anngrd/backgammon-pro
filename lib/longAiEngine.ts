import { GameState, PlayerColor, ValidMove } from '@/types/game';
import { opponent, deepCloneState, getPipCount } from './gameLogic';
import {
  getAllLongValidMoves,
  applyLongMove,
} from './longBackgammonLogic';

// Evaluate board position for long backgammon AI (higher = better for `player`)
function evaluateLongPosition(state: GameState, player: PlayerColor): number {
  const opp = opponent(player);
  let score = 0;

  // Pip count differential (lower own pip count = better = closer to home)
  const ownPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opp);
  score += (oppPips - ownPips) * 2;

  // Bearing off progress
  score += state.bearOff[player] * 15;
  score -= state.bearOff[opp] * 15;

  // Points occupied (spread is good — each separate point = 1 potential blocker)
  let consecutiveOwn = 0;
  let maxPrime = 0;
  const startIdx = player === 'white' ? 23 : 11; // heads: white=23, black=11

  for (let i = 0; i < 24; i++) {
    const checkers = state.points[i].checkers;
    const ownCount = checkers.filter(c => c === player).length;
    const oppCount = checkers.filter(c => c === opp).length;

    if (ownCount > 0) {
      score += 2; // reward occupying distinct points

      // Extra for mid-board blockade zone (between start positions)
      // white 0-22, black 1-23 — mid-board = roughly 6-17
      const isMid = i >= 6 && i <= 17;
      if (isMid) score += 2;

      // Count prime (consecutive own points)
      consecutiveOwn++;
      if (consecutiveOwn > maxPrime) maxPrime = consecutiveOwn;

      // Penalise over-stacking on start point
      if (i === startIdx && ownCount > 5) {
        score -= (ownCount - 5) * 3;
      }
    } else {
      consecutiveOwn = 0;
    }

    // Reward blocking opponent's likely path
    if (ownCount > 0 && oppCount === 0) {
      // We block this point for the opponent
      score += 1;
    }
  }

  // Bonus for long prime (consecutive blocked points)
  score += maxPrime * 2;

  return score;
}

function deduplicateMoves(moves: ValidMove[]): ValidMove[] {
  const seen = new Set<string>();
  return moves.filter(m => {
    const key = `${m.from}-${m.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getLongAIMove(state: GameState, player: PlayerColor): ValidMove | null {
  const moves = getAllLongValidMoves(state, player);
  if (moves.length === 0) return null;

  const unique = deduplicateMoves(moves);
  let bestScore = -Infinity;
  let bestMove = unique[0];

  for (const move of unique) {
    const after = applyLongMove(deepCloneState(state), move);
    let score = evaluateLongPosition(after, player);

    // 1-ply look-ahead
    if (after.dice.remaining.length > 0 && after.currentPlayer === player) {
      const nextMoves = deduplicateMoves(getAllLongValidMoves(after, player));
      let bestNext = -Infinity;
      for (const nm of nextMoves.slice(0, 5)) {
        const s2 = evaluateLongPosition(applyLongMove(deepCloneState(after), nm), player);
        if (s2 > bestNext) bestNext = s2;
      }
      if (bestNext > -Infinity) score += bestNext * 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export async function getLongAITurn(
  state: GameState,
  player: PlayerColor,
  onMove: (move: ValidMove) => GameState
): Promise<void> {
  let current = deepCloneState(state);

  while (
    current.currentPlayer === player &&
    current.gamePhase === 'moving' &&
    current.dice.remaining.length > 0
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const move = getLongAIMove(current, player);
    if (!move) break;
    current = onMove(move);
    if (current.gamePhase === 'game_over') break;
  }
}
