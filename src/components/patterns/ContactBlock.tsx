// The closing contact prompt (flows/contact.md): one direct question, the email large, then the
// two actions (Email primary, CV) and the other links.
import type { Link } from '../../content/types.ts';
import { buttonVariants } from '../ui/button.tsx';
import { Rings } from './Rings.tsx';

export function ContactBlock(p: { heading: string; text?: string; email: string; cv?: string; location?: string; links: Link[] }) {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-h">
      <div className="section-head">
        <Rings count={4} seed={41} className="rings--mark" />
        <h2 className="section-title" id="contact-h" tabIndex={-1}>
          {p.heading}
        </h2>
      </div>
      {p.text && <p className="contact-text">{p.text}</p>}
      <p className="contact-email">
        <a href={`mailto:${p.email}`}>{p.email}</a>
      </p>
      <p className="contact-actions">
        <a className={buttonVariants({ size: 'lg' })} href={`mailto:${p.email}`}>
          Email me
        </a>
        {p.cv && (
          <a className={buttonVariants({ variant: 'outline', size: 'lg' })} href={p.cv} target="_blank" rel="noopener">
            Open my CV (PDF)
          </a>
        )}
        {p.links.map((l) => (
          <a key={l.href} className={buttonVariants({ variant: 'link', size: 'inline' })} href={l.href} target="_blank" rel="noopener">
            {l.label}
          </a>
        ))}
      </p>
      {p.location && <p className="contact-location">{p.location}</p>}
    </section>
  );
}
