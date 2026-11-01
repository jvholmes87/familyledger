import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="border-foreground/20 bg-foreground text-background relative grid size-8 place-items-center overflow-hidden rounded-[0.45rem] border font-mono text-[0.625rem] font-bold tracking-[-0.08em]"
      >
        SW
        <span className="bg-primary-foreground/50 absolute inset-x-1.5 bottom-1 h-px" />
      </span>
      <span className="font-heading text-xl leading-none font-semibold tracking-[-0.04em]">
        SpendWise
      </span>
    </span>
  );
}
