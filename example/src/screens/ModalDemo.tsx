import type { ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { island, IslandHost } from 'react-native-island-toast';
import { C, Row, Section } from '../ui';

export function ModalDemo({ open }: { open: () => void }) {
  return (
    <Section title="Above modals">
      <Row
        label="Open a modal"
        hint="It mounts its own IslandHost, so the island stays on top"
        onPress={open}
      />
    </Section>
  );
}

/** On the web preview a Modal would cover the whole browser window: draw it inside the phone instead. */
function Layer({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        {children}
      </Modal>
    );
  }
  return visible ? (
    <View style={StyleSheet.absoluteFill}>{children}</View>
  ) : null;
}

export function CheckoutSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Layer visible={visible} onClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.title}>Checkout</Text>
          <Row
            label="Show a message here"
            onPress={() => island.success('Coupon applied', { body: '−10 %' })}
          />
          <Row
            label="Show, then close the modal"
            hint="The message carries on below, without opening again"
            onPress={() => {
              island.info('Saved as draft', { body: 'You can finish later' });
              setTimeout(onClose, 1600);
            }}
          />
          <Pressable
            onPress={onClose}
            style={s.close}
            accessibilityRole="button"
          >
            <Text style={s.closeText}>Close</Text>
          </Pressable>
        </View>
        <IslandHost />
      </View>
    </Layer>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.ink, padding: 20 },
  close: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.ink,
    alignItems: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
