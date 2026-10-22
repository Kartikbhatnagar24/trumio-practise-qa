import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { loadClaim } from "@/actions/claims-actions";
import { ClaimForm } from "@/components/claims/ClaimForm";
import { TopBar } from "@/components/common/header/TopBar";
import { paths } from "@/routes";
import { useClaimsStore } from "@/stores/claims-store";

export function EditClaimPage() {
  const id = Number(useParams().id);
  const { claim, isClaimLoading } = useClaimsStore();

  useEffect(() => {
    loadClaim(id);
  }, [id]);

  if (!claim || claim.id !== id) {
    return (
      <>
        <TopBar crumbs={[{ label: "My claims", to: paths.myClaims }, { label: `CLM-${id}` }]} />
        <main className="px-4 py-10 text-secondary md:px-8">{isClaimLoading ? "Loading the claim…" : "This claim could not be found."}</main>
      </>
    );
  }
  return <ClaimForm key={claim.id} existing={claim} />;
}
