import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
          <AppButton title={action.label} onPress={action.onPress} />
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
  },
  iconWrap: {
    marginBottom: 16,
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  body: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
    color: '#71717A',
  },
  actionWrap: {
    marginTop: 24,
  },
});
