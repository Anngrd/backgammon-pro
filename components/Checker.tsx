'use client';

import { motion } from 'framer-motion';
import { PlayerColor } from '@/types/game';

interface CheckerProps {
  color: PlayerColor;
  size?: number;
  dimmed?: boolean; // dark mode invisible effect
  revealed?: boolean;
}

export function Checker({ color, size = 36, dimmed = false, revealed = false }: CheckerProps) {
  const isWhite = color === 'white';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: dimmed && !revealed ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ width: size, height: size }}
      className="relative flex-shrink-0"
    >
      {/* Shadow/base */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: isWhite
            ? 'radial-gradient(circle at 35% 35%, #ffffff, #c8c8c8)'
            : 'radial-gradient(circle at 35% 35%, #555555, #1a1a1a)',
          boxShadow: isWhite
            ? '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.8)'
            : '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)',
          border: isWhite ? '1.5px solid #aaa' : '1.5px solid #333',
        }}
      />
      {/* Inner ring detail */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '20%',
          border: isWhite ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px solid rgba(255,255,255,0.1)',
        }}
      />
    </motion.div>
  );
}
