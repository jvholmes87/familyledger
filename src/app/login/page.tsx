import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="bg-primary text-primary-foreground relative hidden min-h-svh overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden="true"
          className="border-primary-foreground/12 absolute inset-y-0 left-[18%] w-px border-l"
        />
        <div
          aria-hidden="true"
          className="border-primary-foreground/12 absolute inset-y-0 right-[18%] w-px border-r"
        />
        <div
          aria-hidden="true"
          className="font-heading text-primary-foreground/[0.035] pointer-events-none absolute -right-10 bottom-10 text-[24rem] leading-none font-bold tracking-[-0.1em]"
        >
          S
        </div>

        <Link
          href="/"
          className="focus-visible:ring-primary-foreground focus-visible:ring-offset-primary relative z-10 w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="SpendWise home"
        >
          <Brand />
        </Link>

        <div className="relative z-10 max-w-xl py-16">
          <p className="font-data text-primary-foreground/75 mb-6 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
            Private ledger / Member access
          </p>
          <h2 className="font-heading text-5xl leading-[0.96] font-semibold tracking-[-0.055em] text-balance xl:text-7xl">
            A quieter way to understand what you spend.
          </h2>
          <p className="text-primary-foreground/78 mt-7 max-w-md text-lg leading-relaxed">
            No noisy charts. No financial theater. Just your entries, organized
            clearly and kept behind your account.
          </p>

          <div className="border-primary-foreground/18 mt-10 grid grid-cols-3 border-t pt-5">
            {[
              ["01", "Log"],
              ["02", "Organize"],
              ["03", "Understand"],
            ].map(([number, label]) => (
              <div key={number}>
                <p className="font-data text-primary-foreground/70 text-[0.625rem]">
                  {number}
                </p>
                <p className="mt-1 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-primary-foreground/70 relative z-10 flex items-center justify-between text-[0.6875rem]">
          <span>SpendWise · 2026</span>
          <span className="font-data tracking-[0.1em] uppercase">
            Secure access
          </span>
        </div>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="absolute inset-x-5 top-5 flex items-center justify-between lg:hidden">
          <Link
            href="/"
            className="focus-visible:ring-ring focus-visible:ring-offset-background rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="SpendWise home"
          >
            <Brand />
          </Link>
          <span className="font-data text-muted-foreground text-[0.625rem] tracking-[0.12em] uppercase">
            Member access
          </span>
        </div>

        <div className="ledger-enter w-full max-w-md pt-16 lg:pt-0">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-8 hidden w-fit items-center gap-2 text-xs font-semibold transition-colors lg:flex"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Back to home
          </Link>
          <Card className="shadow-ledger-float border-border-strong/35 rounded-[1.5rem]">
            <CardHeader className="px-6 pt-7 text-left sm:px-8 sm:pt-8">
              <p className="font-data text-primary text-[0.625rem] font-bold tracking-[0.15em] uppercase">
                Account access / 01
              </p>
              <h1 className="font-heading mt-3 text-4xl leading-none font-semibold tracking-[-0.05em]">
                Welcome.
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Sign in to your ledger or create a new account.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-2 sm:px-8">
              <AuthForm />
            </CardContent>
          </Card>

          <p className="text-muted-foreground mt-6 text-center text-xs leading-relaxed">
            Your account keeps every ledger entry private to you.
          </p>
        </div>
      </section>
    </main>
  );
}
