// shadcn/ui Button, aligned with Primer Button (design-research/primer/foundations-ux.md §Buttons).
// Variant map: default = Primer primary (one per group), outline = Primer default,
// ghost = Primer invisible, link = inline text link. Sizes: Primer medium 32 / large 40, raised to
// 44px on touch screens (DESIGN.md §6.5). Focus: 2px ring token, outside the control.
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { cn } from '../../lib/utils.ts';

// No tailwind-merge here (it would add ~9 KB to the islands): every property is set by exactly one
// of base / variant / size, so classes never conflict. Need a different shape? Add a size.
const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center gap-2 rounded-md font-sans text-sm font-medium no-underline',
    'cursor-pointer transition-[background-color,border-color,color] duration-150 ease-(--ease)',
    'outline-none focus-visible:outline-(length:--focus-width) focus-visible:outline-offset-(--focus-offset) focus-visible:outline-ring focus-visible:outline-solid',
    'aria-disabled:cursor-default aria-disabled:opacity-60',
    'motion-safe:active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-card/70 text-foreground hover:bg-(--state-hover) hover:border-foreground/35 active:bg-(--state-active)',
        ghost: 'text-foreground hover:bg-(--state-hover) active:bg-(--state-active)',
        link: 'text-foreground underline decoration-primary decoration-1 underline-offset-[0.2em] hover:decoration-2',
      },
      size: {
        default: 'h-8 justify-center px-3 whitespace-nowrap pointer-coarse:h-11 pointer-coarse:px-4',
        lg: 'h-10 justify-center px-4 text-base whitespace-nowrap pointer-coarse:h-11',
        sm: 'h-8 justify-center px-2.5 whitespace-nowrap pointer-coarse:h-11 pointer-coarse:px-3.5',
        icon: 'size-10 justify-center pointer-coarse:size-11',
        /** Two-line buttons (label + title), e.g. previous / next in the panel. Align with a class. */
        pager: 'min-h-11 px-3 py-2.5',
        /** For the link variant: text-sized, no box (44px min height on touch). */
        inline: 'pointer-coarse:min-h-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
