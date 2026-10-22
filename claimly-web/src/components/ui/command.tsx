import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";

export const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, React.ComponentPropsWithoutRef<typeof CommandPrimitive>>(({ className, ...props }, ref) => (
  <CommandPrimitive ref={ref} className={cn("flex flex-col", className)} {...props} />
));
Command.displayName = "Command";

export const CommandInput = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Input>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>>(
  ({ className, ...props }, ref) => <CommandPrimitive.Input ref={ref} className={cn("h-9 w-full border-0 border-b border-rule-soft bg-transparent px-2 outline-none", className)} {...props} />,
);
CommandInput.displayName = "CommandInput";

export const CommandList = React.forwardRef<React.ElementRef<typeof CommandPrimitive.List>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn("max-h-64 overflow-y-auto p-1", className)} {...props} />
));
CommandList.displayName = "CommandList";

export const CommandEmpty = CommandPrimitive.Empty;

export const CommandItem = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Item>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn("flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 data-[selected=true]:bg-brand-wash", className)}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";
