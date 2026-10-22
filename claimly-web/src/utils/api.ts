import { getVariant } from "@/configs/env";

export const API_BASE = "./api";

const claims = `${API_BASE}/${getVariant().api.claimsPath}`;

export const routes = {
  auth: {
    login: `${API_BASE}/auth/login`,
    me: `${API_BASE}/me`,
  },
  claims: {
    list: claims,
    detail: (id: number) => `${claims}/${id}`,
    receipt: (id: number) => `${claims}/${id}/receipt`,
    submit: (id: number) => `${claims}/${id}/submit`,
    approve: (id: number) => `${claims}/${id}/approve`,
    sendBack: (id: number) => `${claims}/${id}/send-back`,
    reject: (id: number) => `${claims}/${id}/reject`,
    pay: (id: number) => `${claims}/${id}/pay`,
  },
  approvals: `${API_BASE}/approvals`,
  projects: `${API_BASE}/projects`,
  policy: `${API_BASE}/policy`,
};
