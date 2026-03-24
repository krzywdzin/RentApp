import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
        className="mx-4 mb-3"
        onPress={() => router.push(`/rentals/${item.id}`)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-zinc-900">
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {item.vehicle.registration} {item.vehicle.make}{' '}
              {item.vehicle.model}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
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
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 px-4 pt-4">
          <LoadingSkeleton variant="list-item" count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Search */}
      <View className="pt-4">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('rentals.search')}
        />
      </View>

      {/* Filter Chips */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                className={`rounded-full px-4 py-2 ${
                  isActive ? 'bg-blue-600' : 'bg-zinc-100'
                }`}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text
                  className={`text-[13px] font-medium ${
                    isActive ? 'text-white' : 'text-zinc-900'
                  }`}
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
          contentContainerClassName="pt-2 pb-8"
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
