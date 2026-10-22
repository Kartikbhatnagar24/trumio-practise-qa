import { create } from "zustand";

import { ClaimFilters, ClaimPage } from "@/constraints/types/claim-types";
import { DEFAULT_FILTERS } from "@/stores/claims-store";

interface ApprovalsState {
  page: ClaimPage | null;
  filters: ClaimFilters;
  isLoading: boolean;
  isActing: boolean;
  setPage: (page: ClaimPage | null) => void;
  setFilters: (filters: ClaimFilters) => void;
  setLoading: (isLoading: boolean) => void;
  setActing: (isActing: boolean) => void;
}

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  page: null,
  filters: { ...DEFAULT_FILTERS, sort: "submitted" },
  isLoading: false,
  isActing: false,
  setPage: (page) => set({ page }),
  setFilters: (filters) => set({ filters }),
  setLoading: (isLoading) => set({ isLoading }),
  setActing: (isActing) => set({ isActing }),
}));
