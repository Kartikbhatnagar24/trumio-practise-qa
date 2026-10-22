import { ClaimStatus } from "@/constraints/enums/claim-enums";
import { STATUS_LABELS, STATUS_TONES } from "@/utils/format-utils";

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-2 py-px text-xs font-medium leading-[18px]"
      style={{ color: tone.text, background: tone.wash, border: `1px solid ${tone.text}33` }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
