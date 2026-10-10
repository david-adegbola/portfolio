/**
 * 2D detail panel. A native <dialog>: it traps focus, closes on Esc, and returns focus to the card.
 * Content comes from the pre-rendered <template id="detail-<id>"> elements. URLs are #p/<id> so
 * a project can be linked directly.
 */
export function initProjectPanel(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.panel');
  const content = dialog?.querySelector<HTMLElement>('.panel-content');
  if (!dialog || !content) return;

  // Our own open flag, so cleanup runs exactly once however the panel closes (button, backdrop,
  // Back, or Esc via the native close event, which browsers may deliver late).
  let isOpen = false;

  const open = (id: string, push = true) => {
    const tpl = document.getElementById(`detail-${id}`) as HTMLTemplateElement | null;
    if (!tpl) return false;
    content.replaceChildren(tpl.content.cloneNode(true));
    if (!dialog.open) dialog.showModal();
    if (!isOpen) {
      isOpen = true;
      document.dispatchEvent(new Event('panel:open'));
    }
    dialog.querySelector<HTMLElement>('.panel-inner')!.scrollTop = 0;
    if (push && location.hash !== `#p/${id}`) history.pushState(null, '', `#p/${id}`);
    return true;
  };

  const idFromHash = () => /^#p\/([a-z0-9-]+)$/.exec(location.hash)?.[1];

  const onClosed = () => {
    if (!isOpen) return;
    isOpen = false;
    document.dispatchEvent(new Event('panel:close'));
    if (idFromHash()) history.replaceState(null, '', location.pathname + location.search);
  };
  const close = () => {
    if (dialog.open) dialog.close();
    onClosed();
  };

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-open]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (open(link.dataset.open!)) event.preventDefault();
  });

  dialog.querySelector('.panel-close')!.addEventListener('click', close);
  // Click on the backdrop (outside the sheet) closes.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('cancel', onClosed); // Esc, fired before the (queued) close event
  dialog.addEventListener('close', onClosed);

  window.addEventListener('popstate', () => {
    const id = idFromHash();
    if (id) open(id, false);
    else close();
  });

  const initial = idFromHash();
  if (initial) open(initial, false);
}
