import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center font-body font-semibold text-[11px] uppercase tracking-wider rounded px-2 py-0.5 border',
  {
    variants: {
      variant: {
        default: 'bg-sage/10 text-sage border-transparent',
        success: 'bg-sage/10 text-sage border-transparent',
        secondary: 'bg-muted-foreground/10 text-muted-foreground border-transparent',
        destructive: 'bg-destructive/10 text-destructive border-transparent',
        warning: 'bg-amber-glow/10 text-amber-glow border-transparent',
        outline: 'border-border text-muted-foreground',
        info: 'bg-soft-teal/10 text-soft-teal border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
