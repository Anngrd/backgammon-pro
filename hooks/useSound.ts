'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'dice' | 'move' | 'hit' | 'win';

function createBeep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getCtx();
      switch (type) {
        case 'dice':
          // Rattling dice sound
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              createBeep(ctx, 200 + Math.random() * 400, 0.08, 'square', 0.15);
            }, i * 60);
          }
          break;
        case 'move':
          createBeep(ctx, 440, 0.12, 'sine', 0.2);
          break;
        case 'hit':
          createBeep(ctx, 220, 0.08, 'sawtooth', 0.25);
          setTimeout(() => createBeep(ctx, 180, 0.15, 'square', 0.2), 80);
          break;
        case 'win':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => createBeep(ctx, freq, 0.3, 'sine', 0.25), i * 150);
          });
          break;
      }
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  return { playSound };
}
