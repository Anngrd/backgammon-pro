import { GameState, PlayerColor, Point, Move, ValidMove } from '@/types/game';
import {
  BOARD_SIZE,
  opponent,
  getDiceRemaining,
  deepCloneState,
} from './gameLogic';

// ── Long backgammon (Нарды длинные) — official Russian rules ──────────────
//
// Starting position:
//   White: all 15 at point 24 (index 23) — their "head"
//   Black: all 15 at point 12 (index 11) — their "head"
//
// Movement: BOTH players move counter-clockwise (direction –1).
//   White: 23 → 22 → … → 0 → bear off
//   Black: 11 → 10 → … → 0 → wrap to 23 → 22 → … → 12 → bear off
//
// Home boards:
//   White: indices 0–5   (points 1–6)
//   Black: indices 12–17 (points 13–18)
//
// Head rule: max 1 checker per turn may leave from the head.
//   EXCEPTION: on a player's very first throw, if they roll 3-3, 4-4, or 6-6
//   they may take 2 from the head (because those dice values inevitably hit the
//   opponent's head at index 11/23 with only one checker).
//
// No hitting: any single opponent checker blocks a point completely.
// Pass-through blocking: a checker cannot pass through an opponent-occupied point.
//
// 6-prime rule: a player may NOT create a 6-consecutive-point prime that traps
//   ALL opponent checkers, UNLESS at least one opponent checker has already
//   passed the prime (is further along in the opponent's movement path) OR is
//   in the opponent's home board (indices 12–17 for Black, 0–5 for White).
//
// Mandatory move: must use all dice if possible; if only one die can be used,
//   the HIGHER die must be used.

const HEAD: Record<PlayerColor, number> = { white: 23, black: 11 };
const HOME_MIN: Record<PlayerColor, number> = { white: 0, black: 12 };
const HOME_MAX: Record<PlayerColor, number> = { white: 5, black: 17 };

// ── internal helpers ──────────────────────────────────────────────────────────

/** True when the player has never completed a full turn yet (first-throw exception). */
function isFirstTurnForPlayer(state: GameState, player: PlayerColor): boolean {
  return !state.moveHistory.some(
    m => m.player === player && m.turnNumber < state.turnNumber
  );
}

/** How many checkers the player has already moved from their head THIS turn. */
function headMovesThisTurn(state: GameState, player: PlayerColor): number {
  const headIdx = HEAD[player];
  return state.moveHistory.filter(
    m => m.turnNumber === state.turnNumber &&
         m.player === player &&
         m.from === headIdx
  ).length;
}

/** Whether all of the player's checkers are in their home board (bear-off eligible). */
function canBearOffLong(state: GameState, player: PlayerColor): boolean {
  const lo = HOME_MIN[player], hi = HOME_MAX[player];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i >= lo && i <= hi) continue;
    if (state.points[i].checkers.some(c => c === player)) return false;
  }
  return true;
}

/**
 * The "farthest" checker in the home board = highest-index checker.
 * Both White (home 0-5) and Black (home 12-17) exit by going below HOME_MIN,
 * so the highest index is the one hardest to bear off (needs the biggest die).
 */
function getFarthestLong(state: GameState, player: PlayerColor): number {
  for (let i = HOME_MAX[player]; i >= HOME_MIN[player]; i--) {
    if (state.points[i].checkers.some(c => c === player)) return i;
  }
  return -1;
}

/**
 * Checks every intermediate board square on the path from `from` for `die` steps.
 * Stops early if the path exits the board (bear-off).
 * Returns false if any intermediate square is occupied by the opponent.
 */
function isPathClearLong(
  state: GameState,
  from: number,
  die: number,
  player: PlayerColor
): boolean {
  const opp = opponent(player);
  const fromInBlackHome = player === 'black' && from >= HOME_MIN.black;

  for (let step = 1; step <= die; step++) {
    const rawIdx = from - step;

    let idx: number;
    if (player === 'white') {
      if (rawIdx < 0) break;          // off board → bear-off territory
      idx = rawIdx;
    } else {
      // Black
      if (fromInBlackHome) {
        if (rawIdx < HOME_MIN.black) break; // exiting home → bear-off
        idx = rawIdx;
      } else {
        // Non-home: wrap at index 0
        idx = rawIdx < 0 ? rawIdx + 24 : rawIdx;
      }
    }

    if (state.points[idx].checkers.some(c => c === opp)) return false;
  }
  return true;
}

// ── 6-prime blocking rule ─────────────────────────────────────────────────────

/**
 * "Progress" of a Black checker along its path (higher = further along).
 *   indices 0–11 → progress 11…0   (early journey)
 *   indices 12–23 → progress 23…12 (after wrapping — 23 entered first)
 */
function blackProgress(idx: number): number {
  return idx <= 11 ? 11 - idx : 35 - idx;
}

/**
 * Has the opponent checker at `checkerIdx` already PASSED the prime's near edge at `primeLo`?
 * "Passed" means the checker is further along in the opponent's movement path
 * than the start of the prime.
 */
function opponentHasPassed(checkerIdx: number, primeLo: number, opp: PlayerColor): boolean {
  if (opp === 'white') {
    // White moves –1: has passed primeLo if it is at a lower index
    return checkerIdx < primeLo;
  } else {
    // Black moves –1 with wrap: compare path progress
    return blackProgress(checkerIdx) > blackProgress(primeLo);
  }
}

/**
 * Simulate placing `player`'s checker from `from` to `to` and check whether
 * the resulting position has any 6-consecutive-point prime that illegally
 * traps ALL opponent checkers (none past it, none in home).
 */
function wouldCreateIllegal6Prime(
  state: GameState,
  from: number,
  to: number,
  player: PlayerColor
): boolean {
  const opp = opponent(player);

  // Build a quick simulated points array (shallow copy with two modified entries)
  const sim = state.points.map((p, i) => {
    if (i === from) {
      const ch = [...p.checkers];
      const ci = ch.lastIndexOf(player);
      if (ci !== -1) ch.splice(ci, 1);
      return { checkers: ch };
    }
    if (i === to) return { checkers: [...p.checkers, player] };
    return p;
  });

  // Does the opponent have at least one checker in its own home board?
  const oppHome = (opp === 'black')
    ? sim.slice(HOME_MIN.black, HOME_MAX.black + 1).some(p => p.checkers.some(c => c === opp))
    : sim.slice(HOME_MIN.white, HOME_MAX.white + 1).some(p => p.checkers.some(c => c === opp));
  // If any opponent checker is in home, all primes are legal (rule exception)
  if (oppHome) return false;

  // Scan for any run of 6+ consecutive points occupied by `player`
  let consecutive = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (sim[i].checkers.some(c => c === player)) {
      consecutive++;
      if (consecutive >= 6) {
        const primeLo = i - consecutive + 1;
        // Check if any opponent checker has passed this prime
        const anyPast = state.points.some(
          (p, b) => p.checkers.some(c => c === opp) && opponentHasPassed(b, primeLo, opp)
        );
        if (!anyPast) return true; // Illegal prime — would trap all opponent checkers
      }
    } else {
      consecutive = 0;
    }
  }
  return false;
}

// ── public API ────────────────────────────────────────────────────────────────

export function createLongInitialGameState(): GameState {
  const points: Point[] = Array.from({ length: BOARD_SIZE }, () => ({ checkers: [] }));
  for (let i = 0; i < 15; i++) points[23].checkers.push('white'); // White head = point 24
  for (let i = 0; i < 15; i++) points[11].checkers.push('black'); // Black head = point 12
  return {
    points,
    bar: { white: 0, black: 0 },
    bearOff: { white: 0, black: 0 },
    dice: { values: [0, 0], remaining: [], rolled: false },
    currentPlayer: 'white',
    gamePhase: 'rolling',
    winner: null,
    moveHistory: [],
    turnNumber: 0,
  };
}

export function getLongValidMovesFromPoint(
  state: GameState,
  from: number,
  player: PlayerColor
): ValidMove[] {
  const moves: ValidMove[] = [];
  const usedDice = new Set<number>();
  const opp = opponent(player);

  // ── Head rule ──────────────────────────────────────────────────────────────
  if (from === HEAD[player]) {
    const headMoves = headMovesThisTurn(state, player);
    if (isFirstTurnForPlayer(state, player)) {
      // First throw exception: rolling 3-3, 4-4, or 6-6 allows max 2 from head
      const [d1, d2] = state.dice.values;
      const isSpecialDouble = d1 === d2 && [3, 4, 6].includes(d1);
      const limit = isSpecialDouble ? 2 : 1;
      if (headMoves >= limit) return [];
    } else {
      if (headMoves >= 1) return [];
    }
  }

  const inBearOff = canBearOffLong(state, player);
  const farthest = inBearOff ? getFarthestLong(state, player) : -1;

  for (const die of state.dice.remaining) {
    if (usedDice.has(die)) continue;
    usedDice.add(die);

    if (!isPathClearLong(state, from, die, player)) continue;

    if (player === 'white') {
      const to = from - die;
      if (to < 0) {
        // Bear-off
        if (inBearOff) {
          const exact = to === -1;
          if (exact || from === farthest) {
            moves.push({ from, to: 'bearoff', dieUsed: die, hitsBlot: false });
          }
        }
      } else if (!state.points[to].checkers.some(c => c === opp)) {
        if (!wouldCreateIllegal6Prime(state, from, to, player)) {
          moves.push({ from, to, dieUsed: die, hitsBlot: false });
        }
      }
    } else {
      // Black (with wrap)
      const rawTo = from - die;
      const fromInHome = from >= HOME_MIN.black;

      if (fromInHome) {
        if (rawTo < HOME_MIN.black) {
          // Bear-off
          if (inBearOff) {
            const exact = rawTo === HOME_MIN.black - 1; // = 11
            if (exact || from === farthest) {
              moves.push({ from, to: 'bearoff', dieUsed: die, hitsBlot: false });
            }
          }
        } else if (!state.points[rawTo].checkers.some(c => c === opp)) {
          if (!wouldCreateIllegal6Prime(state, from, rawTo, player)) {
            moves.push({ from, to: rawTo, dieUsed: die, hitsBlot: false });
          }
        }
      } else {
        // Non-home: wrap if needed
        const to = rawTo < 0 ? rawTo + 24 : rawTo;
        if (!state.points[to].checkers.some(c => c === opp)) {
          if (!wouldCreateIllegal6Prime(state, from, to, player)) {
            moves.push({ from, to, dieUsed: die, hitsBlot: false });
          }
        }
      }
    }
  }

  return moves;
}

/** Simulate a single move on a cloned state (for mandatory-move look-ahead). */
function simulateMoveForLookAhead(
  state: GameState,
  player: PlayerColor,
  move: ValidMove,
  nextDie: number
): GameState {
  const sim = deepCloneState(state);
  // Remove checker from source
  const srcIdx = move.from as number;
  const ci = sim.points[srcIdx].checkers.lastIndexOf(player);
  if (ci !== -1) sim.points[srcIdx].checkers.splice(ci, 1);
  // Place at destination
  if (move.to === 'bearoff') {
    sim.bearOff[player]++;
  } else {
    sim.points[move.to as number].checkers.push(player);
  }
  // Record move so head-rule tracking works correctly
  sim.moveHistory.push({
    from: move.from, to: move.to, player,
    hitBlot: false, dieUsed: move.dieUsed,
    turnNumber: sim.turnNumber,
  });
  // Set remaining dice to just the next die we want to check
  sim.dice = { ...sim.dice, remaining: [nextDie] };
  return sim;
}

/** Returns true if any of `moves` (using dieA) allows dieB to be played afterward. */
function anyMoveEnablesSecond(
  state: GameState,
  player: PlayerColor,
  moves: ValidMove[],
  nextDie: number
): boolean {
  for (const m of moves) {
    const sim = simulateMoveForLookAhead(state, player, m, nextDie);
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (sim.points[i].checkers.some(c => c === player)) {
        if (getLongValidMovesFromPoint(sim, i, player).length > 0) return true;
      }
    }
  }
  return false;
}

export function getAllLongValidMoves(state: GameState, player: PlayerColor): ValidMove[] {
  const allMoves: ValidMove[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.points[i].checkers.some(c => c === player)) {
      allMoves.push(...getLongValidMovesFromPoint(state, i, player));
    }
  }

  if (allMoves.length === 0) return [];

  // Mandatory-move rule only applies when exactly 2 different dice remain
  if (state.dice.remaining.length !== 2) return allMoves;
  const [d1, d2] = state.dice.remaining;
  if (d1 === d2) return allMoves; // doubles: all four dice same value, no filtering needed

  const movesD1 = allMoves.filter(m => m.dieUsed === d1);
  const movesD2 = allMoves.filter(m => m.dieUsed === d2);

  // If only one die has valid moves, that die must be played
  if (movesD1.length === 0) return movesD2;
  if (movesD2.length === 0) return movesD1;

  // Both dice have moves — check if both can be sequenced
  const canD1ThenD2 = anyMoveEnablesSecond(state, player, movesD1, d2);
  const canD2ThenD1 = anyMoveEnablesSecond(state, player, movesD2, d1);

  if (canD1ThenD2 || canD2ThenD1) {
    // Both dice can be used — player may choose any order, show all moves
    return allMoves;
  }

  // Only one die can ultimately be used — must play the higher one
  const higherDie = Math.max(d1, d2);
  const higherMoves = allMoves.filter(m => m.dieUsed === higherDie);
  return higherMoves.length > 0 ? higherMoves : allMoves;
}

export function getLongValidDestinations(state: GameState, from: number | 'bar'): ValidMove[] {
  if (!state.dice.rolled || state.gamePhase !== 'moving') return [];
  if (from === 'bar') return []; // no bar in long backgammon
  // Filter from the full valid-move set so mandatory-move rule is respected
  const allMoves = getAllLongValidMoves(state, state.currentPlayer);
  return allMoves.filter(m => m.from === from);
}

export function applyLongMove(state: GameState, move: ValidMove): GameState {
  const newState = deepCloneState(state);
  const player = newState.currentPlayer;
  const opp = opponent(player);

  // Remove checker from source
  const srcIdx = move.from as number;
  const ci = newState.points[srcIdx].checkers.lastIndexOf(player);
  if (ci !== -1) newState.points[srcIdx].checkers.splice(ci, 1);

  // Place at destination
  if (move.to === 'bearoff') {
    newState.bearOff[player]++;
  } else {
    newState.points[move.to as number].checkers.push(player);
  }

  // Consume die
  const di = newState.dice.remaining.indexOf(move.dieUsed);
  if (di !== -1) newState.dice.remaining.splice(di, 1);

  // Record move (needed for head-rule tracking)
  newState.moveHistory.push({
    from: move.from,
    to: move.to,
    player,
    hitBlot: false,
    dieUsed: move.dieUsed,
    turnNumber: newState.turnNumber,
  });

  // Check win
  if (newState.bearOff[player] === 15) {
    newState.gamePhase = 'game_over';
    newState.winner = player;
    return newState;
  }

  // End turn when no dice left or no legal moves remain
  const remaining = getAllLongValidMoves(newState, player);
  if (newState.dice.remaining.length === 0 || remaining.length === 0) {
    newState.currentPlayer = opp;
    newState.turnNumber++;
    newState.dice = { values: [0, 0], remaining: [], rolled: false };
    newState.gamePhase = 'rolling';
  } else {
    newState.gamePhase = 'moving';
  }

  return newState;
}

export function applyLongDiceRoll(state: GameState, d1: number, d2: number): GameState {
  const newState = deepCloneState(state);
  newState.dice = {
    values: [d1, d2],
    remaining: getDiceRemaining(d1, d2),
    rolled: true,
  };
  newState.gamePhase = 'moving';

  const moves = getAllLongValidMoves(newState, newState.currentPlayer);
  if (moves.length === 0) {
    // No legal moves — skip turn
    newState.currentPlayer = opponent(newState.currentPlayer);
    newState.turnNumber++;
    newState.dice = { values: [d1, d2], remaining: [], rolled: false };
    newState.gamePhase = 'rolling';
  }

  return newState;
}

/** Points blocked for `player` (opponent has ≥1 checker → cannot land there). */
export function getBlockedPoints(state: GameState, player: PlayerColor): Set<number> {
  const opp = opponent(player);
  const blocked = new Set<number>();
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.points[i].checkers.some(c => c === opp)) blocked.add(i);
  }
  return blocked;
}
