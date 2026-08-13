import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
        outline:
          "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 aria-expanded:bg-slate-100",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-200 aria-expanded:bg-slate-200",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100",
        destructive:
          "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 focus-visible:ring-rose-500",
        link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default:
          "h-9 min-h-[36px] gap-2 px-3.5 py-2 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 rounded-xl px-4 text-base has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
