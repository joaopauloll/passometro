import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-xl border border-slate-200/80 bg-white p-4 text-left text-sm shadow-xs transition-all has-data-[slot=alert-action]:pr-12 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-slate-50/50 border-slate-200 text-slate-800 *:[svg]:text-slate-500",
        info: "bg-blue-50/50 border-blue-200/80 text-blue-900 *:[svg]:text-blue-600",
        success:
          "bg-emerald-50/50 border-emerald-200/80 text-emerald-900 *:[svg]:text-emerald-600",
        warning:
          "bg-amber-50/50 border-amber-200/80 text-amber-900 *:[svg]:text-amber-600",
        destructive:
          "bg-rose-50/50 border-rose-200/80 text-rose-900 *:data-[slot=alert-description]:text-rose-700 *:[svg]:text-rose-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold leading-none tracking-tight group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-blue-600",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs leading-relaxed text-slate-600 text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-slate-900 [&_p:not(:last-child)]:mb-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "absolute top-3 right-3 flex items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
