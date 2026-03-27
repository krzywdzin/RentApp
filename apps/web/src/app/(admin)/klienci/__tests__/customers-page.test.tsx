import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { CustomersPage } from '../customers-page';

// Mock hooks
const mockUseCustomers = vi.fn();
const mockUseArchiveCustomer = vi.fn();

vi.mock('@/hooks/queries/use-customers', () => ({
  useCustomers: (...args: unknown[]) => mockUseCustomers(...args),
  useArchiveCustomer: (...args: unknown[]) => mockUseArchiveCustomer(...args),
}));

// Mock @rentapp/shared
vi.mock('@rentapp/shared', () => ({}));

// Mock sub-components
vi.mock('../columns', () => ({
  getCustomerColumns: () => [
    {
      id: 'firstName',
      accessorKey: 'firstName',
      header: 'Imie',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
    {
      id: 'lastName',
      accessorKey: 'lastName',
      header: 'Nazwisko',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ getValue }: { getValue: () => string }) => getValue(),
    },
  ],
}));

vi.mock('../filter-bar', () => ({
  CustomerFilterBar: (_props: Record<string, unknown>) => (
    <div data-testid="customer-filter-bar">Filters</div>
  ),
}));

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseArchiveCustomer.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading state with skeletons', () => {
    mockUseCustomers.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<CustomersPage />);

    expect(screen.getByText('Klienci')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.h-5');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders customer table with data', () => {
    mockUseCustomers.mockReturnValue({
      data: [
        {
          id: 'c1',
          firstName: 'Anna',
          lastName: 'Nowak',
          email: 'anna@test.pl',
          phone: '123456789',
        },
        {
          id: 'c2',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: 'jan@test.pl',
          phone: '987654321',
        },
      ],
      isLoading: false,
    });

    render(<CustomersPage />);

    expect(screen.getByText('Klienci')).toBeInTheDocument();
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Nowak')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Kowalski')).toBeInTheDocument();
  });

  it('renders empty state when no customers', () => {
    mockUseCustomers.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<CustomersPage />);

    expect(screen.getByText('Brak klientow')).toBeInTheDocument();
  });
});
