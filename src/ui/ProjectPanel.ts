/**
 * 2D detail panel. A native <dialog>: it traps focus, closes on Esc, and returns focus to the card.
 * Content comes from the pre-rendered <template id="detail-<id>"> elements. URLs are #p/<id> so
 * a project can be linked directly.
 */
export function initProjectPanel(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.panel');
  const content = dialog?.querySelector<HTMLElement>('.panel-content');
  if (!dialog || !content) return;

  const open = (id: string, push = true) => {
    const tpl = document.getElementById(`detail-${id}`) as HTMLTemplateElement | null;
    if (!tpl) return false;
    content.replaceChildren(tpl.content.cloneNode(true));
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('.panel-inner')!.scrollTop = 0;
    if (push && location.hash !== `#p/${id}`) history.pushState(null, '', `#p/${id}`);
    return true;
  };

  const idFromHash = () => /^#p\/([a-z0-9-]+)$/.exec(location.hash)?.[1];

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-open]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (open(link.dataset.open!)) event.preventDefault();
  });

  dialog.querySelector('.panel-close')!.addEventListener('click', () => dialog.close());
  // Click on the backdrop (outside the sheet) closes.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (idFromHash()) history.replaceState(null, '', location.pathname + location.search);
  });

  window.addEventListener('popstate', () => {
    const id = idFromHash();
    if (id) open(id, false);
    else if (dialog.open) dialog.close();
  });

  const initial = idFromHash();
  if (initial) open(initial, false);
}
