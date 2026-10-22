import { endOfMonth, format } from "date-fns";
import { NavLink } from "react-router-dom";

import { CardIcon, ChartIcon, HelpIcon, InboxIcon, PlusCircleIcon, PolicyIcon, ReceiptIcon } from "@/components/common/icons";
import { Logo } from "@/components/common/Logo";
import { Role } from "@/constraints/enums/claim-enums";
import { cn } from "@/lib/utils";
import { paths } from "@/routes";
import { useApprovalsStore } from "@/stores/approvals-store";
import { useAuthStore } from "@/stores/auth-store";
import { useClaimsStore } from "@/stores/claims-store";
import { initials } from "@/utils/format-utils";

interface Item {
  to: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  note?: string;
  end?: boolean;
}

const ROLE_LABELS: Record<Role, string> = { [Role.EMPLOYEE]: "Employee", [Role.MANAGER]: "Manager", [Role.FINANCE_ADMIN]: "Finance admin" };

function NavItem({ item }: { item: Item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => cn("flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-ink no-underline hover:bg-paper", isActive && "bg-brand-wash font-semibold text-brand hover:bg-brand-wash")}
    >
      {item.icon}
      <span className="flex-grow">{item.label}</span>
      {item.count !== undefined && <span className="text-xs font-medium">{item.count}</span>}
      {item.note && <span className="text-xs text-secondary">{item.note}</span>}
    </NavLink>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <>
      <div className="px-2.5 pt-[18px] pb-1.5 text-xs leading-4 text-secondary first:pt-2">{title}</div>
      {items.map((item) => (
        <NavItem key={item.to} item={item} />
      ))}
    </>
  );
}

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const myTotal = useClaimsStore((state) => state.page?.total);
  const queueTotal = useApprovalsStore((state) => state.page?.total);
  if (!user) return null;
  const isReviewer = user.role !== Role.EMPLOYEE;
  const expenses: Item[] = [];
  if (user.role !== Role.FINANCE_ADMIN) {
    expenses.push(
      { to: paths.myClaims, label: "My claims", icon: <ReceiptIcon />, count: myTotal, end: true },
      { to: paths.newClaim, label: "New claim", icon: <PlusCircleIcon /> },
      { to: "/corporate-card", label: "Corporate card", icon: <CardIcon />, note: "Soon" },
    );
  }
  const review: Item[] = [{ to: paths.approvals, label: "Approvals", icon: <InboxIcon />, count: queueTotal }];
  if (user.role === Role.FINANCE_ADMIN) {
    review.push({ to: paths.allClaims, label: "All claims", icon: <ReceiptIcon /> }, { to: "/payout-runs", label: "Payout runs", icon: <ChartIcon />, note: "Soon" });
  }

  return (
    <nav aria-label="Main" className="flex w-full flex-col gap-0.5 border-b border-rule bg-sheet px-3.5 py-5 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <Logo />
      {expenses.length > 0 && <Group title="Expenses" items={expenses} />}
      {isReviewer && <Group title={user.role === Role.FINANCE_ADMIN ? "Finance" : "Team"} items={review} />}
      <Group
        title="Company"
        items={[
          { to: paths.policy, label: "Expense policy", icon: <PolicyIcon /> },
          { to: paths.help, label: "Help and FAQs", icon: <HelpIcon /> },
        ]}
      />
      <div className="hidden min-h-8 flex-grow md:block" />
      <div className="mx-1 mt-4 mb-3 rounded-[var(--radius-panel)] border border-rule bg-paper p-3 text-[13px] leading-[18px]">
        <div className="font-semibold">Next payout</div>
        <div className="text-secondary">Approved claims are paid with salary on {format(endOfMonth(new Date()), "dd MMM")}.</div>
      </div>
      <div className="flex items-center gap-2.5 border-t border-rule px-1.5 pt-3.5">
        <span aria-hidden="true" className="flex size-[34px] items-center justify-center rounded-full bg-avatar text-[13px] font-semibold text-brand">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <div className="font-medium">{user.name}</div>
          <div className="text-xs leading-4 text-secondary">
            {ROLE_LABELS[user.role]}, {user.department}
          </div>
        </div>
      </div>
    </nav>
  );
}
