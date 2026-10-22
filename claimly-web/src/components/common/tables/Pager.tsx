import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";

interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}

export function Pager({ page, pageSize, total, noun, onPage, onPageSize }: PagerProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-secondary">
      <span>
        Showing {first}–{last} of {total} {noun}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Rows per page
          <NativeSelect className="h-8 w-[88px] pr-2"value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={last >= total} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
