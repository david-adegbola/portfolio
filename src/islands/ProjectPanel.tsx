// Project detail panel: a shadcn Sheet (Radix Dialog) on the client. The content is pre-rendered
// at build time into <template id="detail-<id>"> elements (see components/Page.tsx), so the words
// stay in the HTML and markdown never ships to the browser. URLs are #p/<id> so a project can be
// linked directly; Back closes it. Fires panel:open / panel:close.
import { useCallback, useEffect, useState } from 'react';
import { IconNext, IconPrev } from '../components/icons.tsx';
import { Button } from '../components/ui/button.tsx';
import { Sheet, SheetContent, SheetTitle } from '../components/ui/sheet.tsx';

const idFromHash = () => /^#p\/([a-z0-9-]+)$/.exec(location.hash)?.[1] ?? null;
const templateFor = (id: string | null) => (id ? (document.getElementById(`detail-${id}`) as HTMLTemplateElement | null) : null);
/** The hash's project, if it has a panel. */
const linkedProject = () => {
  const id = idFromHash();
  return templateFor(id) ? id : null;
};

export function ProjectPanel() {
  // `open` is the project on screen; `shown` lags behind on close so the content stays while the
  // sheet animates out. This root is client-only (no server markup), so reading the URL is safe.
  const [open, setOpen] = useState<string | null>(linkedProject);
  const [shown, setShown] = useState<string | null>(open);

  const show = useCallback((id: string) => {
    setOpen(id);
    setShown(id);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    if (idFromHash()) history.replaceState(null, '', location.pathname + location.search);
  }, []);

  // Cards (and any other `a[data-open]`) open the panel; Back and Forward follow the URL.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-open]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const id = link.dataset.open!;
      if (!templateFor(id)) return;
      event.preventDefault();
      show(id);
      if (location.hash !== `#p/${id}`) history.pushState(null, '', `#p/${id}`);
    };
    const onPop = () => {
      const id = linkedProject();
      if (id) show(id);
      else setOpen(null);
    };
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    // main.ts stops pre-handling card clicks once the panel is listening.
    document.dispatchEvent(new Event('panel:ready'));
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, [show]);

  // Tell the page when the panel opens and closes.
  const isOpen = open !== null;
  useEffect(() => {
    document.dispatchEvent(new Event(isOpen ? 'panel:open' : 'panel:close'));
  }, [isOpen]);

  const tpl = templateFor(shown);
  const body = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && tpl) node.replaceChildren(tpl.content.cloneNode(true));
    },
    [tpl],
  );

  // Previous / next follow page order (the templates are rendered in it), so visitors can read on
  // without closing the panel (audit X7).
  const order = [...document.querySelectorAll<HTMLTemplateElement>('template[id^="detail-"]')];
  const at = order.findIndex((t) => t === tpl);
  const neighbour = (step: number) => (at >= 0 ? order[at + step] : undefined);
  const prev = neighbour(-1);
  const next = neighbour(1);
  const go = (t: HTMLTemplateElement) => {
    const id = t.id.slice('detail-'.length);
    show(id);
    history.replaceState(null, '', `#p/${id}`);
    document.querySelector('[data-slot="sheet-content"] .panel-inner')?.scrollTo({ top: 0 });
    // Land on the new title, so it's announced and focus isn't lost if the button disappears.
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-slot="sheet-title"]')?.focus());
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent aria-describedby={undefined}>
        <div className="panel-inner">
          {tpl && (
            <header className="panel-header">
              {tpl.dataset.eyebrow && <p className="eyebrow">{tpl.dataset.eyebrow}</p>}
              <SheetTitle className="panel-title" tabIndex={-1} lang={tpl.dataset.lang || undefined}>
                {tpl.dataset.title}
              </SheetTitle>
              {tpl.dataset.subtitle && <p className="panel-subtitle">{tpl.dataset.subtitle}</p>}
            </header>
          )}
          <div ref={body} />
          {(prev || next) && (
            <nav className="panel-pager" aria-label="More projects">
              {prev ? (
                <Button variant="outline" size="pager" className="panel-pager-prev justify-start text-left" onClick={() => go(prev)}>
                  <IconPrev />
                  <span>
                    <span className="panel-pager-label">Previous</span>
                    <span className="panel-pager-title" lang={prev.dataset.lang || undefined}>
                      {prev.dataset.title}
                    </span>
                  </span>
                </Button>
              ) : (
                <span />
              )}
              {next && (
                <Button variant="outline" size="pager" className="panel-pager-next justify-end" onClick={() => go(next)}>
                  <span>
                    <span className="panel-pager-label">Next</span>
                    <span className="panel-pager-title" lang={next.dataset.lang || undefined}>
                      {next.dataset.title}
                    </span>
                  </span>
                  <IconNext />
                </Button>
              )}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
