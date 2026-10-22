import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover",
        secondary: "border border-field bg-sheet text-ink hover:bg-paper",
        danger: "border border-danger-line bg-sheet text-danger hover:bg-danger-wash",
        warn: "border border-warn bg-sheet text-warn-ink hover:bg-warn-wash",
        ghost: "bg-transparent text-brand hover:bg-brand-wash",
      },
      size: {
        md: "min-h-10 px-4",
        sm: "h-8 px-3 text-[13px]",
        icon: "size-9 border border-rule bg-sheet text-ink",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
