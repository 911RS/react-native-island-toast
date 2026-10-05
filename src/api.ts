import { AccessibilityInfo } from 'react-native';
import { DEFAULT_CONFIG, lifeMs, resolveMotion } from './config';
import { store } from './store';
import type {
  IslandConfig,
  IslandMessage,
  IslandOptions,
  IslandType,
} from './types';

export type ShowInput = IslandOptions & { title: string; type?: IslandType };
type PromiseMessage<A> = string | ShowInput | ((arg: A) => string | ShowInput);

let config: IslandConfig = DEFAULT_CONFIG;
let seq = 0;

export function setGlobalConfig(c: IslandConfig) {
  config = c;
}
export function getGlobalConfig(): IslandConfig {
  return config;
}
/** Restarts ids at 1; for tests. */
export function resetIds() {
  seq = 0;
}

const lifeOf = (m: IslandMessage) =>
  lifeMs(
    m,
    resolveMotion(config, {
      ...m.motion,
      ...(m.hero === undefined ? {} : { hero: m.hero }),
    })
  );

const isKnown = (id: number) =>
  store.get()?.message.id === id || store.waiting().some((m) => m.id === id);

const toInput = <A>(spec: PromiseMessage<A>, arg: A): ShowInput => {
  const v = typeof spec === 'function' ? spec(arg) : spec;
  return typeof v === 'string' ? { title: v } : v;
};

function show(input: ShowInput): number {
  const m: IslandMessage = { ...input, type: input.type ?? 'info', id: ++seq };
  if (m.haptic !== false) {
    config.haptics?.(m.type);
    config.sound?.(m.type);
  }
  AccessibilityInfo.announceForAccessibility(
    [m.title, m.body, m.action?.label].filter(Boolean).join('. ')
  );
  store.enqueue(m, config.queue, lifeOf(m));
  return m.id;
}

function update(id: number, patch: Partial<ShowInput>) {
  const current =
    store.get()?.message.id === id
      ? store.get()!.message
      : store.waiting().find((m) => m.id === id);
  if (!current) return;
  const next = { ...current, ...patch, id };
  store.update(id, patch, 'duration' in patch ? lifeOf(next) : undefined);
}

export const island = {
  show,
  success: (title: string, o?: IslandOptions) =>
    show({ ...o, title, type: 'success' }),
  error: (title: string, o?: IslandOptions) =>
    show({ ...o, title, type: 'error' }),
  info: (title: string, o?: IslandOptions) =>
    show({ ...o, title, type: 'info' }),

  /** Shows a spinner while the promise runs, then turns into its result. */
  promise<T>(
    p: Promise<T>,
    msgs: {
      loading: string | ShowInput;
      success: PromiseMessage<T>;
      error: PromiseMessage<unknown>;
    }
  ): Promise<T> {
    const loading = toInput(msgs.loading, undefined);
    const id = show({
      ...loading,
      type: 'loading',
      duration: Infinity,
      hero: false,
    });
    const settle = (input: ShowInput, type: IslandType) => {
      if (!isKnown(id)) return;
      const patch = {
        hero: false,
        ...input,
        type: input.type ?? type,
        duration: input.duration,
      };
      update(id, patch);
    };
    p.then(
      (v) => settle(toInput(msgs.success, v), 'success'),
      (e) => settle(toInput(msgs.error, e), 'error')
    );
    return p;
  },

  update,

  dismiss(id: number | null | undefined) {
    if (id != null) store.requestClose(id);
  },

  dismissAll: () => store.dismissAll(),
};

export type Island = typeof island;
