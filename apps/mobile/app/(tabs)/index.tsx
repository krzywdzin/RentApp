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
import { UPCOMING_RETURN_THRESHOLD_DAYS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

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

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';
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
          isDueWithinDays(r.endDate, UPCOMING_RETURN_THRESHOLD_DAYS) &&
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
      <Pressable style={s.upcomingItem} onPress={() => handleRentalPress(item.id)}>
        <View style={s.cardRow}>
          <View style={s.flex1}>
            <Text style={s.cardName}>
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            <Text style={s.cardSub}>
              <Text style={s.cardPlate}>{item.vehicle.registration}</Text>
              {' '}{item.vehicle.make} {item.vehicle.model}
            </Text>
            <Text style={s.cardDate}>{formatDate(item.endDate)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </Pressable>
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
            tintColor={colors.forestGreen}
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
              <View style={s.overdueBar}>
                <AlertTriangle size={18} color={colors.terracotta} />
                <Text style={s.overdueText}>
                  {t('dashboard.overdue', { count: stats.overdue })}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Stat Row */}
          <View style={s.statsRow}>
            <View
              style={[s.statCell, s.statDivider]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${t('dashboard.activeRentals')}: ${stats.active}`}
            >
              <Text style={s.statValue}>{stats.active}</Text>
              <Text style={s.statLabel}>{t('dashboard.activeRentals')}</Text>
            </View>
            <View
              style={[s.statCell, s.statDivider]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${t('dashboard.todayPickups')}: ${stats.pickups}`}
            >
              <Text style={s.statValue}>{stats.pickups}</Text>
              <Text style={s.statLabel}>{t('dashboard.todayPickups')}</Text>
            </View>
            <View
              style={[s.statCell, s.statDivider]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${t('dashboard.todayReturns')}: ${stats.returns}`}
            >
              <Text style={s.statValue}>{stats.returns}</Text>
              <Text style={s.statLabel}>{t('dashboard.todayReturns')}</Text>
            </View>
            {stats.overdue > 0 && (
              <View
                style={s.statCell}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Overdue: ${stats.overdue}`}
              >
                <Text style={s.statValueOverdue}>{stats.overdue}</Text>
                <Text style={s.statLabel}>Zalegajace</Text>
              </View>
            )}
          </View>

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
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  statsRowLoading: { marginTop: spacing.xl, flexDirection: 'row', gap: 12 },
  mt24: { marginTop: spacing.xl },
  mt16: { marginTop: spacing.base },
  mt12: { marginTop: spacing.md },
  padH16pt16: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  greeting: { fontFamily: fonts.display, fontSize: 20, fontWeight: '500', color: colors.charcoal },
  todayText: { marginTop: 4, fontFamily: fonts.body, fontSize: 16, color: colors.warmGray },
  overdueBar: {
    borderLeftWidth: 4,
    borderLeftColor: colors.terracotta,
    backgroundColor: colors.amberTint,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueText: { marginLeft: 8, flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.terracotta },
  statsRow: { marginTop: spacing.xl, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.sand, borderBottomWidth: 1, borderBottomColor: colors.sand, paddingVertical: 16 },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: colors.sand },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.warmGray, textAlign: 'center' },
  statValue: { fontFamily: fonts.display, fontWeight: '600', fontSize: 28, color: colors.forestGreen, textAlign: 'center' },
  statValueOverdue: { fontFamily: fonts.display, fontWeight: '600', fontSize: 28, color: colors.terracotta, textAlign: 'center' },
  actionsWrap: { marginTop: spacing.xl },
  sectionHeading: { marginTop: spacing.xxl, fontFamily: fonts.display, fontWeight: '500', fontSize: 20, color: colors.charcoal },
  emptyWrap: { marginTop: spacing.base, paddingHorizontal: spacing.base },
  upcomingList: { marginTop: spacing.base, paddingBottom: 32 },
  upcomingItem: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.sand },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  cardSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  cardPlate: { fontFamily: fonts.data, color: colors.charcoal },
  cardDate: { marginTop: 4, fontFamily: fonts.data, fontSize: 13, color: colors.warmGray },
});
