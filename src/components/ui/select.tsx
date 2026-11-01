import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        data-slot="select"
        className={cn(
          "border-input bg-paper-raised text-foreground focus-visible:border-ring focus-visible:ring-ring disabled:bg-input/50 h-11 w-full appearance-none rounded-lg border px-3.5 py-2 pr-10 text-base shadow-[inset_0_1px_1px_var(--field-shadow)] transition-[border-color,box-shadow,background-color] duration-200 outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </span>
  );
}

export { Select };
