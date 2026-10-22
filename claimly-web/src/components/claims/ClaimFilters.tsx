import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Category, SortKey } from "@/constraints/enums/claim-enums";
import { ClaimFilters as Filters } from "@/constraints/types/claim-types";
import { CATEGORY_LABELS } from "@/utils/format-utils";

const SORT_LABELS: Record<string, string> = {
  [SortKey.DATE_DESC]: "Newest expense first",
  [SortKey.DATE]: "Oldest expense first",
  [SortKey.AMOUNT_DESC]: "Highest amount first",
  [SortKey.AMOUNT]: "Lowest amount first",
  [SortKey.SUBMITTED_DESC]: "Recently submitted",
  [SortKey.SUBMITTED]: "Waiting longest",
};

const labelClass = "flex flex-col gap-1 text-xs leading-4 text-secondary";

export function ClaimFilters({ filters, onChange, onClear }: { filters: Filters; onChange: (changes: Filters) => void; onClear: () => void }) {
  return (
    <form className="flex flex-wrap items-end gap-3 border-b border-rule px-5 py-3.5" onSubmit={(event) => event.preventDefault()}>
      <label className={labelClass}>
        Category
        <NativeSelect className="h-9 min-w-40 text-sm" value={filters.category ?? ""} onChange={(event) => onChange({ category: event.target.value as Category | "" })}>
          <option value="">All categories</option>
          {Object.values(Category).map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className={labelClass}>
        Expense date from
        <Input type="date" className="h-9 w-40 text-sm" value={filters.dateFrom ?? ""} onChange={(event) => onChange({ dateFrom: event.target.value })} />
      </label>
      <label className={labelClass}>
        To
        <Input type="date" className="h-9 w-40 text-sm" value={filters.dateTo ?? ""} onChange={(event) => onChange({ dateTo: event.target.value })} />
      </label>
      <Button variant="ghost" className="h-9 min-h-9 px-3" onClick={onClear}>
        Clear filters
      </Button>
      <div className="flex-grow" />
      <label className={labelClass}>
        Sort by
        <NativeSelect className="h-9 min-w-44 text-sm" value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </label>
    </form>
  );
}
