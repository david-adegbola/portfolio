// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectPanel } from '../src/islands/ProjectPanel.tsx';
import { SeasonSwitcher } from '../src/islands/Seasons.tsx';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  history.replaceState(null, '', '/');
  sessionStorage.clear();
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

describe('SeasonSwitcher', () => {
  it('hydrates without a mismatch and selects one season', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<SeasonSwitcher />);
    document.body.append(container);
    // Server markup: nothing selected, no caption.
    expect(container.querySelectorAll('[aria-checked="true"]').length).toBe(0);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(container, <SeasonSwitcher />);
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    const checked = container.querySelectorAll('[role="radio"][aria-checked="true"]');
    expect(checked.length).toBe(1);
    expect(container.querySelector('#season-caption')?.textContent).not.toBe('');
  });

  it('remembers a pick and announces it', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root!.render(<SeasonSwitcher />));
    const heard: string[] = [];
    document.addEventListener('season:change', (e) => heard.push((e as CustomEvent<string>).detail));
    const spring = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent?.startsWith('Spring'))!;
    await act(async () => spring.click());
    expect(spring.getAttribute('aria-checked')).toBe('true');
    expect(sessionStorage.getItem('season')).toBe('spring');
    expect(heard).toEqual(['spring']);
    expect(container.querySelector('#season-caption')?.textContent).toContain('Kevät');
  });
});
