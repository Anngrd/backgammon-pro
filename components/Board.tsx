'use client';

import { GameState, PlayerColor, ValidMove } from '@/types/game';
import { Checker } from './Checker';

interface BoardProps {
  gameState: GameState;
  selectedPoint: number | 'bar' | null;
  validMoves: ValidMove[];
  onPointClick: (index: number | 'bar') => void;
  darkMode?: boolean;
  longMode?: boolean;
  isFlipped?: boolean;
  revealedPoints?: Set<number | 'bar'>;
  playerColor: PlayerColor;
}

const BOARD_BG = 'from-amber-900 via-amber-800 to-amber-900';
const FELT_COLOR = '#1a6b3e';

// ── Point triangle ────────────────────────────────────────────────────────────

function PointTriangle({
  index,
  isTop,
  checkers,
  isSelected,
  isValidDest,
  onClick,
  darkMode,
  revealed,
  blockedByOpponent,
}: {
  index: number;
  isTop: boolean;
  checkers: PlayerColor[];
  isSelected: boolean;
  isValidDest: boolean;
  onClick: () => void;
  darkMode: boolean;
  revealed: boolean;
  playerColor: PlayerColor;
  blockedByOpponent?: boolean;
}) {
  const isDark = index % 2 === 1;
  const pointColor = blockedByOpponent
    ? (isDark ? '#7b1a1a' : '#c0392b')
    : (isDark ? '#c0392b' : '#f39c12');

  const count = checkers.length;

  // Dynamic checker size — shrinks when many checkers are stacked
  const checkerSize =
    count <= 4 ? 34 :
    count <= 7 ? 28 :
    count <= 10 ? 22 : 18;

  // Available height for stacking (inside the triangle visual area)
  const availHeight = 140;
  const spacing =
    count <= 1
      ? 0
      : Math.min(checkerSize + 1, Math.floor((availHeight - checkerSize) / (count - 1)));

  return (
    <div
      className="relative flex-1 cursor-pointer select-none"
      style={{
        height: 200,
        minWidth: 0,
        outline: blockedByOpponent ? '2px solid rgba(239,68,68,0.55)' : 'none',
        borderRadius: 2,
      }}
      onClick={onClick}
    >
      {/* Triangle — clip-path scales with container width automatically */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isSelected ? '#2ecc71' : pointColor,
          clipPath: isTop
            ? 'polygon(0 0, 100% 0, 50% 86%)'
            : 'polygon(50% 14%, 0 100%, 100% 100%)',
          opacity: isSelected ? 0.92 : 0.82,
          transition: 'background 0.12s ease',
        }}
      />

      {/* Valid destination indicator — triangle tip (opposite end from checkers) */}
      {isValidDest && (
        <div
          className="absolute z-20 rounded-full border-4 border-green-400 bg-green-400/30 animate-pulse pointer-events-none"
          style={{
            width: 22, height: 22,
            left: '50%', transform: 'translateX(-50%)',
            top: isTop ? 'auto' : 10,
            bottom: isTop ? 10 : 'auto',
          }}
        />
      )}

      {/* Checkers — absolutely positioned, overlapping for large stacks */}
      {checkers.map((color, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            [isTop ? 'top' : 'bottom']: `${3 + i * spacing}px`,
            zIndex: isTop ? count - i + 10 : i + 11,
          }}
        >
          <Checker color={color} size={checkerSize} dimmed={darkMode} revealed={revealed} />
        </div>
      ))}

      {/* Point number label — inside the triangle, near the tip */}
      <div
        className="absolute text-white/50 text-[10px] font-mono pointer-events-none select-none"
        style={{
          left: 0, right: 0, textAlign: 'center',
          top: isTop ? 'auto' : 3,
          bottom: isTop ? 3 : 'auto',
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}

// ── Bar area ─────────────────────────────────────────────────────────────────

function BarArea({
  whiteCount,
  blackCount,
  isSelected,
  isValidDest,
  onClick,
}: {
  whiteCount: number;
  blackCount: number;
  isSelected: boolean;
  isValidDest: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex-shrink-0 w-10 flex flex-col items-center justify-center gap-1 cursor-pointer rounded ${
        isSelected ? 'ring-2 ring-green-400' : ''
      } ${isValidDest ? 'bg-green-400/20' : 'bg-amber-950/50'}`}
      onClick={onClick}
    >
      {isValidDest && (
        <div className="w-6 h-6 rounded-full border-4 border-green-400 bg-green-400/30 animate-pulse" />
      )}
      {whiteCount > 0 && (
        <div className="flex flex-col gap-0.5 items-center">
          {Array.from({ length: Math.min(whiteCount, 3) }).map((_, i) => (
            <Checker key={i} color="white" size={28} />
          ))}
          {whiteCount > 3 && <span className="text-white text-[10px] font-bold">+{whiteCount - 3}</span>}
        </div>
      )}
      {blackCount > 0 && (
        <div className="flex flex-col gap-0.5 items-center">
          {Array.from({ length: Math.min(blackCount, 3) }).map((_, i) => (
            <Checker key={i} color="black" size={28} />
          ))}
          {blackCount > 3 && <span className="text-white text-[10px] font-bold">+{blackCount - 3}</span>}
        </div>
      )}
      <span className="text-white/40 text-[9px] mt-0.5">BAR</span>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function Board({
  gameState,
  selectedPoint,
  validMoves,
  onPointClick,
  darkMode = false,
  longMode = false,
  isFlipped = false,
  revealedPoints,
  playerColor,
}: BoardProps) {
  const { points, bar } = gameState;
  const validDestinations = new Set(validMoves.map(m => m.to));

  // In long mode: mark points occupied by the human player's opponent
  // (always shown from player's perspective, not from currentPlayer's).
  const playerOpp = playerColor === 'white' ? 'black' : 'white';
  const blockedPoints = longMode
    ? new Set(
        points
          .map((p, i) => ({ i, p }))
          .filter(({ p }) => p.checkers.some(c => c === playerOpp))
          .map(({ i }) => i)
      )
    : new Set<number>();

  // Board orientation:
  //   Normal  (white / non-flipped): top = 12→23  bottom = 11→0
  //   Flipped (black / online guest): top = 11→0  bottom = 12→23
  const topPoints = isFlipped
    ? Array.from({ length: 12 }, (_, i) => 11 - i)   // [11,10,…,0]
    : Array.from({ length: 12 }, (_, i) => 12 + i);  // [12,13,…,23]
  const bottomPoints = isFlipped
    ? Array.from({ length: 12 }, (_, i) => 12 + i)   // [12,13,…,23]
    : Array.from({ length: 12 }, (_, i) => 11 - i);  // [11,10,…,0]

  const isBarSelected = selectedPoint === 'bar';

  const renderHalf = (indices: number[], isTop: boolean) =>
    indices.map(idx => (
      <PointTriangle
        key={idx}
        index={idx}
        isTop={isTop}
        checkers={points[idx].checkers}
        isSelected={selectedPoint === idx}
        isValidDest={validDestinations.has(idx)}
        onClick={() => onPointClick(idx)}
        darkMode={darkMode}
        revealed={revealedPoints?.has(idx) ?? false}
        playerColor={playerColor}
        blockedByOpponent={blockedPoints.has(idx)}
      />
    ));

  return (
    <div
      className={`w-full rounded-xl shadow-2xl bg-gradient-to-r ${BOARD_BG}`}
      style={{ padding: 10 }}
    >
      {/* Wood frame / felt surface */}
      <div
        className="rounded-lg w-full"
        style={{ background: FELT_COLOR, padding: 3 }}
      >
        <div
          className="flex flex-row w-full"
          style={{ background: FELT_COLOR, borderRadius: 6, minHeight: 440 }}
        >
          {/* ── Left half ─────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Top-left row */}
            <div className="flex flex-row pt-1 px-0.5 gap-px">
              {renderHalf(topPoints.slice(0, 6), true)}
            </div>
            {/* Spacer */}
            <div className="flex-1" />
            {/* Bottom-left row */}
            <div className="flex flex-row pb-1 px-0.5 gap-px">
              {renderHalf(bottomPoints.slice(0, 6), false)}
            </div>
          </div>

          {/* ── Bar (hidden in long mode) ──────────────────────────── */}
          {!longMode && (
            <BarArea
              whiteCount={bar.white}
              blackCount={bar.black}
              isSelected={isBarSelected}
              isValidDest={false}
              onClick={() => onPointClick('bar')}
            />
          )}

          {/* ── Right half ────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Top-right row */}
            <div className="flex flex-row pt-1 px-0.5 gap-px">
              {renderHalf(topPoints.slice(6), true)}
            </div>
            {/* Spacer */}
            <div className="flex-1" />
            {/* Bottom-right row */}
            <div className="flex flex-row pb-1 px-0.5 gap-px">
              {renderHalf(bottomPoints.slice(6), false)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
