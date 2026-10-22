import { createHashRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/layout/AppLayout";
import { ApprovalsPage } from "@/pages/approvals/ApprovalsPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ClaimDetailPage } from "@/pages/claims/ClaimDetailPage";
import { EditClaimPage } from "@/pages/claims/EditClaimPage";
import { MyClaimsPage } from "@/pages/claims/MyClaimsPage";
import { NewClaimPage } from "@/pages/claims/NewClaimPage";
import { HelpPage } from "@/pages/help/HelpPage";
import { PolicyPage } from "@/pages/policy/PolicyPage";
import { paths } from "@/routes";

export const router = createHashRouter([
  { path: paths.login, element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to={paths.myClaims} replace /> },
      { path: paths.myClaims, element: <MyClaimsPage /> },
      { path: paths.allClaims, element: <MyClaimsPage /> },
      { path: paths.newClaim, element: <NewClaimPage /> },
      { path: paths.claim.path, element: <ClaimDetailPage /> },
      { path: paths.editClaim.path, element: <EditClaimPage /> },
      { path: paths.approvals, element: <ApprovalsPage /> },
      { path: paths.policy, element: <PolicyPage /> },
      { path: paths.help, element: <HelpPage /> },
      { path: "*", element: <Navigate to={paths.myClaims} replace /> },
    ],
  },
]);
