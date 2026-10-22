import { hasUiBug } from "@/configs/env";
import { UiBug } from "@/constraints/enums/bug-enums";
import { ToastType } from "@/constraints/enums/core-enums";
import { Claim, ClaimFilters } from "@/constraints/types/claim-types";
import * as approvalsService from "@/services/approvals-service";
import { listApprovals } from "@/services/claims-service";
import { useApprovalsStore } from "@/stores/approvals-store";
import { useClaimsStore } from "@/stores/claims-store";
import { showToastMessage } from "@/utils/core-utils";
import { errorMessage } from "@/utils/error-utils";

export const loadApprovals = async (filters: ClaimFilters) => {
  const store = useApprovalsStore.getState();
  store.setFilters(filters);
  store.setLoading(true);
  try {
    store.setPage(await listApprovals(filters));
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not load the approvals queue."));
  } finally {
    store.setLoading(false);
  }
};

const acting = async (run: () => Promise<Claim>, done: string, fallback: string): Promise<boolean> => {
  const store = useApprovalsStore.getState();
  store.setActing(true);
  try {
    useClaimsStore.getState().setClaim(await run());
    showToastMessage(ToastType.SUCCESS, done);
    return true;
  } catch (error) {
    showToastMessage(ToastType.ERROR, hasUiBug(UiBug.GENERIC_ERROR_TOAST) ? "Something went wrong" : errorMessage(error, fallback));
    return false;
  } finally {
    store.setActing(false);
  }
};

export const approve = (id: number, approvedAmount: string | null, comment: string | null) =>
  acting(() => approvalsService.approveClaim(id, approvedAmount, comment), `CLM-${id} approved`, "Could not approve this claim.");

export const sendBack = (id: number, comment: string) => acting(() => approvalsService.sendBackClaim(id, comment), `CLM-${id} sent back`, "Could not send this claim back.");

export const reject = (id: number, comment: string) => acting(() => approvalsService.rejectClaim(id, comment), `CLM-${id} rejected`, "Could not reject this claim.");

export const markPaid = (id: number) => acting(() => approvalsService.payClaim(id), `CLM-${id} marked paid`, "Could not mark this claim paid.");
