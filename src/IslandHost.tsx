import { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
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
  // The room the host really has (a Modal, a split screen or a framed preview can be narrower than the window).
  const [width, setWidth] = useState<number | null>(null);
  const scheme = useColorScheme();
  const dark =
    config.colorScheme === 'auto'
      ? scheme === 'dark'
      : config.colorScheme === 'dark';
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

  if (!isTop || hostId === null) return null;
  const edge = 6 + config.offset;
  const place =
    config.position === 'top'
      ? { top: insets.top + edge }
      : { bottom: insets.bottom + edge };

  // Rendered even when idle, so its width is known before a message measures itself.
  return (
    <View
      style={[styles.host, place]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {entry && width !== null && (
        <Island
          key={`${entry.message.id}-${hostId}`}
          entry={entry}
          resume={entry.opened}
          theme={resolveTheme(
            config,
            entry.message.type,
            dark,
            entry.message.theme
          )}
          motion={resolveMotion(config, {
            ...entry.message.motion,
            ...(entry.message.hero === undefined
              ? {}
              : { hero: entry.message.hero }),
          })}
          config={config}
          hostWidth={width}
          onGone={store.finish}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    pointerEvents: 'box-none',
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
});
