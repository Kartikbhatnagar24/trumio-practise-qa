import { useState } from "react";

import { approve } from "@/actions/approvals-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Claim } from "@/constraints/types/claim-types";
import { useApprovalsStore } from "@/stores/approvals-store";
import { rupees } from "@/utils/format-utils";

interface ApproveDialogProps {
  claim: Claim;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
}

export function ApproveDialog({ claim, open, title, onOpenChange }: ApproveDialogProps) {
  const isActing = useApprovalsStore((state) => state.isActing);
  const ceiling = claim.approvedAmountInr ?? claim.amountInr;
  const [amount, setAmount] = useState(ceiling);
  const [comment, setComment] = useState("");
  const partial = Number(amount) < Number(ceiling);

  const onConfirm = async () => {
    const done = await approve(claim.id, amount === ceiling ? null : amount, comment.trim() || null);
    if (done) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="approve-description">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription id="approve-description">
          CLM-{claim.id} from {claim.employee.name}, claimed {rupees(claim.amountInr)}.
        </DialogDescription>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approved-amount">Amount to approve (₹)</Label>
            <Input id="approved-amount" inputMode="decimal" className="text-right tabular-nums" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <span className="text-xs leading-4 text-secondary">Lower it to approve part of the claim.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approve-comment">Comment {partial ? "" : <span className="font-normal text-secondary">(optional)</span>}</Label>
            <Textarea id="approve-comment" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={partial ? "Say what is not covered" : ""} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={onConfirm} disabled={isActing}>
            {partial ? "Approve part" : "Approve"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
