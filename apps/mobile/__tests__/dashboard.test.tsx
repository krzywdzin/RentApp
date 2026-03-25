import React from 'react';
import { render } from '../src/test/test-utils';
import DashboardScreen from '../app/(tabs)/index';

jest.mock('@/hooks/use-rentals', () => ({
  useRentals: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      user: { name: 'Test User', email: 'test@test.pl', role: 'EMPLOYEE' },
      isAuthenticated: true,
      isLoading: false,
    };
    return selector(state);
  },
}));

jest.mock('@/lib/format', () => ({
  formatDate: () => '25.03.2026',
}));

describe('DashboardScreen', () => {
  it('renders without crash', () => {
    const { toJSON } = render(<DashboardScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows greeting text', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('dashboard.greeting')).toBeTruthy();
  });

  it('shows stat labels', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('dashboard.activeRentals')).toBeTruthy();
  });
});
