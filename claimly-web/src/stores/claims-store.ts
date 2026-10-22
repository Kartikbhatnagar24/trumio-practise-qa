import { create } from "zustand";

import { SortKey } from "@/constraints/enums/claim-enums";
import { Claim, ClaimFilters, ClaimPage } from "@/constraints/types/claim-types";

export const DEFAULT_FILTERS: ClaimFilters = { q: "", status: [], category: "", dateFrom: "", dateTo: "", sort: SortKey.DATE_DESC, page: 1, pageSize: 20 };

interface ClaimsState {
  summary: Claim[];
  setSummary: (summary: Claim[]) => void;
  page: ClaimPage | null;
  filters: ClaimFilters;
  isLoading: boolean;
  claim: Claim | null;
  isClaimLoading: boolean;
  isSaving: boolean;
  setPage: (page: ClaimPage | null) => void;
  setFilters: (filters: ClaimFilters) => void;
  setLoading: (isLoading: boolean) => void;
  setClaim: (claim: Claim | null) => void;
  setClaimLoading: (isClaimLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
}

export const useClaimsStore = create<ClaimsState>((set) => ({
  summary: [],
  setSummary: (summary) => set({ summary }),
  page: null,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  claim: null,
  isClaimLoading: false,
  isSaving: false,
  setPage: (page) => set({ page }),
  setFilters: (filters) => set({ filters }),
  setLoading: (isLoading) => set({ isLoading }),
  setClaim: (claim) => set({ claim }),
  setClaimLoading: (isClaimLoading) => set({ isClaimLoading }),
  setSaving: (isSaving) => set({ isSaving }),
}));
