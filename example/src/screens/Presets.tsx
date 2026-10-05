import type { PresetName } from 'react-native-island-toast';
import { island } from 'react-native-island-toast';
import type { SetSettings, Settings } from '../settings';
import { Choice, Row, Section } from '../ui';

const PRESETS: { label: string; value: PresetName | 'default' }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Snappy', value: 'snappy' },
  { label: 'Calm', value: 'calm' },
  { label: 'Bouncy', value: 'bouncy' },
  { label: 'Minimal', value: 'minimal' },
];

export function Presets({
  settings,
  set,
}: {
  settings: Settings;
  set: SetSettings;
}) {
  return (
    <Section title="Motion preset">
      <Choice
        label="Preset"
        options={PRESETS}
        value={settings.preset ?? 'default'}
        onChange={(v) => set({ preset: v === 'default' ? undefined : v })}
      />
      <Row
        label="Try it"
        onPress={() =>
          island.success('Order shipped', { body: 'Arrives Friday' })
        }
      />
      <Row
        label="Try it with an action"
        onPress={() =>
          island.info('Message archived', {
            action: {
              label: 'Undo',
              onPress: () => island.success('Message restored'),
            },
          })
        }
      />
    </Section>
  );
}
