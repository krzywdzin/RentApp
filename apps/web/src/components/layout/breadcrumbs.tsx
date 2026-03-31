import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-sand mx-1" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  'font-body text-sm text-warm-gray hover:text-charcoal transition-colors',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-body text-sm',
                  isLast ? 'text-charcoal font-medium' : 'text-warm-gray',
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
