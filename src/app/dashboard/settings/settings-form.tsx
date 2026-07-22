"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/features/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { IconCheck } from "@/components/icons";

export function SettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  // Tracks the last persisted value so the button re-disables after a save.
  const [savedName, setSavedName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const unchanged = name.trim() === savedName.trim() || !name.trim();

  const save = () => {
    if (unchanged) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction({ name: name.trim() });
      if (result.ok) {
        setSavedName(name);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <Field label="Email">
        <Input value={email} disabled />
      </Field>
      <Field label="Display name" error={error ?? undefined}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Priya from Engineering"
          maxLength={80}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} disabled={unchanged}>
          Save changes
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ever">
            <IconCheck size={15} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
