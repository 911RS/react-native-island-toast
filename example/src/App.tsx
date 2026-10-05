import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IslandHost, IslandProvider } from 'react-native-island-toast';
import { playDemo } from './demo';
import { Behavior } from './screens/Behavior';
import { Content } from './screens/Content';
import { ModalDemo } from './screens/ModalDemo';
import { Presets } from './screens/Presets';
import { Theme } from './screens/Theme';
import { Types } from './screens/Types';
import { DEFAULT_SETTINGS, toConfig, type Settings } from './settings';
import { C } from './ui';
import { island } from 'react-native-island-toast';

export type Tab =
  'Types' | 'Presets' | 'Theme' | 'Content' | 'Behavior' | 'Modal';
const TABS: Tab[] = [
  'Types',
  'Presets',
  'Theme',
  'Content',
  'Behavior',
  'Modal',
];

const web = Platform.OS === 'web';
const demoName = web
  ? new URLSearchParams(
      (globalThis as { location?: { search: string } }).location?.search
    ).get('demo')
  : null;

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>('Types');
  const [hostOn, setHostOn] = useState(true);
  const set = useCallback(
    (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p })),
    []
  );
  const config = useMemo(() => toConfig(settings), [settings]);

  useEffect(
    () => (demoName ? playDemo(demoName, set, setTab) : undefined),
    [set]
  );

  const remountHost = () => {
    setHostOn(false);
    setTimeout(
      () =>
        island.success('Sent while away', {
          body: 'Shown once a host is back',
        }),
      100
    );
    setTimeout(() => setHostOn(true), 1000);
  };

  const screen = {
    Types: <Types />,
    Presets: <Presets settings={settings} set={set} />,
    Theme: <Theme settings={settings} set={set} />,
    Content: <Content />,
    Behavior: (
      <Behavior settings={settings} set={set} remountHost={remountHost} />
    ),
    Modal: <ModalDemo />,
  }[tab];

  const app = (
    <IslandProvider config={config}>
      <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
        {web && <FakeStatusBar />}
        <Text style={s.h1}>Island Toast</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsWrap}
          contentContainerStyle={s.tabs}
        >
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[s.tab, t === tab && s.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: t === tab }}
            >
              <Text style={[s.tabText, t === tab && s.tabTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={s.body}>{screen}</ScrollView>
      </SafeAreaView>
      {hostOn && <IslandHost />}
    </IslandProvider>
  );

  return (
    <SafeAreaProvider>
      {web ? (
        <View style={s.desk}>
          <View style={s.phone}>{app}</View>
        </View>
      ) : (
        app
      )}
    </SafeAreaProvider>
  );
}

/** On the web preview, a status bar so the island sits where it would on a phone. */
function FakeStatusBar() {
  return (
    <View style={s.status}>
      <Text style={s.statusText}>9:41</Text>
      <Text style={s.statusText}>100%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 393,
    height: 852,
    maxHeight: '100%',
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: C.page,
    borderWidth: 10,
    borderColor: '#000000',
  },
  page: { flex: 1, backgroundColor: C.page },
  status: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statusText: { fontSize: 15, fontWeight: '600', color: C.ink },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: C.ink,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  tabsWrap: { flexGrow: 0 },
  tabs: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
  },
  tabOn: { backgroundColor: C.ink },
  tabText: { fontSize: 14, fontWeight: '600', color: C.ink },
  tabTextOn: { color: '#FFFFFF' },
  body: { paddingHorizontal: 16, paddingBottom: 60 },
});
