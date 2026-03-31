import React, { useState, useCallback } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DAMAGE_TYPES,
  DAMAGE_TYPE_LABELS,
  type DamageType,
} from '@rentapp/shared';
import { AppButton } from './AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

/** Polish labels for zone IDs */
const ZONE_LABELS: Record<string, string> = {
  front_bumper: 'Zderzak przedni',
  hood: 'Maska',
  left_front_door: 'Drzwi lewe przednie',
  right_front_door: 'Drzwi prawe przednie',
  roof: 'Dach',
  left_rear_door: 'Drzwi lewe tylne',
  right_rear_door: 'Drzwi prawe tylne',
  trunk: 'Bagaznik',
  rear_bumper: 'Zderzak tylny',
};

interface DamageDetailModalProps {
  visible: boolean;
  zoneName: string;
  onSave: (damageType: DamageType, note: string) => void;
  onCancel: () => void;
}

export function DamageDetailModal({
  visible,
  zoneName,
  onSave,
  onCancel,
}: DamageDetailModalProps) {
  const [selectedType, setSelectedType] = useState<DamageType | null>(null);
  const [note, setNote] = useState('');

  const handleSave = useCallback(() => {
    if (!selectedType) return;
    onSave(selectedType, note);
    setSelectedType(null);
    setNote('');
  }, [selectedType, note, onSave]);

  const handleCancel = useCallback(() => {
    setSelectedType(null);
    setNote('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.handleBar} />
          <Text style={styles.title}>
            {ZONE_LABELS[zoneName] ?? zoneName}
          </Text>
          <Text style={styles.subtitle}>Wybierz rodzaj uszkodzenia</Text>

          <ScrollView
            horizontal={false}
            style={styles.chipContainer}
            contentContainerStyle={styles.chipContent}
          >
            {DAMAGE_TYPES.map((dt) => {
              const isSelected = selectedType === dt;
              return (
                <Pressable
                  key={dt}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedType(dt)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {DAMAGE_TYPE_LABELS[dt]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="Dodaj opis uszkodzenia..."
            placeholderTextColor={colors.warmGray}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <View style={styles.buttonCol}>
              <AppButton
                title="Anuluj"
                variant="secondary"
                onPress={handleCancel}
                fullWidth
              />
            </View>
            <View style={styles.buttonCol}>
              <AppButton
                title="Zapisz"
                variant="primary"
                onPress={handleSave}
                disabled={!selectedType}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dialog: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.sageWash,
    padding: spacing.lg,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.sand,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.warmGray,
  },
  chipContainer: {
    marginTop: spacing.base,
    maxHeight: 180,
  },
  chipContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.cream,
  },
  chipSelected: {
    borderColor: colors.forestGreen,
    backgroundColor: colors.sageTint,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.warmGray,
  },
  chipTextSelected: {
    fontFamily: fonts.body,
    color: colors.forestGreen,
    fontWeight: '500',
  },
  input: {
    marginTop: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
    minHeight: 80,
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  buttonCol: {
    flex: 1,
  },
});
