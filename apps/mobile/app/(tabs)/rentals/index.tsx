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
      <AppCard
        cardStyle={s.itemCard}
        onPress={() => router.push(`/rentals/${item.id}`)}
      >
        <View style={s.itemRow}>
          <View style={s.flex1}>
            <Text style={s.itemName}>
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            <Text style={s.itemSub}>
              {item.vehicle.registration} {item.vehicle.make}{' '}
              {item.vehicle.model}
            </Text>
            <Text style={s.itemSub}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </AppCard>
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#2563EB"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchWrap: { paddingTop: 16 },
  filterWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  chip: { borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: '#3B82F6' },
  chipInactive: { backgroundColor: '#F4F4F5' },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  chipTextInactive: { color: '#18181B' },
  listContent: { paddingTop: 8, paddingBottom: 32 },
  itemCard: { marginHorizontal: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  itemSub: { marginTop: 4, fontSize: 13, color: '#71717A' },
});
