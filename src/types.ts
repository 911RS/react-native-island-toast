import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

export type IslandType =
  'success' | 'error' | 'info' | 'loading' | (string & {});

/** A ready element, or a function that draws the icon at the given size and color. */
export type IconSpec =
  ReactNode | ((p: { size: number; color: string }) => ReactNode);

export interface IslandAction {
  label: string;
  /** Shown alone when set; the label stays for screen readers. */
  icon?: IconSpec;
  onPress: () => void;
}

export type Curve =
  | { type: 'spring'; damping: number; stiffness: number; mass: number }
  | { type: 'timing'; duration: number; easing?: (t: number) => number };

export interface IslandTheme {
  background: string;
  border: string;
  title: string;
  body: string;
  accent: string;
  iconDisc: string;
  actionBackground: string;
  actionText: string;
  pillWidth: number;
  pillHeight: number;
  heroSize: number;
  heroIconSize: number;
  iconSize: number;
  maxWidth: number;
  maxWidthRatio: number;
  radius: number;
  heroRadius: number;
  shadow: ViewStyle;
  /** Font for all text (Latin and other scripts). */
  fontFamily?: string;
  /** Font for the title, e.g. the bold file of a custom font. Falls back to fontFamily. */
  titleFontFamily?: string;
  /** Font for text that contains Arabic letters. Falls back to fontFamily. */
  arabicFontFamily?: string;
  /** Title font for text that contains Arabic letters. Falls back to arabicFontFamily. */
  arabicTitleFontFamily?: string;
  titleStyle?: TextStyle;
  bodyStyle?: TextStyle;
  icon?: IconSpec;
  heroIcon?: IconSpec;
}

export interface IslandMotion {
  hero: boolean;
  heroHoldMs: number;
  readMs: number;
  readWithActionMs: number;
  open: Curve;
  morph: Curve;
  reducedMotion: 'system' | 'always' | 'never';
}

export interface SlotProps {
  message: IslandMessage;
  theme: IslandTheme;
  dismiss: () => void;
}
export type Slot = (p: SlotProps) => ReactNode;

export interface IslandSlots {
  renderIcon?: Slot;
  renderTitle?: Slot;
  renderBody?: Slot;
  renderAction?: Slot;
  renderContent?: Slot;
}

export type QueueMode = 'replace-latest' | 'queue-all' | 'replace-now';
export type PresetName = 'snappy' | 'calm' | 'bouncy' | 'minimal';

export interface TypeTheme {
  light?: Partial<IslandTheme>;
  dark?: Partial<IslandTheme>;
}

export interface IslandConfig extends IslandSlots {
  theme: Partial<IslandTheme>;
  darkTheme: Partial<IslandTheme>;
  types: Record<string, TypeTheme>;
  colorScheme: 'auto' | 'light' | 'dark';
  motion: Partial<IslandMotion>;
  preset?: PresetName;
  queue: QueueMode;
  position: 'top' | 'bottom';
  offset: number;
  tapToDismiss: boolean;
  swipeToDismiss: boolean;
  direction?: 'ltr' | 'rtl';
  /** Screen reader hint for tapping the island. Default: 'Dismiss'. */
  accessibilityHint?: string;
  haptics?: (type: IslandType) => void;
  sound?: (type: IslandType) => void;
  onShow?: (m: IslandMessage) => void;
  onHide?: (m: IslandMessage) => void;
}

export interface IslandOptions extends IslandSlots {
  body?: string;
  icon?: IconSpec;
  heroIcon?: IconSpec;
  action?: IslandAction;
  /** Reading time in ms, replacing the motion's readMs. Infinity keeps it until dismissed. */
  duration?: number;
  hero?: boolean;
  theme?: Partial<IslandTheme>;
  motion?: Partial<IslandMotion>;
  /** false skips the haptics and sound hooks for this message. */
  haptic?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  accessibilityLabel?: string;
}

export interface IslandMessage extends IslandOptions {
  id: number;
  type: IslandType;
  title: string;
}
