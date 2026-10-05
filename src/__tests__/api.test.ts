const mockAnnounce = jest.fn();
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: (s: string) => mockAnnounce(s),
  },
}));

import { island, setGlobalConfig, resetIds } from '../api';
import { DEFAULT_CONFIG } from '../config';
import { store } from '../store';

const live = () => store.get()?.message;

beforeEach(() => {
  jest.useFakeTimers();
  store.reset();
  resetIds();
  mockAnnounce.mockClear();
  setGlobalConfig(DEFAULT_CONFIG);
  store.registerHost();
});
afterEach(() => jest.useRealTimers());

it('returns increasing ids and shows the typed message', () => {
  expect(island.success('Saved')).toBe(1);
  expect(live()?.type).toBe('success');
  expect(island.info('Next')).toBe(2);
});

it('defaults show() to the info type', () => {
  island.show({ title: 'Hello' });
  expect(live()?.type).toBe('info');
});

it('calls the haptics and sound hooks with the type, unless haptic is false', () => {
  const haptics = jest.fn();
  const sound = jest.fn();
  setGlobalConfig({ ...DEFAULT_CONFIG, haptics, sound });
  island.error('Payment failed');
  expect(haptics).toHaveBeenCalledWith('error');
  expect(sound).toHaveBeenCalledWith('error');
  island.error('Again', { haptic: false });
  expect(haptics).toHaveBeenCalledTimes(1);
});

it('announces title, body and action label to screen readers', () => {
  const id = island.success('Order shipped', {
    body: 'Arrives Friday',
    action: { label: 'Undo', onPress: () => {} },
  });
  store.markOpened(id);
  expect(mockAnnounce).toHaveBeenCalledWith(
    'Order shipped. Arrives Friday. Undo'
  );
});

it('uses the configured queue mode', () => {
  setGlobalConfig({ ...DEFAULT_CONFIG, queue: 'replace-now' });
  island.info('A');
  island.info('B');
  expect(live()?.title).toBe('B');
});

describe('promise', () => {
  it('shows loading, then the success built from the value', async () => {
    let resolve!: (v: string) => void;
    const p = new Promise<string>((r) => (resolve = r));
    const out = island.promise(p, {
      loading: 'Uploading',
      success: (v) => `Uploaded ${v}`,
      error: 'Upload failed',
    });
    expect(live()?.type).toBe('loading');
    expect(live()?.duration).toBe(Infinity);
    store.markOpened(live()!.id);
    resolve('photo.jpg');
    await expect(out).resolves.toBe('photo.jpg');
    expect(live()?.type).toBe('success');
    expect(live()?.title).toBe('Uploaded photo.jpg');
    expect(store.get()?.until).toBeLessThan(Infinity);
  });

  it('shows the error on rejection and still rejects for the caller', async () => {
    const err = new Error('offline');
    const out = island.promise(Promise.reject(err), {
      loading: 'Uploading',
      success: 'Done',
      error: (e) => ({ title: 'Upload failed', body: (e as Error).message }),
    });
    await expect(out).rejects.toBe(err);
    expect(live()?.type).toBe('error');
    expect(live()?.body).toBe('offline');
  });

  it('shows nothing when the toast was dismissed before the promise settled', async () => {
    let reject!: (e: unknown) => void;
    const p = new Promise<string>((_, r) => (reject = r));
    const out = island.promise(p, {
      loading: 'Saving',
      success: 'Saved',
      error: 'Failed',
    });
    const id = live()!.id;
    island.dismiss(id);
    store.finish(id);
    reject(new Error('late'));
    await expect(out).rejects.toThrow('late');
    expect(store.get()).toBeNull();
  });
});

it('update changes a live message and its type', () => {
  const id = island.info('Uploading');
  island.update(id, { title: 'Uploaded', type: 'success' });
  expect(live()?.title).toBe('Uploaded');
  expect(live()?.type).toBe('success');
});

it('ignores dismiss and update for missing ids', () => {
  expect(() => {
    island.dismiss(undefined);
    island.dismiss(null);
    island.dismiss(42);
    island.update(42, { title: 'x' });
  }).not.toThrow();
});

it('dismissAll asks the live message to close', () => {
  const closes = jest.fn();
  store.onCloseRequest(closes);
  const id = island.info('A');
  store.markOpened(id);
  island.dismissAll();
  expect(closes).toHaveBeenCalledWith(id);
});

describe('review fixes', () => {
  it('announces only the message that reaches the screen', () => {
    island.info('Order 1 shipped');
    const b = island.info('Order 2 shipped');
    store.markOpened(b);
    expect(mockAnnounce.mock.calls.map((c) => c[0])).toEqual([
      'Order 2 shipped',
    ]);
  });

  it('announces a change to a message on screen', () => {
    const id = island.info('Uploading');
    store.markOpened(id);
    island.update(id, { title: 'Uploaded', type: 'success' });
    expect(mockAnnounce).toHaveBeenLastCalledWith('Uploaded');
  });

  it('announces the accessibilityLabel when one is given', () => {
    const id = island.info('3', { accessibilityLabel: 'Three new messages' });
    store.markOpened(id);
    expect(mockAnnounce).toHaveBeenLastCalledWith('Three new messages');
  });

  it('replaces the loading message with the result instead of merging', async () => {
    const out = island.promise(Promise.resolve('ok'), {
      loading: {
        title: 'Uploading',
        body: 'video.mp4',
        action: { label: 'Cancel', onPress: () => {} },
      },
      success: 'Done',
      error: 'Failed',
    });
    await out;
    expect(live()?.title).toBe('Done');
    expect(live()?.body).toBeUndefined();
    expect(live()?.action).toBeUndefined();
    expect(live()?.type).toBe('success');
  });

  it('does not update a message that is already closing', async () => {
    let resolve!: (v: string) => void;
    const p = new Promise<string>((r) => (resolve = r));
    island.promise(p, { loading: 'Saving', success: 'Saved', error: 'Failed' });
    const id = live()!.id;
    store.markOpened(id);
    island.dismiss(id);
    resolve('x');
    await p;
    await Promise.resolve();
    expect(live()?.title).toBe('Saving');
  });
});
