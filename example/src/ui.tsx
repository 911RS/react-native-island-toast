import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const C = {
  page: '#F2F2F7',
  card: '#FFFFFF',
  ink: '#111114',
  soft: '#6E6E73',
  line: '#E5E5EA',
  blue: '#0A84FF',
};

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

export function Row({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.pressed]}
      accessibilityRole="button"
    >
      <View style={s.rowText}>
        <Text style={s.label}>{label}</Text>
        {!!hint && <Text style={s.hint}>{hint}</Text>}
      </View>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}

export function Choice<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.choice}>
      <Text style={s.label}>{label}</Text>
      <View style={s.segments}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              style={[s.segment, on && s.segmentOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.segmentText, on && s.segmentTextOn]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  pressed: { backgroundColor: '#ECECF0' },
  rowText: { flex: 1 },
  label: { fontSize: 16, color: C.ink },
  hint: { fontSize: 13, color: C.soft, marginTop: 2 },
  chevron: { fontSize: 22, color: '#C7C7CC', marginLeft: 8 },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  segments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#EFEFF4',
  },
  segmentOn: { backgroundColor: C.ink },
  segmentText: { fontSize: 14, color: C.ink, fontWeight: '500' },
  segmentTextOn: { color: '#FFFFFF' },
});
