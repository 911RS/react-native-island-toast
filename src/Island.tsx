import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fontFor } from './config';
import { defaultIconFor } from './DefaultIcons';
import { renderIcon } from './renderIcon';
import { store, type LiveEntry } from './store';
import type {
  Curve,
  IslandConfig,
  IslandMessage,
  IslandMotion,
  IslandSlots,
  IslandTheme,
  SlotProps,
} from './types';

export interface IslandProps {
  entry: LiveEntry;
  /** Already opened on a host that went away: open straight to the message. */
  resume: boolean;
  theme: IslandTheme;
  motion: IslandMotion;
  config: IslandConfig;
  /** Width of the host; the island is capped to a share of it. */
  hostWidth: number;
  onGone: (id: number) => void;
}

type Size = { w: number; h: number };

const to = (value: number, c: Curve) => {
  'worklet';
  return c.type === 'spring'
    ? withSpring(value, {
        damping: c.damping,
        stiffness: c.stiffness,
        mass: c.mass,
      })
    : withTiming(value, {
        duration: c.duration,
        easing: c.easing ?? Easing.out(Easing.cubic),
      });
};

const SWIPE_DISTANCE = 24;

export function Island({
  entry,
  resume,
  theme,
  motion,
  config,
  hostWidth,
  onGone,
}: IslandProps) {
  const m = entry.message;
  const systemReduced = useReducedMotion();
  const reduced =
    motion.reducedMotion === 'always' ||
    (motion.reducedMotion === 'system' && systemReduced);
  const heroOn = motion.hero && !resume && !reduced;
  const maxWidth = Math.min(hostWidth * theme.maxWidthRatio, theme.maxWidth);
  const top = config.position === 'top';

  // The message on screen; a new one (update) is measured first, then swapped in.
  const [shown, setShown] = useState<IslandMessage>(m);
  const [measured, setMeasured] = useState<Size | null>(null);
  const measuring = shown !== m || !measured;

  const w = useSharedValue(theme.pillWidth);
  const h = useSharedValue(theme.pillHeight);
  const shell = useSharedValue(0);
  const body = useSharedValue(0);
  const hero = useSharedValue(0);
  const drag = useSharedValue(0);
  const closing = useRef(false);
  const opened = useRef(false);
  /** When the big-icon square starts turning into the message. */
  const morphAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const finish = useCallback(() => {
    m.onHide?.();
    config.onHide?.(m);
    onGone(m.id);
  }, [m, config, onGone]);

  const onMeasure = (e: LayoutChangeEvent) => {
    const size = {
      w: Math.min(maxWidth, Math.ceil(e.nativeEvent.layout.width) + 1),
      h: Math.ceil(e.nativeEvent.layout.height),
    };
    if (opened.current && !closing.current) {
      // content changed on a live island: resize, fade the new content in
      const resize = () => {
        if (closing.current) return;
        w.value = to(size.w, motion.morph);
        h.value = to(size.h, motion.morph);
      };
      const wait = morphAt.current - Date.now();
      if (wait > 0) {
        // still on the big icon: let it finish, the content fades in as planned
        timers.current.push(setTimeout(resize, wait));
      } else {
        body.value = 0;
        resize();
        body.value = withDelay(80, withTiming(1, { duration: 160 }));
      }
    }
    setShown(m);
    setMeasured(size);
  };

  // Opening, once the first size is known.
  useEffect(() => {
    if (!measured || opened.current || closing.current) return;
    opened.current = true;
    const size = measured;
    if (resume) {
      // carried over from a layer that closed: already open, so no opening at all
      if (entry.closing) {
        onGone(m.id);
        return;
      }
      w.value = size.w;
      h.value = size.h;
      shell.value = 1;
      body.value = 1;
      return;
    }
    let shownAt = 120;
    if (reduced) {
      w.value = size.w;
      h.value = size.h;
      shell.value = withTiming(1, { duration: 200 });
      body.value = withTiming(1, { duration: 200 });
      shownAt = 200;
    } else if (!heroOn) {
      shell.value = withTiming(1, { duration: 120 });
      w.value = to(size.w, motion.open);
      h.value = to(size.h, motion.open);
      body.value = withDelay(120, withTiming(1, { duration: 160 }));
      shownAt = 280;
    } else {
      // the pill opens into a square, the big icon pops, holds, then the square becomes the message
      const grow = { duration: 320, easing: Easing.out(Easing.back(1.4)) };
      const turn = motion.heroHoldMs + 380;
      morphAt.current = Date.now() + turn;
      shell.value = withTiming(1, { duration: 120 });
      w.value = withDelay(
        60,
        withSequence(
          withTiming(theme.heroSize, grow),
          withDelay(motion.heroHoldMs, to(size.w, motion.morph))
        )
      );
      h.value = withDelay(
        60,
        withSequence(
          withTiming(theme.heroSize, grow),
          withDelay(motion.heroHoldMs, to(size.h, motion.morph))
        )
      );
      hero.value = withDelay(
        160,
        withSequence(
          withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
          withDelay(Math.max(0, turn - 460), withTiming(0, { duration: 140 }))
        )
      );
      body.value = withDelay(turn + 200, withTiming(1, { duration: 180 }));
      shownAt = turn + 380;
    }
    store.markOpened(m.id);
    timers.current.push(
      setTimeout(() => {
        m.onShow?.();
        config.onShow?.(m);
      }, shownAt)
    );
    // the opening runs once per island
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    store.beginClose(m.id);
    if (reduced) {
      body.value = withTiming(0, { duration: 200 });
      shell.value = withTiming(0, { duration: 200 }, (done) => {
        if (done) runOnJS(finish)();
      });
      return;
    }
    // one continuous motion: the content fades while the island draws in, then it keeps shrinking as it fades out
    const ease = Easing.inOut(Easing.cubic);
    const shrink = { duration: 220, easing: Easing.in(Easing.cubic) };
    hero.value = withTiming(0, { duration: 120 });
    body.value = withTiming(0, { duration: 140 });
    w.value = withDelay(
      60,
      withSequence(
        withTiming(theme.pillWidth, { duration: 260, easing: ease }),
        withTiming(theme.pillHeight, shrink)
      )
    );
    h.value = withDelay(
      60,
      withSequence(
        withTiming(theme.pillHeight, { duration: 260, easing: ease }),
        withTiming(theme.pillHeight * 0.7, shrink)
      )
    );
    shell.value = withDelay(
      260,
      withTiming(
        0,
        { duration: 280, easing: Easing.in(Easing.quad) },
        (done) => {
          if (done) runOnJS(finish)();
        }
      )
    );
  }, [
    reduced,
    body,
    shell,
    hero,
    w,
    h,
    theme.pillWidth,
    theme.pillHeight,
    finish,
    m.id,
  ]);
  // the gesture handler is made once and reads the latest values through refs
  const latest = useRef({ close, top, swipe: config.swipeToDismiss });
  latest.current = { close, top, swipe: config.swipeToDismiss };

  useEffect(() => {
    if (!Number.isFinite(entry.until)) return;
    const t = setTimeout(close, Math.max(400, entry.until - Date.now()));
    return () => clearTimeout(t);
  }, [close, entry.until]);

  useEffect(
    () =>
      store.onCloseRequest((id) => {
        if (id === m.id) close();
      }),
    [close, m.id]
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          latest.current.swipe &&
          Math.abs(g.dy) > 6 &&
          Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          const atTop = latest.current.top;
          const out = atTop ? g.dy < 0 : g.dy > 0;
          drag.value = out ? g.dy : g.dy * 0.2;
        },
        onPanResponderRelease: (_, g) => {
          const atTop = latest.current.top;
          const dist = atTop ? -g.dy : g.dy;
          const speed = atTop ? -g.vy : g.vy;
          if (dist > SWIPE_DISTANCE || speed > 0.5) {
            drag.value = withTiming(atTop ? -40 : 40, { duration: 200 });
            latest.current.close();
          } else {
            drag.value = withSpring(0, { damping: 18, stiffness: 260 });
          }
        },
        onPanResponderTerminate: () => {
          drag.value = withSpring(0);
        },
      }),
    [drag]
  );

  const heroRadius = theme.heroRadius;
  const radius = theme.radius;
  const shellStyle = useAnimatedStyle(() => ({
    width: w.value,
    height: h.value,
    borderRadius: h.value > 80 ? heroRadius : Math.min(radius, h.value / 2),
    opacity: shell.value,
    transform: [{ translateY: drag.value }, { scale: 0.8 + 0.2 * shell.value }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: body.value,
    transform: [{ scale: 0.96 + 0.04 * body.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, hero.value),
    transform: [{ scale: 0.5 + 0.5 * hero.value }],
  }));

  const flip =
    !!config.direction && (config.direction === 'rtl') !== I18nManager.isRTL;
  const slot = (k: keyof IslandSlots, msg: IslandMessage) =>
    msg[k] ?? config[k];

  const content = (msg: IslandMessage, interactive: boolean) => {
    const props: SlotProps = { message: msg, theme, dismiss: close };
    // slots render as components, so they may use hooks
    const Whole = slot('renderContent', msg);
    if (Whole) return <Whole {...props} />;
    const IconSlot = slot('renderIcon', msg);
    const TitleSlot = slot('renderTitle', msg);
    const BodySlot = slot('renderBody', msg);
    const ActionSlot = slot('renderAction', msg);
    const font = (text: string | undefined, role: 'title' | 'body') => {
      const fontFamily = fontFor(text, theme, role);
      if (!fontFamily) return null;
      // a dedicated bold file must not be bolded again (Android would fall back to another font)
      const ownTitleFile =
        role === 'title' &&
        (fontFamily === theme.titleFontFamily ||
          fontFamily === theme.arabicTitleFontFamily);
      return ownTitleFile
        ? { fontFamily, fontWeight: 'normal' as const }
        : { fontFamily };
    };
    const a = msg.action;
    return (
      <View style={[styles.row, flip && styles.rowReverse]}>
        <View style={[styles.message, flip && styles.rowReverse]}>
          {IconSlot ? (
            <IconSlot {...props} />
          ) : (
            <View
              style={[styles.iconDisc, { backgroundColor: theme.iconDisc }]}
            >
              {renderIcon(
                msg.icon ?? theme.icon ?? defaultIconFor(msg.type),
                theme.iconSize,
                theme.accent
              )}
            </View>
          )}
          <View style={styles.texts}>
            {TitleSlot ? (
              <TitleSlot {...props} />
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  { color: theme.title },
                  font(msg.title, 'title'),
                  theme.titleStyle,
                ]}
              >
                {msg.title}
              </Text>
            )}
            {BodySlot ? (
              <BodySlot {...props} />
            ) : (
              !!msg.body && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.body,
                    { color: theme.body },
                    font(msg.body, 'body'),
                    theme.bodyStyle,
                  ]}
                >
                  {msg.body}
                </Text>
              )
            )}
          </View>
        </View>
        {ActionSlot ? (
          <ActionSlot {...props} />
        ) : (
          !!a && (
            <Pressable
              onPress={
                interactive
                  ? () => {
                      a.onPress();
                      close();
                    }
                  : undefined
              }
              hitSlop={8}
              style={
                a.icon
                  ? styles.actionIcon
                  : [styles.action, { backgroundColor: theme.actionBackground }]
              }
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              {a.icon ? (
                renderIcon(a.icon, 24, theme.accent)
              ) : (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionText,
                    { color: theme.actionText },
                    font(a.label, 'title'),
                  ]}
                >
                  {a.label}
                </Text>
              )}
            </Pressable>
          )
        )}
      </View>
    );
  };

  return (
    <>
      {measuring && (
        <View style={[styles.measure, { width: maxWidth }]}>
          <View style={[styles.natural, { maxWidth }]} onLayout={onMeasure}>
            {content(m, false)}
          </View>
        </View>
      )}
      <View {...pan.panHandlers}>
        <Pressable
          onPress={config.tapToDismiss ? close : undefined}
          accessibilityRole="button"
          accessibilityLabel={
            m.accessibilityLabel ?? [m.title, m.body].filter(Boolean).join('. ')
          }
          accessibilityHint={
            config.tapToDismiss
              ? (config.accessibilityHint ?? 'Dismiss')
              : undefined
          }
          // the action stays reachable for screen readers as an action of the island
          accessibilityActions={
            shown.action
              ? [
                  { name: 'activate' },
                  { name: 'magicTap' },
                  { name: 'action', label: shown.action.label },
                ]
              : undefined
          }
          onAccessibilityAction={(e) => {
            const name = e.nativeEvent.actionName;
            if ((name === 'action' || name === 'magicTap') && shown.action) {
              shown.action.onPress();
              close();
            } else if (name === 'activate' && config.tapToDismiss) close();
          }}
        >
          <Animated.View
            style={[
              styles.island,
              { backgroundColor: theme.background, borderColor: theme.border },
              theme.shadow,
              shellStyle,
            ]}
          >
            <Animated.View style={[styles.hero, heroStyle]}>
              {renderIcon(
                m.heroIcon ??
                  m.icon ??
                  theme.heroIcon ??
                  defaultIconFor(m.type),
                theme.heroIconSize,
                theme.accent
              )}
            </Animated.View>
            {measured && (
              <Animated.View
                style={[{ width: measured.w, height: measured.h }, bodyStyle]}
              >
                {content(shown, true)}
              </Animated.View>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  measure: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    opacity: 0,
    alignSelf: 'center',
  },
  natural: { alignSelf: 'flex-start' },
  island: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    userSelect: 'none',
  },
  hero: {
    pointerEvents: 'none',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    minHeight: 56,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  message: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingEnd: 6,
  },
  texts: { flexShrink: 1 },
  iconDisc: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 12, marginTop: 1 },
  action: {
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '700' },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
