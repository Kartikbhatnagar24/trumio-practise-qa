import axios from "axios";

import { FieldIssue } from "@/constraints/types/claim-types";

export const errorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.message) return detail[0].message;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return fallback;
};

export const fieldIssues = (error: unknown): FieldIssue[] => {
  if (!axios.isAxiosError(error) || !Array.isArray(error.response?.data?.detail)) return [];
  return error.response.data.detail.map((item: any) => ({
    field: item.field ?? (Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : ""),
    message: item.message ?? item.msg,
    code: item.code,
  }));
};
