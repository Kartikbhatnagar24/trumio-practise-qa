import { ClaimEvent } from "@/constraints/types/claim-types";
import { dateTime, rupees, STATUS_TONES } from "@/utils/format-utils";

const describe = (event: ClaimEvent): string => {
  switch (event.action) {
    case "submit":
      return `Submitted by ${event.actor.name}`;
    case "approve":
      return `Approved ${rupees(event.amountInr)} by ${event.actor.name}`;
    case "send_back":
      return `Sent back by ${event.actor.name}`;
    case "reject":
      return `Rejected by ${event.actor.name}`;
    case "pay":
      return `Marked paid ${rupees(event.amountInr)} by ${event.actor.name}`;
    default:
      return `${event.action} by ${event.actor.name}`;
  }
};

export function AuditTrail({ events, createdAt, owner }: { events: ClaimEvent[]; createdAt: string; owner: string }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      <li className="grid grid-cols-[16px_minmax(0,1fr)_auto] gap-x-3 py-2">
        <span aria-hidden="true" className="mt-1.5 size-[9px] rounded-full bg-[#5F6670]" />
        <span>Draft created by {owner}</span>
        <span className="tabular-nums text-secondary">{dateTime(createdAt)}</span>
      </li>
      {events.map((event, index) => (
        <li key={index} className="grid grid-cols-[16px_minmax(0,1fr)_auto] gap-x-3 py-2">
          <span aria-hidden="true" className="mt-1.5 size-[9px] rounded-full" style={{ background: STATUS_TONES[event.toStatus].text }} />
          <span>
            {describe(event)}
            {event.comment && (
              <>
                <br />
                <span className="text-secondary">“{event.comment}”</span>
              </>
            )}
          </span>
          <span className="tabular-nums text-secondary">{dateTime(event.at)}</span>
        </li>
      ))}
    </ol>
  );
}
