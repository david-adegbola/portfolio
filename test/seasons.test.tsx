import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Treeline } from '../src/components/patterns/Treeline.tsx';
import { type Season, seasonForMonth, seasonInFinland } from '../src/seasons.ts';

const expected: Season[] = ['winter', 'winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'winter', 'winter'];

/** Runs index.html's head script against a fake <html> on a given date. */
function headScriptSeason(date: Date): string | undefined {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
  const root = { classList: { add() {} }, dataset: {} as Record<string, string> };
  const RealDate = Date;
  const FakeDate = function () {
    return new RealDate(date);
  } as unknown as DateConstructor;
  new Function('document', 'Date', script)({ documentElement: root }, FakeDate);
  return root.dataset.season;
}

describe('seasons', () => {
  it('maps months to Finnish seasons', () => {
    expect(expected.map((_, i) => seasonForMonth(i + 1))).toEqual(expected);
  });

  it('uses Helsinki time (31 Oct 23:30 UTC is already November there)', () => {
    expect(seasonInFinland(new Date(Date.UTC(2026, 9, 31, 23, 30)))).toBe('winter');
    expect(seasonInFinland(new Date(Date.UTC(2026, 9, 31, 12)))).toBe('autumn');
  });

  it('the head script in index.html agrees with seasonForMonth', () => {
    for (let m = 0; m < 12; m++) {
      expect(headScriptSeason(new Date(Date.UTC(2026, m, 15, 12)))).toBe(expected[m]);
    }
  });

  it('the treeline carries every season, is hidden from assistive tech and is the same every build', () => {
    const svg = renderToStaticMarkup(<Treeline />);
    expect(svg).toContain('aria-hidden="true"');
    for (const part of ['tl-snow', 'tl-drift', 'tl-leaves', 'tl-flowers', 'tl-fall']) expect(svg).toContain(part);
    expect(renderToStaticMarkup(<Treeline />)).toBe(svg);
    expect(renderToStaticMarkup(<Treeline seed={23} />)).not.toBe(svg);
  });
});
