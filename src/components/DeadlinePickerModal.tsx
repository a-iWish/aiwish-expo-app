import React, { useEffect, useMemo, useState } from 'react';
import { View, Modal, StyleSheet, Pressable, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Local-time yyyy-mm-dd (what the API's ?deadline= expects). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DeadlinePickerModalProps {
  visible: boolean;
  /** Existing deadline (ISO) when editing, otherwise null/undefined. */
  initialDate?: string | null;
  onConfirm: (isoDate: string) => void;
  onClear: () => void;
  onCancel: () => void;
}

export const DeadlinePickerModal: React.FC<DeadlinePickerModalProps> = ({
  visible,
  initialDate,
  onConfirm,
  onClear,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [temp, setTemp] = useState<Date>(
    initialDate ? new Date(initialDate) : startOfToday(),
  );

  useEffect(() => {
    if (visible) setTemp(initialDate ? new Date(initialDate) : startOfToday());
  }, [visible, initialDate]);

  // Android: the picker is its own native dialog — render it directly.
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={temp}
        mode="date"
        minimumDate={startOfToday()}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onConfirm(toISODate(date));
          else onCancel();
        }}
      />
    );
  }

  // iOS: inline calendar inside a bottom sheet with explicit actions.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <AppText variant="title" style={styles.title}>
          When do you need it by?
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          We’ll only suggest waiting for a price drop if it’s expected to arrive
          before this date.
        </AppText>

        <DateTimePicker
          value={temp}
          mode="date"
          display="inline"
          minimumDate={startOfToday()}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(_event: DateTimePickerEvent, date?: Date) =>
            date && setTemp(date)
          }
        />

        <Button title="Set deadline" onPress={() => onConfirm(toISODate(temp))} />

        {initialDate ? (
          <Pressable onPress={onClear} style={styles.linkBtn} hitSlop={8}>
            <AppText variant="bodySemibold" style={{ color: colors.error }}>
              Remove deadline
            </AppText>
          </Pressable>
        ) : null}

        <Pressable onPress={onCancel} style={styles.linkBtn} hitSlop={8}>
          <AppText variant="bodySemibold" style={{ color: colors.textSoft }}>
            Cancel
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    title: {
      fontSize: 22,
      letterSpacing: -0.4,
    },
    subtitle: {
      marginBottom: spacing.sm,
    },
    linkBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
  });
