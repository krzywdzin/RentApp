import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface AppSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}

export function AppSwitch({ label, value, onValueChange, disabled }: AppSwitchProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: colors.forestGreen }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: fonts.body,
    color: colors.charcoal,
    flexShrink: 1,
    marginRight: 12,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
