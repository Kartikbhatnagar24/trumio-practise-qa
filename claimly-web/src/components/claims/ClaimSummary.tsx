import { Link } from "react-router-dom";

import { hasUiBug } from "@/configs/env";
import * as UiBug from "@/constraints/enums/bug-enums";
import { Category, Currency } from "@/constraints/enums/claim-enums";
import { Claim, Policy, User } from "@/constraints/types/claim-types";
import { paths } from "@/routes";
import { CATEGORY_LABELS, rupees, shortDate, wholeRupees } from "@/utils/format-utils";

interface ClaimSummaryProps {
  amount: string;
  currency: Currency;
  category: Category | "";
  nights: number | null;
  policy: Policy | null;
  user: User;
  recent: Claim[];
}

export const toInr = (amount: string, currency: Currency, policy: Policy | null): number | null => {
  const value = Number(amount);
  if (!amount || Number.isNaN(value) || !policy) return null;
  const product = value * Number(policy.currencyRates[currency]);
  return hasUiBug(UiBug.SUMMARY_UNROUNDED) ? product : Math.round(product * 100) / 100;
};

export function ClaimSummary({ amount, currency, category, nights, policy, user, recent }: ClaimSummaryProps) {
  const inr = toInr(amount, currency, policy);
  const rules = policy?.rules;
  return (
    <aside className="flex flex-[1_1_280px] flex-col gap-4">
      <section aria-labelledby="summary" className="flex flex-col gap-3.5 rounded-[var(--radius-panel)] border border-rule bg-sheet px-[22px] py-5">
        <h2 id="summary" className="m-0 text-[15px] font-semibold leading-5">
          Summary
        </h2>
        <div className="flex flex-col gap-0.5">
          <span className="text-[26px] font-semibold leading-8 tabular-nums">{inr === null ? "₹0.00" : hasUiBug(UiBug.SUMMARY_UNROUNDED) ? `₹${inr}` : rupees(inr)}</span>
          <span className="text-secondary">
            {currency === Currency.INR ? "Paid in INR, no conversion" : policy ? `Converted from ${currency} at ₹${policy.currencyRates[currency]}` : "Converted to rupees"}
          </span>
        </div>
        {rules && (
          <div className="flex flex-col gap-2.5 border-t border-rule pt-3 text-[13px]">
            <h3 className="m-0 text-sm font-semibold leading-5">Policy for this claim</h3>
            {category === Category.MEALS && (
              <div className="flex justify-between gap-3">
                <span className="text-secondary">Meals, grade {user.grade}</span>
                <span className={`tabular-nums ${inr !== null && inr > rules.mealCapByGrade[user.grade] ? "font-medium text-danger" : ""}`}>up to {wholeRupees(rules.mealCapByGrade[user.grade])}</span>
              </div>
            )}
            {category === Category.HOTEL && (
              <div className="flex justify-between gap-3">
                <span className="text-secondary">Hotel, per night</span>
                <span className={`tabular-nums ${inr !== null && nights && inr / nights > rules.hotelNightlyLimit ? "font-medium text-danger" : ""}`}>up to {wholeRupees(rules.hotelNightlyLimit)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-secondary">Receipt needed from</span>
              <span className="tabular-nums">{wholeRupees(rules.receiptRequiredFrom)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-secondary">Submit within</span>
              <span>{rules.maxClaimAgeDays} days</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-secondary">Finance also approves above</span>
              <span className="tabular-nums">{wholeRupees(rules.managerApprovalLimit)}</span>
            </div>
            <Link to={paths.policy}>Read the full expense policy</Link>
          </div>
        )}
      </section>
      <section aria-labelledby="tips" className="flex flex-col gap-2.5 rounded-[var(--radius-panel)] border border-rule bg-sheet px-[22px] py-[18px] text-[13px] leading-[18px]">
        <h2 id="tips" className="m-0 text-[15px] font-semibold leading-5">
          Before you submit
        </h2>
        <ul className="m-0 flex flex-col gap-1.5 pl-[18px] text-[#3B4552]">
          <li>Upload the itemised bill, not the card slip.</li>
          <li>Claim only your share of a group bill, or list who attended.</li>
          <li>Alcohol and tips are not reimbursed.</li>
        </ul>
      </section>
      {recent.length > 0 && category && (
        <section aria-labelledby="recent" className="flex flex-col gap-2.5 rounded-[var(--radius-panel)] border border-rule bg-sheet px-[22px] py-[18px] text-[13px]">
          <h2 id="recent" className="m-0 text-[15px] font-semibold leading-5">
            Your last {CATEGORY_LABELS[category].toLowerCase()} claims
          </h2>
          {recent.map((claim) => (
            <div key={claim.id} className="flex justify-between gap-2">
              <span>
                {claim.merchant}, {shortDate(claim.expenseDate)}
              </span>
              <span className="tabular-nums">{rupees(claim.amountInr)}</span>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}
