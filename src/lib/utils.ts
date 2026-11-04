import { type ClassValue, clsx } from 'clsx';

/**
 * shadcn/ui's class helper, without tailwind-merge: the islands chunk is ~9 KB lighter, and the
 * components are written so classes never conflict (each property comes from one place; see
 * components/ui/button.tsx). Don't pass a class that overrides a variant's: add a variant instead.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
