import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
      style={{}}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border-gray-500 border-opacity-25 border-[1px] bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-gray-500 focus:border-opacity-50",
        className
      )}
      ref={ref}
      {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
