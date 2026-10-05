import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { withAlpha } from './config';
import type { IconSpec, IslandType } from './types';

type P = { size: number; color: string };

export function Tick({ size, color }: P) {
  const stroke = Math.max(2, size * 0.12);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.62,
          height: size * 0.34,
          borderLeftWidth: stroke,
          borderBottomWidth: stroke,
          borderColor: color,
          borderBottomLeftRadius: stroke / 3,
          marginTop: -size * 0.1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/** A ring holding a mark: "!" for warnings, "i" for info. */
function Ring({ size, color, mark }: P & { mark: '!' | 'i' }) {
  const stroke = Math.max(2, size * 0.09);
  const dot = stroke * 1.25;
  const bar = {
    width: stroke,
    height: size * 0.3,
    borderRadius: stroke / 2,
    backgroundColor: color,
  };
  const point = {
    width: dot,
    height: dot,
    borderRadius: dot / 2,
    backgroundColor: color,
  };
  return (
    <View
      style={{
        width: size * 0.84,
        height: size * 0.84,
        borderRadius: size,
        borderWidth: stroke,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        gap: stroke * 0.8,
        margin: size * 0.08,
      }}
    >
      {mark === '!' ? (
        <>
          <View style={bar} />
          <View style={point} />
        </>
      ) : (
        <>
          <View style={point} />
          <View style={bar} />
        </>
      )}
    </View>
  );
}

export const Warning = (p: P) => <Ring {...p} mark="!" />;
export const Info = (p: P) => <Ring {...p} mark="i" />;

export function Spinner({ size, color }: P) {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.linear }),
      -1
    );
  }, [turn]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));
  const stroke = Math.max(2, size * 0.11);
  return (
    <Animated.View
      style={[
        {
          width: size * 0.8,
          height: size * 0.8,
          margin: size * 0.1,
          borderRadius: size,
          borderWidth: stroke,
          borderColor: withAlpha(color, '33') ?? 'rgba(127,127,127,0.25)',
          borderTopColor: color,
        },
        style,
      ]}
    />
  );
}

export function defaultIconFor(type: IslandType): IconSpec {
  if (type === 'success') return Tick;
  if (type === 'error') return Warning;
  if (type === 'loading') return Spinner;
  return Info;
}
