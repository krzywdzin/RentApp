import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import DashboardPage from '../page';

// Mock hooks
const mockUseVehicles = vi.fn();
const mockUseRentals = vi.fn();

vi.mock('@/hooks/queries/use-vehicles', () => ({
  useVehicles: (...args: unknown[]) => mockUseVehicles(...args),
}));

vi.mock('@/hooks/queries/use-rentals', () => ({
  useRentals: (...args: unknown[]) => mockUseRentals(...args),
}));

// Mock ActivityFeed to isolate dashboard tests
vi.mock('@/components/dashboard/activity-feed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when data is loading', () => {
    mockUseVehicles.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseRentals.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Pulpit')).toBeInTheDocument();
    // Loading state renders 4 skeleton cards
    const skeletons = document.querySelectorAll('.h-\\[120px\\]');
    expect(skeletons.length).toBe(4);
  });

  it('renders stat cards with data', () => {
    mockUseVehicles.mockReturnValue({
      data: [
        { id: 'v1', status: 'AVAILABLE', registration: 'ABC123' },
        { id: 'v2', status: 'RENTED', registration: 'DEF456' },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseRentals.mockReturnValue({
      data: [{ id: 'r1', status: 'ACTIVE', startDate: '2026-01-01', endDate: '2026-12-31' }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Aktywne wynajmy')).toBeInTheDocument();
    expect(screen.getByText('Dostepne pojazdy')).toBeInTheDocument();
    expect(screen.getByText('Dzisiejsze zwroty')).toBeInTheDocument();
    expect(screen.getByText('Przeterminowane')).toBeInTheDocument();
    // 1 active rental
    expect(screen.getByText('1 pojazdow w uzyciu')).toBeInTheDocument();
    // 1 available out of 2
    expect(screen.getByText('1 z 2 w flocie')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const refetchVehicles = vi.fn();
    const refetchRentals = vi.fn();

    mockUseVehicles.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchVehicles,
    });
    mockUseRentals.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchRentals,
    });

    render(<DashboardPage />);

    expect(screen.getByText(/Nie udalo sie zaladowac danych/)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Ponow/i });
    expect(retryButton).toBeInTheDocument();

    retryButton.click();
    expect(refetchVehicles).toHaveBeenCalled();
    expect(refetchRentals).toHaveBeenCalled();
  });
});
