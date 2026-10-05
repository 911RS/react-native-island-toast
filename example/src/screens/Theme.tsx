import { island } from 'react-native-island-toast';
import type { SetSettings, Settings } from '../settings';
import { Choice, Row, Section } from '../ui';

const ACCENTS = [
  { label: 'Per type', value: '' },
  { label: 'Orange', value: '#FF9F0A' },
  { label: 'Pink', value: '#FF375F' },
  { label: 'Mint', value: '#63E6BE' },
  { label: 'Indigo', value: '#5E5CE6' },
];

export function Theme({
  settings,
  set,
}: {
  settings: Settings;
  set: SetSettings;
}) {
  return (
    <Section title="Look">
      <Choice
        label="Island"
        options={[
          { label: 'Dark', value: 'dark' as const },
          { label: 'Light', value: 'light' as const },
        ]}
        value={settings.look}
        onChange={(look) => set({ look })}
      />
      <Choice
        label="Font"
        options={[
          { label: 'System', value: 'system' as const },
          { label: 'Space Grotesk + Cairo', value: 'custom' as const },
        ]}
        value={settings.fonts}
        onChange={(fonts) => set({ fonts })}
      />
      <Choice
        label="Accent"
        options={ACCENTS}
        value={settings.accent ?? ''}
        onChange={(v) => set({ accent: v || undefined })}
      />
      <Choice
        label="Corner radius"
        options={[8, 14, 22].map((v) => ({ label: `${v}`, value: v }))}
        value={settings.radius}
        onChange={(radius) => set({ radius })}
      />
      <Choice
        label="Big icon square"
        options={[88, 116, 150].map((v) => ({ label: `${v}`, value: v }))}
        value={settings.heroSize}
        onChange={(heroSize) => set({ heroSize })}
      />
      <Row
        label="Try it"
        onPress={() =>
          island.success('Profile saved', { body: 'Visible to your team' })
        }
      />
      <Row
        label="Try an error"
        onPress={() => island.error('Upload failed', { body: 'No connection' })}
      />
      <Row
        label="Try Arabic and Latin together"
        hint="Each line picks the font for its script"
        onPress={() =>
          island.success('تم حفظ الملف', { body: 'report-2026.pdf · 2 MB' })
        }
      />
    </Section>
  );
}
