import { Link, useNavigate } from "react-router-dom";

import { logout } from "@/actions/auth-actions";
import { BellIcon, SearchIcon } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes";

export interface Crumb {
  label: string;
  to?: string;
}

interface TopBarProps {
  crumbs?: Crumb[];
  search?: string;
  onSearch?: (q: string) => void;
  children?: React.ReactNode;
}

export function TopBar({ crumbs, search, onSearch, children }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="flex min-h-[60px] flex-wrap items-center gap-4 border-b border-rule bg-sheet px-4 py-2 md:px-8">
      {crumbs ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-secondary">
          {crumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="no-underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-ink">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <form
          role="search"
          className="flex h-9 w-full max-w-[380px] items-center gap-2 rounded-[var(--radius-control)] border border-field px-3 text-secondary"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch?.(String(new FormData(event.currentTarget).get("q") ?? ""));
          }}
        >
          <SearchIcon />
          <input
            name="q"
            type="search"
            aria-label="Search claims"
            defaultValue={search}
            placeholder="Search claims, merchants or claim numbers…"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent text-ink outline-none"
          />
        </form>
      )}
      <div className="flex-grow" />
      {children}
      <Link to={paths.help} className="text-[13px] no-underline">
        Claim guide
      </Link>
      <Button variant="secondary" size="icon" disabled aria-label="Notifications, coming soon" title="Coming soon">
        <BellIcon />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          logout();
          navigate(paths.login);
        }}
      >
        Log out
      </Button>
    </header>
  );
}
