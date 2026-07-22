import type { Metadata } from "next";
import { requireUser } from "@/features/auth/session";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Your name appears on forms you share, so respondents know who's asking.
      </p>

      <Card className="mt-8 p-6">
        <SettingsForm initialName={user.name ?? ""} email={user.email} />
      </Card>
    </div>
  );
}
