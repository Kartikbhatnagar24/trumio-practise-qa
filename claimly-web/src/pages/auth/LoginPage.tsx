import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { login } from "@/actions/auth-actions";
import { LogoMark } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Role } from "@/constraints/enums/claim-enums";
import { paths } from "@/routes";
import { useAuthStore } from "@/stores/auth-store";

const PRACTICE_ACCOUNTS = [
  { email: "asha.verma@claimly.in", role: "Employee" },
  { email: "rahul.mehta@claimly.in", role: "Manager" },
  { email: "neha.iyer@claimly.in", role: "Finance admin" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { token, user, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (token && user) return <Navigate to={user.role === Role.EMPLOYEE ? paths.myClaims : paths.approvals} replace />;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(await login(email, password));
    const signedIn = useAuthStore.getState().user;
    if (signedIn) navigate(signedIn.role === Role.EMPLOYEE ? paths.myClaims : paths.approvals);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <div className="text-[22px] font-semibold leading-7 tracking-[-0.3px]">Claimly</div>
            <div className="text-xs leading-4 text-secondary">Kaveri Infotech Pvt. Ltd.</div>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-rule bg-sheet p-7">
          <div>
            <h1 className="m-0 text-xl font-semibold leading-7">Log in to Claimly</h1>
            <p className="m-0 mt-1 text-secondary">Use your work email to submit and track expense claims.</p>
          </div>
          {error && (
            <p role="alert" className="m-0 rounded-[var(--radius-control)] border border-danger-line bg-danger-wash px-3 py-2 text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <section aria-labelledby="practice" className="rounded-[var(--radius-panel)] border border-rule bg-sheet px-5 py-4 text-[13px] leading-[18px]">
          <h2 id="practice" className="m-0 mb-2 text-sm font-semibold">
            Practice accounts
          </h2>
          <p className="m-0 mb-2 text-secondary">
            Every account uses the password <code className="rounded bg-paper px-1">Claimly@2026</code>.
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {PRACTICE_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex justify-between gap-3">
                <span>{account.email}</span>
                <span className="text-secondary">{account.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
