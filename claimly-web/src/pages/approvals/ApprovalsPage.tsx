import { useEffect } from "react";

import { loadApprovals } from "@/actions/approvals-actions";
import { ClaimFilters } from "@/components/claims/ClaimFilters";
import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { TopBar } from "@/components/common/header/TopBar";
import { Pager } from "@/components/common/tables/Pager";
import { hasUiBug } from "@/configs/env";
import * as UiBug from "@/constraints/enums/bug-enums";
import { Role } from "@/constraints/enums/claim-enums";
import { ClaimFilters as Filters } from "@/constraints/types/claim-types";
import { cn } from "@/lib/utils";
import { useApprovalsStore } from "@/stores/approvals-store";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_FILTERS } from "@/stores/claims-store";
import { rupees } from "@/utils/format-utils";

export function ApprovalsPage() {
  const user = useAuthStore((state) => state.user);
  const { page, filters, isLoading } = useApprovalsStore();
  const isFinance = user?.role === Role.FINANCE_ADMIN;

  useEffect(() => {
    loadApprovals({ ...DEFAULT_FILTERS, sort: "submitted" });
  }, []);

  const apply = (changes: Filters) => loadApprovals({ ...filters, ...changes, page: changes.page ?? (hasUiBug(UiBug.FILTER_KEEPS_PAGE) ? filters.page : 1) });
  const waiting = (page?.items ?? []).reduce((total, claim) => total + Number(claim.approvedAmountInr ?? claim.amountInr), 0);

  return (
    <>
      <TopBar search={filters.q} onSearch={(q) => apply({ q })} />
      <main className="flex w-full max-w-[1120px] flex-col gap-5 px-4 py-7 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-semibold leading-[30px]">Approvals</h1>
          <p className="m-0 text-secondary">
            {isFinance
              ? "Claims your managers approved. Approve the ones above the limit, then mark them paid."
              : "Claims from your team waiting for you. Oldest first, so nobody waits too long."}
          </p>
        </div>
        {page && (
          <p className="m-0 rounded-[var(--radius-panel)] border border-rule bg-sheet px-5 py-3.5 tabular-nums">
            <strong className="font-semibold">{page.total}</strong> claim{page.total === 1 ? "" : "s"} waiting, <strong className="font-semibold">{rupees(waiting)}</strong> on this page.
          </p>
        )}
        <section aria-label="Approvals queue" className="rounded-[var(--radius-panel)] border border-rule bg-sheet">
          <ClaimFilters filters={filters} onChange={apply} onClear={() => loadApprovals({ ...DEFAULT_FILTERS, sort: "submitted" })} />
          <div aria-busy={isLoading} className={cn(isLoading && "opacity-60")}>
            <ClaimsTable claims={page?.items ?? []} showEmployee emptyText={isLoading ? "Loading the queue…" : "Nothing is waiting for you. Nice work."} />
          </div>
          {page && <Pager page={page.page} pageSize={page.pageSize} total={page.total} noun="claims" onPage={(next) => apply({ page: next })} onPageSize={(pageSize) => apply({ pageSize })} />}
        </section>
      </main>
    </>
  );
}
