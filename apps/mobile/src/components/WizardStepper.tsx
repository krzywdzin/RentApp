import React from 'react';
import { Text, View } from 'react-native';
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
    <View className="my-2 px-4">
      {/* Progress bar */}
      <View className="h-1 rounded-full bg-zinc-200">
        <View
          className="h-1 rounded-full bg-blue-600"
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Step dots */}
      <View className="mt-3 flex-row items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <View key={stepNum} className="items-center">
              <View
                className={[
                  'h-8 w-8 items-center justify-center rounded-full',
                  isCompleted
                    ? 'bg-green-600'
                    : isActive
                      ? 'bg-blue-600'
                      : 'bg-zinc-200',
                ].join(' ')}
              >
                {isCompleted ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    className={[
                      'text-sm font-semibold',
                      isActive ? 'text-white' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {labels?.[i] && (
                <Text className="mt-1 text-[11px] text-zinc-500">
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
