"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4.5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white transition-all outline-none group-has-disabled/field:opacity-50 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white hover:border-slate-400",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-transform duration-100 ease-out data-open:scale-100 data-closed:scale-0 [&>svg]:size-3.5"
      >
        <CheckIcon className="stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
