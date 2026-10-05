import {
  DEFAULT_CONFIG,
  deepMerge,
  fontFor,
  withAlpha,
  lifeMs,
  resolveMotion,
  resolveTheme,
} from '../config';
import type { IslandMessage } from '../types';

const msg = (o: Partial<IslandMessage> = {}): IslandMessage => ({
  id: 1,
  type: 'success',
  title: 'Saved',
  ...o,
});

describe('deepMerge', () => {
  it('merges nested objects', () => {
    expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3 } } as any)).toEqual({
      a: { b: 1, c: 3 },
    });
  });
  it('replaces arrays instead of merging them', () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
  });
  it('ignores undefined values in overrides', () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
  });
  it('does not mutate the base', () => {
    const base = { a: { b: 1 } };
    deepMerge(base, { a: { b: 2 } });
    expect(base.a.b).toBe(1);
  });
});

describe('resolveTheme', () => {
  it('gives each built-in type its accent', () => {
    expect(resolveTheme(DEFAULT_CONFIG, 'success', false).accent).toBe(
      '#34C759'
    );
    expect(resolveTheme(DEFAULT_CONFIG, 'error', false).accent).toBe('#FF453A');
    expect(resolveTheme(DEFAULT_CONFIG, 'info', false).accent).toBe('#0A84FF');
  });
  it('falls back to the info accent for an unknown type', () => {
    expect(resolveTheme(DEFAULT_CONFIG, 'upload', false).accent).toBe(
      '#0A84FF'
    );
  });
  it('applies layers in order: config, type, call', () => {
    const config = {
      ...DEFAULT_CONFIG,
      theme: { accent: '#111111' },
      types: { success: { light: { accent: '#222222' } } },
    };
    expect(
      resolveTheme(config, 'success', false, { accent: '#333333' }).accent
    ).toBe('#333333');
    expect(resolveTheme(config, 'success', false).accent).toBe('#222222');
    expect(resolveTheme(config, 'error', false).accent).toBe('#111111');
  });
  it('uses the dark layers only in dark mode', () => {
    const config = { ...DEFAULT_CONFIG, darkTheme: { background: '#000000' } };
    expect(resolveTheme(config, 'info', true).background).toBe('#000000');
    expect(resolveTheme(config, 'info', false).background).toBe('#0A0A0A');
  });
  it('derives the icon disc and action colors from the accent', () => {
    const t = resolveTheme(DEFAULT_CONFIG, 'error', false);
    expect(t.iconDisc).toBe('#FF453A26');
    expect(t.actionBackground).toBe('#FF453A');
  });
});

describe('resolveMotion', () => {
  it('applies the preset', () => {
    expect(resolveMotion({ ...DEFAULT_CONFIG, preset: 'minimal' }).hero).toBe(
      false
    );
  });
  it('lets the call win over the preset', () => {
    expect(
      resolveMotion({ ...DEFAULT_CONFIG, preset: 'minimal' }, { hero: true })
        .hero
    ).toBe(true);
  });
  it('has the default timings', () => {
    const m = resolveMotion(DEFAULT_CONFIG);
    expect([m.heroHoldMs, m.readMs, m.readWithActionMs]).toEqual([
      900, 1600, 3500,
    ]);
  });
});

describe('lifeMs', () => {
  const motion = resolveMotion(DEFAULT_CONFIG);
  it('adds the hero hold and the closing to the reading time', () => {
    expect(lifeMs(msg(), motion)).toBe(2900);
  });
  it('reads longer with an action', () => {
    expect(
      lifeMs(msg({ action: { label: 'Undo', onPress: () => {} } }), motion)
    ).toBe(4800);
  });
  it('skips the hold without a hero', () => {
    expect(lifeMs(msg(), { ...motion, hero: false })).toBe(2000);
  });
  it('lets duration replace the reading time', () => {
    expect(lifeMs(msg({ duration: 5000 }), motion)).toBe(6300);
    expect(lifeMs(msg({ duration: Infinity }), motion)).toBe(Infinity);
  });
});

describe('fontFor', () => {
  const theme = {
    ...resolveTheme(DEFAULT_CONFIG, 'info', false),
    fontFamily: 'Inter',
    titleFontFamily: 'Inter-Bold',
    arabicFontFamily: 'Cairo',
    arabicTitleFontFamily: 'Cairo-Bold',
  };
  it('uses the Latin fonts for Latin text', () => {
    expect(fontFor('Order shipped', theme, 'title')).toBe('Inter-Bold');
    expect(fontFor('Arrives Friday', theme, 'body')).toBe('Inter');
  });
  it('uses the Arabic fonts when the text has Arabic letters', () => {
    expect(fontFor('تم الحفظ', theme, 'title')).toBe('Cairo-Bold');
    expect(fontFor('تم حفظ التغييرات', theme, 'body')).toBe('Cairo');
    expect(fontFor('Order رقم 12', theme, 'body')).toBe('Cairo');
  });
  it('falls back from the title font to the plain font of the same script', () => {
    const t = {
      ...theme,
      titleFontFamily: undefined,
      arabicTitleFontFamily: undefined,
    };
    expect(fontFor('Saved', t, 'title')).toBe('Inter');
    expect(fontFor('تم', t, 'title')).toBe('Cairo');
  });
  it('falls back from Arabic to the Latin font, then to the system font', () => {
    const t = {
      ...theme,
      arabicFontFamily: undefined,
      arabicTitleFontFamily: undefined,
    };
    expect(fontFor('تم', t, 'body')).toBe('Inter');
    expect(
      fontFor('Saved', resolveTheme(DEFAULT_CONFIG, 'info', false), 'title')
    ).toBeUndefined();
  });
});

describe('withAlpha', () => {
  it('adds an alpha to #RRGGBB and #RGB colors', () => {
    expect(withAlpha('#FF453A', '26')).toBe('#FF453A26');
    expect(withAlpha('#fff', '26')).toBe('#ffffff26');
  });
  it('returns undefined for colors it cannot tint', () => {
    expect(withAlpha('purple', '26')).toBeUndefined();
    expect(withAlpha('#BF5AF2CC', '26')).toBeUndefined();
    expect(withAlpha('rgb(1,2,3)', '26')).toBeUndefined();
  });
  it('gives a neutral disc for an accent it cannot tint', () => {
    const t = resolveTheme(
      { ...DEFAULT_CONFIG, theme: { accent: 'purple' } },
      'info',
      false
    );
    expect(t.iconDisc).toBe('rgba(255,255,255,0.12)');
  });
});
