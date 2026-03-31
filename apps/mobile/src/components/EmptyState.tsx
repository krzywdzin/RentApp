import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  body: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.body}>{body}</Text>
      {action && (
        <View style={styles.actionWrap}>
          <AppButton title={action.label} onPress={action.onPress} variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.cream,
  },
  iconWrap: {
    marginBottom: 16,
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fonts.display,
    fontWeight: '500',
    color: colors.charcoal,
  },
  body: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.warmGray,
  },
  actionWrap: {
    marginTop: 24,
  },
});
