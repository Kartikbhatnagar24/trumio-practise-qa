import { differenceInCalendarDays, parseISO } from "date-fns";

import { Category } from "@/constraints/enums/claim-enums";
import { Claim, PolicyRules } from "@/constraints/types/claim-types";
import { rupees, wholeRupees } from "@/utils/format-utils";

interface Check {
  passed: boolean;
  text: string;
}

const checksFor = (claim: Claim, rules: PolicyRules): Check[] => {
  const amount = Number(claim.amountInr);
  const checks: Check[] = [];
  if (claim.category === Category.HOTEL && claim.nights) {
    const perNight = amount / claim.nights;
    checks.push({ passed: perNight <= rules.hotelNightlyLimit, text: `${rupees(perNight)} a night against the ${wholeRupees(rules.hotelNightlyLimit)} hotel limit` });
  }
  const needsReceipt = amount >= rules.receiptRequiredFrom;
  checks.push({
    passed: !needsReceipt || !!claim.receipt,
    text: needsReceipt ? `Receipt ${claim.receipt ? "attached" : "missing"} for a claim of ${wholeRupees(rules.receiptRequiredFrom)} or more` : `No receipt needed below ${wholeRupees(rules.receiptRequiredFrom)}`,
  });
  const reference = claim.submittedAt ? parseISO(claim.submittedAt) : new Date();
  const age = differenceInCalendarDays(reference, parseISO(claim.expenseDate));
  checks.push({ passed: age >= 0 && age <= rules.maxClaimAgeDays, text: `${claim.submittedAt ? "Submitted" : "Expense is"} ${Math.max(age, 0)} days after the expense (limit ${rules.maxClaimAgeDays})` });
  if (claim.approvedAmountInr && Number(claim.approvedAmountInr) < amount) {
    checks.push({ passed: false, text: `${rupees(amount - Number(claim.approvedAmountInr))} was not approved` });
  }
  checks.push({
    passed: true,
    text: Number(claim.approvedAmountInr ?? amount) > rules.managerApprovalLimit ? `Above ${wholeRupees(rules.managerApprovalLimit)}, so finance approves too` : `Up to ${wholeRupees(rules.managerApprovalLimit)}, so the manager's approval is enough`,
  });
  return checks;
};

export function PolicyChecks({ claim, rules }: { claim: Claim; rules: PolicyRules }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px] leading-[18px]">
      {checksFor(claim, rules).map((check) => (
        <li key={check.text} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${check.passed ? "bg-ok-wash text-ok" : "bg-warn-wash text-warn"}`}
          >
            {check.passed ? "✓" : "!"}
          </span>
          <span>
            <span className="sr-only">{check.passed ? "Passed: " : "Check: "}</span>
            {check.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
