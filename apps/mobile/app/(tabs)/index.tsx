import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
      <AppCard cardStyle={s.upcomingCard} onPress={() => handleRentalPress(item.id)}>
        <View style={s.cardRow}>
          <View style={s.flex1}>
            <Text style={s.cardName}>
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            <Text style={s.cardSub}>
              {item.vehicle.registration} {item.vehicle.make} {item.vehicle.model}
            </Text>
            <Text style={s.cardSub}>
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
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.loadingWrap}>
          <LoadingSkeleton variant="text" count={2} />
          <View style={s.statsRowLoading}>
            <LoadingSkeleton variant="stat" count={3} />
          </View>
          <View style={s.mt24}>
            <LoadingSkeleton variant="list-item" count={4} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.flex1}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={s.padH16pt16}>
          {/* Greeting */}
          <Text style={s.greeting}>
            {t('dashboard.greeting', { firstName })}
          </Text>
          <Text style={s.todayText}>{today}</Text>

          {/* Overdue Alert */}
          {stats.overdue > 0 && (
            <Pressable
              onPress={() => router.push('/rentals')}
              style={s.mt16}
            >
              <AppCard cardStyle={s.overdueCard}>
                <View style={s.overdueRow}>
                  <AlertTriangle size={20} color="#DC2626" />
                  <Text style={s.overdueText}>
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
            style={s.mt24}
            contentContainerStyle={s.statsContent}
          >
            <AppCard cardStyle={s.statCard}>
              <Text style={s.statLabel}>
                {t('dashboard.activeRentals')}
              </Text>
              <Text style={s.statValue}>{stats.active}</Text>
            </AppCard>
            <AppCard cardStyle={s.statCard}>
              <Text style={s.statLabel}>
                {t('dashboard.todayPickups')}
              </Text>
              <Text style={s.statValue}>{stats.pickups}</Text>
            </AppCard>
            <AppCard cardStyle={s.statCard}>
              <Text style={s.statLabel}>
                {t('dashboard.todayReturns')}
              </Text>
              <Text style={s.statValue}>{stats.returns}</Text>
            </AppCard>
          </ScrollView>

          {/* Quick Actions */}
          <View style={s.actionsWrap}>
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
              containerStyle={s.mt12}
            />
          </View>

          {/* Upcoming Returns */}
          <Text style={s.sectionHeading}>
            {t('dashboard.upcomingReturns')}
          </Text>
        </View>

        {upcomingReturns.length === 0 ? (
          <View style={s.emptyWrap}>
            <EmptyState
              heading={t('empty.noUpcoming')}
              body={t('empty.noUpcomingBody')}
            />
          </View>
        ) : (
          <View style={s.upcomingList}>
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

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsRowLoading: { marginTop: 24, flexDirection: 'row', gap: 12 },
  mt24: { marginTop: 24 },
  mt16: { marginTop: 16 },
  mt12: { marginTop: 12 },
  padH16pt16: { paddingHorizontal: 16, paddingTop: 16 },
  greeting: { fontSize: 20, fontWeight: '600', color: '#18181B' },
  todayText: { marginTop: 4, fontSize: 16, color: '#71717A' },
  overdueCard: { borderColor: '#DC2626' },
  overdueRow: { flexDirection: 'row', alignItems: 'center' },
  overdueText: { marginLeft: 8, flex: 1, fontSize: 16, fontWeight: '600', color: '#DC2626' },
  statsContent: { gap: 12 },
  statCard: { width: 128 },
  statLabel: { fontSize: 13, color: '#71717A' },
  statValue: { marginTop: 4, fontSize: 28, fontWeight: '600', color: '#18181B' },
  actionsWrap: { marginTop: 24 },
  sectionHeading: { marginTop: 32, fontSize: 20, fontWeight: '600', color: '#18181B' },
  emptyWrap: { marginTop: 16, paddingHorizontal: 16 },
  upcomingList: { marginTop: 16, paddingBottom: 32 },
  upcomingCard: { marginHorizontal: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  cardSub: { marginTop: 4, fontSize: 13, color: '#71717A' },
});
