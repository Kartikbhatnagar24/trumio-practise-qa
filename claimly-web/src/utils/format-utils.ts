import { format, parseISO } from "date-fns";

import { Category, ClaimStatus, Currency } from "@/constraints/enums/claim-enums";

const RUPEES = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export const rupees = (value: string | number | null | undefined): string => (value === null || value === undefined || value === "" ? "—" : RUPEES.format(Number(value)));

export const money = (value: string, currency: Currency): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(value));

export const wholeRupees = (value: number): string => `₹${value.toLocaleString("en-IN")}`;

export const shortDate = (iso: string): string => format(parseISO(iso), "dd MMM yyyy");

export const dateTime = (iso: string): string => format(parseISO(iso), "dd MMM, HH:mm");

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.HOTEL]: "Hotel",
  [Category.MEALS]: "Meals",
  [Category.LOCAL_TRANSPORT]: "Local transport",
  [Category.AIRFARE]: "Airfare",
  [Category.CLIENT_ENTERTAINMENT]: "Client entertainment",
  [Category.OFFICE_SUPPLIES]: "Office supplies",
};

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: "Draft",
  [ClaimStatus.SUBMITTED]: "Submitted",
  [ClaimStatus.SENT_BACK]: "Sent back",
  [ClaimStatus.MANAGER_APPROVED]: "Manager approved",
  [ClaimStatus.FINANCE_APPROVED]: "Finance approved",
  [ClaimStatus.PAID]: "Paid",
  [ClaimStatus.REJECTED]: "Rejected",
};

export const STATUS_TONES: Record<ClaimStatus, { text: string; wash: string }> = {
  [ClaimStatus.DRAFT]: { text: "#5F6670", wash: "#F0F1F3" },
  [ClaimStatus.SUBMITTED]: { text: "#2C5A9E", wash: "#EAF1FB" },
  [ClaimStatus.SENT_BACK]: { text: "#9A5B13", wash: "#FBF2E6" },
  [ClaimStatus.MANAGER_APPROVED]: { text: "#2F7D5B", wash: "#E8F4EE" },
  [ClaimStatus.FINANCE_APPROVED]: { text: "#2F5D50", wash: "#E3EEE9" },
  [ClaimStatus.PAID]: { text: "#1E5A46", wash: "#DDEBE4" },
  [ClaimStatus.REJECTED]: { text: "#B3261E", wash: "#FBEAE9" },
};

export const initials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
