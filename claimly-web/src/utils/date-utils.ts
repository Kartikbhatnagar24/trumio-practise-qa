import { format, isValid, parse } from "date-fns";

export const toIsoDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const fromTyped = (typed: string): string | null => {
  const parsed = parse(typed.trim(), "dd/MM/yyyy", new Date());
  return isValid(parsed) && /^\d{2}\/\d{2}\/\d{4}$/.test(typed.trim()) ? toIsoDate(parsed) : null;
};

export const toTyped = (iso: string): string => (iso ? format(parse(iso, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "");
