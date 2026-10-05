import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { island, IslandHost } from 'react-native-island-toast';
import { C, Row, Section } from '../ui';

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Section title="Above modals">
        <Row
          label="Open a modal"
          hint="It mounts its own IslandHost, so the island stays on top"
          onPress={() => setOpen(true)}
        />
      </Section>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <Text style={s.title}>Checkout</Text>
            <Row
              label="Show a message here"
              onPress={() =>
                island.success('Coupon applied', { body: '−10 %' })
              }
            />
            <Row
              label="Show, then close the modal"
              hint="The message carries on below, without opening again"
              onPress={() => {
                island.info('Saved as draft', { body: 'You can finish later' });
                setTimeout(() => setOpen(false), 1600);
              }}
            />
            <Pressable
              onPress={() => setOpen(false)}
              style={s.close}
              accessibilityRole="button"
            >
              <Text style={s.closeText}>Close</Text>
            </Pressable>
          </View>
          <IslandHost />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 30,
  },
  title: { fontSize: 20, fontWeight: '700', color: C.ink, padding: 18 },
  close: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.ink,
    alignItems: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
