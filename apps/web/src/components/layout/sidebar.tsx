'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarClock,
  FileText,
  Shield,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/', label: 'Pulpit', icon: LayoutDashboard },
  { href: '/pojazdy', label: 'Pojazdy', icon: Car },
  { href: '/klienci', label: 'Klienci', icon: Users },
  { href: '/wynajmy', label: 'Wynajmy', icon: CalendarClock },
  { href: '/umowy', label: 'Umowy', icon: FileText },
  { href: '/audyt', label: 'Audyt', icon: Shield },
  { href: '/uzytkownicy', label: 'Uzytkownicy', icon: UserCog },
];

const STORAGE_KEY = 'sidebar-collapsed';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const pathname = usePathname();

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex h-screen flex-col transition-all duration-[250ms] ease-out',
          collapsed ? 'w-14' : 'w-60',
        )}
        style={
          collapsed
            ? {
                backgroundColor: 'var(--color-forest-green)',
                backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 5px)`,
              }
            : undefined
        }
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sand px-4 bg-warm-stone',
            collapsed && 'justify-center border-b border-white/10',
            collapsed ? 'bg-transparent' : 'bg-warm-stone',
          )}
        >
          {!collapsed && (
            <span className="font-display font-semibold text-xl text-forest-green">KITEK</span>
          )}
          {collapsed && <span className="font-display font-semibold text-xl text-cream">K</span>}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 space-y-1 p-2', collapsed ? 'bg-transparent' : 'bg-warm-stone')}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150',
                  !collapsed && 'font-body font-medium text-charcoal rounded-r-md',
                  !collapsed && active
                    ? 'bg-forest-green text-cream border-l-[3px] border-l-forest-green rounded-r-md'
                    : !collapsed
                      ? 'hover:bg-sage-wash'
                      : undefined,
                  collapsed && 'justify-center px-0 rounded-md',
                  collapsed && active
                    ? 'bg-cream/20 rounded-md'
                    : collapsed
                      ? 'hover:bg-cream/10'
                      : undefined,
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    collapsed ? 'text-cream' : active ? 'text-cream' : 'text-charcoal',
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        {/* Quick Pulse (expanded only) */}
        {!collapsed && (
          <div className="bg-warm-stone border-t border-sand mt-auto pt-3 px-3 pb-2">
            <p className="text-xs text-warm-gray font-body mb-2 uppercase tracking-wider">
              Quick Pulse
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-warm-gray font-body">Aktywne wynajmy</div>
                <div className="text-sm font-data text-forest-green">—</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-warm-gray font-body">Pojazdy wolne</div>
                <div className="text-sm font-data text-forest-green">—</div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div
          className={cn('p-2', collapsed ? 'bg-transparent' : 'bg-warm-stone border-t border-sand')}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-full',
              collapsed
                ? 'text-cream hover:text-cream/80 hover:bg-cream/10'
                : 'text-warm-gray hover:text-charcoal',
            )}
            onClick={toggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
