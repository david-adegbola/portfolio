// shadcn/ui Toggle styles, aligned with Primer SegmentedControl segments: muted text at rest,
// state-hover on hover, the selected segment raised on the track (card surface + resting shadow).
import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '../../lib/utils.ts';

const toggleVariants = cva(
  [
    'inline-flex cursor-pointer items-center justify-center gap-2 font-sans text-sm font-medium whitespace-nowrap',
    'text-muted-foreground transition-[background-color,color,box-shadow] duration-150 ease-(--ease)',
    'hover:bg-(--state-hover) hover:text-foreground',
    'data-[state=on]:bg-(--state-selected) data-[state=on]:text-foreground data-[state=on]:shadow-resting data-[state=on]:ring-1 data-[state=on]:ring-border',
    'outline-none focus-visible:outline-(length:--focus-width) focus-visible:outline-offset-(--focus-offset) focus-visible:outline-ring focus-visible:outline-solid',
    'motion-safe:active:scale-[0.97]',
  ],
  {
    variants: {
      variant: { default: 'bg-transparent' },
      size: {
        default: 'h-8 min-w-8 px-3 pointer-coarse:h-11',
        sm: 'h-7 min-w-7 px-2 pointer-coarse:h-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Toggle({ className, variant, size, ...props }: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant, size }), 'rounded-md', className)} {...props} />;
}

export { Toggle, toggleVariants };
