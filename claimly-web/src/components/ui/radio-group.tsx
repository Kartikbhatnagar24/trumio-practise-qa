import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";

export const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(
  ({ className, ...props }, ref) => <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />,
);
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <RadioGroupPrimitive.Item ref={ref} className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border border-field bg-sheet data-[state=checked]:border-brand", className)} {...props}>
      <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-brand" />
    </RadioGroupPrimitive.Item>
  ),
);
RadioGroupItem.displayName = "RadioGroupItem";
