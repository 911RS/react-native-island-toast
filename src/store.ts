import type { IslandMessage, QueueMode } from './types';

export interface LiveEntry {
  message: IslandMessage;
  /** Time (ms since epoch) at which the island starts closing. */
  until: number;
  /** Set once a host has opened it, so a host below does not replay the opening. */
  opened: boolean;
  /** Set once its close has started; it is on its way out. */
  closing: boolean;
  life: number;
}

interface Waiting {
  message: IslandMessage;
  life: number;
}

/** How long a close request may take before the next message shows anyway. */
const CLOSE_FALLBACK_MS = 900;

let live: LiveEntry | null = null;
let waiting: Waiting[] = [];
let expiry: ReturnType<typeof setTimeout> | undefined;
const fallbacks = new Set<ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
const closers = new Set<(id: number) => void>();
const hostListeners = new Set<() => void>();
let hosts: number[] = [];
let nextHost = 0;

const changed = () => listeners.forEach((l) => l());

function armExpiry(id: number, life: number) {
  clearTimeout(expiry);
  if (!Number.isFinite(life)) return;
  // With no host on screen nothing would ever close it, so let it go on its own.
  expiry = setTimeout(() => {
    if (live?.message.id === id && hosts.length === 0) store.finish(id);
  }, life + CLOSE_FALLBACK_MS);
}

function show(w: Waiting) {
  // the countdown starts when a host opens it (markOpened)
  live = {
    message: w.message,
    until: Infinity,
    opened: false,
    closing: false,
    life: w.life,
  };
  armExpiry(w.message.id, w.life);
  changed();
}

export const store = {
  enqueue(m: IslandMessage, mode: QueueMode, life: number) {
    const entry = { message: m, life };
    if (!live || mode === 'replace-now') {
      waiting = [];
      show(entry);
      return;
    }
    if (mode === 'queue-all') {
      waiting.push(entry);
      return;
    }
    waiting = [entry];
    store.requestClose(live.message.id);
  },

  requestClose(id: number) {
    if (waiting.some((w) => w.message.id === id)) {
      waiting = waiting.filter((w) => w.message.id !== id);
      return;
    }
    if (live?.message.id !== id) return;
    // never drawn yet: nothing to animate
    if (!live.opened) {
      store.finish(id);
      return;
    }
    store.beginClose(id);
    closers.forEach((c) => c(id));
  },

  /** Marks the live message as closing; it is let go after 900 ms if no island finishes it. */
  beginClose(id: number) {
    if (live?.message.id !== id || live.closing) return;
    live = { ...live, closing: true };
    const t = setTimeout(() => {
      fallbacks.delete(t);
      store.finish(id);
    }, CLOSE_FALLBACK_MS);
    fallbacks.add(t);
  },

  /** Showing or waiting, and not on its way out. */
  isActive: (id: number): boolean =>
    (live?.message.id === id && !live.closing) ||
    waiting.some((w) => w.message.id === id),

  finish(id: number) {
    if (live?.message.id !== id) return;
    live = null;
    clearTimeout(expiry);
    const next = waiting.shift();
    if (next) show(next);
    else changed();
  },

  /** Merges the patch into the message, or replaces it whole when `replace` is set. */
  update(
    id: number,
    patch: Partial<IslandMessage>,
    life?: number,
    replace = false
  ) {
    const next = (m: IslandMessage) =>
      (replace ? { ...patch, id } : { ...m, ...patch, id }) as IslandMessage;
    if (live?.message.id === id) {
      live = { ...live, message: next(live.message) };
      if (life !== undefined) {
        live.life = life;
        if (live.opened) live.until = Date.now() + life;
        armExpiry(id, life);
      }
      changed();
      return;
    }
    const w = waiting.find((x) => x.message.id === id);
    if (!w) return;
    w.message = next(w.message);
    if (life !== undefined) w.life = life;
  },

  dismissAll() {
    waiting = [];
    if (live) store.requestClose(live.message.id);
  },

  get: (): LiveEntry | null => live,
  waiting: (): IslandMessage[] => waiting.map((w) => w.message),

  /** A host has opened the live message: its countdown starts now (once). */
  markOpened(id: number) {
    if (live?.message.id !== id || live.opened) return;
    live = { ...live, opened: true, until: Date.now() + live.life };
    changed();
  },

  isSubscribed: (l: () => void): boolean => listeners.has(l),

  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  onCloseRequest(c: (id: number) => void) {
    closers.add(c);
    return () => {
      closers.delete(c);
    };
  },

  registerHost() {
    const id = nextHost++;
    hosts = [...hosts, id];
    hostListeners.forEach((l) => l());
    return {
      id,
      unregister: () => {
        hosts = hosts.filter((h) => h !== id);
        hostListeners.forEach((l) => l());
      },
    };
  },

  topHost: (): number | undefined => hosts[hosts.length - 1],

  subscribeHosts(l: () => void) {
    hostListeners.add(l);
    return () => {
      hostListeners.delete(l);
    };
  },

  /** Clears all state; for tests. */
  reset() {
    clearTimeout(expiry);
    fallbacks.forEach(clearTimeout);
    fallbacks.clear();
    live = null;
    waiting = [];
    listeners.clear();
    closers.clear();
    hostListeners.clear();
    hosts = [];
  },
};
