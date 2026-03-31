import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

import { AppButton } from './AppButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryKey: prev.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Cos poszlo nie tak</Text>
          <Text style={styles.message}>
            Wystapil nieoczekiwany blad. Sprobuj ponownie.
          </Text>
          <AppButton
            title="Sprobuj ponownie"
            variant="primary"
            onPress={this.handleRetry}
            containerStyle={styles.button}
          />
        </View>
      );
    }

    return (
      <React.Fragment key={this.state.retryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontFamily: fonts.display,
    fontWeight: '500',
    color: colors.terracotta,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: 24,
    minWidth: 200,
  },
});
