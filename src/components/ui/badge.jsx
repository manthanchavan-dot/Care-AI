import { cn } from '@/lib/utils';

const toneMap = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-rose-100 text-rose-700',
  default: 'bg-secondary text-secondary-foreground',
};

export function Badge({ className, tone = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneMap[tone] ?? toneMap.default,
        className
      )}
      {...props}
    />
  );
}
