import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

interface DocumentDiffViewProps {
  visible: boolean;
  ocrFields: Record<string, string | null>;
  currentFields: Record<string, string | null>;
  fieldLabels: Record<string, string>;
  onUpdate: (selectedFields: Record<string, string>) => void;
  onKeepCurrent: () => void;
}

interface DiffRow {
  key: string;
  label: string;
  currentValue: string | null;
  ocrValue: string | null;
  changed: boolean;
}

export function DocumentDiffView({
  visible,
  ocrFields,
  currentFields,
  fieldLabels,
  onUpdate,
  onKeepCurrent,
}: DocumentDiffViewProps) {
  const insets = useSafeAreaInsets();

  const rows = useMemo<DiffRow[]>(() => {
    const result: DiffRow[] = [];
    for (const key of Object.keys(fieldLabels)) {
      const ocrVal = ocrFields[key];
      // Skip rows where OCR returned null (no comparison possible)
      if (ocrVal == null) continue;

      const currentVal = currentFields[key] ?? null;
      const changed = ocrVal !== currentVal;

      result.push({
        key,
        label: fieldLabels[key],
        currentValue: currentVal,
        ocrValue: ocrVal,
        changed,
      });
    }
    return result;
  }, [ocrFields, currentFields, fieldLabels]);

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const row of rows) {
      initial[row.key] = row.changed;
    }
    return initial;
  });

  const allIdentical = rows.every((r) => !r.changed);

  const handleToggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdate = () => {
    const selected: Record<string, string> = {};
    for (const row of rows) {
      if (checked[row.key] && row.ocrValue != null) {
        selected[row.key] = row.ocrValue;
      }
    }
    onUpdate(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onKeepCurrent}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.heading}>Porownanie danych</Text>

          {/* Column headers */}
          <View style={s.headerRow}>
            <View style={s.checkboxCol} />
            <Text style={[s.headerText, s.headerCurrent]}>Obecne</Text>
            <Text style={[s.headerText, s.headerOcr]}>Ze skanu</Text>
          </View>

          {allIdentical ? (
            <Text style={s.identicalMessage}>
              Dane sa identyczne -- brak zmian do wprowadzenia.
            </Text>
          ) : (
            rows.map((row, idx) => {
              const rowBg = row.changed
                ? colors.sageTint
                : idx % 2 === 0
                  ? colors.cream
                  : colors.warmStone;

              return (
                <View key={row.key} style={[s.row, { backgroundColor: rowBg }]}>
                  <View style={s.checkboxCol}>
                    <Switch
                      value={checked[row.key]}
                      onValueChange={() => handleToggle(row.key)}
                      disabled={!row.changed}
                      trackColor={{
                        false: colors.sand,
                        true: colors.forestGreen,
                      }}
                      thumbColor={colors.cream}
                      style={s.switchSmall}
                    />
                  </View>
                  <View style={s.labelCol}>
                    <Text style={s.fieldLabel}>{row.label}</Text>
                  </View>
                  <View style={s.valueCol}>
                    <Text style={s.currentValue}>
                      {row.currentValue ?? '--'}
                    </Text>
                  </View>
                  <View style={s.valueCol}>
                    <Text style={s.ocrValue}>
                      {row.ocrValue ?? '--'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <View
          style={[
            s.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <AppButton
            title="Zaktualizuj zaznaczone"
            onPress={handleUpdate}
            disabled={allIdentical}
            fullWidth
          />
          <Pressable style={s.keepButton} onPress={onKeepCurrent}>
            <Text style={s.keepText}>Zachowaj obecne dane</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 120,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.base,
    paddingTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  checkboxCol: {
    width: 44,
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerCurrent: {
    color: colors.warmGray,
  },
  headerOcr: {
    color: colors.forestGreen,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand,
  },
  switchSmall: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.warmGray,
  },
  valueCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  currentValue: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.warmGray,
    textAlign: 'center',
  },
  ocrValue: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.charcoal,
    textAlign: 'center',
  },
  identicalMessage: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.warmGray,
    textAlign: 'center',
    marginTop: spacing.section,
    lineHeight: 22,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  keepButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  keepText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '400',
    color: colors.terracotta,
    textAlign: 'center',
  },
});
