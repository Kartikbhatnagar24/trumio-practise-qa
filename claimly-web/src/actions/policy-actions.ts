import { ToastType } from "@/constraints/enums/core-enums";
import { fetchPolicy } from "@/services/policy-service";
import { usePolicyStore } from "@/stores/policy-store";
import { showToastMessage } from "@/utils/core-utils";
import { errorMessage } from "@/utils/error-utils";

export const loadPolicy = async () => {
  const store = usePolicyStore.getState();
  if (store.policy || store.isLoading) return;
  store.setLoading(true);
  try {
    store.setPolicy(await fetchPolicy());
  } catch (error) {
    showToastMessage(ToastType.ERROR, errorMessage(error, "Could not load the expense policy."));
  } finally {
    store.setLoading(false);
  }
};
