import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm',
};

const sizes = {
  default: 'h-11 px-6 text-sm',
  sm: 'h-9 px-4 text-sm',
  lg: 'h-12 px-8 text-base',
  icon: 'h-10 w-10',
};

export const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
