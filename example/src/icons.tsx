import { Text } from 'react-native';

/** Emoji and glyph icons, so the example needs no icon library. */
export const glyph =
  (char: string) =>
  ({ size, color }: { size: number; color: string }) => (
    <Text style={{ fontSize: size * 0.9, lineHeight: size * 1.1, color }}>
      {char}
    </Text>
  );

export const emoji =
  (char: string) =>
  ({ size }: { size: number }) => (
    <Text style={{ fontSize: size * 0.8, lineHeight: size }}>{char}</Text>
  );

export const UndoIcon = glyph('↶');
export const UploadIcon = glyph('↑');
