import { hasUiBug } from "@/configs/env";
import { UiBug } from "@/constraints/enums/bug-enums";
import { ClaimStatus } from "@/constraints/enums/claim-enums";
import { STATUS_LABELS, STATUS_TONES } from "@/utils/format-utils";

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-2 py-px text-xs font-medium leading-[18px]"
      style={{ color: tone.text, background: tone.wash, border: `1px solid ${tone.text}33` }}
    >
      {status === ClaimStatus.SENT_BACK && hasUiBug(UiBug.SENT_BACK_AS_REJECTED) ? STATUS_LABELS[ClaimStatus.REJECTED] : STATUS_LABELS[status]}
    </span>
  );
}
