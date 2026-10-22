import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-2 [--rdp-accent-color:var(--color-brand)] [--rdp-accent-background-color:var(--color-brand-wash)] [--rdp-day_button-height:36px] [--rdp-day_button-width:36px]", className)}
      {...props}
    />
  );
}
