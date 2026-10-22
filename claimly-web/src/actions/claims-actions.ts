import { ToastType } from "@/constraints/enums/core-enums";
import { Claim, ClaimFilters, ClaimForm, FieldIssue, Project } from "@/constraints/types/claim-types";
import * as claimsService from "@/services/claims-service";
import { useClaimsStore } from "@/stores/claims-store";
import { showToastMessage } from "@/utils/core-utils";
import { errorMessage, fieldIssues } from "@/utils/error-utils";

export interface SaveResult {
  claim: Claim | null;
  issues: FieldIssue[];
}

export const loadClaims = async (filters: ClaimFilters) => {
  const store = useClaimsStore.getState();
  store.setFilters(filters);
  store.setLoading(true);
  try {
    store.setPage(await claimsService.listClaims(filters));
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not load your claims."));
  } finally {
    store.setLoading(false);
  }
};

export const loadSummary = async () => {
  try {
    const page = await claimsService.listClaims({ pageSize: 100 });
    useClaimsStore.getState().setSummary(page.items);
  } catch {
    useClaimsStore.getState().setSummary([]);
  }
};

export const loadClaim = async (id: number) => {
  const store = useClaimsStore.getState();
  store.setClaimLoading(true);
  store.setClaim(null);
  try {
    store.setClaim(await claimsService.getClaim(id));
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not load this claim."));
  } finally {
    store.setClaimLoading(false);
  }
};

const saving = async (run: () => Promise<Claim>, fallback: string): Promise<SaveResult> => {
  const store = useClaimsStore.getState();
  store.setSaving(true);
  try {
    const claim = await run();
    store.setClaim(claim);
    return { claim, issues: [] };
  } catch (error) {
    const issues = fieldIssues(error);
    if (!issues.length) showToastMessage(ToastType.ERROR, errorMessage(error, fallback));
    return { claim: null, issues };
  } finally {
    store.setSaving(false);
  }
};

export const saveDraft = (form: ClaimForm, id: number | null) =>
  saving(() => (id ? claimsService.updateClaim(id, form) : claimsService.createClaim(form)), "Could not save the draft.");

export const attachReceipt = (id: number, file: File) => saving(() => claimsService.uploadReceipt(id, file), "Could not upload the receipt.");

export const submitDraft = async (id: number): Promise<SaveResult> => {
  const result = await saving(() => claimsService.submitClaim(id), "Could not submit the claim.");
  if (result.claim) showToastMessage(ToastType.SUCCESS, `Claim CLM-${id} submitted`);
  return result;
};

export const deleteDraft = async (id: number): Promise<boolean> => {
  try {
    await claimsService.deleteClaim(id);
    showToastMessage(ToastType.SUCCESS, "Draft deleted");
    return true;
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not delete the draft."));
    return false;
  }
};

export const findProjects = async (q: string): Promise<Project[]> => {
  try {
    return await claimsService.searchProjects(q);
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not load projects."));
    return [];
  }
};
