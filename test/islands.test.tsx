// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProjectPanel } from '../src/islands/ProjectPanel.tsx';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no layout, so no Element.scrollTo (the panel scrolls back to the top on prev / next).
Element.prototype.scrollTo ??= () => {};

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  history.replaceState(null, '', '/');
});

describe('ProjectPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a class="card-link" href="#p/upm" data-open="upm">UPM</a>
      <template id="detail-upm" data-title="UPM Kaukas pulp mill" data-eyebrow="2025" data-subtitle="Fitter"><p class="panel-summary">Summary text</p></template>
      <div id="panel-root"></div>`;
  });
  const mount = () => {
    root = createRoot(document.getElementById('panel-root')!);
    act(() => root!.render(<ProjectPanel />));
  };
  const dialog = () => document.querySelector('[role="dialog"]');

  it('opens on a card click, with the title as its name and the template content', () => {
    mount();
    act(() => document.querySelector<HTMLAnchorElement>('[data-open]')!.click());
    const d = dialog()!;
    expect(d).not.toBeNull();
    const labelledBy = d.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelledBy)?.textContent).toBe('UPM Kaukas pulp mill');
    expect(d.textContent).toContain('Summary text');
    expect(location.hash).toBe('#p/upm');
  });

  it('opens from a #p/ link on load, and Esc closes it and clears the hash', () => {
    history.replaceState(null, '', '/#p/upm');
    const events: string[] = [];
    document.addEventListener('panel:open', () => events.push('open'));
    document.addEventListener('panel:close', () => events.push('close'));
    mount();
    expect(dialog()).not.toBeNull();
    act(() => {
      dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(dialog()?.getAttribute('data-state') ?? 'closed').toBe('closed');
    expect(location.hash).toBe('');
    expect(events).toEqual(['open', 'close']);
  });

  it('steps to the next and previous project in page order, without closing', () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<template id="detail-kaukas" data-title="Second project"><p>Second body</p></template>',
    );
    history.replaceState(null, '', '/#p/upm');
    mount();
    const pager = () => document.querySelector('nav[aria-label="More projects"]')!;
    expect(pager().textContent).toContain('Next');
    expect(pager().textContent).not.toContain('Previous');
    act(() => pager().querySelector('button')!.click());
    expect(dialog()!.textContent).toContain('Second body');
    expect(location.hash).toBe('#p/kaukas');
    expect(pager().textContent).toContain('Previous');
    expect(pager().textContent).not.toContain('Next');
  });

  it('ignores links to projects without a panel', () => {
    document.body.insertAdjacentHTML('beforeend', '<a href="#p/none" data-open="none" id="dead">x</a>');
    mount();
    act(() => document.getElementById('dead')!.click());
    expect(dialog()).toBeNull();
  });
});
