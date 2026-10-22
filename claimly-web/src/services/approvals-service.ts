import axios from "axios";

import { getVariant } from "@/configs/env";
import { Claim } from "@/constraints/types/claim-types";
import { routes } from "@/utils/api";
import { parseClaim } from "@/utils/claim-parsing-utils";

export const approveClaim = async (id: number, approvedAmount: string | null, comment: string | null): Promise<Claim> => {
  const body: Record<string, string> = {};
  if (approvedAmount) body.approved_amount = approvedAmount;
  if (comment) body.comment = comment;
  const response = await axios.post(routes.claims.approve(id), body);
  return parseClaim(response.data, getVariant());
};

export const sendBackClaim = async (id: number, comment: string): Promise<Claim> => {
  const response = await axios.post(routes.claims.sendBack(id), { comment });
  return parseClaim(response.data, getVariant());
};

export const rejectClaim = async (id: number, comment: string): Promise<Claim> => {
  const response = await axios.post(routes.claims.reject(id), { comment });
  return parseClaim(response.data, getVariant());
};

export const payClaim = async (id: number): Promise<Claim> => {
  const response = await axios.post(routes.claims.pay(id));
  return parseClaim(response.data, getVariant());
};
