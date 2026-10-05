import { StyleSheet, Text, View } from 'react-native';
import { island } from 'react-native-island-toast';
import { emoji, UndoIcon } from '../icons';
import { Row, Section } from '../ui';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function Content() {
  return (
    <>
      <Section title="Icons">
        <Row
          label="Your own icon"
          hint="Any element or component; here an emoji"
          onPress={() =>
            island.success('Table booked', {
              body: 'Friday, 8 pm',
              icon: emoji('🍽️'),
            })
          }
        />
        <Row
          label="A different big icon"
          hint="heroIcon on the opening, icon in the pill"
          onPress={() =>
            island.success('Level up', {
              body: 'You reached level 12',
              heroIcon: emoji('🏆'),
              icon: emoji('⭐'),
            })
          }
        />
        <Row
          label="No big icon"
          hint="hero: false opens straight to the message"
          onPress={() =>
            island.info('Reminder set', { body: 'Tomorrow, 9:00', hero: false })
          }
        />
      </Section>
      <Section title="Actions">
        <Row
          label="Icon-only action"
          hint="Undo, read longer"
          onPress={() =>
            island.info('Message archived', {
              action: {
                label: 'Undo',
                icon: UndoIcon,
                onPress: () => island.success('Message restored'),
              },
            })
          }
        />
        <Row
          label="Text action"
          onPress={() =>
            island.success('Invoice sent', {
              action: {
                label: 'View',
                onPress: () => island.info('Opening invoice'),
              },
            })
          }
        />
      </Section>
      <Section title="Promise and update">
        <Row
          label="Promise that succeeds"
          onPress={() =>
            island.promise(
              wait(2200).then(() => 'clip.mp4'),
              {
                loading: 'Uploading video',
                success: (name) => ({ title: 'Video uploaded', body: name }),
                error: 'Upload failed',
              }
            )
          }
        />
        <Row
          label="Promise that fails"
          onPress={() =>
            island
              .promise(
                wait(2200).then(() =>
                  Promise.reject(new Error('No connection'))
                ),
                {
                  loading: 'Sending payment',
                  success: 'Payment sent',
                  error: (e) => ({
                    title: 'Payment failed',
                    body: (e as Error).message,
                  }),
                }
              )
              .catch(() => {})
          }
        />
        <Row
          label="Update a live message"
          hint="Same island, new text after 1.2 s"
          onPress={() => {
            const id = island.info('Looking for a driver', { duration: 4000 });
            setTimeout(
              () =>
                island.update(id, {
                  type: 'success',
                  title: 'Driver found',
                  body: 'Alex, 4 min away',
                }),
              1200
            );
          }}
        />
      </Section>
      <Section title="Slots">
        <Row
          label="Custom content"
          hint="renderContent draws the whole pill"
          onPress={() =>
            island.show({
              title: 'Storage almost full',
              type: 'error',
              renderContent: ({ theme }) => (
                <View style={s.custom}>
                  <Text style={[s.customTitle, { color: theme.title }]}>
                    Storage 92% full
                  </Text>
                  <View style={s.track}>
                    <View style={[s.fill, { backgroundColor: theme.accent }]} />
                  </View>
                </View>
              ),
            })
          }
        />
      </Section>
    </>
  );
}

const s = StyleSheet.create({
  custom: { paddingHorizontal: 18, paddingVertical: 12, gap: 8, width: 240 },
  customTitle: { fontSize: 14, fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fill: { width: '92%', height: 6, borderRadius: 3 },
});
