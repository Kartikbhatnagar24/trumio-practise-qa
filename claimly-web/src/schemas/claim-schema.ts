import { z } from "zod";

import { Category, Currency } from "@/constraints/enums/claim-enums";

export const claimSchema = z
  .object({
    category: z.custom<Category | "">((value) => value === "" || Object.values(Category).includes(value as Category)).refine((value): boolean => value !== "", "Pick a category."),
    currency: z.nativeEnum(Currency),
    amount: z
      .string()
      .trim()
      .min(1, "Enter the amount.")
      .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 1250.50.")
      .refine((value) => Number(value) > 0, "The amount must be more than zero."),
    merchant: z.string().trim().min(1, "Enter where you spent the money.").max(120, "Keep the merchant under 120 characters."),
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of the expense."),
    description: z.string().max(500, "Keep the description under 500 characters."),
    projectId: z.string().nullable(),
    nights: z.number().int().min(1, "Enter at least one night.").max(60, "Hotel claims cover up to 60 nights.").nullable(),
  })
  .superRefine((form, context) => {
    if (form.category === Category.HOTEL && !form.nights) context.addIssue({ code: z.ZodIssueCode.custom, path: ["nights"], message: "Enter the number of nights." });
  });

export type ClaimFormValues = z.infer<typeof claimSchema>;
