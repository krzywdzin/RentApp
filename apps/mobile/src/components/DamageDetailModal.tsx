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
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
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
            placeholderTextColor="#A1A1AA"
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#71717A',
  },
  chipContainer: {
    marginTop: 16,
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
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 14,
    color: '#3F3F46',
  },
  chipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181B',
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
