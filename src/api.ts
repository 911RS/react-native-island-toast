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

// Screen readers hear a message when it reaches the screen, and again when it changes there.
let announced: IslandMessage | null = null;
const announce = () => {
  const e = store.get();
  if (!e || !e.opened || e.closing || e.message === announced) return;
  announced = e.message;
  const m = e.message;
  AccessibilityInfo.announceForAccessibility(
    m.accessibilityLabel ??
      [m.title, m.body, m.action?.label].filter(Boolean).join('. ')
  );
};
const ensureAnnouncer = () => {
  if (!store.isSubscribed(announce)) store.subscribe(announce);
};

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
  ensureAnnouncer();
  store.enqueue(m, config.queue, lifeOf(m));
  return m.id;
}

function update(id: number, patch: Partial<ShowInput>, replace = false) {
  const current =
    store.get()?.message.id === id
      ? store.get()!.message
      : store.waiting().find((m) => m.id === id);
  if (!current) return;
  const next = (
    replace ? { ...patch, id } : { ...current, ...patch, id }
  ) as IslandMessage;
  store.update(
    id,
    next,
    'duration' in patch || replace ? lifeOf(next) : undefined,
    replace
  );
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
      if (!store.isActive(id)) return;
      // the result replaces the loading message (its body, icon or action do not carry over)
      update(id, { hero: false, ...input, type: input.type ?? type }, true);
    };
    p.then(
      (v) => settle(toInput(msgs.success, v), 'success'),
      (e) => settle(toInput(msgs.error, e), 'error')
    );
    return p;
  },

  update: (id: number, patch: Partial<ShowInput>) => update(id, patch),

  dismiss(id: number | null | undefined) {
    if (id != null) store.requestClose(id);
  },

  dismissAll: () => store.dismissAll(),
};

export type Island = typeof island;
