import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, PlusCircle, List, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/OfflineBanner';
import { useRentals } from '@/hooks/use-rentals';
import { colors, fonts } from '@/lib/theme';

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
            backgroundColor: colors.cream,
            borderTopWidth: 1,
            borderTopColor: colors.sand,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.forestGreen,
          tabBarInactiveTintColor: colors.warmGray,
          tabBarLabelStyle: {
            fontSize: 13,
            fontFamily: fonts.body,
          },
          headerStyle: { backgroundColor: colors.cream, elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
          headerTintColor: colors.forestGreen,
          headerShadowVisible: false,
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
