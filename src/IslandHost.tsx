import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveMotion, resolveTheme } from './config';
import { Island } from './Island';
import { useIslandConfig } from './IslandProvider';
import { store } from './store';

const getLive = () => store.get();

/**
 * Where the island draws. Mount one at the app root, and one inside every Modal or sheet
 * that covers the screen: only the newest mounted host shows the message, so it stays on top.
 */
export function IslandHost() {
  const config = useIslandConfig();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const [hostId, setHostId] = useState<number | null>(null);
  const [isTop, setIsTop] = useState(false);
  const entry = useSyncExternalStore(store.subscribe, getLive, getLive);

  useEffect(() => {
    const host = store.registerHost();
    setHostId(host.id);
    const sync = () => setIsTop(store.topHost() === host.id);
    const off = store.subscribeHosts(sync);
    sync();
    return () => {
      off();
      host.unregister();
    };
  }, []);

  if (!entry || !isTop || hostId === null) return null;
  const m = entry.message;
  const dark =
    config.colorScheme === 'auto'
      ? scheme === 'dark'
      : config.colorScheme === 'dark';
  const theme = resolveTheme(config, m.type, dark, m.theme);
  const motion = resolveMotion(config, {
    ...m.motion,
    ...(m.hero === undefined ? {} : { hero: m.hero }),
  });
  const edge = 6 + config.offset;
  const place =
    config.position === 'top'
      ? { top: insets.top + edge }
      : { bottom: insets.bottom + edge };

  return (
    <View pointerEvents="box-none" style={[styles.host, place]}>
      <Island
        key={`${m.id}-${hostId}`}
        entry={entry}
        resume={entry.opened}
        theme={theme}
        motion={motion}
        config={config}
        windowWidth={width}
        onGone={store.finish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
});
