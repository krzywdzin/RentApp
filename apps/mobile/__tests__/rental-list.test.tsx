import React from 'react';
import { render } from '../src/test/test-utils';
import RentalsListScreen from '../app/(tabs)/rentals/index';

jest.mock('@/hooks/use-rentals', () => ({
  useRentals: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

describe('RentalsListScreen', () => {
  it('renders without crash', () => {
    const { toJSON } = render(<RentalsListScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows empty state when no rentals', () => {
    const { getByText } = render(<RentalsListScreen />);
    expect(getByText('empty.noRentals')).toBeTruthy();
  });

  it('shows search bar', () => {
    const { getByText } = render(<RentalsListScreen />);
    expect(getByText('rentals.filterAll')).toBeTruthy();
  });
});
