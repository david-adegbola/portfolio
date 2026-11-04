// An image from the content, or nothing. A file that isn't in /public yet is left out entirely,
// never shown as an empty box; srcset copies that are missing are dropped one by one.
import type { Image } from '../../content/types.ts';

export function Picture({
  img,
  missing,
  sizes,
  className,
  eager,
  figure = true,
}: {
  img?: Image;
  missing: Set<string>;
  /** The `sizes` attribute: how wide the image shows, e.g. "(min-width: 64rem) 20rem, 100vw". */
  sizes: string;
  className?: string;
  /** Above the fold: load at once instead of lazily. */
  eager?: boolean;
  /** Wrap in <figure> (with the caption, if any). */
  figure?: boolean;
}) {
  if (!img || missing.has(img.src)) return null;
  const set = (img.srcset ?? []).filter((s) => !missing.has(s.src));
  const tag = (
    <img
      src={img.src}
      srcSet={set.length ? set.map((s) => `${s.src} ${s.width}w`).join(', ') : undefined}
      sizes={set.length ? sizes : undefined}
      alt={img.alt}
      width={img.width}
      height={img.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={figure ? undefined : className}
    />
  );
  if (!figure) return tag;
  return (
    <figure className={className}>
      {tag}
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}
