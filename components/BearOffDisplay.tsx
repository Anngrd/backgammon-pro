'use client';

import { PlayerColor } from '@/types/game';
import { Checker } from './Checker';

interface BearOffDisplayProps {
  whiteCount: number;
  blackCount: number;
  isValidDest?: boolean;
}

export function BearOffDisplay({ whiteCount, blackCount, isValidDest }: BearOffDisplayProps) {
  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-xl border min-w-[80px] ${
        isValidDest
          ? 'border-green-400 bg-green-400/10 animate-pulse'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <div className="text-white/50 text-xs text-center font-semibold">BEAR OFF</div>
      <div className="flex flex-col gap-1 items-center">
        <div className="text-xs text-white/60">⚫ {blackCount}/15</div>
        <div className="flex flex-wrap gap-0.5 justify-center">
          {Array.from({ length: blackCount }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-gray-700 border border-gray-500" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1 items-center">
        <div className="text-xs text-white/60">⚪ {whiteCount}/15</div>
        <div className="flex flex-wrap gap-0.5 justify-center">
          {Array.from({ length: whiteCount }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />
          ))}
        </div>
      </div>
    </div>
  );
}
