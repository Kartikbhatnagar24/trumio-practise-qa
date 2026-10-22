import { useState } from "react";

import { ChevronIcon } from "@/components/common/icons";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { fieldClass, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Category } from "@/constraints/enums/claim-enums";
import { CategoryPicker } from "@/constraints/enums/variant-enums";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/utils/format-utils";

interface CategoryFieldProps {
  picker: CategoryPicker;
  value: Category | "";
  error?: string;
  onChange: (value: Category) => void;
}

const OPTIONS = Object.values(Category);

export function CategoryField({ picker, value, error, onChange }: CategoryFieldProps) {
  const [open, setOpen] = useState(false);
  const errorId = "category-error";
  const described = error ? errorId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {picker === CategoryPicker.SELECT && (
        <>
          <Label htmlFor="category">Category</Label>
          <NativeSelect id="category" value={value} aria-invalid={!!error} aria-describedby={described} onChange={(event) => onChange(event.target.value as Category)}>
            <option value="" disabled>
              Choose a category
            </option>
            {OPTIONS.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </NativeSelect>
        </>
      )}
      {picker === CategoryPicker.RADIO && (
        <fieldset className="m-0 border-0 p-0" aria-describedby={described}>
          <legend className="mb-2 p-0 font-medium">Category</legend>
          <RadioGroup value={value} onValueChange={(next) => onChange(next as Category)} className="grid-cols-2 gap-x-4">
            {OPTIONS.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2">
                <RadioGroupItem value={option} aria-label={CATEGORY_LABELS[option]} />
                {CATEGORY_LABELS[option]}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      )}
      {picker === CategoryPicker.COMBOBOX && (
        <>
          <Label htmlFor="category">Category</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                id="category"
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-invalid={!!error}
                aria-describedby={described}
                className={cn(fieldClass, "flex cursor-pointer items-center justify-between text-left")}
              >
                <span className={value ? "" : "text-muted"}>{value ? CATEGORY_LABELS[value] : "Search categories"}</span>
                <ChevronIcon className="text-secondary" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Type to search" aria-label="Search categories" />
                <CommandList>
                  <CommandEmpty className="px-3 py-2 text-secondary">No category matches.</CommandEmpty>
                  {OPTIONS.map((option) => (
                    <CommandItem
                      key={option}
                      value={CATEGORY_LABELS[option]}
                      onSelect={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                    >
                      {CATEGORY_LABELS[option]}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </>
      )}
      {error && (
        <span id={errorId} className="text-[13px] leading-[18px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
