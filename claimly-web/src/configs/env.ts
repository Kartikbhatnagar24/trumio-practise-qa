import { UiBug } from "@/constraints/enums/bug-enums";
import { CategoryPicker, ColumnOrder, DateInput, StepOrder, SubmitLabel } from "@/constraints/enums/variant-enums";
import { WebVariant } from "@/constraints/types/variant-types";
import { keysToCamelCase } from "@/utils/core-utils";

export const DEFAULT_VARIANT: WebVariant = {
  api: { claimsPath: "claims", amountField: "amount", merchantField: "merchant", dateField: "expense_date" },
  ui: {
    categoryPicker: CategoryPicker.SELECT,
    dateInput: DateInput.CALENDAR,
    submitLabel: SubmitLabel.SUBMIT_CLAIM,
    columnOrder: ColumnOrder.DATE_FIRST,
    stepOrder: StepOrder.DETAILS_FIRST,
  },
};

const runtimeEnv = (): Record<string, any> => (window as any).__ENV__ ?? {};

export const getVariant = (): WebVariant => {
  const variant = runtimeEnv().VARIANT;
  return variant ? keysToCamelCase(variant) : DEFAULT_VARIANT;
};

const KNOWN_UI_BUGS = new Set<string>(Object.values(UiBug));

export const getUiBugs = (): Set<UiBug> => new Set((runtimeEnv().UI_BUGS ?? []).filter((code: string) => KNOWN_UI_BUGS.has(code)));

export const hasUiBug = (bug: UiBug): boolean => getUiBugs().has(bug);
