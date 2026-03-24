import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, PlusCircle, List, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { OfflineBanner } from '@/components/OfflineBanner';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <View className="flex-1">
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 64,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#71717A',
          tabBarLabelStyle: {
            fontSize: 13,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="new-rental"
          options={{
            title: t('nav.newRental'),
            tabBarIcon: ({ color, size }) => (
              <PlusCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rentals"
          options={{
            title: t('nav.rentals'),
            tabBarIcon: ({ color, size }) => (
              <List size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
