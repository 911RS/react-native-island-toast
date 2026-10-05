import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { getGlobalConfig, island, setGlobalConfig } from './api';
import { DEFAULT_CONFIG, deepMerge } from './config';
import { store } from './store';
import type { IslandConfig, IslandMessage } from './types';

const ConfigContext = createContext<IslandConfig | null>(null);

export function IslandProvider({
  config,
  children,
}: {
  config?: Partial<IslandConfig>;
  children: ReactNode;
}) {
  const merged = useMemo(() => deepMerge(DEFAULT_CONFIG, config), [config]);
  // set during render so toasts fired by children's first effects already use it
  setGlobalConfig(merged);
  return (
    <ConfigContext.Provider value={merged}>{children}</ConfigContext.Provider>
  );
}

/** The config in effect: the nearest provider's, else the global one. */
export function useIslandConfig(): IslandConfig {
  return useContext(ConfigContext) ?? getGlobalConfig();
}

/** The island API plus the message on screen now. */
export function useIsland(): typeof island & { current: IslandMessage | null } {
  const current = useSyncExternalStore(
    store.subscribe,
    () => store.get()?.message ?? null,
    () => null
  );
  return { ...island, current };
}
