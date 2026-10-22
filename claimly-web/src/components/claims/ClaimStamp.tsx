import { ClaimStatus } from "@/constraints/enums/claim-enums";
import { Claim } from "@/constraints/types/claim-types";
import { shortDate } from "@/utils/format-utils";

const STAMPS: Record<ClaimStatus, { word: string; by: string; color: string }> = {
  [ClaimStatus.DRAFT]: { word: "DRAFT", by: "NOT SUBMITTED", color: "#5F6670" },
  [ClaimStatus.SUBMITTED]: { word: "SUBMITTED", by: "WAITING FOR MANAGER", color: "#2C5A9E" },
  [ClaimStatus.SENT_BACK]: { word: "SENT BACK", by: "NEEDS CHANGES", color: "#9A5B13" },
  [ClaimStatus.MANAGER_APPROVED]: { word: "APPROVED", by: "BY MANAGER", color: "#5B3F8C" },
  [ClaimStatus.FINANCE_APPROVED]: { word: "APPROVED", by: "BY FINANCE", color: "#5B3F8C" },
  [ClaimStatus.PAID]: { word: "PAID", by: "WITH SALARY", color: "#1E5A46" },
  [ClaimStatus.REJECTED]: { word: "REJECTED", by: "CLOSED", color: "#B3261E" },
};

export function ClaimStamp({ claim }: { claim: Claim }) {
  const stamp = STAMPS[claim.status];
  const last = claim.events[claim.events.length - 1];
  const when = last ? `, ${shortDate(last.at).toUpperCase()}` : "";
  return (
    <div
      key={claim.status}
      role="img"
      aria-label={`Status: ${stamp.word.toLowerCase()}`}
      className="mt-1.5 mr-2 self-start rounded border-[3px] border-double px-4 pt-1.5 pb-[5px] text-center font-semibold opacity-[0.88] [animation:stamp-press_160ms_ease-out] [transform:rotate(-4deg)]"
      style={{ color: stamp.color, borderColor: stamp.color }}
    >
      <div className="text-xl leading-6 tracking-[3px]">{stamp.word}</div>
      <div className="text-[11px] leading-[14px] font-medium tracking-[1px]">
        {stamp.by}
        {when}
      </div>
    </div>
  );
}
