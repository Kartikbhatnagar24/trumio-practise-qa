import axios from "axios";

import { getVariant } from "@/configs/env";
import { Claim, ClaimFilters, ClaimForm, ClaimPage, Project } from "@/constraints/types/claim-types";
import { routes } from "@/utils/api";
import { parseClaim, parseClaimPage, toClaimPayload } from "@/utils/claim-parsing-utils";
import { keysToSnakeCase } from "@/utils/core-utils";

const listParams = (filters: ClaimFilters) => {
  const params = new URLSearchParams();
  Object.entries(keysToSnakeCase(filters)).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  });
  return params;
};

export const listClaims = async (filters: ClaimFilters): Promise<ClaimPage> => {
  const response = await axios.get(routes.claims.list, { params: listParams(filters) });
  return parseClaimPage(response.data, getVariant());
};

export const listApprovals = async (filters: ClaimFilters): Promise<ClaimPage> => {
  const response = await axios.get(routes.approvals, { params: listParams(filters) });
  return parseClaimPage(response.data, getVariant());
};

export const getClaim = async (id: number): Promise<Claim> => {
  const response = await axios.get(routes.claims.detail(id));
  return parseClaim(response.data, getVariant());
};

export const createClaim = async (form: ClaimForm): Promise<Claim> => {
  const response = await axios.post(routes.claims.list, toClaimPayload(form, getVariant()));
  return parseClaim(response.data, getVariant());
};

export const updateClaim = async (id: number, form: ClaimForm): Promise<Claim> => {
  const response = await axios.patch(routes.claims.detail(id), toClaimPayload(form, getVariant()));
  return parseClaim(response.data, getVariant());
};

export const deleteClaim = async (id: number): Promise<void> => {
  await axios.delete(routes.claims.detail(id));
};

export const uploadReceipt = async (id: number, file: File): Promise<Claim> => {
  const body = new FormData();
  body.append("file", file);
  const response = await axios.post(routes.claims.receipt(id), body);
  return parseClaim(response.data, getVariant());
};

export const submitClaim = async (id: number): Promise<Claim> => {
  const response = await axios.post(routes.claims.submit(id));
  return parseClaim(response.data, getVariant());
};

export const searchProjects = async (q: string): Promise<Project[]> => {
  const response = await axios.get(routes.projects, { params: { q } });
  return response.data;
};
