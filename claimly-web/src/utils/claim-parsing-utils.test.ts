import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_VARIANT, getVariant } from '@/configs/env';
import { Category, Currency } from '@/constraints/enums/claim-enums';
import { WebVariant } from '@/constraints/types/variant-types';
import { parseClaim, toClaimPayload } from '@/utils/claim-parsing-utils';

const ALTERNATE: WebVariant = {
  api: { claimsPath: 'expenses', amountField: 'claim_amount', merchantField: 'vendor', dateField: 'spent_on' },
  ui: { categoryPicker: 'combobox', dateInput: 'typed', submitLabel: 'send_for_approval', columnOrder: 'amount_first', stepOrder: 'receipt_first' },
} as WebVariant;

const RAW = {
  id: 10021,
  status: 'SUBMITTED',
  category: 'MEALS',
  currency: 'USD',
  claim_amount: '12.50',
  vendor: 'Shake Shack',
  spent_on: '2026-06-10',
  description: 'Lunch',
  project: { id: 'p-atlas', code: 'PRJ-ATLAS', name: 'Atlas Payments Migration' },
  nights: null,
  amount_inr: '1040.63',
  approved_amount_inr: null,
  receipt: null,
  employee: { id: 'u-asha', name: 'Asha Verma' },
  created_at: '2026-06-10T09:00:00+00:00',
  submitted_at: null,
  events: [{ actor: { id: 'u-asha', name: 'Asha Verma' }, action: 'submit', from_status: 'DRAFT', to_status: 'SUBMITTED', comment: null, amount_inr: null, at: '2026-06-10T09:00:00+00:00' }],
};

afterEach(() => {
  delete (window as any).__ENV__;
});

describe('parseClaim', () => {
  it('maps variant field names to the canonical claim', () => {
    const claim = parseClaim(RAW, ALTERNATE);
    expect(claim.amount).toBe('12.50');
    expect(claim.merchant).toBe('Shake Shack');
    expect(claim.expenseDate).toBe('2026-06-10');
    expect(claim.amountInr).toBe('1040.63');
    expect(claim.events[0].toStatus).toBe('SUBMITTED');
  });
});

describe('toClaimPayload', () => {
  it('writes the variant field names in snake case', () => {
    const payload = toClaimPayload(
      { category: Category.MEALS, currency: Currency.USD, amount: '12.50', merchant: 'Shake Shack', expenseDate: '2026-06-10', description: 'Lunch', projectId: 'p-atlas', nights: null },
      ALTERNATE,
    );
    expect(payload).toEqual({ category: 'MEALS', currency: 'USD', claim_amount: '12.50', vendor: 'Shake Shack', spent_on: '2026-06-10', description: 'Lunch', project_id: 'p-atlas', nights: null });
  });
});

describe('getVariant', () => {
  it('falls back to the default when the container sets nothing', () => {
    expect(getVariant()).toEqual(DEFAULT_VARIANT);
  });

  it('reads the runtime variant written by the container', () => {
    (window as any).__ENV__ = {
      VARIANT: {
        api: { claims_path: 'expenses', amount_field: 'claim_amount', merchant_field: 'vendor', date_field: 'spent_on' },
        ui: { category_picker: 'combobox', date_input: 'typed', submit_label: 'send_for_approval', column_order: 'amount_first', step_order: 'receipt_first' },
      },
    };
    expect(getVariant()).toEqual(ALTERNATE);
  });
});
