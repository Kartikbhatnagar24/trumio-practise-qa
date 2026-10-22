import { ClaimStatus } from "@/constraints/enums/claim-enums";
import { Claim } from "@/constraints/types/claim-types";
import { rupees } from "@/utils/format-utils";

const IN_APPROVAL = [ClaimStatus.SUBMITTED, ClaimStatus.MANAGER_APPROVED, ClaimStatus.FINANCE_APPROVED];

const sum = (claims: Claim[], pick: (claim: Claim) => string | null) => claims.reduce((total, claim) => total + Number(pick(claim) ?? 0), 0);

export function SummaryStrip({ claims, today }: { claims: Claim[]; today: Date }) {
  const month = today.toISOString().slice(0, 7);
  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  const thisMonth = claims.filter((claim) => claim.expenseDate.startsWith(month));
  const waiting = claims.filter((claim) => IN_APPROVAL.includes(claim.status));
  const paid = claims.filter((claim) => claim.status === ClaimStatus.PAID && claim.events.some((event) => event.toStatus === ClaimStatus.PAID && new Date(event.at) >= quarterStart));
  const sentBack = claims.filter((claim) => claim.status === ClaimStatus.SENT_BACK).length;
  const drafts = claims.filter((claim) => claim.status === ClaimStatus.DRAFT).length;
  const cells = [
    { label: "Claimed this month", value: rupees(sum(thisMonth, (claim) => claim.amountInr)), note: `${thisMonth.length} claim${thisMonth.length === 1 ? "" : "s"}`, tone: "" },
    { label: "Waiting for approval", value: rupees(sum(waiting, (claim) => claim.approvedAmountInr ?? claim.amountInr)), note: `${waiting.length} with your manager or finance`, tone: "text-info" },
    { label: "Paid this quarter", value: rupees(sum(paid, (claim) => claim.approvedAmountInr)), note: `${paid.length} claim${paid.length === 1 ? "" : "s"} paid`, tone: "text-paid" },
    { label: "Needs your action", value: `${sentBack + drafts} claim${sentBack + drafts === 1 ? "" : "s"}`, note: `${sentBack} sent back, ${drafts} draft${drafts === 1 ? "" : "s"}`, tone: "text-warn" },
  ];
  return (
    <section aria-label="Your claims at a glance" className="grid grid-cols-2 rounded-[var(--radius-panel)] border border-rule bg-sheet tabular-nums lg:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="border-rule-soft px-5 py-4 [&:not(:last-child)]:border-r">
          <div className="text-[13px] text-secondary">{cell.label}</div>
          <div className={`mt-1 text-xl font-semibold leading-7 ${cell.tone}`}>{cell.value}</div>
          <div className="text-xs leading-4 text-secondary">{cell.note}</div>
        </div>
      ))}
    </section>
  );
}
