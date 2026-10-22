import { afterEach, describe, expect, it } from 'vitest';

import { getUiBugs } from '@/configs/env';
import * as UiBug from '@/constraints/enums/bug-enums';
import { Currency } from '@/constraints/enums/claim-enums';
import { toInr } from '@/components/claims/ClaimSummary';
import { toIsoDate } from '@/utils/date-utils';

const POLICY = { rules: {} as any, currencyRates: { INR: '1.00', USD: '83.25', EUR: '90.10', GBP: '105.40' } };

const withBugs = (codes: string[]) => {
  (window as any).__ENV__ = { UI_BUGS: codes };
};

afterEach(() => {
  delete (window as any).__ENV__;
});

describe('bug module', () => {
  it('exports no object that maps readable names to codes', async () => {
    const exported = Object.values(await import('@/constraints/enums/bug-enums'));
    expect(exported.some((value) => value !== null && typeof value === 'object' && !Array.isArray(value))).toBe(false);
  });
});

describe('getUiBugs', () => {
  it('reads only known codes', () => {
    withBugs(['s2h7', 'zzzz', 'q7m2']);
    expect([...getUiBugs()]).toEqual([UiBug.DATE_SHIFTS_DAY]);
  });

  it('is empty when the container sets nothing', () => {
    expect(getUiBugs().size).toBe(0);
  });
});

describe('toIsoDate', () => {
  const lateEveningIst = new Date('2026-06-15T00:00:00+05:30');

  it('keeps the local day', () => {
    expect(toIsoDate(lateEveningIst)).toBe('2026-06-15');
  });

  it('shifts to UTC when the date bug is on', () => {
    withBugs([UiBug.DATE_SHIFTS_DAY]);
    expect(toIsoDate(lateEveningIst)).toBe('2026-06-14');
  });
});

describe('toInr', () => {
  it('rounds to the paisa', () => {
    expect(toInr('10.005', Currency.USD, POLICY as any)).toBe(832.92);
  });

  it('shows the raw product when the summary bug is on', () => {
    withBugs([UiBug.SUMMARY_UNROUNDED]);
    expect(toInr('10.005', Currency.USD, POLICY as any)).toBeCloseTo(832.91625, 5);
  });
});
