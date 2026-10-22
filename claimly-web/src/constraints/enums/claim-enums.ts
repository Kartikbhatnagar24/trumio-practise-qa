export enum ClaimStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  SENT_BACK = "SENT_BACK",
  MANAGER_APPROVED = "MANAGER_APPROVED",
  FINANCE_APPROVED = "FINANCE_APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
}

export enum Category {
  HOTEL = "HOTEL",
  MEALS = "MEALS",
  LOCAL_TRANSPORT = "LOCAL_TRANSPORT",
  AIRFARE = "AIRFARE",
  CLIENT_ENTERTAINMENT = "CLIENT_ENTERTAINMENT",
  OFFICE_SUPPLIES = "OFFICE_SUPPLIES",
}

export enum Currency {
  INR = "INR",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
}

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  FINANCE_ADMIN = "FINANCE_ADMIN",
}

export enum SortKey {
  DATE = "date",
  DATE_DESC = "-date",
  AMOUNT = "amount",
  AMOUNT_DESC = "-amount",
  SUBMITTED = "submitted",
  SUBMITTED_DESC = "-submitted",
}
