import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, PlusCircle, List, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/OfflineBanner';
import { useRentals } from '@/hooks/use-rentals';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: rentals } = useRentals();

  const overdueCount = useMemo(() => {
    if (!rentals) return 0;
    const now = new Date();
    return rentals.filter(
      (r) =>
        (r.status === 'ACTIVE' || r.status === 'EXTENDED') &&
        new Date(r.endDate) < now,
    ).length;
  }, [rentals]);

  return (
    <View style={styles.root}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
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
            tabBarBadge: overdueCount > 0 ? overdueCount : undefined,
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
