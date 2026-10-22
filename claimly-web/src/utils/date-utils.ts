import { format, isValid, parse } from "date-fns";

import { hasUiBug } from "@/configs/env";
import * as UiBug from "@/constraints/enums/bug-enums";

export const toIsoDate = (date: Date): string => (hasUiBug(UiBug.DATE_SHIFTS_DAY) ? date.toISOString().slice(0, 10) : format(date, "yyyy-MM-dd"));

export const fromTyped = (typed: string): string | null => {
  const parsed = parse(typed.trim(), "dd/MM/yyyy", new Date());
  return isValid(parsed) && /^\d{2}\/\d{2}\/\d{4}$/.test(typed.trim()) ? toIsoDate(parsed) : null;
};

export const toTyped = (iso: string): string => (iso ? format(parse(iso, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "");
