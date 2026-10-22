import * as React from "react";

import { cn } from "@/lib/utils";

export const fieldClass = "h-10 w-full rounded-[var(--radius-control)] border border-field bg-sheet px-2.5 text-ink placeholder:text-muted aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, "h-auto resize-y py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, "pr-8", className)} {...props} />
));
NativeSelect.displayName = "NativeSelect";
