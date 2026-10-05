import { island } from 'react-native-island-toast';
import { UploadIcon } from '../icons';
import { Row, Section } from '../ui';

export function Types() {
  return (
    <>
      <Section title="Built-in types">
        <Row
          label="Success"
          hint="Order shipped"
          onPress={() =>
            island.success('Order shipped', { body: 'Arrives Friday' })
          }
        />
        <Row
          label="Error"
          hint="Payment failed"
          onPress={() =>
            island.error('Payment failed', { body: 'Card declined' })
          }
        />
        <Row
          label="Info"
          hint="New message"
          onPress={() =>
            island.info('New message', { body: 'From Sam: running late' })
          }
        />
      </Section>
      <Section title="Custom type">
        <Row
          label="Upload"
          hint="Registered in config.types with its own accent"
          onPress={() =>
            island.show({
              type: 'upload',
              title: 'Photo uploaded',
              body: '3.2 MB',
              icon: UploadIcon,
            })
          }
        />
      </Section>
      <Section title="Edge cases">
        <Row
          label="Very long text"
          hint="One line each, cut with an ellipsis"
          onPress={() =>
            island.info(
              'Your weekly summary is ready with 48 new orders, 3 refunds and 12 reviews to answer',
              {
                body: 'Tap to open the full report with every detail of the week that just ended',
              }
            )
          }
        />
        <Row label="Title only" onPress={() => island.success('Saved')} />
      </Section>
    </>
  );
}
