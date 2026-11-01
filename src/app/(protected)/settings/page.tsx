import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../app-header";
import { DataSection } from "./data-section";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="settings" />

      <main className="ledger-enter mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8 lg:mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-primary h-px w-8" />
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
              Account / Preferences
            </p>
          </div>
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
            Settings
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
            Manage your account preferences and portable SpendWise data.
          </p>
        </div>

        <DataSection />
      </main>
    </div>
  );
}
