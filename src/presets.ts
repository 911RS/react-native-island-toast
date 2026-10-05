import type { IslandMotion, PresetName } from './types';

const spring = (damping: number, stiffness: number, mass: number) =>
  ({ type: 'spring', damping, stiffness, mass }) as const;

export const PRESETS: Record<PresetName, Partial<IslandMotion>> = {
  snappy: {
    heroHoldMs: 500,
    readMs: 1300,
    open: spring(22, 320, 0.8),
    morph: spring(22, 320, 0.8),
  },
  calm: {
    heroHoldMs: 1200,
    readMs: 2400,
    open: spring(20, 140, 1),
    morph: spring(20, 140, 1),
  },
  bouncy: {
    open: spring(11, 220, 0.9),
    morph: spring(11, 220, 0.9),
  },
  minimal: { hero: false },
};
