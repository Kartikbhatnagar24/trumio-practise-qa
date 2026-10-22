import { Claim, ClaimForm, ClaimPage } from "@/constraints/types/claim-types";
import { WebVariant } from "@/constraints/types/variant-types";
import { keysToCamelCase } from "@/utils/core-utils";

const canonicalNames = (variant: WebVariant): Record<string, string> => ({
  [variant.api.amountField]: "amount",
  [variant.api.merchantField]: "merchant",
  [variant.api.dateField]: "expense_date",
});

export const parseClaim = (raw: Record<string, any>, variant: WebVariant): Claim => {
  const names = canonicalNames(variant);
  const canonical = Object.fromEntries(Object.entries(raw).map(([key, value]) => [names[key] ?? key, value]));
  return keysToCamelCase(canonical);
};

export const parseClaimPage = (raw: Record<string, any>, variant: WebVariant): ClaimPage => ({
  items: (raw.items ?? []).map((item: Record<string, any>) => parseClaim(item, variant)),
  total: raw.total,
  page: raw.page,
  pageSize: raw.page_size,
});

export const toClaimPayload = (form: ClaimForm, variant: WebVariant): Record<string, any> => ({
  category: form.category,
  currency: form.currency,
  [variant.api.amountField]: form.amount,
  [variant.api.merchantField]: form.merchant,
  [variant.api.dateField]: form.expenseDate,
  description: form.description,
  project_id: form.projectId,
  nights: form.nights,
});
