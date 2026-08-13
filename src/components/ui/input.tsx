import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-colors outline-none " +
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700 " +
          "placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 " +
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50 " +
          "aria-invalid:border-rose-500 aria-invalid:ring-2 aria-invalid:ring-rose-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
