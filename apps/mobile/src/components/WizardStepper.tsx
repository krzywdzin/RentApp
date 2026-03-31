import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function WizardStepper({
  currentStep,
  totalSteps,
  labels,
}: WizardStepperProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <View key={stepNum} style={styles.stepCol}>
              <Text
                style={[
                  styles.stepNumber,
                  isCompleted
                    ? styles.stepCompleted
                    : isActive
                      ? styles.stepActive
                      : styles.stepFuture,
                ]}
              >
                {isCompleted ? '✓' : stepNum}
              </Text>
              {labels?.[i] && (
                <Text
                  style={[
                    styles.stepLabel,
                    isActive ? styles.stepLabelActive : styles.stepLabelDefault,
                  ]}
                >
                  {labels[i]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  stepCol: {
    alignItems: 'center',
  },
  stepNumber: {
    fontFamily: fonts.data,
    fontSize: 14,
  },
  stepActive: {
    color: colors.forestGreen,
    fontFamily: fonts.display,
    fontWeight: '600',
  },
  stepCompleted: {
    color: colors.sage,
  },
  stepFuture: {
    color: colors.sand,
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  stepLabelActive: {
    fontFamily: fonts.body,
    color: colors.forestGreen,
    fontWeight: '600',
  },
  stepLabelDefault: {
    fontFamily: fonts.body,
    color: colors.warmGray,
  },
});
