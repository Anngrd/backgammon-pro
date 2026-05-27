'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface DiceDisplayProps {
  values: [number, number];
  remaining: number[];
  rolled: boolean;
}

function DieFace({ value, used }: { value: number; used: boolean }) {
  const dots = getDotPositions(value);
  return (
    <motion.div
      initial={{ rotateX: -180, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
        used
          ? 'bg-gray-400 border-gray-500 opacity-40'
          : 'bg-white border-gray-300 shadow-lg'
      }`}
    >
      <div className="grid grid-cols-3 gap-0.5 w-9 h-9">
        {dots.map((active, i) => (
          <div key={i} className="flex items-center justify-center">
            {active && (
              <div className={`w-2 h-2 rounded-full ${used ? 'bg-gray-500' : 'bg-gray-800'}`} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function getDotPositions(value: number): boolean[] {
  // 3x3 grid positions
  const patterns: Record<number, boolean[]> = {
    1: [false, false, false, false, true, false, false, false, false],
    2: [true,  false, false, false, false, false, false, false, true],
    3: [true,  false, false, false, true,  false, false, false, true],
    4: [true,  false, true,  false, false, false, true,  false, true],
    5: [true,  false, true,  false, true,  false, true,  false, true],
    6: [true,  false, true,  true,  false, true,  true,  false, true],
  };
  return patterns[value] || patterns[1];
}

export function DiceDisplay({ values, remaining, rolled }: DiceDisplayProps) {
  if (!rolled) return null;

  // For doubles, show 4 dice
  const isDoubles = values[0] === values[1];
  const diceToShow = isDoubles ? [values[0], values[0], values[0], values[0]] : [values[0], values[1]];
  const usedCount = diceToShow.length - remaining.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex gap-2 items-center"
      >
        {diceToShow.map((val, i) => (
          <DieFace key={i} value={val} used={i < usedCount} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
