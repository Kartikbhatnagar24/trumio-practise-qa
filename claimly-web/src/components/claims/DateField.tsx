import { useState } from "react";
import { parse } from "date-fns";

import { CalendarIcon } from "@/components/common/icons";
import { Calendar } from "@/components/ui/calendar";
import { fieldClass, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateInput } from "@/constraints/enums/variant-enums";
import { cn } from "@/lib/utils";
import { fromTyped, toIsoDate, toTyped } from "@/utils/date-utils";
import { shortDate } from "@/utils/format-utils";

interface DateFieldProps {
  input: DateInput;
  value: string;
  error?: string;
  onChange: (iso: string) => void;
}

export function DateField({ input, value, error, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(toTyped(value));
  const described = error ? "date-error" : "date-hint";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="expense-date">Expense date</Label>
      {input === DateInput.CALENDAR ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button id="expense-date" type="button" aria-invalid={!!error} aria-describedby={described} className={cn(fieldClass, "flex cursor-pointer items-center justify-between text-left")}>
              <span className={value ? "" : "text-muted"}>{value ? shortDate(value) : "Pick a date"}</span>
              <CalendarIcon className="text-secondary" />
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={value ? parse(value, "yyyy-MM-dd", new Date()) : undefined}
              defaultMonth={value ? parse(value, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(date) => {
                if (date) onChange(toIsoDate(date));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Input
          id="expense-date"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={typed}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(event) => {
            setTyped(event.target.value);
            onChange(fromTyped(event.target.value) ?? "");
          }}
        />
      )}
      {error ? (
        <span id="date-error" className="text-[13px] leading-[18px] text-danger">
          {error}
        </span>
      ) : (
        <span id="date-hint" className="text-xs leading-4 text-secondary">
          {input === DateInput.TYPED ? "Day, month, year, like 05/06/2026." : "The day you paid."}
        </span>
      )}
    </div>
  );
}
