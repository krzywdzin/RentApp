import React from 'react';
import { render } from '../src/test/test-utils';
import LoginScreen from '../app/login';

jest.mock('@/hooks/use-auth', () => ({
  useLogin: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe('LoginScreen', () => {
  it('renders without crash', () => {
    const { toJSON } = render(<LoginScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows email and password inputs', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Haslo')).toBeTruthy();
  });

  it('shows login button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Zaloguj')).toBeTruthy();
  });
});
