// shadcn/ui ToggleGroup, styled as a Primer SegmentedControl: a muted track holding the segments.
// Radix gives single-select groups radio semantics and arrow-key roving focus (APG radio group).
import type { VariantProps } from 'class-variance-authority';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type * as React from 'react';
import { toggleVariants } from './toggle.tsx';
import { cn } from '../../lib/utils.ts';

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex w-full items-center gap-0.5 rounded-lg bg-muted p-0.5', className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, size, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" className={cn(toggleVariants({ size }), 'flex-1', className)} {...props} />;
}

export { ToggleGroup, ToggleGroupItem };
