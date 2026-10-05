import type {
  IslandConfig,
  PresetName,
  QueueMode,
} from 'react-native-island-toast';

export type Look = 'dark' | 'light';

export interface Settings {
  preset?: PresetName;
  queue: QueueMode;
  position: 'top' | 'bottom';
  tapToDismiss: boolean;
  swipeToDismiss: boolean;
  direction?: 'ltr' | 'rtl';
  accent?: string;
  radius: number;
  heroSize: number;
  look: Look;
  fonts: 'system' | 'custom';
}

export const DEFAULT_SETTINGS: Settings = {
  queue: 'replace-latest',
  position: 'top',
  tapToDismiss: true,
  swipeToDismiss: true,
  radius: 22,
  heroSize: 116,
  look: 'dark',
  fonts: 'system',
};

export type SetSettings = (patch: Partial<Settings>) => void;

const CUSTOM_FONTS = {
  fontFamily: 'SpaceGrotesk_400Regular',
  titleFontFamily: 'SpaceGrotesk_700Bold',
  arabicFontFamily: 'Cairo_400Regular',
  arabicTitleFontFamily: 'Cairo_700Bold',
};

const LIGHT = {
  background: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  title: '#111114',
  body: 'rgba(17,17,20,0.6)',
  actionText: '#FFFFFF',
};

export function toConfig(s: Settings): Partial<IslandConfig> {
  return {
    preset: s.preset,
    queue: s.queue,
    position: s.position,
    tapToDismiss: s.tapToDismiss,
    swipeToDismiss: s.swipeToDismiss,
    direction: s.direction,
    colorScheme: 'light',
    theme: {
      ...(s.look === 'light' ? LIGHT : {}),
      ...(s.fonts === 'custom' ? CUSTOM_FONTS : {}),
      ...(s.accent ? { accent: s.accent } : {}),
      radius: s.radius,
      heroSize: s.heroSize,
    },
    types: {
      upload: { light: { accent: '#BF5AF2' } },
    },
  };
}
