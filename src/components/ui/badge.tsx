// shadcn/ui Badge. Variants used here: `attention` (Primer attention role: "In progress") and
// `outline` (neutral labels). Mono, like the other metadata.
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { cn } from '../../lib/utils.ts';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs leading-tight tracking-wide whitespace-nowrap',
  {
    variants: {
      variant: {
        attention: 'border-attention/45 text-attention',
        outline: 'border-border text-muted-foreground',
        default: 'border-transparent bg-primary text-primary-foreground',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
);

function Badge({
  className,
  variant = 'outline',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
