import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white shadow-xs [a]:hover:bg-blue-700",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 [a]:hover:bg-slate-200",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 [a]:hover:bg-rose-100",
        outline:
          "border-slate-200 bg-white text-slate-700 [a]:hover:bg-slate-50",
        ghost:
          "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        link: "border-transparent text-blue-600 underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
