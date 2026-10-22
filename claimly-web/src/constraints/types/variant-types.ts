import { CategoryPicker, ColumnOrder, DateInput, StepOrder, SubmitLabel } from "@/constraints/enums/variant-enums";

export interface ApiNames {
  claimsPath: string;
  amountField: string;
  merchantField: string;
  dateField: string;
}

export interface UiOptions {
  categoryPicker: CategoryPicker;
  dateInput: DateInput;
  submitLabel: SubmitLabel;
  columnOrder: ColumnOrder;
  stepOrder: StepOrder;
}

export interface WebVariant {
  api: ApiNames;
  ui: UiOptions;
}
