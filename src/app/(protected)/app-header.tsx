"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Menu as MenuIcon, Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Brand } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AppSection =
  | "dashboard"
  | "income"
  | "expenses"
  | "categories"
  | "settings";

const navigation = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard", index: "01" },
  { href: "/income", label: "Income", section: "income", index: "02" },
  { href: "/expenses", label: "Expenses", section: "expenses", index: "03" },
  {
    href: "/categories",
    label: "Categories",
    section: "categories",
    index: "04",
  },
] as const;

/**
 * Shared header for the authenticated app. Keeps the wordmark, primary nav,
 * signed-in account menu consistent across every protected page and
 * responsive down to small screens.
 */
export function AppHeader({
  email,
  active,
}: {
  email: string;
  active?: AppSection;
}) {
  return (
    <header className="border-border/90 bg-background/92 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:px-6 md:flex-nowrap lg:px-8">
        <Link
          href="/dashboard"
          className="focus-visible:ring-ring focus-visible:ring-offset-background mr-auto flex min-h-11 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Brand />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="bg-paper-deep/80 order-3 flex w-full items-center rounded-xl border border-transparent p-1 md:order-none md:w-auto"
        >
          {navigation.map((item) => {
            const current = active === item.section;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring focus-visible:ring-offset-background flex h-9 min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-semibold transition-[color,background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 md:flex-none",
                  current
                    ? "bg-card text-foreground shadow-[0_1px_0_var(--field-shadow),0_2px_8px_var(--field-shadow)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className="font-data hidden text-[0.5625rem] tracking-[-0.03em] opacity-45 lg:inline"
                >
                  {item.index}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label={`Account menu for ${email}`}
            openOnHover
            closeDelay={100}
            className={cn(
              "focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-start sm:px-3",
              active === "settings"
                ? "bg-paper-deep text-foreground"
                : "hover:bg-paper-deep/70",
            )}
          >
            <MenuIcon aria-hidden="true" className="size-5 sm:hidden" />
            <span
              aria-hidden="true"
              className="bg-accent text-accent-foreground hidden size-8 shrink-0 place-items-center rounded-full font-mono text-[0.625rem] font-bold uppercase sm:grid"
            >
              {email.slice(0, 2)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="text-muted-foreground block text-[0.625rem] leading-none font-semibold tracking-[0.08em] uppercase">
                Signed in
              </span>
              <span className="mt-1 block max-w-[10ch] truncate text-xs font-medium lg:max-w-[15ch]">
                {email}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground hidden size-3.5 sm:block"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1.5">
            <DropdownMenuItem
              render={<Link href="/settings" />}
              aria-current={active === "settings" ? "page" : undefined}
              className="min-h-10 cursor-pointer gap-2 px-2.5 py-2 font-medium"
            >
              <Settings aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <form action={signOut}>
              <DropdownMenuItem
                render={<button type="submit" />}
                nativeButton
                className="min-h-10 w-full cursor-pointer gap-2 px-2.5 py-2 font-medium"
              >
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
