import { ToastType } from "@/constraints/enums/core-enums";
import { signIn } from "@/services/auth-service";
import { useApprovalsStore } from "@/stores/approvals-store";
import { useAuthStore } from "@/stores/auth-store";
import { useClaimsStore } from "@/stores/claims-store";
import { showToastMessage } from "@/utils/core-utils";
import { errorMessage } from "@/utils/error-utils";

const forgetUserData = () => {
  useClaimsStore.setState({ page: null, summary: [], claim: null });
  useApprovalsStore.setState({ page: null });
};

export const login = async (email: string, password: string): Promise<string | null> => {
  const store = useAuthStore.getState();
  store.setLoading(true);
  try {
    const { token, user } = await signIn(email, password);
    forgetUserData();
    store.setSession(token, user);
    return null;
  } catch (error) {
    return errorMessage(error, "Could not log in. Try again.");
  } finally {
    store.setLoading(false);
  }
};

export const logout = () => {
  useAuthStore.getState().clear();
  forgetUserData();
  showToastMessage(ToastType.SUCCESS, "Logged out");
};
