import { store } from '../store';
import type { IslandMessage } from '../types';

let seq = 0;
const msg = (title = 'Saved'): IslandMessage => ({
  id: ++seq,
  type: 'info',
  title,
});
const LIFE = 2900;

beforeEach(() => {
  jest.useFakeTimers();
  store.reset();
});
afterEach(() => jest.useRealTimers());

const liveId = () => store.get()?.message.id;

describe('replace-latest', () => {
  it('keeps only the newest waiting and asks the live one to close', () => {
    const closes = jest.fn();
    store.onCloseRequest(closes);
    const [a, b, c] = [msg(), msg(), msg()];
    store.enqueue(a, 'replace-latest', LIFE);
    store.markOpened(a.id);
    store.enqueue(b, 'replace-latest', LIFE);
    store.enqueue(c, 'replace-latest', LIFE);
    expect(liveId()).toBe(a.id);
    expect(store.waiting().map((m) => m.id)).toEqual([c.id]);
    expect(closes).toHaveBeenCalledWith(a.id);
    store.finish(a.id);
    expect(liveId()).toBe(c.id);
  });
});

describe('queue-all', () => {
  it('shows each message in turn without closing the live one early', () => {
    const closes = jest.fn();
    store.onCloseRequest(closes);
    const [a, b, c] = [msg(), msg(), msg()];
    [a, b, c].forEach((m) => store.enqueue(m, 'queue-all', LIFE));
    expect(store.waiting().map((m) => m.id)).toEqual([b.id, c.id]);
    expect(closes).not.toHaveBeenCalled();
    store.finish(a.id);
    expect(liveId()).toBe(b.id);
    store.finish(b.id);
    expect(liveId()).toBe(c.id);
  });
});

describe('replace-now', () => {
  it('swaps the live message at once', () => {
    const [a, b] = [msg(), msg()];
    store.enqueue(a, 'replace-now', LIFE);
    store.enqueue(b, 'replace-now', LIFE);
    expect(liveId()).toBe(b.id);
    expect(store.waiting()).toEqual([]);
  });
});

describe('unknown ids', () => {
  it('ignores close, update and finish for an id it does not hold', () => {
    const a = msg();
    store.enqueue(a, 'replace-latest', LIFE);
    expect(() => {
      store.requestClose(999);
      store.update(999, { title: 'x' });
      store.finish(999);
    }).not.toThrow();
    expect(liveId()).toBe(a.id);
    expect(store.get()?.message.title).toBe('Saved');
  });
});

it('drops a waiting message when it is closed before showing', () => {
  const [a, b] = [msg(), msg()];
  store.enqueue(a, 'queue-all', LIFE);
  store.enqueue(b, 'queue-all', LIFE);
  store.requestClose(b.id);
  expect(store.waiting()).toEqual([]);
});

it('moves on after 900 ms when nothing answers a close request', () => {
  const [a, b] = [msg(), msg()];
  store.registerHost();
  store.enqueue(a, 'queue-all', LIFE);
  store.markOpened(a.id);
  store.enqueue(b, 'queue-all', LIFE);
  store.requestClose(a.id);
  jest.advanceTimersByTime(899);
  expect(liveId()).toBe(a.id);
  jest.advanceTimersByTime(1);
  expect(liveId()).toBe(b.id);
});

describe('no host', () => {
  it('drops the message after its life plus the closing', () => {
    store.enqueue(msg(), 'replace-latest', LIFE);
    jest.advanceTimersByTime(LIFE + 900);
    expect(store.get()).toBeNull();
  });
  it('keeps it while a host is mounted', () => {
    store.registerHost();
    const a = msg();
    store.enqueue(a, 'replace-latest', LIFE);
    jest.advanceTimersByTime(LIFE + 900);
    expect(liveId()).toBe(a.id);
  });
  it('keeps a message that lives until dismissed', () => {
    const a = msg();
    store.enqueue(a, 'replace-latest', Infinity);
    jest.advanceTimersByTime(60_000);
    expect(liveId()).toBe(a.id);
  });
});

it('updates the live message and moves its end', () => {
  jest.setSystemTime(1000);
  const listener = jest.fn();
  const a = msg();
  store.enqueue(a, 'replace-latest', LIFE);
  store.markOpened(a.id);
  store.subscribe(listener);
  store.update(a.id, { title: 'Uploaded' }, 5000);
  expect(store.get()?.message.title).toBe('Uploaded');
  expect(store.get()?.until).toBe(6000);
  expect(listener).toHaveBeenCalled();
});

it('updates a waiting message', () => {
  const [a, b] = [msg(), msg()];
  store.enqueue(a, 'queue-all', LIFE);
  store.enqueue(b, 'queue-all', LIFE);
  store.update(b.id, { title: 'Later' });
  expect(store.waiting()[0]?.title).toBe('Later');
});

it('dismissAll closes the live one and clears the waiting', () => {
  const closes = jest.fn();
  store.onCloseRequest(closes);
  const [a, b] = [msg(), msg()];
  store.enqueue(a, 'queue-all', LIFE);
  store.markOpened(a.id);
  store.enqueue(b, 'queue-all', LIFE);
  store.dismissAll();
  expect(store.waiting()).toEqual([]);
  expect(closes).toHaveBeenCalledWith(a.id);
});

describe('hosts', () => {
  it('the newest host is on top; removing it hands back to the one below', () => {
    const changed = jest.fn();
    store.subscribeHosts(changed);
    const h1 = store.registerHost();
    const h2 = store.registerHost();
    expect(store.topHost()).toBe(h2.id);
    h2.unregister();
    expect(store.topHost()).toBe(h1.id);
    expect(changed).toHaveBeenCalledTimes(3);
  });
});

describe('review fixes', () => {
  it('drops at once a message asked to close before any host opened it', () => {
    store.registerHost();
    const [a, b] = [msg(), msg()];
    store.enqueue(a, 'replace-latest', LIFE);
    store.enqueue(b, 'replace-latest', LIFE);
    expect(liveId()).toBe(b.id);
  });

  it('marks a closing message and moves on after 900 ms even when the island closed itself', () => {
    store.registerHost();
    const [a, b] = [msg(), msg()];
    store.enqueue(a, 'queue-all', LIFE);
    store.markOpened(a.id);
    store.enqueue(b, 'queue-all', LIFE);
    store.beginClose(a.id);
    expect(store.get()?.closing).toBe(true);
    jest.advanceTimersByTime(900);
    expect(liveId()).toBe(b.id);
  });

  it('starts the countdown when a host opens the message, not when it was sent', () => {
    jest.setSystemTime(0);
    const a = msg();
    store.enqueue(a, 'replace-latest', LIFE);
    expect(store.get()?.until).toBe(Infinity);
    jest.setSystemTime(1500);
    store.registerHost();
    store.markOpened(a.id);
    expect(store.get()?.until).toBe(1500 + LIFE);
    jest.setSystemTime(2000);
    store.markOpened(a.id);
    expect(store.get()?.until).toBe(1500 + LIFE);
  });

  it('counts a closing message as gone for isActive', () => {
    store.registerHost();
    const a = msg();
    store.enqueue(a, 'replace-latest', LIFE);
    store.markOpened(a.id);
    expect(store.isActive(a.id)).toBe(true);
    store.requestClose(a.id);
    expect(store.isActive(a.id)).toBe(false);
  });

  it('replaces the whole message when asked', () => {
    const a: IslandMessage = {
      ...msg(),
      body: 'old body',
      action: { label: 'Cancel', onPress: () => {} },
    };
    store.enqueue(a, 'replace-latest', LIFE);
    store.update(a.id, { type: 'success', title: 'Done' }, LIFE, true);
    expect(store.get()?.message).toEqual({
      id: a.id,
      type: 'success',
      title: 'Done',
    });
  });
});
