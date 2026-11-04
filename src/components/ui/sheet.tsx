// shadcn/ui Sheet (Radix Dialog), aligned with Primer Dialog: side sheet on the right on wide
// screens, full screen on narrow; title is the accessible name; close button top right; Esc closes;
// focus returns to the trigger; only the body scrolls. Open/close motion is in styles.css
// ([data-slot=sheet-*]) so reduced motion is honoured in one place.
import { Dialog as SheetPrimitive } from 'radix-ui';
import type * as React from 'react';
import { IconClose } from '../icons.tsx';
import { cn } from '../../lib/utils.ts';

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return <SheetPrimitive.Overlay data-slot="sheet-overlay" className={cn('fixed inset-0 z-50 bg-overlay', className)} {...props} />;
}

function SheetContent({
  className,
  children,
  closeLabel = 'Close',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { closeLabel?: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-card text-card-foreground shadow-floating outline-none',
          'sm:w-[min(36rem,100%)] sm:border-l sm:border-border',
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Close
          className={cn(
            'absolute top-4 right-4 z-10 grid size-10 cursor-pointer place-items-center rounded-full bg-card text-foreground pointer-coarse:size-11',
            'hover:bg-(--state-hover) active:bg-(--state-active)',
            'outline-none focus-visible:outline-(length:--focus-width) focus-visible:outline-offset-(--focus-offset) focus-visible:outline-ring focus-visible:outline-solid',
          )}
          aria-label={closeLabel}
        >
          <IconClose />
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={className} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={className} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle };
