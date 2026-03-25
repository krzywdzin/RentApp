import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock lucide-react -- all icon components return a simple span
// We list all icons used across the codebase to avoid "No export defined" errors
vi.mock('lucide-react', () => {
  const iconNames = [
    'CalendarClock', 'Car', 'Clock', 'AlertTriangle', 'Plus', 'Download',
    'ChevronLeft', 'ChevronRight', 'ChevronDown', 'ChevronUp',
    'ChevronDownIcon', 'ChevronLeftIcon', 'ChevronRightIcon',
    'ArrowDown', 'ArrowUp', 'ArrowUpDown', 'ArrowLeft',
    'Check', 'Circle', 'X', 'Search', 'Eye', 'Pencil',
    'MoreHorizontal', 'LogOut', 'Loader2', 'FileDown', 'FileText',
    'Image', 'CalendarIcon',
  ];

  const mocks: Record<string, unknown> = {};
  for (const name of iconNames) {
    const fn = () => null;
    fn.displayName = name;
    mocks[name] = fn;
  }
  return mocks;
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    const { createElement } = require('react');
    return createElement('a', { href, ...props }, children);
  },
}));
