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
import { island, IslandHost, IslandProvider } from 'react-native-island-toast';
import { playDemo } from './demo';
import { ISLAND_TOP, Phone, StatusBar } from './Phone';
import { Behavior } from './screens/Behavior';
import { Content } from './screens/Content';
import { CheckoutSheet, ModalDemo } from './screens/ModalDemo';
import { Presets } from './screens/Presets';
import { Theme } from './screens/Theme';
import { Types } from './screens/Types';
import { DEFAULT_SETTINGS, toConfig, type Settings } from './settings';
import { C } from './ui';

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
const SUBTITLE: Record<Tab, string> = {
  Types: 'Success, error, info and your own types',
  Presets: 'Ready-made motion, one line',
  Theme: 'Colors, corners and sizes',
  Content: 'Icons, actions, promises and slots',
  Behavior: 'Queue, position, gestures, RTL',
  Modal: 'Stays on top of modals and sheets',
};

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const set = useCallback(
    (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p })),
    []
  );
  // On the web preview there is no real status bar: open the toast on the drawn resting island.
  const config = useMemo(
    () => ({
      ...toConfig(settings),
      offset: settings.position === 'bottom' ? 64 : web ? ISLAND_TOP - 6 : 0,
    }),
    [settings]
  );

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
    Modal: <ModalDemo open={() => setSheetOpen(true)} />,
  }[tab];

  const app = (
    <IslandProvider config={config}>
      <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
        {web && <StatusBar />}
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.h1}>{tab}</Text>
          <Text style={s.sub}>{SUBTITLE[tab]}</Text>
          {screen}
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={s.tabbar}>
        <View style={s.tabs}>
          {TABS.map((t) => {
            const on = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={s.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <View style={[s.dot, on && s.dotOn]} />
                <Text style={[s.tabText, on && s.tabTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
        {web && <View style={s.homeSpace} />}
      </SafeAreaView>
      {hostOn && <IslandHost />}
      <CheckoutSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </IslandProvider>
  );

  return (
    <SafeAreaProvider>{web ? <Phone>{app}</Phone> : app}</SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  body: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  h1: {
    fontSize: 34,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.5,
    marginLeft: 4,
  },
  sub: { fontSize: 15, color: C.soft, marginTop: 2, marginLeft: 4 },
  tabbar: {
    backgroundColor: 'rgba(249,249,251,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  tabs: { flexDirection: 'row', paddingTop: 8, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: C.blue },
  tabText: { fontSize: 11.5, fontWeight: '600', color: '#8E8E93' },
  tabTextOn: { color: C.ink },
  homeSpace: { height: 22 },
});
