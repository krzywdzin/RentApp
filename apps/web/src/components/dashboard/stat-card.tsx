import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  tintClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  tintClassName,
}: StatCardProps) {
  return (
    <Card className={cn('shadow-inner-soft border border-sand rounded-md', tintClassName)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-body text-xs text-warm-gray">{title}</p>
          <p
            className={cn(
              'font-display font-semibold text-3xl leading-tight',
              variant === 'destructive' && Number(value) > 0
                ? 'text-terracotta'
                : 'text-forest-green',
            )}
          >
            {value}
          </p>
          <p className="font-body text-xs text-warm-gray">{subtitle}</p>
          </div>
          <Icon className="h-5 w-5 text-warm-gray" />
        </div>
      </CardContent>
    </Card>
  );
}
