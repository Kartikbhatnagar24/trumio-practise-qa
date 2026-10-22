import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { deleteDraft, loadClaim, submitDraft } from "@/actions/claims-actions";
import { loadPolicy } from "@/actions/policy-actions";
import { ReviewActions } from "@/components/approvals/ReviewActions";
import { AuditTrail } from "@/components/claims/AuditTrail";
import { ClaimStamp } from "@/components/claims/ClaimStamp";
import { PolicyChecks } from "@/components/claims/PolicyChecks";
import { TopBar } from "@/components/common/header/TopBar";
import { ReceiptIcon } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { ClaimStatus, Currency, Role } from "@/constraints/enums/claim-enums";
import { paths } from "@/routes";
import { useAuthStore } from "@/stores/auth-store";
import { useClaimsStore } from "@/stores/claims-store";
import { usePolicyStore } from "@/stores/policy-store";
import { CATEGORY_LABELS, initials, money, rupees, shortDate } from "@/utils/format-utils";

const EDITABLE = [ClaimStatus.DRAFT, ClaimStatus.SENT_BACK];

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="border-b border-rule-soft py-3 text-secondary last-of-type:border-0">{term}</dt>
      <dd className="m-0 border-b border-rule-soft py-3 [&:last-of-type]:border-0">{children}</dd>
    </>
  );
}

function Money({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-3 ${className}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ClaimDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { claim, isClaimLoading, isSaving } = useClaimsStore();
  const policy = usePolicyStore((state) => state.policy);

  useEffect(() => {
    loadClaim(id);
    loadPolicy();
  }, [id]);

  const isOwner = claim && user && claim.employee.id === user.id;
  const backTo = user?.role === Role.EMPLOYEE || isOwner ? { label: "My claims", to: paths.myClaims } : { label: "Approvals", to: paths.approvals };

  if (!claim || claim.id !== id) {
    return (
      <>
        <TopBar crumbs={[backTo, { label: `CLM-${id}` }]} />
        <main className="px-4 py-10 text-secondary md:px-8">{isClaimLoading ? "Loading the claim…" : "This claim could not be found."}</main>
      </>
    );
  }

  const notApproved = claim.approvedAmountInr ? Number(claim.amountInr) - Number(claim.approvedAmountInr) : 0;
  const needsFinance = policy && Number(claim.approvedAmountInr ?? claim.amountInr) > policy.rules.managerApprovalLimit;

  return (
    <>
      <TopBar crumbs={[backTo, { label: `CLM-${claim.id}` }]} />
      <main className="flex w-full max-w-[1180px] flex-wrap items-start gap-6 px-4 py-7 md:px-8">
        <article className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-[var(--radius-panel)] border border-rule bg-sheet">
          <header className="flex flex-wrap justify-between gap-6 border-b border-rule px-8 pt-[26px] pb-[22px]">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-secondary">Expense claim</span>
              <h1 className="m-0 text-[26px] font-semibold leading-8 tabular-nums">CLM-{claim.id}</h1>
              <p className="m-0 text-secondary">
                {claim.merchant}, {claim.submittedAt ? `submitted on ${shortDate(claim.submittedAt)}` : "not submitted yet"}
              </p>
            </div>
            <ClaimStamp claim={claim} />
          </header>
          <div className="flex flex-wrap">
            <dl className="m-0 grid flex-[3_1_340px] grid-cols-[130px_minmax(0,1fr)] gap-x-4 px-8 pt-2 pb-4">
              <Row term="Category">
                {CATEGORY_LABELS[claim.category]}
                {claim.nights ? `, ${claim.nights} night${claim.nights > 1 ? "s" : ""}` : ""}
              </Row>
              <Row term="Expense date">{shortDate(claim.expenseDate)}</Row>
              <Row term="Project">
                {claim.project ? (
                  <>
                    {claim.project.name} <span className="text-secondary">{claim.project.code}</span>
                  </>
                ) : (
                  "—"
                )}
              </Row>
              <Row term="Description">{claim.description || "—"}</Row>
              <Row term="Claimed by">{claim.employee.name}</Row>
            </dl>
            <div className="flex flex-[2_1_240px] flex-col gap-3.5 border-l border-rule-soft px-8 py-5 tabular-nums">
              {claim.currency !== Currency.INR && (
                <>
                  <Money label="Paid" value={money(claim.amount, claim.currency)} className="text-secondary [&>span:last-child]:text-ink" />
                  {policy && <Money label={`Rate to ₹`} value={rupees(policy.currencyRates[claim.currency])} className="text-secondary [&>span:last-child]:text-ink" />}
                </>
              )}
              <Money label="Claimed" value={rupees(claim.amountInr)} className="text-secondary [&>span:last-child]:text-ink" />
              {claim.nights && <Money label="Per night" value={rupees(Number(claim.amountInr) / claim.nights)} className="text-secondary [&>span:last-child]:text-ink" />}
              {notApproved > 0 && <Money label="Not approved" value={`−${rupees(notApproved)}`} className="text-danger" />}
              <Money label={claim.status === ClaimStatus.PAID ? "Paid out" : "To pay"} value={rupees(claim.approvedAmountInr ?? claim.amountInr)} className="border-t border-rule pt-3 text-base font-semibold" />
              {needsFinance && claim.status !== ClaimStatus.PAID && claim.status !== ClaimStatus.REJECTED && (
                <p className="m-0 rounded-[var(--radius-control)] bg-warn-wash px-3 py-2.5 text-[13px] leading-[18px] text-warn-ink">
                  Above ₹{policy.rules.managerApprovalLimit.toLocaleString("en-IN")}, so finance approves before payment.
                </p>
              )}
            </div>
          </div>
          <section aria-labelledby="receipt" className="flex flex-wrap items-center gap-5 border-t border-rule px-8 py-5">
            <div aria-hidden="true" className="flex h-[84px] w-[66px] items-center justify-center rounded border border-rule bg-sheet-soft text-secondary shadow-[0_1px_2px_rgba(27,36,51,0.06)]">
              <ReceiptIcon size={28} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h2 id="receipt" className="m-0 text-base font-semibold leading-[22px]">
                Receipt
              </h2>
              {claim.receipt ? (
                <div>
                  {claim.receipt.filename} <span className="text-secondary">({Math.ceil(claim.receipt.size / 1024)} KB)</span>
                </div>
              ) : (
                <div className="text-secondary">No receipt attached.</div>
              )}
            </div>
          </section>
          <section aria-labelledby="history" className="border-t border-rule px-8 pt-5 pb-6">
            <h2 id="history" className="m-0 mb-3 text-base font-semibold leading-[22px]">
              History
            </h2>
            <AuditTrail events={claim.events} createdAt={claim.createdAt} owner={claim.employee.name} />
          </section>
          {user && policy && <ReviewActions claim={claim} user={user} approvalLimit={policy.rules.managerApprovalLimit} />}
          {isOwner && EDITABLE.includes(claim.status) && (
            <footer className="flex flex-wrap justify-end gap-2.5 border-t border-rule bg-sheet-soft px-8 py-4">
              {claim.status === ClaimStatus.DRAFT && (
                <Button
                  variant="danger"
                  disabled={isSaving}
                  onClick={async () => {
                    if (await deleteDraft(claim.id)) navigate(paths.myClaims);
                  }}
                >
                  Delete draft
                </Button>
              )}
              <Button variant="secondary" asChild>
                <Link to={paths.editClaim.generate(claim.id)}>Edit claim</Link>
              </Button>
              <Button disabled={isSaving} onClick={() => submitDraft(claim.id)}>
                {claim.status === ClaimStatus.SENT_BACK ? "Resubmit claim" : "Submit claim"}
              </Button>
            </footer>
          )}
        </article>
        <aside className="flex flex-[1_1_260px] flex-col gap-4">
          <section aria-labelledby="employee" className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-rule bg-sheet px-5 py-[18px]">
            <h2 id="employee" className="m-0 text-[15px] font-semibold leading-5">
              Employee
            </h2>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="flex size-[38px] items-center justify-center rounded-full bg-avatar font-semibold text-brand">
                {initials(claim.employee.name)}
              </span>
              <div className="font-medium">{claim.employee.name}</div>
            </div>
          </section>
          {policy && (
            <section aria-labelledby="checks" className="flex flex-col gap-2.5 rounded-[var(--radius-panel)] border border-rule bg-sheet px-5 py-[18px]">
              <h2 id="checks" className="m-0 text-[15px] font-semibold leading-5">
                Policy checks
              </h2>
              <PolicyChecks claim={claim} rules={policy.rules} />
            </section>
          )}
        </aside>
      </main>
    </>
  );
}
