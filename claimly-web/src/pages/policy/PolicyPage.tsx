import { useEffect } from "react";

import { loadPolicy } from "@/actions/policy-actions";
import { TopBar } from "@/components/common/header/TopBar";
import { Currency } from "@/constraints/enums/claim-enums";
import { usePolicyStore } from "@/stores/policy-store";
import { wholeRupees } from "@/utils/format-utils";

function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule-soft py-4 last:border-0">
      <h3 className="m-0 text-[15px] font-semibold leading-5">{title}</h3>
      <p className="m-0 mt-1 max-w-[70ch] text-[#3B4552]">{children}</p>
    </div>
  );
}

export function PolicyPage() {
  const { policy, isLoading } = usePolicyStore();

  useEffect(() => {
    loadPolicy();
  }, []);

  return (
    <>
      <TopBar crumbs={[{ label: "Expense policy" }]} />
      <main className="flex w-full max-w-[880px] flex-col gap-5 px-4 py-7 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-semibold leading-[30px]">Expense policy</h1>
          <p className="m-0 text-secondary">What Kaveri Infotech pays back, and who approves it. Claims that break a rule cannot be submitted.</p>
        </div>
        {!policy ? (
          <p className="text-secondary">{isLoading ? "Loading the policy…" : "The policy could not be loaded."}</p>
        ) : (
          <>
            <section aria-labelledby="limits" className="rounded-[var(--radius-panel)] border border-rule bg-sheet px-7 py-3">
              <h2 id="limits" className="sr-only">
                Limits
              </h2>
              <Rule title="Hotels">
                Hotel stays are paid up to <strong>{wholeRupees(policy.rules.hotelNightlyLimit)} a night</strong>, taxes included. Enter the number of nights on the claim.
              </Rule>
              <Rule title="Meals">
                Meals are paid up to <strong>{wholeRupees(policy.rules.mealCapByGrade.G1)}</strong> for grade G1, <strong>{wholeRupees(policy.rules.mealCapByGrade.G2)}</strong> for grade G2 and{" "}
                <strong>{wholeRupees(policy.rules.mealCapByGrade.G3)}</strong> for grade G3, per claim.
              </Rule>
              <Rule title="Receipts">
                Attach the itemised bill for every claim of <strong>{wholeRupees(policy.rules.receiptRequiredFrom)} or more</strong>. Card slips are not enough.
              </Rule>
              <Rule title="Deadline">
                Submit a claim within <strong>{policy.rules.maxClaimAgeDays} days</strong> of the expense. Claims for future dates are not accepted.
              </Rule>
              <Rule title="Approvals">
                Your manager approves every claim. Claims above <strong>{wholeRupees(policy.rules.managerApprovalLimit)}</strong> also need finance approval before they are paid. Nobody can approve their
                own claim.
              </Rule>
              <Rule title="Duplicates">You cannot claim the same merchant, date and amount twice, unless the first claim was rejected.</Rule>
            </section>
            <section aria-labelledby="rates" className="rounded-[var(--radius-panel)] border border-rule bg-sheet px-7 py-5">
              <h2 id="rates" className="m-0 text-base font-semibold leading-[22px]">
                Currency rates
              </h2>
              <p className="m-0 mt-1 text-secondary">Foreign expenses are converted to rupees at these fixed rates and rounded to the nearest paisa.</p>
              <table className="mt-3 w-full max-w-sm border-collapse tabular-nums">
                <thead>
                  <tr className="text-left text-xs leading-4 text-secondary">
                    <th scope="col" className="border-b border-rule py-2 font-medium">
                      Currency
                    </th>
                    <th scope="col" className="border-b border-rule py-2 text-right font-medium">
                      Rupees for 1 unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(Currency)
                    .filter((currency) => currency !== Currency.INR)
                    .map((currency) => (
                      <tr key={currency}>
                        <td className="border-b border-rule-soft py-2">{currency}</td>
                        <td className="border-b border-rule-soft py-2 text-right">₹{policy.currencyRates[currency]}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </>
  );
}
