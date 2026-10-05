import { island } from 'react-native-island-toast';
import type { SetSettings, Settings } from '../settings';
import { Choice, Row, Section } from '../ui';

export function Behavior({
  settings,
  set,
  remountHost,
}: {
  settings: Settings;
  set: SetSettings;
  remountHost: () => void;
}) {
  return (
    <>
      <Section title="Queue">
        <Choice
          label="When a new message comes"
          options={[
            { label: 'Replace latest', value: 'replace-latest' as const },
            { label: 'Queue all', value: 'queue-all' as const },
            { label: 'Replace now', value: 'replace-now' as const },
          ]}
          value={settings.queue}
          onChange={(queue) => set({ queue })}
        />
        <Row
          label="Send 3 at once"
          onPress={() => {
            island.success('Order 1 shipped');
            island.success('Order 2 shipped');
            island.success('Order 3 shipped');
          }}
        />
      </Section>
      <Section title="Place and gestures">
        <Choice
          label="Position"
          options={[
            { label: 'Top', value: 'top' as const },
            { label: 'Bottom', value: 'bottom' as const },
          ]}
          value={settings.position}
          onChange={(position) => set({ position })}
        />
        <Choice
          label="Tap to dismiss"
          options={[
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ]}
          value={settings.tapToDismiss}
          onChange={(tapToDismiss) => set({ tapToDismiss })}
        />
        <Choice
          label="Swipe to dismiss"
          options={[
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ]}
          value={settings.swipeToDismiss}
          onChange={(swipeToDismiss) => set({ swipeToDismiss })}
        />
        <Row
          label="Try it"
          onPress={() =>
            island.info('New message', { body: 'From Sam: running late' })
          }
        />
      </Section>
      <Section title="Right to left">
        <Choice
          label="Direction"
          options={[
            { label: 'Auto', value: 'auto' },
            { label: 'LTR', value: 'ltr' },
            { label: 'RTL', value: 'rtl' },
          ]}
          value={settings.direction ?? 'auto'}
          onChange={(v) =>
            set({ direction: v === 'auto' ? undefined : (v as 'ltr' | 'rtl') })
          }
        />
        <Row
          label="Arabic message"
          onPress={() =>
            island.success('تم الحفظ', { body: 'تم حفظ التغييرات' })
          }
        />
      </Section>
      <Section title="Edge cases">
        <Row
          label="Dismiss an unknown id"
          hint="Nothing happens"
          onPress={() => island.dismiss(424242)}
        />
        <Row
          label="Send while no host is mounted"
          hint="The host comes back after 1 s and shows it"
          onPress={remountHost}
        />
      </Section>
    </>
  );
}
