import { PRESETS } from './presets';
import type {
  IslandConfig,
  IslandMessage,
  IslandMotion,
  IslandTheme,
  IslandType,
} from './types';

export const TYPE_ACCENTS: Record<
  'success' | 'error' | 'info' | 'loading',
  string
> = {
  success: '#34C759',
  error: '#FF453A',
  info: '#0A84FF',
  loading: '#FFFFFF',
};

export const DEFAULT_THEME: IslandTheme = {
  background: '#0A0A0A',
  border: 'rgba(255,255,255,0.10)',
  title: '#FFFFFF',
  body: 'rgba(255,255,255,0.72)',
  accent: TYPE_ACCENTS.info,
  iconDisc: `${TYPE_ACCENTS.info}26`,
  actionBackground: TYPE_ACCENTS.info,
  actionText: '#0A0A0A',
  pillWidth: 120,
  pillHeight: 36,
  heroSize: 116,
  heroIconSize: 64,
  iconSize: 20,
  maxWidth: 560,
  maxWidthRatio: 0.95,
  radius: 22,
  heroRadius: 36,
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

export const DEFAULT_DARK: Partial<IslandTheme> = {
  border: 'rgba(255,255,255,0.20)',
};

export const DEFAULT_MOTION: IslandMotion = {
  hero: true,
  heroHoldMs: 900,
  readMs: 1600,
  readWithActionMs: 3500,
  open: { type: 'spring', damping: 17, stiffness: 210, mass: 0.9 },
  morph: { type: 'spring', damping: 17, stiffness: 210, mass: 0.9 },
  reducedMotion: 'system',
};

export const DEFAULT_CONFIG: IslandConfig = {
  theme: {},
  darkTheme: {},
  types: {},
  colorScheme: 'auto',
  motion: {},
  queue: 'replace-latest',
  position: 'top',
  offset: 0,
  tapToDismiss: true,
  swipeToDismiss: true,
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype;

export function deepMerge<T>(base: T, ...over: (Partial<T> | undefined)[]): T {
  let out: any = isPlainObject(base) ? { ...base } : base;
  for (const o of over) {
    if (!o) continue;
    for (const [k, v] of Object.entries(o)) {
      if (v === undefined) continue;
      out[k] =
        isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
    }
  }
  return out as T;
}

const NEUTRAL_DISC = 'rgba(255,255,255,0.12)';

/** Adds a hex alpha to a #RGB or #RRGGBB color; undefined for any other color format. */
export function withAlpha(color: string, alpha: string): string | undefined {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color + alpha;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    const [r, g, b] = color.slice(1);
    return `#${r}${r}${g}${g}${b}${b}${alpha}`;
  }
  return undefined;
}

const accentFor = (type: IslandType) =>
  TYPE_ACCENTS[type as keyof typeof TYPE_ACCENTS] ?? TYPE_ACCENTS.info;

export function resolveTheme(
  config: IslandConfig,
  type: IslandType,
  dark: boolean,
  call?: Partial<IslandTheme>
): IslandTheme {
  const typeTheme = config.types[type];
  const layers: (Partial<IslandTheme> | undefined)[] = [
    dark ? DEFAULT_DARK : undefined,
    config.theme,
    dark ? config.darkTheme : undefined,
    typeTheme?.light,
    dark ? typeTheme?.dark : undefined,
    call,
  ];
  // The accent picked by a layer also colors the disc and action, unless a layer sets those itself.
  const merged = deepMerge(
    DEFAULT_THEME,
    { accent: accentFor(type) },
    ...layers
  );
  const setsOwn = (key: keyof IslandTheme) =>
    layers.some((l) => l?.[key] !== undefined);
  if (!setsOwn('iconDisc'))
    merged.iconDisc = withAlpha(merged.accent, '26') ?? NEUTRAL_DISC;
  if (!setsOwn('actionBackground')) merged.actionBackground = merged.accent;
  return merged;
}

export function resolveMotion(
  config: IslandConfig,
  call?: Partial<IslandMotion>
): IslandMotion {
  return deepMerge(
    DEFAULT_MOTION,
    config.preset ? PRESETS[config.preset] : undefined,
    config.motion,
    call
  );
}

/** Total time a message stays: opening hold + reading + closing. */
export function lifeMs(m: IslandMessage, motion: IslandMotion): number {
  const read =
    m.duration ?? (m.action ? motion.readWithActionMs : motion.readMs);
  return read + (motion.hero ? motion.heroHoldMs : 0) + 400;
}

const ARABIC =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** The font family for one line of text: Arabic fonts when it has Arabic letters, else the Latin ones. */
export function fontFor(
  text: string | undefined,
  theme: IslandTheme,
  role: 'title' | 'body'
): string | undefined {
  const latin =
    (role === 'title' ? theme.titleFontFamily : undefined) ?? theme.fontFamily;
  if (!text || !ARABIC.test(text)) return latin;
  return (
    (role === 'title' ? theme.arabicTitleFontFamily : undefined) ??
    theme.arabicFontFamily ??
    latin
  );
}
