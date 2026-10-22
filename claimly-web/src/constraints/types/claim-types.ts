import { Category, ClaimStatus, Currency, Role } from "@/constraints/enums/claim-enums";

export interface PersonRef {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
}

export interface Receipt {
  filename: string;
  size: number;
  contentType: string;
}

export interface ClaimEvent {
  actor: PersonRef;
  action: string;
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus;
  comment: string | null;
  amountInr: string | null;
  at: string;
}

export interface Claim {
  id: number;
  status: ClaimStatus;
  category: Category;
  currency: Currency;
  amount: string;
  merchant: string;
  expenseDate: string;
  description: string;
  project: Project | null;
  nights: number | null;
  amountInr: string;
  approvedAmountInr: string | null;
  receipt: Receipt | null;
  employee: PersonRef;
  createdAt: string;
  submittedAt: string | null;
  events: ClaimEvent[];
}

export interface ClaimForm {
  category: Category | "";
  currency: Currency;
  amount: string;
  merchant: string;
  expenseDate: string;
  description: string;
  projectId: string | null;
  nights: number | null;
}

export interface ClaimPage {
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClaimFilters {
  q?: string;
  status?: ClaimStatus[];
  category?: Category | "";
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade: "G1" | "G2" | "G3";
  department: string;
  managerId: string | null;
}

export interface PolicyRules {
  hotelNightlyLimit: number;
  mealCapByGrade: Record<"G1" | "G2" | "G3", number>;
  maxClaimAgeDays: number;
  receiptRequiredFrom: number;
  managerApprovalLimit: number;
}

export interface Policy {
  rules: PolicyRules;
  currencyRates: Record<Currency, string>;
}

export interface FieldIssue {
  field: string;
  message: string;
  code?: string;
}
