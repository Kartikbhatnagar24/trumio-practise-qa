import { Link } from "react-router-dom";

import { StatusBadge } from "@/components/claims/StatusBadge";
import { ClipIcon } from "@/components/common/icons";
import { Currency } from "@/constraints/enums/claim-enums";
import { ColumnOrder } from "@/constraints/enums/variant-enums";
import { Claim } from "@/constraints/types/claim-types";
import { getVariant } from "@/configs/env";
import { paths } from "@/routes";
import { CATEGORY_LABELS, money, rupees, shortDate } from "@/utils/format-utils";

interface Column {
  key: string;
  header: React.ReactNode;
  align?: "right";
  render: (claim: Claim) => React.ReactNode;
}

const cell = "border-b border-rule-soft px-3 py-3 align-top";

export function ClaimsTable({ claims, showEmployee = false, emptyText }: { claims: Claim[]; showEmployee?: boolean; emptyText: React.ReactNode }) {
  const columns: Record<string, Column> = {
    claim: {
      key: "claim",
      header: "Claim",
      render: (claim) => (
        <Link to={paths.claim.generate(claim.id)} className="font-medium no-underline">
          CLM-{claim.id}
        </Link>
      ),
    },
    employee: { key: "employee", header: "Employee", render: (claim) => claim.employee.name },
    date: { key: "date", header: "Expense date", render: (claim) => <span className="whitespace-nowrap">{shortDate(claim.expenseDate)}</span> },
    merchant: {
      key: "merchant",
      header: "Merchant",
      render: (claim) => (
        <>
          <div>{claim.merchant}</div>
          <div className="text-xs leading-4 text-secondary">
            {CATEGORY_LABELS[claim.category]}
            {claim.nights ? `, ${claim.nights} night${claim.nights > 1 ? "s" : ""}` : ""}
          </div>
        </>
      ),
    },
    project: { key: "project", header: "Project", render: (claim) => <span className="whitespace-nowrap text-secondary">{claim.project?.code ?? "—"}</span> },
    status: { key: "status", header: "Status", render: (claim) => <StatusBadge status={claim.status} /> },
    receipt: {
      key: "receipt",
      header: <span className="sr-only">Receipt</span>,
      render: (claim) =>
        claim.receipt ? (
          <span role="img" aria-label="Receipt attached" className="text-secondary">
            <ClipIcon />
          </span>
        ) : null,
    },
    amount: {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (claim) => (
        <>
          <div className="whitespace-nowrap font-medium">{rupees(claim.amountInr)}</div>
          {claim.currency !== Currency.INR && <div className="text-xs leading-4 text-secondary">{money(claim.amount, claim.currency)}</div>}
        </>
      ),
    },
  };
  const order = getVariant().ui.columnOrder === ColumnOrder.AMOUNT_FIRST ? ["claim", "amount", "merchant", "date", "status", "project", "receipt"] : ["claim", "date", "merchant", "project", "status", "receipt", "amount"];
  if (showEmployee) order.splice(1, 0, "employee");
  const visible = order.map((key) => columns[key]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse tabular-nums">
        <thead>
          <tr className="bg-sheet-soft text-left text-xs leading-4 text-secondary">
            {visible.map((column) => (
              <th key={column.key} scope="col" className={`border-b border-rule px-3 py-2.5 font-medium first:pl-5 last:pr-5 ${column.align === "right" ? "text-right" : ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-sheet-soft">
              {visible.map((column) => (
                <td key={column.key} className={`${cell} first:pl-5 last:pr-5 ${column.align === "right" ? "text-right" : ""}`}>
                  {column.render(claim)}
                </td>
              ))}
            </tr>
          ))}
          {claims.length === 0 && (
            <tr>
              <td colSpan={visible.length} className="px-5 py-10 text-center text-secondary">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
