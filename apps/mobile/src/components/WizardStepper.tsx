import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

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
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <View style={styles.wrapper}>
      {/* Progress bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` as any }]} />
      </View>

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <View key={stepNum} style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  isCompleted
                    ? styles.dotCompleted
                    : isActive
                      ? styles.dotActive
                      : styles.dotDefault,
                ]}
              >
                {isCompleted ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      isActive ? styles.dotTextActive : styles.dotTextDefault,
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {labels?.[i] && (
                <Text style={styles.stepLabel}>{labels[i]}</Text>
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
  track: {
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#E4E4E7',
  },
  fill: {
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#3B82F6',
  },
  dotsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
  },
  dot: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  dotCompleted: {
    backgroundColor: '#16A34A',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  dotDefault: {
    backgroundColor: '#E4E4E7',
  },
  dotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dotTextActive: {
    color: '#FFFFFF',
  },
  dotTextDefault: {
    color: '#71717A',
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#71717A',
  },
});
