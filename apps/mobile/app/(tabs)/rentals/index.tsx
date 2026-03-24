import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RentalsPlaceholder() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-base text-zinc-400">
          Rentals list coming in Plan 03
        </Text>
      </View>
    </SafeAreaView>
  );
}
