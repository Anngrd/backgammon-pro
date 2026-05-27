import { GameState, PlayerColor, Point, Move, ValidMove, DiceState } from '@/types/game';

// Point indices: 0-23
// White moves: from point 23 down to 0 (bearing off at <0)
// Black moves: from point 0 up to 23 (bearing off at >23)
// White home board: points 0-5 (indices 0-5)
// Black home board: points 18-23 (indices 18-23)

export const BOARD_SIZE = 24;

export function createInitialGameState(): GameState {
  const points: Point[] = Array.from({ length: BOARD_SIZE }, () => ({ checkers: [] }));

  // Standard backgammon setup
  // White checkers (moves from 23 toward 0)
  addCheckers(points, 23, 'white', 2);
  addCheckers(points, 12, 'white', 5);
  addCheckers(points, 7, 'white', 3);
  addCheckers(points, 5, 'white', 5);

  // Black checkers (moves from 0 toward 23)
  addCheckers(points, 0, 'black', 2);
  addCheckers(points, 11, 'black', 5);
  addCheckers(points, 16, 'black', 3);
  addCheckers(points, 18, 'black', 5);

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

function addCheckers(points: Point[], index: number, color: PlayerColor, count: number) {
  for (let i = 0; i < count; i++) {
    points[index].checkers.push(color);
  }
}

export function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

export function getDiceRemaining(d1: number, d2: number): number[] {
  if (d1 === d2) return [d1, d1, d1, d1];
  return [d1, d2];
}

export function opponent(player: PlayerColor): PlayerColor {
  return player === 'white' ? 'black' : 'white';
}

// Direction of movement: white moves toward lower indices, black toward higher
export function moveDirection(player: PlayerColor): number {
  return player === 'white' ? -1 : 1;
}

export function getPointIndex(player: PlayerColor, from: number, die: number): number {
  return from + die * moveDirection(player);
}

// Check if player can bear off (all checkers in home board or already borne off)
export function canBearOff(state: GameState, player: PlayerColor): boolean {
  const totalOnBoard = countCheckersOnBoard(state, player);
  const homeBoardCount = countCheckersInHomeBoard(state, player);
  const onBar = state.bar[player];
  return onBar === 0 && homeBoardCount === totalOnBoard;
}

export function countCheckersOnBoard(state: GameState, player: PlayerColor): number {
  return state.points.reduce((acc, p) => {
    return acc + p.checkers.filter(c => c === player).length;
  }, 0);
}

export function countCheckersInHomeBoard(state: GameState, player: PlayerColor): number {
  const homeRange = player === 'white' ? [0, 5] : [18, 23];
  let count = 0;
  for (let i = homeRange[0]; i <= homeRange[1]; i++) {
    count += state.points[i].checkers.filter(c => c === player).length;
  }
  return count;
}

// Get the farthest checker from home for bearing off
export function getFarthestCheckerIndex(state: GameState, player: PlayerColor): number {
  if (player === 'white') {
    for (let i = 5; i >= 0; i--) {
      if (state.points[i].checkers.some(c => c === 'white')) return i;
    }
  } else {
    for (let i = 18; i <= 23; i++) {
      if (state.points[i].checkers.some(c => c === 'black')) return i;
    }
  }
  return -1;
}

export function getValidMovesFromPoint(
  state: GameState,
  from: number | 'bar',
  player: PlayerColor
): ValidMove[] {
  const moves: ValidMove[] = [];
  const usedDice = new Set<number>();

  for (const die of state.dice.remaining) {
    if (usedDice.has(die)) continue;
    usedDice.add(die);

    if (from === 'bar') {
      // Must enter from bar
      const entryIndex = player === 'white' ? 24 - die : die - 1;
      if (entryIndex >= 0 && entryIndex < BOARD_SIZE) {
        const point = state.points[entryIndex];
        const opponentCheckers = point.checkers.filter(c => c !== player);
        if (opponentCheckers.length <= 1) {
          moves.push({
            from: 'bar',
            to: entryIndex,
            dieUsed: die,
            hitsBlot: opponentCheckers.length === 1,
          });
        }
      }
    } else {
      const to = getPointIndex(player, from, die);

      // Check bear off
      if (canBearOff(state, player)) {
        const isExactBearOff = player === 'white' ? to < 0 : to >= BOARD_SIZE;
        const isOvershootBearOff = player === 'white'
          ? to < 0 && getFarthestCheckerIndex(state, player) === from
          : to >= BOARD_SIZE && getFarthestCheckerIndex(state, player) === from;

        if (player === 'white' && to < 0) {
          // Exact: to === -die (from - die < 0, meaning from < die)
          // Overshoot: only valid if from is the farthest
          const farthest = getFarthestCheckerIndex(state, player);
          if (to === -1 || (to < -1 && farthest === from)) {
            moves.push({ from, to: 'bearoff', dieUsed: die, hitsBlot: false });
          }
          continue;
        } else if (player === 'black' && to >= BOARD_SIZE) {
          const farthest = getFarthestCheckerIndex(state, player);
          if (to === BOARD_SIZE || (to > BOARD_SIZE && farthest === from)) {
            moves.push({ from, to: 'bearoff', dieUsed: die, hitsBlot: false });
          }
          continue;
        }
      }

      if (to < 0 || to >= BOARD_SIZE) continue;

      const point = state.points[to];
      const opponentCheckers = point.checkers.filter(c => c !== player);

      if (opponentCheckers.length <= 1) {
        moves.push({
          from,
          to,
          dieUsed: die,
          hitsBlot: opponentCheckers.length === 1,
        });
      }
    }
  }

  return moves;
}

export function getAllValidMoves(state: GameState, player: PlayerColor): ValidMove[] {
  const allMoves: ValidMove[] = [];

  // If player has checkers on bar, must move from bar first
  if (state.bar[player] > 0) {
    return getValidMovesFromPoint(state, 'bar', player);
  }

  // Get moves from all points
  for (let i = 0; i < BOARD_SIZE; i++) {
    const point = state.points[i];
    if (point.checkers.some(c => c === player)) {
      const moves = getValidMovesFromPoint(state, i, player);
      allMoves.push(...moves);
    }
  }

  return allMoves;
}

export function applyMove(state: GameState, move: ValidMove): GameState {
  const newState = deepCloneState(state);
  const player = newState.currentPlayer;
  const opp = opponent(player);

  // Remove checker from source
  if (move.from === 'bar') {
    newState.bar[player] = Math.max(0, newState.bar[player] - 1);
  } else {
    const idx = newState.points[move.from].checkers.lastIndexOf(player);
    if (idx !== -1) newState.points[move.from].checkers.splice(idx, 1);
  }

  // Apply to destination
  if (move.to === 'bearoff') {
    newState.bearOff[player]++;
  } else {
    const destPoint = newState.points[move.to];

    // Hit a blot
    if (move.hitsBlot) {
      const blotIdx = destPoint.checkers.lastIndexOf(opp);
      if (blotIdx !== -1) destPoint.checkers.splice(blotIdx, 1);
      newState.bar[opp]++;
    }

    destPoint.checkers.push(player);
  }

  // Remove used die
  const dieIdx = newState.dice.remaining.indexOf(move.dieUsed);
  if (dieIdx !== -1) newState.dice.remaining.splice(dieIdx, 1);

  // Record move
  const recordedMove: Move = {
    from: move.from,
    to: move.to,
    player,
    hitBlot: move.hitsBlot,
    dieUsed: move.dieUsed,
    turnNumber: newState.turnNumber,
  };
  newState.moveHistory.push(recordedMove);

  // Check win
  if (newState.bearOff[player] === 15) {
    newState.gamePhase = 'game_over';
    newState.winner = player;
    return newState;
  }

  // Check if turn is over
  const remainingMoves = getAllValidMoves(newState, player);
  if (newState.dice.remaining.length === 0 || remainingMoves.length === 0) {
    // End turn
    newState.currentPlayer = opp;
    newState.turnNumber++;
    newState.dice = { values: [0, 0], remaining: [], rolled: false };
    newState.gamePhase = 'rolling';
  } else {
    newState.gamePhase = 'moving';
  }

  return newState;
}

export function applyDiceRoll(state: GameState, d1: number, d2: number): GameState {
  const newState = deepCloneState(state);
  newState.dice = {
    values: [d1, d2],
    remaining: getDiceRemaining(d1, d2),
    rolled: true,
  };
  newState.gamePhase = 'moving';

  // If no moves available, skip turn
  const moves = getAllValidMoves(newState, newState.currentPlayer);
  if (moves.length === 0) {
    newState.currentPlayer = opponent(newState.currentPlayer);
    newState.turnNumber++;
    newState.dice = { values: [d1, d2], remaining: [], rolled: false };
    newState.gamePhase = 'rolling';
  }

  return newState;
}

export function getValidDestinations(state: GameState, from: number | 'bar'): ValidMove[] {
  if (!state.dice.rolled || state.gamePhase !== 'moving') return [];
  return getValidMovesFromPoint(state, from, state.currentPlayer);
}

export function deepCloneState(state: GameState): GameState {
  return {
    points: state.points.map(p => ({ checkers: [...p.checkers] })),
    bar: { ...state.bar },
    bearOff: { ...state.bearOff },
    dice: {
      values: [...state.dice.values] as [number, number],
      remaining: [...state.dice.remaining],
      rolled: state.dice.rolled,
    },
    currentPlayer: state.currentPlayer,
    gamePhase: state.gamePhase,
    winner: state.winner,
    moveHistory: state.moveHistory.map(m => ({ ...m })),
    turnNumber: state.turnNumber,
  };
}

// Check if a specific point has a checker for the current player
export function hasPlayerChecker(state: GameState, pointIndex: number): boolean {
  return state.points[pointIndex].checkers.some(c => c === state.currentPlayer);
}

// Point pip count (for pip counting)
export function getPipCount(state: GameState, player: PlayerColor): number {
  let count = 0;
  if (player === 'white') {
    for (let i = 0; i < BOARD_SIZE; i++) {
      const dist = i + 1; // distance to bear off for white (from point 1..24)
      count += state.points[i].checkers.filter(c => c === 'white').length * dist;
    }
    count += state.bar.white * 25;
  } else {
    for (let i = 0; i < BOARD_SIZE; i++) {
      const dist = BOARD_SIZE - i; // distance to bear off for black
      count += state.points[i].checkers.filter(c => c === 'black').length * dist;
    }
    count += state.bar.black * 25;
  }
  return count;
}
