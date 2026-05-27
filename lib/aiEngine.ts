import {
  GameState,
  PlayerColor,
  ValidMove,
} from '@/types/game';
import {
  getAllValidMoves,
  applyMove,
  deepCloneState,
  opponent,
  getPipCount,
  canBearOff,
} from './gameLogic';

// Evaluate board position for AI player (higher = better)
function evaluatePosition(state: GameState, player: PlayerColor): number {
  const opp = opponent(player);
  let score = 0;

  // Pip count differential (lower own pip count = better)
  const ownPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opp);
  score += (oppPips - ownPips) * 2;

  // Points made (2+ checkers = safe point)
  for (let i = 0; i < 24; i++) {
    const checkers = state.points[i].checkers;
    if (checkers.length >= 2) {
      if (checkers[0] === player) {
        score += 3;
        // Extra bonus for home board points
        const isHomeBoard = player === 'white' ? i <= 5 : i >= 18;
        if (isHomeBoard) score += 2;
        // Prime bonus (consecutive points)
        if (i > 0 && state.points[i - 1].checkers.length >= 2 && state.points[i - 1].checkers[0] === player) {
          score += 2;
        }
      } else {
        score -= 3;
      }
    }
  }

  // Blots (single exposed checkers) - penalty
  for (let i = 0; i < 24; i++) {
    const checkers = state.points[i].checkers;
    if (checkers.length === 1) {
      if (checkers[0] === player) {
        score -= 5;
        // Bigger penalty if in opponent's home board
        const inOppHome = player === 'white' ? i >= 18 : i <= 5;
        if (inOppHome) score -= 5;
      }
    }
  }

  // Checkers on bar
  score -= state.bar[player] * 10;
  score += state.bar[opp] * 10;

  // Bearing off progress
  score += state.bearOff[player] * 15;
  score -= state.bearOff[opp] * 15;

  // Hitting potential - prefer positions that threaten opponent blots
  for (let i = 0; i < 24; i++) {
    const checkers = state.points[i].checkers;
    if (checkers.length === 1 && checkers[0] === opp) {
      score += 2; // opponent blot = opportunity
    }
  }

  return score;
}

// Get best move using minimax-like evaluation
export function getAIMove(state: GameState, player: PlayerColor): ValidMove | null {
  const moves = getAllValidMoves(state, player);
  if (moves.length === 0) return null;

  // Remove duplicate destination moves (same die value used for same destination)
  const uniqueMoves = deduplicateMoves(moves);

  let bestScore = -Infinity;
  let bestMove = uniqueMoves[0];

  for (const move of uniqueMoves) {
    const newState = applyMove(deepCloneState(state), move);
    let score = evaluatePosition(newState, player);

    // Look ahead one more move if dice remaining
    if (newState.dice.remaining.length > 0 && newState.currentPlayer === player) {
      const nextMoves = getAllValidMoves(newState, player);
      const uniqueNext = deduplicateMoves(nextMoves);
      let bestNext = -Infinity;
      for (const nextMove of uniqueNext.slice(0, 5)) { // limit lookahead
        const afterNext = applyMove(deepCloneState(newState), nextMove);
        const nextScore = evaluatePosition(afterNext, player);
        if (nextScore > bestNext) bestNext = nextScore;
      }
      if (bestNext > -Infinity) score += bestNext * 0.5;
    }

    // Priority bonuses
    if (move.hitsBlot) score += 8; // strongly prefer hitting blots

    // Prefer making points (landing where we already have a checker)
    if (move.to !== 'bearoff' && typeof move.to === 'number') {
      const destCheckers = state.points[move.to].checkers.filter(c => c === player);
      if (destCheckers.length === 1) score += 5; // making a point
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
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

// Get all moves for a full AI turn (handles multiple dice)
export async function getAITurn(
  state: GameState,
  player: PlayerColor,
  onMove: (move: ValidMove) => GameState
): Promise<void> {
  let currentState = deepCloneState(state);

  while (
    currentState.currentPlayer === player &&
    currentState.gamePhase === 'moving' &&
    currentState.dice.remaining.length > 0
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // delay for UX

    const move = getAIMove(currentState, player);
    if (!move) break;

    currentState = onMove(move);

    // If game over, stop
    if (currentState.gamePhase === 'game_over') break;
  }
}
