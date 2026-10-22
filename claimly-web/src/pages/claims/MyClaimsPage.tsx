import { useEffect } from "react";
import { Link } from "react-router-dom";

import { loadClaims, loadSummary } from "@/actions/claims-actions";
import { ClaimFilters } from "@/components/claims/ClaimFilters";
import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { SummaryStrip } from "@/components/claims/SummaryStrip";
import { TopBar } from "@/components/common/header/TopBar";
import { PlusIcon, WarnIcon } from "@/components/common/icons";
import { Pager } from "@/components/common/tables/Pager";
import { Button } from "@/components/ui/button";
import { ClaimStatus, Role } from "@/constraints/enums/claim-enums";
import { ClaimFilters as Filters } from "@/constraints/types/claim-types";
import { cn } from "@/lib/utils";
import { paths } from "@/routes";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_FILTERS, useClaimsStore } from "@/stores/claims-store";
import { rupees } from "@/utils/format-utils";

const TABS: { label: string; status: ClaimStatus[] }[] = [
  { label: "All", status: [] },
  { label: "Drafts", status: [ClaimStatus.DRAFT] },
  { label: "In approval", status: [ClaimStatus.SUBMITTED, ClaimStatus.MANAGER_APPROVED, ClaimStatus.FINANCE_APPROVED] },
  { label: "Sent back", status: [ClaimStatus.SENT_BACK] },
  { label: "Paid", status: [ClaimStatus.PAID] },
  { label: "Rejected", status: [ClaimStatus.REJECTED] },
];

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

export function MyClaimsPage() {
  const user = useAuthStore((state) => state.user);
  const { page, filters, isLoading, summary } = useClaimsStore();
  const isFinance = user?.role === Role.FINANCE_ADMIN;

  useEffect(() => {
    loadClaims(DEFAULT_FILTERS);
    if (!isFinance) loadSummary();
  }, [isFinance]);

  const apply = (changes: Filters) => loadClaims({ ...filters, ...changes, page: changes.page ?? 1 });
  const sentBack = summary.find((claim) => claim.status === ClaimStatus.SENT_BACK);
  const sentBackEvent = sentBack?.events.findLast((event) => event.toStatus === ClaimStatus.SENT_BACK);
  const activeTab = TABS.find((tab) => tab.status.join() === (filters.status ?? []).join());

  return (
    <>
      <TopBar search={filters.q} onSearch={(q) => apply({ q })} />
      <main className="flex w-full max-w-[1120px] flex-col gap-5 px-4 py-7 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[22px] font-semibold leading-[30px]">{isFinance ? "All claims" : `${greeting()}, ${user?.name.split(" ")[0]}`}</h1>
            <p className="m-0 text-secondary">
              {isFinance ? "Every claim in the company. Amounts are in rupees after conversion." : "Your claims for the last six months. Amounts are in rupees after conversion."}
            </p>
          </div>
          {!isFinance && (
            <div className="flex gap-2.5">
              <Button variant="secondary">Download statement</Button>
              <Button asChild>
                <Link to={paths.newClaim}>
                  <PlusIcon />
                  New claim
                </Link>
              </Button>
            </div>
          )}
        </div>
        {!isFinance && <SummaryStrip claims={summary} today={new Date()} />}
        {sentBack && (
          <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[var(--radius-panel)] border border-warn-line bg-warn-wash px-[18px] py-3.5">
            <WarnIcon className="text-warn" />
            <div className="min-w-0 flex-[1_1_360px]">
              <strong className="font-semibold">
                {sentBackEvent?.actor.name ?? "Your manager"} sent back CLM-{sentBack.id}
              </strong>{" "}
              ({sentBack.merchant}, {rupees(sentBack.amountInr)}). {sentBackEvent?.comment && <span className="text-secondary">“{sentBackEvent.comment}”</span>}
            </div>
            <Button variant="warn" size="sm" asChild className="h-9">
              <Link to={paths.editClaim.generate(sentBack.id)}>Fix and resubmit</Link>
            </Button>
          </div>
        )}
        <section aria-label="Claims" className="rounded-[var(--radius-panel)] border border-rule bg-sheet">
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1 border-b border-rule px-4">
            {TABS.map((tab) => {
              const selected = tab === activeTab;
              const count = tab.status.length ? summary.filter((claim) => tab.status.includes(claim.status)).length : summary.length;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => apply({ status: tab.status })}
                  className={cn("cursor-pointer border-0 border-b-2 border-transparent bg-transparent px-2.5 pt-3 pb-2.5", selected && "border-brand font-semibold text-brand")}
                >
                  {tab.label} {!isFinance && <span className="font-normal text-muted">{count}</span>}
                </button>
              );
            })}
          </div>
          <ClaimFilters filters={filters} onChange={apply} onClear={() => loadClaims({ ...DEFAULT_FILTERS, status: filters.status })} />
          <div aria-busy={isLoading} className={cn(isLoading && "opacity-60")}>
            <ClaimsTable
              claims={page?.items ?? []}
              showEmployee={isFinance}
              emptyText={
                isLoading ? (
                  "Loading claims…"
                ) : (
                  <>
                    No claims match. {!isFinance && <Link to={paths.newClaim}>Start a new claim</Link>}
                  </>
                )
              }
            />
          </div>
          {page && (
            <Pager
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              noun="claims"
              onPage={(next) => apply({ page: next })}
              onPageSize={(pageSize) => apply({ pageSize })}
            />
          )}
        </section>
      </main>
    </>
  );
}
