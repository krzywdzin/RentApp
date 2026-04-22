import React from 'react';
import { render } from '../src/test/test-utils';
import CustomerStep from '../app/(tabs)/new-rental/index';

jest.mock('@/hooks/use-customers', () => ({
  useCustomerSearch: () => ({
    data: [],
    isLoading: false,
    isFetching: false,
  }),
  useCustomer: () => ({
    data: null,
  }),
  useCreateCustomer: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/stores/rental-draft.store', () => ({
  useRentalDraftStore: () => ({
    step: 0,
    customerId: null,
    customerName: null,
    vehicleId: null,
    vehicleLabel: null,
    startDate: null,
    endDate: null,
    dailyRateNet: null,
    rodoConsent: false,
    rodoTimestamp: null,
    signatures: [],
    setStep: jest.fn(),
    updateDraft: jest.fn(),
    clearDraft: jest.fn(),
  }),
  useRentalDraftHasHydrated: () => true,
}));

describe('CustomerStep', () => {
  it('renders without crash', () => {
    const { toJSON } = render(<CustomerStep />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows wizard step title', () => {
    const { getByText } = render(<CustomerStep />);
    expect(getByText('wizard.step1')).toBeTruthy();
  });

  it('shows new customer button', () => {
    const { getByText } = render(<CustomerStep />);
    expect(getByText('wizard.newCustomer')).toBeTruthy();
  });
});
