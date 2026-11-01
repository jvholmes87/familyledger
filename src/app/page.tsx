import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { LedgerPreview } from "@/components/ledger-preview";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="font-heading text-foreground/[0.025] pointer-events-none absolute top-10 left-1/2 -z-10 -translate-x-1/2 text-[34vw] leading-none font-bold tracking-[-0.1em] select-none"
      >
        SW
      </div>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
        <Brand />
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "min-h-11",
          })}
        >
          Sign in
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.87fr_1.13fr] lg:gap-16 lg:px-10 lg:py-20">
        <div className="ledger-enter max-w-2xl">
          <div className="mb-7 flex items-center gap-3">
            <span className="bg-primary h-px w-10" />
            <p className="font-data text-primary text-[0.6875rem] font-semibold tracking-[0.15em] uppercase">
              Personal ledger · Est. 2026
            </p>
          </div>
          <h1 className="font-heading text-[clamp(3.5rem,7.2vw,6.8rem)] leading-[0.88] font-semibold tracking-[-0.068em] text-balance">
            Know where your money went.
            <span className="text-primary block">Keep what matters.</span>
          </h1>
          <p className="text-ink-soft mt-8 max-w-xl text-lg leading-relaxed text-pretty sm:text-xl">
            A considered place to log everyday expenses, organize the details,
            and understand your spending without the noise.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Get started
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Sign in
            </Link>
          </div>

          <dl className="border-border mt-12 grid max-w-xl grid-cols-3 border-t pt-5">
            {[
              ["Entry", "Fast entry"],
              ["Order", "Clear categories"],
              ["Privacy", "Private by default"],
            ].map(([coordinate, label]) => (
              <div key={coordinate} className="min-w-0 pr-3">
                <dt className="font-data text-muted-foreground text-[0.625rem] tracking-[0.12em] uppercase">
                  {coordinate}
                </dt>
                <dd className="mt-1.5 text-xs font-semibold sm:text-sm">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <LedgerPreview />
      </section>

      <footer className="text-muted-foreground mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-6 text-[0.6875rem] sm:px-8 lg:px-10">
        <span>Built for UMGC CMSC 495 · 2026</span>
        <span className="font-data hidden tracking-[0.1em] uppercase sm:inline">
          Clear books · Clear mind
        </span>
      </footer>
    </main>
  );
}
