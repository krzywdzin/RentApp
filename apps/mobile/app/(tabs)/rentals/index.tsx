import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useRentals } from '@/hooks/use-rentals';
import { formatDate } from '@/lib/format';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { RentalWithRelations } from '@/api/rentals.api';
import { colors, fonts, spacing } from '@/lib/theme';

type StatusFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'RETURNED';

const FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'rentals.filterAll' },
  { key: 'ACTIVE', labelKey: 'rentals.filterActive' },
  { key: 'DRAFT', labelKey: 'rentals.filterDraft' },
  { key: 'RETURNED', labelKey: 'rentals.filterReturned' },
];

export default function RentalsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: rentals, isLoading, refetch, isRefetching } = useRentals();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');

  const filteredRentals = useMemo(() => {
    if (!rentals) return [];

    let result = rentals;

    // Status filter
    if (activeFilter !== 'ALL') {
      if (activeFilter === 'ACTIVE') {
        result = result.filter(
          (r) => r.status === 'ACTIVE' || r.status === 'EXTENDED',
        );
      } else {
        result = result.filter((r) => r.status === activeFilter);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.vehicle.registration.toLowerCase().includes(query) ||
          `${r.customer.firstName} ${r.customer.lastName}`
            .toLowerCase()
            .includes(query),
      );
    }

    return result;
  }, [rentals, activeFilter, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: RentalWithRelations }) => (
      <Pressable
        style={s.itemRow}
        onPress={() => router.push(`/rentals/${item.id}`)}
        accessibilityRole="button"
      >
        <View style={s.flex1}>
          <Text style={s.itemName}>
            {item.customer.firstName} {item.customer.lastName}
          </Text>
          <Text style={s.itemSub}>
            <Text style={s.itemPlate}>{item.vehicle.registration}</Text>
            {' '}{item.vehicle.make} {item.vehicle.model}
          </Text>
          <Text style={s.itemDate}>
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </Pressable>
    ),
    [router],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.loadingWrap}>
          <LoadingSkeleton variant="list-item" count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Search */}
      <View style={s.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('rentals.search')}
        />
      </View>

      {/* Filter Chips */}
      <View style={s.filterWrap}>
        <View style={s.filterRow}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[
                  s.chip,
                  isActive ? s.chipActive : s.chipInactive,
                ]}
                onPress={() => setActiveFilter(filter.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filtr: ${t(filter.labelKey)}`}
              >
                <Text
                  style={[
                    s.chipText,
                    isActive ? s.chipTextActive : s.chipTextInactive,
                  ]}
                >
                  {t(filter.labelKey)}
                </Text>
              </Pressable>

            );
          })}
        </View>
      </View>

      {/* Rental List */}
      {filteredRentals.length === 0 ? (
        <EmptyState
          heading={t('empty.noRentals')}
          body={t('empty.noRentalsBody')}
        />
      ) : (
        <FlatList
          data={filteredRentals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.forestGreen}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  searchWrap: { paddingTop: spacing.base },
  filterWrap: { paddingHorizontal: spacing.base, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: colors.sand },
  filterRow: { flexDirection: 'row', gap: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { borderBottomWidth: 2, borderBottomColor: colors.forestGreen },
  chipInactive: { borderBottomWidth: 2, borderBottomColor: 'transparent' },
  chipText: { fontFamily: fonts.body, fontSize: 13 },
  chipTextActive: { color: colors.forestGreen, fontWeight: '500' },
  chipTextInactive: { color: colors.warmGray },
  listContent: { paddingTop: 0, paddingBottom: 32 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.sand },
  itemName: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  itemSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  itemPlate: { fontFamily: fonts.data, color: colors.charcoal },
  itemDate: { marginTop: 4, fontFamily: fonts.data, fontSize: 13, color: colors.warmGray },
});
