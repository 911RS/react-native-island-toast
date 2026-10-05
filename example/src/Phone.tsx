import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useIsland } from 'react-native-island-toast';

export const SCREEN = { width: 393, height: 852 };
const BEZEL = 12;
/** Top of the resting island; the toast host is offset to open right on it. */
export const ISLAND_TOP = 11;
/** ?zoom=2 draws the phone twice as large (sharper screen recordings). */
const ZOOM = Number(
  new URLSearchParams(
    (globalThis as { location?: { search: string } }).location?.search
  ).get('zoom') ?? 1
);

/** Web preview only: an iPhone-sized screen, scaled to fit the window. */
export function Phone({ children }: { children: ReactNode }) {
  const win = useWindowDimensions();
  const outerW = SCREEN.width + BEZEL * 2;
  const outerH = SCREEN.height + BEZEL * 2;
  const scale = Math.min(
    ZOOM,
    (win.height - 32 * ZOOM) / outerH,
    (win.width - 32 * ZOOM) / outerW
  );
  return (
    <View style={s.desk}>
      <View
        testID="phone"
        style={[
          s.body,
          { width: outerW, height: outerH, transform: [{ scale }] },
        ]}
      >
        <View style={s.screen}>
          {children}
          <RestingIsland />
          <View style={s.homeBar} />
        </View>
      </View>
    </View>
  );
}

/** The phone's own island: it steps aside while a toast grows out of it, and comes back after. */
function RestingIsland() {
  const live = !!useIsland().current;
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = live
      ? withDelay(140, withTiming(0, { duration: 0 }))
      : withTiming(1, { duration: 220 });
  }, [live, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[s.restingIsland, style]} />;
}

export function StatusBar() {
  return (
    <View style={s.status}>
      <Text style={s.time}>9:41</Text>
      <View style={s.right}>
        <View style={s.bars}>
          {[5, 7, 9, 11].map((h) => (
            <View key={h} style={[s.bar, { height: h }]} />
          ))}
        </View>
        <View style={s.battery}>
          <View style={s.level} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    borderRadius: 62,
    padding: BEZEL,
    backgroundColor: '#050505',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  screen: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
  },
  restingIsland: {
    pointerEvents: 'none',
    position: 'absolute',
    top: ISLAND_TOP,
    alignSelf: 'center',
    width: 120,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
  },
  homeBar: {
    pointerEvents: 'none',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 136,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#111114',
  },
  status: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 44,
    paddingRight: 34,
    paddingTop: 4,
  },
  time: { fontSize: 16, fontWeight: '600', color: '#111114' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 1, backgroundColor: '#111114' },
  battery: {
    width: 25,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(17,17,20,0.4)',
    padding: 1.5,
  },
  level: { flex: 1, borderRadius: 2, backgroundColor: '#111114' },
});
