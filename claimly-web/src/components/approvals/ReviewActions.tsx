import { useState } from "react";

import { markPaid, reject, sendBack } from "@/actions/approvals-actions";
import { ApproveDialog } from "@/components/approvals/ApproveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClaimStatus, Role } from "@/constraints/enums/claim-enums";
import { Claim, User } from "@/constraints/types/claim-types";
import { useApprovalsStore } from "@/stores/approvals-store";

export function ReviewActions({ claim, user, approvalLimit }: { claim: Claim; user: User; approvalLimit: number }) {
  const isActing = useApprovalsStore((state) => state.isActing);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const isManagerStep = user.role === Role.MANAGER && claim.status === ClaimStatus.SUBMITTED && claim.employee.id !== user.id;
  const isFinanceStep = user.role === Role.FINANCE_ADMIN && (claim.status === ClaimStatus.MANAGER_APPROVED || claim.status === ClaimStatus.FINANCE_APPROVED);
  if (!isManagerStep && !isFinanceStep) return null;

  const needsFinance = claim.status === ClaimStatus.MANAGER_APPROVED && Number(claim.approvedAmountInr) > approvalLimit;
  const canPay = isFinanceStep && !needsFinance;
  const canApprove = isManagerStep || needsFinance;
  const canSendBack = isManagerStep || claim.status === ClaimStatus.MANAGER_APPROVED;

  const withComment = async (run: (text: string) => Promise<boolean>) => {
    if (!comment.trim()) {
      setError(`Add a comment for ${claim.employee.name.split(" ")[0]}.`);
      return;
    }
    setError(null);
    if (await run(comment.trim())) setComment("");
  };

  return (
    <footer className="flex flex-wrap items-end gap-3 border-t border-rule bg-sheet-soft px-8 py-4">
      {canSendBack && (
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
          <label htmlFor="review-comment" className="text-xs leading-4 text-secondary">
            Comment for {claim.employee.name.split(" ")[0]} (needed to send back or reject)
          </label>
          <Input id="review-comment" value={comment} aria-invalid={!!error} aria-describedby={error ? "review-error" : undefined} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" />
          {error && (
            <span id="review-error" className="text-[13px] text-danger">
              {error}
            </span>
          )}
        </div>
      )}
      <div className="ml-auto flex gap-2.5">
        {canSendBack && (
          <>
            <Button variant="danger" disabled={isActing} onClick={() => withComment((text) => reject(claim.id, text))}>
              Reject
            </Button>
            <Button variant="secondary" disabled={isActing} onClick={() => withComment((text) => sendBack(claim.id, text))}>
              Send back
            </Button>
          </>
        )}
        {canApprove && (
          <Button disabled={isActing} onClick={() => setApproving(true)}>
            {isManagerStep ? "Approve" : "Approve for payment"}
          </Button>
        )}
        {canPay && (
          <Button disabled={isActing} onClick={() => markPaid(claim.id)}>
            Mark paid
          </Button>
        )}
      </div>
      {approving && <ApproveDialog claim={claim} open={approving} onOpenChange={setApproving} title={isManagerStep ? "Approve claim" : "Approve for payment"} />}
    </footer>
  );
}
