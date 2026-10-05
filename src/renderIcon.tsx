import type { ReactNode } from 'react';
import type { IconSpec } from './types';

/** Draws an icon given as an element, or as a function/component taking size and color. */
export function renderIcon(
  spec: IconSpec | undefined,
  size: number,
  color: string
): ReactNode {
  if (typeof spec === 'function') {
    const Icon = spec as (p: { size: number; color: string }) => ReactNode;
    return <Icon size={size} color={color} />;
  }
  return spec ?? null;
}
