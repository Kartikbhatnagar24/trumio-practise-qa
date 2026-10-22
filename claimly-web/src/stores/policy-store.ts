import { create } from "zustand";

import { Policy } from "@/constraints/types/claim-types";

interface PolicyState {
  policy: Policy | null;
  isLoading: boolean;
  setPolicy: (policy: Policy) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePolicyStore = create<PolicyState>((set) => ({
  policy: null,
  isLoading: false,
  setPolicy: (policy) => set({ policy }),
  setLoading: (isLoading) => set({ isLoading }),
}));
