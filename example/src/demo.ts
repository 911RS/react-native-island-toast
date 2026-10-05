import { island } from 'react-native-island-toast';
import { emoji, UndoIcon, UploadIcon } from './icons';
import type { SetSettings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { Tab } from './App';

type Step = [atMs: number, run: () => void];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Scripted sequences used to record the README media. */
export function playDemo(
  name: string,
  set: SetSettings,
  setTab: (t: Tab) => void
) {
  const steps: Step[] =
    name === 'hero'
      ? [
          [
            400,
            () => island.success('Order shipped', { body: 'Arrives Friday' }),
          ],
        ]
      : [
          [
            600,
            () => island.success('Order shipped', { body: 'Arrives Friday' }),
          ],
          [
            4200,
            () => island.error('Payment failed', { body: 'Card declined' }),
          ],
          [
            7800,
            () =>
              island.info('New message', { body: 'From Sam: running late' }),
          ],
          [
            11400,
            () =>
              island.show({
                type: 'upload',
                title: 'Photo uploaded',
                body: '3.2 MB',
                icon: UploadIcon,
              }),
          ],
          [15000, () => setTab('Content')],
          [
            15400,
            () =>
              island.success('Table booked', {
                body: 'Friday, 8 pm',
                icon: emoji('🍽️'),
              }),
          ],
          [
            19000,
            () =>
              island.info('Message archived', {
                action: { label: 'Undo', icon: UndoIcon, onPress: () => {} },
              }),
          ],
          [
            24600,
            () =>
              island.promise(
                wait(2400).then(() => 'clip.mp4'),
                {
                  loading: 'Uploading video',
                  success: (v) => ({ title: 'Video uploaded', body: v }),
                  error: 'Upload failed',
                }
              ),
          ],
          [30400, () => setTab('Presets')],
          [30600, () => set({ preset: 'bouncy' })],
          [
            30800,
            () => island.success('Bouncy preset', { body: 'Springier motion' }),
          ],
          [34400, () => set({ preset: 'minimal' })],
          [34600, () => island.info('Minimal preset', { body: 'No big icon' })],
          [37400, () => set({ preset: undefined })],
          [37600, () => setTab('Theme')],
          [37800, () => set({ look: 'light' })],
          [
            38000,
            () =>
              island.success('Light island', { body: 'Any colors you want' }),
          ],
          [41600, () => set({ look: 'dark', accent: '#FF9F0A' })],
          [
            41800,
            () =>
              island.success('Your brand accent', {
                body: 'Per type or for all',
              }),
          ],
          [45400, () => set({ accent: undefined })],
          [45600, () => setTab('Behavior')],
          [45800, () => set({ queue: 'queue-all' })],
          [
            46000,
            () => {
              island.success('Order 1 shipped');
              island.success('Order 2 shipped');
              island.success('Order 3 shipped');
            },
          ],
          [55600, () => set({ queue: 'replace-latest', direction: 'rtl' })],
          [
            55800,
            () => island.success('تم الحفظ', { body: 'تم حفظ التغييرات' }),
          ],
          [59400, () => set({ ...DEFAULT_SETTINGS })],
          [59600, () => setTab('Types')],
        ];
  const timers = steps.map(([at, run]) => setTimeout(run, at));
  return () => timers.forEach(clearTimeout);
}
