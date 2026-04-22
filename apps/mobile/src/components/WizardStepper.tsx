import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  onBack?: () => void;
}

export function WizardStepper({
  currentStep,
  totalSteps,
  labels,
  onBack,
}: WizardStepperProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Wstecz"
          >
            <ChevronLeft size={20} color={colors.forestGreen} />
            <Text style={styles.backLabel}>Wstecz</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnPlaceholder: { height: 28 },
  backLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forestGreen,
    fontWeight: '500',
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
