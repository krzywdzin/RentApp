import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useRentals } from '@/hooks/use-rentals';
import { formatDate } from '@/lib/format';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { RentalWithRelations } from '@/api/rentals.api';

function isOverdue(rental: RentalWithRelations): boolean {
  if (rental.status !== 'ACTIVE' && rental.status !== 'EXTENDED') return false;
  return new Date(rental.endDate) < new Date();
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isDueWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const futureLimit = new Date();
  futureLimit.setDate(futureLimit.getDate() + days);
  return date >= now && date <= futureLimit;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: rentals, isLoading, refetch, isRefetching } = useRentals();

  const firstName = user?.name?.split(' ')[0] ?? '';
  const today = formatDate(new Date());

  const stats = useMemo(() => {
    if (!rentals) return { active: 0, pickups: 0, returns: 0, overdue: 0 };

    const activeRentals = rentals.filter(
      (r) => r.status === 'ACTIVE' || r.status === 'EXTENDED',
    );
    const overdueRentals = activeRentals.filter(isOverdue);
    const todayPickups = rentals.filter((r) => isToday(r.startDate));
    const todayReturns = rentals.filter((r) => isToday(r.endDate));

    return {
      active: activeRentals.length,
      pickups: todayPickups.length,
      returns: todayReturns.length,
      overdue: overdueRentals.length,
    };
  }, [rentals]);

  const upcomingReturns = useMemo(() => {
    if (!rentals) return [];

    return rentals
      .filter(
        (r) =>
          (r.status === 'ACTIVE' || r.status === 'EXTENDED') &&
          isDueWithinDays(r.endDate, 3) &&
          !isOverdue(r),
      )
      .sort(
        (a, b) =>
          new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      );
  }, [rentals]);

  const handleRentalPress = useCallback(
    (id: string) => {
      router.push(`/rentals/${id}`);
    },
    [router],
  );

  const renderUpcomingItem = useCallback(
    ({ item }: { item: RentalWithRelations }) => (
      <AppCard className="mx-4 mb-3" onPress={() => handleRentalPress(item.id)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-zinc-900">
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {item.vehicle.registration} {item.vehicle.make} {item.vehicle.model}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {formatDate(item.endDate)}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </AppCard>
    ),
    [handleRentalPress],
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 px-4 pt-4">
          <LoadingSkeleton variant="text" count={2} />
          <View className="mt-6 flex-row gap-3">
            <LoadingSkeleton variant="stat" count={3} />
          </View>
          <View className="mt-6">
            <LoadingSkeleton variant="list-item" count={4} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          {/* Greeting */}
          <Text className="text-[20px] font-semibold text-zinc-900">
            {t('dashboard.greeting', { firstName })}
          </Text>
          <Text className="mt-1 text-base text-zinc-500">{today}</Text>

          {/* Overdue Alert */}
          {stats.overdue > 0 && (
            <Pressable
              onPress={() => router.push('/rentals')}
              className="mt-4"
            >
              <AppCard className="border-red-600">
                <View className="flex-row items-center">
                  <AlertTriangle size={20} color="#DC2626" />
                  <Text className="ml-2 flex-1 text-base font-semibold text-red-600">
                    {t('dashboard.overdue', { count: stats.overdue })}
                  </Text>
                </View>
              </AppCard>
            </Pressable>
          )}

          {/* Stat Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-6"
            contentContainerClassName="gap-3"
          >
            <AppCard className="w-32">
              <Text className="text-[13px] text-zinc-500">
                {t('dashboard.activeRentals')}
              </Text>
              <Text className="mt-1 text-[28px] font-semibold text-zinc-900">
                {stats.active}
              </Text>
            </AppCard>
            <AppCard className="w-32">
              <Text className="text-[13px] text-zinc-500">
                {t('dashboard.todayPickups')}
              </Text>
              <Text className="mt-1 text-[28px] font-semibold text-zinc-900">
                {stats.pickups}
              </Text>
            </AppCard>
            <AppCard className="w-32">
              <Text className="text-[13px] text-zinc-500">
                {t('dashboard.todayReturns')}
              </Text>
              <Text className="mt-1 text-[28px] font-semibold text-zinc-900">
                {stats.returns}
              </Text>
            </AppCard>
          </ScrollView>

          {/* Quick Actions */}
          <View className="mt-6 gap-3">
            <AppButton
              title={t('dashboard.newRental')}
              fullWidth
              onPress={() => router.push('/new-rental')}
            />
            <AppButton
              title={t('dashboard.quickReturn')}
              variant="secondary"
              fullWidth
              onPress={() => router.push('/rentals')}
            />
          </View>

          {/* Upcoming Returns */}
          <Text className="mt-8 text-[20px] font-semibold text-zinc-900">
            {t('dashboard.upcomingReturns')}
          </Text>
        </View>

        {upcomingReturns.length === 0 ? (
          <View className="mt-4 px-4">
            <EmptyState
              heading={t('empty.noUpcoming')}
              body={t('empty.noUpcomingBody')}
            />
          </View>
        ) : (
          <View className="mt-4 pb-8">
            {upcomingReturns.map((rental) => (
              <View key={rental.id}>
                {renderUpcomingItem({ item: rental })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
